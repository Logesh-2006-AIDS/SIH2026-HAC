import React, { useState, useEffect } from 'react';
import { MapPin, ArrowRight, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
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
  increasing: { bg: 'rgba(214, 40, 40, 0.65)', border: '#D62828', icon: TrendingUp, label: 'Increasing' },
  moderate: { bg: 'rgba(217, 170, 61, 0.55)', border: '#D9AA3D', icon: TrendingUp, label: 'Moderate' },
  stable: { bg: 'rgba(94, 159, 104, 0.45)', border: '#5E9F68', icon: Minus, label: 'Stable' },
  decreasing: { bg: 'rgba(94, 159, 104, 0.65)', border: '#5E9F68', icon: TrendingDown, label: 'Decreasing' },
  insufficient_data: { bg: 'rgba(166, 176, 170, 0.25)', border: '#A6B0AA', icon: Minus, label: 'Insufficient Data' },
};

export default function CrimeIntelligenceMap({ onSelectCase }) {
  const [mapData, setMapData] = useState({ locations: [], states: [] });
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/v1/map/crime-summary').then(res => {
      if (res.data?.data) setMapData(res.data.data);
    }).catch(err => console.error('Map data failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleStateClick = (stateName) => {
    setSelectedState(stateName);
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
    <div className="animate-fade-in" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent', color: '#F1EBDD', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(16, 19, 17, 0.92)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(214, 40, 40, 0.18)', color: '#D62828', border: '1px solid rgba(214, 40, 40, 0.3)', boxShadow: '0 0 12px rgba(214, 40, 40, 0.2)' }}>
            <MapPin size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Crime Intelligence Map Board</h2>
            <p style={{ fontSize: '0.8rem', color: '#A6B0AA', margin: 0 }}>Geographic crime density & intelligence distribution across jurisdictions</p>
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.74rem' }}>
          {Object.entries(TREND_COLORS).filter(([k]) => k !== 'insufficient_data').map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: val.bg, border: `1px solid ${val.border}`, boxShadow: `0 0 6px ${val.border}` }} />
              <span style={{ color: '#F1EBDD', fontWeight: 600 }}>{val.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + Detail Panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SVG India Map */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 50%, rgba(217, 170, 61, 0.05) 0%, transparent 75%)' }}>
          {loading ? (
            <div style={{ color: '#A6B0AA', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="animate-spin" style={{ width: 22, height: 22, border: '3px solid rgba(217,170,61,0.3)', borderTopColor: '#D9AA3D', borderRadius: '50%' }} />
              Loading geographic evidence pins...
            </div>
          ) : (
            <svg viewBox="200 100 450 500" style={{ width: '100%', height: '100%', maxWidth: '650px' }}>
              {/* India outline approximation */}
              <path d="M355,140 L380,135 L400,145 L420,155 L440,160 L460,170 L500,190 L530,210 L560,220 L590,225 L590,240 L570,260 L540,275 L520,290 L510,310 L490,330 L480,350 L470,370 L450,390 L430,410 L410,430 L390,450 L370,470 L360,490 L350,510 L340,520 L320,510 L310,490 L305,470 L310,450 L320,430 L300,410 L280,390 L260,360 L250,330 L255,300 L260,280 L270,260 L280,240 L290,220 L310,200 L330,180 L345,160 Z"
                fill="rgba(16, 19, 17, 0.85)" stroke="rgba(217, 170, 61, 0.35)" strokeWidth="1.5" />

              {/* State circles / Pins */}
              {Object.entries(INDIA_STATES).map(([state, pos]) => {
                const trend = getStateTrend(state);
                const trendStyle = TREND_COLORS[trend] || TREND_COLORS.insufficient_data;
                const stateData = getStateData(state);
                const isSelected = selectedState === state;
                const caseCount = stateData?.total_cases || 0;
                const radius = Math.max(9, Math.min(22, 9 + caseCount * 3));

                return (
                  <g key={state} onClick={() => handleStateClick(state)} style={{ cursor: 'pointer' }}>
                    {/* Glow ring for active states */}
                    {caseCount > 0 && (
                      <circle cx={pos.cx} cy={pos.cy} r={radius + 5}
                        fill="none" stroke={trendStyle.border} strokeWidth="1.5" opacity="0.5">
                        <animate attributeName="r" from={radius + 2} to={radius + 10} dur="2.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.5" to="0" dur="2.2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle cx={pos.cx} cy={pos.cy} r={radius}
                      fill={caseCount > 0 ? trendStyle.bg : 'rgba(166, 176, 170, 0.15)'}
                      stroke={isSelected ? '#F1EBDD' : trendStyle.border}
                      strokeWidth={isSelected ? 3 : 1.2} />
                    <text x={pos.cx} y={pos.cy + 3} textAnchor="middle" fill="#F1EBDD" fontSize="7.5" fontWeight="800">
                      {pos.label}
                    </text>
                    {caseCount > 0 && (
                      <text x={pos.cx} y={pos.cy - radius - 5} textAnchor="middle" fill={trendStyle.border} fontSize="8.5" fontWeight="800">
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
        <div style={{ width: '400px', borderLeft: '1px solid var(--border-color)', background: 'rgba(16, 19, 17, 0.95)', backdropFilter: 'blur(12px)', padding: '1.5rem', overflowY: 'auto' }}>
          {selectedState ? (
            <StateDetailPanel
              stateName={selectedState}
              stateData={getStateData(selectedState)}
              locations={mapData.locations?.filter(l => l.state === selectedState) || []}
              onSelectCase={onSelectCase}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6C7A73', textAlign: 'center', gap: '0.6rem' }}>
              <MapPin size={36} color="#D9AA3D" />
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1EBDD' }}>Click a jurisdiction state pin on the map</div>
              <div style={{ fontSize: '0.78rem', color: '#A6B0AA' }}>Geographic crime density aggregated from active FIR evidence</div>
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
      <div style={{ padding: '1.25rem', textAlign: 'center', color: '#6C7A73' }}>
        <AlertTriangle size={22} style={{ marginBottom: '0.5rem' }} />
        <div>No active investigation data recorded for {stateName}</div>
      </div>
    );
  }

  const trend = TREND_COLORS[stateData.trend] || TREND_COLORS.insufficient_data;
  const TrendIcon = trend.icon;

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D9AA3D', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Jurisdiction Intelligence</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.2rem 0' }}>{stateName}</h3>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
        <StatCard label="Total Cases" value={stateData.total_cases} />
        <StatCard label="Entities" value={stateData.total_entities} />
        <StatCard label="Locations" value={stateData.locations?.length || 0} />
        <div className="forensic-panel" style={{ padding: '0.85rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#A6B0AA', fontWeight: 700 }}>Activity Trend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
            <TrendIcon size={15} color={trend.border} />
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: trend.border }}>{trend.label}</span>
          </div>
        </div>
      </div>

      {/* Cases */}
      {stateData.cases?.length > 0 && (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F1EBDD', marginBottom: '0.55rem' }}>Related Case Dossiers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {[...new Set(stateData.cases)].map((c, idx) => (
              <button key={idx} onClick={() => onSelectCase && onSelectCase(c)}
                style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', cursor: 'pointer', color: '#F1EBDD', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#D9AA3D')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <span style={{ fontWeight: 700 }}>Case #{c}</span>
                <ArrowRight size={14} color="#D9AA3D" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Locations */}
      {locations.length > 0 && (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F1EBDD', marginBottom: '0.55rem' }}>Key Crime Locations</div>
          {locations.map((loc, idx) => (
            <div key={idx} style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', marginBottom: '0.45rem', fontSize: '0.84rem' }}>
              <div style={{ fontWeight: 800, color: '#F1EBDD' }}>{loc.name}</div>
              <div style={{ fontSize: '0.74rem', color: '#A6B0AA', marginTop: '0.15rem' }}>{loc.total_cases} cases | {loc.entity_count} entities</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="forensic-panel" style={{ padding: '0.85rem' }}>
      <div style={{ fontSize: '0.72rem', color: '#A6B0AA', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F1EBDD', marginTop: '0.2rem' }}>{value}</div>
    </div>
  );
}
