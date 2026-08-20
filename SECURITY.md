# Security Policy

## Classification

**Public** GitHub repository (visibility changed 2026-08-02). Production at lotterypro.app / www.lotterypro.app.

Because this tree is public, this policy is high-level only. It does not describe exploits, payloads, or bypasses.

Owner: Russell Nomer / Russell Nomer Consulting.

## Data handled

- User accounts and password hashes
- MFA secrets and recovery material
- Session tokens
- Lottery preferences (including home state)
- Subscription and one-time purchase records via Stripe, PayPal, and Apple IAP (no raw card numbers stored by LotteryPro)
- Email addresses for notifications
- Community pool membership metadata (contributions are logged, not processed)
- Ad and analytics identifiers (AdSense, GTM)

This is an entertainment product. It is not a gambling operator; still treat account and payment metadata as confidential.

## Authentication (high level)

- Registration and login with hashed passwords
- Multi-factor authentication for signed-in users
- Session cookies with expiration and lockout after repeated failures
- Separate admin login that requires a hashed admin secret (no plaintext fallback once the hash is configured)
- Rate limiting on authentication and general API routes
- Standard HTTP security headers (CSP, frame denial, HSTS in production)

Details of algorithms, cookie names, and exact limit values are omitted here because the repository is public.

## Secret names

Names only (from `SECRETS_MANIFEST.txt`). **Never commit values.**

Payment and platform:

- `DATABASE_URL`, `NEON_DATABASE_URL`, `SESSION_SECRET`
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `LotteryPro_PayPal_ClientID`, `LotteryPro_PayPal_Secret_key_1`
- `STRIPE_LOTTERYPRO_PUBLISHABLE_API_KEY`, `STRIPE_Publishable_Key`, `LOTTERYPro_STRIPE_Secret_Key`, `STRIPE_WEBHOOK_SECRET`
- `APPLE_BUNDLE_ID`, `APPLE_ENVIRONMENT`, `APPLE_ISSUER_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`
- `GOOGLE_ADSENSE_PUBLISHER_ID`, `GOOGLE_API_KEY`
- `LotteryPro_Email`
- `SPEND_INTELLIGENCE_TOKEN`

Access:

- `FOUNDER_PASSWORD`
- `ADMIN_PASSWORD` (legacy bootstrap — remove after hash is set)
- `ADMIN_PASSWORD_HASH`

Database client: `PGDATABASE`, `PGHOST`, `PGPASSWORD`, `PGPORT`, `PGUSER`.

The dump also contains Replit/Nix/Poetry runtime variables that are not application credentials.

## Attack surface (high level)

- Public web app and PWA
- Authenticated generator, pools, and billing APIs
- Admin console
- Stripe, PayPal, and Apple IAP webhooks / server notifications
- Outbound lottery result and scratch-off data sources
- iOS native shell (Capacitor)

## Findings (high level)

1. **No secrets in git.** Workspace configuration must not contain password or token values. If any credential was ever stored in a tracked file, rotate it in the provider dashboard and keep the replacement only in the host secret store.
2. **Admin bootstrap.** Prefer a hashed admin secret only. Delete any plaintext admin password from the environment after the hash is in place.
3. **Founder password sync.** A boot-time password sync is convenient and sensitive. Restrict who can set that environment variable.
4. **Public repo hygiene.** `SECURITY_NOTES.md` and audit markdown already exist. Keep them free of live hashes, example passwords, and internal IPs. This file is the public reporting policy.
5. **Payments.** Verify webhook signatures for every processor. Never trust client-supplied price or entitlement fields.
6. **Age and jurisdiction.** Keep the age gate and prohibited-state flags enforced on the server for paid features, not only in the UI.

Existing internal write-ups: `SECURITY_NOTES.md`, `SECURITY_AUDIT.md`, `CYBERSECURITY_COMPLIANCE_AUDIT.md`. Those documents should be reviewed so they stay consistent with a public tree.

## Reporting

Report vulnerabilities to **help@russellnomerconsulting.com**.

`SECURITY_NOTES.md` also lists `security@lotterypro.app`. Either address reaches the owner; please use **help@russellnomerconsulting.com** as the primary intake.

Include the affected URL, a short description, and impact. Do not send exploit code, credential values, or instructions that would help a third party attack users.
