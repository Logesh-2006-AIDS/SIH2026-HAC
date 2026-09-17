import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, GitBranch, MapPin, Network, Sparkles, 
  BarChart3, FileText, ExternalLink, ShieldAlert, ArrowRight, 
  Layers, Users, Share2, Compass, CheckCircle2, Download
} from 'lucide-react';
import { getAnalystData, getCrossCaseMatrix, getCentrality } from '../data/mockService.js';
import { useInvestigation } from '../context/InvestigationContext.jsx';

export default function AnalystDashboard() {
  const { setActiveTab, focusEntityById } = useInvestigation();
  const [analystData, setAnalystData] = useState(null);
  const [activeTabSub, setActiveTabSub] = useState('communities');
  const [crossMatrix, setCrossMatrix] = useState([]);
  const [centralityList, setCentralityList] = useState([]);

  useEffect(() => {
    getAnalystData().then(res => { if (res?.data) setAnalystData(res.data); });
    getCrossCaseMatrix().then(res => { if (res?.data) setCrossMatrix(res.data); });
    getCentrality().then(res => { if (res?.data) setCentralityList(res.data); });
  }, []);

  if (!analystData) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D9AA3D' }}>
        Synthesizing Strategic Crime Intelligence & Patterns...
      </div>
    );
  }

  const { crime_trends, community_clusters, bridge_entity_analysis, link_predictions } = analystData;

  const handleExportAnalystReport = () => {
    const report = `# STRATEGIC CRIMINAL INTELLIGENCE & PATTERN REPORT
Classification: CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE
Reporting Agency: Criminal Intelligence & Analytics Wing
Generated At: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

## 1. Executive Intelligence Summary
Cross-case graph analysis of active multi-jurisdiction cases reveals an organized coastal contraband syndicate spanning Chennai Port, T. Nagar Hawala networks, and Coimbatore transit routes. 

## 2. Community & Gang Cluster Analysis (Louvain / Leiden Detection)
${community_clusters.map(c => `### ${c.name} (${c.id})
- Dominant Role: ${c.modus_operandi}
- Leader: ${c.leader}
- Identified Members: ${c.members.join(', ')}
- Associated Cases: ${c.cases.join(', ')}
- Risk Rating: ${c.risk_level}`).join('\n\n')}

## 3. Apex Bridge Entity Intelligence
- Entity: ${bridge_entity_analysis.name} (${bridge_entity_analysis.entity_id})
- Inter-Cluster Centrality: ${bridge_entity_analysis.inter_cluster_centrality}
- Strategic Significance: ${bridge_entity_analysis.explanation}

## 4. Algorithmic Link Predictions (AI-Suggested Potential Ties)
${link_predictions.map(l => `- Potential Link: ${l.entity_a} <-> ${l.entity_b}
  Confidence Score: ${l.predicted_score} (${l.algorithm})
  Evidentiary Ground: ${l.rationale}
  Actionable Recommendation: ${l.suggested_action}`).join('\n\n')}
`;
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Strategic_Crime_Intelligence_Report_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      flex: 1,
      height: '100%',
      overflowY: 'auto',
      padding: '1.75rem',
      background: 'transparent',
      color: '#F1EBDD',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Top Banner - Analyst Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20,28,24,0.98) 0%, rgba(13,18,15,0.98) 100%)',
        border: '1px solid rgba(217,170,61,0.3)',
        borderRadius: '12px',
        padding: '1.25rem 1.75rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(217,170,61,0.18)', color: '#D9AA3D' }}>
              <BarChart3 size={22} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#F1EBDD', letterSpacing: '0.02em' }}>
              ANALYST DASHBOARD — STRATEGIC INTELLIGENCE & PATTERNS
            </h1>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.45)',
              color: '#A5B4FC',
            }}>
              ROLE: STRATEGIC ANALYST
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#A6B0AA' }}>
            Macro-level syndicate analysis: crime trends, community cluster detection, cross-case link prediction, and network centrality.
          </p>
        </div>

        {/* Action Button: Export Full Analyst Brief */}
        <button
          onClick={handleExportAnalystReport}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #D9AA3D 0%, #C49830 100%)',
            border: 'none',
            color: '#0B100D',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(217,170,61,0.25)',
          }}
        >
          <Download size={15} /> Export Strategic Intelligence Report
        </button>
      </div>

      {/* Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: '0.75rem',
      }}>
        {[
          { id: 'communities', label: 'Community & Gang Clusters', icon: Users },
          { id: 'predictions', label: 'Algorithmic Link Prediction', icon: Sparkles },
          { id: 'trends', label: 'Crime Trends & Zones', icon: TrendingUp },
          { id: 'centrality', label: 'Network Centrality & Bridges', icon: Network },
          { id: 'crosscase', label: 'Cross-Case Intersections', icon: GitBranch },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTabSub === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabSub(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                background: isActive ? 'rgba(217,170,61,0.2)' : 'rgba(255,255,255,0.03)',
                border: '1px solid',
                borderColor: isActive ? 'rgba(217,170,61,0.5)' : 'rgba(255,255,255,0.08)',
                color: isActive ? '#F1EBDD' : '#A6B0AA',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} color={isActive ? '#D9AA3D' : '#A6B0AA'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: COMMUNITY & GANG CLUSTERS */}
      {activeTabSub === 'communities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Apex Bridge Entity Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(214,40,40,0.15) 0%, rgba(17,24,21,0.95) 100%)',
            border: '1px solid rgba(214,40,40,0.35)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(214,40,40,0.25)', color: '#FF6B6B', border: '1px solid rgba(214,40,40,0.5)' }}>
                  SYNDICATE APEX BRIDGE NODE
                </span>
                <h3 style={{ margin: '0.5rem 0 0.2rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#F1EBDD' }}>
                  {bridge_entity_analysis.name} — Inter-Cluster Centrality: {bridge_entity_analysis.inter_cluster_centrality}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#C5CDC8', maxWidth: '850px', lineHeight: 1.5 }}>
                  {bridge_entity_analysis.explanation}
                </p>
              </div>

              <button
                onClick={() => { focusEntityById('PERSON-001'); setActiveTab('network'); }}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '6px', background: '#D62828',
                  border: 'none', color: '#fff', fontSize: '0.78rem', fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                Inspect Nexus in Graph <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* 3 Community Cluster Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {community_clusters.map((cluster) => (
              <div
                key={cluster.id}
                style={{
                  background: 'rgba(17,24,21,0.85)',
                  border: `1px solid ${cluster.color}40`,
                  borderRadius: '12px',
                  padding: '1.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: cluster.color, background: `${cluster.color}15`, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      {cluster.id} • {cluster.risk_level}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#A6B0AA' }}>{cluster.members_count} Entity Nodes</span>
                  </div>

                  <h3 style={{ margin: '0.3rem 0 0.4rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#F1EBDD' }}>
                    {cluster.name}
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: '#D9AA3D', fontWeight: 700, marginBottom: '0.6rem' }}>
                    Operational Head: {cluster.leader}
                  </div>

                  <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.8rem', color: '#A6B0AA', lineHeight: 1.45 }}>
                    {cluster.modus_operandi}
                  </p>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.65rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#6C7A73', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Key Cluster Entities:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {cluster.members.map((m, i) => (
                        <span key={i} style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#F1EBDD' }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#6C7A73' }}>Cases: {cluster.cases.join(', ')}</span>
                  <button
                    onClick={() => setActiveTab('network')}
                    style={{ background: 'transparent', border: 'none', color: cluster.color, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    View Cluster Graph <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ALGORITHMIC LINK PREDICTION */}
      {activeTabSub === 'predictions' && (
        <div style={{ background: 'rgba(17,24,21,0.85)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F1EBDD' }}>
              Predictive Link Analysis (Topology & Co-occurrence Heuristics)
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#A6B0AA' }}>
              Algorithmic scoring identifies high-probability covert connections between entities based on Adamic-Adar, Jaccard Similarity, and multi-hop transaction layering.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {link_predictions.map((pred, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(217,170,61,0.25)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(99,102,241,0.2)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.4)' }}>
                        {pred.status.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#6C7A73' }}>Algorithm: {pred.algorithm}</span>
                    </div>

                    <h4 style={{ margin: '0.2rem 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#F1EBDD' }}>
                      {pred.entity_a} <span style={{ color: '#D9AA3D' }}>⟷</span> {pred.entity_b}
                    </h4>

                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: '#C5CDC8', lineHeight: 1.45 }}>
                      <strong>Evidentiary Rationale:</strong> {pred.rationale}
                    </p>

                    <div style={{ fontSize: '0.78rem', color: '#4ADE80', background: 'rgba(94,159,104,0.12)', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(94,159,104,0.25)' }}>
                      <strong>Investigative Recommendation:</strong> {pred.suggested_action}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '110px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#6C7A73' }}>Predicted Confidence</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#D9AA3D' }}>{pred.predicted_score}</div>
                    <button
                      onClick={() => { focusEntityById('PERSON-001'); setActiveTab('network'); }}
                      style={{
                        marginTop: '0.5rem', padding: '0.35rem 0.75rem', borderRadius: '6px',
                        background: 'rgba(217,170,61,0.15)', border: '1px solid rgba(217,170,61,0.4)',
                        color: '#D9AA3D', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Trace in Graph
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CRIME TRENDS & HOTSPOTS */}
      {activeTabSub === 'trends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Trend Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {crime_trends.growth_patterns.map((pat, i) => (
              <div key={i} style={{ background: 'rgba(17,24,21,0.85)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6C7A73', textTransform: 'uppercase' }}>{pat.type} MODUS</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: pat.type === 'RISING' ? '#FF6B6B' : '#4ADE80' }}>
                    {pat.trend}
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#F1EBDD', marginBottom: '0.4rem' }}>{pat.category}</div>
                <div style={{ fontSize: '0.75rem', color: '#A6B0AA' }}>{pat.reason}</div>
              </div>
            ))}
          </div>

          {/* Repeated Crime Zones & Hotspots */}
          <div style={{ background: 'rgba(17,24,21,0.85)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#D9AA3D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} /> Persistent Geographical Crime Hotspots
              </h3>
              <button
                onClick={() => setActiveTab('map')}
                style={{
                  background: 'transparent', border: '1px solid rgba(217,170,61,0.4)',
                  color: '#D9AA3D', padding: '0.35rem 0.75rem', borderRadius: '6px',
                  fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                }}
              >
                Open Full Crime Map <ArrowRight size={12} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {crime_trends.repeated_zones.map((zone, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 800, color: '#F1EBDD', fontSize: '0.9rem' }}>{zone.location}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: zone.severity === 'CRITICAL' ? '#FF6B6B' : '#FFA726' }}>
                      {zone.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#D9AA3D', marginBottom: '0.3rem' }}>Linked in {zone.cases} separate case FIRs</div>
                  <div style={{ fontSize: '0.75rem', color: '#A6B0AA' }}>{zone.alert}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CENTRALITY & BRIDGES */}
      {activeTabSub === 'centrality' && (
        <div style={{ background: 'rgba(17,24,21,0.85)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F1EBDD' }}>Network Centrality & Key Entities Ranking</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#A6B0AA' }}>Degree centrality, cross-case connectivity score, and betweenness bottleneck analysis.</p>
            </div>
            <button
              onClick={() => setActiveTab('keyentities')}
              style={{ padding: '0.4rem 0.85rem', background: '#D9AA3D', border: 'none', color: '#0B100D', fontWeight: 800, borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Full Bridge Analytics Table
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {centralityList.slice(0, 5).map((e, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#F1EBDD', fontSize: '0.92rem' }}>{e.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6C7A73' }}>{e.type} • Cases: {(e.cases || []).join(', ')}</div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.68rem', color: '#6C7A73' }}>Bridge Score</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#D9AA3D' }}>{e.bridge_score || '96'}/100</div>
                  </div>
                  <button
                    onClick={() => { focusEntityById(e.entity_id || 'PERSON-001'); setActiveTab('network'); }}
                    style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', background: 'rgba(217,170,61,0.15)', border: '1px solid rgba(217,170,61,0.4)', color: '#D9AA3D', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: CROSS-CASE INTERSECTIONS */}
      {activeTabSub === 'crosscase' && (
        <div style={{ background: 'rgba(17,24,21,0.85)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F1EBDD' }}>Cross-Case Intersection Matrix</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#A6B0AA' }}>Pairwise case analysis revealing multi-case co-conspirators, shared burner phones, and conduit accounts.</p>
            </div>
            <button
              onClick={() => setActiveTab('crosscase')}
              style={{ padding: '0.4rem 0.85rem', background: '#D9AA3D', border: 'none', color: '#0B100D', fontWeight: 800, borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Open Cross-Case Hub
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {crossMatrix.map((mat, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#D9AA3D' }}>{mat.case_a} ↔ {mat.case_b}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(214,40,40,0.2)', color: '#FF6B6B' }}>
                    {mat.strength} LINK ({mat.score})
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: '#6C7A73' }}>Shared Persons: </span>
                    <strong style={{ color: '#F1EBDD' }}>{(mat.shared_persons || []).join(', ')}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6C7A73' }}>Shared Phones: </span>
                    <strong style={{ color: '#4ADE80' }}>{(mat.shared_phones || []).join(', ')}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6C7A73' }}>Shared Accounts: </span>
                    <strong style={{ color: '#818CF8' }}>{(mat.shared_accounts || []).join(', ')}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
