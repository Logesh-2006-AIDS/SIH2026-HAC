import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FolderOpen, Clock, Users, GitBranch, FileText, Network, Shield, AlertTriangle, ArrowRight,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

const SECTIONS = [
  { id: 'brief', label: 'Case Brief', icon: FileText },
  { id: 'entities', label: 'Entities', icon: Users },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'crosscase', label: 'Cross-Case', icon: GitBranch },
  { id: 'evidence', label: 'Evidence', icon: Shield },
  { id: 'leads', label: 'Potential Leads', icon: AlertTriangle },
  { id: 'report', label: 'Report', icon: FileText },
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
      axios.get(`/api/v1/cases/${selectedCase}`),
      axios.get(`/api/v1/cases/${selectedCase}/timeline`),
      axios.get(`/api/v1/cases/${selectedCase}/cross-links`),
      axios.get(`/api/v1/cases/${selectedCase}/brief`),
    ]).then(([c, t, x, b]) => {
      if (c.data?.success) setCaseData(c.data.data);
      if (t.data?.success) setTimeline(t.data.data.events || []);
      if (x.data?.success) setCrossLinks(x.data.data.links || []);
      if (b.data?.success) setBrief(b.data.data);
    }).finally(() => setLoading(false));
  }, [selectedCase]);

  const dossier = caseData?.dossier || {};
  const graphNodes = caseData?.graph_entities || [];
  const graphEdges = caseData?.graph_relations || [];

  const handleSection = (id) => {
    if (id === 'network') {
      setActiveTab('network');
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
        <span className="badge badge-gold">{dossier.status?.replace(/_/g, ' ') || 'ACTIVE'}</span>
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '0 1.5rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', background: 'rgba(8,10,9,0.6)' }}>
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button key={s.id} type="button" onClick={() => handleSection(s.id)} style={{
              padding: '0.75rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
              color: active ? '#D9AA3D' : '#6C7A73', fontWeight: active ? 800 : 500, fontSize: '0.82rem',
              borderBottom: active ? '2px solid #D62828' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon size={14} />{s.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        {section === 'brief' && <BriefSection dossier={dossier} brief={brief} graphNodes={graphNodes} graphEdges={graphEdges} crossLinks={crossLinks} />}
        {section === 'entities' && <EntitiesSection nodes={graphNodes} onSelect={handleEntityClick} onGraph={handleViewOnGraph} />}
        {section === 'timeline' && <TimelineSection events={timeline} />}
        {section === 'crosscase' && <CrossCaseSection links={crossLinks} caseNumber={selectedCase} onViewGraph={handleCrossCaseGraph} />}
        {section === 'evidence' && <EvidenceSection edges={graphEdges} nodes={graphNodes} />}
        {section === 'leads' && <LeadsSection leads={brief?.ai_suggested_leads || []} onGraph={handleViewOnGraph} nodes={graphNodes} />}
        {section === 'report' && <ReportSection brief={brief} dossier={dossier} crossLinks={crossLinks} caseNumber={selectedCase} />}
      </div>
    </div>
  );
}

function BriefSection({ dossier, brief, graphNodes, graphEdges, crossLinks }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 900 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
        <InfoCard label="Crime Type" value={dossier.crime_category} />
        <InfoCard label="Location" value={dossier.jurisdiction} />
        <InfoCard label="Incident Date" value={dossier.incident_date ? new Date(dossier.incident_date).toLocaleDateString() : '—'} />
        <InfoCard label="Connections" value={graphEdges.length} />
        <InfoCard label="Cross-Case Links" value={crossLinks.length} />
        <InfoCard label="Potential Leads" value={brief?.ai_suggested_leads?.length ?? '—'} />
      </div>
      <div className="evidence-card" style={{ position: 'relative', padding: '1rem' }}>
        <div className="pin-detail" />
        <h3 style={{ color: '#24251F', fontWeight: 800, marginBottom: 8 }}>Investigation Intelligence</h3>
        <p style={{ color: '#24251F', lineHeight: 1.6 }}>{dossier.summary}</p>
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

function TimelineSection({ events }) {
  if (!events.length) return <div style={{ color: '#A6B0AA' }}>No timeline events available for this case.</div>;
  return events.map((ev, idx) => (
    <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev.event_type === 'CASE' ? '#D62828' : '#D9AA3D', marginTop: 6, flexShrink: 0 }} />
      <div className="forensic-panel" style={{ flex: 1, padding: '0.75rem 1rem' }}>
        <div style={{ fontSize: '0.72rem', color: '#D9AA3D', fontWeight: 700 }}>{ev.date ? new Date(ev.date).toLocaleDateString() : 'Date N/A'}</div>
        <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{ev.title}</div>
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
      <button type="button" className="btn-red" onClick={() => window.open(`/api/v1/cases/${caseNumber}/export?format=markdown`, '_blank')}>
        Export Court Brief
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
