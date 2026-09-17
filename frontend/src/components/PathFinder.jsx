import React, { useState } from 'react';
import { Search, ArrowDown, Sparkles, ExternalLink, ChevronRight, FileText } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { findShortestPath, getAllEntities, getEntityById } from '../data/mockService.js';

const ENTITY_OPTIONS = getAllEntities().map(e => ({
  id: e.id,
  label: e.name || e.number || e.account_number || e.reg_number || e.id,
  type: e.entityType,
}));

const TYPE_COLORS = {
  Person: '#D9AA3D', Phone: '#38bdf8', Organization: '#5E9F68',
  FinancialAccount: '#34D399', Vehicle: '#94A3B8', Location: '#D62828',
};

function HopStep({ hop, index, total, onClick, selected }) {
  const srcEnt = getEntityById(hop.from_id);
  const tgtEnt = getEntityById(hop.to_id);
  const srcColor = TYPE_COLORS[srcEnt?.entityType] || '#D9AA3D';
  const tgtColor = TYPE_COLORS[tgtEnt?.entityType] || '#D9AA3D';
  const isLast = index === total - 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Source node (only show for first hop) */}
      {index === 0 && (
        <button
          onClick={() => onClick(hop.from_id)}
          style={{
            padding: '0.6rem 1.1rem', borderRadius: 10, border: `2px solid ${srcColor}`,
            background: selected === hop.from_id ? `${srcColor}22` : 'rgba(20,23,21,0.9)',
            color: srcColor, fontWeight: 800, fontSize: '0.86rem', cursor: 'pointer',
            transition: 'all 0.2s ease', marginBottom: 6,
          }}
        >
          {hop.from_name}
          <div style={{ fontSize: '0.62rem', color: '#6C7A73', fontWeight: 600, marginTop: 2 }}>{srcEnt?.entityType}</div>
        </button>
      )}

      {/* Relationship arrow */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, margin: '4px 0' }}>
        <div style={{ width: 2, height: 20, background: 'rgba(214,40,40,0.5)' }} />
        <div style={{
          padding: '0.2rem 0.7rem', borderRadius: 12, background: 'rgba(214,40,40,0.12)',
          border: '1px solid rgba(214,40,40,0.3)', color: '#fca5a5', fontSize: '0.65rem', fontWeight: 800,
          whiteSpace: 'nowrap',
        }}>
          {hop.relationship.replace(/_/g, ' ')}
        </div>
        <div style={{ width: 2, height: 12, background: 'rgba(214,40,40,0.5)' }} />
        <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '8px solid rgba(214,40,40,0.7)' }} />
      </div>

      {/* Target node */}
      <button
        onClick={() => onClick(hop.to_id)}
        style={{
          padding: '0.6rem 1.1rem', borderRadius: 10, border: `2px solid ${tgtColor}`,
          background: selected === hop.to_id ? `${tgtColor}22` : 'rgba(20,23,21,0.9)',
          color: tgtColor, fontWeight: 800, fontSize: '0.86rem', cursor: 'pointer',
          transition: 'all 0.2s ease', marginTop: 4,
        }}
      >
        {hop.to_name}
        <div style={{ fontSize: '0.62rem', color: '#6C7A73', fontWeight: 600, marginTop: 2 }}>{tgtEnt?.entityType}</div>
      </button>
    </div>
  );
}

export default function PathFinder() {
  const { focusEntityById, selectedCase, setActiveTab, highlightedPath, handleFindPath } = useInvestigation();
  const [sourceId, setSourceId] = useState('PERSON-001');
  const [targetId, setTargetId] = useState('ORG-001');
  const [pathResult, setPathResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedHopNode, setSelectedHopNode] = useState(null);
  const [selectedHopData, setSelectedHopData] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleFind = async () => {
    if (!sourceId || !targetId) return;
    setLoading(true);
    setPathResult(null);
    setShowExplanation(false);
    setSelectedHopNode(null);
    setSelectedHopData(null);
    try {
      const res = await findShortestPath(sourceId, targetId);
      setPathResult(res.data);
      // Also highlight on graph
      if (res.success && res.data?.path?.length) {
        handleFindPath(sourceId, targetId);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (nodeId, hop) => {
    setSelectedHopNode(nodeId);
    setSelectedHopData(hop);
    focusEntityById(nodeId, false);
  };

  const sourceEntity = getEntityById(sourceId);
  const targetEntity = getEntityById(targetId);

  return (
    <div className="animate-fade-in" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#F1EBDD' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(16,19,17,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: '0.5rem', borderRadius: 10, background: 'rgba(214,40,40,0.12)', color: '#D62828', border: '1px solid rgba(214,40,40,0.3)' }}>
            <Search size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Path Finder</h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#A6B0AA' }}>Discover the shortest investigative connection between any two entities</p>
          </div>
        </div>
        <button onClick={() => setActiveTab('network')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
          View on Graph <ExternalLink size={12} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: controls + path visualization */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Entity selectors */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(8,10,9,0.6)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: '0.68rem', color: '#6C7A73', fontWeight: 800, display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>Source Entity</label>
                <select
                  value={sourceId}
                  onChange={e => setSourceId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid rgba(217,170,61,0.4)', background: 'rgba(8,10,9,0.8)', color: '#F1EBDD', fontSize: '0.84rem', outline: 'none' }}
                >
                  {ENTITY_OPTIONS.map(e => (
                    <option key={e.id} value={e.id}>[{e.type}] {e.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: '0.68rem', color: '#6C7A73', fontWeight: 800, display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>Target Entity</label>
                <select
                  value={targetId}
                  onChange={e => setTargetId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid rgba(214,40,40,0.4)', background: 'rgba(8,10,9,0.8)', color: '#F1EBDD', fontSize: '0.84rem', outline: 'none' }}
                >
                  {ENTITY_OPTIONS.filter(e => e.id !== sourceId).map(e => (
                    <option key={e.id} value={e.id}>[{e.type}] {e.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleFind}
                disabled={loading || !sourceId || !targetId || sourceId === targetId}
                className="btn-primary"
                style={{ padding: '0.65rem 1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {loading ? <><Sparkles size={15} className="animate-spin" /> Finding...</> : <><Search size={15} /> Find Connection</>}
              </button>
            </div>

            {/* Quick presets */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#6C7A73', fontWeight: 700 }}>QUICK PATHS:</span>
              {[
                { label: 'Ravi → CCE Ltd', src: 'PERSON-001', tgt: 'ORG-001' },
                { label: 'Ravi → Hawala Exchange', src: 'PERSON-001', tgt: 'ORG-002' },
                { label: 'Ravi → Account-319', src: 'PERSON-001', tgt: 'ACC-002' },
                { label: 'Ravi → Meena', src: 'PERSON-001', tgt: 'PERSON-003' },
              ].map(preset => (
                <button key={preset.label} onClick={() => { setSourceId(preset.src); setTargetId(preset.tgt); }} style={{
                  padding: '0.2rem 0.6rem', borderRadius: 12, border: '1px solid var(--border-color)', background: 'transparent', color: '#A6B0AA', fontSize: '0.68rem', cursor: 'pointer',
                }}>{preset.label}</button>
              ))}
            </div>
          </div>

          {/* Path visualization */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {!pathResult && !loading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6C7A73' }}>
                <Search size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#A6B0AA', marginBottom: 4 }}>Select two entities and click "Find Connection"</div>
                <div style={{ fontSize: '0.8rem' }}>The system will discover the shortest investigative path using CDR, financial, and FIR evidence.</div>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#D9AA3D' }}>
                <Sparkles size={36} className="animate-spin" style={{ marginBottom: '1rem' }} />
                <div style={{ fontWeight: 700 }}>Tracing investigation path...</div>
                <div style={{ fontSize: '0.78rem', color: '#6C7A73', marginTop: 4 }}>Analyzing CDR, financial, and FIR evidence chains</div>
              </div>
            )}

            {pathResult && !loading && (
              <div className="animate-fade-in" style={{ width: '100%', maxWidth: 480 }}>
                {pathResult.path?.length > 0 ? (
                  <>
                    {/* Path chain */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginBottom: '1.5rem' }}>
                      {pathResult.hops?.map((hop, i) => (
                        <HopStep
                          key={i}
                          hop={hop}
                          index={i}
                          total={pathResult.hops.length}
                          onClick={(nodeId) => handleNodeClick(nodeId, hop)}
                          selected={selectedHopNode}
                        />
                      ))}
                    </div>

                    {/* Path summary */}
                    <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(214,40,40,0.08)', border: '1px solid rgba(214,40,40,0.25)', textAlign: 'center', marginBottom: '1rem' }}>
                      <span style={{ color: '#fca5a5', fontWeight: 700, fontSize: '0.82rem' }}>
                        {pathResult.hop_count} hop{pathResult.hop_count !== 1 ? 's' : ''} — path confirmed by investigation evidence
                      </span>
                    </div>

                    {/* Explain this path */}
                    <button
                      onClick={() => setShowExplanation(!showExplanation)}
                      className="btn-primary"
                      style={{ width: '100%', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: '0.75rem' }}
                    >
                      <Sparkles size={14} /> {showExplanation ? 'Hide Explanation' : 'Explain This Path'}
                    </button>

                    {showExplanation && (
                      <div className="animate-slide-up forensic-panel" style={{ padding: '1rem', lineHeight: 1.7 }}>
                        <div style={{ fontSize: '0.68rem', color: '#D9AA3D', fontWeight: 800, marginBottom: 6 }}>AI-GENERATED PATH EXPLANATION</div>
                        <div style={{ fontSize: '0.82rem', color: '#F1EBDD' }}>{pathResult.explanation}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#A6B0AA' }}>
                    {pathResult.explanation || 'No path found between these entities in the current investigation dataset.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: hop detail panel */}
        <div style={{ width: 300, borderLeft: '1px solid var(--border-color)', overflowY: 'auto', background: 'rgba(8,10,9,0.5)' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: '#6C7A73', fontWeight: 800 }}>HOP DETAIL</div>
          </div>

          {selectedHopData ? (
            <div className="animate-fade-in" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#6C7A73', fontWeight: 700, marginBottom: 3 }}>RELATIONSHIP</div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#D62828' }}>{selectedHopData.relationship.replace(/_/g, ' ')}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#6C7A73', fontWeight: 700, marginBottom: 3 }}>EVIDENCE</div>
                <div style={{ fontSize: '0.78rem', color: '#F1EBDD', lineHeight: 1.6, padding: '0.5rem', borderRadius: 6, background: 'rgba(217,170,61,0.06)', border: '1px solid rgba(217,170,61,0.15)' }}>
                  {selectedHopData.evidence}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#6C7A73', fontWeight: 700, marginBottom: 3 }}>SOURCE CASE</div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#D9AA3D' }}>{selectedHopData.case_ref}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#6C7A73', fontWeight: 700, marginBottom: 3 }}>TIMESTAMP</div>
                <div style={{ fontSize: '0.78rem' }}>{selectedHopData.timestamp}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#6C7A73', fontWeight: 700, marginBottom: 3 }}>CONFIDENCE</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ width: `${Math.round(selectedHopData.confidence * 100)}%`, height: '100%', background: '#5E9F68', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontWeight: 800, color: '#5E9F68', fontSize: '0.78rem' }}>{Math.round(selectedHopData.confidence * 100)}%</span>
                </div>
              </div>
              <button onClick={() => focusEntityById(selectedHopNode, true)} className="btn-red" style={{ fontSize: '0.72rem', width: '100%', justifyContent: 'center' }}>
                <ExternalLink size={11} /> View on Graph
              </button>
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6C7A73', fontSize: '0.78rem' }}>
              Click a node in the path to see evidence details for that connection.
            </div>
          )}

          {/* All hops summary */}
          {pathResult?.hops?.length > 0 && (
            <div style={{ padding: '0 1rem 1rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#6C7A73', fontWeight: 700, margin: '0.75rem 0 0.5rem' }}>ALL HOPS</div>
              {pathResult.hops.map((hop, i) => (
                <div
                  key={i}
                  onClick={() => handleNodeClick(hop.to_id, hop)}
                  style={{
                    padding: '0.5rem 0.6rem', borderRadius: 6, marginBottom: 4, cursor: 'pointer',
                    background: selectedHopNode === hop.to_id ? 'rgba(214,40,40,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedHopNode === hop.to_id ? 'rgba(214,40,40,0.3)' : 'var(--border-color)'}`,
                    fontSize: '0.72rem',
                  }}
                >
                  <span style={{ color: '#A6B0AA' }}>{hop.from_name}</span>
                  <span style={{ color: '#fca5a5', margin: '0 4px' }}>→</span>
                  <span style={{ color: '#F1EBDD', fontWeight: 700 }}>{hop.to_name}</span>
                  <div style={{ color: '#6C7A73', fontSize: '0.62rem', marginTop: 2 }}>{hop.relationship}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
