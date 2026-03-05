import { format } from 'date-fns';
import type { MarketTrend } from '@/types';

interface Props {
  trend: MarketTrend;
  rank: number;
}

const SENTIMENT_CONFIG = {
  negative: { label: 'Risk Alert', bg: 'badge-negative', icon: '⚠️' },
  positive: { label: 'Positive', bg: 'badge-positive', icon: '✓' },
  neutral: { label: 'Informational', bg: 'badge-neutral', icon: 'ℹ' },
};

export default function TrendCard({ trend, rank }: Props) {
  const sentiment = SENTIMENT_CONFIG[trend.sentiment] || SENTIMENT_CONFIG.neutral;
  const formattedDate = trend.published_at
    ? format(new Date(trend.published_at), 'MMM d, yyyy')
    : 'Date unknown';

  // Ensure URL has protocol
  const safeUrl = trend.url.startsWith('http') ? trend.url : `https://${trend.url}`;

  return (
    <div className="trend-card bg-white rounded-xl border border-verint-purple-pale shadow-verint
                    overflow-hidden flex flex-col fade-in">
      {/* Header bar */}
      <div className="bg-verint-gradient px-5 py-3 flex items-center gap-3">
        <span className="text-white font-black text-2xl opacity-70 select-none leading-none">
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-semibold text-sm hover:text-verint-purple-pale
                       transition-colors line-clamp-2 leading-snug group"
          >
            {trend.title}
            <span className="ml-1 opacity-60 group-hover:opacity-100">↗</span>
          </a>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex-1 flex flex-col gap-3">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${sentiment.bg}`}>
            {sentiment.icon} {sentiment.label}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            {trend.source}
          </span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">{formattedDate}</span>
        </div>

        {/* Summary */}
        <p className="text-gray-700 text-sm leading-relaxed flex-1">
          {trend.summary}
        </p>

        {/* Keywords */}
        {trend.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {trend.keywords.slice(0, 5).map((kw) => (
              <span
                key={kw}
                className="text-xs bg-verint-purple-bg text-verint-purple-dark
                           px-2 py-0.5 rounded-full border border-verint-purple-pale"
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* Link */}
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-verint-purple hover:text-verint-purple-dark
                     text-sm font-semibold transition-colors mt-auto pt-2"
        >
          Read original article
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
