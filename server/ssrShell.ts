/**
 * ssrShell.ts
 * -----------
 * Lightweight SSR meta-tag injection for high-value public pages.
 *
 * Problem: LotteryPro is a pure React SPA. Social preview bots (Facebook,
 * Twitter/X, LinkedIn, WhatsApp) and AI crawlers (GPTBot, ClaudeBot,
 * PerplexityBot) do NOT execute JavaScript — they only see client/index.html.
 * So react-helmet-async tags are invisible to them.
 *
 * Solution: For the highest-impact routes, an Express handler runs BEFORE
 * Vite's catch-all. It reads index.html, replaces the block between
 * SSR_META_START / SSR_META_END comments with route-specific meta tags, and
 * serves the modified HTML. Regular users receive the same HTML — React
 * hydrates normally and react-helmet-async updates tags after mount.
 *
 * Why NOT full React SSR:
 * - Requires bundling server-side React, doubles build complexity.
 * - Meta-tag injection is sufficient for crawler needs and zero risk.
 *
 * AI/human time: ~1.5h AI, 0h human
 */

import fs from "fs";
import path from "path";

// ── Template cache ────────────────────────────────────────────────────────────
// In production the built file never changes, so cache it after first read.
// In development Vite serves transforms on every request, so we skip caching.
let _cachedTemplate: string | null = null;

/**
 * Reads the HTML template from disk.
 * Dev  → client/index.html (Vite transforms it on the fly)
 * Prod → server/public/index.html (built by Vite)
 */
function readTemplate(): string {
  if (_cachedTemplate && process.env.NODE_ENV === "production") {
    return _cachedTemplate;
  }

  const isProd = process.env.NODE_ENV === "production";
  const templatePath = isProd
    ? path.resolve(import.meta.dirname, "public", "index.html")
    : path.resolve(import.meta.dirname, "..", "client", "index.html");

  const content = fs.readFileSync(templatePath, "utf-8");
  if (isProd) _cachedTemplate = content;
  return content;
}

// ── Meta block builder ────────────────────────────────────────────────────────

interface PageMeta {
  /** Full page title — will be rendered as "<title>{title}</title>" */
  title: string;
  /** Meta description (≤ 160 chars recommended) */
  description: string;
  /** Canonical URL, e.g. "https://lotterypro.app/pricing" */
  canonical: string;
  /** OG type: "website" | "article" */
  ogType?: string;
  /** Absolute URL to the OG image (1200×630 recommended) */
  ogImage?: string;
  /** Optional Article JSON-LD object. When provided it is serialised as
   *  <script type="application/ld+json"> inside <head>. */
  jsonLd?: object;
}

/**
 * Escapes a string for safe use inside an HTML attribute value.
 * Only the characters that break attribute values need escaping.
 */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Serialises a value to JSON that is safe for embedding inside an HTML
 * <script> tag (i.e. inside a JSON-LD block).
 *
 * JSON.stringify alone is NOT sufficient: a value containing the string
 * "</script>" would break out of the script element and allow stored XSS.
 * We also escape U+2028 / U+2029 which are valid JSON string characters but
 * terminate JavaScript string literals.
 *
 * Encoding table (applied AFTER JSON.stringify so only string delimiters and
 * JSON structural characters are affected — the JSON is still valid):
 *   <  →  \u003c
 *   >  →  \u003e
 *   &  →  \u0026
 *   U+2028 → \u2028
 *   U+2029 → \u2029
 *
 * This is the same strategy used by Next.js for serialising server-side props.
 */
function safeJsonStringify(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Builds the meta tag block that replaces the SSR_META_START/END sentinel.
 */
function buildMetaBlock(meta: PageMeta): string {
  const image = meta.ogImage ?? "https://lotterypro.app/og-default.png";
  const ogType = meta.ogType ?? "website";

  const jsonLdTag = meta.jsonLd
    ? `\n    <script type="application/ld+json">${safeJsonStringify(meta.jsonLd)}</script>`
    : "";

  return `<!-- SSR_META_START -->
    <title>${esc(meta.title)}</title>
    <meta name="description" content="${esc(meta.description)}" />
    <link rel="canonical" href="${esc(meta.canonical)}" />
    <meta property="og:title" content="${esc(meta.title)}" />
    <meta property="og:description" content="${esc(meta.description)}" />
    <meta property="og:type" content="${esc(ogType)}" />
    <meta property="og:url" content="${esc(meta.canonical)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="LotteryPro" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(meta.title)}" />
    <meta name="twitter:description" content="${esc(meta.description)}" />
    <meta name="twitter:image" content="${esc(image)}" />${jsonLdTag}
    <!-- SSR_META_END -->`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a complete HTML string with per-route meta tags injected.
 * Falls back to the unmodified template if the SSR markers are not found
 * (e.g. during a dev build that hasn't been saved yet).
 */
export function renderWithMeta(meta: PageMeta): string {
  const template = readTemplate();
  const metaBlock = buildMetaBlock(meta);

  // Replace everything between (and including) the two comment markers.
  const replaced = template.replace(
    /<!-- SSR_META_START -->[\s\S]*?<!-- SSR_META_END -->/,
    metaBlock
  );

  // If the markers weren't found the regex has no match and `replaced === template`.
  // That's acceptable — the SPA still loads, crawlers just see the home-page defaults.
  return replaced;
}
