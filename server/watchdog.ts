/**
 * Production Watchdog — internal uptime & health monitor
 *
 * Runs entirely in-process (no external HTTP calls) to avoid false positives
 * caused by network routing. Checks database connectivity directly every 5 minutes.
 * Sends alert emails via sendCriticalAlertEmail and enforces a 30-minute cooldown
 * per error type so Russell's inbox doesn't get flooded during a sustained outage.
 *
 * Only started when NODE_ENV === 'production' (see server/index.ts).
 */

import { pool } from './db';
import { sendCriticalAlertEmail } from './emailService';

// Cooldown tracking: maps an error-type key → timestamp of last alert sent (ms)
const lastAlertAt = new Map<string, number>();

// 30-minute cooldown window in milliseconds
const COOLDOWN_MS = 30 * 60 * 1000;

// Watchdog poll interval — 5 minutes
const POLL_INTERVAL_MS = 5 * 60 * 1000;

// Reference so callers can stop the watchdog if needed (e.g. graceful shutdown)
let watchdogTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Check if a cooldown is still active for a given error type.
 * Returns true when an alert MAY be sent, false when still cooling down.
 */
function isCooldownExpired(errorType: string): boolean {
  const last = lastAlertAt.get(errorType);
  if (last === undefined) return true;
  return Date.now() - last > COOLDOWN_MS;
}

/**
 * Mark the cooldown start for an error type and fire the alert email.
 * Safe to call from any module — cooldown enforcement is shared here.
 *
 * @param errorType  Short key used for cooldown deduplication (e.g. "db_error", "5xx_unhandled")
 * @param subject    Human-readable subject line (without the leading "🚨 [LotteryPro]" prefix)
 * @param details    Body text: stack trace summary, request path, error message, etc.
 */
export async function triggerAlert(
  errorType: string,
  subject: string,
  details: string
): Promise<void> {
  if (!isCooldownExpired(errorType)) {
    const remainingMins = Math.ceil(
      (COOLDOWN_MS - (Date.now() - (lastAlertAt.get(errorType) ?? 0))) / 60_000
    );
    console.warn(
      `⏳ [Watchdog] Alert suppressed (cooldown active for "${errorType}", ${remainingMins}m remaining)`
    );
    return;
  }

  // Set cooldown BEFORE the async send so a fast-failing mailer doesn't re-trigger
  lastAlertAt.set(errorType, Date.now());
  await sendCriticalAlertEmail(subject, details);
}

/**
 * Perform an in-process database health check.
 * Returns an object describing the result — same shape used by /api/health.
 */
export async function checkDatabaseHealth(): Promise<{
  db: 'connected' | 'error';
  dbError?: string;
}> {
  try {
    // Lightweight query — just enough to prove the connection pool is alive
    await pool.query('SELECT 1');
    return { db: 'connected' };
  } catch (err: any) {
    return { db: 'error', dbError: err?.message ?? 'Unknown DB error' };
  }
}

/**
 * Run one watchdog cycle: check DB health, alert on failure.
 * Exported so tests or admin routes can trigger a manual check.
 */
export async function runWatchdogCycle(): Promise<void> {
  const result = await checkDatabaseHealth();

  if (result.db === 'error') {
    console.error(`❌ [Watchdog] Database health check FAILED: ${result.dbError}`);
    await triggerAlert(
      'db_health_check_failed',
      'Database connectivity lost',
      [
        `Error    : ${result.dbError}`,
        `Checked  : ${new Date().toISOString()}`,
        '',
        'The watchdog could not execute SELECT 1 against the Neon PostgreSQL pool.',
        'All database-dependent features (auth, draws, subscriptions) will be unavailable.',
        'Check DATABASE_URL secret and Neon dashboard for connection limits or outages.',
      ].join('\n')
    );
  } else {
    // Successful cycles are silent in production to avoid log noise
    // (startup and debug builds can uncomment the line below)
    // console.log(`✅ [Watchdog] Health check OK — ${new Date().toISOString()}`);
  }
}

/**
 * Start the in-process watchdog.
 * Call once after the HTTP server begins listening, gated on NODE_ENV === 'production'.
 */
export function startWatchdog(): void {
  if (watchdogTimer) {
    console.warn('[Watchdog] Already running — startWatchdog() called twice.');
    return;
  }

  // Run an immediate cycle so we know the DB is reachable right after deploy
  runWatchdogCycle().catch(err => {
    console.error('[Watchdog] Initial health check threw:', err);
  });

  watchdogTimer = setInterval(() => {
    runWatchdogCycle().catch(err => {
      console.error('[Watchdog] Health cycle threw unexpectedly:', err);
    });
  }, POLL_INTERVAL_MS);

  // Prevent the interval from keeping Node alive after an intentional shutdown
  if (watchdogTimer.unref) watchdogTimer.unref();

  console.log('🐕 [Watchdog] Started — DB health checked every 5 minutes.');
}

/**
 * Stop the watchdog (useful for graceful shutdown or tests).
 */
export function stopWatchdog(): void {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
    console.log('[Watchdog] Stopped.');
  }
}
