# Verint Financial Industry Intelligence — Project Context for Claude

## What This Is
A Next.js 14 web application for Verint's sales team. It monitors banking security news and incidents to help sales reps understand their territory, engage financial institution prospects more effectively, and create LinkedIn content. Built by Matt Marshall (AI Evangelist at Verint).

**Production URL:** `https://banking-intelligence-project-cl.vercel.app`
**GitHub repo:** `https://github.com/genxtalkin/bankingintelligence`
**Admin email:** `genxtalkin@gmail.com`

---

## Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** Supabase (PostgreSQL) — project ID `muvsviqavceualumvdbx`
- **Hosting:** Vercel (cron job at `0 10 * * *` UTC = 5 AM ET)
- **Email:** Resend API
- **AI (InfoPanel chat):** Anthropic API — `claude-haiku-4-5-20251001`
- **News data:** NewscatcherAPI + GDELT + RSS feeds (Krebs, Hacker News, SANS ISC, SecurityWeek)
- **Styling:** Tailwind CSS with custom Verint purple brand theme
- **Auth:** Supabase Auth (admin-approval workflow before access is granted)

---

## Environment Variables (set in Vercel — never hardcode in source)
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEWSCATCHER_API_KEY` | NewscatcherAPI key |
| `RESEND_API_KEY` | Resend email key |
| `ANTHROPIC_API_KEY` | Anthropic API key for InfoPanel chat |
| `ADMIN_EMAIL` | genxtalkin@gmail.com |
| `CRON_SECRET` | vfi2026secret (used to authorize cron endpoint) |
| `NEXT_PUBLIC_APP_URL` | Production Vercel URL |

**Important:** Keys were accidentally committed in DEPLOY.md early in development. Git history was rewritten with `git filter-branch` to scrub them. Always use env vars only.

---

## Deployment Workflow
The VM that Claude runs in cannot push to GitHub (proxy blocks outbound GitHub). **Matt must run `git push origin main` from his own terminal.** Once pushed, Vercel auto-deploys via GitHub integration.

- `git push origin main` — normal push (use after routine commits)
- `git push --force origin main` — only needed if history was rewritten

Never click "Redeploy" in Vercel dashboard for new code — that just reruns the old build. New code must be pushed to GitHub first.

---

## Supabase Database Tables
| Table | Purpose |
|---|---|
| `word_frequencies_cache` | Mind Cloud data — word, frequency, category, batch_date |
| `market_trends_cache` | Market Trends data — article title, url, summary, sentiment, batch_date |
| `user_profiles` | Signup info — name, email, phone, territory_states, approved/denied flags |
| `approval_tokens` | One-time tokens for admin approve/deny links in emails |

**Supabase clients:**
- `lib/supabase-server.ts` → `createServerComponentClient()` for server components/route handlers (respects RLS)
- `lib/supabase-server.ts` → `createServiceClient()` for backend writes that bypass RLS (uses `SUPABASE_SERVICE_ROLE_KEY`)
- `lib/supabase-client.ts` → browser client

---

## What Has Been Built

### Pages (all public, no login required)
| Route | Status | Notes |
|---|---|---|
| `/` | ✅ Done | Landing/home page |
| `/mind-cloud` | ✅ Done | Canvas word cloud with click-to-inspect InfoPanel |
| `/market-trends` | ✅ Done | Top 20 trending articles, 7-day window |
| `/auth/login` | ✅ Done | Supabase email/password login |
| `/auth/signup` | ✅ Done | Captures name, email, phone, territory states; triggers admin approval email |
| `/admin/approve/[token]` | ✅ Done | Admin approves or denies new users via tokenized link |
| ~~`/word-map`~~ | ❌ Removed | Originally planned; removed per user request |

### Key Components
| Component | Purpose |
|---|---|
| `components/Navbar.tsx` | Top nav with Verint branding, page links, Refresh Data button, Login link |
| `components/WordCloudViz.tsx` | Canvas-based word cloud; hover tooltips; `onWordClick` prop fires on click |
| `components/InfoPanel.tsx` | Fixed right side drawer — shows word definition + Anthropic-powered chat; drag-resizable (320–700px) |
| `components/TrendCard.tsx` | Individual market trend card |
| `components/USMapViz.tsx` | D3-based US map (exists but not fully wired to live data yet) |
| `components/DateRangeLabel.tsx` | Displays "Data from X to Y" date range label |
| `components/LoadingSpinner.tsx` | Loading state indicator |
| `components/StateSelector.tsx` | Multi-select US state picker for signup |

### API Routes
| Route | Method | Purpose |
|---|---|---|
| `/api/word-data` | GET | Returns latest word frequencies from Supabase |
| `/api/market-trends` | GET | Returns latest market trends from Supabase |
| `/api/refresh` | POST | Manually triggers full data refresh (called by Navbar button) |
| `/api/cron/refresh-data` | GET | Scheduled cron endpoint (requires `Authorization: Bearer <CRON_SECRET>`) |
| `/api/word-chat` | POST | Anthropic-powered chat for InfoPanel definitions and Q&A |
| `/api/auth/signup` | POST | Creates user profile in Supabase, sends approval email via Resend |
| `/api/admin/approve` | POST | Processes admin approval/denial token, creates Supabase Auth user on approval |
| `/api/debug` | GET | Diagnostic endpoint — tests env vars, Supabase, GDELT, RSS, and DB row counts |

### Data Pipeline (`lib/`)
| File | Purpose |
|---|---|
| `lib/refresh-data.ts` | Main refresh logic — fetches all sources, computes word frequencies, inserts to Supabase. Used by both `/api/refresh` and `/api/cron/refresh-data`. |
| `lib/newscatcher.ts` | Fetches articles from NewscatcherAPI using `SEARCH_KEYWORDS` |
| `lib/gdelt.ts` | Fetches from GDELT (rate-limited; 429s are non-fatal, treated as warnings) |
| `lib/rss.ts` | Fetches 4 RSS feeds in parallel with 8s `AbortController` timeouts. Sources: KrebsOnSecurity, The Hacker News, SANS ISC, SecurityWeek |
| `lib/text-processing.ts` | Word frequency computation and keyword categorization |
| `lib/email.ts` | Resend email sending for approval workflow |

### Key Types (`types/index.ts`)
- `WordFrequency` — `{ id, word, frequency, category: 'crime'|'cyber'|'banking'|'general', date_range_start, date_range_end, batch_date }`
- `MarketTrend` — `{ id, title, url, source, summary, published_at, relevance_score, keywords, sentiment, batch_date }`
- `UserProfile` — `{ id, auth_user_id, first_name, last_name, email, phone, territory_states, approved, denied }`
- `SEARCH_KEYWORDS` and `QUERY_STRING` — exported constants used across data fetching

---

## Key Architecture Decisions (do not change without good reason)

1. **No fire-and-forget HTTP calls to self.** Vercel serverless freezes the process after the response is sent. The `/api/refresh` route calls `runDataRefresh()` directly (imported from `lib/refresh-data.ts`) and awaits it inline. `export const maxDuration = 300` is set on routes that do heavy work.

2. **`Cache-Control: no-store` on all data API routes.** Without this, browsers cache the first empty response and serve it forever. Both `/api/word-data` and `/api/market-trends` set this header explicitly.

3. **Service role client for backend writes.** Any route that inserts/updates Supabase data uses `createServiceClient()` (bypasses RLS). Server component reads use `createServerComponentClient()` (respects RLS).

4. **InfoPanel is `position: fixed`.** It sits to the right of the viewport below the `h-16` navbar (`top: 64px`). It does NOT participate in the page scroll flow, so opening it never causes page jump. The main content column adds `paddingRight` equal to the panel width when it is open.

5. **RSS feeds are the primary data source.** GDELT 429 errors are non-fatal (`console.warn`). All 4 RSS feeds fetch in parallel via `Promise.allSettled`.

6. **Word cloud click → InfoPanel.** `WordCloudViz` has an `onWordClick?: (word: WordFrequency) => void` prop. Hit detection reuses the same bounding-box logic as hover. The definition is fetched fresh each time a word is clicked (sends `messages: []` to `/api/word-chat`). Chat history lives in `InfoPanel` component state and is not persisted.

---

## What Is NOT Yet Built (from original spec)

These features were specified but not yet implemented. Tackle them in the order that makes most sense to Matt:

### 1. Territory Trends (logged-in users only)
- Personalized top-10 articles filtered to the user's `territory_states`
- Each article: 150-word extraction, working source link, LinkedIn hashtags, Canva visual prompt
- Refresh button at top; auto-updates every Wednesday 5 AM ET
- CSV export emailed to the user

### 2. Territory Events (logged-in users only)
- List of banking emergency events (robbery, ATM attacks, assault, hostage, etc.) filtered to user's territory
- Per event: institution name, street/city location, source link, captured image, contact info
- 6-month rolling database; auto-purge events older than 6 months
- Filter by event type; query count by territory
- CSV export emailed to user

### 3. Territory Mapping (logged-in users only)
- Interactive map (Mapbox or Leaflet) of FIs in the user's territory
- Color-coded "security health" scores from public data
- Mark FIs as prospect or current customer with different icon colors
- Plot Territory Events on map with per-type icons
- Events stay on map for 6 months; older events auto-remove
- Hover tooltip shows brief note + link to original article
- Clustered icons when zoomed out (number badge)
- Full map controls: scroll-zoom, click-drag pan, touch gestures

### 4. Competitor Tracker (logged-in users only)
- Monitor which security vendors prospects are currently using
- Source: job postings and public tech-stack signals
- Help reps identify displacement opportunities

### 5. LinkedIn Post Generator improvements (Territory Trends)
- Visual prompt designed for Canva or Nano Banana
- One-click copy of full post text + hashtags

---

## Tailwind Brand Theme (defined in `tailwind.config.ts`)
```
verint-purple:       #5C2D91  (primary)
verint-purple-dark:  #3D1A6E  (hover states)
verint-purple-deeper:#2A0F52  (deep backgrounds)
verint-purple-pale:  #E8D5F5  (borders, subtle backgrounds)
verint-purple-bg:    #F5EFFE  (page section backgrounds)
verint-gradient:     linear-gradient(135deg, #5C2D91, #7B4BAF)
shadow-verint:       0 4px 20px rgba(92,45,145,0.15)
```

---

## Notes on Data Freshness
- Cron runs at `0 10 * * *` UTC = 5:00 AM Eastern Standard Time
- During EDT (summer, March–November) this is 6:00 AM EDT — adjust to `0 9 * * *` to maintain 5 AM ET year-round
- Manual refresh available via the "Refresh Data" button in the navbar (awaits full pipeline, then reloads page)
- `/api/debug` is a safe diagnostic endpoint — visit it to check env vars, connectivity, and DB row counts without changing any data
