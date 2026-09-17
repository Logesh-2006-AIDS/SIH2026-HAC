import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Zap, Phone, DollarSign, GitBranch, Clock, RefreshCw, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { getEntityById } from '../data/mockService.js';

const SEVERITY_CONFIG = {
  CRITICAL: { color: '#D62828', bg: 'rgba(214,40,40,0.12)', border: 'rgba(214,40,40,0.4)', icon: Zap },
  HIGH: { color: '#D99A32', bg: 'rgba(217,154,50,0.12)', border: 'rgba(217,154,50,0.4)', icon: AlertTriangle },
  MEDIUM: { color: '#D9AA3D', bg: 'rgba(217,170,61,0.1)', border: 'rgba(217,170,61,0.3)', icon: Shield },
};

const TYPE_ICONS = {
  HIGH_CALL_FREQUENCY: Phone,
  SUSPICIOUS_TRANSFER: DollarSign,
  CROSS_CASE_ENTITY: GitBranch,
  MULTI_HOP_TRANSFER: DollarSign,
  TEMPORAL_PROXIMITY: Clock,
  REPEATED_COMMUNICATION: Phone,
};

function PatternCard({ pattern, onFocusEntity, expanded, onToggle }) {
  const sev = SEVERITY_CONFIG[pattern.severity] || SEVERITY_CONFIG.MEDIUM;
  const SevIcon = sev.icon;
  const TypeIcon = TYPE_ICONS[pattern.type] || AlertTriangle;

  return (
    <div className="animate-slide-up forensic-panel" style={{
      borderLeft: `4px solid ${sev.color}`,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {/* Card header */}
      <div
        onClick={onToggle}
        style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}
      >
        <div style={{ padding: '0.45rem', borderRadius: 8, background: sev.bg, border: `1px solid ${sev.border}`, flexShrink: 0 }}>
          <TypeIcon size={16} color={sev.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ padding: '0.15rem 0.5rem', borderRadius: 10, background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, fontSize: '0.65rem', fontWeight: 800 }}>
              {pattern.severity}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#6C7A73', fontWeight: 700 }}>
              {pattern.cases.join(' · ')}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#A6B0AA', marginLeft: 'auto' }}>
              {new Date(pattern.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#F1EBDD', marginBottom: 4 }}>{pattern.title}</div>
          <div style={{ fontSize: '0.8rem', color: '#A6B0AA', lineHeight: 1.5 }}>{pattern.description}</div>
        </div>
        <div style={{ flexShrink: 0, color: '#6C7A73' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="animate-slide-up" style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Rule */}
          <div style={{ padding: '0.6rem 0.85rem', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.76rem', color: '#6C7A73', fontFamily: 'var(--font-mono)' }}>
            {pattern.rule}
          </div>

          {/* Evidence */}
          <div>
            <div style={{ fontSize: '0.68rem', color: '#D9AA3D', fontWeight: 800, marginBottom: 5 }}>EVIDENCE</div>
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: 6, background: 'rgba(217,170,61,0.06)', border: '1px solid rgba(217,170,61,0.18)', fontSize: '0.78rem', color: '#F1EBDD', lineHeight: 1.6 }}>
              {pattern.evidence}
            </div>
          </div>

          {/* Reason */}
          <div>
            <div style={{ fontSize: '0.68rem', color: '#5E9F68', fontWeight: 800, marginBottom: 5 }}>WHY THIS MATTERS</div>
            <div style={{ fontSize: '0.78rem', color: '#A6B0AA', lineHeight: 1.6 }}>{pattern.reason}</div>
          </div>

          {/* Related entities */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#6C7A73', fontWeight: 700 }}>ENTITIES:</span>
            {pattern.entities.slice(0, 5).map(eid => {
              const e = getEntityById(eid);
              return (
                <button
                  key={eid}
                  onClick={(ev) => { ev.stopPropagation(); if (onFocusEntity) onFocusEntity(eid); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '0.2rem 0.55rem', borderRadius: 12, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#F1EBDD', fontSize: '0.72rem', fontWeight: 600,
                  }}
                >
                  {e?.name || e?.number || e?.account_number || eid}
                  <ExternalLink size={9} color="#6C7A73" />
                </button>
              );
            })}
          </div>

          {/* Confidence */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.68rem', color: '#6C7A73', fontWeight: 700 }}>AI CONFIDENCE</span>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round(pattern.confidence * 100)}%`, height: '100%', background: sev.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: sev.color, fontWeight: 800 }}>{Math.round(pattern.confidence * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuspiciousPatterns() {
  const { patterns, selectedCase, focusEntityById } = useInvestigation();
  const [expanded, setExpanded] = useState(new Set(['PAT-001']));
  const [filterSeverity, setFilterSeverity] = useState(null);

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = filterSeverity ? patterns.filter(p => p.severity === filterSeverity) : patterns;

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0 };
  patterns.forEach(p => { counts[p.severity] = (counts[p.severity] || 0) + 1; });

  return (
    <div className="animate-fade-in" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#F1EBDD' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(16,19,17,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: '0.5rem', borderRadius: 10, background: 'rgba(214,40,40,0.15)', color: '#D62828', border: '1px solid rgba(214,40,40,0.3)' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Pattern Intelligence</h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#A6B0AA' }}>
              {patterns.length} explainable rule-based patterns detected · Case {selectedCase} network · Demo Investigation Dataset
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(new Set(patterns.map(p => p.id)))}
          className="btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
        >
          Expand All
        </button>
      </div>

      {/* Severity summary */}
      <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(8,10,9,0.6)', display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
        <span style={{ fontSize: '0.68rem', color: '#6C7A73', fontWeight: 700 }}>SEVERITY:</span>
        {Object.entries(SEVERITY_CONFIG).map(([sev, cfg]) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(filterSeverity === sev ? null : sev)}
            style={{
              padding: '0.25rem 0.75rem', borderRadius: 20, border: '1px solid', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
              background: filterSeverity === sev ? cfg.bg : 'transparent',
              borderColor: filterSeverity === sev ? cfg.color : 'var(--border-color)',
              color: filterSeverity === sev ? cfg.color : '#6C7A73',
            }}
          >
            {sev} ({counts[sev] || 0})
          </button>
        ))}
      </div>

      {/* Pattern cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#A6B0AA' }}>
            No patterns match the selected filter.
          </div>
        ) : (
          filtered.map(pattern => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              expanded={expanded.has(pattern.id)}
              onToggle={() => toggleExpand(pattern.id)}
              onFocusEntity={focusEntityById}
            />
          ))
        )}
      </div>
    </div>
  );
}
