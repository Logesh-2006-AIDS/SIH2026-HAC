import React, { useState, useEffect } from 'react';
import { FolderOpen, Clock, Users, Building2, Car, Phone, Landmark, GitBranch, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D9AA3D', fontSize: '0.92rem' }}>
        <div className="animate-spin" style={{ width: 22, height: 22, border: '3px solid rgba(217,170,61,0.3)', borderTopColor: '#D9AA3D', borderRadius: '50%', marginRight: '0.75rem' }} />
        Opening Case Dossier #{caseNumber}...
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
    { id: 'overview', label: 'Case Dossier Overview' },
    { id: 'entities', label: 'Pinned Evidence Entities' },
    { id: 'timeline', label: 'Chronological Timeline' },
    { id: 'crosscase', label: 'Cross-Case Red Strings' },
  ];

  return (
    <div className="animate-fade-in" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent', color: '#F1EBDD', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(16, 19, 17, 0.92)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {onBack && (
            <button onClick={onBack} className="btn-secondary" style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}>
              Back
            </button>
          )}
          <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(214, 40, 40, 0.18)', color: '#D62828', border: '1px solid rgba(214, 40, 40, 0.3)', boxShadow: '0 0 12px rgba(214, 40, 40, 0.2)' }}>
            <FolderOpen size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{dossier.fir_number || `Case #${caseNumber}`}</h2>
            <p style={{ fontSize: '0.8rem', color: '#A6B0AA', margin: 0 }}>{dossier.title || ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge ${dossier.priority === 'CRITICAL' ? 'badge-danger' : 'badge-gold'}`}>
            {dossier.priority || 'ACTIVE INVESTIGATION'}
          </span>
          {onOpenGraph && (
            <button onClick={onOpenGraph} className="btn-red" style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}>
              Inspect Evidence Board <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1.75rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(8, 10, 9, 0.6)' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding: '0.85rem 1.25rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.86rem', fontWeight: activeSection === s.id ? 800 : 500,
            color: activeSection === s.id ? '#D9AA3D' : '#6C7A73',
            borderBottom: activeSection === s.id ? '2px solid #D62828' : '2px solid transparent',
            transition: 'all 0.2s ease',
          }}>{s.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '1.75rem', overflowY: 'auto' }}>
        {/* OVERVIEW */}
        {activeSection === 'overview' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <InfoCard label="Crime Category" value={dossier.crime_category} />
              <InfoCard label="Jurisdiction" value={dossier.jurisdiction} />
              <InfoCard label="Incident Date" value={dossier.incident_date ? new Date(dossier.incident_date).toLocaleDateString() : ''} />
              <InfoCard label="Investigation Status" value={dossier.status?.replace('_', ' ')} />
              <InfoCard label="Knowledge Graph Count" value={`${graphNodes.length} nodes, ${graphEdges.length} edges`} />
              <InfoCard label="Cross-Case Connections" value={`${crossLinks.length} shared entities`} />
            </div>

            <div className="evidence-card" style={{ position: 'relative' }}>
              <div className="pin-detail" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#24251F', marginBottom: '0.6rem' }}>FIR Case Executive Brief</h3>
              <p style={{ fontSize: '0.9rem', color: '#24251F', lineHeight: 1.65, fontWeight: 500 }}>{dossier.summary}</p>
            </div>

            <div className="forensic-panel" style={{ padding: '1.35rem' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#D9AA3D', marginBottom: '0.85rem' }}>Named Accused Suspects</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {(dossier.accused || []).map((a, idx) => (
                  <div key={idx} style={{ padding: '0.7rem 0.95rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', borderLeft: '3px solid #D62828', fontSize: '0.88rem', color: '#F1EBDD', fontWeight: 600 }}>
                    {a}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ENTITIES */}
        {activeSection === 'entities' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
            <EntitySection title="Persons" icon={<Users size={19} />} color="#D9AA3D" items={persons} getLabel={n => n.name || n.id} getSub={n => n.role || ''} />
            <EntitySection title="Organizations" icon={<Building2 size={19} />} color="#E8D9A8" items={organizations} getLabel={n => n.name || n.id} getSub={n => n.type || ''} />
            <EntitySection title="Vehicles" icon={<Car size={19} />} color="#94A3B8" items={vehicles} getLabel={n => n.reg_number} getSub={n => n.model || ''} />
            <EntitySection title="Phones" icon={<Phone size={19} />} color="#5E9F68" items={phones} getLabel={n => n.number} getSub={n => ''} />
            <EntitySection title="Financial Accounts" icon={<Landmark size={19} />} color="#D8C58A" items={accounts} getLabel={n => n.account_number} getSub={n => n.bank || ''} />
          </div>
        )}

        {/* TIMELINE */}
        {activeSection === 'timeline' && (
          <div className="animate-slide-up" style={{ maxWidth: '850px' }}>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#F1EBDD', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <Clock size={20} color="#D9AA3D" /> Pinned Chronological Evidence Timeline — {timeline.length} Events
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {timeline.map((event, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '22px' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: event.event_type === 'CASE' ? '#D62828' : '#D9AA3D', border: '3px solid var(--bg-primary)', boxShadow: `0 0 10px ${event.event_type === 'CASE' ? '#D62828' : '#D9AA3D'}` }} />
                    {idx < timeline.length - 1 && <div style={{ flex: 1, width: 2, background: 'rgba(214, 40, 40, 0.4)' }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: '1.35rem' }}>
                    <button onClick={() => setExpandedEvent(expandedEvent === idx ? null : idx)} style={{ width: '100%', textAlign: 'left', padding: '0.95rem 1.25rem', borderRadius: '10px', background: 'rgba(16, 19, 17, 0.85)', backdropFilter: 'blur(12px)', border: expandedEvent === idx ? '1px solid #D62828' : '1px solid var(--border-color)', cursor: 'pointer', color: '#F1EBDD', transition: 'all 0.2s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.74rem', color: '#D9AA3D', fontWeight: 800 }}>{event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, marginTop: '0.2rem' }}>{event.title}</div>
                        </div>
                        {expandedEvent === idx ? <ChevronUp size={18} color="#A6B0AA" /> : <ChevronDown size={18} color="#A6B0AA" />}
                      </div>
                      {expandedEvent === idx && (
                        <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: '#A6B0AA', lineHeight: 1.6 }}>
                          <div style={{ marginBottom: '0.65rem', color: '#F1EBDD' }}>{event.description}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                            {(event.entities || []).map((e, eIdx) => (
                              <span key={eIdx} style={{ fontSize: '0.74rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(217, 170, 61, 0.18)', color: '#D9AA3D', border: '1px solid rgba(217, 170, 61, 0.3)' }}>{e}</span>
                            ))}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#A6B0AA' }}>
                            Evidence Source: <strong>{event.evidence_source || 'Graph Data'}</strong> | Confidence: <strong>{Math.round((event.confidence || 0.9) * 100)}%</strong>
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
          <div className="animate-slide-up">
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#F1EBDD', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <GitBranch size={20} color="#D62828" /> Cross-Case Red String Connections — {crossLinks.length} Links
            </h3>
            {crossLinks.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#6C7A73', fontSize: '0.9rem' }}>
                No cross-case connections detected for this case.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                {crossLinks.map((link, idx) => (
                  <div key={idx} className="evidence-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                    <div className="pin-detail pin-detail-red" style={{ top: '-7px' }} />
                    <div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#24251F' }}>{link.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#54564B', marginTop: '0.25rem', fontWeight: 600 }}>
                        {link.type} | Appears in {link.total_cases} distinct FIR cases
                      </div>
                      <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.5rem' }}>
                        {(link.shared_cases || []).map((c, cIdx) => (
                          <span key={cIdx} className="badge badge-red" style={{ fontSize: '0.72rem', background: 'rgba(214, 40, 40, 0.15)', color: '#900', border: '1px solid rgba(214, 40, 40, 0.4)' }}>
                            Case {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D62828' }}>{link.total_cases}</div>
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
    <div className="forensic-panel" style={{ padding: '1rem 1.15rem' }}>
      <div style={{ fontSize: '0.74rem', color: '#6C7A73', marginBottom: '0.25rem', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F1EBDD' }}>{value || 'N/A'}</div>
    </div>
  );
}

function EntitySection({ title, icon, color, items, getLabel, getSub }) {
  if (!items.length) return null;
  return (
    <div className="forensic-panel" style={{ padding: '1.35rem' }}>
      <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
        {icon} {title} ({items.length})
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.75rem' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ padding: '0.75rem 0.95rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', borderLeft: `3px solid ${color}`, borderTop: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F1EBDD' }}>{getLabel(item)}</div>
            {getSub(item) && <div style={{ fontSize: '0.76rem', color: '#A6B0AA', marginTop: '0.2rem' }}>{getSub(item)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
