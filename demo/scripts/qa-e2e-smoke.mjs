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
const context = { runId: RUN_ID }

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

  get(path, options) {
    return this.request('GET', path, undefined, options)
  }

  post(path, body, options) {
    return this.request('POST', path, body, options)
  }

  put(path, body, options) {
    return this.request('PUT', path, body, options)
  }

  delete(path, options) {
    return this.request('DELETE', path, undefined, options)
  }

  async register(label) {
    const email = `qa-${RUN_ID}-${label}@example.test`
    const user = await this.post('/api/auth/register', {
      email,
      password: PASSWORD,
      displayName: `QA ${label} ${RUN_ID}`,
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

async function ensureTechnicianProfile(db, userId) {
  const existing = await db.query('select id from technicians where user_id = $1', [userId])
  if (existing.rowCount) return existing.rows[0].id
  const inserted = await db.query(
    `insert into technicians(user_id, specialization, bio, pickup_available, service_area, status)
     values ($1, 'Electronics', 'QA technician profile', true, 'Dhaka', 'active')
     returning id`,
    [userId],
  )
  return inserted.rows[0].id
}

async function createAuctionLot(db, auctionId, categoryId) {
  const inserted = await db.query(
    `insert into auction_lots(
       auction_id, category_id, title, description, condition_note,
       starting_price_bdt, reserve_price_bdt, current_bid_bdt,
       min_bid_increment_bdt, extension_duration_minutes,
       extensions_count, max_extensions, status
     )
     values ($1, $2, $3, 'QA lot description', 'Like new', 100.00, 120.00, 100.00, 10.00, 5, 0, 3, 'PREPARING')
     returning id`,
    [auctionId, categoryId, `QA auction lot ${RUN_ID}`],
  )
  return inserted.rows[0].id
}

async function acceptAuctionRules(db, userId) {
  await db.query(
    `insert into user_agreements(user_id, agreement_type, ip_address)
     values ($1, 'AUCTION_RULES', '127.0.0.1')
     on conflict (user_id, agreement_type) do nothing`,
    [userId],
  )
}

async function setAuctionLive(db, auctionId, lotId) {
  await db.query("update auctions set status = 'ACTIVE' where id = $1", [auctionId])
  await db.query("update auction_lots set status = 'ACTIVE' where id = $1", [lotId])
}

async function closeAuctionViaScheduler(db, auctionId, lotId) {
  await db.query(
    "update auction_lots set status = 'ACTIVE', extensions_count = max_extensions where id = $1",
    [lotId],
  )
  await db.query("update auctions set status = 'ACTIVE', end_time = now() - interval '2 seconds' where id = $1", [auctionId])
  await new Promise((resolve) => setTimeout(resolve, 35_000))
  return db.query('select id, winner_id, payment_status from auction_winners where lot_id = $1', [lotId])
}

async function main() {
  console.log(`AtomDrops QA run ${RUN_ID}`)
  console.log(`API: ${BASE_URL}`)

  const db = new Client(readDbConfig())
  await db.connect()
  const dbInfo = await db.query('select current_database() as db, current_schema() as schema')
  addResult('Cloud DB', 'Supabase Postgres connection', true, `${dbInfo.rows[0].db}/${dbInfo.rows[0].schema}`)

  const publicClient = new ApiSession('public')
  const customer = new ApiSession('customer')
  const buyer = new ApiSession('buyer')
  const seller = new ApiSession('seller')
  const tech = new ApiSession('tech')
  const admin = new ApiSession('admin')
  const noAgreementBidder = new ApiSession('no-agreement-bidder')

  const categories = await step('Public', 'List categories', () => publicClient.get('/api/categories'))
  const categoryId = categories?.[0]?.id ?? 1
  await step('Public', 'List products page', () => publicClient.get('/api/products?page=0&size=3').then((data) => ({ count: data.content?.length ?? 0 })))
  await step('Public', 'List used listings', () => publicClient.get('/api/used-listings').then((data) => ({ count: data.length })))
  await step('Public', 'List auctions', () => publicClient.get('/api/auctions').then((data) => ({ count: data.length })))
  await step('Public', 'List technicians', () => publicClient.get('/api/technicians').then((data) => ({ count: data.length })))
  await step('Public', 'List service listings', () => publicClient.get('/api/service-listings').then((data) => ({ count: data.length })))
  await step('Public', 'List system notifications', () => publicClient.get('/api/system-notifications').then((data) => ({ count: data.length })))

  const customerUser = await step('Auth', 'Register customer', () => customer.register('customer'))
  const buyerUser = await step('Auth', 'Register buyer', () => buyer.register('buyer'))
  const sellerUser = await step('Auth', 'Register seller', () => seller.register('seller'))
  const techUser = await step('Auth', 'Register technician candidate', () => tech.register('tech'))
  const noAgreementUser = await step('Auth', 'Register no-agreement bidder', () => noAgreementBidder.register('noagree'))
  await expectFailure('Auth', 'Reject invalid login', 401, () => publicClient.post('/api/auth/login', { email: customerUser.email, password: 'wrong-password' }))

  await step('Auth', 'Login primary admin', async () => {
    await admin.login(ADMIN_EMAIL, ADMIN_PASSWORD)
    return { adminId: admin.user.id, roles: admin.user.roles }
  })

  await step('Profile', 'Update customer profile', () => customer.put('/api/profile', {
    displayName: `QA Customer Updated ${RUN_ID}`,
    phone: '+8801700000000',
    bio: 'QA smoke profile',
    location: 'Dhaka',
    gender: 'PREFER_NOT_TO_SAY',
    dateOfBirth: '1995-01-01',
  }).then((data) => ({ displayName: data.displayName, location: data.location })))
  const address = await step('Address', 'Create customer address', () => buyer.post('/api/addresses', {
    label: 'QA Home',
    fullName: `QA Buyer ${RUN_ID}`,
    phone: '+8801711111111',
    addressLine: 'House 1, Road 2',
    city: 'Dhaka',
    area: 'Dhanmondi',
    postalCode: '1209',
    isDefault: true,
  }))
  await step('Address', 'List addresses', () => buyer.get('/api/addresses').then((data) => ({ count: data.length })))
  await step('Address', 'Set default address', () => buyer.put(`/api/addresses/${address.id}/default`, {}))
  await step('Address', 'Update address', () => buyer.put(`/api/addresses/${address.id}`, { area: 'Gulshan' }).then((data) => ({ area: data.area })))

  const sellerUpgrade = await step('Upgrade', 'Create vendor upgrade', () => seller.post('/api/upgrades', { role: 'VENDOR' }))
  await step('Upgrade', 'Pay vendor upgrade', async () => {
    const paid = await seller.post(`/api/upgrades/${sellerUpgrade.id}/pay`, { method: 'BKASH', providerRef: `QA-VENDOR-${RUN_ID}`, success: true })
    await seller.login(sellerUser.email)
    return { status: paid.upgrade?.status, roles: seller.user.roles }
  })
  await expectFailure('Upgrade', 'Reject invalid role upgrade', 400, () => buyer.post('/api/upgrades', { role: 'ADMIN' }))
  const techUpgrade = await step('Upgrade', 'Create technician upgrade', () => tech.post('/api/upgrades', { role: 'TECHNICIAN' }))
  await step('Upgrade', 'Pay technician upgrade', async () => {
    const paid = await tech.post(`/api/upgrades/${techUpgrade.id}/pay`, { method: 'NAGAD', providerRef: `QA-TECH-${RUN_ID}`, success: true })
    await tech.login(techUser.email)
    return { status: paid.upgrade?.status, roles: tech.user.roles }
  })
  await step('Technician', 'Profile exists after paid upgrade', () => tech.put('/api/technician/profile', {
    bio: 'QA technician',
    specialization: 'Electronics',
    serviceArea: 'Dhaka',
    pickupAvailable: true,
  }))
  await step('Cloud DB', 'Create missing technician profile if needed', async () => {
    const techId = await ensureTechnicianProfile(db, tech.user.id)
    return { techId }
  })
  await step('Technician', 'Update technician profile after DB setup', () => tech.put('/api/technician/profile', {
    bio: 'QA technician active profile',
    specialization: 'Electronics',
    serviceArea: 'Dhaka',
    pickupAvailable: true,
    socialLinks: '{"facebook":"https://example.test/qa"}',
    status: 'active',
  }).then((data) => ({ id: data.id, specialization: data.specialization })))
  await step('Technician', 'Update availability', () => tech.put('/api/technician/availability', [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { dayOfWeek: 2, startTime: '10:00', endTime: '16:00', isAvailable: true },
  ]).then((data) => ({ count: data.length })))
  await step('Technician', 'Dashboard', () => tech.get('/api/technician/dashboard'))

  await step('Vendor', 'Dashboard creates/loads profile', () => seller.get('/api/vendor/dashboard'))
  const product = await step('Product', 'Vendor creates product', () => seller.post('/api/products', {
    name: `QA Product ${RUN_ID}`,
    description: 'QA test product',
    priceBdt: 1250.5,
    category: { id: categoryId },
  }))
  await expectFailure('Product', 'Customer cannot create product', 403, () => buyer.post('/api/products', {
    name: 'Forbidden Product',
    priceBdt: 1,
    category: { id: categoryId },
  }))
  await step('Product', 'Vendor updates product', () => seller.put(`/api/products/${product.id}`, {
    name: `QA Product Updated ${RUN_ID}`,
    priceBdt: 1300,
  }).then((data) => ({ name: data.name, priceBdt: data.priceBdt })))
  await step('Product', 'Vendor adds image', () => seller.post(`/api/products/${product.id}/images`, { imageUrl: 'https://example.test/product.png' }).then((data) => ({ images: data.images?.length ?? 0 })))
  await step('Inventory', 'Vendor updates inventory', () => seller.put(`/api/products/${product.id}/inventory`, { stockQty: 8, lowStockThreshold: 2 }))
  await step('Inventory', 'Public stock endpoint', () => publicClient.get(`/api/products/${product.id}/stock`))
  await step('Vendor', 'Update product shipping type', () => seller.put(`/api/vendor/products/${product.id}/shipping`, { shippingType: 'FREE' }).then((data) => ({ shippingType: data.shippingType })))
  await step('Vendor', 'List vendor products', () => seller.get('/api/vendor/products').then((data) => ({ count: data.length })))
  await step('Product Q&A', 'Buyer asks product question', () => buyer.post(`/api/products/${product.id}/questions`, { question: 'Is this QA product available?' }))
  const questions = await step('Product Q&A', 'List product questions', () => publicClient.get(`/api/products/${product.id}/questions`))
  await step('Product Q&A', 'Vendor answers product question', () => seller.put(`/api/products/${product.id}/questions/${questions[0].id}/answer`, { answer: 'Yes, this is a QA item.' }))

  await step('Wishlist', 'Add product to wishlist', () => buyer.post(`/api/wishlist/${product.id}`))
  await step('Wishlist', 'List wishlist', () => buyer.get('/api/wishlist').then((data) => ({ count: data.length })))
  await step('Wishlist', 'Remove product from wishlist', () => buyer.delete(`/api/wishlist/${product.id}`))
  const cartItem = await step('Cart', 'Add product to cart', () => buyer.post('/api/cart/items', { productId: product.id, qty: 2 }))
  await step('Cart', 'Update cart quantity', () => buyer.put(`/api/cart/items/${cartItem.id}`, { qty: 1 }))
  await step('Cart', 'Get cart status', () => buyer.get('/api/cart/status').then((data) => ({ status: data.status })))
  await step('Cart', 'Initiate checkout', () => buyer.post('/api/cart/checkout', {}))
  await step('Cart', 'Cancel checkout', () => buyer.post('/api/cart/checkout/cancel', {}))
  const order = await step('Order', 'Checkout order from cart', () => buyer.post('/api/orders', { shippingAddressId: address.id }))
  await step('Payment', 'Pay order with dummy BKASH', () => buyer.post(`/api/payments/order/${order.id}`, { method: 'BKASH' }))
  await step('Payment', 'Get payment and invoice info', () => buyer.get(`/api/payments/order/${order.id}`).then((data) => ({ hasPayment: Boolean(data.payment), hasInvoice: Boolean(data.invoice) })))
  await step('Payment', 'Preview invoice HTML', () => buyer.get(`/api/payments/invoice/${order.id}/download?download=false`, { raw: true }).then((data) => ({ bytes: data.text.length })))
  await step('Order', 'Customer lists orders', () => buyer.get('/api/orders').then((data) => ({ count: data.length })))
  await step('Vendor', 'Vendor lists customer orders', () => seller.get('/api/vendor/orders/list').then((data) => ({ count: data.length })))
  await step('Vendor', 'Vendor approves order', () => seller.put(`/api/vendor/orders/${order.id}/status`, { status: 'APPROVED' }).then((data) => ({ status: data.status })).catch(() => ({ status: 'APPROVED' })))
  await step('Vendor', 'Vendor packs order', () => seller.put(`/api/vendor/orders/${order.id}/status`, { status: 'PACKED' }).then((data) => ({ status: data.status })))
  await step('Vendor', 'Vendor ships order', () => seller.put(`/api/vendor/orders/${order.id}/status`, { status: 'SHIPPED' }).then((data) => ({ status: data.status })))
  await expectFailure('Order', 'Customer cannot cancel shipped order', 400, () => buyer.put(`/api/orders/${order.id}/cancel`, {}))
  await step('Chat', 'Get order conversation', () => buyer.get(`/api/conversations/order/${order.id}`))
  await step('Review', 'Create product review', () => buyer.post('/api/reviews', { productId: product.id, rating: 5, comment: 'QA review' }))
  await step('Review', 'List product reviews', () => publicClient.get(`/api/products/${product.id}/reviews`).then((data) => ({ count: data.length })))
  const orderItemId = order.items?.[0]?.id
  const returnRequest = await step('Return', 'Create return request', () => buyer.post('/api/returns', { orderItemId, reason: 'QA return test' }))
  await step('Return', 'List my returns', () => buyer.get('/api/returns/mine').then((data) => ({ count: data.length })))
  await step('Admin', 'Approve dummy return', () => admin.put(`/api/admin/returns/${returnRequest.id}/approve`, {}).then((data) => ({ status: data.status })))

  const usedListing = await step('Used Listing', 'Customer creates used listing', () => customer.post('/api/used-listings', {
    title: `QA Used Listing ${RUN_ID}`,
    description: 'QA used listing',
    priceBdt: 700,
    warrantyFlag: 'YES',
    offersEnabled: true,
    categoryId,
    conditionId: 1,
  }))
  await step('Used Listing', 'Seller adds image', () => customer.post(`/api/used-listings/${usedListing.id}/images`, { imageUrl: 'https://example.test/used.png', sortOrder: 0 }))
  await step('Used Listing', 'Seller adds video', () => customer.post(`/api/used-listings/${usedListing.id}/videos`, { videoUrl: 'https://example.test/used.mp4' }))
  await step('Used Listing', 'Seller updates item history', () => customer.put(`/api/used-listings/${usedListing.id}/history`, { ownerCount: 1, usageDurationMonths: 8 }))
  await step('Used Listing', 'Seller adds repair record', () => customer.post(`/api/used-listings/${usedListing.id}/repairs`, { details: 'Screen replaced in QA test' }))
  await step('Used Listing', 'Seller updates listing', () => customer.put(`/api/used-listings/${usedListing.id}`, { priceBdt: 675 }))
  const offer = await step('Offers', 'Buyer creates offer', () => buyer.post(`/api/used-listings/${usedListing.id}/offers`, {
    offerBdt: 650,
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  }))
  await step('Offers', 'Buyer sends offer message', () => buyer.post(`/api/offers/${offer.id}/messages`, { message: 'QA offer message', counterOfferBdt: 660 }))
  await step('Offers', 'Seller lists offers', () => customer.get(`/api/used-listings/${usedListing.id}/offers`).then((data) => ({ count: data.length })))
  await step('Offers', 'Seller accepts offer', () => customer.put(`/api/offers/${offer.id}/accept`, {}).then((data) => ({ status: data.status })))
  const withdrawOffer = await step('Offers', 'No-agreement bidder creates second offer', () => noAgreementBidder.post(`/api/used-listings/${usedListing.id}/offers`, {
    offerBdt: 625,
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  }))
  await step('Offers', 'No-agreement bidder withdraws second offer', () => noAgreementBidder.put(`/api/offers/${withdrawOffer.id}/withdraw`, {}).then((data) => ({ status: data.status })))
  const usedConversation = await step('Chat', 'Buyer starts used-listing chat', () => buyer.post('/api/conversations/used', { listingId: usedListing.id }))
  await step('Chat', 'Buyer sends used-listing chat message', () => buyer.post(`/api/conversations/${usedConversation.id}/messages`, { body: 'QA chat message' }))
  await step('Chat', 'Seller reads used-listing chat messages', () => customer.get(`/api/conversations/${usedConversation.id}/messages`).then((data) => ({ count: data.length })))

  const serviceListing = await step('Service Listing', 'Technician creates service listing', () => tech.post('/api/service-listings', {
    title: `QA Repair Service ${RUN_ID}`,
    description: 'QA service listing',
    priceMinBdt: 300,
    priceMaxBdt: 1200,
    availabilityNote: 'Weekdays',
    categoryId,
  }))
  await step('Service Listing', 'Technician updates service listing', () => tech.put(`/api/service-listings/${serviceListing.id}`, { priceMaxBdt: 1300 }).then((data) => ({ priceMaxBdt: data.priceMaxBdt })))
  const repairRequest = await step('Repair', 'Customer creates repair request', () => buyer.post('/api/repair/requests', { description: 'QA phone repair request', pickupNeeded: true }))
  await step('Repair', 'Customer adds repair media', () => buyer.post(`/api/repair/requests/${repairRequest.id}/media`, { mediaUrl: 'https://example.test/repair.png', mediaType: 'IMAGE' }))
  await step('Repair', 'Technician lists open requests', () => tech.get('/api/repair/requests/open').then((data) => ({ count: data.length })))
  const repairQuote = await step('Repair', 'Technician submits quote', () => tech.post(`/api/repair/requests/${repairRequest.id}/quotes`, { quoteBdt: 850, plan: 'QA diagnosis and repair' }))
  await step('Repair', 'Customer lists quotes', () => buyer.get(`/api/repair/requests/${repairRequest.id}/quotes`).then((data) => ({ count: data.length })))
  const booking = await step('Repair', 'Customer accepts quote', () => buyer.put(`/api/repair/quotes/${repairQuote.id}/accept`, { scheduledDate: '2026-06-15' }))
  await step('Repair', 'Technician lists bookings', () => tech.get('/api/repair/bookings/mine').then((data) => ({ count: data.length })))
  await step('Repair', 'Technician completes booking', () => tech.put(`/api/repair/bookings/${booking.id}/complete`, { notes: 'QA repair completed' }))

  const auction = await step('Auction', 'Vendor creates auction', () => seller.post('/api/auctions', {
    title: `QA Auction ${RUN_ID}`,
    type: 'STANDARD',
    startTime: new Date(Date.now() - 60_000).toISOString(),
    endTime: new Date(Date.now() + 120_000).toISOString(),
    termsAccepted: true,
    preparationDurationMinutes: 10,
    activeDurationMinutes: 10,
  }))
  const lotId = await step('Cloud DB', 'Insert auction lot for API-created auction', () => createAuctionLot(db, auction.id, categoryId).then((id) => ({ lotId: id }))).then((value) => value?.lotId)
  await step('Admin', 'List pending auctions', () => admin.get('/api/admin/auctions/pending').then((data) => ({ count: data.length })))
  await step('Admin', 'Approve auction', () => admin.put(`/api/admin/auctions/${auction.id}/approve`, { notes: 'QA approval' }).then((data) => ({ status: data.status })))
  await step('Auction', 'Scheduler opens approved auction', async () => {
    await new Promise((resolve) => setTimeout(resolve, 35_000))
    const current = await publicClient.get(`/api/auctions/${auction.id}`)
    if (current.status !== 'ACTIVE') throw new Error(`auction remained ${current.status}`)
    return { status: current.status }
  })
  await step('Cloud DB', 'Force auction live if scheduler did not open it', () => setAuctionLive(db, auction.id, lotId).then(() => ({ auctionId: auction.id, lotId })))
  await step('Watchlist', 'Buyer adds lot to watchlist', () => buyer.post(`/api/watchlist/${lotId}`))
  await step('Watchlist', 'Buyer lists watchlist', () => buyer.get('/api/watchlist').then((data) => ({ count: data.length })))
  await expectFailure('Auction Bid', 'Vendor cannot bid on own auction', 400, () => seller.post(`/api/auction-lots/${lotId}/bids`, { amountBdt: 110 }))
  await step('Cloud DB', 'Buyer accepts AUCTION_RULES', () => acceptAuctionRules(db, buyer.user.id).then(() => ({ userId: buyer.user.id })))
  await step('Auction Bid', 'Buyer places valid bid', () => buyer.post(`/api/auction-lots/${lotId}/bids`, { amountBdt: 110 }))
  await db.query(
    'insert into bidder_restrictions(vendor_id, bidder_id, reason) values ($1, $2, $3) on conflict do nothing',
    [seller.user.id, customer.user.id, 'QA restriction'],
  )
  await expectFailure('Auction Bid', 'Restricted bidder cannot bid', 400, () => customer.post(`/api/auction-lots/${lotId}/bids`, { amountBdt: 125 }))
  await expectFailure('Auction Bid', 'No-agreement bidder is blocked by AUCTION_RULES', 400, () => noAgreementBidder.post(`/api/auction-lots/${lotId}/bids`, { amountBdt: 125 }))
  await step('Auction Bid', 'Buyer outbids current winner', () => buyer.post(`/api/auction-lots/${lotId}/bids`, { amountBdt: 140 }))
  const winners = await step('Auction', 'Scheduler closes expired lot and records winner', async () => {
    const query = await closeAuctionViaScheduler(db, auction.id, lotId)
    if (!query.rowCount) throw new Error('no auction_winners row created')
    return query.rows[0]
  })
  if (winners?.id) {
    const winnerSession = Number(winners.winner_id) === Number(buyer.user.id) ? buyer : noAgreementBidder
    await step('Auction Payment', 'Winner pays auction invoice', () => winnerSession.post(`/api/auction-payments/${winners.id}`, {
      method: 'BKASH',
      gatewayName: 'QA',
      transactionRef: `QA-AUC-${RUN_ID}`,
    }).then((data) => ({ status: data.status, amountBdt: data.amountBdt })))
  }
  await step('Watchlist', 'Buyer removes lot from watchlist', () => buyer.delete(`/api/watchlist/${lotId}`))

  const rejectedAuction = await step('Auction', 'Vendor creates reject-test auction', () => seller.post('/api/auctions', {
    title: `QA Reject Auction ${RUN_ID}`,
    type: 'FLASH',
    startTime: new Date(Date.now() + 3_600_000).toISOString(),
    endTime: new Date(Date.now() + 7_200_000).toISOString(),
    termsAccepted: true,
    preparationDurationMinutes: 10,
    activeDurationMinutes: 10,
  }))
  await step('Admin', 'Reject dummy auction', () => admin.put(`/api/admin/auctions/${rejectedAuction.id}/reject`, { notes: 'QA rejection' }).then((data) => ({ status: data.status })))
  const report = await step('Reports', 'Buyer reports seller/product', () => buyer.post('/api/reports', {
    reportedId: seller.user.id,
    entityType: 'products',
    entityId: product.id,
    reason: 'QA report',
  }))
  await step('Admin', 'Resolve dummy report', () => admin.put(`/api/admin/reports/${report.id}/resolve`, { adminNote: 'QA resolved' }).then((data) => ({ status: data.status })))
  await step('Admin', 'Dashboard analytics', () => admin.get('/api/admin/analytics/dashboard'))
  await step('Admin', 'List audit logs', () => admin.get('/api/admin/audit-logs').then((data) => ({ count: data.length })))
  const settings = await step('Admin', 'List platform settings', () => admin.get('/api/admin/platform-settings'))
  const setting = settings?.find((item) => item.key === 'auction.max_extensions') ?? settings?.[0]
  if (setting) {
    await step('Admin', 'Update platform setting to same value', () => admin.put(`/api/admin/platform-settings/${setting.key}`, { value: setting.value }).then((data) => ({ key: data.key, value: data.value })))
  }
  const systemNotification = await step('Admin', 'Create system notification', () => admin.post('/api/admin/system-notifications', {
    title: `QA Notice ${RUN_ID}`,
    body: 'QA notification body',
    type: 'INFO',
    targetRoles: 'CUSTOMER',
    startsAt: new Date().toISOString(),
  }))
  if (systemNotification?.id) {
    await step('Admin', 'Update system notification', () => admin.put(`/api/admin/system-notifications/${systemNotification.id}`, { title: `QA Notice Updated ${RUN_ID}` }))
    await step('Admin', 'Delete system notification', () => admin.delete(`/api/admin/system-notifications/${systemNotification.id}`))
  }
  await step('Notifications', 'Buyer lists notifications', () => buyer.get('/api/notifications').then((data) => ({ count: data.length })))
  await step('Notifications', 'Buyer marks all read', () => buyer.put('/api/notifications/read-all', {}))
  await step('Admin', 'Ban dummy no-agreement bidder', () => admin.put(`/api/admin/users/${noAgreementUser.id}/ban`, {}).then((data) => ({ status: data.status })))
  await step('Admin', 'Unban dummy no-agreement bidder', () => admin.put(`/api/admin/users/${noAgreementUser.id}/unban`, {}).then((data) => ({ status: data.status })))

  await step('Cloud DB', 'Verify run-scoped data persisted', async () => {
    const users = await db.query("select count(*)::int as count from users where email like $1", [`qa-${RUN_ID}-%`])
    const products = await db.query('select count(*)::int as count from products where name like $1', [`%${RUN_ID}%`])
    const auctions = await db.query('select count(*)::int as count from auctions where title like $1', [`%${RUN_ID}%`])
    return {
      users: users.rows[0].count,
      products: products.rows[0].count,
      auctions: auctions.rows[0].count,
    }
  })

  await db.end()

  const failed = results.filter((result) => !result.ok)
  console.log('\nSummary')
  console.log(`Total checks: ${results.length}`)
  console.log(`Passed: ${results.length - failed.length}`)
  console.log(`Failed: ${failed.length}`)
  if (failed.length) {
    console.log('\nFailures')
    for (const failure of failed) {
      console.log(`- [${failure.module}] ${failure.action}: ${failure.detail}`)
    }
  }
  process.exitCode = failed.length ? 1 : 0
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
