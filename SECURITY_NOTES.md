# LotteryPro Security Notes

This document describes the environment variables and secrets required for secure operation. Never hardcode credentials in source code — set them here.

---

## Required Secrets (set via Replit Secrets tab)

### `FOUNDER_PASSWORD`
**Purpose:** Sets the password for the founder account (`russell@russellnomer.com`) on each server startup. The server reads this on boot and updates the DB — no hardcoded credentials in code.

**Format:** Plain text password (will be bcrypt-hashed before storing)

**Example:** A strong password of your choice

**What happens if missing:** Server skips the credential sync on startup and logs a warning. The founder account keeps whatever password was last set.

**Rotation:** Change this secret to a new value and restart the server. The new password takes effect immediately.

---

### `ADMIN_PASSWORD` (deprecated) → migrate to `ADMIN_PASSWORD_HASH`

**`ADMIN_PASSWORD`** — Plain text admin password used as a fallback for `/api/admin/login`. This is the legacy approach and will continue to work, but it is less secure than the hashed version.

**`ADMIN_PASSWORD_HASH`** — bcrypt hash of your admin password. When this secret is set, the admin login endpoint uses `bcrypt.compare()` (constant-time, brute-force resistant) instead of plain string comparison.

**How to generate the hash:**
1. Start the server with `ADMIN_PASSWORD` set but `ADMIN_PASSWORD_HASH` not set
2. Look in the startup logs for this line:
   ```
   ⚠️  ADMIN_PASSWORD_HASH is not set. To harden admin login, add this bcrypt hash...
      ADMIN_PASSWORD_HASH=$2b$12$...
   ```
3. Copy that full hash value (starts with `$2b$12$`)
4. Add it as the `ADMIN_PASSWORD_HASH` secret in Replit
5. You can then remove the `ADMIN_PASSWORD` secret

**Rotation:** Generate a new bcrypt hash using any bcrypt tool (e.g., `node -e "const b=require('bcrypt'); b.hash('newpassword',12).then(console.log)"`) and update the `ADMIN_PASSWORD_HASH` secret.

---

## Password Reset Tokens

Password reset tokens are now stored exclusively in the `password_reset_tokens` PostgreSQL table as SHA-256 hashes. Tokens:
- Expire after 30 minutes
- Are single-use (marked with `used_at` timestamp after redemption)
- Are never returned in API responses (only emailed to the owner)
- The raw token is never stored — only its SHA-256 hash

No additional secrets are required for this feature.

---

## Summary of All Security-Related Secrets

| Secret | Required | Purpose |
|--------|----------|---------|
| `FOUNDER_PASSWORD` | Recommended | Founder account password sync on boot |
| `ADMIN_PASSWORD_HASH` | Recommended | bcrypt-hashed admin login password |
| `ADMIN_PASSWORD` | Legacy fallback | Plain admin password (migrate to hash above) |
| `LotteryPro_Email` | For email | Gmail App Password for Nodemailer SMTP |
| `DATABASE_URL` | Required | Neon PostgreSQL connection string |
| `PAYPAL_CLIENT_ID` | Required | PayPal API auth |
| `PAYPAL_CLIENT_SECRET` | Required | PayPal API auth |
| `STRIPE_PUBLISHABLE_KEY` | Required | Stripe frontend |
| `STRIPE_SECRET_KEY` | Required | Stripe backend |
| `GOOGLE_API_KEY` | Required | YouTube Data API (music catalog) |

---

## Security Contact

Report vulnerabilities to: `security@lotterypro.app`
