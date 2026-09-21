import React, { useMemo, useState } from 'react';
import {
  Shield, Bot, Map, Network, Upload, FileText,
  Crosshair, CheckCircle2, Search, Database, Lightbulb, ArrowRight,
  FolderOpen, Clock, AlertTriangle, Sparkles, BarChart3, Route
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

/**
 * Investigator Board — corkboard of workflow steps with connected red strings.
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
    { id: 'dossiers', label: 'Case Dossiers', icon: FolderOpen, tone: 'cream', pin: 'gold', x: 3, y: 10, rot: -2, w: 135 },
    { id: 'investigation', label: 'Case Brief', icon: FileText, tone: 'yellow', pin: 'red', x: 19, y: 8, rot: 1.5, w: 125, section: 'brief' },
    { id: 'nlp', label: 'NLP Extraction', icon: Sparkles, tone: 'blue', pin: 'gold', x: 34, y: 8, rot: -1.5, w: 130 },
    { id: 'entity', label: 'Entity Investigation', icon: Search, tone: 'orange', pin: 'red', x: 50, y: 10, rot: 1, w: 145 },
    
    { id: 'network', label: 'Knowledge Graph', icon: Network, tone: 'cream', pin: 'blue', x: 4, y: 32, rot: 2, w: 135 },
    { id: 'keyentities', label: 'Bridge Entities', icon: BarChart3, tone: 'yellow', pin: 'gold', x: 19, y: 32, rot: -1, w: 130 },
    { id: 'crosscase', label: 'Cross-Case', icon: Crosshair, tone: 'yellow', pin: 'red', x: 34, y: 34, rot: 1, w: 125 },
    { id: 'pathfinder', label: 'Path Finder', icon: Route, tone: 'orange', pin: 'red', x: 49, y: 34, rot: -2, w: 125 },

    { id: 'patterns', label: 'Suspicious Patterns', icon: AlertTriangle, tone: 'orange', pin: 'red', x: 4, y: 55, rot: 1.5, w: 145 },
    { id: 'copilot', label: 'AI Copilot', kind: 'copilot', pin: 'gold', x: 67, y: 22, rot: 1, w: 180 },
    { id: 'leads', label: 'Actionable Leads', icon: CheckCircle2, tone: 'yellow', pin: 'gold', x: 22, y: 58, rot: -1, w: 140 },
    { id: 'investigation-evidence', label: 'Evidence & Records', icon: Shield, tone: 'cream', pin: 'blue', x: 38, y: 56, rot: 2, w: 135, section: 'evidence', tab: 'investigation' },

    { id: 'ingest', label: 'Evidence Ingestion', icon: Upload, tone: 'blue', pin: 'blue', x: 4, y: 76, rot: -2, w: 135 },
    { id: 'map', label: 'Crime Heatmap', kind: 'map', pin: 'blue', x: 65, y: 56, rot: -0.8, w: 200 },
    { id: 'report', label: 'Investigation Report', icon: FileText, tone: 'cream', pin: 'gold', x: 38, y: 78, rot: -1.5, w: 145 },
  ]), []);

  const PINS = useMemo(() => ({
    hub: { x: 48, y: 26 },
    dossiers: { x: 9, y: 14 }, investigation: { x: 25, y: 12 }, nlp: { x: 40, y: 12 }, entity: { x: 57, y: 14 },
    network: { x: 10, y: 36 }, keyentities: { x: 25, y: 36 }, crosscase: { x: 40, y: 38 }, pathfinder: { x: 55, y: 38 },
    patterns: { x: 11, y: 60 }, copilot: { x: 76, y: 30 }, leads: { x: 29, y: 63 }, 'investigation-evidence': { x: 44, y: 61 },
    ingest: { x: 10, y: 80 }, map: { x: 75, y: 64 }, report: { x: 45, y: 82 },
  }), []);

  const ROPES = useMemo(() => ([
    ['hub', 'dossiers'], ['hub', 'investigation'], ['hub', 'nlp'], ['hub', 'network'],
    ['hub', 'crosscase'], ['hub', 'copilot'], ['hub', 'map'], ['hub', 'leads'],
    ['dossiers', 'investigation'], ['investigation', 'nlp'], ['nlp', 'entity'], ['entity', 'network'],
    ['network', 'keyentities'], ['keyentities', 'crosscase'], ['crosscase', 'pathfinder'],
    ['patterns', 'leads'], ['leads', 'investigation-evidence'], ['investigation-evidence', 'report'],
    ['ingest', 'patterns'], ['copilot', 'map'],
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
          <span style={{
            fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 12,
            background: 'rgba(94,159,104,0.2)', border: '1px solid rgba(94,159,104,0.4)', color: '#4ADE80'
          }}>
            DEMO MODE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)} style={selectStyle}>
            {(casesList.length ? casesList : [{ case_number: '101' }, { case_number: '102' }, { case_number: '103' }]).map((c) => (
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

      {/* Active Investigation Banner */}
      <div style={{
        margin: '0.5rem 1rem 0', padding: '0.85rem 1.1rem', borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(20,23,21,0.95), rgba(8,10,9,0.98))',
        border: '1px solid rgba(217,170,61,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, zIndex: 20,
      }}>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#D9AA3D', letterSpacing: '0.08em' }}>ACTIVE INVESTIGATION</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F1EBDD' }}>
            CASE {selectedCase} — {dossier?.crime_category || dossier?.title?.split('(')[0]?.trim() || 'Coastal Smuggling Network'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A6B0AA', marginTop: 2 }}>
            Status: {(dossier?.status || 'ACTIVE').replace(/_/g, ' ')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, fontSize: '0.78rem' }}>
          <Metric label="Entities" value={caseSummary?.entityCount ?? 24} />
          <Metric label="Relationships" value={caseSummary?.connectionCount ?? 38} />
          <Metric label="Cross-Case" value={caseSummary?.crossCaseCount ?? 3} />
          <Metric label="Patterns" value={6} />
          <Metric label="Leads" value={caseSummary?.leadCount ?? 4} />
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

            <button type="button" className="pinned-card wanted-poster board-wanted" style={{ left: '42%', top: '18%', width: 145, transform: 'rotate(-1deg)', border: 'none', cursor: 'pointer' }}
              onClick={continueInvestigation} onMouseEnter={() => setHovered('hub')} onMouseLeave={() => setHovered(null)}>
              <span className="cork-pushpin red" style={{ left: '50%', top: -6, transform: 'translateX(-50%)' }} />
              <div className="wanted-header" style={{ fontSize: '1.15rem' }}>CASE {selectedCase}</div>
              <div className="wanted-photo-frame" style={{ height: 70 }}><div className="board-silhouette" /></div>
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
                    if (note.id === 'dossiers') return setActiveTab('cases');
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
                      <div className="board-map-label"><Map size={14} /><span>Crime Map</span></div>
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
