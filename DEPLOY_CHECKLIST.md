# LotteryPro — Pre-Launch Deploy Checklist

Work through this list from top to bottom before clicking "Deploy" in Replit.
Check each item off as you complete it.

---

## 1. Replit Secrets (Production Credentials)

Go to **Replit → Secrets** and verify every item below is set to its LIVE value:

| Secret | What it is | Where to get it |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe live secret key | Stripe Dashboard → Developers → API Keys → Live secret key (starts with `sk_live_`) |
| `PAYPAL_CLIENT_ID` | PayPal live client ID | PayPal Developer → My Apps → Live credentials |
| `PAYPAL_CLIENT_SECRET` | PayPal live secret | Same as above |
| `PAYPAL_ENVIRONMENT` | Set to `production` | Manually set this value |
| `DATABASE_URL` | Neon/Postgres connection string | Replit DB panel or Neon dashboard |
| `SESSION_SECRET` | Long random string for session signing | Generate with `openssl rand -base64 32` and paste the result |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash of your admin password | Generate with `bcrypt.hash('yourpassword', 12)` in Node |
| `FOUNDER_PASSWORD` | Founder tier access password | Your choice — keep it secret |
| `APPLE_ISSUER_ID` | App Store Connect API issuer ID | App Store Connect → Users & Access → Integrations → Team Keys |
| `APPLE_KEY_ID` | `HLWJ4VQ6SC` | Already set |
| `APPLE_PRIVATE_KEY` | Contents of AuthKey_HLWJ4VQ6SC.p8 | Already set |
| `APPLE_ENVIRONMENT` | Set to `Production` for live IAP | Change from `Sandbox` before App Store submission |
| `SENDGRID_API_KEY` | (Optional) SendGrid API key for high-volume email | https://sendgrid.com/ → Settings → API Keys. Leave unset to use Gmail SMTP instead. |

**Email:**
- **Primary (current):** The app uses Gmail SMTP via Nodemailer. Set `LotteryPro_Email` to your Gmail app password.
  - To generate: Gmail → Settings → Security → App Passwords → create one for "Mail"
- **Alternative (higher volume):** If you later need higher-volume transactional email, set `SENDGRID_API_KEY` with a SendGrid production API key.
  - Create one at https://sendgrid.com/ → Settings → API Keys → Create API Key (Full Access)
  - If `SENDGRID_API_KEY` is present, the email service will prefer it over Gmail SMTP.

---

## 2. DNS — Point lotterypro.app to Replit

1. Log in to your domain registrar (where you own `lotterypro.app`).
2. In Replit → Your Repl → Settings → Custom Domain, click **Connect Domain**.
3. Copy the CNAME or A record Replit provides.
4. Add that record to your domain's DNS settings.
5. DNS propagation can take up to 24 hours, but usually under 1 hour.
6. Verify: `curl -I https://lotterypro.app/api/health` should return `HTTP/2 200`.

---

## 3. Stripe Production Webhook

1. Deploy the app first.
2. In the **deploy console**, look for this log line at startup (logged by initStripe):
   ```
   ✅ Webhook configured: https://lotterypro.app/api/stripe/webhook/<uuid>
   ```
3. Copy that exact URL (with the real UUID).
4. Go to **Stripe Dashboard → Developers → Webhooks → Add endpoint**.
5. Paste the URL, select **"All events"** (or the specific events listed in the log).
6. Save and keep the **Webhook signing secret** safe.

> The managed webhook is auto-created and auto-updated by the app on each startup.
> You only need to manually register it in the Stripe dashboard for the production domain.

---

## 4. PayPal Production Switch

- Set `PAYPAL_ENVIRONMENT` to `production` in Replit Secrets.
- Confirm `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are the LIVE credentials (not sandbox).
- Test a small PayPal payment end-to-end after deploy.

---

## 5. Build Verification

Before deploying, verify the app builds with zero errors:

```bash
npm run build
```

The build must complete with **zero errors**. Warnings are okay. Fix all errors before deploying.

---

## 6. Smoke Tests After Deploy

Once the app is live at `https://lotterypro.app`, test each flow:

- [ ] `GET /api/health` → returns `{ "status": "ok", "env": "production", ... }`
- [ ] Production startup diagnostics block shows all `✅` — no `❌` lines
- [ ] Homepage loads without JS errors in the browser console
- [ ] User registration works (check email verification arrives)
- [ ] User login works
- [ ] Number generation works (try Powerball and MegaMillions)
- [ ] Scratch-off page loads (NY data fetched from data.ny.gov)
- [ ] Stripe checkout starts and completes (use a Stripe test card first, then switch to live)
- [ ] PayPal checkout starts and completes
- [ ] Email verification email arrives in inbox (not spam)
- [ ] `/privacy` loads at https://lotterypro.app/privacy (required by Apple)
- [ ] `/terms` loads at https://lotterypro.app/terms (required by Apple)
- [ ] Music page loads (Russell Nomer catalog visible)
- [ ] Books page loads (Amazon affiliate links open correctly)
- [ ] Community pools page loads
- [ ] HTTPS redirect works: `curl -I http://lotterypro.app` → 301 to https://

---

## 7. Apple App Store Preparation

Before submitting the iOS app to App Store Review:

- [ ] Create subscription products in App Store Connect (already done):
  - `com.lotterypro.app.premium.monthly` — $7.99/month
  - `com.lotterypro.app.premium.annual` — $69/year
- [ ] Set `APPLE_ENVIRONMENT` secret to `Production` (currently `Sandbox`)
- [ ] Upload app icon (1024×1024 PNG, no transparency, no rounded corners)
- [ ] Add at least one screenshot per required device size
- [ ] Fill in App Information:
  - Privacy Policy URL: `https://lotterypro.app/privacy`
  - Terms of Service URL: `https://lotterypro.app/terms`
  - Support URL: `https://lotterypro.app/support`
- [ ] Set app name to **"LotteryPro by Russell Nomer"** (the name "LotteryPro" is taken)

---

## 8. Apple Small Business Program (Important — saves money)

Apple takes 30% of every IAP sale. If you earned under $1M last year from the App Store,
you qualify for the **reduced 15% commission** instead.

Enroll here: https://developer.apple.com/app-store/small-business-program/enroll/

**Do this before your first IAP subscriber pays** — enrollment is retroactive for the calendar year
but you need to be enrolled before the first qualifying transaction.

---

## 9. Go Live

1. Click **Deploy** in Replit.
2. Watch the deploy console for the startup diagnostics block:
   ```
   ══════════════════════════════════════════════════
     LotteryPro — Production Startup Diagnostics
   ══════════════════════════════════════════════════
     Stripe mode:    ✅ LIVE
     PayPal mode:    ✅ LIVE
     Apple IAP env:  ✅ Production
     Email (SMTP):   ✅ SET
     DB connected:   ✅ YES
     Session secret: ✅ SET
     ...
   ══════════════════════════════════════════════════
   ```
3. If any line shows `❌` or `⚠️`, update the Replit Secret and redeploy.
4. Run the smoke tests in Step 6.

---

**You're live. Start collecting revenue.**
