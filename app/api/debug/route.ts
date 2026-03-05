/**
 * Diagnostic endpoint — visit /api/debug in the browser to see the health of
 * every component in the data pipeline. Remove this route before going to prod.
 */
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export const maxDuration = 30;

export async function GET() {
  const report: Record<string, unknown> = {};

  // ── 1. Env vars ──────────────────────────────────────────────────────────────
  report.env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEWSCATCHER_API_KEY: !!process.env.NEWSCATCHER_API_KEY,
    CRON_SECRET: !!process.env.CRON_SECRET,
  };

  // ── 2. Supabase write test ────────────────────────────────────────────────────
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('word_frequencies_cache')
      .select('count', { count: 'exact', head: true });
    report.supabase = error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    report.supabase = { ok: false, error: String(e) };
  }

  // ── 3. GDELT test ────────────────────────────────────────────────────────────
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      'https://api.gdeltproject.org/api/v2/doc/doc?query=bank+robbery&mode=ArtList&maxrecords=5&timespan=7d&format=json',
      { signal: controller.signal }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    report.gdelt = { ok: true, articleCount: data.articles?.length ?? 0 };
  } catch (e) {
    report.gdelt = { ok: false, error: String(e) };
  }

  // ── 4. RSS tests ─────────────────────────────────────────────────────────────
  const rssFeeds = [
    { name: 'KrebsOnSecurity', url: 'https://krebsonsecurity.com/feed/' },
    { name: 'TheHackerNews',   url: 'https://feeds.feedburner.com/TheHackersNews' },
    { name: 'SANS_ISC',        url: 'https://isc.sans.edu/rssfeed.xml' },
    { name: 'SecurityWeek',    url: 'https://feeds.feedburner.com/Securityweek' },
  ];

  report.rss = await Promise.all(
    rssFeeds.map(async ({ name, url }) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Verint-FI-Intel/1.0' },
          signal: controller.signal,
        });
        const text = await res.text();
        const itemCount = (text.match(/<item>/gi) || text.match(/<entry>/gi) || []).length;
        return { name, ok: res.ok, status: res.status, itemCount };
      } catch (e) {
        return { name, ok: false, error: String(e) };
      }
    })
  );

  // ── 5. Current DB row counts ──────────────────────────────────────────────────
  try {
    const supabase = createServiceClient();
    const [wf, mt] = await Promise.all([
      supabase.from('word_frequencies_cache').select('*', { count: 'exact', head: true }),
      supabase.from('market_trends_cache').select('*', { count: 'exact', head: true }),
    ]);
    report.dbCounts = {
      word_frequencies_cache: wf.count ?? 0,
      market_trends_cache: mt.count ?? 0,
    };
  } catch (e) {
    report.dbCounts = { error: String(e) };
  }

  return NextResponse.json(report, { status: 200 });
}
