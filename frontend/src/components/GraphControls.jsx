import React, { useState } from 'react';
import { 
  Filter, 
  Layers, 
  Route, 
  Database, 
  Sparkles,
  Check,
  X
} from 'lucide-react';

const CASE_OPTIONS = [
  { id: '', label: '🌐 All Cases (Cross-Case Network Board)' },
  { id: '101', label: '📁 Case 101: Armed Robbery & Extortion (Delhi)' },
  { id: '102', label: '📁 Case 102: Cyber Fraud & Crypto Ring' },
  { id: '103', label: '📁 Case 103: Arms Smuggling & Supply (UP)' },
  { id: '104', label: '📁 Case 104: Luxury Vehicle Theft (Mumbai)' },
  { id: '105', label: '📁 Case 105: Commercial Hawala Operations' },
];

const LAYOUT_OPTIONS = [
  { id: 'cose', label: 'Force-Directed (Physics Board)' },
  { id: 'concentric', label: 'Concentric (Hierarchy Pins)' },
  { id: 'circle', label: 'Circular Cluster' },
  { id: 'grid', label: 'Matrix Grid' },
];

export default function GraphControls({
  selectedCase = '',
  onSelectCase = () => {},
  layoutName = 'cose',
  onSelectLayout = () => {},
  onFindPath = () => {},
  onSeedGraph = () => {},
  onClearPath = () => {},
  hasActivePath = false,
  suspects = [],
}) {
  const [showPathFinder, setShowPathFinder] = useState(false);
  const [sourceSuspect, setSourceSuspect] = useState('P001');
  const [targetSuspect, setTargetSuspect] = useState('P004');

  const handleExecutePath = () => {
    if (!sourceSuspect || !targetSuspect) return;
    onFindPath(sourceSuspect, targetSuspect);
    setShowPathFinder(false);
  };

  return (
    <div
      className="forensic-panel"
      style={{
        padding: '0.75rem 1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.85rem',
        marginBottom: '1rem',
        position: 'relative',
        zIndex: 15,
      }}
    >
      {/* Left: Case Filter & Layout Control */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        {/* Case Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#D9AA3D" />
          <select
            value={selectedCase}
            onChange={(e) => onSelectCase(e.target.value)}
            style={{
              background: 'rgba(16, 19, 17, 0.85)',
              border: '1px solid var(--border-color)',
              color: '#F1EBDD',
              borderRadius: '8px',
              padding: '0.5rem 0.85rem',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {CASE_OPTIONS.map((c) => (
              <option key={c.id} value={c.id} style={{ background: '#101311', color: '#F1EBDD' }}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Layout Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={16} color="#5E9F68" />
          <select
            value={layoutName}
            onChange={(e) => onSelectLayout(e.target.value)}
            style={{
              background: 'rgba(16, 19, 17, 0.85)',
              border: '1px solid var(--border-color)',
              color: '#F1EBDD',
              borderRadius: '8px',
              padding: '0.5rem 0.85rem',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {LAYOUT_OPTIONS.map((l) => (
              <option key={l.id} value={l.id} style={{ background: '#101311', color: '#F1EBDD' }}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Path Finder & Sync Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Shortest Path Trigger */}
        <button
          onClick={() => setShowPathFinder(!showPathFinder)}
          className={hasActivePath ? "btn-red" : "btn-primary"}
          style={{
            padding: '0.5rem 0.95rem',
            fontSize: '0.83rem',
          }}
        >
          <Route size={16} />
          <span>{hasActivePath ? 'Red String Connection Active' : 'Trace Connection String'}</span>
        </button>

        {hasActivePath && (
          <button
            onClick={onClearPath}
            title="Clear Path Highlight"
            style={{
              background: 'rgba(201, 42, 42, 0.15)',
              border: '1px solid rgba(201, 42, 42, 0.35)',
              color: '#ff6b6b',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            <X size={14} />
            <span>Reset String</span>
          </button>
        )}

        {/* Reseed / Reconnect Neo4j Button */}
        <button
          onClick={onSeedGraph}
          title="Re-seed Neo4j Graph from Dataset"
          className="btn-secondary"
          style={{
            padding: '0.5rem 0.85rem',
            fontSize: '0.82rem',
            gap: '0.4rem',
          }}
        >
          <Database size={15} color="#D9AA3D" />
          <span>Sync Evidence Graph</span>
        </button>
      </div>

      {/* Path Finder Dialog Modal */}
      {showPathFinder && (
        <div
          className="animate-slide-up forensic-panel"
          style={{
            position: 'absolute',
            top: '4.8rem',
            right: '1.5rem',
            background: 'rgba(16, 19, 17, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(214, 40, 40, 0.5)',
            borderRadius: '14px',
            padding: '1.35rem',
            boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 20px rgba(214, 40, 40, 0.2)',
            zIndex: 50,
            width: '330px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.95rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#D62828', fontWeight: 800, fontSize: '0.92rem' }}>
              <Sparkles size={17} />
              <span>Trace Red Connection String</span>
            </div>
            <button
              onClick={() => setShowPathFinder(false)}
              style={{ background: 'transparent', border: 'none', color: '#A6B0AA', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#A6B0AA', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
              Source Evidence Pin:
            </label>
            <select
              value={sourceSuspect}
              onChange={(e) => setSourceSuspect(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(8, 10, 9, 0.8)',
                border: '1px solid var(--border-color)',
                color: '#F1EBDD',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.83rem',
              }}
            >
              {suspects.map((s) => (
                <option key={s.id} value={s.id} style={{ background: '#101311' }}>
                  {s.name || s.id} ({s.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#A6B0AA', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
              Target Evidence Pin:
            </label>
            <select
              value={targetSuspect}
              onChange={(e) => setTargetSuspect(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(8, 10, 9, 0.8)',
                border: '1px solid var(--border-color)',
                color: '#F1EBDD',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.83rem',
              }}
            >
              {suspects.map((s) => (
                <option key={s.id} value={s.id} style={{ background: '#101311' }}>
                  {s.name || s.id} ({s.id})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExecutePath}
            className="btn-red"
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: '0.35rem',
            }}
          >
            <Check size={16} />
            <span>Connect Evidence String</span>
          </button>
        </div>
      )}
    </div>
  );
}
