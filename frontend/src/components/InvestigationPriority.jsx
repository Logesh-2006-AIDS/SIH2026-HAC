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
    <div style={{ flex: 1, height: '100%', padding: '1.5rem', overflowY: 'auto', background: 'var(--bg-primary)', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Investigation Priority</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Priority ranking calculated from graph centrality, cross-case links & evidence density</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.75rem', color: '#fbbf24' }}>
            <Info size={14} /> Does not determine guilt
          </div>
          <button onClick={handleRefresh} className="btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading investigation priorities from graph analytics...</div>
      ) : entities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
          <div>No entities with cross-case connections found. Upload investigation data to populate the graph.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {entities.map((entity) => {
            const priority = priorities[entity.entity_id];
            return (
              <div key={entity.entity_id} style={{
                padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)',
                border: selectedEntity === entity.entity_id ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-color)',
                cursor: 'pointer', transition: 'all 0.15s ease'
              }} onClick={() => setSelectedEntity(selectedEntity === entity.entity_id ? null : entity.entity_id)}>
                <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 140px', gap: '1.5rem', alignItems: 'center' }}>
                  {/* Identity */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase' }}>Person</div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.2rem 0', color: '#f8fafc' }}>{entity.name}</h3>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      ID: {entity.entity_id} | Cases: {(entity.cases || []).join(', ')}
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  {priority ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <PriorityBar label="Network Connectivity" score={priority.breakdown.network_connectivity.score} max={priority.breakdown.network_connectivity.max} color="#6366f1" detail={priority.breakdown.network_connectivity.detail} />
                      <PriorityBar label="Cross-Case Associations" score={priority.breakdown.cross_case_associations.score} max={priority.breakdown.cross_case_associations.max} color="#8b5cf6" detail={priority.breakdown.cross_case_associations.detail} />
                      <PriorityBar label="Communication Activity" score={priority.breakdown.communication_activity.score} max={priority.breakdown.communication_activity.max} color="#06b6d4" detail={priority.breakdown.communication_activity.detail} />
                      <PriorityBar label="Financial Activity" score={priority.breakdown.financial_activity.score} max={priority.breakdown.financial_activity.max} color="#f59e0b" detail={priority.breakdown.financial_activity.detail} />
                      <PriorityBar label="Evidence Density" score={priority.breakdown.evidence_density.score} max={priority.breakdown.evidence_density.max} color="#10b981" detail={priority.breakdown.evidence_density.detail} />
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Cross-case degree: {entity.cross_case_degree || 0} cases
                    </div>
                  )}

                  {/* Score */}
                  <div style={{ textAlign: 'center', background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    {priority ? (
                      <>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: priority.total_score >= 75 ? '#ef4444' : priority.total_score >= 50 ? '#f59e0b' : '#94a3b8' }}>
                          {priority.total_score}<span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/100</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: priority.level === 'CRITICAL' ? '#f87171' : priority.level === 'HIGH' ? '#fbbf24' : '#94a3b8', marginTop: '0.2rem' }}>
                          {priority.level} PRIORITY
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Calculating...</div>
                    )}
                  </div>
                </div>

                {/* Expanded disclaimer */}
                {selectedEntity === entity.entity_id && priority && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', color: '#cbd5e1', marginBottom: '0.15rem' }}>
        <span>{label}</span>
        <span><strong>{score}</strong>/{max} — {detail}</span>
      </div>
      <div style={{ width: '100%', height: '5px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}
