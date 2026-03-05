import { NewsArticle, QUERY_STRING } from '@/types';
import { stripHtml, truncateToWords } from './text-processing';

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

interface GDELTArticle {
  url: string;
  url_mobile: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

interface GDELTResponse {
  articles?: GDELTArticle[];
}

const GDELT_QUERY =
  '(bank robbery) OR (atm theft) OR (skimming) OR (jackpotting) OR ' +
  '(hook and chain) OR (bank cyberattack) OR (credit union breach) OR ' +
  '(financial institution fraud)';

export async function fetchFromGDELT(
  daysBack = 30,
  maxArticles = 50
): Promise<NewsArticle[]> {
  // GDELT timespan in days
  const timespan = `${daysBack}d`;

  const params = new URLSearchParams({
    query: GDELT_QUERY,
    mode: 'ArtList',
    maxrecords: String(Math.min(maxArticles, 250)),
    timespan,
    format: 'json',
    sort: 'DateDesc',
    sourcecountry: 'US',
    sourcelang: 'English',
  });

  try {
    const res = await fetch(`${GDELT_BASE}?${params.toString()}`, {
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.warn(`[GDELT] API returned ${res.status}`);
      return [];
    }

    const data: GDELTResponse = await res.json();

    if (!data.articles || !Array.isArray(data.articles)) {
      console.warn('[GDELT] No articles in response');
      return [];
    }

    return data.articles.slice(0, maxArticles).map((article) => ({
      title: article.title || 'Untitled',
      url: article.url,
      source: article.domain || 'gdelt',
      content: truncateToWords(article.title, 150), // GDELT provides minimal content
      publishedAt: article.seendate
        ? parseGDELTDate(article.seendate)
        : null,
      keywords: [],
    }));
  } catch (err) {
    console.error('[GDELT] Fetch error:', err);
    return [];
  }
}

function parseGDELTDate(dateStr: string): string | null {
  // GDELT format: YYYYMMDDTHHMMSSZ
  try {
    const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (!match) return null;
    const [, y, m, d, h, min, s] = match;
    return new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`).toISOString();
  } catch {
    return null;
  }
}
