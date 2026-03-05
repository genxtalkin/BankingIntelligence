import { NewsArticle, QUERY_STRING } from '@/types';
import { stripHtml, truncateToWords, scoreRelevance } from './text-processing';

const BASE_URL = 'https://api.newscatcherapi.com/v2/search';

interface NewscatcherArticle {
  title: string;
  link: string;
  clean_url: string;
  excerpt: string;
  summary: string;
  published_date: string;
  author: string;
  media: string;
  is_opinion: boolean;
  rights_link: string | null;
}

interface NewscatcherResponse {
  status: string;
  total_hits: number;
  page: number;
  total_pages: number;
  page_size: number;
  articles: NewscatcherArticle[];
}

function buildQuery(daysBack: number): string {
  return QUERY_STRING;
}

export async function fetchFromNewscatcher(
  daysBack = 30,
  maxArticles = 100
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSCATCHER_API_KEY;
  if (!apiKey) {
    console.warn('[Newscatcher] No API key configured');
    return [];
  }

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);
  const fromStr = fromDate.toISOString().split('T')[0];

  const params = new URLSearchParams({
    q: buildQuery(daysBack),
    from: fromStr,
    lang: 'en',
    sort_by: 'relevancy',
    page_size: '100',
    countries: 'US',
  });

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error(`[Newscatcher] API error: ${res.status} ${res.statusText}`);
      return [];
    }

    const data: NewscatcherResponse = await res.json();

    if (data.status !== 'ok' || !data.articles) {
      console.warn('[Newscatcher] Unexpected response:', data.status);
      return [];
    }

    return data.articles.slice(0, maxArticles).map((article) => {
      const rawText = stripHtml(
        article.summary || article.excerpt || article.title || ''
      );
      const summary = truncateToWords(rawText, 150);

      return {
        title: article.title,
        url: article.link,
        source: article.clean_url || 'newscatcherapi',
        content: summary,
        publishedAt: article.published_date || null,
        keywords: [],
      };
    });
  } catch (err) {
    console.error('[Newscatcher] Fetch error:', err);
    return [];
  }
}
