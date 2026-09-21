import React, { useEffect, useState } from 'react';
import {
  FolderOpen, Clock, Users, GitBranch, FileText, Network, Shield, AlertTriangle, ArrowRight, ExternalLink
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { getCaseDetail, getCaseTimeline, getCrossLinks, getCaseBrief } from '../data/mockService';

const SECTIONS = [
  { id: 'brief', label: 'Case Brief', icon: FileText },
  { id: 'entities', label: 'Entities', icon: Users, redirect: 'entity' },
  { id: 'network', label: 'Network', icon: Network, redirect: 'network' },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'crosscase', label: 'Cross-Case', icon: GitBranch, redirect: 'crosscase' },
  { id: 'evidence', label: 'Evidence', icon: Shield },
  { id: 'leads', label: 'Leads', icon: AlertTriangle, redirect: 'leads' },
  { id: 'report', label: 'Report', icon: FileText, redirect: 'report' },
];

export default function CaseInvestigation() {
  const {
    selectedCase, investigationSection, setInvestigationSection,
    selectEntity, focusEntityById, setActiveTab, setCrossCaseSelection,
  } = useInvestigation();

  const [caseData, setCaseData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [crossLinks, setCrossLinks] = useState([]);
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const intended = sessionStorage.getItem('sih_section');
    if (intended) {
      setInvestigationSection(intended);
      sessionStorage.removeItem('sih_section');
    }
  }, [setInvestigationSection]);

  useEffect(() => {
    if (!selectedCase) return;
    setLoading(true);
    Promise.all([
      getCaseDetail(selectedCase),
      getCaseTimeline(selectedCase),
      getCrossLinks(selectedCase),
      getCaseBrief(selectedCase),
    ]).then(([c, t, x, b]) => {
      if (c?.data) setCaseData(c.data);
      if (t?.data?.events) setTimeline(t.data.events);
      if (x?.data?.links) setCrossLinks(x.data.links);
      if (b?.data) setBrief(b.data);
    }).finally(() => setLoading(false));
  }, [selectedCase]);

  const dossier = caseData?.dossier || {};
  const graphNodes = caseData?.graph_entities || [];
  const graphEdges = caseData?.graph_relations || [];

  const handleSection = (id) => {
    const sec = SECTIONS.find(s => s.id === id);
    if (sec?.redirect) {
      setActiveTab(sec.redirect);
      return;
    }
    setInvestigationSection(id);
  };

  const handleEntityClick = (entity) => {
    selectEntity(entity);
    setInvestigationSection('entities');
  };

  const handleViewOnGraph = (entityId) => {
    focusEntityById(entityId);
    setActiveTab('network');
  };

  const handleCrossCaseGraph = (link) => {
    setCrossCaseSelection({ caseA: selectedCase, caseB: link.shared_cases?.[0], entityId: link.entity_id });
    focusEntityById(link.entity_id);
    setActiveTab('network');
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D9AA3D' }}>
        Opening Case {selectedCase} workspace...
      </div>
    );
  }

  const section = investigationSection || 'brief';

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#F1EBDD' }}>
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(16,19,17,0.92)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FolderOpen size={22} color="#D62828" />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>CASE {selectedCase}</h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#A6B0AA' }}>{dossier.title}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-gold">{dossier.category}</span>
          <span className="badge badge-danger">{dossier.status}</span>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(8,10,9,0.5)', padding: '0 1rem', overflowX: 'auto' }}>
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const active = section === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => handleSection(sec.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.75rem 1rem',
                border: 'none', background: 'transparent',
                color: active ? '#D9AA3D' : '#A6B0AA',
                borderBottom: active ? '2px solid #D9AA3D' : '2px solid transparent',
                fontWeight: active ? 800 : 500, fontSize: '0.8rem', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={14} /> {sec.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        {section === 'brief' && <BriefSection dossier={dossier} brief={brief} graphNodes={graphNodes} />}
        {section === 'timeline' && <TimelineSection events={timeline} onGraph={handleViewOnGraph} />}
        {section === 'evidence' && <EvidenceSection edges={graphEdges} nodes={graphNodes} />}
      </div>
    </div>
  );
}

function BriefSection({ dossier, brief, graphNodes }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1rem' }}>
      <div className="forensic-panel" style={{ padding: '1rem', gridColumn: 'span 2' }}>
        <h4 style={{ color: '#D9AA3D', fontWeight: 800, marginBottom: 8 }}>Incident Summary</h4>
        <p style={{ fontSize: '0.85rem', color: '#A6B0AA', lineHeight: 1.6 }}>{dossier.summary}</p>
      </div>
      <div className="forensic-panel" style={{ padding: '1rem' }}>
        <h4 style={{ color: '#D9AA3D', fontWeight: 800, marginBottom: 8 }}>Key Parameters</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem' }}>
          <div><strong>Officer:</strong> {dossier.investigating_officer}</div>
          <div><strong>FIR Date:</strong> {dossier.fir_date}</div>
          <div><strong>Jurisdiction:</strong> {dossier.jurisdiction}</div>
          <div><strong>Risk Level:</strong> <span style={{ color: '#D62828', fontWeight: 700 }}>{dossier.risk_level}</span></div>
        </div>
      </div>
      <div className="forensic-panel" style={{ padding: '1rem' }}>
        <h4 style={{ color: '#D9AA3D', fontWeight: 800, marginBottom: 8 }}>Network Footprint</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <InfoCard label="Entities" value={graphNodes.length} />
          <InfoCard label="Cross-Case Links" value={brief?.cross_case_connections?.total_shared_entities ?? 0} />
        </div>
      </div>
      <div className="forensic-panel" style={{ padding: '1rem' }}>
        <h4 style={{ color: '#D9AA3D', fontWeight: 800, marginBottom: 8 }}>Primary Persons</h4>
        {(dossier.accused || []).map((a, i) => <div key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>{a}</div>)}
      </div>
      {brief?.cross_case_connections?.shared_entities?.length > 0 && (
        <div className="forensic-panel" style={{ padding: '1rem' }}>
          <h4 style={{ color: '#D62828', fontWeight: 800 }}>Cross-Case Observations</h4>
          {brief.cross_case_connections.shared_entities.map((e, i) => (
            <div key={i} style={{ fontSize: '0.82rem', marginTop: 6 }}>{e.name} — Cases {e.cases?.join(', ')}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function EntitiesSection({ nodes, onSelect, onGraph }) {
  const grouped = { Person: [], Organization: [], Phone: [], Vehicle: [], FinancialAccount: [], Location: [] };
  nodes.forEach((n) => {
    let t = 'Person';
    if (n.reg_number) t = 'Vehicle';
    else if (n.number && !n.name) t = 'Phone';
    else if (n.account_number) t = 'FinancialAccount';
    else if (n.lat != null) t = 'Location';
    else if (n.type?.match(/Company|Exchange|Syndicate|Hawala/)) t = 'Organization';
    grouped[t].push(n);
  });
  return Object.entries(grouped).filter(([, items]) => items.length).map(([type, items]) => (
    <div key={type} className="forensic-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
      <h4 style={{ color: '#D9AA3D', fontWeight: 800, marginBottom: 10 }}>{type} ({items.length})</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
        {items.map((e) => (
          <div key={e.id} style={{ padding: '0.65rem', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{e.name || e.reg_number || e.number || e.id}</div>
            <div style={{ fontSize: '0.68rem', color: '#A6B0AA' }}>{e.id}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button type="button" className="btn-secondary" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }} onClick={() => onSelect(e)}>Select</button>
              <button type="button" className="btn-red" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }} onClick={() => onGraph(e.id)}>Network</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  ));
}

function TimelineSection({ events, onGraph }) {
  if (!events.length) return <div style={{ color: '#A6B0AA' }}>No timeline events available for this case.</div>;
  return events.map((ev, idx) => (
    <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev.event_type === 'CASE' ? '#D62828' : '#D9AA3D', marginTop: 6, flexShrink: 0 }} />
      <div className="forensic-panel" style={{ flex: 1, padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: '#D9AA3D', fontWeight: 700 }}>
            {ev.date ? new Date(ev.date).toLocaleDateString() : 'Date N/A'}
          </div>
          {onGraph && (
            <button
              onClick={() => onGraph(ev.entity_id || 'PERSON-001')}
              style={{
                fontSize: '0.68rem',
                color: '#D9AA3D',
                background: 'rgba(217,170,61,0.15)',
                border: '1px solid rgba(217,170,61,0.35)',
                borderRadius: '4px',
                padding: '0.15rem 0.45rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              Focus Entity <ExternalLink size={10} />
            </button>
          )}
        </div>
        <div style={{ fontWeight: 800, fontSize: '0.88rem', marginTop: 3 }}>{ev.title}</div>
        <div style={{ fontSize: '0.8rem', color: '#A6B0AA', marginTop: 4 }}>{ev.description}</div>
        <div style={{ fontSize: '0.68rem', color: '#6C7A73', marginTop: 4 }}>Source: {ev.evidence_source} · {Math.round((ev.confidence || 0.9) * 100)}%</div>
      </div>
    </div>
  ));
}

function CrossCaseSection({ links, caseNumber, onViewGraph }) {
  if (!links.length) return <div style={{ color: '#A6B0AA' }}>No cross-case links for Case {caseNumber}.</div>;
  return links.map((link, idx) => (
    <div key={idx} className="evidence-card" style={{ padding: '1rem', marginBottom: 10, position: 'relative' }}>
      <div className="pin-detail pin-detail-red" />
      <div style={{ fontWeight: 800, color: '#24251F' }}>{link.name}</div>
      <div style={{ fontSize: '0.78rem', color: '#54564B' }}>{link.type} · Shared with Cases {link.shared_cases?.join(', ')}</div>
      <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#24251F' }}>
        CASE {caseNumber} ↔ CASE {link.shared_cases?.[0]} via <strong>{link.name}</strong>
      </div>
      <button type="button" className="btn-red" style={{ marginTop: 10, fontSize: '0.75rem' }} onClick={() => onViewGraph(link)}>
        View on Graph <ArrowRight size={12} />
      </button>
    </div>
  ));
}

function EvidenceSection({ edges, nodes }) {
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return edges.map((e, idx) => {
    const src = nodeMap[e.source || e.from_id];
    const tgt = nodeMap[e.target || e.to_id];
    const props = e.properties || e;
    const conf = props.confidence ?? e.confidence ?? 0.9;
    return (
      <div key={idx} className="forensic-panel" style={{ padding: '0.85rem', marginBottom: 8, fontSize: '0.82rem' }}>
        <div style={{ fontWeight: 800 }}>
          {(src?.name || e.source)} → {(e.type || e.relation || '').replace(/_/g, ' ')} → {(tgt?.name || e.target)}
        </div>
        <div style={{ color: '#A6B0AA', marginTop: 4 }}>
          Source: FIR/CDR-{props.source_case || e.source_case || '—'} · Confidence: {Math.round(conf * 100)}%
        </div>
        <span className="badge badge-gold" style={{ marginTop: 6, fontSize: '0.65rem' }}>AI-SUGGESTED — requires verification</span>
      </div>
    );
  });
}

function LeadsSection({ leads, onGraph, nodes }) {
  const nameToId = Object.fromEntries(nodes.map((n) => [n.name, n.id]));
  if (!leads.length) return <div style={{ color: '#A6B0AA' }}>No AI-suggested leads for this case yet.</div>;
  return leads.map((lead, idx) => (
    <div key={idx} className="forensic-panel" style={{ padding: '1rem', marginBottom: 10 }}>
      <div style={{ fontSize: '0.68rem', color: '#D9AA3D', fontWeight: 800 }}>POTENTIAL LEAD · {lead.status || 'AI_SUGGESTED'}</div>
      <div style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: 4 }}>{lead.entity}</div>
      <div style={{ fontSize: '0.8rem', color: '#A6B0AA', marginTop: 4 }}>{lead.reason}</div>
      {nameToId[lead.entity] && (
        <button type="button" className="btn-red" style={{ marginTop: 8, fontSize: '0.75rem' }} onClick={() => onGraph(nameToId[lead.entity])}>
          View on Graph
        </button>
      )}
    </div>
  ));
}

function ReportSection({ brief, dossier, crossLinks, caseNumber }) {
  const handleExport = () => {
    const reportText = `# SIH26189 CRIMINAL INTELLIGENCE REPORT
Case: CASE-${caseNumber}
Title: ${dossier.title || 'Case Investigation'}
Investigating Officer: ${dossier.investigating_officer || 'Inspector K. Vijayalakshmi'}
Status: ${dossier.status || 'ACTIVE'}

## 1. Executive Summary
${dossier.summary || 'Multi-jurisdiction smuggling network identified.'}

## 2. Key Bridge Entities
${brief?.key_entities?.persons?.map(p => `- ${p.name} (Role: Suspect / Coordinator)`).join('\n') || '- Ravi Kumar'}

## 3. Cross-Case Correlations
${crossLinks.map(l => `- ${l.name} (${l.type}): Shared across Cases ${l.shared_cases?.join(', ')}`).join('\n')}

## 4. Court-Ready Actionable Leads
${brief?.ai_suggested_leads?.map(l => `- [${l.status}] ${l.entity}: ${l.reason}`).join('\n') || 'All leads pending verification'}
`;
    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Investigation_Report_CASE_${caseNumber}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h3 style={{ fontWeight: 800, color: '#D9AA3D', marginBottom: '1rem' }}>Investigation Intelligence Report</h3>
      <div className="forensic-panel" style={{ padding: '1rem', marginBottom: 10, fontSize: '0.82rem', lineHeight: 1.6 }}>
        <strong>Case Overview:</strong> {dossier.summary}<br />
        <strong>Primary Entities:</strong> {brief?.key_entities?.persons?.map((p) => p.name).join(', ') || '—'}<br />
        <strong>Network:</strong> {brief?.network_overview?.total_entities} entities, {brief?.network_overview?.total_relationships} relationships<br />
        <strong>Cross-Case:</strong> {crossLinks.length} shared entities<br />
        <strong>Leads:</strong> {brief?.ai_suggested_leads?.length || 0} AI-suggested (pending verification)
      </div>
      <button type="button" className="btn-red" onClick={handleExport}>
        Download Court-Ready Brief
      </button>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="forensic-panel" style={{ padding: '0.75rem' }}>
      <div style={{ fontSize: '0.68rem', color: '#A6B0AA', fontWeight: 700 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{value ?? '—'}</div>
    </div>
  );
}
