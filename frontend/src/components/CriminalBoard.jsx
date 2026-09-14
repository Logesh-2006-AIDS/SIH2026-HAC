import React, { useMemo, useState } from 'react';
import {
  Shield, Bot, Map, Network, Upload, FileText,
  Crosshair, CheckCircle2, Search, Database, Lightbulb, ArrowRight,
  FolderOpen, Clock, AlertTriangle,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

/**
 * Investigator Board — corkboard of workflow steps (not disconnected apps).
 */
export default function CriminalBoard() {
  const {
    selectedCase, setSelectedCase, setActiveTab, currentRole, setCurrentRole,
    caseSummary, casesList, continueInvestigation, openCase,
  } = useInvestigation();

  const [lampOn, setLampOn] = useState(true);
  const [hovered, setHovered] = useState(null);

  const dossier = caseSummary?.dossier;

  const NOTES = useMemo(() => ([
    { id: 'dossiers', label: 'Case Dossiers', icon: FolderOpen, tone: 'cream', pin: 'gold', x: 4, y: 10, rot: -2, w: 140 },
    { id: 'investigation', label: 'Case Brief', icon: FileText, tone: 'yellow', pin: 'red', x: 22, y: 8, rot: 1.5, w: 128, section: 'brief' },
    { id: 'entity', label: 'Entity Investigation', icon: Search, tone: 'orange', pin: 'red', x: 40, y: 10, rot: -1, w: 156 },
    { id: 'network', label: 'Link Analysis', icon: Network, tone: 'cream', pin: 'blue', x: 5, y: 32, rot: 2, w: 132 },
    { id: 'crosscase', label: 'Cross-Case', icon: Crosshair, tone: 'yellow', pin: 'red', x: 24, y: 36, rot: -1.5, w: 128 },
    { id: 'investigation-timeline', label: 'Timeline', icon: Clock, tone: 'blue', pin: 'gold', x: 42, y: 34, rot: 1, w: 120, section: 'timeline', tab: 'investigation' },
    { id: 'investigation-evidence', label: 'Evidence', icon: Shield, tone: 'cream', pin: 'blue', x: 6, y: 54, rot: -2, w: 120, section: 'evidence', tab: 'investigation' },
    { id: 'copilot', label: 'AI Copilot', kind: 'copilot', pin: 'gold', x: 64, y: 22, rot: 1, w: 180 },
    { id: 'investigation-leads', label: 'Potential Leads', icon: AlertTriangle, tone: 'orange', pin: 'red', x: 24, y: 58, rot: 1.5, w: 148, section: 'leads', tab: 'investigation' },
    { id: 'verification', label: 'Lead Verification', icon: CheckCircle2, tone: 'yellow', pin: 'gold', x: 44, y: 62, rot: -1, w: 152 },
    { id: 'ingest', label: 'Add Evidence', icon: Upload, tone: 'blue', pin: 'blue', x: 6, y: 74, rot: 2, w: 136 },
    { id: 'map', label: 'Crime Intelligence Map', kind: 'map', pin: 'blue', x: 62, y: 56, rot: -0.8, w: 200 },
    { id: 'report', label: 'Investigation Report', icon: FileText, tone: 'cream', pin: 'gold', x: 42, y: 78, rot: -1.5, w: 158 },
  ]), []);

  const PINS = useMemo(() => ({
    hub: { x: 48, y: 26 },
    dossiers: { x: 10, y: 14 }, investigation: { x: 28, y: 12 }, entity: { x: 48, y: 14 },
    network: { x: 10, y: 36 }, crosscase: { x: 30, y: 40 }, 'investigation-timeline': { x: 48, y: 38 },
    'investigation-evidence': { x: 12, y: 58 }, copilot: { x: 74, y: 30 },
    'investigation-leads': { x: 32, y: 62 }, verification: { x: 52, y: 66 },
    ingest: { x: 12, y: 78 }, map: { x: 72, y: 64 }, report: { x: 50, y: 82 },
  }), []);

  const ROPES = useMemo(() => ([
    ['hub', 'dossiers'], ['hub', 'investigation'], ['hub', 'entity'], ['hub', 'network'],
    ['hub', 'crosscase'], ['hub', 'copilot'], ['hub', 'map'], ['hub', 'verification'],
    ['dossiers', 'investigation'], ['investigation', 'entity'], ['entity', 'network'],
    ['network', 'crosscase'], ['crosscase', 'investigation-timeline'],
    ['investigation-evidence', 'investigation-leads'], ['investigation-leads', 'verification'],
    ['verification', 'report'], ['ingest', 'investigation-evidence'], ['copilot', 'map'],
  ]), []);

  const toPath = (a, b, i) => {
    const p1 = PINS[a]; const p2 = PINS[b];
    if (!p1 || !p2) return '';
    const midX = (p1.x + p2.x) / 2; const midY = (p1.y + p2.y) / 2;
    const bend = (i % 2 === 0 ? 1 : -1) * (3 + (i % 3));
    return `M ${p1.x} ${p1.y} Q ${midX + bend} ${midY - bend} ${p2.x} ${p2.y}`;
  };

  return (
    <div className="corkboard-room" style={{ height: '100%', width: '100%' }}>
      <div style={{
        height: 46, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.1rem', background: 'rgba(8,10,8,0.96)', borderBottom: '1px solid rgba(217,170,61,0.35)', zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#d9aa3d,#8a6515)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
            <Shield size={15} strokeWidth={2.4} />
          </div>
          <span style={{ color: '#F1EBDD', fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Investigator Workbench
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)} style={selectStyle}>
            {(casesList.length ? casesList : [{ case_number: selectedCase }]).map((c) => (
              <option key={c.case_number} value={c.case_number}>Case {c.case_number}</option>
            ))}
          </select>
          <select value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} style={{ ...selectStyle, color: '#D9AA3D' }}>
            <option value="INVESTIGATOR">Investigator</option>
            <option value="ANALYST">Analyst</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="button" onClick={() => setLampOn((v) => !v)} style={{ ...selectStyle, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: lampOn ? '#fbbf24' : '#94a3b8' }}>
            <Lightbulb size={13} />{lampOn ? 'Lamp' : 'Dark'}
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('sih_token');
              localStorage.removeItem('sih_user');
              window.location.reload();
            }}
            style={{ ...selectStyle, cursor: 'pointer', color: '#fca5a5' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Active Investigation */}
      <div style={{
        margin: '0.5rem 1rem 0', padding: '0.85rem 1.1rem', borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(20,23,21,0.95), rgba(8,10,9,0.98))',
        border: '1px solid rgba(217,170,61,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, zIndex: 20,
      }}>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#D9AA3D', letterSpacing: '0.08em' }}>ACTIVE INVESTIGATION</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F1EBDD' }}>
            CASE {selectedCase} — {dossier?.crime_category || dossier?.title?.split('(')[0]?.trim() || 'Loading…'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A6B0AA', marginTop: 2 }}>
            Status: {(dossier?.status || 'ACTIVE').replace(/_/g, ' ')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, fontSize: '0.78rem' }}>
          <Metric label="Entities" value={caseSummary?.entityCount ?? '—'} />
          <Metric label="Relationships" value={caseSummary?.connectionCount ?? '—'} />
          <Metric label="Cross-Case" value={caseSummary?.crossCaseCount ?? '—'} />
          <Metric label="Leads" value={caseSummary?.leadCount ?? '—'} />
          <Metric label="Evidence" value={caseSummary?.connectionCount != null ? Math.max(1, Math.ceil(caseSummary.connectionCount / 2)) : '—'} />
        </div>
        <button type="button" className="btn-red" onClick={continueInvestigation} style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem', fontWeight: 800 }}>
          Continue Investigation <ArrowRight size={14} />
        </button>
      </div>

      <div className="overhead-lamp-bar" onClick={() => setLampOn((v) => !v)}>
        <div className="lamp-cord" /><div className="lamp-shade"><div className={`lamp-bulb ${lampOn ? '' : 'off'}`} /></div>
      </div>

      <div className="corkboard-frame" style={{ marginTop: '0.4rem' }}>
        <div className="corkboard-surface">
          <div className={`overhead-spotlight ${lampOn ? '' : 'off'}`} />
          <div className="corkboard-canvas">
            <svg className="red-string-canvas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <defs>
                <filter id="ropeGlow"><feGaussianBlur stdDeviation="0.6" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <linearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff7a7a" stopOpacity="0" /><stop offset="50%" stopColor="#fff6c8" stopOpacity="1" /><stop offset="100%" stopColor="#ff7a7a" stopOpacity="0" />
                </linearGradient>
              </defs>
              {ROPES.map(([a, b], i) => {
                const d = toPath(a, b, i);
                const hot = hovered && (hovered === a || hovered === b || a === 'hub');
                return (
                  <g key={`${a}-${b}`}>
                    <path d={d} className={`board-rope ${hot ? 'is-hot' : ''}`} pathLength="100" />
                    <path d={d} className={`board-rope-energy energy-delay-${i % 5}`} pathLength="100" stroke="url(#energyGrad)" />
                  </g>
                );
              })}
            </svg>

            <button type="button" className="pinned-card wanted-poster board-wanted" style={{ left: '40%', top: '18%', width: 150, transform: 'rotate(-1deg)', border: 'none', cursor: 'pointer' }}
              onClick={continueInvestigation} onMouseEnter={() => setHovered('hub')} onMouseLeave={() => setHovered(null)}>
              <span className="cork-pushpin red" style={{ left: '50%', top: -6, transform: 'translateX(-50%)' }} />
              <div className="wanted-header" style={{ fontSize: '1.15rem' }}>CASE {selectedCase}</div>
              <div className="wanted-photo-frame" style={{ height: 72 }}><div className="board-silhouette" /></div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em' }}>ACTIVE HUB</div>
            </button>

            {NOTES.map((note) => {
              const Icon = note.icon;
              const hot = hovered === note.id;
              return (
                <button key={note.id} type="button"
                  className={`pinned-card board-note ${note.tone ? `tone-${note.tone}` : ''} ${hot ? 'is-hot' : ''}`}
                  style={{ left: `${note.x}%`, top: `${note.y}%`, width: note.w, transform: `rotate(${note.rot}deg)${hot ? ' translateY(-4px) scale(1.04)' : ''}` }}
                  onClick={() => {
                    if (note.section) {
                      sessionStorage.setItem('sih_section', note.section);
                      openCase(selectedCase);
                      return;
                    }
                    if (note.id === 'dossiers') return setActiveTab('dossiers');
                    if (note.id === 'investigation') {
                      sessionStorage.setItem('sih_section', 'brief');
                      return openCase(selectedCase);
                    }
                    setActiveTab(note.id);
                  }}
                  onMouseEnter={() => setHovered(note.id)} onMouseLeave={() => setHovered(null)}>
                  <span className={`cork-pushpin ${note.pin}`} style={{ left: '50%', top: -7, transform: 'translateX(-50%)' }} />
                  {note.kind === 'copilot' ? (
                    <div className="board-copilot-card">
                      <Bot size={28} color="#34d399" />
                      <div className="board-copilot-label"><Bot size={14} /><span>AI Copilot</span></div>
                    </div>
                  ) : note.kind === 'map' ? (
                    <div className="board-map-card">
                      <div className="board-mini-map"><Map size={36} color="#38bdf8" style={{ margin: 'auto', display: 'block', marginTop: 28 }} /></div>
                      <div className="board-map-label"><Map size={14} /><span>Crime Intelligence Map</span></div>
                    </div>
                  ) : (
                    <div className="board-sticky-body"><Icon size={16} strokeWidth={2.2} /><span>{note.label}</span></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 800, color: '#D9AA3D', fontSize: '1.05rem' }}>{value}</div>
      <div style={{ color: '#A6B0AA', fontSize: '0.65rem', fontWeight: 700 }}>{label}</div>
    </div>
  );
}

const selectStyle = {
  background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(217,170,61,0.35)', color: '#F1EBDD',
  padding: '0.25rem 0.55rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, outline: 'none',
};
