import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GraphCanvas from './components/GraphCanvas';
import GraphControls from './components/GraphControls';
import EntityInspector from './components/EntityInspector';
import CrossCasePanel from './components/CrossCasePanel';
import LeadVerification from './components/LeadVerification';
import { 
  Network, 
  Share2, 
  ShieldAlert, 
  Users, 
  GitBranch, 
  Database,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle2,
  FolderArchive
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Knowledge Graph State
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [selectedCase, setSelectedCase] = useState('');
  const [layoutName, setLayoutName] = useState('cose');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [highlightedPath, setHighlightedPath] = useState([]);
  const [pathMessage, setPathMessage] = useState('');

  // Fetch Subgraph from FastAPI Backend
  const fetchSubgraph = async (caseId = '') => {
    setIsLoadingGraph(true);
    try {
      const url = caseId ? `/api/v1/graph/subgraph?case_id=${caseId}` : '/api/v1/graph/subgraph';
      const res = await axios.get(url);
      if (res.data?.success) {
        setNodes(res.data.data.nodes || []);
        setEdges(res.data.data.edges || []);
      }
    } catch (err) {
      console.error('Failed to fetch subgraph:', err);
    } finally {
      setIsLoadingGraph(false);
    }
  };

  // Find Shortest Path
  const handleFindPath = async (sourceId, targetId) => {
    setIsLoadingGraph(true);
    try {
      const res = await axios.get(`/api/v1/graph/shortest-path?source_id=${sourceId}&target_id=${targetId}`);
      if (res.data?.success && res.data.data.path) {
        setHighlightedPath(res.data.data.path);
        setPathMessage(`Discovered path: ${res.data.data.path.join(' ➔ ')} (Weight: ${res.data.data.weight})`);
      } else {
        setPathMessage('No direct path found between the selected entities.');
      }
    } catch (err) {
      console.error('Shortest path discovery failed:', err);
      setPathMessage('Shortest path calculation failed.');
    } finally {
      setIsLoadingGraph(false);
    }
  };

  // Seed / Re-sync Neo4j
  const handleSeedGraph = async () => {
    setIsLoadingGraph(true);
    try {
      const res = await axios.post('/api/v1/graph/seed');
      if (res.data?.success) {
        await fetchSubgraph(selectedCase);
      }
    } catch (err) {
      console.error('Seed graph failed:', err);
    } finally {
      setIsLoadingGraph(false);
    }
  };

  useEffect(() => {
    fetchSubgraph(selectedCase);
  }, [selectedCase]);

  // Extract persons for the pathfinder dropdown
  const suspectList = nodes
    .filter((n) => n.id && (n.name || n.role || n.id.startsWith('P')))
    .map((n) => ({ id: n.id, name: n.name || n.id }));

  const handleFocusEntity = (entityId) => {
    setActiveTab('dashboard');
    const match = nodes.find((n) => n.id === entityId || n.number === entityId);
    if (match) {
      setSelectedEntity(match);
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="main-viewport">
        <Header />
        
        <main className="content-area">
          {/* TAB 1: GRAPH & NETWORK OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
              {/* Controls bar */}
              <GraphControls
                selectedCase={selectedCase}
                onSelectCase={setSelectedCase}
                layoutName={layoutName}
                onSelectLayout={setLayoutName}
                onFindPath={handleFindPath}
                onSeedGraph={handleSeedGraph}
                onClearPath={() => {
                  setHighlightedPath([]);
                  setPathMessage('');
                }}
                hasActivePath={highlightedPath.length > 0}
                suspects={suspectList}
              />

              {/* Path Notification Alert */}
              {pathMessage && (
                <div
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fbbf24',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Sparkles size={16} />
                  <span>{pathMessage}</span>
                </div>
              )}

              {/* Graph Visualizer + Side Inspector */}
              <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: '520px', height: 'calc(100vh - 210px)' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <GraphCanvas
                    nodes={nodes}
                    edges={edges}
                    selectedEntity={selectedEntity}
                    onSelectEntity={setSelectedEntity}
                    highlightedPath={highlightedPath}
                    layoutName={layoutName}
                    isLoading={isLoadingGraph}
                  />
                </div>

                {/* Side Inspector Drawer */}
                {selectedEntity && (
                  <EntityInspector
                    entity={selectedEntity}
                    onClose={() => setSelectedEntity(null)}
                    onSetAsPathSource={(id) => {
                      // Trigger path finding with a default target
                      handleFindPath(id, 'P004');
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CROSS-CASE INTELLIGENCE */}
          {activeTab === 'crosscase' && (
            <CrossCasePanel onFocusEntity={handleFocusEntity} />
          )}

          {/* TAB 3: LEAD VERIFICATION WORKBENCH */}
          {activeTab === 'verification' && (
            <LeadVerification />
          )}

          {/* TAB 4: CASE MASTER RECORDS */}
          {activeTab === 'cases' && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <FolderArchive size={20} color="#818cf8" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Master Case Dossiers</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {[
                  { id: '101', title: 'Armed Robbery & Extortion Syndicate', date: '15/04/2025', ps: 'Crime Branch, North District, Delhi', suspects: 'Ravi Kumar, Vikram Singh, Meena Sharma' },
                  { id: '102', title: 'Cyber Phishing & Crypto Laundering Ring', date: '28/05/2025', ps: 'Cyber Crime Branch, Delhi Police', suspects: 'Vikram Singh, Aarav Mehta, Sanjay Gupta' },
                  { id: '103', title: 'Illicit Firearms Transit (NH-58 Interception)', date: '10/06/2025', ps: 'Special Crime Branch, UP Police (Meerut)', suspects: 'Suresh Yadav, Manish Tiwari, Burner Contact' },
                  { id: '104', title: 'Inter-State Luxury Vehicle Theft Ring', date: '22/06/2025', ps: 'Auto Crime Cell, Mumbai Police', suspects: 'Priya Nair, Rohit Patel' },
                  { id: '105', title: 'Commercial Hawala & Shell Company Layering', date: '05/07/2025', ps: 'Economic Offences Wing / ED', suspects: 'Deepak Srivastava, Ravi Kumar, Aarav Mehta' },
                ].map((c) => (
                  <div key={c.id} style={{ padding: '1.25rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#818cf8', fontWeight: 600, fontSize: '0.85rem' }}>
                        FIR No. {c.id}/2025
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{c.date}</span>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.35rem' }}>{c.title}</h4>
                    <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: '0.5rem' }}>{c.ps}</p>
                    <div style={{ fontSize: '0.75rem', color: '#d1d5db', marginBottom: '0.75rem' }}>
                      <strong>Key Accused:</strong> {c.suspects}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCase(c.id);
                        setActiveTab('dashboard');
                      }}
                      className="btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      <span>Explore Case Subgraph</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: CENTRALITY & CLUSTERS */}
          {activeTab === 'analytics' && (
            <CrossCasePanel onFocusEntity={handleFocusEntity} />
          )}
        </main>
      </div>
    </div>
  );
}
