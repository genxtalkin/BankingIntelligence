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
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || '(not set — defaulting to genxtalkin@gmail.com)',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '(not set — approval links will use localhost!)',
    CRON_SECRET: !!process.env.CRON_SECRET,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
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

  // ── 6. Gemini: list available models for this key ────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    report.gemini = { ok: false, error: 'GEMINI_API_KEY env var not set' };
  } else {
    // First: fetch which models this key actually supports
    let availableModels: string[] = [];
    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`,
        { signal: AbortSignal.timeout(8000) }
      );
      const listText = await listRes.text();
      if (listRes.ok) {
        const listData = JSON.parse(listText);
        availableModels = (listData.models ?? [])
          .filter((m: { supportedGenerationMethods?: string[] }) =>
            m.supportedGenerationMethods?.includes('generateContent')
          )
          .map((m: { name: string }) => m.name.replace('models/', ''));
      } else {
        const j = JSON.parse(listText);
        report.gemini = {
          ok: false,
          error: `ListModels failed: ${j?.error?.status ?? ''}: ${j?.error?.message ?? listText}`,
        };
      }
    } catch (e) {
      report.gemini = { ok: false, error: `ListModels fetch error: ${String(e)}` };
    }

    if (availableModels.length > 0) {
      // gemini-2.0-flash is excluded — deprecated/unavailable for new API keys
      const preferred = [
        'gemini-2.0-flash-lite',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash-001',
        'gemini-1.5-flash-002',
        'gemini-1.5-flash',
        'gemini-1.5-pro-latest',
        'gemini-1.5-pro-001',
        'gemini-pro',
      ];
      const modelToUse = preferred.find((m) => availableModels.includes(m)) ?? availableModels[0];

      // Now do a live generateContent test with that model
      try {
        const testRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Reply with only the word: OK' }] }],
              generationConfig: { maxOutputTokens: 5 },
            }),
            signal: AbortSignal.timeout(10000),
          }
        );
        const testText = await testRes.text();
        if (!testRes.ok) {
          const j = JSON.parse(testText);
          report.gemini = {
            ok: false,
            availableModels,
            testedModel: modelToUse,
            error: `${j?.error?.status ?? 'ERROR'}: ${j?.error?.message ?? testText}`,
          };
        } else {
          const data = JSON.parse(testText);
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          report.gemini = {
            ok: true,
            availableModels,
            workingModel: modelToUse,
            reply: reply.trim(),
          };
        }
      } catch (e) {
        report.gemini = {
          ok: false,
          availableModels,
          testedModel: modelToUse,
          error: String(e),
        };
      }
    }
  }

  return NextResponse.json(report, { status: 200 });
}
