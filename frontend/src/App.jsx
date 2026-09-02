import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles } from 'lucide-react';

// Core Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GraphCanvas from './components/GraphCanvas';
import GraphControls from './components/GraphControls';
import EntityInspector from './components/EntityInspector';

// Rewritten & New Components
import AICopilot from './components/AICopilot';
import CrossCasePanel from './components/CrossCasePanel';
import SmartCaseBrief from './components/SmartCaseBrief';
import LeadVerification from './components/LeadVerification';
import CaseInvestigation from './components/CaseInvestigation';
import DataIngestion from './components/DataIngestion';
import CrimeIntelligenceMap from './components/CrimeIntelligenceMap';
import InvestigationPriority from './components/InvestigationPriority';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState('INVESTIGATOR');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auto-route on role change
  useEffect(() => {
    if (currentRole === 'INVESTIGATOR') setActiveTab('dashboard');
    else if (currentRole === 'ANALYST') setActiveTab('map');
    else if (currentRole === 'ADMIN') setActiveTab('ingest');
  }, [currentRole]);

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

  const handleSelectCase = (caseId) => {
    setSelectedCase(caseId);
    setActiveTab('cases');
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header 
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        selectedCase={selectedCase} 
        setSelectedCase={setSelectedCase}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar currentRole={currentRole} activeTab={activeTab} setActiveTab={setActiveTab} />
        
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

          {/* New / Rewritten Workspaces */}
          {activeTab === 'cases' && (
            <CaseInvestigation 
              caseNumber={selectedCase || '101'} 
              onBack={() => setActiveTab('network')} 
              onOpenGraph={() => setActiveTab('network')}
            />
          )}
          {activeTab === 'map' && <CrimeIntelligenceMap onSelectCase={handleSelectCase} />}
          {activeTab === 'crosscase' && <CrossCasePanel onFocusEntity={handleFocusEntity} />}
          
          {activeTab === 'copilot' && (
            <AICopilot 
              onFocusEntity={handleFocusEntity} 
              contextCase={selectedCase} 
              contextEntity={selectedEntity?.id} 
            />
          )}
          {activeTab === 'priority' && <InvestigationPriority />}
          {activeTab === 'brief' && <SmartCaseBrief selectedCase={selectedCase} />}
          
          {activeTab === 'ingest' && <DataIngestion />}
          {activeTab === 'verification' && <LeadVerification />}
          
          {/* Audit Trail fallback for now */}
          {activeTab === 'audit' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Select a Case to view its tamper-evident Audit Trail Export.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
