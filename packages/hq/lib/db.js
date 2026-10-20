const { Pool } = require('pg');
const { databaseUrl } = require('./env');

if (!databaseUrl) {
  console.warn('[hq] DATABASE_URL not set — config features disabled.');
}

const isLocal = /localhost|127\.0\.0\.1/.test(databaseUrl || '');

const pool = new Pool({
  connectionString: databaseUrl || undefined,
  ssl: !isLocal && (databaseUrl?.includes('railway') || databaseUrl?.includes('sslmode=require'))
    ? { rejectUnauthorized: false }
    : false,
  // Fail fast instead of hanging when the database is unreachable.
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
});

// An idle client that errors (DB restart, network drop, provider sleep) emits
// 'error' on the pool. Without a listener Node treats it as an unhandled
// 'error' event and crashes the whole Next.js server.
pool.on('error', (err) => {
  console.error('[hq] Postgres pool error (idle client):', err.message);
});

module.exports = pool;
