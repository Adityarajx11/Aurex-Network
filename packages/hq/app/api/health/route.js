import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const started = Date.now();
  let dbStatus = 'disconnected';
  let latencyMs = 0;

  try {
    const res = await pool.query('SELECT 1 as alive');
    if (res && res.rows) {
      dbStatus = 'connected';
      latencyMs = Date.now() - started;
    }
  } catch (err) {
    dbStatus = 'error: ' + (err.message || 'unknown');
  }

  return NextResponse.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    database: dbStatus,
    latencyMs,
    timestamp: new Date().toISOString(),
  }, {
    status: dbStatus === 'connected' ? 200 : 503,
  });
}
