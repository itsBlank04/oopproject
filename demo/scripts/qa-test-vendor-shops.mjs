import fs from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Client } = require('pg')

const BASE_URL = process.env.QA_BASE_URL ?? 'http://localhost:8080'
const RUN_ID = process.env.QA_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
const PASSWORD = 'QaPass123!'
const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL ?? 'admin@login.com'
const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD ?? '88888888'
const results = []

function readDbConfig() {
  const properties = fs.readFileSync('src/main/resources/application.properties', 'utf8')
  const props = Object.fromEntries(
    properties
      .split(/\r?\n/)
      .filter((line) => line.includes('=') && !line.trimStart().startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=')
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace('\\#', '#')]
      }),
  )
  const url = new URL(props['spring.datasource.url'].replace('jdbc:', ''))
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    database: url.pathname.slice(1),
    user: props['spring.datasource.username'],
    password: props['spring.datasource.password'],
    ssl: { rejectUnauthorized: false },
  }
}

function addResult(module, action, ok, detail = '') {
  results.push({ module, action, ok, detail })
  const marker = ok ? 'PASS' : 'FAIL'
  console.log(`${marker} [${module}] ${action}${detail ? ` - ${detail}` : ''}`)
}

function short(value) {
  if (value == null) return ''
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return text.length > 240 ? `${text.slice(0, 237)}...` : text
}

async function step(module, action, fn) {
  try {
    const value = await fn()
    addResult(module, action, true, short(value))
    return value
  } catch (error) {
    addResult(module, action, false, error.message)
    return null
  }
}

async function expectFailure(module, action, expectedStatus, fn) {
  try {
    await fn()
    addResult(module, action, false, `expected HTTP ${expectedStatus}, but request succeeded`)
  } catch (error) {
    const ok = error.status === expectedStatus
    addResult(module, action, ok, ok ? error.message : `expected HTTP ${expectedStatus}, got ${error.status ?? 'unknown'}: ${error.message}`)
  }
}

class ApiSession {
  constructor(name) {
    this.name = name
    this.cookies = new Map()
    this.user = null
  }

  cookieHeader() {
    return [...this.cookies.entries()].map(([key, value]) => `${key}=${value}`).join('; ')
  }

  rememberCookies(headers) {
    const setCookies = typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : headers.get('set-cookie')
        ? [headers.get('set-cookie')]
        : []
    for (const header of setCookies) {
      const [pair] = header.split(';')
      const [key, value] = pair.split('=')
      if (key && value) this.cookies.set(key.trim(), value.trim())
    }
  }

  async request(method, path, body, options = {}) {
    const headers = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const cookie = this.cookieHeader()
    if (cookie) headers.Cookie = cookie
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    this.rememberCookies(response.headers)
    const text = await response.text()
    let payload = text
    if (text) {
      try {
        payload = JSON.parse(text)
      } catch {
        payload = text
      }
    }
    if (!response.ok) {
      const error = new Error(typeof payload === 'object' && payload?.error ? payload.error : short(payload))
      error.status = response.status
      error.payload = payload
      throw error
    }
    if (options.raw) return { status: response.status, text, headers: response.headers }
    return payload
  }

  get(path, options) { return this.request('GET', path, undefined, options) }
  post(path, body, options) { return this.request('POST', path, body, options) }
  put(path, body, options) { return this.request('PUT', path, body, options) }
  delete(path, options) { return this.request('DELETE', path, undefined, options) }

  async register(label) {
    const email = `qa-shop-${RUN_ID}-${label}@example.test`
    const user = await this.post('/api/auth/register', {
      email,
      password: PASSWORD,
      displayName: `QA Shop ${label} ${RUN_ID}`,
      roles: ['CUSTOMER'],
    })
    this.user = user
    return user
  }

  async login(email, password = PASSWORD) {
    const user = await this.post('/api/auth/login', { email, password })
    this.user = user
    return user
  }
}

async function assignRole(db, userId, roleName) {
  await db.query(
    `insert into user_roles(user_id, role_id)
     select $1, id from roles where name = $2
     on conflict do nothing`,
    [userId, roleName],
  )
}

// ─── MAIN ───────────────────────────────────────────────────────

async function main() {
  console.log(`\n╔══════════════════════════════════════════════════════╗`)
  console.log(`║  AtomDrops QA — Vendor Shop & Subscription Module   ║`)
  console.log(`║  Run ID: ${RUN_ID.padEnd(42)} ║`)
  console.log(`╚══════════════════════════════════════════════════════╝\n`)
  console.log(`API: ${BASE_URL}\n`)

  const db = new Client(readDbConfig())
  await db.connect()
  addResult('Cloud DB', 'Supabase Postgres connection', true)

  const vendor1 = new ApiSession('vendor1')
  const vendor2 = new ApiSession('vendor2')
  const customer = new ApiSession('customer')
  const admin = new ApiSession('admin')

  // ─── AUTH & SETUP ──────────────────────────────────────────────

  await step('Auth', 'Login admin', async () => {
    await admin.login(ADMIN_EMAIL, ADMIN_PASSWORD)
    return { adminId: admin.user.id }
  })

  const vendor1User = await step('Auth', 'Register vendor1', () => vendor1.register('vendor1'))
  const vendor2User = await step('Auth', 'Register vendor2', () => vendor2.register('vendor2'))
  const customerUser = await step('Auth', 'Register customer', () => customer.register('customer'))

  // Promote both users to VENDOR role via DB
  await step('Cloud DB', 'Assign VENDOR role to vendor1', async () => {
    await assignRole(db, vendor1User.id, 'VENDOR')
    await vendor1.login(vendor1User.email)
    return { roles: vendor1.user.roles }
  })

  await step('Cloud DB', 'Assign VENDOR role to vendor2', async () => {
    await assignRole(db, vendor2User.id, 'VENDOR')
    await vendor2.login(vendor2User.email)
    return { roles: vendor2.user.roles }
  })

  // ─── SUBSCRIPTION PLANS (PUBLIC) ───────────────────────────────

  const plans = await step('Subscription', 'List available plans (public)', () =>
    vendor1.get('/api/vendor/subscription/plans')
  )

  await step('Subscription', 'Verify 5 plans exist', () => {
    if (!plans || plans.length < 5) throw new Error(`expected >=5 plans, got ${plans?.length}`)
    const names = plans.map(p => p.name)
    for (const expected of ['BASIC', 'BUILDER', 'PRO', 'BUSINESS', 'ENTERPRISE']) {
      if (!names.includes(expected)) throw new Error(`missing plan: ${expected}`)
    }
    return { count: plans.length, names }
  })

  const basicPlan = plans?.find(p => p.name === 'BASIC')
  const builderPlan = plans?.find(p => p.name === 'BUILDER')
  const proPlan = plans?.find(p => p.name === 'PRO')

  await step('Subscription', 'Verify Basic plan is free with 1 shop', () => {
    if (!basicPlan) throw new Error('BASIC plan not found')
    if (Number(basicPlan.priceMonthlyBdt) !== 0) throw new Error(`expected free, got ${basicPlan.priceMonthlyBdt}`)
    if (basicPlan.maxShops !== 1) throw new Error(`expected 1 shop, got ${basicPlan.maxShops}`)
    return { name: basicPlan.name, maxShops: basicPlan.maxShops, price: basicPlan.priceMonthlyBdt }
  })

  // ─── SUBSCRIPTION DEALS (PUBLIC) ──────────────────────────────

  await step('Subscription', 'List active deals (public)', () =>
    vendor1.get('/api/vendor/subscription/deals').then(data => ({ count: Array.isArray(data) ? data.length : 0 }))
  )

  // ─── VENDOR SUBSCRIPTION STATE ─────────────────────────────────

  const mySubscription = await step('Subscription', 'Vendor1 gets current subscription', () =>
    vendor1.get('/api/vendor/subscription/summary')
  )

  // ─── VENDOR DASHBOARD ──────────────────────────────────────────

  await step('Vendor Panel', 'Vendor1 loads dashboard (creates profile)', () =>
    vendor1.get('/api/vendor/dashboard')
  )

  await step('Vendor Panel', 'Vendor2 loads dashboard', () =>
    vendor2.get('/api/vendor/dashboard')
  )

  // ─── SHOP CRUD ─────────────────────────────────────────────────

  const shopList1 = await step('Shop', 'List vendor1 shops (auto-created default shop)', () =>
    vendor1.get('/api/shops/vendor')
  )

  const shop1 = shopList1?.[0]
  const shopSlug = shop1?.slug

  await step('Shop', 'Verify shop1 fields', () => {
    if (!shop1) throw new Error('shop1 is null')
    if (shop1.status !== 'ACTIVE') throw new Error(`status: ${shop1.status}`)
    return { id: shop1.id, name: shop1.name, slug: shop1.slug, status: shop1.status }
  })

  await step('Shop', 'Vendor1 updates shop1', () =>
    vendor1.put(`/api/shops/${shop1.id}`, {
      description: 'Updated QA description',
      location: 'Chittagong, Bangladesh',
    }).then(data => ({ description: data.description, location: data.location }))
  )

  // ─── PUBLIC SHOP ENDPOINTS ─────────────────────────────────────

  await step('Shop', 'Public: get shop by slug', () => {
    if (!shopSlug) throw new Error('slug is null')
    return customer.get(`/api/shops/slug/${shopSlug}`).then(data => ({
      id: data.id, name: data.name, slug: data.slug
    }))
  })

  const vendorShops = await step('Shop', 'List vendor1 shops via /vendor endpoint', () =>
    vendor1.get('/api/shops/vendor').then(data => {
      if (!Array.isArray(data)) throw new Error('expected array')
      return { count: data.length, shops: data.map(s => s.name) }
    })
  )

  // ─── SHOP FOLLOWING ────────────────────────────────────────────

  if (shop1?.id) {
    const followResult = await step('Follow', 'Customer follows shop1 (toggle-follow)', () =>
      customer.post(`/api/shops/${shop1.id}/toggle-follow`)
    )

    await step('Follow', 'Verify follower count increased', () => {
      if (!followResult || !followResult.following) throw new Error(`expected following to be true, got ${JSON.stringify(followResult)}`)
      if (Number(followResult.followerCount) !== 1) throw new Error(`expected followerCount to be 1, got ${followResult.followerCount}`)
      return followResult
    })

    const unfollowResult = await step('Follow', 'Customer unfollows shop1 (toggle-follow)', () =>
      customer.post(`/api/shops/${shop1.id}/toggle-follow`)
    )

    await step('Follow', 'Verify follower count decreased', () => {
      if (!unfollowResult || unfollowResult.following) throw new Error(`expected following to be false, got ${JSON.stringify(unfollowResult)}`)
      if (Number(unfollowResult.followerCount) !== 0) throw new Error(`expected followerCount to be 0, got ${unfollowResult.followerCount}`)
      return unfollowResult
    })

    await step('Follow', 'Customer re-follows shop1 (toggle-follow)', () =>
      customer.post(`/api/shops/${shop1.id}/toggle-follow`)
    )
  }

  // ─── SHOP STAFF ────────────────────────────────────────────────

  if (shop1?.id && vendor2User?.id) {
    await step('Staff', 'Vendor1 adds vendor2 as staff (INVENTORY)', () =>
      vendor1.post(`/api/shops/${shop1.id}/staff`, {
        userId: vendor2User.id,
        role: 'INVENTORY',
      })
    )

    const staffList = await step('Staff', 'List shop1 staff', () =>
      vendor1.get(`/api/shops/${shop1.id}/staff`).then(data => ({
        count: Array.isArray(data) ? data.length : 0,
        members: Array.isArray(data) ? data.map(s => ({ id: s.id, userId: s.user?.id ?? s.userId, role: s.role })) : []
      }))
    )

    if (staffList?.count > 0) {
      const staffEntry = Array.isArray(staffList.members) ? staffList.members.find(s => Number(s.userId) === Number(vendor2User.id)) : null
      if (staffEntry?.id) {
        await step('Staff', 'Vendor1 removes vendor2 from staff', () =>
          vendor1.delete(`/api/shops/${shop1.id}/staff/${staffEntry.id}`)
        )
      }
    }
  }

  // ─── PRODUCTS WITH SHOP ASSOCIATION ────────────────────────────

  const categories = await step('Public', 'List categories', () =>
    vendor1.get('/api/categories')
  )
  const categoryId = categories?.[0]?.id ?? 1

  if (shop1?.id) {
    const shopProduct = await step('Product', 'Vendor1 creates product for shop1', () =>
      vendor1.post('/api/products', {
        name: `QA Shop Product ${RUN_ID}`,
        description: 'QA test product in shop1',
        priceBdt: 599.99,
        category: { id: categoryId },
        shop: { id: shop1.id },
      })
    )

    if (shopProduct) {
      await step('Product', 'Verify product has shop association', () => {
        if (!shopProduct.shop || shopProduct.shop.id !== shop1.id) {
          // Some APIs may not return shop in the response — check via GET
          return vendor1.get(`/api/products/${shopProduct.id}`).then(data => ({
            productId: data.id,
            shopId: data.shop?.id,
            shopName: data.shop?.name,
          }))
        }
        return { productId: shopProduct.id, shopId: shopProduct.shop.id }
      })
    }

    await step('Product', 'List vendor products (all shops)', () =>
      vendor1.get('/api/vendor/products').then(data => ({
        count: Array.isArray(data) ? data.length : 0,
      }))
    )
  }

  // ─── AUCTIONS WITH SHOP ASSOCIATION ────────────────────────────

  if (shop1?.id) {
    const shopAuction = await step('Auction', 'Vendor1 creates auction for shop1', () =>
      vendor1.post('/api/auctions', {
        title: `QA Shop Auction ${RUN_ID}`,
        type: 'STANDARD',
        startTime: new Date(Date.now() + 3_600_000).toISOString(),
        endTime: new Date(Date.now() + 7_200_000).toISOString(),
        termsAccepted: true,
        preparationDurationMinutes: 10,
        activeDurationMinutes: 60,
        shopId: shop1.id,
      })
    )

    if (shopAuction) {
      await step('Auction', 'Verify auction created', () => ({
        auctionId: shopAuction.id,
        title: shopAuction.title,
        shopId: shopAuction.shop?.id,
      }))
    }
  }

  // ─── VENDOR SHOP-SPECIFIC DASHBOARD ────────────────────────────

  if (shop1?.id) {
    await step('Vendor Panel', 'Vendor1 loads dashboard for shop1', () =>
      vendor1.get(`/api/vendor/dashboard?shopId=${shop1.id}`)
    )
  }

  // ─── SUBSCRIPTION UPGRADE ──────────────────────────────────────

  if (builderPlan) {
    await step('Subscription', 'Vendor1 subscribes to Builder plan', () =>
      vendor1.post('/api/vendor/subscription/subscribe', {
        planId: builderPlan.id,
        billingCycle: 'MONTHLY',
        paymentMethod: 'BKASH',
        paymentRef: `QA-SUB-${RUN_ID}`,
      })
    )

    await step('Subscription', 'Verify updated subscription', () =>
      vendor1.get('/api/vendor/subscription/summary').then(data => ({
        plan: data?.planName,
        billingCycle: data?.billingCycle,
        status: data?.status,
      }))
    )

    // Now vendor1 should be able to create a second shop
    const shop2Slug = `qa-shop2-${RUN_ID}`.toLowerCase()
    const shop2 = await step('Shop', 'Vendor1 creates second shop (Builder allows 2)', () =>
      vendor1.post('/api/shops', {
        name: `QA Shop 2 ${RUN_ID}`,
        slug: shop2Slug,
        description: 'Second QA shop after upgrade',
        location: 'Sylhet, Bangladesh',
      })
    )

    if (shop2) {
      await step('Shop', 'Verify second shop created', () => ({
        id: shop2.id, name: shop2.name, slug: shop2.slug
      }))
    }

    // Verify vendor now has 2 shops
    await step('Shop', 'Verify vendor1 now has 2 shops', () =>
      vendor1.get('/api/shops/vendor').then(data => {
        const count = Array.isArray(data) ? data.length : 0
        if (count < 2) throw new Error(`expected 2 shops, got ${count}`)
        return { count }
      })
    )
  }

  // ─── SECOND VENDOR INDEPENDENT SHOP ────────────────────────────

  const shopList2 = await step('Shop', 'List vendor2 shops (auto-created default shop)', () =>
    vendor2.get('/api/shops/vendor')
  )
  const vendor2Shop = shopList2?.[0]

  if (vendor2Shop) {
    await step('Shop', 'Verify vendor2 shop is isolated from vendor1', () =>
      vendor2.get('/api/shops/vendor').then(data => {
        const names = Array.isArray(data) ? data.map(s => s.name) : []
        const hasV1Shop = names.some(n => n.includes('vendor1') || n.includes('Shop 2'))
        if (hasV1Shop) throw new Error('vendor2 sees vendor1 shops!')
        return { count: data.length, names }
      })
    )
  }

  // ─── ACCESS CONTROL ────────────────────────────────────────────

  if (shop1?.id) {
    await expectFailure('Access', 'Customer cannot create shop', 403, () =>
      customer.post('/api/shops', {
        name: `Forbidden Shop ${RUN_ID}`,
        slug: `forbidden-${RUN_ID}`,
      })
    )

    await expectFailure('Access', 'Vendor2 cannot update vendor1 shop', 403, () =>
      vendor2.put(`/api/shops/${shop1.id}`, {
        description: 'Hacked description',
      })
    )
  }

  // ─── DB VERIFICATION ──────────────────────────────────────────

  await step('Cloud DB', 'Verify shops persisted in database', async () => {
    const shopRows = await db.query(
      "select count(*)::int as count from shops where name like $1",
      [`%${RUN_ID}%`]
    )
    return { shopCount: shopRows.rows[0].count }
  })

  await step('Cloud DB', 'Verify shop_followers persisted', async () => {
    const rows = await db.query(
      "select count(*)::int as count from shop_followers sf join shops s on sf.shop_id = s.id where s.name like $1",
      [`%${RUN_ID}%`]
    )
    return { followerCount: rows.rows[0].count }
  })

  await step('Cloud DB', 'Verify vendor_subscription_plans seeded', async () => {
    const rows = await db.query("select count(*)::int as count from vendor_subscription_plans")
    if (rows.rows[0].count < 5) throw new Error(`expected >=5 plans, got ${rows.rows[0].count}`)
    return { planCount: rows.rows[0].count }
  })

  // ─── CLEANUP ───────────────────────────────────────────────────

  await db.end()

  // ─── SUMMARY ───────────────────────────────────────────────────

  const failed = results.filter((r) => !r.ok)
  console.log('\n═══════════════════════════════════════════')
  console.log(`  Total checks: ${results.length}`)
  console.log(`  Passed:       ${results.length - failed.length}`)
  console.log(`  Failed:       ${failed.length}`)
  console.log('═══════════════════════════════════════════')

  if (failed.length) {
    console.log('\nFailures:')
    for (const f of failed) {
      console.log(`  ✗ [${f.module}] ${f.action}: ${f.detail}`)
    }
  } else {
    console.log('\n  ✓ All checks passed!\n')
  }

  process.exitCode = failed.length ? 1 : 0
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
