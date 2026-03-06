# Verint FI Intelligence — Deployment Guide

All application files are complete. Follow these steps to deploy.

---

## Step 1 — Install Dependencies

Open a terminal, `cd` into this project folder (`BankingIntelligenceProject`), then run:

```bash
npm install
```

---

## Step 2 — Deploy to Vercel

### Option A — Vercel CLI (Recommended)

```bash
npm install -g vercel    # install once globally
vercel login             # log in with your Vercel account
vercel --prod            # deploy from inside this folder
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → genxtalkin's projects
- **Link to existing project?** → No (first time)
- **Project name?** → `verint-fi-intel` (or your choice)
- **Directory?** → `.` (current)
- **Override settings?** → No

### Option B — Vercel Dashboard (No CLI)

1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"** → if no repo exists, use **"Deploy from Local"**
   - Or push this folder to a GitHub repo first, then import it
3. Set **Framework** to **Next.js** (auto-detected)
4. Click **Deploy**

---

## Step 3 — Set Environment Variables in Vercel

After your first deployment, go to:
**Vercel Dashboard → Your Project → Settings → Environment Variables**

Add ALL of these:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → service_role secret key |
| `NEWSCATCHER_API_KEY` | NewscatcherAPI dashboard → API Keys |
| `RESEND_API_KEY` | Resend dashboard → API Keys |
| `GEMINI_API_KEY` | Google AI Studio → API Keys |
| `ADMIN_EMAIL` | The email address that receives approval notifications |
| `CRON_SECRET` | Generate any random string (e.g. `openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g. `https://verint-fi-intel.vercel.app`) |

After adding all variables, click **"Redeploy"** so the app picks them up.

---

## Step 4 — Trigger the First Data Refresh

Once deployed, hit the cron endpoint once manually to populate the database:

```bash
curl -X GET "https://YOUR-VERCEL-URL.vercel.app/api/cron/refresh-data" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or visit this URL in your browser:
```
https://YOUR-VERCEL-URL.vercel.app/api/cron/refresh-data
```
*(while temporarily removing the CRON_SECRET check for first run — or just add the header)*

This will fetch articles from all sources and populate the Mind Cloud, Word Map, and Market Trends pages.

---

## Step 5 — Verify Cron Schedule

In **Vercel Dashboard → Your Project → Settings → Cron Jobs**, confirm:
- Path: `/api/cron/refresh-data`
- Schedule: `0 10 * * *` (= **5:00 AM Eastern Time / 10:00 AM UTC**)

> Note: This runs at 5:00 AM EST. During EDT (summer), it will run at 6:00 AM EDT.
> To always run at 5:00 AM local Eastern, change to `0 9 * * *` (5 AM EDT) for summer.

---

## What's Automatically Wired Up

| Feature | Status |
|---|---|
| Mind Cloud (30-day word cloud) | ✅ Ready — populates on first cron run |
| Word Map (US incident heat map) | ✅ Ready — populates on first cron run |
| Market Trends (top 20 articles) | ✅ Ready — populates on first cron run |
| User Signup form | ✅ Ready |
| Admin approval emails via Resend | ✅ Ready |
| User approval → auto-creates Supabase login | ✅ Ready |
| Daily 5 AM ET refresh | ✅ Ready via Vercel Cron |
| GXT logo in navbar | ✅ Done |
| Verint purple branding | ✅ Done |
| Mobile-responsive layout | ✅ Done |

---

## Data Sources Integrated

- **NewscatcherAPI** — Real-time news with keyword filtering
- **GDELT Project** — Global event database (no key required)
- **KrebsOnSecurity** — RSS feed (cybersecurity news)
- **FS-ISAC** — RSS feed (financial services threat intel)
- **The Hacker News** — RSS feed (additional cyber coverage)
- **BankInfoSecurity** — RSS feed (banking security)

---

## Questions?

Contact: genxtalkin@gmail.com
