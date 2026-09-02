import React, { useState, useEffect } from 'react';
import { GitBranch, Info, AlertTriangle, ExternalLink } from 'lucide-react';
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
    <div className="animate-fade-in" style={{ flex: 1, height: '100%', padding: '1.75rem', overflowY: 'auto', background: 'transparent', color: '#F1EBDD' }}>
      {/* Header Banner */}
      <div className="forensic-panel" style={{ padding: '1.35rem 1.75rem', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(214, 40, 40, 0.18)', color: '#D62828', border: '1px solid rgba(214, 40, 40, 0.3)', boxShadow: '0 0 12px rgba(214, 40, 40, 0.2)' }}>
            <GitBranch size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Cross-Case Red String Connections</h2>
            <p style={{ fontSize: '0.8rem', color: '#A6B0AA', margin: 0 }}>Key syndicate bridge entities appearing across multiple independent criminal cases</p>
          </div>
        </div>
        <div className="badge badge-gold">
          <Info size={14} /> Neo4j Graph Analytics
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#A6B0AA', fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
          <div className="animate-spin" style={{ width: 22, height: 22, border: '3px solid rgba(217,170,61,0.3)', borderTopColor: '#D9AA3D', borderRadius: '50%' }} />
          Loading cross-case intelligence from graph...
        </div>
      ) : crossCaseEntities.length === 0 ? (
        <div className="forensic-panel" style={{ textAlign: 'center', padding: '4rem', color: '#6C7A73' }}>
          <AlertTriangle size={28} style={{ marginBottom: '0.6rem' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1EBDD' }}>No cross-case entities found</div>
          <div style={{ fontSize: '0.8rem', color: '#A6B0AA', marginTop: '0.2rem' }}>Upload additional case files to discover network connections.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.35rem' }}>
          {crossCaseEntities.map((entity, idx) => (
            <div key={idx} className="evidence-card animate-slide-up" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', position: 'relative' }}>
              <div className="pin-detail pin-detail-red" style={{ top: '-7px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D62828', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Syndicate Bridge Entity</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#24251F', margin: '0.2rem 0' }}>{entity.name}</h3>
                  <div style={{ fontSize: '0.78rem', color: '#54564B', fontWeight: 600 }}>ID: {entity.entity_id}</div>
                </div>
                <div style={{ textAlign: 'right', background: 'rgba(214, 40, 40, 0.12)', padding: '0.5rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(214, 40, 40, 0.3)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D62828', lineHeight: 1 }}>{entity.cross_case_degree}</div>
                  <div style={{ fontSize: '0.68rem', color: '#800', marginTop: '0.2rem', fontWeight: 700 }}>Cases</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#24251F', marginBottom: '0.5rem' }}>Shared Case Dossiers:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {(entity.cases || []).map((c, cIdx) => (
                    <span key={cIdx} className="badge badge-red" style={{ fontSize: '0.74rem' }}>
                      Case {c}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.74rem', color: '#54564B', fontWeight: 600 }}>Betweenness Centrality Metric</div>
                {onFocusEntity && (
                  <button onClick={() => onFocusEntity(entity.entity_id)} className="btn-red" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', gap: '0.35rem' }}>
                    View Pin in Graph <ExternalLink size={12} />
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
