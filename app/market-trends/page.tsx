'use client';

import { useState, useEffect } from 'react';
import TrendCard from '@/components/TrendCard';
import DateRangeLabel from '@/components/DateRangeLabel';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { MarketTrend } from '@/types';

const SENTIMENTS = ['all', 'negative', 'neutral', 'positive'] as const;
type SentimentFilter = typeof SENTIMENTS[number];

export default function MarketTrendsPage() {
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [batchDate, setBatchDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/market-trends');
        if (!res.ok) throw new Error('Failed to load trends');
        const json = await res.json();
        setTrends(json.trends || []);
        setBatchDate(json.batchDate || null);
      } catch (err) {
        setError('Could not load market trends. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = trends.filter((t) => {
    const matchSentiment = sentimentFilter === 'all' || t.sentiment === sentimentFilter;
    const matchSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.summary.toLowerCase().includes(search.toLowerCase()) ||
      t.source.toLowerCase().includes(search.toLowerCase());
    return matchSentiment && matchSearch;
  });

  const sentimentCounts = {
    all: trends.length,
    negative: trends.filter((t) => t.sentiment === 'negative').length,
    neutral: trends.filter((t) => t.sentiment === 'neutral').length,
    positive: trends.filter((t) => t.sentiment === 'positive').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <h1 className="text-3xl font-black text-verint-purple-dark leading-tight">
            Overall Market Trends
          </h1>
          <p className="text-gray-500 mt-1 text-sm max-w-2xl">
            Top 20 trending articles and intelligence reports from the financial institution
            security world — each condensed to under 200 words with a direct link to the source.
          </p>
        </div>
        <DateRangeLabel days={7} batchDate={batchDate} label="7-day trend window" />
      </div>

      {loading && <LoadingSpinner message="Loading Market Trends..." />}

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">📰</div>
          <h3 className="font-semibold text-amber-800 mb-2">Trends Not Yet Available</h3>
          <p className="text-amber-700 text-sm">{error}</p>
          <p className="text-amber-600 text-xs mt-2">
            The first data refresh runs at 5:00 AM ET. You can also trigger a manual refresh
            from the admin settings.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search headlines, sources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-verint-purple-pale
                           focus:outline-none focus:ring-2 focus:ring-verint-purple bg-white text-sm"
              />
            </div>

            {/* Sentiment filter */}
            <div className="flex gap-2">
              {SENTIMENTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSentimentFilter(s)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors capitalize ${
                    sentimentFilter === s
                      ? 'bg-verint-purple text-white'
                      : 'bg-white border border-verint-purple-pale text-gray-600 hover:bg-verint-purple-bg'
                  }`}
                >
                  {s === 'all' ? `All (${sentimentCounts.all})` :
                   s === 'negative' ? `⚠️ Risk (${sentimentCounts.negative})` :
                   s === 'positive' ? `✓ Positive (${sentimentCounts.positive})` :
                   `ℹ️ Info (${sentimentCounts.neutral})`}
                </button>
              ))}
            </div>
          </div>

          {trends.length === 0 ? (
            <div className="bg-verint-purple-bg border border-verint-purple-pale rounded-xl p-8 text-center">
              <div className="text-4xl mb-4">📰</div>
              <h3 className="font-semibold text-verint-purple-dark mb-2">No Articles Yet</h3>
              <p className="text-gray-500 text-sm">
                The Market Trends will be populated at the next scheduled refresh (5:00 AM ET).
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No results match your filters.</p>
              <button onClick={() => { setSentimentFilter('all'); setSearch(''); }}
                className="text-verint-purple hover:underline text-sm font-medium">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-400 mb-4">
                Showing {filtered.length} of {trends.length} articles
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((trend, i) => (
                  <TrendCard
                    key={trend.id}
                    trend={trend}
                    rank={trends.indexOf(trend) + 1}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
