import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { Client } = require('pg')

const CONNECTION_STRING = 'postgresql://postgres.uurqvmqgycpbigfsrksk:%23qQ33847099@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres'

const client = new Client({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
})

await client.connect()

// 1. Most recent 5 orders
console.log('=== MOST RECENT 5 ORDERS ===')
const ordersRes = await client.query(`
  SELECT id, status, total_bdt, created_at
  FROM orders
  ORDER BY created_at DESC
  LIMIT 5
`)
console.table(ordersRes.rows)

// 2. Related payment records for those orders
const orderIds = ordersRes.rows.map(r => r.id)
if (orderIds.length > 0) {
  console.log('\n=== RELATED PAYMENT RECORDS ===')
  const paymentsRes = await client.query(`
    SELECT order_id, method AS payment_method, status AS payment_status, created_at
    FROM payments
    WHERE order_id = ANY($1::bigint[])
    ORDER BY created_at DESC
  `, [orderIds])
  console.table(paymentsRes.rows)
}

// 3. Count of PLACED vs APPROVED orders (and all other statuses for context)
console.log('\n=== ORDER STATUS COUNTS (ALL STATUSES) ===')
const countRes = await client.query(`
  SELECT status, COUNT(*)::int AS count
  FROM orders
  GROUP BY status
  ORDER BY status
`)
console.table(countRes.rows)

await client.end()
