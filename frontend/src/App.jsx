import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GraphCanvas from './components/GraphCanvas';
import GraphControls from './components/GraphControls';
import EntityInspector from './components/EntityInspector';
import CrossCasePanel from './components/CrossCasePanel';
import LeadVerification from './components/LeadVerification';
import AICopilot from './components/AICopilot';
import TimelineReplay from './components/TimelineReplay';
import SmartCaseBrief from './components/SmartCaseBrief';
import InvestigationHeatmap from './components/InvestigationHeatmap';
import RiskScoreMatrix from './components/RiskScoreMatrix';
import InvestigationStory from './components/InvestigationStory';
import ReportGenerator from './components/ReportGenerator';
import { Sparkles } from 'lucide-react';

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

  // Extract persons for pathfinder dropdown
  const suspectList = nodes
    .filter((n) => n.id && (n.name || n.role || n.id.startsWith('P')))
    .map((n) => ({ id: n.id, name: n.name || n.id }));

  const handleFocusEntity = (entityId) => {
    setActiveTab('network');
    const match = nodes.find((n) => n.id === entityId || n.number === entityId);
    if (match) {
      setSelectedEntity(match);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header 
        selectedCase={selectedCase} 
        setSelectedCase={setSelectedCase}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden', background: 'var(--bg-primary)' }}>
          {/* Main Network Visualizer Workspace */}
          {(activeTab === 'dashboard' || activeTab === 'network') && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
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

              {pathMessage && (
                <div
                  style={{
                    padding: '0.6rem 1rem',
                    margin: '0 1rem',
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
              
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                <GraphCanvas 
                  nodes={nodes} 
                  edges={edges} 
                  layoutName={layoutName}
                  selectedEntity={selectedEntity}
                  onSelectEntity={setSelectedEntity}
                  highlightedPath={highlightedPath}
                  isLoading={isLoadingGraph}
                />
                
                <EntityInspector 
                  entity={selectedEntity} 
                  onClose={() => setSelectedEntity(null)} 
                />
              </div>
            </div>
          )}

          {/* Add-On Feature Workspaces */}
          {activeTab === 'copilot' && <AICopilot onFocusEntity={handleFocusEntity} />}
          {activeTab === 'timeline' && <TimelineReplay nodes={nodes} edges={edges} />}
          {activeTab === 'smartbrief' && <SmartCaseBrief onOpenGraph={() => setActiveTab('network')} />}
          {activeTab === 'heatmap' && <InvestigationHeatmap onOpenGraph={() => setActiveTab('network')} />}
          {activeTab === 'riskscore' && <RiskScoreMatrix />}
          {activeTab === 'story' && <InvestigationStory />}
          {activeTab === 'crosscase' && <CrossCasePanel onFocusEntity={handleFocusEntity} />}
          {activeTab === 'cases' && <SmartCaseBrief onOpenGraph={() => setActiveTab('network')} />}
          {activeTab === 'report' && <ReportGenerator />}
          {activeTab === 'audit' && <LeadVerification />}
        </main>
      </div>
    </div>
  );
}
