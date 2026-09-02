import React, { useState, useEffect } from 'react';
import { FolderOpen, Clock, Users, Building2, Car, Phone, Landmark, GitBranch, ArrowRight, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import axios from 'axios';

export default function CaseInvestigation({ caseNumber, onBack, onOpenGraph }) {
  const [caseData, setCaseData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [crossLinks, setCrossLinks] = useState([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState(null);

  useEffect(() => {
    if (!caseNumber) return;
    setLoading(true);
    Promise.all([
      axios.get(`/api/v1/cases/${caseNumber}`).catch(() => ({ data: { data: null } })),
      axios.get(`/api/v1/cases/${caseNumber}/timeline`).catch(() => ({ data: { data: { events: [] } } })),
      axios.get(`/api/v1/cases/${caseNumber}/cross-links`).catch(() => ({ data: { data: { links: [] } } })),
    ]).then(([caseRes, timelineRes, crossRes]) => {
      if (caseRes.data?.data) setCaseData(caseRes.data.data);
      if (timelineRes.data?.data?.events) setTimeline(timelineRes.data.data.events);
      if (crossRes.data?.data?.links) setCrossLinks(crossRes.data.data.links);
      setLoading(false);
    });
  }, [caseNumber]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Loading Case {caseNumber}...
      </div>
    );
  }

  const dossier = caseData?.dossier || {};
  const graphNodes = caseData?.graph_entities || [];
  const graphEdges = caseData?.graph_relations || [];

  const persons = graphNodes.filter(n => n.role || (n.name && !n.reg_number && !n.number && !n.account_number));
  const organizations = graphNodes.filter(n => n.type && (n.type.includes('Company') || n.type.includes('Exchange') || n.type.includes('Hawala') || n.type.includes('Syndicate') || n.type.includes('Services') || n.type.includes('Front')));
  const vehicles = graphNodes.filter(n => n.reg_number);
  const phones = graphNodes.filter(n => n.number && !n.name);
  const accounts = graphNodes.filter(n => n.account_number);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'entities', label: 'Entities' },
    { id: 'timeline', label: 'Case Timeline' },
    { id: 'crosscase', label: 'Cross-Case Links' },
  ];

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', color: '#f8fafc', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onBack && (
            <button onClick={onBack} style={{ padding: '0.4rem 0.7rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>
              Back
            </button>
          )}
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
            <FolderOpen size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{dossier.fir_number || `Case #${caseNumber}`}</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>{dossier.title || ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className={`badge ${dossier.priority === 'CRITICAL' ? 'badge-danger' : 'badge-lead'}`}>
            {dossier.priority || 'ACTIVE'}
          </span>
          {onOpenGraph && (
            <button onClick={onOpenGraph} className="btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
              View Network <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.5)' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding: '0.75rem 1.25rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', fontWeight: activeSection === s.id ? 600 : 400,
            color: activeSection === s.id ? '#a5b4fc' : '#64748b',
            borderBottom: activeSection === s.id ? '2px solid #6366f1' : '2px solid transparent',
          }}>{s.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        {/* OVERVIEW */}
        {activeSection === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <InfoCard label="Crime Type" value={dossier.crime_category} />
              <InfoCard label="Jurisdiction" value={dossier.jurisdiction} />
              <InfoCard label="Incident Date" value={dossier.incident_date ? new Date(dossier.incident_date).toLocaleDateString() : ''} />
              <InfoCard label="Status" value={dossier.status?.replace('_', ' ')} />
              <InfoCard label="Entities in Graph" value={`${graphNodes.length} nodes, ${graphEdges.length} edges`} />
              <InfoCard label="Cross-Case Links" value={`${crossLinks.length} shared entities`} />
            </div>

            <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem' }}>Case Summary</h3>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>{dossier.summary}</p>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.75rem' }}>Named Accused</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(dossier.accused || []).map((a, idx) => (
                  <div key={idx} style={{ padding: '0.6rem 0.85rem', borderRadius: '6px', background: 'var(--bg-primary)', borderLeft: '3px solid #f59e0b', fontSize: '0.85rem', color: '#f1f5f9' }}>
                    {a}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ENTITIES */}
        {activeSection === 'entities' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <EntitySection title="Persons" icon={<Users size={18} />} color="#3b82f6" items={persons} getLabel={n => n.name || n.id} getSub={n => n.role || ''} />
            <EntitySection title="Organizations" icon={<Building2 size={18} />} color="#f59e0b" items={organizations} getLabel={n => n.name || n.id} getSub={n => n.type || ''} />
            <EntitySection title="Vehicles" icon={<Car size={18} />} color="#10b981" items={vehicles} getLabel={n => n.reg_number} getSub={n => n.model || ''} />
            <EntitySection title="Phones" icon={<Phone size={18} />} color="#06b6d4" items={phones} getLabel={n => n.number} getSub={n => ''} />
            <EntitySection title="Financial Accounts" icon={<Landmark size={18} />} color="#8b5cf6" items={accounts} getLabel={n => n.account_number} getSub={n => n.bank || ''} />
          </div>
        )}

        {/* TIMELINE */}
        {activeSection === 'timeline' && (
          <div style={{ maxWidth: '850px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#a5b4fc" /> Investigation Timeline — {timeline.length} Events
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {timeline.map((event, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: event.event_type === 'CASE' ? '#ec4899' : '#6366f1', border: '2px solid var(--bg-primary)' }} />
                    {idx < timeline.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--border-color)' }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: '1.25rem' }}>
                    <button onClick={() => setExpandedEvent(expandedEvent === idx ? null : idx)} style={{ width: '100%', textAlign: 'left', padding: '0.85rem 1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: expandedEvent === idx ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-color)', cursor: 'pointer', color: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 600 }}>{event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.15rem' }}>{event.title}</div>
                        </div>
                        {expandedEvent === idx ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                      </div>
                      {expandedEvent === idx && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem', color: '#cbd5e1' }}>
                          <div style={{ marginBottom: '0.5rem' }}>{event.description}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            {(event.entities || []).map((e, eIdx) => (
                              <span key={eIdx} style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>{e}</span>
                            ))}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            Evidence: {event.evidence_source || 'Graph Data'} | Confidence: {Math.round((event.confidence || 0.9) * 100)}%
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CROSS-CASE */}
        {activeSection === 'crosscase' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GitBranch size={18} color="#f59e0b" /> Cross-Case Intelligence — {crossLinks.length} Shared Entities
            </h3>
            {crossLinks.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                No cross-case connections detected for this case.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {crossLinks.map((link, idx) => (
                  <div key={idx} style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>{link.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        {link.type} | Appears in {link.total_cases} cases
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                        {(link.shared_cases || []).map((c, cIdx) => (
                          <span key={cIdx} style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            Case {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>{link.total_cases}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>{value || 'N/A'}</div>
    </div>
  );
}

function EntitySection({ title, icon, color, items, getLabel, getSub }) {
  if (!items.length) return null;
  return (
    <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {icon} {title} ({items.length})
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ padding: '0.6rem 0.85rem', borderRadius: '6px', background: 'var(--bg-primary)', borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>{getLabel(item)}</div>
            {getSub(item) && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>{getSub(item)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
