import React, { useState, useEffect } from 'react';
import { FileText, Shield, CheckCircle, Sparkles, Download, Users, Building2, Car, Phone, Landmark, GitBranch, AlertTriangle } from 'lucide-react';
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
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', color: '#f8fafc', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <FileText size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Smart Case Brief</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Auto-generated from verified database & graph evidence</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select value={activeCaseId} onChange={(e) => setActiveCaseId(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: '#cbd5e1', fontSize: '0.85rem', outline: 'none' }}>
            <option value="">Select Case</option>
            {cases.map(c => (
              <option key={c.case_number} value={c.case_number}>Case {c.case_number} - {c.title?.substring(0, 40)}</option>
            ))}
          </select>
          {activeCaseId && (
            <button onClick={handleExport} className="btn-primary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}>
              <Download size={14} /> Export Brief
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        {!activeCaseId && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            Select a case to generate the Smart Case Brief
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <Sparkles size={24} className="animate-spin" style={{ marginBottom: '0.5rem' }} />
            <div>Generating brief from Neo4j Knowledge Graph...</div>
          </div>
        )}

        {brief && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '900px' }}>
            {/* Case Information */}
            <BriefSection title="Case Information" icon={<FileText size={18} />} color="#38bdf8">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <InfoRow label="Case ID" value={brief.case_information?.case_id} />
                <InfoRow label="FIR Number" value={brief.case_information?.fir_number} />
                <InfoRow label="Crime Type" value={brief.case_information?.crime_type} />
                <InfoRow label="Location" value={brief.case_information?.location} />
                <InfoRow label="Date" value={brief.case_information?.date ? new Date(brief.case_information.date).toLocaleDateString() : ''} />
                <InfoRow label="Status" value={brief.case_information?.status?.replace('_', ' ')} />
              </div>
            </BriefSection>

            {/* Case Summary */}
            <BriefSection title="Case Summary" icon={<Shield size={18} />} color="#10b981" badge="VERIFIED">
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>{brief.case_summary}</p>
            </BriefSection>

            {/* Key Entities */}
            <BriefSection title="Key Entities" icon={<Users size={18} />} color="#6366f1">
              {brief.key_entities?.persons?.length > 0 && (
                <EntityGroup label="Persons" items={brief.key_entities.persons.map(p => `${p.name}${p.role ? ` (${p.role})` : ''}`)} color="#3b82f6" />
              )}
              {brief.key_entities?.organizations?.length > 0 && (
                <EntityGroup label="Organizations" items={brief.key_entities.organizations.map(o => o.name)} color="#f59e0b" />
              )}
              {brief.key_entities?.vehicles?.length > 0 && (
                <EntityGroup label="Vehicles" items={brief.key_entities.vehicles.map(v => v.reg_number)} color="#10b981" />
              )}
              {brief.key_entities?.phones?.length > 0 && (
                <EntityGroup label="Phones" items={brief.key_entities.phones.map(p => p.number)} color="#06b6d4" />
              )}
              {brief.key_entities?.accounts?.length > 0 && (
                <EntityGroup label="Financial Accounts" items={brief.key_entities.accounts.map(a => a.account)} color="#8b5cf6" />
              )}
            </BriefSection>

            {/* Network Overview */}
            <BriefSection title="Network Overview" icon={<Sparkles size={18} />} color="#a78bfa">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <StatBox label="Total Entities" value={brief.network_overview?.total_entities} />
                <StatBox label="Relationships" value={brief.network_overview?.total_relationships} />
                <StatBox label="Bridge Entities" value={brief.network_overview?.bridge_entities?.length || 0} />
              </div>
              {brief.network_overview?.bridge_entities?.length > 0 && (
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                  <strong>Bridge entities: </strong>{brief.network_overview.bridge_entities.join(', ')}
                </div>
              )}
            </BriefSection>

            {/* Cross-Case Connections */}
            {brief.cross_case_connections?.related_cases?.length > 0 && (
              <BriefSection title="Cross-Case Connections" icon={<GitBranch size={18} />} color="#f59e0b">
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                  <strong>Related Cases: </strong>{brief.cross_case_connections.related_cases.map(c => `Case ${c}`).join(', ')}
                </div>
                {brief.cross_case_connections.shared_entities?.map((e, idx) => (
                  <div key={idx} style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'var(--bg-primary)', borderLeft: '3px solid #f59e0b', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                    <strong>{e.name}</strong> — Appears in Cases: {(e.cases || []).join(', ')}
                  </div>
                ))}
              </BriefSection>
            )}

            {/* AI-Suggested Leads */}
            {brief.ai_suggested_leads?.length > 0 && (
              <BriefSection title="AI-Suggested Leads" icon={<AlertTriangle size={18} />} color="#ef4444" badge="AI SUGGESTED">
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                  These are AI-generated suggestions based on graph patterns. They require investigator verification.
                </div>
                {brief.ai_suggested_leads.map((lead, idx) => (
                  <div key={idx} style={{ padding: '0.6rem 0.85rem', borderRadius: '6px', background: 'var(--bg-primary)', borderLeft: '3px solid #ef4444', marginBottom: '0.4rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>{lead.entity}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.15rem' }}>{lead.reason}</div>
                  </div>
                ))}
              </BriefSection>
            )}

            {/* Data Quality */}
            <BriefSection title="Data Quality & Confidence" icon={<CheckCircle size={18} />} color="#10b981">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
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
    <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon} {title}
        </h3>
        {badge && (
          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: badge === 'VERIFIED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: badge === 'VERIFIED' ? '#34d399' : '#f87171' }}>
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
      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{label}</span>
      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>{value || 'N/A'}</div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{ padding: '0.65rem', borderRadius: '6px', background: 'var(--bg-primary)', textAlign: 'center' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#a5b4fc' }}>{value || 0}</div>
      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{label}</div>
    </div>
  );
}

function EntityGroup({ label, items, color }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color, marginBottom: '0.35rem' }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {items.map((item, idx) => (
          <span key={idx} style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'var(--bg-primary)', color: '#f8fafc', border: '1px solid var(--border-color)' }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
