# LotteryPro — Full Architecture & Specification
**Version:** April 2026  
**Domain:** https://lotterypro.app  
**Author:** Russell Nomer  
**Purpose:** Level-setting document for co-architects (Gemini, Grok, ChatGPT) — red team, review, and improvement guidance

---

## 1. Executive Summary

LotteryPro is a full-stack web application (React + Express + PostgreSQL) deployed on Replit and served at **lotterypro.app**. Its core purpose is **educational lottery number analysis** — it does not sell lottery tickets, make performance guarantees, or constitute gambling advice. All claims are prominently disclaimed.

The platform simultaneously serves two brand missions:
1. **Lottery analysis utility** — frequency charts, multi-method number generation, prediction tracking, scratch-off prize data
2. **Music cross-promotion hub** — Russell Nomer is an ASCAP-registered independent musician with a 532-song catalog; the platform drives streaming traffic to Apple Music, Spotify, and YouTube

Revenue is generated through subscriptions (PayPal), one-time credit packs (Stripe), affiliate referrals (Jackpocket), advertising (Google AdSense), community lottery pools (PayPal), and a referral program.

---

## 2. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18, TypeScript, Vite | SPA, no SSR |
| Routing | Wouter | Lightweight client-side router |
| State | TanStack Query v5 | Server state, caching, mutations |
| UI | shadcn/ui + Radix UI + Tailwind CSS | Component library |
| Charts | Chart.js | Frequency visualization |
| Icons | lucide-react, react-icons/si | UI + brand icons |
| Backend | Node.js, Express.js, TypeScript | REST API, same origin as frontend via Vite proxy |
| ORM | Drizzle ORM | Type-safe SQL, schema-first |
| Database | Neon Serverless PostgreSQL | Connected via `DATABASE_URL` |
| Session store | PostgreSQL (`sessions` table) | Express-session |
| Auth | bcrypt (passwords), speakeasy TOTP (MFA), crypto (tokens) | Session cookies + Bearer tokens |
| Email | Nodemailer + Gmail SMTP | App password: `LotteryPro_Email` secret, from: `russell@lotterypro.app` |
| Payments (subscriptions) | PayPal SDK (`@paypal/paypal-server-sdk`) | Sandbox in dev, production PayPal plans |
| Payments (one-time) | Stripe Checkout | Credit packs + day passes |
| Advertising | Google AdSense | Publisher ID: `GOOGLE_ADSENSE_PUBLISHER_ID` |
| Analytics | Google Tag Manager (`GTM-P3JTF25N`) | Custom dataLayer events |
| SEO | react-helmet-async (Open Graph, Twitter Cards), PWA manifest, service worker | |
| External data | NY State Open Data API, PA Lottery scraper, YouTube Data API | Real-time lottery results |
| Build | ESBuild (production), Vite dev server | |
| Hosting | Replit (dev + deployed) | Port 5000, single-origin |

---

## 3. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Browser / Mobile                    │
│  React SPA (Vite, Wouter, TanStack Query, shadcn/ui)   │
│  PWA: manifest.json + sw.js (network-first cache)       │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTPS (same origin)
                    ▼
┌─────────────────────────────────────────────────────────┐
│              Express.js Server (port 5000)              │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Routes  │  │   Auth   │  │  Email   │             │
│  │ routes.ts│  │  auth.ts │  │Service.ts│             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │              │              │                   │
│  ┌────┴──────────────┴──────────────┴──────────┐       │
│  │           Storage Layer (storage.ts)         │       │
│  │   MemStorage (dev) │ DatabaseStorage (prod)  │       │
│  └──────────────────────────┬──────────────────┘       │
│                              │ Drizzle ORM              │
└──────────────────────────────┼──────────────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │  Neon PostgreSQL DB   │
                    │  (DATABASE_URL)       │
                    └──────────────────────┘

External Services:
  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐
  │  PayPal API    │  │  Stripe API    │  │  Gmail SMTP     │
  │  Subscriptions │  │  Checkout      │  │  smtp.gmail.com │
  │  Pool payments │  │  Credit packs  │  │  :465 SSL       │
  └────────────────┘  └────────────────┘  └─────────────────┘

  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐
  │ data.ny.gov    │  │palottery.pa.gov│  │ YouTube Data    │
  │ REST API       │  │ HTML scraper   │  │ API v3          │
  │ NY scratch-offs│  │ PA scratch-offs│  │ Russell's songs │
  └────────────────┘  └────────────────┘  └─────────────────┘
```

---

## 4. Database Schema

All tables use UUID primary keys (`gen_random_uuid()`). JSONB fields store arrays and flexible data. Schema defined in `shared/schema.ts` and managed by Drizzle ORM.

### Core Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `lottery_draws` | Historical draw results | `game`, `draw_date`, `main_numbers (jsonb)`, `bonus_number`, `jackpot` |
| `generated_tickets` | User-generated number sets | `game`, `method`, `main_numbers (jsonb)`, `bonus_number` |
| `prediction_results` | Ticket-vs-draw match analysis | `ticket_id`, `actual_draw_id`, `numbers_matched`, `bonus_matched`, `prize_level`, `accuracy` |
| `performance_stats` | Aggregated accuracy metrics | `game`, `method`, `timeperiod`, `total_predictions`, `average_accuracy`, `win_rate` |

### User & Auth Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `user_accounts` | Registered users | `email (unique)`, `password_hash`, `subscription_tier`, `subscription_status`, `paypal_subscription_id`, `mfa_secret`, `mfa_enabled`, `mfa_backup_codes (jsonb)`, `daily_usage_count`, `bonus_generations`, `home_state (varchar 2)` |
| `user_sessions` | Session tokens | `user_id`, `session_token (unique)`, `mfa_verified`, `expires_at` |
| `vip_codes` | Admin-generated upgrade codes | `code_hash (SHA-256)`, `target_email`, `current_tier`, `target_tier`, `is_used`, `expires_at` |
| `admin_logs` | Admin action audit trail | `admin_email`, `action`, `target_email`, `details (jsonb)`, `ip_address` |
| `audit_logs` | Full security audit log | `event_type`, `event_category`, `user_id`, `ip_address`, `severity` |
| `error_logs` | Backend error capture | `error_type`, `error_message`, `stack_trace`, `resolved` |
| `password_reset_tokens` | Secure reset flow | `email`, `token_hash (SHA-256)`, `expires_at`, `used_at` |

### Revenue Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `affiliate_tracking` | Jackpocket click tracking | `user_id`, `session_id`, `affiliate_partner`, `clicked_at`, `converted_at` |
| `daily_spins` | Spin-to-win records | `user_id`, `session_id`, `spin_date`, `prize_type`, `prize_value`, `claimed` |
| `referral_codes` | Referral program | `referrer_id`, `referral_code (unique)`, `referred_user_id`, `status` |
| `email_preferences` | Email opt-in/preferences | `email (unique)`, `powerball_reminders`, `megamillions_reminders`, `weekly_digest` |
| `email_send_log` | Email delivery audit | `email`, `email_type`, `status`, `error_message`, `sent_at` |
| `lottery_pools` | Community pool definitions | `name`, `game`, `target_amount`, `admin_fee_percent`, `created_by` |
| `pool_members` | Pool membership + contributions | `pool_id`, `user_id`, `contribution_amount`, `paypal_order_id`, `payment_status` |
| `pool_tickets` | Numbers generated for pool | `pool_id`, `main_numbers`, `bonus_number` |
| `pool_transactions` | Pool payment records | `pool_id`, `user_id`, `amount`, `admin_fee`, `transaction_type` |
| `pool_winnings` | Pool prize distribution | `pool_id`, `total_prize`, `admin_cut`, `member_share` |
| `one_time_purchases` | Stripe credit pack purchases | `user_id`, `session_id`, `stripe_session_id`, `product_type`, `credits_awarded`, `verified_at` |

### Content Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `music_content` | Russell's track catalog | `platform`, `track_title`, `track_url`, `embed_code`, `featured`, `play_count` |
| `book_recommendations` | Recommended reading | `title`, `amazon_url`, `category`, `display_order` |

### Customer Data Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `customer_profiles` | Rich marketing profiles | `email`, `email_hash`, `first_name`, `last_name`, `street_address`, `city`, `state`, `zip_code`, `mobile_number`, `email_verified`, `mobile_verified`, `account_approved`, `risk_score` |
| `email_verification_codes` | Email OTP verification | `email`, `verification_code (6-digit)`, `expires_at`, `attempts` |
| `sms_verification_codes` | SMS OTP verification | `mobile_number`, `verification_code (6-digit)`, `expires_at`, `attempts` |
| `customer_activity` | Behavioral analytics | `customer_id`, `activity_type`, `activity_data (jsonb)`, `revenue`, `ip_hash` |

---

## 5. User Tiers & Permissions

### Tier Hierarchy

```
admin (99) > founder (4) = lifetime (4) = unlimited (4) > premium (3) > pro (2) > basic (1) > free (0)
```

### Daily Generation Limits

| Tier | Generations/Day | Ads Shown | Price |
|---|---|---|---|
| `free` | 1 | Yes (AdSense) | Free |
| `basic` | 5 | Yes (reduced) | $7.99/mo or $69/yr |
| `pro` | Unlimited | No | $7.99/mo or $69/yr |
| `premium` | Unlimited | No | $7.99/mo or $69/yr |
| `founder` / `lifetime` / `unlimited` | Unlimited, no spin limits | No | Legacy / gifted |

**Note:** `free` and `basic` tiers use `dailyUsageCount` incremented on each `/api/generate/:game` call, reset nightly. VIP tiers (`premium`, `pro`, `founder`, `lifetime`, `unlimited`) bypass all usage checks.

### Authentication Flow

```
Register → bcrypt hash password → store user (free tier)
  → Optional: setup TOTP MFA via Google Authenticator
  → Login: verify password + optional TOTP → create session token
  → Session stored as HttpOnly cookie (`lp_session`) + Bearer token
  → Session TTL: 24h (30-day cookie max-age for mobile)
```

### VIP Code Flow

```
Admin generates code → SHA-256(code:email) stored in DB → email sent to recipient
→ Recipient visits /admin → enters email + code → server validates hash + expiry
→ On success: user tier upgraded in user_accounts
```

---

## 6. Frontend Pages & Routes

| Route | Page | Auth Required | Description |
|---|---|---|---|
| `/` | `home.tsx` | No (optional) | Main number generator + analysis |
| `/auth` | `auth.tsx` | No | Login / Register / MFA / Password Reset |
| `/subscription` | `subscription.tsx` | No | Plan comparison + Stripe credit packs |
| `/performance` | `performance.tsx` | No | Historical prediction accuracy |
| `/pools` | `pools.tsx` | Auth for create/join | Community lottery pools |
| `/scratch-offs` | `scratch-offs.tsx` | No (state-aware) | NY/PA scratch-off prize helper |
| `/music` | `music-home.tsx` | No | Russell Nomer music hub |
| `/books` | `books.tsx` | No | Recommended reading |
| `/blog` | `blog.tsx` | No | SEO blog index |
| `/blog/:slug` | `blog.tsx` | No | Individual posts (4 posts) |
| `/admin` | `admin.tsx` | Admin session | Admin dashboard |
| `/pricing` | `pricing.tsx` | No | Pricing details |
| `/privacy` | `privacy.tsx` | No | Privacy policy |
| `/terms` | `terms.tsx` | No | Terms of service |
| `/support` | `support.tsx` | No | Support page |
| `/checkout-success` | `checkout-success.tsx` | No | Stripe post-checkout |
| `/social-marketing` | `social-marketing.tsx` | No | Social content tools |
| `/accessibility` | `accessibility.tsx` | No | Accessibility statement |

### Key Lazy-Loaded Components

- `PostGenerationModal` — post-pick conversion funnel (discover music → email signup)
- `SpinWheel` — **removed April 2026**
- `FanLoyaltyContest`, `AstrologicalFeatures`, `RussellBiography`, `RussellMusicPlayer`
- `VipCodeManager`, `BookRecommendations`, `ProfileSetup`

---

## 7. API Endpoints

### Lottery Data

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/draws/:game` | No | Recent draws (10 essential + cached) |
| GET | `/api/draws/:game/full` | No | Full historical dataset |
| GET | `/api/analysis/:game` | No | Frequency analysis + hot/cold numbers |
| GET | `/api/performance/:game` | No | Prediction performance stats |
| GET | `/api/marketing-stats` | No | Aggregated accuracy for marketing |
| GET | `/api/predictions/:ticketId?` | No | Prediction results |
| POST | `/api/draws` | No | Insert new draw result |
| GET | `/api/loading/status` | No | Background loading progress |
| GET | `/api/loading/status/:game` | No | Per-game loading status |
| POST | `/api/loading/refresh` | Admin | Force data refresh |
| GET | `/api/cache/stats` | No | Cache status |

### Number Generation

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/generate/:game` | Optional | Generate lottery numbers; enforces daily limits for non-VIP |

**Request body:**
```json
{ "method": "hot|balanced|wheel|random|advanced|numerology|realtime" }
```

**Response:**
```json
{
  "mainNumbers": [1,2,3,4,5],
  "bonusNumber": 10,
  "method": "hot",
  "confidence": 72,
  "ticketId": "uuid"
}
```

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No (rate limited) | Register new user |
| POST | `/api/auth/login` | No (rate limited) | Login + optional TOTP |
| POST | `/api/auth/logout` | Session | Invalidate session |
| POST | `/api/auth/mfa/setup` | No | Generate TOTP secret + QR code |
| POST | `/api/auth/mfa/verify` | No | Verify TOTP + enable MFA |
| POST | `/api/auth/forgot-password` | No (rate limited) | Send reset email |
| POST | `/api/auth/reset-password` | No | Reset password with token |
| GET | `/api/auth/user` | Session | Current user info (includes `homeState`) |
| PATCH | `/api/auth/user/state` | Session | Update home state |

### Subscriptions & Payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/subscription/status` | Optional | Current subscription info |
| GET | `/api/subscription-info` | Session | Detailed subscription info |
| POST | `/api/subscriptions/create` | Session | Create PayPal subscription |
| POST | `/api/subscriptions/activate` | No | Activate after PayPal approval |
| POST | `/api/purchases/create-checkout` | No | Stripe Checkout session |
| GET | `/api/purchases/verify/:sessionId` | No | Verify Stripe purchase + award credits |
| GET | `/api/purchases/my-credits` | Optional | User's credit balance |
| POST | `/api/check-usage` | Session | Check daily usage count |
| POST | `/webhooks/paypal` | No (verified) | PayPal IPN webhook |
| POST | `/webhooks/stripe` | No (Stripe sig) | Stripe webhook |

### Stripe Credit Packs (one-time)

| Product | Price | Credits |
|---|---|---|
| Starter Pack | $4.99 | 10 generations |
| Popular Pack | $9.99 | 25 generations |
| Pro Pack | $17.99 | 50 generations |
| 24-Hour Day Pass | $2.99 | Unlimited for 24h |

### Community Pools

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/pools` | No | List active pools |
| GET | `/api/pools/:poolId` | No | Pool detail + members |
| POST | `/api/pools/create` | Session | Create pool (5–10% admin fee, min $5 contribution) |
| POST | `/api/pools/:poolId/join` | Session | Join pool |
| POST | `/api/pools/:poolId/create-payment` | Session | Create PayPal order for contribution |
| POST | `/api/pools/:poolId/capture-payment` | Session | Capture PayPal payment |
| POST | `/api/pools/:poolId/generate-tickets` | Session | Generate numbers for pool |

### Referral Program

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/referral/my-code` | Optional | Get/create referral code |
| POST | `/api/referral/track` | No | Track referral click/signup |
| GET | `/api/referral/stats` | Optional | Referral stats dashboard |

Reward: 3 free number generations per successful referral. Code format: `RUSSELL{timestamp}`.

### Email

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/email/subscribe` | No | Subscribe to draw reminders |
| GET | `/api/email/preferences/:email` | No | Get email preferences |
| POST | `/api/email/unsubscribe` | No | Unsubscribe |

### Affiliate

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/affiliate/track` | No | Log Jackpocket CTA click |

### Scratch-offs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/scratchoffs?state=NY` | No | NY scratch-off prize data (data.ny.gov, 1h cache) |
| GET | `/api/scratchoffs?state=PA` | No | PA scratch-off data (scraped from palottery.pa.gov, 1h cache) |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/login` | No | Admin login (separate session) |
| POST | `/api/admin/logout` | Admin | Admin logout |
| GET | `/api/admin/session` | No | Check admin session |
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/vip-codes` | Admin | List VIP codes |
| GET | `/api/admin/logs` | Admin | Admin action logs |
| GET | `/api/admin/audit-logs` | Admin | Security audit logs |
| GET | `/api/admin/error-logs` | Admin | Error logs |
| PATCH | `/api/admin/error-logs/:id/resolve` | Admin | Mark error resolved |
| GET | `/api/admin/export-logs` | Admin | Export logs (CSV) |
| POST | `/api/admin/generate-vip` | Admin | Generate VIP code + email recipient |
| POST | `/api/admin/update-user-tier` | Admin | Manually upgrade user tier |
| POST | `/api/admin/create-user` | Admin | Create user account |
| GET | `/api/admin/totp-info` | Admin | Current TOTP state |
| GET, POST, PATCH, DELETE | `/api/admin/campaigns` | Admin | Ad campaign management |
| GET | `/api/admin/ad-revenue` | Admin | Ad revenue report |

---

## 8. Data Flows

### 8.1 Number Generation Flow

```
User selects game + method → POST /api/generate/:game
  → Auth check (session cookie or Bearer token)
  → Usage limit check:
      Admin?         → bypass
      VIP tier?      → bypass
      Remaining?     → increment count, proceed
      Limit reached? → 429 with upgrade prompt
  → Pull analysis data (hot/cold numbers from lottery_draws)
  → Run generation algorithm per method:
      hot        → top frequency numbers from last 30-100 draws
      balanced   → mix hot + cold + random
      wheel      → abbreviated wheel combinations
      random     → uniform random within game bounds
      advanced   → pattern-weighted selection
      numerology → numerological reduction algorithm
      realtime   → weighted by recency
  → INSERT into generated_tickets
  → Return ticket + confidence score
  → Frontend shows PostPickMusicBar + Jackpocket CTA
  → On "Save" click: ticket persisted; PostGenerationModal shown
```

### 8.2 Lottery Data Ingestion Flow

```
Server startup (server/index.ts):
  Step 1 — LAZY LOAD (instant, <500ms):
    Fetch last 10 Powerball draws from Neon DB
    Fetch last 10 MegaMillions draws from Neon DB
    Mark app as "ready"

  Step 2 — BACKGROUND (non-blocking):
    Fetch 1000 Powerball draws from data.ny.gov
    Fetch 1000 MegaMillions draws from data.ny.gov
    Bulk insert in batches of 100 with deduplication
    Fetch Russell Nomer songs from YouTube Data API
    Load music content + book recommendations

Cache: In-memory LRU cache with 1h TTL for API responses
Refresh: POST /api/loading/refresh (admin only) or ?refresh=1 query param
```

### 8.3 Subscription Payment Flow (PayPal)

```
User selects plan → POST /api/subscriptions/create
  → PayPal createSubscription(planId, userId)
  → Returns approvalUrl
→ User redirected to PayPal checkout
→ User approves → PayPal redirects back with subscriptionId
→ POST /api/subscriptions/activate
  → Verify subscription status with PayPal API
  → UPDATE user_accounts SET subscription_tier = 'basic'|'pro'|'premium'
→ PayPal sends IPN to POST /webhooks/paypal
  → Handle: subscription_activated, payment_completed, cancelled, suspended
```

### 8.4 One-Time Purchase Flow (Stripe)

```
User selects credit pack → POST /api/purchases/create-checkout
  → Create Stripe Checkout session (mode: 'payment')
  → Store session metadata (userId, product_type, credits)
→ User completes Stripe payment
→ Redirect to /checkout-success?session_id={CHECKOUT_SESSION_ID}
→ GET /api/purchases/verify/:sessionId
  → Verify payment_status = 'paid' with Stripe API
  → INSERT into one_time_purchases
  → UPDATE user_accounts SET bonus_generations += credits
→ Stripe sends webhook to POST /webhooks/stripe
  → Idempotent verification backup
```

### 8.5 Email Delivery Flow

```
Trigger event (VIP code, password reset, draw reminder, welcome):
  → emailService.ts called
  → getTransporter():
      LotteryPro_Email secret set?
        YES → singleton Nodemailer transport (smtp.gmail.com:465, SSL)
        NO  → console.log full email content (dev fallback)
  → transporter.sendMail({ from: russell@lotterypro.app, ... })
  → Log result to email_send_log (draw reminders only)
  → Console: ✅ Email sent / ❌ Failed + error message
```

### 8.6 Scratch-Off Data Flow

```
GET /api/scratchoffs?state=NY
  → Check in-memory cache (1h TTL)
  → Cache miss:
      NY: fetch data.ny.gov/resource/nzqa-7unk.json
          Parse: game name, price (from PRICE_LOOKUP verified table), prize tiers
          Calculate: total remaining prize pool, big prizes ($10K+), value score, % remaining
          Rank: Top Pick / Good Value / Fair / Low Value
      PA: fetch palottery.pa.gov/Print-Scratch-Offs.aspx
          Scrape HTML table with cheerio
          Return: 200+ active games with prices + prize data
  → Cache result, return JSON array
  → Frontend: filters (search, max price, min big prizes, category, sort)
              expandable prize tier table per game

States without dataStatus:'full' → StateDataPanel:
  Civic advocacy content, pre-written letter to representative,
  "Notify Me" email opt-in for when state data becomes available
```

---

## 9. Process Flows

### 9.1 New User Registration

```
1. User fills registration form: email, password, subscription tier, home state
2. POST /api/auth/register
3. Validate with Zod schema (email, min 8-char password, valid tier, 2-char state)
4. Check prohibited states (AL, AK, HI, MS, NV, UT) → block if prohibited
5. Check email uniqueness
6. bcrypt.hash(password, cost=12)
7. INSERT user_accounts (free tier regardless of selection until payment)
8. Return userId + requiresMFA: true
9. Optional: redirect to MFA setup flow
```

### 9.2 MFA Setup

```
1. POST /api/auth/mfa/setup { userId }
2. speakeasy.generateSecret({ name: 'LotteryPro (email)', issuer: 'LotteryPro' })
3. Store base32 secret in user_accounts.mfa_secret (not yet enabled)
4. Return QR code (data URL) + manual entry key
5. User scans QR code in Google Authenticator
6. User enters 6-digit token
7. POST /api/auth/mfa/verify { userId, token }
8. speakeasy.totp.verify(secret, token, window=2)  ← 60-second drift window
9. Generate 10 backup codes (8-char alphanumeric)
10. UPDATE user_accounts SET mfa_enabled = 1, mfa_backup_codes = [...]
11. Return backup codes to user (shown once, store safely)
```

### 9.3 Community Pool Flow

```
1. Admin creates pool: POST /api/pools/create
   { name, game, targetAmount, adminFeePercent (5-10%), minContribution ($5+) }
2. Members browse: GET /api/pools
3. Member joins: POST /api/pools/:poolId/join
4. Payment:
   a. POST /api/pools/:poolId/create-payment → PayPal order created
   b. User approves on PayPal
   c. POST /api/pools/:poolId/capture-payment → order captured
   d. Validate captured_amount == expected_contribution
   e. INSERT pool_members (payment_status: 'paid')
   f. INSERT pool_transactions (amount, admin_fee auto-calculated at default 7.5%)
5. When pool is ready: POST /api/pools/:poolId/generate-tickets
   → Runs generation algorithm → INSERT pool_tickets
6. After draw: admin records winnings → distribution calculated
```

### 9.4 Admin VIP Code Generation

```
1. Admin logs in at /admin (separate admin session)
2. POST /api/admin/generate-vip { targetEmail, targetTier, adminNotes }
3. Server: requireAdmin middleware validates admin session
4. vipManagement.ts:
   a. Generate random alphanumeric code: VIP-XXXX-XXXX (no confusing chars: 0/O, 1/I/L)
   b. SHA-256(code:targetEmail) → store as code_hash
   c. Set expires_at = now + 30 minutes
   d. INSERT vip_codes
   e. INSERT admin_logs (audit trail)
   f. Send email via emailService.sendVipCodeEmail()
5. Returns { vipCode, expiresAt }
6. Recipient: visits /admin → enters email + code → POST /api/vip/redeem
7. Server validates: hash match + email match + not used + not expired
8. UPDATE user_accounts SET subscription_tier = targetTier
9. Mark code as used
```

---

## 10. Multi-State Framework

### State Data Classification

```
dataStatus = 'full':         NY (data.ny.gov API), PA (palottery.pa.gov scraper)
dataStatus = 'national-only': All other 44 participating states
dataStatus = 'prohibited':    AL, AK, HI, MS, NV, UT (no lottery)
```

### State Detection Logic

```
Authenticated user → use user_accounts.homeState (set at registration)
Unauthenticated user → show NY data by default + state picker dropdown
State picker → browseState override (single source of truth, prevents re-init loops)
```

### Scratch-Off Page Rendering Logic

```
IF state.dataStatus === 'full' AND (state === 'NY' OR state === 'PA'):
  → Full scratch-off prize table with filters, rankings, value scores
ELSE IF state.prohibited:
  → "Lottery not available in [State]" message
ELSE:
  → StateDataPanel:
      - Available draw games (Powerball, MegaMillions + state games)
      - "What [State] Isn't Telling You" (NY/PA transparency comparison)
      - Pre-written advocacy letter template (cites NY/PA precedents)
      - "Find My Representative" → openstates.org pre-filled
      - Social sharing buttons
      - "Notify Me" email opt-in
```

---

## 11. Revenue Streams

| Stream | Implementation | Status |
|---|---|---|
| **Subscriptions** | PayPal recurring ($7.99/mo, $69/yr) | Active (sandbox in dev) |
| **Credit packs** | Stripe Checkout ($4.99 / $9.99 / $17.99) | Active |
| **Day pass** | Stripe Checkout ($2.99 / 24h) | Active |
| **Advertising** | Google AdSense (free-tier users only) | Active |
| **Jackpocket affiliate** | CTA button + click tracking (`affiliate_tracking` table) | Tracked, revenue pending partner approval |
| **Community pools** | PayPal (7.5% admin fee on contributions) | Active logic, needs production PayPal |
| **Referral program** | 3 free picks per conversion | Active (reward logic exists) |

---

## 12. Music Cross-Promotion Funnel

Russell Nomer's ASCAP-registered 532-song catalog is promoted throughout the app.

### Touch Points

| Location | Component | Behavior |
|---|---|---|
| Home page (post-pick) | `PostPickMusicBar` | Compact bar below generated ticket; Apple Music, Spotify, YouTube icon buttons; × dismiss persisted to `sessionStorage` |
| Post-pick modal | `PostGenerationModal` | 3-step modal: Discover (streaming CTAs) → Email (free picks + exclusive track hook) → Share |
| Scratch-offs page footer | Inline footer | "Tool built by independent musician Russell Nomer · Stream my music → Apple Music · Spotify · YouTube" |
| StateDataPanel footer | Same footer | Consistent across all state views |
| Referral share text | `ReferralWidget` | Twitter/Facebook/LinkedIn copy includes Russell attribution + `russellnomermusic.com` |
| `/music` | `music-home.tsx` | Full music hub with player, 532-song catalog from YouTube API |

### Canonical Streaming URLs

```
Apple Music:  https://music.apple.com/us/artist/russell-nomer/452485944
Spotify:      https://open.spotify.com/artist/6sW3FG7MiVFoNMCRQ3cKmq
YouTube:      https://youtube.com/@russellnomermusic
Music Hub:    https://russellnomermusic.com
```

---

## 13. Analytics & SEO

### Google Tag Manager Events

Custom dataLayer events fired via `client/src/lib/analytics.ts`:

| Event | Trigger |
|---|---|
| `number_generation` | Each successful ticket generation |
| `subscription_view` | Subscription page load |
| `subscription_click` | Plan selection click |
| `referral_share` | Social share button click |
| `pool_join` | Pool join initiation |
| `music_play` | Music player interaction |
| `virtual_page_view` | SPA route change |

### SEO Structure

- `SEOHead` component (react-helmet-async) on all major pages
- Open Graph + Twitter Card tags on 8 pages
- Domain: `https://lotterypro.app`
- Blog: 4 educational posts on frequency analysis, odds, pools, generation methods
- PWA: Standalone display mode, indigo theme (`#6366f1`), service worker (network-first, skips `/api/*`)
- `PWAInstallPrompt`: shown after 3+ visits, dismissable for 7 days

---

## 14. Security Model

### Implemented Hardening

| Control | Implementation |
|---|---|
| Password hashing | bcrypt, cost factor 12 |
| MFA | Google Authenticator TOTP (speakeasy), 60-second window, 10 backup codes |
| Session management | HttpOnly cookies + Bearer tokens, 24h TTL |
| Rate limiting | `authRateLimit` on `/api/auth/*` endpoints |
| CSRF | SameSite=Lax cookies |
| Security headers | helmet() in server/index.ts (CSP, HSTS, X-Frame-Options, etc.) |
| Admin separation | Separate admin session (`adminEmail` in req.session) |
| VIP code security | SHA-256 hashed, email-bound, 30-minute expiry, single-use |
| Audit logging | All admin actions → `admin_logs`, security events → `audit_logs` |
| Input validation | Zod schemas on all POST endpoints |
| SQL injection | Drizzle ORM parameterized queries only |
| Password reset | SHA-256 hashed tokens, 30-minute TTL, stored in DB (`password_reset_tokens`) |
| Frontend error capture | POST `/api/errors/frontend` → `error_logs` table |
| Dependency integrity | SECURITY_CHECK on startup |

### Known Security Gaps (Red Team Targets)

1. **In-memory password reset tokens** — `auth.ts` still has a `Map<string, {email, expiresAt}>` alongside the DB table; dual storage is inconsistent
2. **No email verification on registration** — users register and access immediately without verifying email ownership
3. **Admin session is simple string comparison** — not bcrypt-hashed session comparison
4. **Pool payment validation** — frontend payment flow is simplified; production needs PayPal JS SDK for checkout UI
5. **No refresh token rotation** — sessions are fixed-TTL, no sliding expiration
6. **`customer_profiles` table exists** but UI flows for verification (email OTP, SMS OTP) are schema-only — no endpoints yet

---

## 15. External Dependencies & Secrets

| Secret Name | Purpose | Status |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection | Required |
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | Individual PG vars | Required |
| `PAYPAL_CLIENT_ID` | PayPal API auth | Required |
| `PAYPAL_CLIENT_SECRET` | PayPal API auth | Required |
| `STRIPE_PUBLISHABLE_KEY` | Stripe frontend | Required |
| `STRIPE_SECRET_KEY` | Stripe backend | Required |
| `GOOGLE_API_KEY` | YouTube Data API (music catalog) | Required |
| `GOOGLE_ADSENSE_PUBLISHER_ID` | Google AdSense | Required for ads |
| `LotteryPro_Email` | Gmail App Password (russell@russellnomer.com) | Set April 2026 |
| `SENDGRID_API_KEY` | Legacy — no longer used | Not needed |
| `OPENAI_API_KEY` | Not currently integrated | Not set |
| `ADMIN_TOTP_SECRET` | Admin MFA — auto-generated if unset | Optional |

---

## 16. Pending / Partial Features

| Feature | Status | Gap |
|---|---|---|
| Email verification on registration | Schema exists (`email_verification_codes`) | No endpoints or UI |
| SMS verification | Schema exists (`sms_verification_codes`) | No SMS provider wired |
| Customer profile full flow | Schema + partial routes | No user-facing UI; `createCustomerProfile` throws in MemStorage |
| Draw reminder scheduling | Logic exists (`sendAllDrawReminders`) | No cron job — must be called manually |
| Pool winnings distribution | Schema + `pool_winnings` table | No admin UI for recording wins |
| Jackpocket conversion tracking | Clicks tracked | No conversion webhook from Jackpocket |
| CashApp integration | Mentioned in docs | No implementation |
| iOS/Android native app | Planned | Not started |
| State expansion beyond NY/PA | Framework ready | Data sources not identified for other states |
| Referral reward disbursement | Tracked | `bonus_generations` incremented but no automated flow |

---

## 17. Founder Account

A founder account is automatically verified and set to `admin`/`founder` tier on every server startup:

```
Email:    russell@russellnomer.com
Password: LP$h3rl0ck!!!$$$  (set programmatically in server/routes.ts startup)
Tier:     admin
```

---

## 18. Known Architectural Debt

1. **Dual storage pattern** — `MemStorage` for dev, `DatabaseStorage` for prod; some methods throw in MemStorage; production code paths differ
2. **`emailSendLog.sendGridMessageId` column** — legacy SendGrid field, now unused since switching to Nodemailer/Gmail
3. **`daily_spins` removed spin-to-win** — table and backend routes still exist; frontend widget was removed April 2026; backend cleanup pending
4. **Subscription tier mismatch** — PayPal plan IDs hardcoded; only `basic` plan ID confirmed; `pro` and `premium` plan IDs are placeholders
5. **`customer_profiles` risk_score** — field exists but scoring algorithm not implemented
6. **Blog posts are hardcoded** — no CMS; adding posts requires code deployment
7. **Performance tracking** — `prediction_results` are generated but the daily pick generation service (`dailyPickGenerationService.ts`) requires manual triggering; no automated scheduler

---

## 19. Suggested Red Team Questions for Co-Architects

1. **Security:** Is the VIP code flow (SHA-256 hash, 30-min TTL, email-bound) sufficient to prevent code sharing or brute-force? What's the attack surface?
2. **Revenue:** Is PayPal a reliable long-term payment solution for a lottery-adjacent product, or is there account ban risk? What's the Stripe vs PayPal split strategy?
3. **Email deliverability:** Sending transactional email from a personal Gmail account (`russell@russellnomer.com`) via App Password will hit Gmail's 500/day sending limit. What's the right path to production scale — Google Workspace Workspace SMTP relay, or a transactional provider?
4. **Regulatory:** What compliance exposure exists for collecting customer PII (name, address, mobile) in `customer_profiles` without completing CCPA/GDPR flows? The schema exists but verification + consent flows are incomplete.
5. **State expansion:** What is the best strategy for sourcing scratch-off prize data for the remaining 44 states — scraping, official APIs, or a data vendor?
6. **Scheduler:** The draw reminder system requires a cron trigger. What's the best approach for a Replit-hosted app — Replit's background workers, an external cron service, or something else?
7. **PWA vs native:** Given the target audience (lottery players, likely mobile-first), is PWA sufficient or should native iOS/Android be prioritized?
8. **Music funnel:** Is the current post-pick music placement creating friction in the core UX, or does it add perceived value? What conversion rate benchmarks apply?
9. **Lottery pool liability:** The admin fee structure (5–10%) for community pools — does this create legal/regulatory exposure as a money handler?
10. **Data model:** Is using `integer` (0/1) instead of PostgreSQL `boolean` for flags (`mfa_enabled`, `is_used`, etc.) a problem at scale, and should it be migrated?
