import React, { useState, useEffect } from 'react';
import { FileText, Shield, CheckCircle, Sparkles, Download, Users, GitBranch, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function SmartCaseBrief({ selectedCase }) {
  const [cases, setCases] = useState([]);
  const [activeCaseId, setActiveCaseId] = useState(selectedCase || '');
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch available cases
  useEffect(() => {
    axios.get('/api/v1/cases/').then(res => {
      if (res.data?.data) setCases(res.data.data);
    }).catch(() => {});
  }, []);

  // Fetch brief when case changes
  useEffect(() => {
    if (!activeCaseId) return;
    setLoading(true);
    setBrief(null);
    axios.get(`/api/v1/cases/${activeCaseId}/brief`).then(res => {
      if (res.data?.data) setBrief(res.data.data);
    }).catch(err => console.error('Brief generation failed:', err))
      .finally(() => setLoading(false));
  }, [activeCaseId]);

  const handleExport = () => {
    if (!activeCaseId) return;
    window.open(`/api/v1/cases/${activeCaseId}/export?format=markdown`, '_blank');
  };

  return (
    <div className="animate-fade-in" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent', color: '#F1EBDD', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(16, 34, 29, 0.92)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(217, 170, 61, 0.18)', color: '#D9AA3D', border: '1px solid rgba(217, 170, 61, 0.3)', boxShadow: '0 0 12px rgba(217, 170, 61, 0.2)' }}>
            <FileText size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Smart Forensic Case Brief</h2>
            <p style={{ fontSize: '0.8rem', color: '#A6B0AA', margin: 0 }}>Automated intelligence summary synthesized from graph evidence & FIR dossiers</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <select value={activeCaseId} onChange={(e) => setActiveCaseId(e.target.value)}
            style={{ padding: '0.55rem 0.95rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(11, 23, 20, 0.7)', color: '#F1EBDD', fontSize: '0.86rem', outline: 'none', fontWeight: 600 }}>
            <option value="">Select FIR Case</option>
            {cases.map(c => (
              <option key={c.case_number} value={c.case_number}>Case {c.case_number} - {c.title?.substring(0, 40)}</option>
            ))}
          </select>
          {activeCaseId && (
            <button onClick={handleExport} className="btn-primary" style={{ padding: '0.55rem 0.95rem', fontSize: '0.83rem' }}>
              <Download size={15} /> Export Forensic Report
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '1.75rem', overflowY: 'auto' }}>
        {!activeCaseId && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#6C7A73', fontSize: '0.95rem' }}>
            Select an active FIR case from the dropdown to generate the Smart Case Brief
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#A6B0AA', fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
            <Sparkles size={22} className="animate-spin" color="#D9AA3D" />
            <div>Synthesizing Smart Case Brief from Knowledge Graph...</div>
          </div>
        )}

        {brief && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', maxWidth: '950px', margin: '0 auto' }}>
            {/* Case Information */}
            <BriefSection title="Case File Information" icon={<FileText size={19} />} color="#D9AA3D">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <InfoRow label="Case ID" value={brief.case_information?.case_id} />
                <InfoRow label="FIR Number" value={brief.case_information?.fir_number} />
                <InfoRow label="Crime Category" value={brief.case_information?.crime_type} />
                <InfoRow label="Jurisdiction" value={brief.case_information?.location} />
                <InfoRow label="Incident Date" value={brief.case_information?.date ? new Date(brief.case_information.date).toLocaleDateString() : ''} />
                <InfoRow label="Status" value={brief.case_information?.status?.replace('_', ' ')} />
              </div>
            </BriefSection>

            {/* Case Summary Paper Card */}
            <div className="evidence-card" style={{ position: 'relative' }}>
              <div className="pin-detail" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#24251F', margin: 0, display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <Shield size={19} color="#5E9F68" /> Case Executive Summary
                </h3>
                <span className="badge badge-verified" style={{ fontSize: '0.68rem' }}>
                  VERIFIED EVIDENTIARY DOSSIER
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#24251F', lineHeight: 1.65, margin: 0, fontWeight: 500 }}>{brief.case_summary}</p>
            </div>

            {/* Key Entities */}
            <BriefSection title="Key Pinned Entities" icon={<Users size={19} />} color="#E8D9A8">
              {brief.key_entities?.persons?.length > 0 && (
                <EntityGroup label="Persons" items={brief.key_entities.persons.map(p => `${p.name}${p.role ? ` (${p.role})` : ''}`)} color="#D9AA3D" />
              )}
              {brief.key_entities?.organizations?.length > 0 && (
                <EntityGroup label="Organizations" items={brief.key_entities.organizations.map(o => o.name)} color="#E8D9A8" />
              )}
              {brief.key_entities?.vehicles?.length > 0 && (
                <EntityGroup label="Vehicles" items={brief.key_entities.vehicles.map(v => v.reg_number)} color="#94A3B8" />
              )}
              {brief.key_entities?.phones?.length > 0 && (
                <EntityGroup label="Phones" items={brief.key_entities.phones.map(p => p.number)} color="#5E9F68" />
              )}
              {brief.key_entities?.accounts?.length > 0 && (
                <EntityGroup label="Financial Accounts" items={brief.key_entities.accounts.map(a => a.account)} color="#D8C58A" />
              )}
            </BriefSection>

            {/* Network Overview */}
            <BriefSection title="Network Overview" icon={<Sparkles size={19} />} color="#D9AA3D">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                <StatBox label="Total Entities" value={brief.network_overview?.total_entities} />
                <StatBox label="Relationships" value={brief.network_overview?.total_relationships} />
                <StatBox label="Bridge Entities" value={brief.network_overview?.bridge_entities?.length || 0} />
              </div>
              {brief.network_overview?.bridge_entities?.length > 0 && (
                <div style={{ fontSize: '0.84rem', color: '#F1EBDD' }}>
                  <strong>Key Syndicate Bridges: </strong>{brief.network_overview.bridge_entities.join(', ')}
                </div>
              )}
            </BriefSection>

            {/* Cross-Case Connections */}
            {brief.cross_case_connections?.related_cases?.length > 0 && (
              <BriefSection title="Cross-Case Connections" icon={<GitBranch size={19} />} color="#D62828">
                <div style={{ fontSize: '0.84rem', color: '#F1EBDD', marginBottom: '0.65rem' }}>
                  <strong>Related FIR Cases: </strong>{brief.cross_case_connections.related_cases.map(c => `Case ${c}`).join(', ')}
                </div>
                {brief.cross_case_connections.shared_entities?.map((e, idx) => (
                  <div key={idx} style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', borderLeft: '3px solid #D62828', marginBottom: '0.45rem', fontSize: '0.84rem' }}>
                    <strong>{e.name}</strong> — Appears in Cases: {(e.cases || []).join(', ')}
                  </div>
                ))}
              </BriefSection>
            )}

            {/* AI-Suggested Leads */}
            {brief.ai_suggested_leads?.length > 0 && (
              <BriefSection title="AI-Suggested Investigative Leads" icon={<AlertTriangle size={19} />} color="#C92A2A" badge="AI SUGGESTED">
                <div style={{ fontSize: '0.78rem', color: '#D9AA3D', marginBottom: '0.85rem', fontStyle: 'italic' }}>
                  AI-generated suggestions based on graph patterns. Requires officer verification.
                </div>
                {brief.ai_suggested_leads.map((lead, idx) => (
                  <div key={idx} style={{ padding: '0.75rem 0.95rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', borderLeft: '3px solid #C92A2A', marginBottom: '0.45rem' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#F1EBDD' }}>{lead.entity}</div>
                    <div style={{ fontSize: '0.8rem', color: '#A6B0AA', marginTop: '0.2rem' }}>{lead.reason}</div>
                  </div>
                ))}
              </BriefSection>
            )}

            {/* Data Quality */}
            <BriefSection title="Data Quality & Confidence Metrics" icon={<CheckCircle size={19} />} color="#5E9F68">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.84rem', color: '#F1EBDD' }}>
                <div>{brief.data_quality?.entity_coverage}</div>
                <div>{brief.data_quality?.relationship_density}</div>
                <div>{brief.data_quality?.cross_case_coverage}</div>
              </div>
            </BriefSection>
          </div>
        )}
      </div>
    </div>
  );
}

function BriefSection({ title, icon, color, badge, children }) {
  return (
    <div className="forensic-panel" style={{ padding: '1.35rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color, margin: 0, display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          {icon} {title}
        </h3>
        {badge && (
          <span className={badge === 'VERIFIED' ? 'badge badge-verified' : 'badge badge-danger'} style={{ fontSize: '0.68rem' }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span style={{ fontSize: '0.74rem', color: '#6C7A73', fontWeight: 700 }}>{label}</span>
      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F1EBDD' }}>{value || 'N/A'}</div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="forensic-panel" style={{ padding: '0.75rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#D9AA3D' }}>{value || 0}</div>
      <div style={{ fontSize: '0.72rem', color: '#A6B0AA', fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function EntityGroup({ label, items, color }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color, marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
        {items.map((item, idx) => (
          <span key={idx} style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.04)', color: '#F1EBDD', border: '1px solid var(--border-color)' }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
