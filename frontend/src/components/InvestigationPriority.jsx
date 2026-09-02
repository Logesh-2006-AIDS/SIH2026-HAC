import React, { useEffect, useState } from 'react';
import { BarChart3, Info, RefreshCw, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function InvestigationPriority() {
  const [entities, setEntities] = useState([]);
  const [priorities, setPriorities] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState(null);

  useEffect(() => {
    // Fetch all person entities from graph
    setLoading(true);
    axios.get('/api/v1/graph/centrality').then(res => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        setEntities(res.data.data);
        // Fetch priority for top entities
        const topEntities = res.data.data.slice(0, 8);
        Promise.all(
          topEntities.map(e =>
            axios.get(`/api/v1/graph/entity/${e.entity_id}/priority`)
              .then(r => ({ id: e.entity_id, data: r.data?.data }))
              .catch(() => ({ id: e.entity_id, data: null }))
          )
        ).then(results => {
          const map = {};
          results.forEach(r => { if (r.data) map[r.id] = r.data; });
          setPriorities(map);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setPriorities({});
    setEntities([]);
    axios.get('/api/v1/graph/centrality').then(res => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        setEntities(res.data.data);
        const topEntities = res.data.data.slice(0, 8);
        Promise.all(
          topEntities.map(e =>
            axios.get(`/api/v1/graph/entity/${e.entity_id}/priority`)
              .then(r => ({ id: e.entity_id, data: r.data?.data }))
              .catch(() => ({ id: e.entity_id, data: null }))
          )
        ).then(results => {
          const map = {};
          results.forEach(r => { if (r.data) map[r.id] = r.data; });
          setPriorities(map);
          setLoading(false);
        });
      }
    }).catch(() => setLoading(false));
  };

  return (
    <div className="animate-fade-in" style={{ flex: 1, height: '100%', padding: '1.75rem', overflowY: 'auto', background: 'transparent', color: '#F1EBDD' }}>
      {/* Header */}
      <div className="forensic-panel" style={{ padding: '1.35rem 1.75rem', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(217, 170, 61, 0.18)', color: '#D9AA3D', border: '1px solid rgba(217, 170, 61, 0.3)', boxShadow: '0 0 12px rgba(217, 170, 61, 0.2)' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Investigation Priority & Centrality Ranks</h2>
            <p style={{ fontSize: '0.8rem', color: '#A6B0AA', margin: 0 }}>Priority ranking calculated from graph centrality, cross-case links & evidence density</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="badge badge-gold">
            <Info size={14} /> Graph Centrality Metric
          </div>
          <button onClick={handleRefresh} className="btn-primary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Ranks
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#A6B0AA', fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
          <div className="animate-spin" style={{ width: 22, height: 22, border: '3px solid rgba(217,170,61,0.3)', borderTopColor: '#D9AA3D', borderRadius: '50%' }} />
          Calculating graph centrality & priority ranks...
        </div>
      ) : entities.length === 0 ? (
        <div className="forensic-panel" style={{ textAlign: 'center', padding: '4rem', color: '#6C7A73' }}>
          <AlertTriangle size={28} style={{ marginBottom: '0.6rem' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1EBDD' }}>No entities with cross-case links discovered</div>
          <div style={{ fontSize: '0.8rem', color: '#A6B0AA', marginTop: '0.2rem' }}>Upload case data to calculate network priority scores.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
          {entities.map((entity, rankIdx) => {
            const priority = priorities[entity.entity_id];
            return (
              <div key={entity.entity_id} className="forensic-panel glass-panel-interactive animate-slide-up" style={{
                padding: '1.35rem',
                borderColor: selectedEntity === entity.entity_id ? '#D9AA3D' : undefined,
                cursor: 'pointer',
              }} onClick={() => setSelectedEntity(selectedEntity === entity.entity_id ? null : entity.entity_id)}>
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 150px', gap: '1.75rem', alignItems: 'center' }}>
                  {/* Identity */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'rgba(217, 170, 61, 0.2)', color: '#D9AA3D' }}>
                        #{rankIdx + 1} RANK
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#A6B0AA', textTransform: 'uppercase' }}>Person</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.2rem 0', color: '#F1EBDD' }}>{entity.name}</h3>
                    <div style={{ fontSize: '0.78rem', color: '#A6B0AA' }}>
                      ID: {entity.entity_id} | Cases: {(entity.cases || []).join(', ')}
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  {priority ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <PriorityBar label="Network Connectivity" score={priority.breakdown.network_connectivity.score} max={priority.breakdown.network_connectivity.max} color="#D9AA3D" detail={priority.breakdown.network_connectivity.detail} />
                      <PriorityBar label="Cross-Case Associations" score={priority.breakdown.cross_case_associations.score} max={priority.breakdown.cross_case_associations.max} color="#D62828" detail={priority.breakdown.cross_case_associations.detail} />
                      <PriorityBar label="Communication Activity" score={priority.breakdown.communication_activity.score} max={priority.breakdown.communication_activity.max} color="#5E9F68" detail={priority.breakdown.communication_activity.detail} />
                      <PriorityBar label="Financial Activity" score={priority.breakdown.financial_activity.score} max={priority.breakdown.financial_activity.max} color="#E8D9A8" detail={priority.breakdown.financial_activity.detail} />
                      <PriorityBar label="Evidence Density" score={priority.breakdown.evidence_density.score} max={priority.breakdown.evidence_density.max} color="#D99A32" detail={priority.breakdown.evidence_density.detail} />
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#A6B0AA' }}>
                      Cross-case degree: {entity.cross_case_degree || 0} connected cases
                    </div>
                  )}

                  {/* Score */}
                  <div style={{ textAlign: 'center', background: 'rgba(8, 10, 9, 0.7)', padding: '0.95rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                    {priority ? (
                      <>
                        <div style={{ fontSize: '1.9rem', fontWeight: 800, color: priority.total_score >= 75 ? '#C92A2A' : priority.total_score >= 50 ? '#D9AA3D' : '#A6B0AA', lineHeight: 1 }}>
                          {priority.total_score}<span style={{ fontSize: '0.9rem', color: '#A6B0AA' }}>/100</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: priority.level === 'CRITICAL' ? '#C92A2A' : priority.level === 'HIGH' ? '#D9AA3D' : '#A6B0AA', marginTop: '0.35rem', letterSpacing: '0.04em' }}>
                          {priority.level} PRIORITY
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.84rem', color: '#A6B0AA' }}>Calculating...</div>
                    )}
                  </div>
                </div>

                {/* Expanded disclaimer */}
                {selectedEntity === entity.entity_id && priority && (
                  <div style={{ marginTop: '1.1rem', paddingTop: '1.1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: '#A6B0AA', fontStyle: 'italic', lineHeight: 1.5 }}>
                    {priority.disclaimer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PriorityBar({ label, score, max, color, detail }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#F1EBDD', marginBottom: '0.2rem' }}>
        <span>{label}</span>
        <span><strong>{score}</strong>/{max} — {detail}</span>
      </div>
      <div style={{ width: '100%', height: '6px', background: 'rgba(8, 10, 9, 0.7)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
  );
}
