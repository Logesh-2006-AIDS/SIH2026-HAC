import React, { useState, useEffect } from 'react';
import { MapPin, Filter, ArrowRight, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import axios from 'axios';

// Simplified India state SVG paths for an inline map
const INDIA_STATES = {
  'Delhi': { cx: 390, cy: 210, label: 'Delhi' },
  'Uttar Pradesh': { cx: 430, cy: 240, label: 'UP' },
  'Maharashtra': { cx: 340, cy: 370, label: 'MH' },
  'Karnataka': { cx: 330, cy: 440, label: 'KA' },
  'Tamil Nadu': { cx: 350, cy: 490, label: 'TN' },
  'West Bengal': { cx: 520, cy: 280, label: 'WB' },
  'Telangana': { cx: 370, cy: 390, label: 'TS' },
  'Rajasthan': { cx: 310, cy: 220, label: 'RJ' },
  'Chandigarh': { cx: 370, cy: 175, label: 'CH' },
  'Gujarat': { cx: 270, cy: 290, label: 'GJ' },
  'Madhya Pradesh': { cx: 370, cy: 300, label: 'MP' },
  'Punjab': { cx: 355, cy: 170, label: 'PB' },
  'Bihar': { cx: 490, cy: 250, label: 'BR' },
  'Odisha': { cx: 470, cy: 340, label: 'OR' },
  'Kerala': { cx: 320, cy: 500, label: 'KL' },
  'Assam': { cx: 580, cy: 230, label: 'AS' },
  'Jharkhand': { cx: 480, cy: 280, label: 'JH' },
  'Andhra Pradesh': { cx: 380, cy: 420, label: 'AP' },
  'Haryana': { cx: 370, cy: 195, label: 'HR' },
  'Uttarakhand': { cx: 400, cy: 180, label: 'UK' },
};

const TREND_COLORS = {
  increasing: { bg: 'rgba(239, 68, 68, 0.6)', border: '#ef4444', icon: TrendingUp, label: 'Increasing' },
  moderate: { bg: 'rgba(245, 158, 11, 0.5)', border: '#f59e0b', icon: TrendingUp, label: 'Moderate' },
  stable: { bg: 'rgba(16, 185, 129, 0.4)', border: '#10b981', icon: Minus, label: 'Stable' },
  decreasing: { bg: 'rgba(16, 185, 129, 0.6)', border: '#10b981', icon: TrendingDown, label: 'Decreasing' },
  insufficient_data: { bg: 'rgba(148, 163, 184, 0.2)', border: '#94a3b8', icon: Minus, label: 'Insufficient Data' },
};

export default function CrimeIntelligenceMap({ onSelectCase }) {
  const [mapData, setMapData] = useState({ locations: [], states: [] });
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationDetail, setLocationDetail] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/v1/map/crime-summary').then(res => {
      if (res.data?.data) setMapData(res.data.data);
    }).catch(err => console.error('Map data failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleStateClick = (stateName) => {
    setSelectedState(stateName);
    setSelectedLocation(null);
    setLocationDetail(null);
  };

  const getStateData = (stateName) => {
    return mapData.states?.find(s => s.state === stateName) || null;
  };

  const getStateTrend = (stateName) => {
    const data = getStateData(stateName);
    if (!data) return 'insufficient_data';
    return data.trend || 'insufficient_data';
  };

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', color: '#f8fafc', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <MapPin size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Crime Intelligence Map</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Geographic crime patterns calculated from investigation data</p>
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem' }}>
          {Object.entries(TREND_COLORS).filter(([k]) => k !== 'insufficient_data').map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: val.bg, border: `1px solid ${val.border}` }} />
              <span style={{ color: '#94a3b8' }}>{val.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + Detail Panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SVG India Map */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 70%)' }}>
          {loading ? (
            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading geographic intelligence...</div>
          ) : (
            <svg viewBox="200 100 450 500" style={{ width: '100%', height: '100%', maxWidth: '600px' }}>
              {/* India outline approximation */}
              <path d="M355,140 L380,135 L400,145 L420,155 L440,160 L460,170 L500,190 L530,210 L560,220 L590,225 L590,240 L570,260 L540,275 L520,290 L510,310 L490,330 L480,350 L470,370 L450,390 L430,410 L410,430 L390,450 L370,470 L360,490 L350,510 L340,520 L320,510 L310,490 L305,470 L310,450 L320,430 L300,410 L280,390 L260,360 L250,330 L255,300 L260,280 L270,260 L280,240 L290,220 L310,200 L330,180 L345,160 Z"
                fill="rgba(99, 102, 241, 0.08)" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.5" />

              {/* State circles */}
              {Object.entries(INDIA_STATES).map(([state, pos]) => {
                const trend = getStateTrend(state);
                const trendStyle = TREND_COLORS[trend] || TREND_COLORS.insufficient_data;
                const stateData = getStateData(state);
                const isSelected = selectedState === state;
                const caseCount = stateData?.total_cases || 0;
                const radius = Math.max(8, Math.min(20, 8 + caseCount * 3));

                return (
                  <g key={state} onClick={() => handleStateClick(state)} style={{ cursor: 'pointer' }}>
                    {/* Glow ring for active states */}
                    {caseCount > 0 && (
                      <circle cx={pos.cx} cy={pos.cy} r={radius + 4}
                        fill="none" stroke={trendStyle.border} strokeWidth="1" opacity="0.4">
                        <animate attributeName="r" from={radius + 2} to={radius + 8} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle cx={pos.cx} cy={pos.cy} r={radius}
                      fill={caseCount > 0 ? trendStyle.bg : 'rgba(148, 163, 184, 0.15)'}
                      stroke={isSelected ? '#ffffff' : trendStyle.border}
                      strokeWidth={isSelected ? 2.5 : 1} />
                    <text x={pos.cx} y={pos.cy + 3} textAnchor="middle" fill="#e5e7eb" fontSize="7" fontWeight="600">
                      {pos.label}
                    </text>
                    {caseCount > 0 && (
                      <text x={pos.cx} y={pos.cy - radius - 4} textAnchor="middle" fill={trendStyle.border} fontSize="8" fontWeight="700">
                        {caseCount}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Detail Panel */}
        <div style={{ width: '380px', borderLeft: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '1.25rem', overflowY: 'auto' }}>
          {selectedState ? (
            <StateDetailPanel
              stateName={selectedState}
              stateData={getStateData(selectedState)}
              locations={mapData.locations?.filter(l => l.state === selectedState) || []}
              onSelectCase={onSelectCase}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', textAlign: 'center', gap: '0.5rem' }}>
              <MapPin size={32} color="#4b5563" />
              <div style={{ fontSize: '0.9rem' }}>Click a state on the map to view crime intelligence</div>
              <div style={{ fontSize: '0.75rem' }}>Data is calculated from the investigation database</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StateDetailPanel({ stateName, stateData, locations, onSelectCase }) {
  if (!stateData) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
        <AlertTriangle size={20} style={{ marginBottom: '0.5rem' }} />
        <div>No investigation data available for {stateName}</div>
      </div>
    );
  }

  const trend = TREND_COLORS[stateData.trend] || TREND_COLORS.insufficient_data;
  const TrendIcon = trend.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase' }}>Geographic Intelligence</div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.25rem 0' }}>{stateName}</h3>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <StatCard label="Total Cases" value={stateData.total_cases} />
        <StatCard label="Entities" value={stateData.total_entities} />
        <StatCard label="Locations" value={stateData.locations?.length || 0} />
        <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Trend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
            <TrendIcon size={14} color={trend.border} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: trend.border }}>{trend.label}</span>
          </div>
        </div>
      </div>

      {/* Cases */}
      {stateData.cases?.length > 0 && (
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.5rem' }}>Related Cases</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[...new Set(stateData.cases)].map((c, idx) => (
              <button key={idx} onClick={() => onSelectCase && onSelectCase(c)}
                style={{ padding: '0.55rem 0.75rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', cursor: 'pointer', color: '#f8fafc', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span>Case #{c}</span>
                <ArrowRight size={14} color="#94a3b8" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Locations */}
      {locations.length > 0 && (
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.5rem' }}>Crime Locations</div>
          {locations.map((loc, idx) => (
            <div key={idx} style={{ padding: '0.55rem 0.75rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
              <div style={{ fontWeight: 600, color: '#f8fafc' }}>{loc.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{loc.total_cases} cases | {loc.entity_count} entities</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.2rem' }}>{value}</div>
    </div>
  );
}
