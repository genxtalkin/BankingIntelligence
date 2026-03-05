'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import DateRangeLabel from '@/components/DateRangeLabel';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { WordFrequency } from '@/types';

// Dynamically import the map (requires browser APIs)
const USMapViz = dynamic(() => import('@/components/USMapViz'), { ssr: false });

export default function WordMapPage() {
  const [words, setWords] = useState<WordFrequency[]>([]);
  const [batchDate, setBatchDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/word-data');
        if (!res.ok) throw new Error('Failed to load data');
        const json = await res.json();
        setWords(json.words || []);
        setBatchDate(json.batchDate || null);
      } catch (err) {
        setError('Could not load Word Map data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <h1 className="text-3xl font-black text-verint-purple-dark leading-tight">
            Word Map
          </h1>
          <p className="text-gray-500 mt-1 text-sm max-w-2xl">
            US geographic heat map showing financial institution security incident density
            by state. Darker shading indicates higher reported activity.
            Hover over any state for local details.
          </p>
        </div>
        <DateRangeLabel days={30} batchDate={batchDate} label="Data range" />
      </div>

      {loading && <LoadingSpinner message="Loading Word Map..." />}

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">🗺️</div>
          <h3 className="font-semibold text-amber-800 mb-2">Map data unavailable</h3>
          <p className="text-amber-700 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Info banner */}
          <div className="bg-verint-purple-bg border border-verint-purple-pale rounded-xl px-5 py-3 mb-6
                          flex items-start gap-3">
            <span className="text-verint-purple text-lg mt-0.5">ℹ️</span>
            <p className="text-verint-purple-dark text-sm">
              State incident counts combine data from NewscatcherAPI, GDELT, and RSS feeds.
              Baseline risk weighting reflects historical FI crime patterns.
              Use this map to prioritize outreach in your territory.
            </p>
          </div>

          <USMapViz words={words} />

          {/* Trending words by category */}
          {words.length > 0 && (
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { cat: 'crime', label: 'Physical Crime', color: 'border-red-300', bg: 'bg-red-50', text: 'text-red-700' },
                { cat: 'cyber', label: 'Cyber Threats', color: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-700' },
                { cat: 'banking', label: 'Banking Terms', color: 'border-green-300', bg: 'bg-green-50', text: 'text-green-700' },
                { cat: 'general', label: 'General Security', color: 'border-verint-purple-pale', bg: 'bg-verint-purple-bg', text: 'text-verint-purple-dark' },
              ].map(({ cat, label, color, bg, text }) => {
                const catWords = words.filter((w) => w.category === cat).slice(0, 6);
                return (
                  <div key={cat} className={`rounded-xl border ${color} ${bg} p-4`}>
                    <h4 className={`font-bold text-sm mb-3 ${text}`}>{label}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {catWords.length > 0 ? catWords.map((w) => (
                        <span key={w.id}
                          className={`text-xs px-2 py-0.5 rounded-full border ${color} bg-white ${text} font-medium`}>
                          {w.word}
                        </span>
                      )) : (
                        <span className="text-xs text-gray-400 italic">No data yet</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
