import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { fetchFromNewscatcher } from '@/lib/newscatcher';
import { fetchFromGDELT } from '@/lib/gdelt';
import { fetchFromRSS } from '@/lib/rss';
import {
  aggregateWordFrequencies,
  getTopWords,
  scoreRelevance,
  detectSentiment,
  truncateToWords,
} from '@/lib/text-processing';
import { subDays, format } from 'date-fns';

export const maxDuration = 300; // 5 minutes max execution time

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const results: Record<string, unknown> = {};

  console.log(`[Cron] Starting data refresh for ${today}`);

  // ─── 1. Fetch from all sources (30 days for word cloud/map) ─────────────────
  let thirtyDayArticles = [];
  let sevenDayArticles = [];

  try {
    const [ncArticles30, gdeltArticles30, rssArticles30] = await Promise.allSettled([
      fetchFromNewscatcher(30, 100),
      fetchFromGDELT(30, 50),
      fetchFromRSS(30),
    ]);

    thirtyDayArticles = [
      ...(ncArticles30.status === 'fulfilled' ? ncArticles30.value : []),
      ...(gdeltArticles30.status === 'fulfilled' ? gdeltArticles30.value : []),
      ...(rssArticles30.status === 'fulfilled' ? rssArticles30.value : []),
    ];

    results.thirtyDayCount = thirtyDayArticles.length;

    // 7-day subset for market trends
    const cutoff7 = subDays(new Date(), 7).getTime();
    sevenDayArticles = thirtyDayArticles.filter((a) => {
      if (!a.publishedAt) return true; // include if no date
      return new Date(a.publishedAt).getTime() >= cutoff7;
    });

    results.sevenDayCount = sevenDayArticles.length;
    console.log(
      `[Cron] Fetched ${thirtyDayArticles.length} (30d), ${sevenDayArticles.length} (7d)`
    );
  } catch (err) {
    console.error('[Cron] Error fetching articles:', err);
    return NextResponse.json({ error: 'Failed to fetch articles', detail: String(err) }, { status: 500 });
  }

  // ─── 2. Word frequencies (30-day) ────────────────────────────────────────────
  try {
    const allTexts = thirtyDayArticles.map((a) => `${a.title} ${a.content}`);
    const freqMap = aggregateWordFrequencies(allTexts);
    const topWords = getTopWords(freqMap, 100);

    const dateStart = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const dateEnd = today;

    // Delete old batch
    await supabase.from('word_frequencies_cache').delete().eq('batch_date', today);

    if (topWords.length > 0) {
      const rows = topWords.map((w) => ({
        word: w.word,
        frequency: w.frequency,
        category: w.category,
        date_range_start: dateStart,
        date_range_end: dateEnd,
        batch_date: today,
      }));

      const { error } = await supabase.from('word_frequencies_cache').insert(rows);
      if (error) throw error;
    }

    results.wordFreqInserted = topWords.length;
    console.log(`[Cron] Inserted ${topWords.length} word frequencies`);
  } catch (err) {
    console.error('[Cron] Error updating word frequencies:', err);
    results.wordFreqError = String(err);
  }

  // ─── 3. Market Trends (top 20 from 7-day) ────────────────────────────────────
  try {
    // Score and rank
    const scored = sevenDayArticles
      .map((a) => ({
        ...a,
        score: scoreRelevance(`${a.title} ${a.content}`, []),
        sentiment: detectSentiment(`${a.title} ${a.content}`),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // Remove duplicates by URL
    const seen = new Set<string>();
    const unique = scored.filter((a) => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });

    // Delete old batch
    await supabase.from('market_trends_cache').delete().eq('batch_date', today);

    if (unique.length > 0) {
      const rows = unique.map((a) => ({
        title: a.title.slice(0, 500),
        url: a.url,
        source: a.source,
        summary: truncateToWords(a.content, 150),
        published_at: a.publishedAt,
        relevance_score: a.score,
        keywords: [],
        sentiment: a.sentiment,
        batch_date: today,
      }));

      const { error } = await supabase.from('market_trends_cache').insert(rows);
      if (error) throw error;
    }

    results.trendsInserted = unique.length;
    console.log(`[Cron] Inserted ${unique.length} market trends`);
  } catch (err) {
    console.error('[Cron] Error updating market trends:', err);
    results.trendsError = String(err);
  }

  return NextResponse.json({
    success: true,
    date: today,
    ...results,
    message: 'Data refresh complete',
  });
}

// Also allow POST (Vercel cron uses GET but allow POST for manual trigger)
export async function POST(req: NextRequest) {
  return GET(req);
}
