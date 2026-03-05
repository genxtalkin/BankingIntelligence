import { WordFrequency } from '@/types';

// Common English stop words to filter out
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by',
  'for', 'from', 'had', 'has', 'have', 'he', 'her', 'him', 'his',
  'how', 'i', 'if', 'in', 'is', 'it', 'its', 'of', 'on', 'or',
  'our', 'out', 'she', 'so', 'some', 'than', 'that', 'the', 'their',
  'them', 'then', 'there', 'they', 'this', 'to', 'up', 'us', 'was',
  'we', 'were', 'what', 'when', 'which', 'who', 'will', 'with', 'you',
  'about', 'after', 'also', 'because', 'been', 'between', 'both', 'came',
  'can', 'come', 'could', 'did', 'do', 'does', 'each', 'first', 'get',
  'had', 'has', 'have', 'he', 'her', 'here', 'him', 'into', 'just',
  'know', 'last', 'like', 'look', 'make', 'may', 'me', 'more', 'most',
  'much', 'my', 'new', 'no', 'not', 'now', 'only', 'other', 'over',
  'said', 'same', 'see', 'should', 'since', 'such', 'take', 'than',
  'their', 'them', 'these', 'through', 'time', 'too', 'two', 'use',
  'very', 'want', 'way', 'well', 'went', 'where', 'while', 'who', 'why',
  'would', 'year', 'years', 'yet', 'your', 'been', 'has', 'have',
  'says', 'said', 'told', 'report', 'reports', 'according', 'one', 'three',
  'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
]);

// Domain-specific important terms for financial security
const CRIME_TERMS = new Set([
  'robbery', 'robber', 'robbers', 'robberies', 'theft', 'thief', 'thieves',
  'steal', 'stealing', 'stolen', 'heist', 'burglar', 'burglary',
  'armed', 'weapon', 'gun', 'hostage', 'getaway',
]);

const CYBER_TERMS = new Set([
  'cyber', 'hack', 'hacker', 'hackers', 'hacking', 'phish', 'phishing',
  'malware', 'ransomware', 'breach', 'breached', 'attack', 'attacks',
  'vulnerability', 'exploit', 'scam', 'scammer', 'fraud', 'fraudulent',
  'compromise', 'compromised', 'credential', 'credentials',
]);

const BANKING_TERMS = new Set([
  'bank', 'banks', 'banking', 'atm', 'skimmer', 'skimming', 'jackpot',
  'jackpotting', 'credit', 'debit', 'card', 'account', 'customer',
  'financial', 'institution', 'credit union', 'teller', 'vault',
  'transaction', 'wire', 'transfer', 'deposit', 'withdrawal',
]);

export function categorizeWord(word: string): WordFrequency['category'] {
  const lower = word.toLowerCase();
  if (CRIME_TERMS.has(lower)) return 'crime';
  if (CYBER_TERMS.has(lower)) return 'cyber';
  if (BANKING_TERMS.has(lower)) return 'banking';
  return 'general';
}

export function extractWords(text: string): Map<string, number> {
  const wordFreq = new Map<string, number>();

  // Clean and tokenize
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ');

  for (const word of words) {
    const normalized = word.replace(/^'+|'+$/g, '').replace(/-+$/, '');

    // Filter: min 3 chars, not a stop word, not a number
    if (
      normalized.length >= 3 &&
      !STOP_WORDS.has(normalized) &&
      !/^\d+$/.test(normalized)
    ) {
      wordFreq.set(normalized, (wordFreq.get(normalized) || 0) + 1);
    }
  }

  return wordFreq;
}

export function aggregateWordFrequencies(
  texts: string[]
): Map<string, number> {
  const totalFreq = new Map<string, number>();

  for (const text of texts) {
    const words = extractWords(text);
    for (const [word, count] of words) {
      totalFreq.set(word, (totalFreq.get(word) || 0) + count);
    }
  }

  return totalFreq;
}

export function getTopWords(
  freq: Map<string, number>,
  limit = 100
): Array<{ word: string; frequency: number; category: WordFrequency['category'] }> {
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, frequency]) => ({
      word,
      frequency,
      category: categorizeWord(word),
    }));
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateToWords(text: string, maxWords = 150): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;

  // Try to end at a sentence boundary
  const truncated = words.slice(0, maxWords).join(' ');
  const lastPeriod = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? ')
  );

  if (lastPeriod > truncated.length * 0.6) {
    return truncated.substring(0, lastPeriod + 1).trim();
  }

  return truncated + '...';
}

export function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const negativeTerms = [
    'attack', 'breach', 'hack', 'stolen', 'robbery', 'theft', 'fraud',
    'malware', 'ransomware', 'scam', 'phishing', 'criminal', 'crime',
    'victim', 'loss', 'damage', 'threat', 'vulnerability', 'exploit',
    'arrest', 'charged', 'indicted',
  ];
  const positiveTerms = [
    'prevent', 'protected', 'stopped', 'caught', 'arrested', 'convicted',
    'security', 'safe', 'defended', 'improved', 'upgrade', 'solution',
    'awareness', 'education', 'training',
  ];

  let score = 0;
  for (const term of negativeTerms) {
    if (lower.includes(term)) score -= 1;
  }
  for (const term of positiveTerms) {
    if (lower.includes(term)) score += 0.5;
  }

  if (score <= -2) return 'negative';
  if (score >= 1) return 'positive';
  return 'neutral';
}

export function scoreRelevance(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;

  const highPriority = [
    'bank', 'credit union', 'financial institution', 'atm', 'skimming',
    'jackpotting', 'hook and chain', 'robbery', 'cybersecurity',
  ];
  const medPriority = [
    'fraud', 'phishing', 'ransomware', 'malware', 'breach', 'theft',
    'hack', 'scam', 'identity theft',
  ];

  for (const kw of highPriority) {
    if (lower.includes(kw)) score += 3;
  }
  for (const kw of medPriority) {
    if (lower.includes(kw)) score += 1;
  }
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) score += 1;
  }

  return score;
}
