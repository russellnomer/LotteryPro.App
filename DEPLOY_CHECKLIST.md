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
| `DATABASE_URL` | Neon/Postgres connection string | Replit DB panel or Neon dashboard |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash of your admin password | Generate with `bcrypt.hash('yourpassword', 12)` |
| `FOUNDER_PASSWORD` | Founder tier access password | Your choice |
| `APPLE_ISSUER_ID` | App Store Connect API issuer ID | App Store Connect → Users & Access → Integrations → Team Keys |
| `APPLE_KEY_ID` | `HLWJ4VQ6SC` | Already set |
| `APPLE_PRIVATE_KEY` | Contents of AuthKey_HLWJ4VQ6SC.p8 | Already set |

**Email (Gmail SMTP):**
- `LotteryPro_Email` (or `GMAIL_APP_PASSWORD`) must be set — this is your Gmail app password for sending draw reminders and verification emails. Do NOT add SendGrid; the app uses Gmail SMTP via Nodemailer.

---

## 2. DNS — Point lotterypro.app to Replit

1. Log in to your domain registrar (where you own `lotterypro.app`).
2. In Replit → Your Repl → Settings → Custom Domain, click **Connect Domain**.
3. Copy the CNAME or A record Replit provides.
4. Add that record to your domain's DNS settings.
5. DNS propagation can take up to 24 hours, but usually under 1 hour.

---

## 3. Stripe Production Webhook

1. In the **Replit deploy console**, look for this log line on startup:
   ```
   Stripe webhook: https://lotterypro.app/api/stripe/webhook/<uuid>
   ```
2. Copy that exact URL (with the real UUID).
3. Go to **Stripe Dashboard → Developers → Webhooks → Add endpoint**.
4. Paste the URL, select **"All events"** (or the events listed in the log).
5. Save and copy the **Webhook signing secret** — you may need it if signature verification is enabled.

---

## 4. PayPal Production Switch

- In Replit Secrets, set `PAYPAL_ENVIRONMENT` to `production` (or confirm the credentials above are live-mode).
- Test a small PayPal payment end-to-end after deploy.

---

## 5. Build Verification

Run this locally or in the Replit shell before deploying:

```bash
npm run build
```

Build must complete with **zero errors**. If it fails, fix errors before deploying.

---

## 6. Smoke Tests After Deploy

Once the app is live at `https://lotterypro.app`, test each flow:

- [ ] `/api/health` → returns `{ "status": "ok" }`
- [ ] Homepage loads without errors
- [ ] User registration and login work
- [ ] Number generation works (try Powerball and MegaMillions)
- [ ] Scratch-off page loads (NY data)
- [ ] Stripe checkout starts (pricing page → Subscribe)
- [ ] PayPal checkout starts
- [ ] Email verification email arrives
- [ ] `/privacy` and `/terms` pages load (required by Apple)
- [ ] Music page loads (Russell Nomer catalog)
- [ ] Books page loads (Amazon links open correctly)
- [ ] Community pools page loads

---

## 7. Apple App Store Preparation

Before submitting the iOS app to App Store Review:

- [ ] Create subscription products in App Store Connect (already done):
  - `com.lotterypro.app.premium.monthly` — $7.99/month
  - `com.lotterypro.app.premium.annual` — $69/year
- [ ] Set `APPLE_ENVIRONMENT` secret to `Production` (currently `Sandbox`)
- [ ] Upload app icon (1024×1024 PNG, no transparency, no rounded corners)
- [ ] Add at least one screenshot per device size
- [ ] Fill in App Information, Privacy Policy URL (`https://lotterypro.app/privacy`), Support URL

---

## 8. Apple Small Business Program (Important — saves money)

Apple takes 30% of every IAP sale. If you earned under $1M last year from the App Store, you qualify for **15% instead**.

Enroll here: https://developer.apple.com/app-store/small-business-program/enroll/

Do this before your first IAP subscriber pays.

---

## 9. Go Live

1. Click **Deploy** in Replit.
2. Watch the deploy console for the startup diagnostics block:
   ```
   ══════════════════════════════════════════════
     LotteryPro — Production Startup Diagnostics
   ══════════════════════════════════════════════
     Stripe mode:    LIVE
     PayPal mode:    LIVE
     DB connected:   YES
   ```
3. If Stripe shows TEST or PayPal shows SANDBOX, update the secrets and redeploy.

---

**You're live. Start collecting revenue.**
