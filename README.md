# LotteryPro

LotteryPro is an educational lottery analysis app for Powerball and Mega Millions. It studies 7,600+ historical draws, shows frequency and hot/cold numbers, and generates picks with several transparent algorithms. It is for study and entertainment — not a promise that anyone will win.

The commercial layer is a freemium PWA (and iOS build via Capacitor / StoreKit 2): ads for free users, subscriptions and one-time credit packs for paid users, community pools that **do not** take payments on-platform, scratch-off helpers where states publish data, and a music/books section tied to Russell Nomer’s catalog.

## Live domains

- [https://lotterypro.app](https://lotterypro.app)
- [https://www.lotterypro.app](https://www.lotterypro.app)

This GitHub repository is **public**.

## Who it is for

- Adults in permitted US states who want statistical study tools for Powerball / Mega Millions
- Pool organizers who log contributions off-platform (Syndicate Tracker)
- iOS users via the Capacitor app (Apple In-App Purchases)
- Russell Nomer Consulting, operating subscriptions, AdSense, and affiliate (Jackpocket) links

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Wouter, TanStack Query, shadcn/ui, Chart.js, PWA |
| Backend | Node.js, Express, TypeScript |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth | bcrypt, TOTP MFA (Google Authenticator), WebAuthn libraries present, session cookies |
| Payments | Stripe (credit packs / day passes), PayPal, Apple IAP (StoreKit 2) |
| Email | SendGrid / Nodemailer (`LotteryPro_Email`) |
| Ads | Google AdSense |
| iOS | Capacitor 8 |
| Security | Helmet, express-rate-limit, Zod / express-validator |

## Product surfaces

- `/` generator and educational charts
- `/powerball/hot-numbers`, `/megamillions/hot-numbers`
- `/scratch-offs` (NY / PA public data; civic letter for other states)
- `/pools` syndicate tracker
- `/pricing`, `/checkout-success`
- `/auth`, `/admin`
- `/blog`, `/music`, `/books`, `/privacy`, `/terms`, `/support`, `/accessibility`

Age gate and legal disclaimer modals run on first visit. Prohibited states are flagged in `stateConfig`.

## How to run

Application secrets live in the host environment (see `SECURITY.md` for names). Never commit values.

```bash
npm install
npm run db:push
npm run dev              # tsx server/index.ts — port 5000
```

```bash
npm run build            # vite build + esbuild server → dist/index.js
npm start
```

iOS: see `IOS_BUILD_GUIDE.md` and `capacitor.config.ts`.

## Repo layout

```
client/                 React PWA
server/                 Express API, auth, payments, lottery data jobs
shared/                 Schema + state config
ios/                    Capacitor iOS project
public/  assets/
scripts/
```

Related docs already in the tree: `ARCHITECTURE_SPEC.md`, `SECURITY_NOTES.md`, `SECURITY_AUDIT.md`, `ADSENSE_SETUP_GUIDE.md`, `MOBILE_APP_BUSINESS_PLAN.md`.

## Replit

https://replit.com/@RussellNomer/LotteryPro

Owner: Russell Nomer / Russell Nomer Consulting.
