import React, { useState, useEffect } from 'react';
import { GitBranch, Info, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import axios from 'axios';

export default function CrossCasePanel({ onFocusEntity }) {
  const [crossCaseEntities, setCrossCaseEntities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/v1/graph/centrality').then(res => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        setCrossCaseEntities(res.data.data);
      }
    }).catch(err => console.error('Failed to load cross-case entities:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ flex: 1, height: '100%', padding: '1.5rem', overflowY: 'auto', background: 'var(--bg-primary)', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <GitBranch size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Cross-Case Intelligence</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Entities appearing in multiple distinct investigations</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.75rem', color: '#34d399' }}>
          <Info size={14} /> Evidence-Grounded Graph Analytics
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading cross-case intelligence from graph...</div>
      ) : crossCaseEntities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
          <div>No cross-case entities found. Upload more case data to discover connections.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {crossCaseEntities.map((entity, idx) => (
            <div key={idx} style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Bridge Entity</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: '0.2rem 0' }}>{entity.name}</h3>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>ID: {entity.entity_id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{entity.cross_case_degree}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>Connected Cases</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>Appears In:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(entity.cases || []).map((c, cIdx) => (
                    <span key={cIdx} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'var(--bg-primary)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      Case {c}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Calculated via Betweenness Centrality</div>
                {onFocusEntity && (
                  <button onClick={() => onFocusEntity(entity.entity_id)} style={{ padding: '0.4rem 0.85rem', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    View in Graph <ExternalLink size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
