// Drip email sequence service — free-to-paid nurture automation
// Sequence: Day 0 (Welcome), Day 2 (Feature Education), Day 5 (Social Proof + CTA), Day 10 (Last-Chance Offer)
// Respects email_preferences opt-out and halts automatically on upgrade.

import { db } from './db';
import { dripSequences, emailSendLog, emailPreferences, userAccounts } from '@shared/schema';
import { eq, and, lte, isNull, or } from 'drizzle-orm';
import { sendMail } from './emailService';

// Re-export sendMail as an internal symbol — emailService exports it as named
// We import it via the module re-export path to keep one transport layer.

// ── Step configuration ──────────────────────────────────────────────────────
// Each step defines the delay from enrollment (in days) and the email to send.
const DRIP_STEPS: {
  step: number;          // step index stored in drip_sequences.current_step after send
  sendAfterDays: number; // days from enrolledAt when this email fires
  label: string;
}[] = [
  { step: 1, sendAfterDays: 0,  label: 'welcome' },
  { step: 2, sendAfterDays: 2,  label: 'feature_education' },
  { step: 3, sendAfterDays: 5,  label: 'social_proof' },
  { step: 4, sendAfterDays: 10, label: 'last_chance' },
];

// Maximum step index — sequence is complete after this
const MAX_STEP = 4;

// ── Email template helpers ─────────────────────────────────────────────────

// Shared footer used in all drip emails
function dripFooter(userEmail: string): string {
  return `
        <!-- Footer -->
        <div style="background:#F7FAFC;padding:24px 30px;text-align:center;border-top:1px solid #E2E8F0;">
          <p style="color:#718096;font-size:13px;margin:0 0 8px 0;">
            <strong>Russell Nomer's LotteryPro</strong><br>
            Educational Lottery Analysis Platform
          </p>
          <p style="color:#A0AEC0;font-size:11px;margin:0;">
            <a href="https://lotterypro.app/unsubscribe?email=${encodeURIComponent(userEmail)}" style="color:#A0AEC0;text-decoration:underline;">Unsubscribe</a> &nbsp;|&nbsp;
            <a href="https://lotterypro.app/preferences?email=${encodeURIComponent(userEmail)}" style="color:#A0AEC0;text-decoration:underline;">Email Preferences</a>
          </p>
        </div>
  `;
}

// Day 0 — Welcome + quick-start guide
function generateDay0HTML(userEmail: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F7FAFC;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:white;border-radius:10px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#667EEA 0%,#764BA2 100%);padding:40px 20px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:30px;">🎉 Welcome to LotteryPro!</h1>
      <p style="color:rgba(255,255,255,0.9);margin:10px 0 0 0;font-size:16px;">Your quick-start guide is inside</p>
    </div>
    <!-- Body -->
    <div style="padding:36px 30px;">
      <h2 style="color:#2D3748;margin:0 0 12px 0;">You're in — here's how to get started 🚀</h2>
      <p style="color:#4A5568;font-size:16px;line-height:1.7;">
        LotteryPro is an <strong>educational analysis platform</strong> that studies the historical frequency of Powerball and MegaMillions numbers so you can make smarter, data-informed picks.
      </p>

      <div style="background:#EBF4FF;border-left:4px solid #4299E1;padding:16px 20px;border-radius:4px;margin:24px 0;">
        <p style="color:#2B6CB0;font-size:15px;margin:0;"><strong>3 things to try right now:</strong></p>
        <ol style="color:#2B6CB0;font-size:14px;line-height:1.8;margin:10px 0 0 0;padding-left:18px;">
          <li>Go to <a href="https://lotterypro.app" style="color:#2B6CB0;">lotterypro.app</a> and generate your first set of numbers (it's free).</li>
          <li>Check the <strong>Frequency Charts</strong> to see which numbers have appeared most often in history.</li>
          <li>Bookmark your favourite picks in <strong>My Tickets</strong> so you never lose them.</li>
        </ol>
      </div>

      <p style="color:#4A5568;font-size:15px;line-height:1.7;">
        Your free account includes <strong>5 daily picks</strong> — plenty to explore the platform. We'll send you a tip or two over the next week to help you get the most out of it.
      </p>

      <div style="text-align:center;margin:36px 0;">
        <a href="https://lotterypro.app"
           style="background:linear-gradient(135deg,#667EEA 0%,#764BA2 100%);color:white;padding:16px 36px;text-decoration:none;border-radius:50px;font-size:17px;font-weight:bold;display:inline-block;box-shadow:0 4px 14px rgba(102,126,234,0.4);">
          🎰 Open LotteryPro
        </a>
      </div>

      <p style="color:#718096;font-size:14px;text-align:center;">
        Questions? Reply to this email — I read every one.<br>
        <strong>— Russell Nomer</strong>
      </p>
    </div>
    ${dripFooter(userEmail)}
  </div>
</body>
</html>`;
}

// Day 2 — Feature education (hot/cold numbers, smart picks, what free users miss)
function generateDay2HTML(userEmail: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F7FAFC;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:white;border-radius:10px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#F6AD55 0%,#ED8936 100%);padding:40px 20px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:30px;">🔥 Hot vs Cold Numbers — Explained</h1>
      <p style="color:rgba(255,255,255,0.9);margin:10px 0 0 0;font-size:16px;">The feature that separates serious players from casual ones</p>
    </div>
    <!-- Body -->
    <div style="padding:36px 30px;">
      <p style="color:#4A5568;font-size:16px;line-height:1.7;">
        Hi there — Russell here. Two days in, I wanted to share the feature that our most engaged users talk about most: <strong>Hot &amp; Cold number analysis</strong>.
      </p>

      <!-- Hot numbers -->
      <div style="background:#FFF5F5;border:1px solid #FEB2B2;border-radius:8px;padding:20px;margin:20px 0;">
        <h3 style="color:#C53030;margin:0 0 8px 0;">🔥 Hot Numbers</h3>
        <p style="color:#742A2A;font-size:14px;line-height:1.6;margin:0;">
          Numbers that have appeared <em>more frequently</em> than average in the last 500+ draws. Some players use these on the theory that frequent past appearances indicate continued relevance in the draw pool.
        </p>
      </div>

      <!-- Cold numbers -->
      <div style="background:#EBF8FF;border:1px solid #90CDF4;border-radius:8px;padding:20px;margin:20px 0;">
        <h3 style="color:#2B6CB0;margin:0 0 8px 0;">❄️ Cold Numbers</h3>
        <p style="color:#2A4365;font-size:14px;line-height:1.6;margin:0;">
          Numbers that have appeared <em>less frequently</em> — the "due" numbers. Some players prefer these on the theory that under-represented numbers are statistically overdue to appear.
        </p>
      </div>

      <!-- Smart Picks -->
      <div style="background:#F0FFF4;border:1px solid #9AE6B4;border-radius:8px;padding:20px;margin:20px 0;">
        <h3 style="color:#276749;margin:0 0 8px 0;">⚡ Smart Picks (Balanced Method)</h3>
        <p style="color:#22543D;font-size:14px;line-height:1.6;margin:0;">
          Our third method blends both approaches — mixing hot, cold, and balanced-range numbers for a statistically diverse ticket. It's the most popular method among our Pro and Premium members.
        </p>
      </div>

      <p style="color:#4A5568;font-size:15px;line-height:1.7;margin-top:24px;">
        <strong>Free accounts</strong> can try all three methods — but are limited to <strong>5 picks per day</strong> and see ads between generations. Paid plans remove both limits entirely.
      </p>

      <div style="text-align:center;margin:36px 0;">
        <a href="https://lotterypro.app"
           style="background:linear-gradient(135deg,#F6AD55 0%,#ED8936 100%);color:white;padding:16px 36px;text-decoration:none;border-radius:50px;font-size:17px;font-weight:bold;display:inline-block;box-shadow:0 4px 14px rgba(246,173,85,0.4);">
          🔥 Try Hot &amp; Cold Numbers
        </a>
      </div>
    </div>
    ${dripFooter(userEmail)}
  </div>
</body>
</html>`;
}

// Day 5 — Social proof + upgrade prompt with direct /pricing link
function generateDay5HTML(userEmail: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F7FAFC;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:white;border-radius:10px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#48BB78 0%,#276749 100%);padding:40px 20px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:30px;">💎 Upgrade to Unlimited Picks</h1>
      <p style="color:rgba(255,255,255,0.9);margin:10px 0 0 0;font-size:16px;">Here's why hundreds of players already switched</p>
    </div>
    <!-- Body -->
    <div style="padding:36px 30px;">
      <p style="color:#4A5568;font-size:16px;line-height:1.7;">
        Five days in — hope you've been exploring! I wanted to share what our paid members say they love most about LotteryPro.
      </p>

      <!-- Testimonial-style callouts -->
      <div style="border-left:4px solid #48BB78;padding:14px 18px;margin:20px 0;background:#F0FFF4;border-radius:4px;">
        <p style="color:#276749;font-size:15px;margin:0;font-style:italic;">"The unlimited picks mean I can experiment with every method on draw day without counting how many I have left."</p>
        <p style="color:#4A5568;font-size:13px;margin:6px 0 0 0;">— Pro member</p>
      </div>

      <div style="border-left:4px solid #667EEA;padding:14px 18px;margin:20px 0;background:#EBF4FF;border-radius:4px;">
        <p style="color:#2B6CB0;font-size:15px;margin:0;font-style:italic;">"No more ads popping up between my picks. Worth it just for that."</p>
        <p style="color:#4A5568;font-size:13px;margin:6px 0 0 0;">— Basic member</p>
      </div>

      <!-- Feature comparison -->
      <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px;">
        <thead>
          <tr style="background:#EDF2F7;">
            <th style="padding:10px 14px;text-align:left;color:#2D3748;">Feature</th>
            <th style="padding:10px 14px;text-align:center;color:#718096;">Free</th>
            <th style="padding:10px 14px;text-align:center;color:#276749;">Paid</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #E2E8F0;">
            <td style="padding:10px 14px;color:#4A5568;">Daily picks</td>
            <td style="padding:10px 14px;text-align:center;color:#718096;">5</td>
            <td style="padding:10px 14px;text-align:center;color:#276749;font-weight:bold;">Unlimited</td>
          </tr>
          <tr style="border-bottom:1px solid #E2E8F0;">
            <td style="padding:10px 14px;color:#4A5568;">Ads</td>
            <td style="padding:10px 14px;text-align:center;color:#718096;">Yes</td>
            <td style="padding:10px 14px;text-align:center;color:#276749;font-weight:bold;">None</td>
          </tr>
          <tr style="border-bottom:1px solid #E2E8F0;">
            <td style="padding:10px 14px;color:#4A5568;">All pick methods</td>
            <td style="padding:10px 14px;text-align:center;color:#276749;">✓</td>
            <td style="padding:10px 14px;text-align:center;color:#276749;font-weight:bold;">✓</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;color:#4A5568;">Frequency charts</td>
            <td style="padding:10px 14px;text-align:center;color:#276749;">✓</td>
            <td style="padding:10px 14px;text-align:center;color:#276749;font-weight:bold;">✓</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align:center;margin:36px 0;">
        <a href="https://lotterypro.app/pricing"
           style="background:linear-gradient(135deg,#48BB78 0%,#276749 100%);color:white;padding:16px 40px;text-decoration:none;border-radius:50px;font-size:17px;font-weight:bold;display:inline-block;box-shadow:0 4px 14px rgba(72,187,120,0.4);">
          💎 See Pricing Plans
        </a>
      </div>

      <p style="color:#718096;font-size:14px;text-align:center;">
        Plans start at just a few dollars a month. No contracts — cancel anytime.
      </p>
    </div>
    ${dripFooter(userEmail)}
  </div>
</body>
</html>`;
}

// Day 10 — Last-chance offer (day pass upsell + urgency framing)
function generateDay10HTML(userEmail: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F7FAFC;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:white;border-radius:10px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#E53E3E 0%,#C53030 100%);padding:40px 20px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:30px;">⏰ Last Call — Try Premium Free</h1>
      <p style="color:rgba(255,255,255,0.9);margin:10px 0 0 0;font-size:16px;">Unlock everything for one draw day, zero risk</p>
    </div>
    <!-- Body -->
    <div style="padding:36px 30px;">
      <p style="color:#4A5568;font-size:16px;line-height:1.7;">
        It's been 10 days since you joined LotteryPro — and this is the last email in our welcome series. I wanted to make you one final offer before I go quiet:
      </p>

      <!-- Day Pass callout -->
      <div style="background:linear-gradient(135deg,#FFF5F5 0%,#FED7D7 100%);border:2px solid #FC8181;border-radius:12px;padding:28px;margin:24px 0;text-align:center;">
        <h2 style="color:#C53030;margin:0 0 8px 0;font-size:22px;">🎫 24-Hour Day Pass</h2>
        <p style="color:#742A2A;font-size:15px;margin:0 0 16px 0;">
          Unlimited picks + zero ads for a full 24 hours — for a one-time fee that's less than a coffee.
        </p>
        <a href="https://lotterypro.app/pricing"
           style="background:linear-gradient(135deg,#E53E3E 0%,#C53030 100%);color:white;padding:14px 36px;text-decoration:none;border-radius:50px;font-size:16px;font-weight:bold;display:inline-block;box-shadow:0 4px 14px rgba(229,62,62,0.4);">
          Get My Day Pass
        </a>
      </div>

      <!-- Monthly plan reminder -->
      <p style="color:#4A5568;font-size:15px;line-height:1.7;">
        Prefer a monthly plan? Our <strong>Basic plan</strong> gives you everything unlimited for less than a couple of lottery tickets a month. <a href="https://lotterypro.app/pricing" style="color:#667EEA;font-weight:bold;">View all plans →</a>
      </p>

      <div style="background:#FEFCBF;border:1px solid #F6E05E;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="color:#744210;font-size:14px;margin:0;line-height:1.6;">
          <strong>⚡ Educational disclaimer:</strong> LotteryPro is a study and entertainment platform. Number analysis is for educational purposes — past frequency does not guarantee future results. Play responsibly.
        </p>
      </div>

      <p style="color:#718096;font-size:14px;text-align:center;margin-top:24px;">
        Whatever you decide — thanks for spending the last 10 days with LotteryPro. You're always welcome back.<br><br>
        <strong>— Russell Nomer</strong>
      </p>
    </div>
    ${dripFooter(userEmail)}
  </div>
</body>
</html>`;
}

// ── Template router ────────────────────────────────────────────────────────
interface DripEmailContent {
  subject: string;
  html: string;
  text: string;
}

function buildDripEmail(step: number, userEmail: string): DripEmailContent {
  switch (step) {
    case 1:
      return {
        subject: '🎉 Welcome to LotteryPro — your quick-start guide',
        html: generateDay0HTML(userEmail),
        text: `Welcome to LotteryPro!\n\nHere are 3 things to try right now:\n1. Generate your first set of numbers at https://lotterypro.app\n2. Check the Frequency Charts\n3. Bookmark your picks in My Tickets\n\nYour free account includes 5 daily picks.\n\n— Russell Nomer\n\nUnsubscribe: https://lotterypro.app/unsubscribe?email=${encodeURIComponent(userEmail)}`,
      };
    case 2:
      return {
        subject: '🔥 Hot vs Cold numbers — the feature serious players use',
        html: generateDay2HTML(userEmail),
        text: `Hot vs Cold Numbers — Explained\n\nHot Numbers: appear more often than average in recent draws.\nCold Numbers: appear less often — statistically "due".\nSmart Picks (Balanced): mixes both for diversity.\n\nAll three methods are available on free accounts (5 picks/day). Paid plans remove limits.\n\nTry it now: https://lotterypro.app\n\nUnsubscribe: https://lotterypro.app/unsubscribe?email=${encodeURIComponent(userEmail)}`,
      };
    case 3:
      return {
        subject: '💎 Why hundreds of players upgraded to LotteryPro paid',
        html: generateDay5HTML(userEmail),
        text: `Upgrade to Unlimited Picks\n\nWhat paid members love:\n- Unlimited daily picks (vs 5 free)\n- Zero ads between generations\n- All pick methods included\n\nPlans start at just a few dollars/month. No contracts.\n\nSee pricing: https://lotterypro.app/pricing\n\nUnsubscribe: https://lotterypro.app/unsubscribe?email=${encodeURIComponent(userEmail)}`,
      };
    case 4:
      return {
        subject: '⏰ Last call — try a 24-hour Day Pass on LotteryPro',
        html: generateDay10HTML(userEmail),
        text: `Last Call — Try Premium Free\n\nUnlock everything for one draw day with a 24-Hour Day Pass (one-time fee, less than a coffee).\n\nOr check our monthly plans — less than a couple of lottery tickets per month.\n\nSee options: https://lotterypro.app/pricing\n\n— Russell Nomer\n\nUnsubscribe: https://lotterypro.app/unsubscribe?email=${encodeURIComponent(userEmail)}`,
      };
    default:
      throw new Error(`Unknown drip step: ${step}`);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Enroll a newly registered free user in the drip sequence.
 * Called immediately after account creation in auth.ts.
 * No-ops silently on error so registration is never blocked.
 */
export async function enrollUserInDripSequence(
  userId: string,
  email: string
): Promise<void> {
  try {
    const now = new Date();
    // Day 2 email fires 2 days from enrollment
    const day2SendAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // Insert enrollment row with step=0 first so we have a record even if send fails
    await db.insert(dripSequences).values({
      userId,
      sequenceName: 'free_to_paid',
      currentStep: 0,
      isActive: true,
      enrolledAt: now,
      nextSendAt: day2SendAt, // day 2 will be handled by cron
    });

    console.log(`📬 [Drip] Enrolled user ${userId} in free_to_paid sequence — sending Day 0 welcome now`);

    // Check promotional email opt-out before sending Day 0
    const [prefs] = await db.select()
      .from(emailPreferences)
      .where(eq(emailPreferences.userId, userId))
      .limit(1);

    if (prefs && prefs.promotionalEmails === 0) {
      // User opted out of marketing — record and halt immediately, do not send
      await db.update(dripSequences)
        .set({ isActive: false, haltReason: 'unsubscribed', haltedAt: now, updatedAt: now })
        .where(eq(dripSequences.userId, userId));
      console.log(`🚫 [Drip] User ${userId} opted out of promotional emails — drip halted at enrollment`);
      return;
    }

    // Log the Day 0 send attempt
    const [logEntry] = await db.insert(emailSendLog).values({
      userId,
      email,
      emailType: 'drip_welcome',
      status: 'pending',
    }).returning({ id: emailSendLog.id });

    // Send the Day 0 welcome email immediately (non-blocking on the caller)
    const { subject, html, text } = buildDripEmail(1, email);
    try {
      const result = await sendMail({ to: email, subject, text, html });
      await db.update(emailSendLog)
        .set({ status: result.success ? 'sent' : 'failed', sentAt: result.success ? now : undefined })
        .where(eq(emailSendLog.id, logEntry.id));

      if (result.success) {
        // Advance to step 1 — day 2 will be picked up by cron
        await db.update(dripSequences)
          .set({ currentStep: 1, nextSendAt: day2SendAt, updatedAt: now })
          .where(eq(dripSequences.userId, userId));
        console.log(`✅ [Drip] Day 0 welcome sent immediately to ${email}`);
      }
    } catch (sendErr: any) {
      await db.update(emailSendLog)
        .set({ status: 'failed', errorMessage: sendErr?.message || 'Unknown error' })
        .where(eq(emailSendLog.id, logEntry.id));
      console.error(`❌ [Drip] Day 0 send failed for ${email} — cron will retry:`, sendErr);
      // Leave currentStep=0 so cron picks it up on next run
      await db.update(dripSequences)
        .set({ nextSendAt: now, updatedAt: now }) // re-queue for cron
        .where(eq(dripSequences.userId, userId));
    }
  } catch (err) {
    console.error('❌ [Drip] Failed to enroll user in drip sequence:', err);
  }
}

/**
 * Halt the drip sequence for a user who has upgraded to a paid tier.
 * Called from subscription activation routes.
 */
export async function haltDripSequence(
  userId: string,
  reason: 'upgraded' | 'unsubscribed' = 'upgraded'
): Promise<void> {
  try {
    await db.update(dripSequences)
      .set({
        isActive: false,
        haltReason: reason,
        haltedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(dripSequences.userId, userId),
          eq(dripSequences.isActive, true)
        )
      );
    console.log(`🛑 [Drip] Halted drip sequence for user ${userId} — reason: ${reason}`);
  } catch (err) {
    console.error('❌ [Drip] Failed to halt drip sequence:', err);
  }
}

/**
 * Process all pending drip emails. Called by the daily cron job.
 * Queries drip_sequences for active rows where nextSendAt <= now,
 * checks email opt-out preferences, sends the email, and advances the step.
 */
export async function processDripEmails(): Promise<number> {
  const now = new Date();
  let sentCount = 0;

  try {
    // Find all active drip sequences with a send due now or overdue
    const due = await db.select({
      seq: dripSequences,
      email: userAccounts.email,
      tier: userAccounts.subscriptionTier,
    })
      .from(dripSequences)
      .innerJoin(userAccounts, eq(dripSequences.userId, userAccounts.id))
      .where(
        and(
          eq(dripSequences.isActive, true),
          lte(dripSequences.nextSendAt, now)
        )
      );

    for (const row of due) {
      const { seq, email, tier } = row;

      // Defensive check: halt if the user has a paid tier and the upgrade hook somehow missed
      // (e.g. admin direct edit, legacy data migration). Primary halting is via explicit calls.
      if (tier !== 'free' && tier !== null) {
        await haltDripSequence(seq.userId, 'upgraded');
        continue;
      }

      // Respect promotional email opt-out
      const [prefs] = await db.select()
        .from(emailPreferences)
        .where(eq(emailPreferences.userId, seq.userId))
        .limit(1);

      if (prefs && prefs.promotionalEmails === 0) {
        // User opted out — halt the sequence
        await haltDripSequence(seq.userId, 'unsubscribed');
        continue;
      }

      // Determine which step to send (next step = currentStep + 1)
      const nextStep = seq.currentStep + 1;

      if (nextStep > MAX_STEP) {
        // Sequence exhausted — mark complete
        await db.update(dripSequences)
          .set({ isActive: false, haltReason: 'completed', haltedAt: now, updatedAt: now })
          .where(eq(dripSequences.id, seq.id));
        continue;
      }

      const stepConfig = DRIP_STEPS.find(s => s.step === nextStep);
      if (!stepConfig) continue;

      // Build the email content
      const { subject, html, text } = buildDripEmail(nextStep, email);

      // Log to email_send_log before sending
      const [logEntry] = await db.insert(emailSendLog).values({
        userId: seq.userId,
        email,
        emailType: `drip_${stepConfig.label}`,
        status: 'pending',
      }).returning({ id: emailSendLog.id });

      let sendSuccess = false;
      try {
        const result = await sendMail({ to: email, subject, text, html });
        sendSuccess = result.success;
        await db.update(emailSendLog)
          .set({ status: sendSuccess ? 'sent' : 'failed', sentAt: sendSuccess ? now : undefined })
          .where(eq(emailSendLog.id, logEntry.id));
      } catch (err: any) {
        await db.update(emailSendLog)
          .set({ status: 'failed', errorMessage: err?.message || 'Unknown error' })
          .where(eq(emailSendLog.id, logEntry.id));
        console.error(`❌ [Drip] Failed to send step ${nextStep} to ${email}:`, err);
        continue;
      }

      if (!sendSuccess) continue;

      // Compute next send time (use enrolledAt as the reference to stay accurate)
      const enrolledAt = seq.enrolledAt ?? new Date();
      const nextStepConfig = DRIP_STEPS.find(s => s.step === nextStep + 1);
      let nextSendAt: Date | null = null;
      if (nextStepConfig) {
        nextSendAt = new Date(enrolledAt.getTime() + nextStepConfig.sendAfterDays * 24 * 60 * 60 * 1000);
      }

      // Advance the step in the database
      await db.update(dripSequences)
        .set({
          currentStep: nextStep,
          nextSendAt: nextSendAt,
          isActive: nextSendAt !== null, // deactivate if no more steps
          haltReason: nextSendAt === null ? 'completed' : null,
          haltedAt: nextSendAt === null ? now : null,
          updatedAt: now,
        })
        .where(eq(dripSequences.id, seq.id));

      console.log(`📧 [Drip] Sent step ${nextStep} (${stepConfig.label}) to ${email}`);
      sentCount++;
    }
  } catch (err) {
    console.error('❌ [Drip] processDripEmails error:', err);
  }

  return sentCount;
}
