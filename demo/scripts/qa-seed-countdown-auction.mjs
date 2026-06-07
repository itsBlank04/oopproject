import fs from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Client } = require('pg')

const RUN_ID = process.env.QA_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)

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

const db = new Client(readDbConfig())

try {
  await db.connect()
  await db.query('begin')

  const vendor = await db.query(
    `select u.id
       from users u
       join user_roles ur on ur.user_id = u.id
       join roles r on r.id = ur.role_id
      where r.name = 'VENDOR'
      order by u.id desc
      limit 1`,
  )
  if (!vendor.rowCount) throw new Error('No vendor user exists for countdown seed')

  const category = await db.query('select id from categories order by id limit 1')
  if (!category.rowCount) throw new Error('No category exists for countdown seed')

  const auction = await db.query(
    `insert into auctions(
       vendor_id, title, type, status, start_time, end_time,
       terms_accepted, created_at, updated_at
     )
     values (
       $1, $2, 'FLASH', 'ACTIVE',
       now() - interval '1 minute', now() + interval '5 minutes',
       true, now(), now()
     )
     returning id, title, end_time`,
    [vendor.rows[0].id, `QA Countdown Auction ${RUN_ID}`],
  )

  const lot = await db.query(
    `insert into auction_lots(
       auction_id, category_id, title, description, condition_note,
       starting_price_bdt, reserve_price_bdt, current_bid_bdt,
       min_bid_increment_bdt, extension_duration_minutes,
       extensions_count, max_extensions, status, created_at, updated_at
     )
     values (
       $1, $2, $3, 'QA countdown lot description', 'QA visible countdown',
       100.00, 120.00, 100.00, 10.00, 5, 0, 3,
       'ACTIVE', now(), now()
     )
     returning id`,
    [auction.rows[0].id, category.rows[0].id, `QA countdown lot ${RUN_ID}`],
  )

  await db.query('commit')
  console.log(JSON.stringify({
    auctionId: auction.rows[0].id,
    lotId: lot.rows[0].id,
    title: auction.rows[0].title,
    endTime: auction.rows[0].end_time,
  }))
} catch (error) {
  await db.query('rollback').catch(() => {})
  console.error(error.message)
  process.exitCode = 1
} finally {
  await db.end().catch(() => {})
}
