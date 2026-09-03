import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, TrendingDown, Minus, ShieldAlert, Compass, Search, ArrowRight, Layers } from 'lucide-react';

export default function CrimeHeatmapPage({ onNavigateToCase }) {
  const [mapData, setMapData] = useState(null);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await fetch('/api/v1/map/crime-summary');
        if (res.ok) {
          const data = await res.json();
          setMapData(data);
          if (data.hotspots?.length) setSelectedHotspot(data.hotspots[0]);
        }
      } catch (err) {
        console.error('Heatmap error:', err);
      }
    };
    fetchMap();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-red-900/40 bg-gradient-to-r from-red-950/40 via-black to-black shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-600/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>CRIMENEXUS AI - Geospatial Crime Heatmap</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-semibold font-mono">
                GEOSPATIAL AI
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              State and district-level crime densities, rising/declining risk zones, and suspect transit corridors across India.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: SVG Map Canvas (8 cols) + Hotspot Dossier (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Map Plot (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl glass-panel border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>National Incident Density Plot (India)</span>
            </span>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center space-x-1 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>Rising Crime Zone</span>
              </span>
              <span className="flex items-center space-x-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Controlled / Stable</span>
              </span>
            </div>
          </div>

          {/* SVG Map Layout */}
          <div className="relative w-full h-[400px] bg-slate-950/90 rounded-2xl border border-slate-800 flex items-center justify-center p-4 overflow-hidden">
            <svg viewBox="0 0 700 600" className="w-full h-full max-h-[380px]">
              {/* Grid Background */}
              <defs>
                <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />

              {/* Transit Lines */}
              <line x1="390" y1="210" x2="370" y2="195" stroke="#00f0ff" strokeWidth="2.5" strokeDasharray="5,5" className="animate-pulse" />
              <line x1="390" y1="210" x2="340" y2="370" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="6,6" className="animate-pulse" />
              <line x1="390" y1="210" x2="430" y2="240" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,4" />

              {/* States */}
              {mapData?.states?.map((st) => {
                const isSelected = selectedState?.state === st.state;
                return (
                  <g
                    key={st.state}
                    onClick={() => setSelectedState(st)}
                    className="cursor-pointer transition-transform hover:scale-105"
                  >
                    <circle
                      cx={st.cx}
                      cy={st.cy}
                      r={isSelected ? 24 : 18}
                      fill={st.trend === 'increasing' ? 'rgba(244,63,94,0.35)' : 'rgba(16,185,129,0.25)'}
                      stroke={st.trend === 'increasing' ? '#f43f5e' : '#10b981'}
                      strokeWidth={isSelected ? 3 : 1.5}
                    />
                    <text
                      x={st.cx}
                      y={st.cy + 4}
                      fill="#ffffff"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {st.code}
                    </text>
                    <text
                      x={st.cx}
                      y={st.cy + 24}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="Inter"
                      textAnchor="middle"
                    >
                      {st.incident_count} Cases
                    </text>
                  </g>
                );
              })}

              {/* Hotspots */}
              {mapData?.hotspots?.map((hs) => {
                const coords = {
                  'New Delhi': { x: 390, y: 200 },
                  'Gurgaon': { x: 360, y: 195 },
                  'Mumbai': { x: 330, y: 375 },
                  'Lucknow': { x: 440, y: 245 },
                  'Bengaluru': { x: 330, y: 450 },
                }[hs.city] || { x: 350, y: 300 };

                const isSelected = selectedHotspot?.id === hs.id;
                return (
                  <g key={hs.id} onClick={() => setSelectedHotspot(hs)} className="cursor-pointer">
                    <circle cx={coords.x} cy={coords.y} r={isSelected ? 9 : 6} fill={hs.risk === 'CRITICAL' ? '#f43f5e' : '#00f0ff'} className="animate-ping opacity-75" />
                    <circle cx={coords.x} cy={coords.y} r={isSelected ? 7 : 5} fill={hs.risk === 'CRITICAL' ? '#f43f5e' : '#00f0ff'} stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interstate Transit Corridors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {mapData?.interstate_corridors?.map((corridor, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-200 font-bold">
                  <span>{corridor.from} ➔ {corridor.to}</span>
                  <span className="text-red-400">{corridor.threat}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{corridor.activity}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Hotspot Dossier & Active Cases Link (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {selectedHotspot ? (
            <div className="p-6 rounded-2xl glass-panel border border-emerald-500/30 shadow-2xl space-y-4 text-xs">
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">HOTSPOT INTELLIGENCE</span>
                  <h3 className="text-base font-bold text-slate-100 mt-0.5">{selectedHotspot.name}</h3>
                  <div className="text-slate-400 font-mono text-[11px]">{selectedHotspot.city}, {selectedHotspot.state}</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-red-950 text-red-400 border border-red-800 font-mono font-bold">
                  {selectedHotspot.risk}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Criminal Operations:</span>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono">
                  {selectedHotspot.type}
                </div>
              </div>

              <button
                onClick={() => onNavigateToCase('FIR-2025-ND-101')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-black font-extrabold text-xs transition flex items-center justify-center space-x-1.5 shadow"
              >
                <span>Investigate Cases at this Hotspot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 text-center text-xs text-slate-500">
              Select a hotspot on the India map to inspect active operations.
            </div>
          )}

          {/* State Jurisdiction Box */}
          {selectedState && (
            <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20 shadow-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-200">{selectedState.state} Density</h4>
                <span className="font-mono text-cyan-400 font-bold">{selectedState.incident_count} Incidents</span>
              </div>
              <div className="text-slate-400">
                Operating Syndicates:
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {selectedState.high_risk_gangs?.map((g, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-mono">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
