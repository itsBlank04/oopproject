import pg from 'pg';

const DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com';
const DB_PORT = 5432;
const DB_NAME = 'postgres';
const DB_USER = 'postgres.uurqvmqgycpbigfsrksk';
const DB_PASS = '#qQ33847099';

const SUPABASE_URL = 'https://uurqvmqgycpbigfsrksk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ORdqvW5oxdjOzvVrR7Hu1g_lMmLdtGh';

// ─── Step 1: Reset Database ───

async function resetDatabase() {
  console.log('Connecting to database...');
  const pool = new pg.Pool({
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASS,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  const client = await pool.connect();
  try {
    console.log('Connected. Truncating all tables...');
    await client.query(`
      DO $$
      DECLARE
          tables text;
      BEGIN
          SELECT string_agg(quote_ident(tablename), ', ' ORDER BY tablename)
          INTO tables
          FROM pg_tables
          WHERE schemaname = 'public';
          IF tables IS NOT NULL THEN
              EXECUTE 'TRUNCATE TABLE ' || tables || ' CASCADE;';
          END IF;
      END $$;
    `);
    console.log('All tables truncated.');

    console.log('Resetting sequences...');
    await client.query(`
      DO $$
      DECLARE
          r RECORD;
      BEGIN
          FOR r IN (
              SELECT sequence_name
              FROM information_schema.sequences
              WHERE sequence_schema = 'public'
          ) LOOP
              EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1;', r.sequence_name);
          END LOOP;
      END $$;
    `);
    console.log('All sequences reset.');
  } finally {
    client.release();
    await pool.end();
  }
}

// ─── Step 2: Clear Supabase Storage ───

async function fetchFromSupabase(path, options = {}) {
  const url = `${SUPABASE_URL}/storage/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function clearStorage() {
  console.log('\nClearing Supabase Storage bucket "atomdrops"...');

  const BUCKET_API = `/bucket/atomdrops`;
  const OBJECTS_API = `/object/list/atomdrops`;

  // Try listing and deleting files from each prefix (folder)
  const prefixes = ['', 'avatars/', 'products/', 'used-items/', 'repairs/', 'auctions/'];

  for (const prefix of prefixes) {
    try {
      const { ok, data, status } = await fetchFromSupabase(
        `/object/list/atomdrops`,
        {
          method: 'POST',
          body: JSON.stringify({
            prefix: prefix,
            limit: 1000,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' },
          }),
        },
      );

      if (!ok) {
        console.log(`  [${status}] Skipping prefix "${prefix}": ${JSON.stringify(data)}`);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`  "${prefix}" — empty`);
        continue;
      }

      const fileNames = data.map(f => f.name);
      console.log(`  "${prefix}" — ${fileNames.length} files found, deleting...`);

      const delRes = await fetchFromSupabase(`/object/atomdrops`, {
        method: 'DELETE',
        body: JSON.stringify({ prefixes: fileNames }),
      });

      if (delRes.ok) {
        console.log(`  "${prefix}" — cleared`);
      } else {
        console.log(`  "${prefix}" — delete failed [${delRes.status}]: ${JSON.stringify(delRes.data)}`);
      }
    } catch (err) {
      console.log(`  "${prefix}" — error: ${err.message}`);
    }
  }
}

// ─── Main ───

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  AtomDrops — Full Database Reset');
  console.log('═══════════════════════════════════════\n');

  const start = Date.now();

  try {
    await resetDatabase();
  } catch (err) {
    console.error('\nDatabase reset FAILED:', err.message);
    process.exit(1);
  }

  try {
    await clearStorage();
  } catch (err) {
    console.log('\nStorage cleanup note:', err.message);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s.`);
  console.log('You can now restart the backend.');
}

main();
