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