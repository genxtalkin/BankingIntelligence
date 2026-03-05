'use client';

import { useEffect, useRef, useState } from 'react';
import type { WordFrequency } from '@/types';

interface Props {
  words: WordFrequency[];
  width?: number;
  height?: number;
}

interface PlacedWord {
  word: string;
  x: number;
  y: number;
  size: number;
  color: string;
  category: string;
}

const CATEGORY_COLORS: Record<string, string[]> = {
  crime: ['#C0392B', '#E74C3C', '#A93226'],
  cyber: ['#1A5276', '#2471A3', '#1F618D'],
  banking: ['#1E8449', '#27AE60', '#196F3D'],
  general: ['#6B2FA0', '#8540BB', '#9B59D2'],
};

function getColor(category: string, index: number): string {
  const palette = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;
  return palette[index % palette.length];
}

export default function WordCloudViz({ words, width = 900, height = 520 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [placed, setPlaced] = useState<PlacedWord[]>([]);
  const [tooltip, setTooltip] = useState<{ word: string; freq: number; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!words.length) return;

    const maxFreq = Math.max(...words.map((w) => w.frequency));
    const minFreq = Math.min(...words.map((w) => w.frequency));
    const freqRange = maxFreq - minFreq || 1;

    const minSize = 12;
    const maxSize = 72;

    const placedWords: PlacedWord[] = [];
    const occupiedAreas: Array<{ x: number; y: number; w: number; h: number }> = [];

    const cx = width / 2;
    const cy = height / 2;

    const sortedWords = [...words]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 80);

    for (let idx = 0; idx < sortedWords.length; idx++) {
      const wordObj = sortedWords[idx];
      const normalized = (wordObj.frequency - minFreq) / freqRange;
      const size = Math.round(minSize + normalized * (maxSize - minSize));
      const color = getColor(wordObj.category, idx);

      // Spiral placement
      let placed = false;
      for (let t = 0; t < 500; t++) {
        const angle = t * 0.3;
        const radius = 3 * t * 0.4;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle) * 0.6;

        const wordWidth = wordObj.word.length * size * 0.55;
        const wordHeight = size * 1.2;
        const left = x - wordWidth / 2;
        const top = y - wordHeight / 2;

        // Bounds check
        if (left < 5 || top < 5 || left + wordWidth > width - 5 || top + wordHeight > height - 5) {
          continue;
        }

        // Overlap check
        const overlaps = occupiedAreas.some(
          (area) =>
            left < area.x + area.w + 4 &&
            left + wordWidth + 4 > area.x &&
            top < area.y + area.h + 4 &&
            top + wordHeight + 4 > area.y
        );

        if (!overlaps) {
          placedWords.push({ word: wordObj.word, x, y, size, color, category: wordObj.category });
          occupiedAreas.push({ x: left, y: top, w: wordWidth, h: wordHeight });
          placed = true;
          break;
        }
      }

      if (!placed && idx < 20) {
        // Force-place important words
        const x = cx + (Math.random() - 0.5) * width * 0.7;
        const y = cy + (Math.random() - 0.5) * height * 0.7;
        placedWords.push({ word: wordObj.word, x, y, size, color, category: wordObj.category });
      }
    }

    setPlaced(placedWords);
  }, [words, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !placed.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    for (const pw of placed) {
      ctx.save();
      ctx.font = `${pw.size <= 18 ? '400' : pw.size <= 36 ? '600' : '700'} ${pw.size}px Inter, sans-serif`;
      ctx.fillStyle = pw.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pw.word, pw.x, pw.y);
      ctx.restore();
    }
  }, [placed, width, height]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const hit = placed.find((pw) => {
      const hw = pw.word.length * pw.size * 0.55 / 2;
      const hh = pw.size * 0.6;
      return mx >= pw.x - hw && mx <= pw.x + hw && my >= pw.y - hh && my <= pw.y + hh;
    });

    if (hit) {
      const original = words.find((w) => w.word === hit.word);
      setTooltip({
        word: hit.word,
        freq: original?.frequency || 0,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      canvas.style.cursor = 'pointer';
    } else {
      setTooltip(null);
      canvas.style.cursor = 'default';
    }
  };

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        className="w-full rounded-xl border border-verint-purple-pale bg-white shadow-verint"
        style={{ maxHeight: '520px', objectFit: 'contain' }}
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 bg-verint-purple-deeper text-white text-xs
                     px-3 py-2 rounded-lg shadow-xl whitespace-nowrap"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <strong>{tooltip.word}</strong>
          <span className="ml-2 text-verint-purple-pale">{tooltip.freq} mentions</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 px-2">
        {Object.entries(CATEGORY_COLORS).map(([cat, colors]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: colors[0] }} />
            <span className="text-xs text-gray-600 capitalize">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
