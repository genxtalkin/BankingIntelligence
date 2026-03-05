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

interface RSSFeed {
  items: RSSItem[];
}

const RSS_FEEDS = [
  {
    url: 'https://krebsonsecurity.com/feed/',
    source: 'KrebsOnSecurity',
  },
  {
    url: 'https://www.fsisac.com/rss.xml',
    source: 'FS-ISAC',
  },
  {
    url: 'https://feeds.feedburner.com/TheHackersNews',
    source: 'The Hacker News',
  },
  {
    url: 'https://www.bankinfosecurity.com/rss-feeds',
    source: 'BankInfoSecurity',
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

export async function fetchFromRSS(
  daysBack = 30
): Promise<NewsArticle[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const allArticles: NewsArticle[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      // Use a lightweight fetch + XML parse approach (no external library needed at runtime)
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'Verint-FI-Intel/1.0' },
        next: { revalidate: 3600 },
      });

      if (!res.ok) {
        console.warn(`[RSS] ${feed.source} returned ${res.status}`);
        continue;
      }

      const xml = await res.text();
      const items = parseRSSXML(xml);

      for (const item of items) {
        if (!item.title || !item.link) continue;

        const pubDate = item.pubDate || item.isoDate;
        const publishedAt = pubDate ? new Date(pubDate) : null;

        // Filter by date
        if (publishedAt && publishedAt < cutoffDate) continue;

        const rawContent = item.contentSnippet || item.content || item.summary || item.title;
        const cleaned = stripHtml(rawContent || '');

        // Only include relevant articles
        const combinedText = `${item.title} ${cleaned}`;
        if (!isRelevant(combinedText)) continue;

        allArticles.push({
          title: item.title,
          url: item.link,
          source: feed.source,
          content: truncateToWords(cleaned, 150),
          publishedAt: publishedAt?.toISOString() || null,
          keywords: [],
        });
      }
    } catch (err) {
      console.warn(`[RSS] Error fetching ${feed.source}:`, err);
    }
  }

  return allArticles;
}

function parseRSSXML(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Simple regex-based XML parsing (avoids needing xml2js at runtime)
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const itemXml of itemMatches) {
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link') || extractAtomLink(itemXml);
    const pubDate = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'published');
    const contentSnippet =
      extractTag(itemXml, 'description') ||
      extractCDATA(itemXml, 'description') ||
      extractTag(itemXml, 'content:encoded') ||
      extractTag(itemXml, 'summary');

    if (title || link) {
      items.push({ title, link, pubDate, contentSnippet });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) return '';
  return match[1]
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .trim();
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
