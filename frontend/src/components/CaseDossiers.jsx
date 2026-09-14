import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FolderOpen, ArrowRight, Users, GitBranch, AlertTriangle, FileText } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

/**
 * Case Dossiers — investigator selects a case; all later tools inherit selectedCase.
 */
export default function CaseDossiers() {
  const { casesList, openCase, selectedCase, setSelectedCase } = useInvestigation();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const next = {};
      const list = casesList.length ? casesList : [];
      await Promise.all(list.map(async (c) => {
        const id = c.case_number;
        try {
          const [caseRes, crossRes, briefRes] = await Promise.all([
            axios.get(`/api/v1/cases/${id}`),
            axios.get(`/api/v1/cases/${id}/cross-links`),
            axios.get(`/api/v1/cases/${id}/brief`),
          ]);
          const entities = caseRes.data?.data?.graph_entities || [];
          const edges = caseRes.data?.data?.graph_relations || [];
          next[id] = {
            entities: entities.length,
            relationships: edges.length,
            crossCase: (crossRes.data?.data?.links || []).length,
            leads: (briefRes.data?.data?.ai_suggested_leads || []).length,
            evidence: Math.max(1, Math.ceil(edges.length / 2)),
          };
        } catch {
          next[id] = { entities: 0, relationships: 0, crossCase: 0, leads: 0, evidence: 0 };
        }
      }));
      if (!cancelled) {
        setStats(next);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [casesList]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', color: '#F1EBDD' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <FolderOpen color="#D9AA3D" size={22} /> Case Dossiers
      </h2>
      <p style={{ fontSize: '0.8rem', color: '#A6B0AA', marginBottom: '1.25rem' }}>
        Select a case to set investigation context. All subsequent tools operate on that case.
      </p>

      {loading && <div style={{ color: '#A6B0AA' }}>Loading case intelligence…</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
        {(casesList.length ? casesList : []).map((c) => {
          const s = stats[c.case_number] || {};
          const active = selectedCase === c.case_number;
          return (
            <div
              key={c.case_number}
              className="forensic-panel"
              style={{
                padding: '1.15rem',
                border: active ? '1px solid #D62828' : '1px solid var(--border-color)',
                boxShadow: active ? '0 0 20px rgba(214,40,40,0.25)' : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#D9AA3D', fontWeight: 800 }}>CASE {c.case_number}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: 4, lineHeight: 1.3 }}>{c.title}</div>
                </div>
                <span className={`badge ${c.priority === 'CRITICAL' ? 'badge-danger' : 'badge-gold'}`}>
                  {(c.status || 'ACTIVE').replace(/_/g, ' ')}
                </span>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#A6B0AA', marginTop: 10, lineHeight: 1.55 }}>
                <div><strong>Crime:</strong> {c.crime_category}</div>
                <div><strong>Location:</strong> {c.jurisdiction}</div>
                <div><strong>Date:</strong> {c.incident_date ? new Date(c.incident_date).toLocaleDateString() : '—'}</div>
                <div><strong>Investigator:</strong> Crime Branch (assigned)</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 12 }}>
                <Mini icon={<Users size={12} />} label="Entities" value={s.entities ?? '—'} />
                <Mini icon={<GitBranch size={12} />} label="Links" value={s.relationships ?? '—'} />
                <Mini icon={<AlertTriangle size={12} />} label="Leads" value={s.leads ?? '—'} />
                <Mini icon={<FileText size={12} />} label="Evidence" value={s.evidence ?? '—'} />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', flex: 1, justifyContent: 'center' }}
                  onClick={() => setSelectedCase(c.case_number)}
                >
                  Set Active
                </button>
                <button
                  type="button"
                  className="btn-red"
                  style={{ fontSize: '0.75rem', flex: 1, justifyContent: 'center' }}
                  onClick={() => openCase(c.case_number)}
                >
                  Investigate <ArrowRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ icon, label, value }) {
  return (
    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '0.4rem' }}>
      <div style={{ color: '#D9AA3D', display: 'flex', justifyContent: 'center', marginBottom: 2 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{value}</div>
      <div style={{ fontSize: '0.6rem', color: '#6C7A73', fontWeight: 700 }}>{label}</div>
    </div>
  );
}
