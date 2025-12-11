# LotteryPro Design Guidelines

## Design Approach
**Hybrid System**: Modern SaaS aesthetic inspired by Stripe's professionalism + Linear's clean data presentation + Vercel's sophisticated simplicity. This approach balances trust-building visuals with efficient data-heavy interfaces for lottery analysis.

## Typography System
- **Primary Font**: Inter (Google Fonts) - all UI, body text, data displays
- **Accent Font**: Playfair Display (Google Fonts) - headlines, hero sections only
- **Scale**: text-sm (12px), text-base (16px), text-lg (18px), text-xl (20px), text-2xl (24px), text-4xl (36px), text-6xl (60px)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Hierarchy**: Hero headlines (text-6xl bold Playfair), section headers (text-4xl semibold Inter), card titles (text-xl semibold), body (text-base regular)

## Layout System
**Spacing Units**: Use Tailwind units of 4, 6, 8, 12, 16, 20, 24, 32
- Sections: py-20 to py-32 (desktop), py-12 to py-16 (mobile)
- Cards: p-6 to p-8
- Containers: max-w-7xl for full-width sections, max-w-4xl for content
- Grid gaps: gap-6 to gap-8

## Component Library

### Navigation
- **Header**: Sticky navigation with logo left, main nav center (Home, Features, Pricing, Community, Support), CTA button right
- Add trust indicator: "Trusted by 50,000+ players" subtle badge in header
- Mobile: Slide-out menu with backdrop blur

### Hero Section (Landing)
- **Large hero image**: Professional lottery balls/analysis visualization with gradient overlay
- Layout: Full-width hero (min-h-[600px]), text overlay left-aligned or centered
- Content: Headline (text-6xl Playfair), subheadline (text-xl), dual CTA buttons (primary "Start Free Trial" + secondary "Watch Demo")
- Buttons on image: backdrop-blur-md with semi-transparent backgrounds for contrast

### Pricing Cards
- Three-column grid (lg:grid-cols-3, md:grid-cols-1)
- Card structure: Tier name, price (text-4xl bold), billing cycle, feature list with checkmark icons (Heroicons), CTA button
- Pro tier: Elevated with border highlight and "Most Popular" badge
- Spacing: p-8, gap-6 between features

### Community Pools Section
- Grid layout: lg:grid-cols-2 xl:grid-cols-3 for pool cards
- Each card: Pool name, participants count, jackpot amount (large text-2xl), join button, status indicator
- Include filtering/sorting controls at top

### Educational Content
- Two-column layout: Article list left (grid-cols-1 md:grid-cols-2), featured content right
- Article cards: Thumbnail image, title, excerpt, read time, category tag

### Admin Dashboard
- **Sidebar navigation**: Fixed left sidebar (w-64), main content area fluid
- Sidebar: Logo top, navigation links with icons (Heroicons), user profile bottom
- Dashboard widgets: Stats cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-4), charts, data tables
- Tables: Striped rows, hover states, action buttons column-right

### Support Ticket System
- Ticket list: Table format with status badges, priority indicators, timestamp
- Ticket detail: Two-column (ticket info left, conversation thread right)
- Form: Standard input fields (p-3), textarea for description, file upload area

### Footer
- Four-column grid: Company info + Product links + Legal links + Newsletter signup
- Newsletter: Email input with inline submit button
- Social icons (Heroicons), copyright, trust badges (secure payments)

## Page-Specific Layouts

### Landing Page Sections
1. Hero with large image
2. Trust indicators (stats row: 4 columns with numbers)
3. Features showcase (3-column cards with icons)
4. How it works (alternating image-text rows)
5. Testimonials (3-column grid)
6. Pricing preview (condensed 3-tier display)
7. Final CTA (centered with background image blur treatment)

### Legal Pages
- Single column, max-w-4xl, generous py-16
- Structured with clear h2/h3 hierarchy, readable line-height (leading-relaxed)

## Icons & Assets
**Icon Library**: Heroicons (CDN) exclusively
- Navigation: home, chart-bar, credit-card, users, support icons
- Features: check-circle, star, shield, lightning-bolt
- UI actions: x-mark, chevron-down, bars-3

## Images
**Required Images**:
1. **Hero (Landing)**: Large professional image (1920x800) showing lottery analysis dashboard visualization or abstract number patterns with sophisticated treatment - full bleed with gradient overlay
2. **Features section**: 3 supporting images (600x400) - community interaction, data charts, educational content
3. **How it works**: 2-3 process images (800x600) showing platform usage
4. **Testimonial avatars**: Placeholder profile images
5. **Admin dashboard**: Charts/graphs as visual elements within widgets

**Placement**: Hero full-width, feature images within cards, alternating sides for how-it-works section

## Animations
Minimal and purposeful:
- Subtle fade-in on scroll for cards
- Button hover: slight scale (transform scale-105)
- Card hover: shadow elevation increase
- No complex scroll-driven animations

## Key Design Principles
1. **Trust First**: Clean layouts, ample whitespace, professional imagery
2. **Data Clarity**: Clear typography hierarchy in tables/charts, consistent spacing
3. **Guided Actions**: Prominent CTAs, clear visual hierarchy directing user flow
4. **Responsive Rigor**: Mobile-first grid systems, collapsible navigation, stacked layouts