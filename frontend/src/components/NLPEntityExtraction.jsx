import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle2, Clock, Sparkles, User, Building2, Phone, MapPin, Car, Calendar, FileText } from 'lucide-react';
import { getNLPData } from '../data/mockService.js';

const TYPE_CONFIG = {
  PERSON: { color: '#D9AA3D', bg: 'rgba(217,170,61,0.18)', label: 'PERSON', icon: User },
  ORGANIZATION: { color: '#5E9F68', bg: 'rgba(94,159,104,0.18)', label: 'ORG', icon: Building2 },
  PHONE: { color: '#38bdf8', bg: 'rgba(56,189,248,0.18)', label: 'PHONE', icon: Phone },
  LOCATION: { color: '#D62828', bg: 'rgba(214,40,40,0.18)', label: 'LOCATION', icon: MapPin },
  VEHICLE: { color: '#94A3B8', bg: 'rgba(148,163,184,0.18)', label: 'VEHICLE', icon: Car },
  DATE: { color: '#A78BFA', bg: 'rgba(167,139,250,0.18)', label: 'DATE', icon: Calendar },
  CASE: { color: '#FB923C', bg: 'rgba(251,146,60,0.18)', label: 'CASE', icon: FileText },
  FINANCIAL_ACCOUNT: { color: '#34D399', bg: 'rgba(52,211,153,0.18)', label: 'ACCOUNT', icon: Building2 },
};

function HighlightedText({ text, entities }) {
  if (!text || !entities?.length) return <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.82rem', color: '#F1EBDD' }}>{text}</pre>;

  // Sort by start position
  const sorted = [...entities].sort((a, b) => (a.start || 0) - (b.start || 0));
  const parts = [];
  let cursor = 0;

  sorted.forEach((ent, i) => {
    const start = ent.start || text.indexOf(ent.text, cursor);
    const end = start + ent.text.length;
    if (start < 0 || start < cursor) return;

    if (start > cursor) {
      parts.push(<span key={`plain-${i}`}>{text.slice(cursor, start)}</span>);
    }
    const cfg = TYPE_CONFIG[ent.type] || { color: '#D9AA3D', bg: 'rgba(217,170,61,0.18)', label: ent.type };
    parts.push(
      <mark key={`ent-${i}`} title={`${ent.type} — ${Math.round(ent.confidence * 100)}% confidence`} style={{
        background: cfg.bg,
        color: cfg.color,
        borderRadius: '4px',
        padding: '1px 5px',
        border: `1px solid ${cfg.color}55`,
        fontWeight: 700,
        cursor: 'help',
        position: 'relative',
      }}>
        {ent.text}
        <sup style={{ fontSize: '0.55rem', opacity: 0.8, marginLeft: 2 }}>{cfg.label}</sup>
      </mark>
    );
    cursor = end;
  });

  if (cursor < text.length) parts.push(<span key="rest">{text.slice(cursor)}</span>);
  return <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, fontSize: '0.82rem', color: '#F1EBDD', fontFamily: 'inherit' }}>{parts}</pre>;
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 95 ? '#5E9F68' : pct >= 85 ? '#D9AA3D' : '#D62828';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: '0.7rem', color, fontWeight: 700, minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

export default function NLPEntityExtraction() {
  const [nlpData, setNlpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [resolutionStep, setResolutionStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    getNLPData().then(res => {
      if (res.success) setNlpData(res.data);
      setLoading(false);
    });
  }, []);

  // Auto-animate entity resolution
  useEffect(() => {
    if (!nlpData) return;
    const timer = setInterval(() => {
      setResolutionStep(s => (s + 1) % (nlpData.entity_resolutions?.length || 1));
    }, 3000);
    return () => clearInterval(timer);
  }, [nlpData]);

  const handleDemoProcess = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D9AA3D' }}>
        <Brain size={24} className="animate-spin" style={{ marginRight: 10 }} /> Loading NLP Analysis...
      </div>
    );
  }

  const { fir_text, entities, entity_resolutions } = nlpData || {};
  const filteredEntities = selectedType ? entities?.filter(e => e.type === selectedType) : entities;
  const currentResolution = entity_resolutions?.[resolutionStep];

  const typeCounts = {};
  entities?.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });

  return (
    <div className="animate-fade-in" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#F1EBDD' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(16,19,17,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: '0.5rem', borderRadius: 10, background: 'rgba(217,170,61,0.15)', color: '#D9AA3D', border: '1px solid rgba(217,170,61,0.3)' }}>
            <Brain size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>AI / NLP Entity Extraction</h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#A6B0AA' }}>Analyzing FIR-CASE-101 · {entities?.length} entities extracted · Demo Investigation Dataset</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ padding: '0.3rem 0.75rem', borderRadius: 20, background: 'rgba(94,159,104,0.15)', border: '1px solid rgba(94,159,104,0.35)', color: '#5E9F68', fontSize: '0.72rem', fontWeight: 700 }}>
            ✓ AI EXTRACTION COMPLETE
          </span>
          <button
            onClick={handleDemoProcess}
            className="btn-primary"
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.9rem' }}
          >
            <Sparkles size={13} /> Re-Analyze
          </button>
        </div>
      </div>

      {/* Type filter chips */}
      <div style={{ padding: '0.65rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(8,10,9,0.6)', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        <span style={{ fontSize: '0.68rem', color: '#6C7A73', fontWeight: 700, alignSelf: 'center', marginRight: 4 }}>FILTER:</span>
        <button
          onClick={() => setSelectedType(null)}
          style={{ padding: '0.25rem 0.65rem', borderRadius: 20, border: '1px solid', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', background: !selectedType ? 'rgba(217,170,61,0.2)' : 'transparent', borderColor: !selectedType ? 'rgba(217,170,61,0.5)' : 'var(--border-color)', color: !selectedType ? '#D9AA3D' : '#6C7A73' }}
        >
          ALL ({entities?.length})
        </button>
        {Object.entries(typeCounts).map(([type, count]) => {
          const cfg = TYPE_CONFIG[type] || { color: '#D9AA3D', label: type };
          const active = selectedType === type;
          return (
            <button key={type} onClick={() => setSelectedType(active ? null : type)} style={{
              padding: '0.25rem 0.65rem', borderRadius: 20, border: '1px solid', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
              background: active ? cfg.bg : 'transparent',
              borderColor: active ? cfg.color : 'var(--border-color)',
              color: active ? cfg.color : '#6C7A73',
            }}>
              {cfg.label || type} ({count})
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
        {/* Left: FIR Text */}
        <div style={{ flex: 1.2, padding: '1.25rem', overflowY: 'auto', borderRight: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <FileText size={16} color="#D9AA3D" />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#D9AA3D' }}>FIR-CASE-101 — Operation Coastal Wind</span>
          </div>
          <div className="forensic-panel" style={{ padding: '1.25rem', lineHeight: 1.8 }}>
            <HighlightedText text={fir_text} entities={selectedType ? filteredEntities : entities} />
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '1rem' }}>
            {Object.entries(TYPE_CONFIG).slice(0, 7).map(([type, cfg]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: '#A6B0AA' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color }} />
                <span>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Entities + Resolution */}
        <div style={{ width: 360, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Extracted Entities */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.85rem' }}>
              <Brain size={15} color="#D9AA3D" />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#D9AA3D' }}>
                Extracted Entities ({filteredEntities?.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredEntities?.map((ent, i) => {
                const cfg = TYPE_CONFIG[ent.type] || { color: '#D9AA3D', bg: 'rgba(217,170,61,0.1)', label: ent.type };
                const Icon = cfg.icon || Brain;
                return (
                  <div key={i} className="animate-slide-up" style={{
                    padding: '0.65rem 0.85rem', borderRadius: 8,
                    background: cfg.bg, border: `1px solid ${cfg.color}33`,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <Icon size={14} color={cfg.color} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#F1EBDD', truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ent.text}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                        <span style={{ fontSize: '0.65rem', color: '#6C7A73' }}>·</span>
                        <span style={{ fontSize: '0.65rem', color: '#A6B0AA' }}>{ent.source}</span>
                      </div>
                      <ConfidenceBar value={ent.confidence} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Entity Resolution */}
          <div style={{ padding: '1rem', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.85rem' }}>
              <Sparkles size={15} color="#D62828" />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#D62828' }}>Entity Resolution</span>
              <span style={{ fontSize: '0.65rem', color: '#6C7A73', fontWeight: 600 }}>AUTO-ROTATING</span>
            </div>

            {currentResolution && (
              <div className="animate-fade-in forensic-panel" style={{ padding: '1rem', marginBottom: '0.75rem' }} key={resolutionStep}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: '0.85rem' }}>
                  {currentResolution.mentions.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {i > 0 && <span style={{ color: '#D9AA3D', fontSize: '0.75rem', fontWeight: 700 }}>≈</span>}
                      <span style={{ fontSize: '0.84rem', color: '#F1EBDD', fontWeight: i === 0 ? 800 : 600 }}>{m}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#D9AA3D', fontSize: '1rem', fontWeight: 800 }}>→</span>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#D9AA3D' }}>{currentResolution.resolved_name}</span>
                    <code style={{ fontSize: '0.7rem', color: '#A6B0AA', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 4 }}>{currentResolution.resolved_id}</code>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#A6B0AA' }}>{currentResolution.method}</div>
                  <ConfidenceBar value={currentResolution.confidence} />
                  <div style={{ marginTop: 4 }}>
                    {currentResolution.status === 'HUMAN_VERIFIED' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.6rem', borderRadius: 12, background: 'rgba(94,159,104,0.15)', border: '1px solid rgba(94,159,104,0.4)', color: '#5E9F68', fontSize: '0.68rem', fontWeight: 800 }}>
                        <CheckCircle2 size={10} /> HUMAN VERIFIED
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.6rem', borderRadius: 12, background: 'rgba(217,170,61,0.12)', border: '1px solid rgba(217,170,61,0.35)', color: '#D9AA3D', fontSize: '0.68rem', fontWeight: 800 }}>
                        <Clock size={10} /> AI SUGGESTED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Resolution dots */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: '0.75rem' }}>
              {entity_resolutions?.map((_, i) => (
                <button key={i} onClick={() => setResolutionStep(i)} style={{
                  width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: i === resolutionStep ? '#D9AA3D' : 'rgba(255,255,255,0.15)',
                }} />
              ))}
            </div>

            {/* All resolutions mini-list */}
            <div style={{ fontSize: '0.7rem', color: '#6C7A73', fontWeight: 700, marginBottom: '0.5rem' }}>ALL RESOLUTIONS</div>
            {entity_resolutions?.map((res, i) => (
              <div key={i} onClick={() => setResolutionStep(i)} style={{
                padding: '0.45rem 0.65rem', borderRadius: 6, marginBottom: 4, cursor: 'pointer',
                background: i === resolutionStep ? 'rgba(217,170,61,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${i === resolutionStep ? 'rgba(217,170,61,0.35)' : 'transparent'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontWeight: 700, fontSize: '0.78rem', color: i === resolutionStep ? '#D9AA3D' : '#A6B0AA' }}>{res.resolved_name}</span>
                <span style={{ fontSize: '0.65rem', color: res.status === 'HUMAN_VERIFIED' ? '#5E9F68' : '#D9AA3D', fontWeight: 700 }}>
                  {res.status === 'HUMAN_VERIFIED' ? '✓ Verified' : '⏳ AI'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
