import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, TrendingDown, Minus, AlertTriangle, Navigation, Shield, Compass, Layers } from 'lucide-react';

export default function CrimeIntelligenceMap() {
  const [mapData, setMapData] = useState(null);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [selectedState, setSelectedState] = useState(null);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const res = await fetch('/api/v1/map/crime-summary');
        if (res.ok) {
          const data = await res.json();
          setMapData(data);
          if (data.hotspots?.length > 0) {
            setSelectedHotspot(data.hotspots[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching map data:', err);
      }
    };
    fetchMapData();
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
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Geospatial Crime Intelligence & Hotspot Map</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-semibold font-mono">
                INTERSTATE CORRIDORS
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Jurisdictional Crime Density • Suspect Transit Routes • Active Safehouse Hotspots
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
          <span>Active Hotspots: <strong className="text-red-400">{mapData?.hotspots?.length || 6}</strong></span>
          <span>•</span>
          <span>Corridors: <strong className="text-red-500">{mapData?.interstate_corridors?.length || 3}</strong></span>
        </div>
      </div>

      {/* Main Grid: Map Canvas (8 cols) + Hotspot Intel Dossier (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Map Visualization (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl glass-panel border border-slate-800 shadow-2xl flex flex-col justify-between space-y-4 min-h-[500px]">
          {/* Map Controls */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>National Crime Density Plot</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">Live Telemetry</span>
          </div>

          {/* SVG Map Layout of India Crime Nodes */}
          <div className="relative w-full h-[380px] bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-4">
            <svg viewBox="0 0 700 600" className="w-full h-full max-h-[360px]">
              {/* Grid Background */}
              <defs>
                <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#map-grid)" />

              {/* Transit Corridors (Lines) */}
              <line x1="390" y1="210" x2="370" y2="195" stroke="#00f0ff" strokeWidth="2.5" strokeDasharray="5,5" className="animate-pulse" />
              <line x1="390" y1="210" x2="340" y2="370" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="6,6" className="animate-pulse" />
              <line x1="390" y1="210" x2="430" y2="240" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,4" />

              {/* State Density Clusters */}
              {mapData?.states?.map((st) => {
                const isSelected = selectedState?.state === st.state;
                return (
                  <g
                    key={st.state}
                    onClick={() => setSelectedState(st)}
                    className="cursor-pointer transition-transform hover:scale-110"
                  >
                    <circle
                      cx={st.cx}
                      cy={st.cy}
                      r={isSelected ? 22 : 16}
                      fill={st.trend === 'increasing' ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.25)'}
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
                      y={st.cy + 26}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="Inter"
                      textAnchor="middle"
                    >
                      {st.incident_count} Incidents
                    </text>
                  </g>
                );
              })}

              {/* Hotspot City Markers */}
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
                  <g
                    key={hs.id}
                    onClick={() => setSelectedHotspot(hs)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={isSelected ? 8 : 5}
                      fill={hs.risk === 'CRITICAL' ? '#f43f5e' : '#00f0ff'}
                      className="animate-ping opacity-75"
                    />
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={isSelected ? 7 : 5}
                      fill={hs.risk === 'CRITICAL' ? '#f43f5e' : '#00f0ff'}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interstate Corridors Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {mapData?.interstate_corridors?.map((corridor, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <div className="flex items-center justify-between font-mono font-bold text-slate-200">
                  <span>{corridor.from} ➔ {corridor.to}</span>
                  <span className="text-[10px] text-red-400">{corridor.threat}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{corridor.activity}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Hotspot / State Dossier (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Hotspot Card */}
          {selectedHotspot ? (
            <div className="p-5 rounded-2xl glass-panel border border-emerald-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                    GEOSPATIAL HOTSPOT
                  </span>
                  <h3 className="text-base font-bold text-slate-100">{selectedHotspot.name}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {selectedHotspot.city}, {selectedHotspot.state}
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                  {selectedHotspot.risk}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Primary Threat Profile:</label>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono">
                    {selectedHotspot.type}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Coordinates:</label>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                    Lat: {selectedHotspot.lat} • Lng: {selectedHotspot.lng}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 text-center text-xs text-slate-500">
              Click a hotspot or state marker on the map to inspect intelligence.
            </div>
          )}

          {/* State Jurisdiction Summary */}
          {selectedState && (
            <div className="p-5 rounded-2xl glass-panel border border-cyan-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-100">{selectedState.state} Jurisdiction</h4>
                <span className="text-xs font-mono text-cyan-400">{selectedState.incident_count} Cases</span>
              </div>
              <div className="text-xs text-slate-400">
                Active Syndicate Presence:
                <div className="flex flex-wrap gap-1.5 mt-2">
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
