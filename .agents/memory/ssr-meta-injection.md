---
name: SSR meta injection pattern
description: How per-route OG/JSON-LD is injected into the SPA shell for crawlers without full React SSR
---

## Pattern

`client/index.html` wraps the replaceable `<head>` meta block with sentinel comments:

```html
<!-- SSR_META_START -->
<title>...</title>
... OG / Twitter / canonical tags ...
<!-- SSR_META_END -->
```

`server/ssrShell.ts` exports `renderWithMeta(PageMeta)` which reads the template, regex-replaces the entire sentinel block with per-route tags, and returns the full HTML string.

Express routes registered in `server/index.ts` BEFORE `registerRoutes()` and before Vite's catch-all call `renderWithMeta()` and `res.end(html)`.

**Why:** Social/AI crawlers don't execute JS, so react-helmet-async tags are invisible. Full React SSR would require bundling server-side React — this approach is zero-risk, build-free, and sufficient for crawler needs.

**How to apply:**
- Add a new SSR route by calling `renderWithMeta({ title, description, canonical, ogType, ogImage, jsonLd })` in a route handler before `registerRoutes(app)` in `server/index.ts`.
- For dynamic routes (e.g. `/blog/:slug`), query the DB inside the handler; fall through via `next()` if the record is not found so the SPA renders its 404.
- Template caching: in production the file is cached after first read; in development it re-reads on every request so Vite HMR changes are reflected.
- The sentinel regex is `/<!-- SSR_META_START -->[\s\S]*?<!-- SSR_META_END -->/` — it must remain in `client/index.html` or injection silently no-ops (template is returned unmodified).
