import React, { useEffect, useState } from 'react';
import { GitBranch, ExternalLink } from 'lucide-react';
import axios from 'axios';

export default function CrossCasePanel({ onFocusEntity, selectedCase = '103' }) {
  const [links, setLinks] = useState([]);
  const [globalBridges, setGlobalBridges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`/api/v1/cases/${selectedCase}/cross-links`),
      axios.get('/api/v1/graph/centrality'),
    ]).then(([crossRes, centRes]) => {
      if (crossRes.data?.success) setLinks(crossRes.data.data.links || []);
      if (centRes.data?.success) setGlobalBridges(centRes.data.data || []);
    }).finally(() => setLoading(false));
  }, [selectedCase]);

  const pairs = {};
  links.forEach((link) => {
    (link.shared_cases || []).forEach((otherCase) => {
      const key = [selectedCase, otherCase].sort().join('-');
      if (!pairs[key]) pairs[key] = { caseA: selectedCase, caseB: otherCase, shared: [] };
      pairs[key].shared.push(link);
    });
  });

  if (loading) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A6B0AA' }}>Loading cross-case intelligence...</div>;
  }

  return (
    <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', color: '#F1EBDD' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
        <GitBranch color="#D62828" /> Cross-Case Intelligence — Case {selectedCase}
      </h2>

      {Object.values(pairs).length === 0 ? (
        <div className="forensic-panel" style={{ padding: '2rem', textAlign: 'center', color: '#A6B0AA' }}>
          No cross-case links detected for Case {selectedCase}.
        </div>
      ) : (
        Object.values(pairs).map((pair) => (
          <div key={`${pair.caseA}-${pair.caseB}`} className="forensic-panel" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#D9AA3D', marginBottom: 10 }}>
              CASE {pair.caseA} ↔ CASE {pair.caseB}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#A6B0AA', marginBottom: 12 }}>{pair.shared.length} shared entities</div>
            {pair.shared.map((link) => (
              <div key={link.entity_id} className="evidence-card" style={{ padding: '0.85rem', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#24251F' }}>{link.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#54564B' }}>{link.type} · appears in {link.total_cases} cases</div>
                </div>
                {onFocusEntity && (
                  <button type="button" className="btn-red" style={{ fontSize: '0.72rem' }} onClick={() => onFocusEntity(link.entity_id)}>
                    View on Graph <ExternalLink size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))
      )}

      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#D9AA3D', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Network Bridge Entities</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
        {globalBridges.slice(0, 6).map((e) => (
          <div key={e.entity_id} className="forensic-panel" style={{ padding: '0.85rem' }}>
            <div style={{ fontWeight: 800 }}>{e.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#A6B0AA' }}>Cases: {(e.cases || []).join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
