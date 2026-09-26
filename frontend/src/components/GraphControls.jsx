import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Layers, 
  Route, 
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
  { id: 'cose', label: '🕸️ CoSE Physics (Default)' },
  { id: 'concentric', label: '🎯 Concentric Hierarchy' },
  { id: 'circle', label: '⭕ Circular Cluster' },
  { id: 'grid', label: '⊞ Matrix Grid' },
  { id: 'breadthfirst', label: '🌲 Tree Hierarchy' },
];

const RELATIONSHIP_OPTIONS = [
  { id: '', label: 'All Relationship Types' },
  { id: 'ACCUSED_IN', label: 'ACCUSED_IN (FIR Charge)' },
  { id: 'COMMUNICATED_WITH', label: 'COMMUNICATED_WITH (Calls/CDR)' },
  { id: 'TRANSFERRED_MONEY', label: 'TRANSFERRED_MONEY (Financial)' },
  { id: 'OPERATES_VEHICLE', label: 'OPERATES_VEHICLE (Logistics)' },
  { id: 'ASSOCIATED_WITH', label: 'ASSOCIATED_WITH (Syndicate)' },
  { id: 'FINANCES_GANG', label: 'FINANCES_GANG (Hawala)' },
  { id: 'SIGHTED_AT', label: 'SIGHTED_AT (Location Pin)' },
  { id: 'OWNS', label: 'OWNS (Asset / Account)' },
];

export default function GraphControls({
  selectedCase = '',
  onSelectCase = () => {},
  layoutName = 'cose',
  onSelectLayout = () => {},
  minConfidence = 0.0,
  onSelectMinConfidence = () => {},
  relationshipType = '',
  onSelectRelationshipType = () => {},
  entityType = 'ALL',
  onSelectEntityType = () => {},
  onFindPath = () => {},
  onClearPath = () => {},
  hasActivePath = false,
  suspects = [],
  pathSourceId = null,
  focusMode = true,
  onToggleFocusMode = () => {},
  expandHops = 1,
  onExpandHops = () => {},
  graphFocusEntity = null,
  onClearFocus = () => {},
}) {
  const [showPathFinder, setShowPathFinder] = useState(false);
  const [sourceSuspect, setSourceSuspect] = useState(pathSourceId || 'P001');
  const [targetSuspect, setTargetSuspect] = useState('P004');

  useEffect(() => {
    if (pathSourceId) setSourceSuspect(pathSourceId);
  }, [pathSourceId]);

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
        flexDirection: 'column',
        gap: '0.75rem',
        marginBottom: '1rem',
        position: 'relative',
        zIndex: 15,
      }}
    >
      {/* Top Row: Case, Layout, Confidence & Path Tracing */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem' }}>
        {/* Left: Case Filter & Layout Control */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          {/* Case Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={15} color="#D9AA3D" />
            <select
              value={selectedCase}
              onChange={(e) => onSelectCase(e.target.value)}
              style={{
                background: 'rgba(16, 19, 17, 0.85)',
                border: '1px solid var(--border-color)',
                color: '#F1EBDD',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.82rem',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={15} color="#5E9F68" />
            <select
              value={layoutName}
              onChange={(e) => onSelectLayout(e.target.value)}
              style={{
                background: 'rgba(16, 19, 17, 0.85)',
                border: '1px solid var(--border-color)',
                color: '#F1EBDD',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.82rem',
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

          {/* Relationship Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <select
              value={relationshipType}
              onChange={(e) => onSelectRelationshipType(e.target.value)}
              style={{
                background: 'rgba(16, 19, 17, 0.85)',
                border: '1px solid var(--border-color)',
                color: '#F1EBDD',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {RELATIONSHIP_OPTIONS.map((r) => (
                <option key={r.id} value={r.id} style={{ background: '#101311', color: '#F1EBDD' }}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Min Confidence Threshold */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.35)', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.75rem', color: '#A6B0AA', fontWeight: 600 }}>Min Conf:</span>
            <input
              type="range"
              min="0"
              max="0.95"
              step="0.05"
              value={minConfidence}
              onChange={(e) => onSelectMinConfidence(parseFloat(e.target.value))}
              style={{ width: '70px', accentColor: '#D9AA3D', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#D9AA3D', fontWeight: 700, minWidth: '32px' }}>
              {Math.round(minConfidence * 100)}%
            </span>
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

          {/* Person Focus & Hop Expansion Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.4)', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={onToggleFocusMode}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: focusMode ? 'rgba(217,170,61,0.5)' : 'rgba(255,255,255,0.1)',
                background: focusMode ? 'rgba(217,170,61,0.2)' : 'transparent',
                color: focusMode ? '#D9AA3D' : '#A6B0AA',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {focusMode ? '🎯 Focus Mode: ON' : '🎯 Person Focus'}
            </button>

            <button
              type="button"
              onClick={() => {
                onExpandHops(1);
                if (!focusMode) onToggleFocusMode();
              }}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: focusMode && expandHops === 1 ? 'rgba(78,205,196,0.5)' : 'rgba(255,255,255,0.1)',
                background: focusMode && expandHops === 1 ? 'rgba(78,205,196,0.2)' : 'transparent',
                color: focusMode && expandHops === 1 ? '#4ECDC4' : '#A6B0AA',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Expand 1 Hop
            </button>

            <button
              type="button"
              onClick={() => {
                onExpandHops(2);
                if (!focusMode) onToggleFocusMode();
              }}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: focusMode && expandHops === 2 ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
                background: focusMode && expandHops === 2 ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: focusMode && expandHops === 2 ? '#818CF8' : '#A6B0AA',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Expand 2 Hops
            </button>

            <button
              type="button"
              onClick={onClearFocus}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: !focusMode && !graphFocusEntity ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: !focusMode && !graphFocusEntity ? '#F1EBDD' : '#A6B0AA',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🌐 Full Network
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Entity Type Quick Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', paddingTop: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: '0.73rem', color: '#8A948C', fontWeight: 600, textTransform: 'uppercase', marginRight: '0.3rem' }}>
          Entity Filter:
        </span>
        {['ALL', 'PERSON', 'PHONE', 'ORGANIZATION', 'VEHICLE', 'FINANCIALACCOUNT', 'LOCATION'].map((t) => {
          const label = t === 'FINANCIALACCOUNT' ? 'ACCOUNT' : t;
          const active = entityType.toUpperCase() === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onSelectEntityType(t)}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '5px',
                border: active ? '1px solid #D9AA3D' : '1px solid rgba(255,255,255,0.08)',
                background: active ? '#D9AA3D' : 'rgba(0,0,0,0.3)',
                color: active ? '#101311' : '#A6B0AA',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          );
        })}
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
