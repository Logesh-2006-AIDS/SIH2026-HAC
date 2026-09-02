import React, { useState } from 'react';
import { MapPin, Filter, AlertTriangle, ExternalLink } from 'lucide-react';

const HOTSPOT_LOCATIONS = [
  { id: 1, name: 'Delhi NCR - Sector 42', cases: 4, suspects: 8, crimeType: 'Hawala Transfer', risk: 'HIGH', lat: '28.6139', lon: '77.2090' },
  { id: 2, name: 'Mumbai - BKC Financial District', cases: 3, suspects: 5, crimeType: 'Cyber Fraud & Shell Accounts', risk: 'CRITICAL', lat: '19.0760', lon: '72.8777' },
  { id: 3, name: 'Bengaluru - Electronic City', cases: 2, suspects: 3, crimeType: 'SIM Box & VoIP Fraud', risk: 'MEDIUM', lat: '12.9716', lon: '77.5946' },
  { id: 4, name: 'Chandigarh Toll Plaza', cases: 1, suspects: 2, crimeType: 'Vehicle Transit Hideout', risk: 'LOW', lat: '30.7333', lon: '76.7794' }
];

export default function InvestigationHeatmap({ onOpenGraph }) {
  const [selectedHotspot, setSelectedHotspot] = useState(HOTSPOT_LOCATIONS[0]);
  const [filterCrime, setFilterCrime] = useState('ALL');

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', color: '#f8fafc' }}>
      {/* Top Filter Bar */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <MapPin size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Geographic Crime & Cell Tower Heatmap</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Spatial concentration of crime scenes, tower pings & hideouts</p>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            value={filterCrime}
            onChange={(e) => setFilterCrime(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: '#cbd5e1',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            <option value="ALL">All Crime Categories</option>
            <option value="HAWALA">Hawala & Money Laundering</option>
            <option value="CYBER">Cyber Fraud</option>
            <option value="VEHICLE">Vehicle Transit</option>
          </select>
        </div>
      </div>

      {/* Map Visualizer Layout */}
      <div style={{ flex: 1, padding: '1.5rem', display: 'flex', gap: '1.5rem' }}>
        {/* Left: Interactive Location Hotspot Cards Grid */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {HOTSPOT_LOCATIONS.map((loc) => (
            <div
              key={loc.id}
              onClick={() => setSelectedHotspot(loc)}
              style={{
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: selectedHotspot.id === loc.id ? '2px solid #00f2fe' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={18} color={loc.risk === 'CRITICAL' ? '#ef4444' : '#f59e0b'} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>{loc.name}</h3>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                  Primary Activity: <strong style={{ color: '#cbd5e1' }}>{loc.crimeType}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  background: loc.risk === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: loc.risk === 'CRITICAL' ? '#f87171' : '#fbbf24'
                }}>
                  {loc.risk} HOTSPOT
                </span>
                <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '0.3rem', fontWeight: 600 }}>
                  {loc.cases} Linked Cases • {loc.suspects} Suspects
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Selected Hotspot Details Panel */}
        <div style={{ width: '380px', padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00f2fe', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Selected Geographic Node</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{selectedHotspot.name}</h3>
            
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              GPS Coords: {selectedHotspot.lat}, {selectedHotspot.lon}
            </div>

            <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.5rem' }}>Hotspot Intelligence Breakdown</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                • High density of cell tower handovers during 23:00 - 04:00 hrs.<br/>
                • 2 suspect vehicles logged within 500m radius.<br/>
                • Linked to Hawala cash pickup points.
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenGraph && onOpenGraph()}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              color: '#090d16',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            Filter Knowledge Graph To Location <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
