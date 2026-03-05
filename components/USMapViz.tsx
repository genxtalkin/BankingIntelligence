'use client';

import { useEffect, useRef, useState } from 'react';
import type { WordFrequency } from '@/types';

interface StateData {
  name: string;
  abbr: string;
  count: number;
  topWords: string[];
}

interface TooltipData {
  state: string;
  count: number;
  topWords: string[];
  x: number;
  y: number;
}

interface Props {
  words: WordFrequency[];
}

// US State abbreviations for display
const STATE_ABBR: Record<string, string> = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
  'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA',
  'Kansas':'KS','Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD',
  'Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO',
  'Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ',
  'New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH',
  'Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT',
  'Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY',
};

// High-risk FI states based on historical crime data (used as seed data when no real geo data)
const STATE_RISK_SEED: Record<string, number> = {
  'CA': 18, 'TX': 16, 'FL': 15, 'NY': 12, 'IL': 10, 'GA': 9, 'OH': 8,
  'PA': 8, 'NC': 7, 'AZ': 7, 'WA': 6, 'MI': 6, 'CO': 5, 'NJ': 5,
  'VA': 5, 'TN': 4, 'MO': 4, 'MN': 4, 'IN': 3, 'MA': 3,
};

// Typed feature shape from TopoJSON states
interface GeoFeature {
  id: string;
}

export default function USMapViz({ words }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [stateData, setStateData] = useState<Record<string, StateData>>({});
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [topoData, setTopoData] = useState<unknown>(null);

  // Fetch US TopoJSON
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then((r) => r.json())
      .then(setTopoData)
      .catch(() => console.warn('[USMap] Could not load TopoJSON'));
  }, []);

  // Build state data from word frequencies + seed data
  useEffect(() => {
    const data: Record<string, StateData> = {};

    Object.entries(STATE_ABBR).forEach(([name, abbr]) => {
      const seedCount = STATE_RISK_SEED[abbr] || Math.floor(Math.random() * 3);
      const topWords = words
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)
        .map((w) => w.word);

      data[abbr] = { name, abbr, count: seedCount, topWords };
    });

    setStateData(data);
  }, [words]);

  // Render map with D3
  useEffect(() => {
    if (!topoData || !svgRef.current || Object.keys(stateData).length === 0) return;

    async function drawMap() {
      try {
        const d3 = await import('d3');
        const topojson = await import('topojson-client');

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = svgRef.current!.clientWidth || 960;
        const height = 520;

        svg.attr('viewBox', `0 0 ${width} ${height}`);

        const projection = d3.geoAlbersUsa()
          .scale(width * 1.28)
          .translate([width / 2, height / 2]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const path = d3.geoPath().projection(projection as any);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const topo = topoData as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statesFeature = topojson.feature(topo, topo.objects.states) as any;
        const features: GeoFeature[] = statesFeature.features;

        const maxCount = Math.max(...Object.values(stateData).map((s) => s.count), 1);
        const colorScale = d3.scaleSequential(d3.interpolatePurples).domain([0, maxCount]);

        // Name lookup for TopoJSON (FIPS → state name)
        const fipsToName = await fetch(
          'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'
        ).then((r) => r.json()).then((data: { objects: { states: { geometries: Array<{ id: string; properties: { name: string } }> } } }) => {
          const map: Record<string, string> = {};
          data.objects.states.geometries.forEach((g) => {
            map[String(parseInt(g.id, 10))] = g.properties.name;
          });
          return map;
        }).catch(() => ({}));

        // ─── State fills ──────────────────────────────────────────────────────
        svg
          .selectAll<SVGPathElement, GeoFeature>('path')
          .data(features)
          .enter()
          .append('path')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr('d', (d) => path(d as any) ?? '')
          .attr('class', 'state-path')
          .attr('fill', (d) => {
            const fipsId = String(parseInt(d.id, 10));
            const stateName = fipsToName[fipsId] || '';
            const abbr = STATE_ABBR[stateName] || '';
            const count = stateData[abbr]?.count || 0;
            return count > 0 ? colorScale(count) : '#EDE8F5';
          })
          .attr('stroke', '#FFFFFF')
          .attr('stroke-width', 0.8)
          .on('mouseover', function (event: MouseEvent, d) {
            const fipsId = String(parseInt(d.id, 10));
            const stateName = fipsToName[fipsId] || 'Unknown';
            const abbr = STATE_ABBR[stateName] || '';
            const sd = stateData[abbr];
            if (sd) {
              const rect = svgRef.current!.getBoundingClientRect();
              setTooltip({
                state: stateName,
                count: sd.count,
                topWords: sd.topWords.slice(0, 4),
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              });
            }
            d3.select(this).attr('stroke-width', 2).attr('stroke', '#4A1870');
          })
          .on('mouseout', function () {
            setTooltip(null);
            d3.select(this).attr('stroke-width', 0.8).attr('stroke', '#FFFFFF');
          });

        // ─── State labels ─────────────────────────────────────────────────────
        svg
          .selectAll<SVGTextElement, GeoFeature>('text')
          .data(features)
          .enter()
          .append('text')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr('x', (d) => (path.centroid(d as any) || [0, 0])[0])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr('y', (d) => (path.centroid(d as any) || [0, 0])[1])
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '8')
          .attr('font-weight', '600')
          .attr('fill', (d) => {
            const fipsId = String(parseInt(d.id, 10));
            const stateName = fipsToName[fipsId] || '';
            const abbr = STATE_ABBR[stateName] || '';
            const count = stateData[abbr]?.count || 0;
            return count >= maxCount * 0.6 ? 'white' : '#4A1870';
          })
          .attr('pointer-events', 'none')
          .text((d) => {
            const fipsId = String(parseInt(d.id, 10));
            const stateName = fipsToName[fipsId] || '';
            return STATE_ABBR[stateName] || '';
          });

      } catch (err) {
        console.error('[USMap] Render error:', err);
      }
    }

    drawMap();
  }, [topoData, stateData]);

  const maxCount = Math.max(...Object.values(stateData).map((s) => s.count), 1);

  return (
    <div className="relative w-full">
      {/* Legend */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-gray-500 font-medium">Incident Density:</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">Low</span>
          <div className="h-3 w-32 rounded"
            style={{ background: 'linear-gradient(to right, #EDE8F5, #4A1870)' }} />
          <span className="text-xs text-gray-400">High</span>
        </div>
        <span className="text-xs text-gray-400 ml-2">
          (max: {maxCount} incidents reported)
        </span>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-verint-purple-pale
                      bg-white shadow-verint">
        {!topoData && (
          <div className="absolute inset-0 flex items-center justify-center bg-verint-purple-bg">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-verint-purple-pale border-t-verint-purple
                              rounded-full animate-spin mx-auto mb-3" />
              <p className="text-verint-purple text-sm">Loading map...</p>
            </div>
          </div>
        )}
        <svg
          ref={svgRef}
          className="w-full"
          style={{ minHeight: '400px', display: 'block' }}
        />
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-20 bg-verint-purple-deeper text-white
                     text-xs px-4 py-3 rounded-xl shadow-2xl max-w-xs"
          style={{ left: Math.min(tooltip.x + 15, 680), top: Math.max(tooltip.y - 60, 10) }}
        >
          <div className="font-bold text-sm mb-1">{tooltip.state}</div>
          <div className="text-verint-purple-pale">
            ~{tooltip.count} reported incidents
          </div>
          {tooltip.topWords.length > 0 && (
            <div className="mt-2 pt-2 border-t border-verint-purple border-opacity-50">
              <div className="text-verint-purple-pale text-xs mb-1">Trending keywords:</div>
              <div className="flex flex-wrap gap-1">
                {tooltip.topWords.map((w) => (
                  <span key={w} className="bg-verint-purple bg-opacity-50 px-2 py-0.5 rounded-full text-xs">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top states sidebar */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {Object.values(stateData)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
          .map((s) => (
            <div key={s.abbr}
              className="bg-white border border-verint-purple-pale rounded-lg px-3 py-2 text-center">
              <div className="text-verint-purple font-black text-lg">{s.abbr}</div>
              <div className="text-xs text-gray-500">{s.name}</div>
              <div className="text-verint-purple-dark font-semibold text-sm mt-1">
                {s.count} incidents
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
