import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { injectAdSenseId } from "./middleware/adsense";
import { 
  securityHeaders, 
  apiRateLimit, 
  sanitizeInput, 
  securityLogger, 
  sessionSecurity,
  secureErrorHandler,
  validateDependencyIntegrity
} from "./middleware/security";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync, isStripeIntegrationAvailable } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';
import { sendAllDrawReminders } from './emailService';
import { startWatchdog } from './watchdog';
import { processDripEmails } from './dripService';
import { storage } from './storage';
import './scratchOffService'; // ensures gap detector starts at process boot (not on first lazy import)

declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
  }
}

const app = express();

// Trust Replit's reverse proxy so rate-limiting and IP detection work correctly
app.set('trust proxy', 1);

// ── Production HTTPS redirect ──
// Replit's reverse proxy sets x-forwarded-proto. In production, redirect any
// plain-HTTP request to HTTPS. No redirect in development (avoids localhost loops).
// Allowlist guards against open-redirect via a crafted Host header.
const ALLOWED_HTTPS_HOSTS = new Set([
  'lotterypro.app',
  'www.lotterypro.app',
  ...(process.env.REPLIT_DOMAINS?.split(',').map(h => h.trim()) ?? []),
]);
app.use((req: Request, res: Response, next: NextFunction) => {
  if (
    process.env.NODE_ENV === 'production' &&
    req.get('x-forwarded-proto') === 'http'
  ) {
    const requestHost = req.get('host') || '';
    // Only redirect to a known-safe host; fall back to canonical domain.
    const safeHost = ALLOWED_HTTPS_HOSTS.has(requestHost) ? requestHost : 'lotterypro.app';
    return res.redirect(301, `https://${safeHost}${req.originalUrl}`);
  }
  next();
});

const MemoryStoreSession = MemoryStore(session);

app.use(session({
  secret: process.env.SESSION_SECRET || 'lotterypro-session-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

async function initStripe() {
  if (!isStripeIntegrationAvailable()) {
    console.log('⚠️ Stripe integration not available - payment features disabled');
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️ DATABASE_URL not set - Stripe sync disabled');
    return;
  }

  try {
    console.log('🔧 Initializing Stripe schema...');
    await runMigrations({ databaseUrl });
    console.log('✅ Stripe schema ready');

    const stripeSync = await getStripeSync();

    console.log('🔧 Setting up managed webhook...');
    const allDomains = (process.env.REPLIT_DOMAINS || '').split(',').map(d => d.trim()).filter(Boolean);
    const preferredDomain = allDomains.find(d => !d.includes('replit.app') && !d.includes('replit.dev'))
      || allDomains[0]
      || 'lotterypro.app';
    const webhookBaseUrl = `https://${preferredDomain}`;
    const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
      {
        enabled_events: ['*'],
        description: 'LotteryPro managed webhook for Stripe sync',
      }
    );
    console.log(`✅ Webhook configured: ${webhook.url}`);

    stripeSync.syncBackfill()
      .then(() => console.log('✅ Stripe data synced'))
      .catch((err: any) => console.error('❌ Stripe sync error:', err));
  } catch (error) {
    console.error('❌ Stripe initialization failed:', error);
  }
}

initStripe();

// Validate dependencies on startup - OWASP A08:2021
validateDependencyIntegrity();

// Helmet.js security headers - OWASP recommended
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://pagead2.googlesyndication.com", "https://www.googletagservices.com", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://www.ncpgambling.org", "wss:", "ws:"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://www.youtube.com", "https://youtube.com"],
      frameAncestors: ["'self'", "https://replit.com", "https://*.replit.com", "https://*.replit.dev", "https://*.spock.replit.dev", "https://*.kirk.replit.dev", "https://*.picard.replit.dev"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  xXssProtection: true,
  noSniff: true,
  dnsPrefetchControl: { allow: false },
  ieNoOpen: true,
  frameguard: { action: "sameorigin" },
}));

// Security middleware - OWASP, CIS, NIST compliance
app.use(securityHeaders);
app.use(securityLogger);
app.use(sessionSecurity);
app.use(sanitizeInput);

// Only apply rate limiting to API routes, not static assets
app.use('/api', apiRateLimit);

// Stripe webhook route MUST be registered BEFORE express.json()
// because webhooks need the raw Buffer body for signature verification
app.post(
  '/api/stripe/webhook/:uuid',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      const { uuid } = req.params;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(express.json({ limit: '10mb' })); // DoS protection
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(injectAdSenseId);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register critical non-API routes BEFORE registerRoutes and Vite so they
  // are never intercepted by Vite's catch-all in development mode.

  // Redirect legacy /subscription → canonical /pricing (301 permanent)
  app.get('/subscription', (_req, res) => res.redirect(301, '/pricing'));

  // Redirect /home → canonical / (301 permanent, prevents duplicate-content split)
  app.get('/home', (_req, res) => res.redirect(301, '/'));

  // Serve dynamic sitemap.xml for Google indexing
  app.get('/sitemap.xml', async (_req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const base = 'https://lotterypro.app';

    const staticUrls = [
      { loc: '/', priority: '1.0', changefreq: 'daily', lastmod: today },
      { loc: '/pricing', priority: '0.9', changefreq: 'weekly', lastmod: today },
      { loc: '/scratch-offs', priority: '0.8', changefreq: 'daily', lastmod: today },
      { loc: '/blog', priority: '0.8', changefreq: 'weekly', lastmod: today },
      { loc: '/powerball/hot-numbers', priority: '0.85', changefreq: 'daily', lastmod: today },
      { loc: '/megamillions/hot-numbers', priority: '0.85', changefreq: 'daily', lastmod: today },
      { loc: '/music', priority: '0.7', changefreq: 'monthly', lastmod: today },
      { loc: '/books', priority: '0.7', changefreq: 'monthly', lastmod: today },
      { loc: '/performance', priority: '0.7', changefreq: 'weekly', lastmod: today },
      { loc: '/pools', priority: '0.6', changefreq: 'weekly', lastmod: today },
      { loc: '/support', priority: '0.5', changefreq: 'monthly', lastmod: today },
      { loc: '/privacy', priority: '0.4', changefreq: 'yearly', lastmod: today },
      { loc: '/terms', priority: '0.4', changefreq: 'yearly', lastmod: today },
      { loc: '/accessibility', priority: '0.3', changefreq: 'yearly', lastmod: today },
    ];

    // Dynamically include published blog posts
    let blogUrls: { loc: string; priority: string; changefreq: string; lastmod: string }[] = [];
    try {
      const { db } = await import('./db');
      const { blogPosts } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const posts = await db
        .select({ slug: blogPosts.slug, publishedAt: blogPosts.publishedAt })
        .from(blogPosts)
        .where(eq(blogPosts.published, true))
        .orderBy(desc(blogPosts.publishedAt));
      blogUrls = posts.map(p => ({
        loc: `/blog/${p.slug}`,
        priority: '0.75',
        changefreq: 'monthly',
        lastmod: p.publishedAt ? new Date(p.publishedAt).toISOString().split('T')[0] : today,
      }));
    } catch (e: any) {
      // DB query failed — log a warning so it's visible in server logs
      console.warn('[sitemap] WARNING: DB query for blog posts failed — published posts may be missing from sitemap.', e?.message ?? e);
    }

    const allUrls = [...staticUrls, ...blogUrls];
    const xmlBody = allUrls.map(({ loc, priority, changefreq, lastmod }) => `
  <url>
    <loc>${base}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('');
    res.set('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlBody}
</urlset>`);
  });

  // ── SSR meta-tag injection for high-value public pages ───────────────────
  // These Express routes run BEFORE registerRoutes() and Vite's SPA catch-all.
  // They read index.html, replace the SSR_META_START/END block with per-route
  // meta tags, and return the full HTML. Social/AI crawlers receive correct
  // <title>, <meta description>, OG, Twitter, and JSON-LD in the static HTML.
  // Regular users get the same HTML — React hydrates and react-helmet-async
  // takes over after mount, so the experience is identical.
  //
  // AI/human time: ~1.5h AI, 0h human
  {
    const { renderWithMeta } = await import('./ssrShell');

    // ── /blog/:slug ─────────────────────────────────────────────────────────
    // Fetches the blog post from the DB and injects Article JSON-LD + OG tags.
    // Falls back to the default index.html if the post is not found so that
    // the SPA can show its own 404 page.
    app.get('/blog/:slug', async (req, res, next) => {
      // Only intercept for non-API, non-asset requests (defensive check).
      if (req.path.startsWith('/api') || req.path.includes('.')) return next();

      try {
        const { db } = await import('./db');
        const { blogPosts } = await import('@shared/schema');
        const { eq, and } = await import('drizzle-orm');

        const slug = req.params.slug;
        const [post] = await db
          .select({
            title: blogPosts.title,
            metaDescription: blogPosts.metaDescription,
            slug: blogPosts.slug,
            ogImageUrl: blogPosts.ogImageUrl,
            author: blogPosts.author,
            publishedAt: blogPosts.publishedAt,
            category: blogPosts.category,
          })
          .from(blogPosts)
          .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
          .limit(1);

        // Post not found — let SPA handle 404 display.
        if (!post) return next();

        const canonical = `https://lotterypro.app/blog/${slug}`;
        const postTitle = `${post.title} | LotteryPro`;

        // Article JSON-LD structured data for Google's rich results.
        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.metaDescription ?? '',
          url: canonical,
          image: post.ogImageUrl ?? 'https://lotterypro.app/og-default.png',
          datePublished: post.publishedAt ?? undefined,
          author: {
            '@type': 'Person',
            name: post.author ?? 'LotteryPro Team',
          },
          publisher: {
            '@type': 'Organization',
            name: 'LotteryPro',
            url: 'https://lotterypro.app',
            logo: {
              '@type': 'ImageObject',
              url: 'https://lotterypro.app/og-default.png',
            },
          },
        };

        const html = renderWithMeta({
          title: postTitle,
          description: post.metaDescription ?? `Read ${post.title} on LotteryPro.`,
          canonical,
          ogType: 'article',
          ogImage: post.ogImageUrl ?? undefined,
          jsonLd,
        });

        res.status(200).set('Content-Type', 'text/html').end(html);
      } catch (err) {
        // DB error — fall through to SPA so the page still loads.
        console.error('[SSR /blog/:slug] Error fetching post for meta injection:', err);
        next();
      }
    });

    // ── /powerball/hot-numbers ───────────────────────────────────────────────
    app.get('/powerball/hot-numbers', (_req, res) => {
      const html = renderWithMeta({
        title: 'Powerball Hot & Cold Numbers | Statistical Frequency Analysis — LotteryPro',
        description: 'See which Powerball numbers appear most and least often. Historical frequency charts built from 2,020+ real NY State draws. Free to use.',
        canonical: 'https://lotterypro.app/powerball/hot-numbers',
        ogType: 'website',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Powerball Hot & Cold Numbers',
          description: 'Statistical frequency analysis of Powerball winning numbers based on historical NY State draw data.',
          url: 'https://lotterypro.app/powerball/hot-numbers',
          isPartOf: { '@type': 'WebSite', name: 'LotteryPro', url: 'https://lotterypro.app' },
        },
      });
      res.status(200).set('Content-Type', 'text/html').end(html);
    });

    // ── /megamillions/hot-numbers ────────────────────────────────────────────
    app.get('/megamillions/hot-numbers', (_req, res) => {
      const html = renderWithMeta({
        title: 'Mega Millions Hot & Cold Numbers | Statistical Frequency Analysis — LotteryPro',
        description: 'See which Mega Millions numbers appear most and least often. Historical frequency charts from real draw data. Identify patterns for educational purposes.',
        canonical: 'https://lotterypro.app/megamillions/hot-numbers',
        ogType: 'website',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Mega Millions Hot & Cold Numbers',
          description: 'Statistical frequency analysis of Mega Millions winning numbers based on historical draw data.',
          url: 'https://lotterypro.app/megamillions/hot-numbers',
          isPartOf: { '@type': 'WebSite', name: 'LotteryPro', url: 'https://lotterypro.app' },
        },
      });
      res.status(200).set('Content-Type', 'text/html').end(html);
    });

    // ── /pricing ─────────────────────────────────────────────────────────────
    app.get('/pricing', (_req, res) => {
      const html = renderWithMeta({
        title: 'LotteryPro Pricing — Free & Premium Plans',
        description: 'Start free or upgrade to LotteryPro Premium for $7.99/month. Unlock advanced statistical analysis, AI-powered picks, and full draw history for Powerball & Mega Millions.',
        canonical: 'https://lotterypro.app/pricing',
        ogType: 'website',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'LotteryPro Premium',
          description: 'Advanced lottery statistical analysis — hot/cold numbers, AI picks, full draw history, and more.',
          url: 'https://lotterypro.app/pricing',
          offers: [
            {
              '@type': 'Offer',
              name: 'Free Plan',
              price: '0',
              priceCurrency: 'USD',
            },
            {
              '@type': 'Offer',
              name: 'Premium Plan',
              price: '7.99',
              priceCurrency: 'USD',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '7.99',
                priceCurrency: 'USD',
                unitText: 'MONTH',
              },
            },
          ],
        },
      });
      res.status(200).set('Content-Type', 'text/html').end(html);
    });

    // ── /scratch-offs ────────────────────────────────────────────────────────
    app.get('/scratch-offs', (_req, res) => {
      const html = renderWithMeta({
        title: 'NY Lottery Scratch-Off Games — Live Prize Data | LotteryPro',
        description: 'Browse all active NY Lottery scratch-off tickets with remaining top prizes, odds, and ticket prices. Updated daily from official NY Lottery data.',
        canonical: 'https://lotterypro.app/scratch-offs',
        ogType: 'website',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'NY Lottery Scratch-Off Games',
          description: 'Live remaining prize data for all active NY Lottery scratch-off tickets, updated daily.',
          url: 'https://lotterypro.app/scratch-offs',
          isPartOf: { '@type': 'WebSite', name: 'LotteryPro', url: 'https://lotterypro.app' },
        },
      });
      res.status(200).set('Content-Type', 'text/html').end(html);
    });

    // ── /blog (listing page) ─────────────────────────────────────────────────
    app.get('/blog', (_req, res) => {
      const html = renderWithMeta({
        title: 'Lottery Strategy & Analysis Blog | LotteryPro',
        description: 'Expert articles on Powerball and Mega Millions strategy, statistical analysis, scratch-off tips, and responsible gambling. Learn how to read the numbers.',
        canonical: 'https://lotterypro.app/blog',
        ogType: 'website',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'LotteryPro Blog',
          description: 'Lottery strategy, statistical analysis, and responsible gambling articles.',
          url: 'https://lotterypro.app/blog',
          publisher: {
            '@type': 'Organization',
            name: 'LotteryPro',
            url: 'https://lotterypro.app',
          },
        },
      });
      res.status(200).set('Content-Type', 'text/html').end(html);
    });
  }
  // ── End SSR meta-tag injection ────────────────────────────────────────────

  const server = await registerRoutes(app);

  // Use secure error handler
  app.use(secureErrorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);

    if (process.env.NODE_ENV === 'production') {
      // ── Production startup diagnostics ──
      // These log lines confirm every required secret is set before traffic arrives.
      // Russell: check the deploy console for any ⚠️ lines and resolve them.
      const stripeKey = process.env.STRIPE_SECRET_KEY || '';
      const stripeMode = stripeKey.startsWith('sk_live_')
        ? '✅ LIVE'
        : stripeKey.startsWith('sk_test_')
        ? '⚠️  TEST (switch to sk_live_ before launch)'
        : '❌ NOT SET';

      const paypalClientId = process.env.PAYPAL_CLIENT_ID || '';
      const paypalMode = paypalClientId
        ? process.env.PAYPAL_ENVIRONMENT === 'production' ? '✅ LIVE' : '⚠️  SANDBOX'
        : '❌ NOT SET';

      const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'lotterypro.app';
      // The real webhook URL (with UUID) is logged separately by initStripe() above.
      // This placeholder reminds operators where to look.
      const webhookBase = `https://${domain}/api/stripe/webhook/<uuid — see log above>`;

      const appleEnv = process.env.APPLE_ENVIRONMENT || 'Sandbox';
      const appleMode = appleEnv === 'Production' ? '✅ Production' : '⚠️  Sandbox (switch before App Store submission)';

      const emailOk = !!(process.env.LotteryPro_Email || process.env.GMAIL_APP_PASSWORD || process.env.SENDGRID_API_KEY);

      console.log('');
      console.log('══════════════════════════════════════════════════');
      console.log('  LotteryPro — Production Startup Diagnostics');
      console.log('══════════════════════════════════════════════════');
      console.log(`  Stripe mode:    ${stripeMode}`);
      console.log(`  PayPal mode:    ${paypalMode}`);
      console.log(`  Apple IAP env:  ${appleMode}`);
      console.log(`  Email (SMTP):   ${emailOk ? '✅ SET' : '❌ NOT SET — set LotteryPro_Email secret'}`);
      console.log(`  DB connected:   ${process.env.DATABASE_URL ? '✅ YES' : '❌ NOT SET'}`);
      console.log(`  Session secret: ${process.env.SESSION_SECRET ? '✅ SET' : '⚠️  using insecure default'}`);
      console.log(`  Stripe webhook: ${webhookBase}`);
      console.log(`  Domain:         https://${domain}`);
      console.log(`  Health check:   https://${domain}/api/health`);
      console.log('══════════════════════════════════════════════════');
      console.log('');

      // Warn loudly if critical secrets are missing
      if (!process.env.DATABASE_URL) {
        console.error('❌ FATAL: DATABASE_URL is not set. The app will fail on any DB operation.');
      }
      if (!emailOk) {
        console.warn('⚠️  Email not configured. Draw reminders and verification emails will not send.');
      }
    }

    // ── Production watchdog ──
    // Pings DB health every 5 min and emails Russell on failure or unhandled 5xx.
    // Only runs in production; gated here so dev/test cycles stay noise-free.
    if (process.env.NODE_ENV === 'production') {
      startWatchdog();
    }
  });

  // ==================== PRODUCTION SCHEDULER ====================
  // All cron expressions use America/New_York timezone.

  // (a) Daily usage count reset — every day at 12:01 AM ET
  cron.schedule('1 0 * * *', async () => {
    try {
      const count = await storage.resetAllDailyUsage();
      console.log(`🔄 [Scheduler] Daily usage reset complete — ${count} users reset`);
    } catch (err) {
      console.error('❌ [Scheduler] Daily usage reset failed:', err);
    }
  }, { timezone: 'America/New_York' });

  // (b) Powerball draw reminder — Mon, Wed, Sat at 8:00 PM ET
  cron.schedule('0 20 * * 1,3,6', async () => {
    try {
      const count = await sendAllDrawReminders('powerball');
      console.log(`📧 [Scheduler] Powerball reminders sent — ${count} emails`);
    } catch (err) {
      console.error('❌ [Scheduler] Powerball reminder send failed:', err);
    }
  }, { timezone: 'America/New_York' });

  // (c) MegaMillions draw reminder — Tue, Fri at 8:00 PM ET
  cron.schedule('0 20 * * 2,5', async () => {
    try {
      const count = await sendAllDrawReminders('megamillions');
      console.log(`📧 [Scheduler] MegaMillions reminders sent — ${count} emails`);
    } catch (err) {
      console.error('❌ [Scheduler] MegaMillions reminder send failed:', err);
    }
  }, { timezone: 'America/New_York' });

  // (d) Drip email processor — runs daily at 9:00 AM ET
  // Queries drip_sequences for users whose next email is due and sends it.
  cron.schedule('0 9 * * *', async () => {
    try {
      const count = await processDripEmails();
      console.log(`📧 [Scheduler] Drip emails processed — ${count} sent`);
    } catch (err) {
      console.error('❌ [Scheduler] Drip email processing failed:', err);
    }
  }, { timezone: 'America/New_York' });

  console.log('✅ Production scheduler active — usage reset + draw reminders + drip emails scheduled');
})();
