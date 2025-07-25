# Lottery Number Generator App

## Overview

This is a full-stack web application for generating lottery numbers for Powerball and MegaMillions using statistical analysis. The app performs frequency analysis on historical lottery data and provides multiple generation methods including hot numbers, balanced selection, and wheel systems.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- Uses JSONB fields for flexible number array storage
- UUID primary keys with PostgreSQL's gen_random_uuid()

#### Core Services
- **Storage Layer**: Abstracted storage interface with in-memory fallback
- **Lottery Analysis**: Frequency analysis, hot/cold number detection, wheel system generation
- **Number Generation**: Multiple algorithms (hot numbers, balanced, wheel systems)

#### Frontend Pages
- **Home Page**: Main interface with game selection, method selection, and number generation
- **Not Found**: 404 error handling

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

The application follows a monorepo structure with shared types and schemas, enabling type safety between frontend and backend while maintaining clear separation of concerns.