# SEO Strategy — LotteryPro

## Site overview
LotteryPro is an educational lottery statistical analysis platform for Powerball and MegaMillions. It targets US adults (18+) who want data-driven number analysis. The app is monetized via freemium subscriptions and advertising.

## Rendering mode
**Pure SPA** — React 18 + Wouter + Vite. All routing is client-side. Metadata is injected by `react-helmet-async` (browser-only). The static HTML shell (`client/index.html`) contains home-page-level OG/Twitter tags; per-route metadata is invisible to social crawlers, AI crawlers, and Googlebot's first HTML pass.

## Canonical domain
`https://lotterypro.app`

## In scope
- Public marketing pages: `/`, `/pricing`, `/blog`, `/blog/:slug`, `/scratch-offs`, `/performance`, `/pools`, `/music`, `/books`, `/support`, `/privacy`, `/terms`, `/accessibility`
- SEO-priority pages: `/powerball/hot-numbers`, `/megamillions/hot-numbers`

## Out of scope
- Authenticated pages (`/auth`, `/admin`, `/checkout-success`) — these are expected to be SPA-only
- Internal tools, god-mode admin routes

## Target audience
US adults (18+) interested in lottery statistics, number frequency analysis, scratch-off data, and educational lottery tools.

## Primary keywords
- Powerball hot numbers, Mega Millions hot numbers
- Lottery number analysis, lottery frequency analysis
- Scratch-off prize data
- Statistical lottery picks

## Dismissed categories
- (None yet)
