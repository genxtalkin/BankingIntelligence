/**
 * Core data refresh logic — shared by both the cron route and the manual refresh route.
 * Fetches articles from all sources, computes word frequencies, and upserts market trends.
 */

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

export interface RefreshResult {
  success: boolean;
  date: string;
  thirtyDayCount?: number;
  sevenDayCount?: number;
  wordFreqInserted?: number;
  trendsInserted?: number;
  wordFreqError?: string;
  trendsError?: string;
  message: string;
}

export async function runDataRefresh(): Promise<RefreshResult> {
  const supabase = createServiceClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const result: RefreshResult = { success: true, date: today, message: '' };

  console.log(`[Refresh] Starting data refresh for ${today}`);

  // ─── 1. Fetch from all sources ──────────────────────────────────────────────
  let thirtyDayArticles: Awaited<ReturnType<typeof fetchFromNewscatcher>> = [];
  let sevenDayArticles: typeof thirtyDayArticles = [];

  try {
    const [ncArticles, gdeltArticles, rssArticles] = await Promise.allSettled([
      fetchFromNewscatcher(30, 100),
      fetchFromGDELT(30, 50),
      fetchFromRSS(30),
    ]);

    thirtyDayArticles = [
      ...(ncArticles.status === 'fulfilled' ? ncArticles.value : []),
      ...(gdeltArticles.status === 'fulfilled' ? gdeltArticles.value : []),
      ...(rssArticles.status === 'fulfilled' ? rssArticles.value : []),
    ];

    result.thirtyDayCount = thirtyDayArticles.length;

    // 7-day subset for market trends
    const cutoff7 = subDays(new Date(), 7).getTime();
    sevenDayArticles = thirtyDayArticles.filter((a) => {
      if (!a.publishedAt) return true;
      return new Date(a.publishedAt).getTime() >= cutoff7;
    });

    result.sevenDayCount = sevenDayArticles.length;
    console.log(
      `[Refresh] Fetched ${thirtyDayArticles.length} articles (30d), ${sevenDayArticles.length} (7d)`
    );
  } catch (err) {
    console.error('[Refresh] Fatal error fetching articles:', err);
    return { success: false, date: today, message: `Failed to fetch articles: ${String(err)}` };
  }

  // ─── 2. Word frequencies (30-day) ───────────────────────────────────────────
  try {
    const allTexts = thirtyDayArticles.map((a) => `${a.title} ${a.content}`);
    const freqMap = aggregateWordFrequencies(allTexts);
    const topWords = getTopWords(freqMap, 100);

    const dateStart = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    await supabase.from('word_frequencies_cache').delete().eq('batch_date', today);

    if (topWords.length > 0) {
      const rows = topWords.map((w) => ({
        word: w.word,
        frequency: w.frequency,
        category: w.category,
        date_range_start: dateStart,
        date_range_end: today,
        batch_date: today,
      }));
      const { error } = await supabase.from('word_frequencies_cache').insert(rows);
      if (error) throw error;
    }

    result.wordFreqInserted = topWords.length;
    console.log(`[Refresh] Inserted ${topWords.length} word frequencies`);
  } catch (err) {
    console.error('[Refresh] Error updating word frequencies:', err);
    result.wordFreqError = String(err);
  }

  // ─── 3. Market Trends (top 20 from 7-day) ───────────────────────────────────
  try {
    const scored = sevenDayArticles
      .map((a) => ({
        ...a,
        score: scoreRelevance(`${a.title} ${a.content}`, []),
        sentiment: detectSentiment(`${a.title} ${a.content}`),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    const seen = new Set<string>();
    const unique = scored.filter((a) => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });

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

    result.trendsInserted = unique.length;
    console.log(`[Refresh] Inserted ${unique.length} market trends`);
  } catch (err) {
    console.error('[Refresh] Error updating market trends:', err);
    result.trendsError = String(err);
  }

  result.message = 'Data refresh complete';
  return result;
}
