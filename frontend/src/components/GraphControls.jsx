import React, { useState } from 'react';
import { 
  Filter, 
  Layers, 
  Route, 
  RotateCcw, 
  Database, 
  Sparkles,
  Check,
  X
} from 'lucide-react';

const CASE_OPTIONS = [
  { id: '', label: '🌐 All Cases (Cross-Case Network)' },
  { id: '101', label: '📁 Case 101: Armed Robbery & Extortion (Delhi)' },
  { id: '102', label: '📁 Case 102: Cyber Fraud & Crypto Ring' },
  { id: '103', label: '📁 Case 103: Arms Smuggling & Supply (UP)' },
  { id: '104', label: '📁 Case 104: Luxury Vehicle Theft (Mumbai)' },
  { id: '105', label: '📁 Case 105: Commercial Hawala Operations' },
];

const LAYOUT_OPTIONS = [
  { id: 'cose', label: 'Force-Directed (Physics)' },
  { id: 'concentric', label: 'Concentric (Hierarchy)' },
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
      className="glass-panel"
      style={{
        padding: '0.75rem 1rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}
    >
      {/* Left: Filters & Layouts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
        {/* Case Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={16} color="#818cf8" />
          <select
            value={selectedCase}
            onChange={(e) => onSelectCase(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-color)',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '0.45rem 0.75rem',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {CASE_OPTIONS.map((c) => (
              <option key={c.id} value={c.id} style={{ background: '#111827', color: '#ffffff' }}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Layout Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Layers size={16} color="#06b6d4" />
          <select
            value={layoutName}
            onChange={(e) => onSelectLayout(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-color)',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '0.45rem 0.75rem',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {LAYOUT_OPTIONS.map((l) => (
              <option key={l.id} value={l.id} style={{ background: '#111827', color: '#ffffff' }}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Path Finder & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {/* Shortest Path Trigger */}
        <button
          onClick={() => setShowPathFinder(!showPathFinder)}
          className="btn-primary"
          style={{
            padding: '0.45rem 0.85rem',
            fontSize: '0.82rem',
            background: hasActivePath ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : undefined,
          }}
        >
          <Route size={16} />
          <span>{hasActivePath ? 'Path Active' : 'Shortest Path Finder'}</span>
        </button>

        {hasActivePath && (
          <button
            onClick={onClearPath}
            title="Clear Path Highlight"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              borderRadius: '8px',
              padding: '0.45rem 0.65rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <X size={14} />
            <span>Reset Path</span>
          </button>
        )}

        {/* Reseed / Reconnect Neo4j Button */}
        <button
          onClick={onSeedGraph}
          title="Re-seed Neo4j Graph from Dataset"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-color)',
            color: '#9ca3af',
            borderRadius: '8px',
            padding: '0.45rem 0.75rem',
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
        >
          <Database size={15} />
          <span>Sync Neo4j</span>
        </button>
      </div>

      {/* Path Finder Dialog Modal */}
      {showPathFinder && (
        <div
          style={{
            position: 'absolute',
            top: '4.5rem',
            right: '1.5rem',
            background: 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            zIndex: 50,
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontWeight: 600, fontSize: '0.9rem' }}>
              <Sparkles size={16} />
              <span>Trace Suspect Connection Chain</span>
            </div>
            <button
              onClick={() => setShowPathFinder(false)}
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '0.3rem' }}>
              Source Entity:
            </label>
            <select
              value={sourceSuspect}
              onChange={(e) => setSourceSuspect(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-color)',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '0.4rem 0.6rem',
                fontSize: '0.82rem',
              }}
            >
              {suspects.map((s) => (
                <option key={s.id} value={s.id} style={{ background: '#111827' }}>
                  {s.name || s.id} ({s.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '0.3rem' }}>
              Target Entity:
            </label>
            <select
              value={targetSuspect}
              onChange={(e) => setTargetSuspect(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-color)',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '0.4rem 0.6rem',
                fontSize: '0.82rem',
              }}
            >
              {suspects.map((s) => (
                <option key={s.id} value={s.id} style={{ background: '#111827' }}>
                  {s.name || s.id} ({s.id})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExecutePath}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              marginTop: '0.35rem',
            }}
          >
            <Check size={16} />
            <span>Discover Shortest Path</span>
          </button>
        </div>
      )}
    </div>
  );
}
