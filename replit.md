# LotteryPro Commercial Mobile Platform

## Overview

LotteryPro is a full-stack web application designed for educational lottery number analysis for Powerball and MegaMillions. It is evolving into a commercial mobile platform featuring subscription-based community features, revenue generation, and potential integrations like Jackpocket. The system emphasizes educational transparency and provides prominent legal disclaimers clarifying that it makes no performance claims. Its purpose is to serve as an educational platform for lottery study and entertainment.

## User Preferences

Preferred communication style: Simple, everyday language.

**ASCAP Membership Requirements:**
- Russell Nomer is an ASCAP member (Performance Rights Organization)
- Cannot use TIDAL streaming platform due to ASCAP restrictions
- Must leverage ASCAP membership for entertainment industry networking
- Focus on connecting with show runners, producers, decision makers for music placement opportunities
- Preferred streaming platforms: Apple Music (best payout), Spotify, YouTube Russell Nomer Topic Channel

## System Architecture

### UI/UX Decisions
The platform features a responsive design with a mobile-first approach, utilizing `shadcn/ui` components built on `Radix UI` for accessibility. Styling is managed with `Tailwind CSS` and custom CSS variables for theming, ensuring a consistent and customizable visual experience. Custom `Chart.js` integration is used for frequency visualization. Advertising spaces are strategically placed for free users, while paid subscribers enjoy an ad-free experience.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Vite bundler, Wouter for routing, TanStack Query for state management.
- **Backend**: Node.js with Express.js, TypeScript, Drizzle ORM with Neon serverless PostgreSQL, RESTful API.
- **Database**: PostgreSQL with Drizzle ORM, using `lottery_draws`, `generated_tickets`, `prediction_results`, `performance_stats`, `user_accounts`, `user_sessions`, and `sessions` tables. JSONB fields store flexible data like number arrays and MFA backup codes. UUID primary keys are used.
- **Core Services**: Includes automated real-time lottery data fetching, statistical analysis (frequency, hot/cold numbers), multiple number generation algorithms (hot numbers, balanced, wheel systems), prediction tracking, and performance analytics. **Historical Tracking System**: Automated daily pick generation for all methods (Hot, Balanced, Wheel, Random, Advanced, Numerology, Real-time), one-to-one ticket-to-draw matching with deduplication, and comprehensive win/loss analysis at multiple spending levels ($2, $10, $20, $50 per draw).
- **Authentication**: Secure user registration, login with bcrypt password hashing, Google Authenticator TOTP-based MFA with QR code generation and backup codes, and secure token-based session management.
- **Advertising**: `AdSpace` component supporting various sizes, integrated with Google AdSense for production and development testing.
- **Data Flow**: Involves pre-seeded historical data, an analysis pipeline, user interaction for number generation and ticket saving, automated prediction tracking, and performance reporting. User tier management enforces daily usage limits and displays appropriate content.

### Feature Specifications
- **Commercial Development Goals**: Mobile app development (iOS/Android), subscription-based revenue model, PayPal and CashApp integration, freemium model with daily usage limits and advertising, Jackpocket integration, community pooling, and administrative fee structure.
- **MFA Implementation**: Comprehensive Multi-Factor Authentication for all subscribers, using Google Authenticator TOTP.
- **Security Hardening**: Full compliance with OWASP, CIS, ISACA, Security Forum, and NIST frameworks, including security headers, rate limiting, input sanitization, and audit logging.
- **Admin Dashboard**: Comprehensive administrative interface for VIP code generation, user tier management, security auditing, and user creation.
- **Lottery Data Service**: Automatically fetches and maintains current lottery results, ensuring statistically significant sampling (30-100 draw samples) for analysis.
- **Educational Dataset**: Comprehensive dataset analysis (5,066 Powerball, 2,601 MegaMillions draws) covering 5+ years historically for educational frequency study.
- **Analysis Scope**: 7,667 total draws analyzed spanning June 2022 - September 2025
- **Educational Value**: Large sample size provides statistically significant data for educational analysis purposes
- **Study Scope**: Comprehensive historical analysis for educational lottery number frequency patterns

### Revenue Generation Features (October 2025)

**1. Jackpocket Affiliate Integration** ✅
- Prominent CTA button on number generation results
- Full click tracking with database logging (user/session/IP)
- API endpoint `/api/affiliate/track` for conversion monitoring
- Database table: `jackpocket_affiliate_clicks`

**2. Daily Spin-to-Win Gamification** ✅
- Animated spinning wheel with 8 weighted prize segments
- Prizes: 3 free picks (5%), 1 free (25%), 2 free (15%), 10% discount (15%), 7-day trial (8%), try again (30%), bonus (2%)
- Race condition protection via database unique constraints on userId/sessionId + spinDate
- Streak tracking and countdown timer
- API endpoints: `/api/spin/status`, `/api/spin/daily`
- Database table: `daily_spins`

**3. Email Notification System** ✅
- SendGrid integration with draw day reminder templates
- Scheduled reminders: Powerball (Mon/Wed/Sat), MegaMillions (Tue/Fri)
- Subscription management (subscribe, unsubscribe, preferences)
- API endpoints: `/api/email/subscribe`, `/api/email/preferences/:email`, `/api/email/unsubscribe`
- Database tables: `email_preferences`, `email_send_log`
- Note: Requires SENDGRID_API_KEY to activate (currently logs to console)

**4. Community Lottery Pools** ✅
- Pool creation with authentication requirement, 5-10% admin fee validation, minimum $5 contribution
- PayPal payment integration (create order → capture payment → update financials)
- Payment validation ensures captured amount matches expected contribution
- Admin fee automatically calculated and tracked (default 7.5%)
- Pool management: browsing, creating, joining, member tracking
- Ticket generation for pools using analysis engine
- API endpoints: `/api/pools`, `/api/pools/:id`, `/api/pools/create`, `/api/pools/:id/join`, `/api/pools/:id/create-payment`, `/api/pools/:id/capture-payment`, `/api/pools/:id/generate-tickets`
- Database tables: `lottery_pools`, `pool_members`, `pool_tickets`, `pool_transactions`, `pool_winnings`
- Frontend: `/pools` page with create/join/payment UI
- Known limitation: Frontend payment flow is simplified for development; production should use PayPal JS SDK for checkout UI

**5. Referral Program** ✅
- Automatic referral code generation (`RUSSELL` + timestamp)
- Social sharing (Twitter, Facebook, LinkedIn)
- Reward system: 3 free number generations per successful referral
- Referral tracking and stats dashboard
- API endpoints: `/api/referral/my-code`, `/api/referral/track`, `/api/referral/stats`
- Database table: `referral_codes`
- Frontend: `ReferralWidget` component with copy-to-clipboard and social share buttons

### SEO & Analytics (February 2026)

**6. NY Scratch-Off Helper** ✅
- Real-time prize data from official NY State Open Data API (`data.ny.gov/resource/nzqa-7unk.json`)
- Fetches all 110+ active NY scratch-off games with remaining prize tiers
- Calculates: total remaining prize pool, big prizes left ($10K+), value scores, % remaining
- Rank system: Top Pick / Good Value / Fair / Low Value based on prize math
- Filters: search by name, max price slider, min big prizes slider, category, sort-by
- Expandable prize tier table per game showing all prize levels
- 1-hour cache to avoid hammering the state API
- Route: `/scratch-offs` | Service: `server/scratchOffService.ts` | API: `GET /api/scratchoffs`
- Navigation: "Scratch-Off Helper" added as second nav item

**1. Open Graph & Twitter Card Meta Tags** ✅
- `SEOHead` component using `react-helmet-async` for per-page dynamic meta tags
- OG and Twitter Card tags on 8 major pages (home, music, subscription, pools, performance, privacy, terms, auth)
- Default fallback tags in `index.html`
- Domain: `https://lotterypro.app`

**2. Google Tag Manager Integration** ✅
- GTM container ID: `GTM-P3JTF25N`
- Script in `<head>` and noscript iframe after `<body>`
- Custom dataLayer events via `client/src/lib/analytics.ts`:
  - `spin_wheel`, `number_generation`, `subscription_view`, `subscription_click`
  - `referral_share`, `pool_join`, `music_play`, `virtual_page_view`
- Tracking wired into: SpinWheel, subscription page, ReferralWidget, home page generation

**3. SEO Blog Section** ✅
- Routes: `/blog` (index), `/blog/:slug` (individual posts)
- 4 educational posts: frequency analysis, odds comparison, pool guide, generation methods
- Internal CTAs linking to app features
- Blog link in main navigation

**4. Progressive Web App (PWA)** ✅
- `manifest.json` with standalone display, indigo theme (#6366f1)
- Service worker (`sw.js`) with network-first caching (skips API routes)
- `PWAInstallPrompt` component: shows after 3+ visits, dismissable for 7 days
- Apple mobile web app meta tags
- Registered in `main.tsx`

**5. One-Time Purchases via Stripe** ✅
- Credit packs: 10 credits/$4.99, 25/$9.99, 50/$17.99
- 24-hour day pass: $2.99
- Stripe Checkout (one-time payment mode)
- API endpoints: `/api/purchases/create-checkout`, `/api/purchases/verify/:sessionId`, `/api/purchases/my-credits`
- Database table: `one_time_purchases`
- UI in subscription page under "Quick Access Packs" section
- Auto-verification on success redirect with `{CHECKOUT_SESSION_ID}`

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database, connected via `DATABASE_URL` environment variable.
- **PostgreSQL**: Used as the session store for user sessions.

### Frontend Libraries
- **Radix UI**: Headless UI components.
- **Tailwind CSS**: Utility-first CSS framework.
- **Chart.js**: Data visualization library.
- **TanStack Query**: Server state management and caching.

### Development Tools
- **Vite**: Fast development server and build tool.
- **TypeScript**: For type safety across the stack.
- **ESBuild**: Fast JavaScript bundler for production builds.

### Payment Processing
- **PayPal SDK**: `@paypal/paypal-server-sdk` for payment processing, configured for both sandbox (development) and production environments.