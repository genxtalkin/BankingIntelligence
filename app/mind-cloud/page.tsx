'use client';

import { useState, useEffect } from 'react';
import WordCloudViz from '@/components/WordCloudViz';
import InfoPanel from '@/components/InfoPanel';
import DateRangeLabel from '@/components/DateRangeLabel';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { WordFrequency } from '@/types';

export default function MindCloudPage() {
  const [words, setWords] = useState<WordFrequency[]>([]);
  const [batchDate, setBatchDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordFrequency | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/word-data');
        if (!res.ok) throw new Error('Failed to load data');
        const json = await res.json();
        setWords(json.words || []);
        setBatchDate(json.batchDate || null);
      } catch (err) {
        setError('Could not load Mind Cloud data. The first refresh runs at 5 AM ET.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Page header — full width */}
      <div className="max-w-none px-6 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
          <div>
            <h1 className="text-3xl font-black text-verint-purple-dark leading-tight">
              Mind Cloud
            </h1>
            <p className="text-gray-500 mt-1 text-sm max-w-2xl">
              The most-discussed words and topics across FI security news in the last 30 days.
              Word size reflects frequency — hover for mentions, <strong className="text-verint-purple font-semibold">click</strong> for details.
            </p>
          </div>
        </div>
        <DateRangeLabel days={30} batchDate={batchDate} label="Data range" />
      </div>

      {/* Loading / error states */}
      {loading && (
        <div className="px-6">
          <LoadingSpinner message="Building Mind Cloud..." />
        </div>
      )}

      {error && (
        <div className="px-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">☁️</div>
            <h3 className="font-semibold text-amber-800 mb-2">No data yet</h3>
            <p className="text-amber-700 text-sm">{error}</p>
            <p className="text-amber-600 text-xs mt-2">
              You can trigger a manual refresh from the admin panel, or wait for the next
              scheduled run at 5:00 AM ET.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && words.length === 0 && (
        <div className="px-6">
          <div className="bg-verint-purple-bg border border-verint-purple-pale rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">☁️</div>
            <h3 className="font-semibold text-verint-purple-dark mb-2">Mind Cloud Not Yet Generated</h3>
            <p className="text-gray-500 text-sm">
              The Mind Cloud will be populated during the next scheduled refresh at 5:00 AM ET.
            </p>
          </div>
        </div>
      )}

      {/* Main content: word cloud + optional info panel */}
      {!loading && !error && words.length > 0 && (
        <div className="flex flex-1 overflow-hidden">

          {/* Left column: word cloud + stats */}
          <div className="flex-1 overflow-y-auto px-6 pb-10 min-w-0">
            <WordCloudViz
              words={words}
              width={960}
              height={selectedWord ? 460 : 540}
              onWordClick={(w) => setSelectedWord(w)}
            />

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {[
                {
                  label: 'Total Words Tracked',
                  value: words.length,
                  icon: '📝',
                },
                {
                  label: 'Top Term',
                  value: words[0]?.word || '—',
                  icon: '🔝',
                },
                {
                  label: 'Top Frequency',
                  value: `${words[0]?.frequency || 0} mentions`,
                  icon: '📊',
                },
                {
                  label: 'Categories',
                  value: [...new Set(words.map((w) => w.category))].length,
                  icon: '🏷️',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl border border-verint-purple-pale p-4 text-center shadow-sm"
                >
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="font-black text-verint-purple text-xl">{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Top 10 words table */}
            <div className="mt-8 bg-white rounded-xl border border-verint-purple-pale shadow-sm overflow-hidden">
              <div className="bg-verint-gradient px-5 py-3">
                <h3 className="text-white font-semibold">Top 10 Keywords</h3>
              </div>
              <div className="divide-y divide-verint-purple-pale">
                {words.slice(0, 10).map((w, i) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWord(w)}
                    className="w-full flex items-center gap-4 px-5 py-3 hover:bg-verint-purple-bg
                               transition-colors text-left"
                  >
                    <span className="text-verint-purple font-black text-lg w-6 text-center">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-gray-800 flex-1 capitalize">{w.word}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        w.category === 'crime'
                          ? 'bg-red-100 text-red-700'
                          : w.category === 'cyber'
                          ? 'bg-blue-100 text-blue-700'
                          : w.category === 'banking'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-verint-purple-bg text-verint-purple'
                      }`}
                    >
                      {w.category}
                    </span>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <div className="flex-1 bg-verint-purple-pale rounded-full h-2">
                        <div
                          className="bg-verint-purple h-2 rounded-full"
                          style={{ width: `${(w.frequency / words[0].frequency) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {w.frequency}×
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: info panel (renders when a word is selected) */}
          {selectedWord && (
            <InfoPanel
              word={selectedWord}
              onClose={() => setSelectedWord(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
