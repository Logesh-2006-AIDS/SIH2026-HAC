import React, { useState } from 'react';
import {
  Shield, Bot, Map, Network, Sparkles,
  Database, Upload, Crosshair, FileText,
  AlertTriangle, ArrowRight, CheckCircle2,
  Lightbulb, Search, Eye
} from 'lucide-react';

export default function CriminalBoard({
  selectedCase = '101',
  onSelectCase,
  onNavigateTab,
  currentRole = 'INVESTIGATOR',
  setCurrentRole
}) {
  const [lampOn, setLampOn] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  const CASES = [
    { id: '101', label: 'Case 101 - Karol Bagh Extortion Ring' },
    { id: '102', label: 'Case 102 - Multi-State Hawala Syndicate' },
    { id: '103', label: 'Case 103 - Rohini Inter-State Narcotic Grid' }
  ];

  // Board items representing every platform page
  const BOARD_ITEMS = [
    {
      id: 'brief',
      title: 'Smart Case Brief',
      subtitle: 'FIR Analysis & Auto-Generated Case Dossier',
      badge: 'CASE DOSSIER',
      icon: FileText,
      color: '#d97706',
      bgStyle: 'manila',
      tag: 'FIR 101/2025 - BNS 308(2)',
      details: ['PS: Crime Branch, North District', 'Armed Extortion Investigation'],
      btnText: 'Open Case Brief',
      pinColor: '#dc2626',
      rotation: -1.2,
    },
    {
      id: 'network',
      title: 'Knowledge Graph Explorer',
      subtitle: 'Suspect Network & Shortest Path Discovery',
      badge: 'LINK ANALYSIS',
      icon: Network,
      color: '#dc2626',
      bgStyle: 'wanted',
      tag: 'PRIME SUSPECT NEXUS',
      details: ['Mastermind: Ravi Kumar (Ravan)', '4 Connected Associates Found'],
      btnText: 'Explore Network',
      pinColor: '#eab308',
      rotation: 0.8,
    },
    {
      id: 'copilot',
      title: 'AI Copilot',
      subtitle: 'Automated Investigation Intelligence Assistant',
      badge: 'AI INTEL ASSISTANT',
      icon: Bot,
      color: '#10b981',
      bgStyle: 'tech',
      tag: 'LLM REASONING ACTIVE',
      details: ['Natural Language Query Engine', 'Cross-Case Anomaly Inference'],
      btnText: 'Launch Copilot',
      pinColor: '#10b981',
      rotation: -1.0,
    },
    {
      id: 'ingest',
      title: 'Data Ingestion Engine',
      subtitle: 'Evidence File Intake & Knowledge Graph ETL',
      badge: 'EVIDENCE INTAKE',
      icon: Upload,
      color: '#d97706',
      bgStyle: 'evidence',
      tag: 'FORENSIC INTAKE #089',
      details: ['Supports CDRs, FIRs, Bank & CCTV', 'Auto-Entity & Relation Parser'],
      btnText: 'Ingest Evidence',
      pinColor: '#3b82f6',
      rotation: 1.0,
    },
    {
      id: 'cases',
      title: 'Active Case Dossiers',
      subtitle: 'Suspect Profiles, Statements & Interrogations',
      badge: 'SUSPECT DOSSIERS',
      icon: Database,
      color: '#3b82f6',
      bgStyle: 'polaroids',
      tag: '5 IDENTIFIED SUSPECTS',
      details: ['Ravi K. (Leader) - Vikram S. (Logistics)', 'Meena S. (Intel) - Apex Co. (Hawala)'],
      btnText: 'View Case Dossiers',
      pinColor: '#dc2626',
      rotation: -0.6,
    },
    {
      id: 'map',
      title: 'Crime Intelligence Map',
      subtitle: 'Geospatial Incident Tracking & Density Heatmap',
      badge: 'GEOSPATIAL INTEL',
      icon: Map,
      color: '#06b6d4',
      bgStyle: 'blueprint',
      tag: '3 ACTIVE HOTSPOTS',
      details: ['Karol Bagh to Rohini Getaway Route', 'Sector-12 Surveillance Sector'],
      btnText: 'Open Crime Map',
      pinColor: '#06b6d4',
      rotation: 1.2,
    },
    {
      id: 'verification',
      title: 'Lead Verification',
      subtitle: 'Forensic Lead Validation & Tamper-Proof Audit',
      badge: 'FORENSIC AUDIT',
      icon: CheckCircle2,
      color: '#16a34a',
      bgStyle: 'checklist',
      tag: 'CHAIN OF CUSTODY',
      details: ['4 Evidence Leads Verified', '1 Pending Tower CDR Cross-Check'],
      btnText: 'Review Leads',
      pinColor: '#16a34a',
      rotation: -0.9,
    },
    {
      id: 'crosscase',
      title: 'Cross-Case Analysis',
      subtitle: 'Modus Operandi & Multi-FIR Syndicate Linkage',
      badge: 'SYNDICATE MATCH',
      icon: Crosshair,
      color: '#f97316',
      bgStyle: 'amber',
      tag: 'INTER-CASE CONNECTIONS',
      details: ['Shared Entity with FIR 102/2025', 'Shared Conduit: Apex Global'],
      btnText: 'Run Cross-Analysis',
      pinColor: '#f97316',
      rotation: 0.7,
    },
    {
      id: 'priority',
      title: 'Investigation Priority',
      subtitle: 'Graph Centrality & Urgency Action Matrix',
      badge: 'PRIORITY MATRIX',
      icon: AlertTriangle,
      color: '#ef4444',
      bgStyle: 'alert',
      tag: 'CRITICAL THREAT LEVEL',
      details: ['Degree Centrality: 0.88 (Extreme)', 'Urgent Action: Intercept Account #6060'],
      btnText: 'Open Priority Matrix',
      pinColor: '#ef4444',
      rotation: -1.2,
    }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      userSelect: 'none',
      position: 'relative',
      background: '#120904'
    }}>

      {/* -- TOP HEADER BAR -- */}
      <div style={{
        height: '48px',
        flexShrink: 0,
        background: 'rgba(12, 8, 4, 0.96)',
        borderBottom: '2px solid rgba(217,170,61,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        zIndex: 40,
        boxShadow: '0 4px 18px rgba(0,0,0,0.8)'
      }}>
        {/* Left: Emblem + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #d9aa3d, #8a6515)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(217,170,61,0.4)',
            color: '#000'
          }}>
            <Shield size={18} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{
              color: '#F1EBDD',
              fontWeight: 900,
              fontSize: '0.88rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              lineHeight: 1.1
            }}>
              Delhi Police Crime Branch
            </div>
            <div style={{
              color: '#D9AA3D',
              fontSize: '0.68rem',
              letterSpacing: '0.04em',
              fontWeight: 600
            }}>
              Criminal Evidence & Investigation Command Board
            </div>
          </div>
        </div>

        {/* Center: Active Case Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(217,170,61,0.12)',
          border: '1px solid rgba(217,170,61,0.3)',
          padding: '0.22rem 0.75rem',
          borderRadius: '6px'
        }}>
          <div style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 6px #22c55e'
          }} />
          <span style={{ color: '#D9AA3D', fontWeight: 800, fontSize: '0.78rem' }}>
            ACTIVE CASE #{selectedCase}
          </span>
        </div>

        {/* Right: Controls (Case, Role, Lamp) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Case Selector */}
          <select
            value={selectedCase}
            onChange={(e) => onSelectCase && onSelectCase(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(217,170,61,0.35)',
              color: '#F1EBDD',
              padding: '0.28rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {CASES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          {/* Role Selector */}
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole && setCurrentRole(e.target.value)}
            style={{
              background: 'rgba(217,170,61,0.15)',
              border: '1px solid rgba(217,170,61,0.5)',
              color: '#D9AA3D',
              padding: '0.28rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="INVESTIGATOR">Investigator</option>
            <option value="ANALYST">Analyst</option>
            <option value="ADMIN">Admin</option>
          </select>

          {/* Lamp Toggle */}
          <button
            onClick={() => setLampOn(!lampOn)}
            title={lampOn ? 'Turn off inspection lamp' : 'Turn on inspection lamp'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: lampOn ? 'rgba(234,179,8,0.22)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${lampOn ? 'rgba(234,179,8,0.6)' : 'rgba(255,255,255,0.2)'}`,
              color: lampOn ? '#fbbf24' : '#94a3b8',
              padding: '0.28rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Lightbulb size={14} />
            <span>{lampOn ? 'Lamp ON' : 'Lamp OFF'}</span>
          </button>
        </div>
      </div>

      {/* -- CORKBOARD WORKSPACE -- */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#80532b',
        backgroundImage: `
          radial-gradient(ellipse at 50% 30%, rgba(184,134,80,0.25) 0%, rgba(92,58,26,0.6) 75%),
          repeating-radial-gradient(circle at 17% 23%, rgba(80,50,20,0.15) 0px, transparent 4px),
          repeating-radial-gradient(circle at 73% 68%, rgba(80,50,20,0.15) 0px, transparent 4px),
          radial-gradient(circle, #8a582e 10%, #683e1a 90%)
        `,
        boxShadow: 'inset 0 0 0 10px #2a1607, inset 0 0 0 13px #120904, inset 0 0 80px rgba(0,0,0,0.7)',
        padding: '1.1rem',
        display: 'flex',
        flexDirection: 'column'
      }}>

        {/* Realistic Overhead Spotlight Lamp */}
        {lampOn && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 10,
            background: 'radial-gradient(ellipse at 50% -10%, rgba(255,235,160,0.22) 0%, rgba(255,215,120,0.08) 50%, transparent 75%)'
          }} />
        )}

        {/* SVG Red Strings Layer */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 5
          }}
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="stringShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.7)" />
            </filter>
          </defs>

          {/* Connected Red Yarn Strings between pins */}
          <path d="M 200 130 Q 380 155 600 130" stroke="#b91c1c" strokeWidth="2.4" fill="none" filter="url(#stringShadow)" strokeDasharray="4 1" />
          <path d="M 600 130 Q 800 155 1000 130" stroke="#b91c1c" strokeWidth="2.4" fill="none" filter="url(#stringShadow)" strokeDasharray="4 1" />

          <path d="M 200 390 Q 380 415 600 390" stroke="#b91c1c" strokeWidth="2.4" fill="none" filter="url(#stringShadow)" strokeDasharray="4 1" />
          <path d="M 600 390 Q 800 415 1000 390" stroke="#b91c1c" strokeWidth="2.4" fill="none" filter="url(#stringShadow)" strokeDasharray="4 1" />

          <path d="M 200 650 Q 380 675 600 650" stroke="#b91c1c" strokeWidth="2.4" fill="none" filter="url(#stringShadow)" strokeDasharray="4 1" />
          <path d="M 600 650 Q 800 675 1000 650" stroke="#b91c1c" strokeWidth="2.4" fill="none" filter="url(#stringShadow)" strokeDasharray="4 1" />

          <path d="M 200 130 Q 185 260 200 390" stroke="#b91c1c" strokeWidth="2.2" fill="none" filter="url(#stringShadow)" />
          <path d="M 200 390 Q 185 520 200 650" stroke="#b91c1c" strokeWidth="2.2" fill="none" filter="url(#stringShadow)" />

          <path d="M 600 130 Q 615 260 600 390" stroke="#b91c1c" strokeWidth="2.5" fill="none" filter="url(#stringShadow)" />
          <path d="M 600 390 Q 585 520 600 650" stroke="#b91c1c" strokeWidth="2.5" fill="none" filter="url(#stringShadow)" />

          <path d="M 1000 130 Q 1015 260 1000 390" stroke="#b91c1c" strokeWidth="2.2" fill="none" filter="url(#stringShadow)" />
          <path d="M 1000 390 Q 1015 520 1000 650" stroke="#b91c1c" strokeWidth="2.2" fill="none" filter="url(#stringShadow)" />

          <path d="M 600 130 Q 780 250 1000 390" stroke="#991b1b" strokeWidth="2.0" fill="none" filter="url(#stringShadow)" />
          <path d="M 200 390 Q 400 520 600 650" stroke="#991b1b" strokeWidth="2.0" fill="none" filter="url(#stringShadow)" />
        </svg>

        {/* 9 Page Cards Grid */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '0.9rem',
          zIndex: 8,
          height: '100%'
        }}>
          {BOARD_ITEMS.map((item) => {
            const isHovered = hoveredCard === item.id;
            const CardIcon = item.icon;

            let cardBg = '#f5efe6';
            let cardBorder = '1px solid rgba(0,0,0,0.15)';
            let titleColor = '#1e293b';
            let subColor = '#475569';

            if (item.bgStyle === 'manila') {
              cardBg = 'linear-gradient(145deg, #f7f1e1 0%, #ebe2c8 100%)';
              cardBorder = '1px solid #d4c5a0';
            } else if (item.bgStyle === 'wanted') {
              cardBg = 'linear-gradient(145deg, #fffbf0 0%, #f4ebd5 100%)';
              cardBorder = '2px solid #292524';
            } else if (item.bgStyle === 'tech') {
              cardBg = 'linear-gradient(145deg, #111a14 0%, #0d1410 100%)';
              cardBorder = '1px solid rgba(16,185,129,0.35)';
              titleColor = '#f1f5f9';
              subColor = '#94a3b8';
            } else if (item.bgStyle === 'evidence') {
              cardBg = 'linear-gradient(145deg, #faf7ee 0%, #ece5d3 100%)';
              cardBorder = '1px dashed #b45309';
            } else if (item.bgStyle === 'polaroids') {
              cardBg = 'linear-gradient(145deg, #fdfbf7 0%, #f1ecdf 100%)';
              cardBorder = '1px solid #cbd5e1';
            } else if (item.bgStyle === 'blueprint') {
              cardBg = 'linear-gradient(145deg, #0f172a 0%, #090e17 100%)';
              cardBorder = '1px solid rgba(6,182,212,0.35)';
              titleColor = '#f1f5f9';
              subColor = '#94a3b8';
            } else if (item.bgStyle === 'checklist') {
              cardBg = 'linear-gradient(145deg, #f6fbf7 0%, #e6f3e8 100%)';
              cardBorder = '1px solid #86efac';
            } else if (item.bgStyle === 'amber') {
              cardBg = 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)';
              cardBorder = '1px solid #fcd34d';
            } else if (item.bgStyle === 'alert') {
              cardBg = 'linear-gradient(145deg, #201111 0%, #150909 100%)';
              cardBorder = '1px solid rgba(239,68,68,0.35)';
              titleColor = '#fef2f2';
              subColor = '#fca5a5';
            }

            return (
              <div
                key={item.id}
                onClick={() => onNavigateTab(item.id)}
                onMouseEnter={() => setHoveredCard(item.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  position: 'relative',
                  background: cardBg,
                  border: cardBorder,
                  borderRadius: '7px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transform: isHovered
                    ? `scale(1.025) rotate(${item.rotation * 0.3}deg) translateY(-3px)`
                    : `rotate(${item.rotation}deg)`,
                  boxShadow: isHovered
                    ? '0 14px 28px rgba(0,0,0,0.55), 0 0 12px rgba(217,170,61,0.3)'
                    : '0 6px 14px rgba(0,0,0,0.35)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  overflow: 'hidden'
                }}
              >
                {/* Realistic Pushpin */}
                <div style={{
                  position: 'absolute',
                  top: '5px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: item.pinColor,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.6)',
                  border: '1px solid rgba(0,0,0,0.3)',
                  zIndex: 12
                }}>
                  <div style={{
                    width: '3px',
                    height: '3px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    opacity: 0.8,
                    margin: '2px 0 0 2px'
                  }} />
                </div>

                {/* Top Row: Badge + Icon */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.2rem'
                }}>
                  <span style={{
                    fontSize: '0.60rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    padding: '0.12rem 0.45rem',
                    borderRadius: '4px',
                    background: item.bgStyle === 'tech' || item.bgStyle === 'blueprint' || item.bgStyle === 'alert'
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.06)',
                    color: item.color,
                    border: `1px solid ${item.color}33`,
                    textTransform: 'uppercase'
                  }}>
                    {item.badge}
                  </span>

                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color
                  }}>
                    <CardIcon size={13} strokeWidth={2.2} />
                  </div>
                </div>

                {/* Center: PAGE NAME (Prominent & Clear) */}
                <div style={{ margin: '0.15rem 0' }}>
                  <div style={{
                    color: titleColor,
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    letterSpacing: '0.02em',
                    lineHeight: 1.2
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    color: subColor,
                    fontSize: '0.66rem',
                    fontWeight: 500,
                    marginTop: '0.12rem',
                    lineHeight: 1.2
                  }}>
                    {item.subtitle}
                  </div>
                </div>

                {/* Quick Info Tags (clean, no clutter) */}
                <div style={{
                  background: item.bgStyle === 'tech' || item.bgStyle === 'blueprint' || item.bgStyle === 'alert'
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.03)',
                  border: item.bgStyle === 'tech' || item.bgStyle === 'blueprint' || item.bgStyle === 'alert'
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '5px',
                  padding: '0.3rem 0.45rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.12rem'
                }}>
                  <div style={{
                    fontSize: '0.63rem',
                    fontWeight: 700,
                    color: item.color,
                    letterSpacing: '0.02em'
                  }}>
                    {item.tag}
                  </div>
                  {item.details.map((d, idx) => (
                    <div key={idx} style={{
                      fontSize: '0.60rem',
                      color: subColor,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      - {d}
                    </div>
                  ))}
                </div>

                {/* Bottom Action: Click to Open Page */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.25rem',
                  paddingTop: '0.25rem',
                  borderTop: item.bgStyle === 'tech' || item.bgStyle === 'blueprint' || item.bgStyle === 'alert'
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(0,0,0,0.08)'
                }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: isHovered ? item.color : subColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'color 0.15s'
                  }}>
                    <span>{item.btnText}</span>
                    <ArrowRight size={10} />
                  </span>

                  <span style={{
                    fontSize: '0.56rem',
                    fontWeight: 800,
                    color: item.color,
                    letterSpacing: '0.04em'
                  }}>
                    OPEN &gt;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
