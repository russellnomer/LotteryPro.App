import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
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

declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
  }
}

const app = express();

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
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
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
  });
})();
