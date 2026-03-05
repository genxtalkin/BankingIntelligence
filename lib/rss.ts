import { NewsArticle } from '@/types';
import { stripHtml, truncateToWords } from './text-processing';

interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
}

const RSS_FEEDS = [
  {
    url: 'https://krebsonsecurity.com/feed/',
    source: 'KrebsOnSecurity',
  },
  {
    url: 'https://feeds.feedburner.com/TheHackersNews',
    source: 'The Hacker News',
  },
  {
    url: 'https://isc.sans.edu/rssfeed.xml',
    source: 'SANS ISC',
  },
  {
    url: 'https://feeds.feedburner.com/Securityweek',
    source: 'SecurityWeek',
  },
];

const RELEVANCE_KEYWORDS = [
  'bank', 'atm', 'robbery', 'skimming', 'phishing', 'fraud',
  'ransomware', 'hack', 'breach', 'malware', 'cyber', 'credit union',
  'financial', 'jackpot', 'theft', 'scam',
];

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return RELEVANCE_KEYWORDS.some((kw) => lower.includes(kw));
}

/** Fetch a single feed with a hard timeout. Returns [] on any failure. */
async function fetchFeed(
  feed: { url: string; source: string },
  cutoffDate: Date,
  timeoutMs = 8000
): Promise<NewsArticle[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Verint-FI-Intel/1.0' },
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.warn(`[RSS] ${feed.source} returned ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const items = parseRSSXML(xml);
    const articles: NewsArticle[] = [];

    for (const item of items) {
      if (!item.title || !item.link) continue;

      const pubDate = item.pubDate || item.isoDate;
      const publishedAt = pubDate ? new Date(pubDate) : null;

      if (publishedAt && publishedAt < cutoffDate) continue;

      const rawContent = item.contentSnippet || item.content || item.summary || item.title;
      const cleaned = stripHtml(rawContent || '');

      const combinedText = `${item.title} ${cleaned}`;
      if (!isRelevant(combinedText)) continue;

      articles.push({
        title: item.title,
        url: item.link,
        source: feed.source,
        content: truncateToWords(cleaned, 150),
        publishedAt: publishedAt?.toISOString() || null,
        keywords: [],
      });
    }

    console.log(`[RSS] ${feed.source}: ${articles.length} relevant articles`);
    return articles;
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    console.warn(`[RSS] ${feed.source} ${isTimeout ? 'timed out' : 'failed'}:`, isTimeout ? '' : err);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchFromRSS(daysBack = 30): Promise<NewsArticle[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Fetch all feeds in parallel — much faster than sequential
  const results = await Promise.allSettled(
    RSS_FEEDS.map((feed) => fetchFeed(feed, cutoffDate))
  );

  const allArticles: NewsArticle[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    }
  }

  return allArticles;
}

function parseRSSXML(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Match both RSS <item> and Atom <entry> elements
  const itemMatches =
    xml.match(/<item>([\s\S]*?)<\/item>/g) ||
    xml.match(/<entry>([\s\S]*?)<\/entry>/g) ||
    [];

  for (const itemXml of itemMatches) {
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link') || extractAtomLink(itemXml);
    const pubDate =
      extractTag(itemXml, 'pubDate') ||
      extractTag(itemXml, 'published') ||
      extractTag(itemXml, 'updated');
    const contentSnippet =
      extractCDATA(itemXml, 'description') ||
      extractTag(itemXml, 'description') ||
      extractTag(itemXml, 'content:encoded') ||
      extractTag(itemXml, 'summary') ||
      extractTag(itemXml, 'content');

    if (title || link) {
      items.push({ title, link, pubDate, contentSnippet });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) return '';
  return match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
}

function extractCDATA(xml: string, tag: string): string {
  const match = xml.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i')
  );
  return match ? match[1].trim() : '';
}

function extractAtomLink(xml: string): string {
  const match = xml.match(/<link[^>]+href="([^"]+)"/i);
  return match ? match[1] : '';
}
