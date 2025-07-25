# LotteryPro Commercial Mobile Platform

## Overview

This is a full-stack web application for generating lottery numbers for Powerball and MegaMillions using statistical analysis. The project is evolving from a basic prediction tool into a commercial mobile platform with subscription-based community features, revenue generation for Russell Nomer, and potential Jackpocket integration. The system now emphasizes statistical transparency and honest disclaimers following comprehensive analysis of performance claims.

## User Preferences

Preferred communication style: Simple, everyday language.

## Commercial Development Goals (Russell Nomer)

- Mobile app development for iOS and Android distribution
- ✅ Subscription-based revenue model with community features (implemented)
- ✅ PayPal payment integration (implemented with sandbox environment)
- ✅ Freemium model with advertising integration (implemented)
- ✅ Daily usage limits for free tier users (implemented)
- CashApp payment integration
- Jackpocket integration for ticket purchasing
- Community pooling and resource sharing features
- Administrative fee structure for ongoing revenue generation

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite with custom configuration
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Charts**: Custom Chart.js integration for frequency visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon serverless PostgreSQL
- **API Pattern**: RESTful endpoints with JSON responses
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple

### Key Components

#### Database Schema (shared/schema.ts)
- **lottery_draws**: Stores historical lottery draw data with game type, dates, numbers, and jackpot info
- **generated_tickets**: Tracks user-generated number combinations with metadata
- **prediction_results**: Tracks performance of predictions against actual draws with match counts and prize levels
- **performance_stats**: Aggregated performance metrics by game, method, and time period
- **user_accounts**: User authentication with email, password hash, subscription tiers, MFA secrets and backup codes
- **user_sessions**: Secure session management with MFA verification tracking and expiration
- **sessions**: PostgreSQL-backed user sessions for database connectivity
- Uses JSONB fields for flexible number array storage and MFA backup codes
- UUID primary keys with PostgreSQL's gen_random_uuid()

#### Core Services
- **Storage Layer**: PostgreSQL database with Drizzle ORM, automated data seeding
- **Lottery Analysis**: Frequency analysis, hot/cold number detection, wheel system generation
- **Number Generation**: Multiple algorithms (hot numbers, balanced, wheel systems)
- **Prediction Tracking**: Automatic evaluation of predictions against actual draws
- **Performance Analytics**: Statistical analysis for marketing and system improvement
- **Authentication System**: Secure user registration, login with bcrypt password hashing
- **MFA Service**: Google Authenticator TOTP integration with QR code generation and backup codes
- **Session Management**: Secure token-based sessions with MFA verification requirements

#### Frontend Pages
- **Home Page**: Main interface with game selection, method selection, number generation, advertising spaces, and daily usage tracking
- **Performance Page**: Marketing-focused analytics dashboard showing track record and method comparison
- **Subscription Page**: PayPal-integrated subscription plans with four tiers (Free, Basic, Pro, Premium) 
- **Authentication Page**: Complete MFA-enforced registration/login with Google Authenticator setup and educational content
- **Not Found**: 404 error handling

#### Advertising Integration
- **AdSpace Component**: Flexible advertising component supporting multiple sizes (banner, square, rectangle, leaderboard)
- **Google AdSense Integration**: Production-ready AdSense with secure server-side Publisher ID handling
- **Development Testing**: AdSense configured for development environment testing with domain approval workflow
- **Strategic Ad Placement**: Header, mid-content, sidebar, and footer advertising spaces for free users
- **Ad-Free Experience**: All paid subscribers enjoy completely ad-free interface
- **Security Focus**: Zero client-side credential exposure, all sensitive data handled server-side

#### UI Components
- Complete shadcn/ui component library
- Custom Chart component for frequency visualization
- Responsive design with mobile-first approach

## Data Flow

1. **Historical Data**: Pre-seeded with July 2025 lottery results for both games
2. **Analysis Pipeline**: 
   - Fetch historical draws from storage
   - Calculate frequency analysis (hot/cold numbers)
   - Generate numbers based on selected method
3. **User Interaction**:
   - Select game (Powerball/MegaMillions)
   - Choose generation method (hot/balanced/wheel)
   - View generated numbers and frequency charts
   - Save generated tickets to database
4. **Prediction Tracking**:
   - Automatically evaluate predictions when new draws are added
   - Calculate accuracy, matches, and estimated prize levels
   - Update performance statistics for marketing analytics
5. **Performance Reporting**:
   - Generate method comparison analytics
   - Calculate improvement over random selection
   - Display recent wins and track record for marketing
6. **User Tier Management**: 
   - Track daily usage limits for free users
   - Display advertising content based on subscription level
   - Enforce feature restrictions and upgrade prompts

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection**: Via DATABASE_URL environment variable
- **Session Store**: PostgreSQL-backed user sessions

### Frontend Libraries
- **Radix UI**: Headless UI components for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Chart.js**: Data visualization for frequency analysis
- **TanStack Query**: Server state management and caching

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the stack
- **ESBuild**: Fast JavaScript bundler for production

### Payment Processing
- **PayPal SDK**: @paypal/paypal-server-sdk for payment processing
- **Environment**: Sandbox for development, production for live payments
- **Features**: Order creation, payment capture, client token generation

## Deployment Strategy

### Development
- **Script**: `npm run dev` - runs Express server with tsx
- **Hot Reload**: Vite middleware integrated with Express
- **Database**: Drizzle migrations via `npm run db:push`

### Production Build
- **Frontend**: Vite builds to `dist/public`
- **Backend**: ESBuild bundles server to `dist/index.js`
- **Start**: `npm start` runs the production bundle
- **Environment**: NODE_ENV controls development vs production features

### Configuration
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)
- **TypeScript**: Strict mode with comprehensive type checking
- **PostCSS**: Tailwind CSS processing with autoprefixer

## Recent Changes (January 2025)

- ✅ Implemented comprehensive freemium model with advertising integration
- ✅ Added Free tier (1 generation/day) with strategic advertising placement
- ✅ Created AdSpace component system for Google AdSense and custom banner ads
- ✅ Implemented daily usage tracking and limits using localStorage
- ✅ Added upgrade prompts and subscription conversion funnels
- ✅ Enhanced subscription page with four tiers including free option
- ✅ Integrated ad-free experience for all paid tiers
- ✅ Added tier switcher for testing different user experiences
- ✅ **SECURITY AUDIT COMPLETE**: Eliminated all API/credential exposure risks
- ✅ **MFA IMPLEMENTATION**: Force Multi-Factor Authentication for all subscribers
- ✅ **GOOGLE AUTHENTICATOR INTEGRATION**: TOTP-based 6-digit codes (no push notifications)
- ✅ **SECURE DEVELOPMENT ADS**: AdSense configured for both development and production testing
- ✅ **INDUSTRY COMPLIANCE**: Full compliance with OWASP, CIS, ISACA, Security Forum, and NIST frameworks
- ✅ **COMPREHENSIVE SECURITY HARDENING**: Defense-in-depth implementation with security headers, rate limiting, input sanitization, and audit logging

The application follows a monorepo structure with shared types and schemas, enabling type safety between frontend and backend while maintaining clear separation of concerns.