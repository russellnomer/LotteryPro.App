# LotteryPro Commercial Mobile Platform

## Overview

LotteryPro is a full-stack web application designed for educational lottery number analysis for Powerball and MegaMillions. It is evolving into a commercial mobile platform with a subscription-based revenue model, community features, and potential integrations like Jackpocket. The platform emphasizes educational transparency, providing legal disclaimers and focusing on lottery study and entertainment rather than performance claims. Its business vision includes mobile app development, freemium access with advertising, and fostering community engagement.

## User Preferences

Preferred communication style: Simple, everyday language.

ASCAP Membership Requirements:
- Russell Nomer is an ASCAP member (Performance Rights Organization)
- Cannot use TIDAL streaming platform due to ASCAP restrictions
- Must leverage ASCAP membership for entertainment industry networking
- Focus on connecting with show runners, producers, decision makers for music placement opportunities
- Preferred streaming platforms: Apple Music (best payout), Spotify, YouTube Russell Nomer Topic Channel

## System Architecture

### UI/UX Decisions
The platform features a responsive, mobile-first design using `shadcn/ui` components (built on `Radix UI`) and `Tailwind CSS` with custom CSS variables for theming. Custom `Chart.js` integrations provide frequency visualizations. Advertising spaces are integrated for free users, while paid subscribers enjoy an ad-free experience. SEO is managed with `SEOHead` component for dynamic meta tags, `Google Tag Manager` for analytics, and a blog section for content. The application is also a Progressive Web App (PWA).

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Vite, Wouter for routing, and TanStack Query for state management.
- **Backend**: Node.js with Express.js and TypeScript, utilizing Drizzle ORM with Neon serverless PostgreSQL. A RESTful API facilitates communication.
- **Database**: PostgreSQL with Drizzle ORM, storing lottery data, user accounts, sessions, and various feature-related data. JSONB fields are used for flexible data storage, and UUID primary keys are implemented. `userAccounts.homeState` stores the user's US state.
- **Core Services**: Includes automated real-time lottery data fetching, statistical analysis (frequency, hot/cold numbers), multiple number generation algorithms, prediction tracking, and performance analytics. A historical tracking system enables automated daily pick generation and win/loss analysis.
- **Authentication**: Secure user registration and login with bcrypt hashing, Google Authenticator TOTP-based MFA, and secure token-based session management.
- **Advertising**: `AdSpace` component integrated with Google AdSense.
- **Data Flow**: Manages pre-seeded historical data, an analysis pipeline, user interaction for number generation, automated prediction tracking, and performance reporting.
- **Commercial Features**: Includes Jackpocket affiliate integration with click tracking, a daily Spin-to-Win gamification feature, SendGrid-integrated email notification system, and a referral program.
- **Community Lottery Pools**: Implemented as a "Syndicate Tracker" model where LotteryPro does not handle payments. Users create pools, invite members, and log off-platform contributions.
- **Multi-State Framework**: Supports state-specific data and features, with a `stateConfig.ts` defining data status and game lists for various states. Prohibited states are flagged.
- **State-Aware Scratch-Off Helper**: Provides real-time scratch-off prize data for states with public APIs (e.g., NY, PA) and civic advocacy content for others.
- **Security Hardening**: Compliance with OWASP, CIS, ISACA, Security Forum, and NIST frameworks, including security headers, rate limiting, and input sanitization.
- **Admin Dashboard**: For VIP code generation, user tier management, security auditing, and user creation.
- **iOS Platform**: Supports Apple In-App Purchases (StoreKit 2) for subscriptions and adheres to Apple's design guidelines for app icons and splash screens.
- **One-Time Purchases**: Implemented via Stripe Checkout for credit packs and day passes.

### Feature Specifications
- **Lottery Data Service**: Automatically fetches and maintains current lottery results, ensuring statistically significant sampling for analysis.
- **Educational Dataset**: Utilizes a comprehensive dataset of over 7,600 historical Powerball and MegaMillions draws for educational frequency study.
- **MFA Implementation**: Comprehensive Multi-Factor Authentication using Google Authenticator TOTP.
- **Civic Advocacy Feature**: For states without public scratch-off data, it provides information, a pre-written letter template for civic engagement, and links to find representatives.

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database.
- **PostgreSQL**: Used for session storage.

### Frontend Libraries
- **Radix UI**: Headless UI components.
- **Tailwind CSS**: Utility-first CSS framework.
- **Chart.js**: Data visualization library.
- **TanStack Query**: Server state management and caching.

### Development Tools
- **Vite**: Fast development server and build tool.
- **TypeScript**: For type safety.

### Payment Processing
- **PayPal SDK**: For payment processing.
- **Stripe**: For one-time purchases (credit packs, day passes).
- **Apple In-App Purchase (StoreKit 2)**: For iOS subscriptions.

### Third-Party Services
- **SendGrid**: For email notifications.
- **Google AdSense**: For advertising.
- **Jackpocket**: Affiliate integration.
- **Google Tag Manager**: For analytics and tracking.
- **data.ny.gov**: For NY scratch-off data.
- **palottery.pa.gov**: For PA scratch-off data (scraped).