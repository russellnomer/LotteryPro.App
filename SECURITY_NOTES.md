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

### `ADMIN_PASSWORD_HASH` (required for admin login)

**Purpose:** bcrypt hash of the admin dashboard password. Admin login (`/api/admin/login`) will return **503 Service Unavailable** if this secret is not set — there is no plain-text fallback.

**How to set it up (initial setup only):**
1. Set a temporary `ADMIN_PASSWORD` secret to your desired admin password
2. Start the server and look in the startup logs for:
   ```
   ⚠️  ADMIN_PASSWORD_HASH is not set. Admin login is DISABLED until you add this bcrypt hash...
      ADMIN_PASSWORD_HASH=$2b$12$...
   ```
3. Copy that full hash value (starts with `$2b$12$`)
4. Add it as the `ADMIN_PASSWORD_HASH` secret in Replit
5. **Remove the `ADMIN_PASSWORD` secret** — it is no longer needed

**Rotation:** Generate a new bcrypt hash (e.g., `node -e "const b=require('bcrypt'); b.hash('newpassword',12).then(console.log)"`) and update `ADMIN_PASSWORD_HASH`. No `ADMIN_PASSWORD` needed.

### `ADMIN_PASSWORD` (initial setup only — remove after migrating)

Only used on first boot to auto-generate the `ADMIN_PASSWORD_HASH` helper hash. Once `ADMIN_PASSWORD_HASH` is set in secrets, delete `ADMIN_PASSWORD`.

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
