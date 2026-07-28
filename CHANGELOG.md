# Changelog

## [Unreleased]

### Fixed
- **[Task #83] SSR meta-tag injection for social/AI crawlers** — All per-route `<title>`, `<meta description>`, Open Graph, Twitter Card, and JSON-LD structured data were previously injected by `react-helmet-async` (client-side only), making them invisible to social preview bots (Facebook, Twitter/X, LinkedIn, WhatsApp) and AI crawlers (GPTBot, ClaudeBot, PerplexityBot).

  **Approach:** Added lightweight SSR meta-tag injection via `server/ssrShell.ts`. Express routes registered before Vite's SPA catch-all read `client/index.html`, replace the `<!-- SSR_META_START/END -->` sentinel block with per-route tags, and return the modified HTML. React hydrates normally — no changes to client behaviour.

  **Routes now SSR-injected:**
  - `/blog/:slug` — Article JSON-LD + post-specific title, description, og:image fetched live from DB
  - `/blog` — Blog listing page with Blog schema JSON-LD
  - `/powerball/hot-numbers` — WebPage JSON-LD + game-specific meta
  - `/megamillions/hot-numbers` — WebPage JSON-LD + game-specific meta
  - `/pricing` — Product schema JSON-LD with Free & Premium offer objects
  - `/scratch-offs` — WebPage JSON-LD + daily-updated feature page meta

  **Files changed:** `client/index.html`, `server/ssrShell.ts` (new), `server/index.ts`
