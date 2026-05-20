# EthioBudget Tracker

A monthly budget monitoring and planning web app designed for Ethiopian users.
Track income and expenses by **manual entry** or by **forwarding telebirr / bank
SMS messages to a Telegram bot**, which parses them and asks you to categorize
each transaction. Comes with an Ethiopian middle-class default budget plan.

## Features

- 🔐 Signup with phone or Telegram username, OTP verification through a Telegram bot
- 💼 Monthly salary entry → auto-generated budget plan
- 🧾 Manual income and expense entry with Ethiopian categories
- 🤖 Telegram bot that parses forwarded SMS from telebirr, CBE, Awash, Dashen + a generic fallback
- 📥 Uncategorized inbox where forwarded transactions wait for your one-tap category
- 📊 Dashboard with spending charts, recent activity, alerts
- 📅 Daily and monthly reports

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + custom shadcn/ui-style components
- **Prisma 6** ORM with **PostgreSQL** (Neon)
- **Jose** JWT sessions + **bcryptjs** password hashing
- **Recharts** for charts, **Lucide** for icons
- **Telegraf**-compatible Telegram Bot API integration via webhook
- **Zod** for input validation

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required for the app to start:

- `DATABASE_URL` — defaults to `file:./dev.db` (SQLite).
- `JWT_SECRET` — a long random string. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

Required for Telegram OTP and SMS forwarding:

- `TELEGRAM_BOT_TOKEN` — get it from [@BotFather](https://t.me/BotFather)
- `TELEGRAM_BOT_USERNAME` — without the `@` (e.g. `MyEthioBudgetBot`)

Optional:

- `APP_URL` — your public URL, used to register the Telegram webhook in production
- `TELEGRAM_WEBHOOK_SECRET` — recommended for production webhook protection

### 3. Set up the database

```bash
npx prisma db push
npx prisma generate
```

### 4. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

## Setting Up the Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/BotFather).
2. Send `/newbot` and follow the prompts. Save the bot token.
3. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME` in `.env`.
4. Restart `npm run dev`.

### Local testing without webhooks

In dev, Telegram cannot reach `localhost`. Use one of:

- **ngrok** (recommended): `ngrok http 3000`, then run the webhook command below
  with the ngrok URL.
- **Manual testing**: post fake updates to `http://localhost:3000/api/telegram/webhook`
  using curl or Postman.

### Register the webhook (production or ngrok)

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://<your-public-url>/api/telegram/webhook","secret_token":"<TELEGRAM_WEBHOOK_SECRET>","allowed_updates":["message","callback_query"]}'
```

## End-to-End User Flow

1. Visit `/signup` → fill in name, phone or Telegram username, password.
2. Click **Open Telegram bot** → bot opens with `?start=<linkToken>`.
3. Press **Start** in Telegram → the bot links your account.
4. Back in the browser, click **Send OTP to my Telegram** → enter the 6-digit code.
5. You're logged in at `/dashboard`. Set your monthly salary at `/budget`.
6. Forward any telebirr/bank SMS to the bot or use **Add income / expense** in the app.
7. Open `/transactions` to categorize forwarded transactions in one tap.

## Architecture Highlights

- **Money** stored as integers in **santim** (1 ETB = 100 santim) for precision.
- **Auth** uses HTTP-only JWT cookies. Protected routes are gated by
  `src/proxy.ts` (Next.js 16 proxy, formerly `middleware`).
- **SMS parsers** live in `src/lib/telegram/parsers/` — one per provider plus a
  generic fallback. Add new providers there.
- **Telegram updates** are handled in `src/lib/telegram/bot-handler.ts` (called
  from the webhook in `src/app/api/telegram/webhook/route.ts`).
- **Default budget percentages** for Ethiopian middle-class lifestyle live in
  `src/lib/categories.ts` — edit them to your needs.

## Deploy to Vercel (Production)

This app is configured for **Vercel** + **Neon PostgreSQL**.

### 1. Push to GitHub

Install [Git](https://git-scm.com/download/win) if you haven't already, then run:

```bash
git init
git add .
git commit -m "Ready for Vercel deployment"
git branch -M main
# Create a new empty repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/ethiobudget-tracker.git
git push -u origin main
```

### 2. Create a Neon database

1. Go to [neon.tech](https://neon.tech) and sign up (free tier is enough).
2. Create a new project, copy the **connection string**.
3. You need **two** connection strings:
   - **Pooled** (for `DATABASE_URL`) — ends with `-pooler.neon.tech`
   - **Direct** (for `DIRECT_DATABASE_URL`) — ends with `.neon.tech`

### 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com), sign up, click **New Project**.
2. Import your GitHub repo.
3. In **Environment Variables**, add:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string |
   | `DIRECT_DATABASE_URL` | Neon direct connection string |
   | `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
   | `TELEGRAM_BOT_TOKEN` | from @BotFather |
   | `TELEGRAM_BOT_USERNAME` | your bot username without `@` |
   | `APP_URL` | `https://your-project.vercel.app` (use your actual Vercel URL) |
   | `TELEGRAM_WEBHOOK_SECRET` | any random secret string |

4. Click **Deploy**.

### 4. Set up the database

After the first deploy, run migrations from your local machine:

```bash
# Set your Neon direct URL temporarily
$env:DIRECT_DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/dbname?sslmode=require"
npx prisma migrate deploy
```

Or use Vercel's **Console** to run a one-off command.

### 5. Register the Telegram webhook

Replace `<YOUR_BOT_TOKEN>` and `<YOUR_VERCEL_URL>`:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://<YOUR_VERCEL_URL>/api/telegram/webhook","secret_token":"<TELEGRAM_WEBHOOK_SECRET>","allowed_updates":["message","callback_query"]}'
```

### 6. Use your custom domain (optional)

If you want to use your own domain (e.g. `ekied.com` or `eqied.infinityfreeapp.com`):

1. In Vercel → your project → **Settings** → **Domains**.
2. Add your domain and follow Vercel's DNS instructions.
3. Update `APP_URL` to your custom domain.
4. Re-run the webhook registration curl with the new URL.

**Note:** `eqied.infinityfreeapp.com` is an InfinityFree subdomain — it cannot be added to Vercel because InfinityFree controls the DNS. Use a domain you own (like `ekied.com`) or the free `vercel.app` subdomain.

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # signup, login, verify pages
│   ├── (dashboard)/     # protected pages (dashboard, budget, income, etc.)
│   ├── api/             # auth, salary, transactions, budget, telegram webhook
│   ├── page.tsx         # landing page
│   └── layout.tsx
├── components/
│   ├── ui/              # Button, Card, Input, Label, Progress, ...
│   └── dashboard/       # Sidebar, StatsCard, charts, forms
├── lib/
│   ├── auth.ts          # JWT, password, session helpers
│   ├── otp.ts           # OTP create/verify
│   ├── prisma.ts        # Prisma client singleton
│   ├── budget.ts        # Default plan generator
│   ├── categories.ts    # Ethiopian categories + defaults
│   ├── queries.ts       # Monthly/daily summaries
│   ├── utils.ts         # cn, money/date helpers
│   └── telegram/
│       ├── send.ts      # sendMessage / setWebhook helpers
│       ├── bot-handler.ts
│       └── parsers/     # provider-specific SMS parsers
├── proxy.ts             # auth gate (Next.js 16 proxy)
└── prisma/schema.prisma
```

## Roadmap

- [ ] Editable budget category amounts/percentages in the UI
- [ ] Full month/year navigation in reports
- [ ] CSV export
- [ ] Amharic translation
- [ ] Recurring expense templates
- [ ] Android companion app for automatic SMS scanning
- [ ] Optional Chapa / telebirr API integration when access is available

## License

MIT
