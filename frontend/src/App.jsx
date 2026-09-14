import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, ArrowLeft, Network, Map, Bot, Upload, FileText, Database, Shield, CheckCircle, Crosshair } from 'lucide-react';

// Core Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GraphCanvas from './components/GraphCanvas';
import GraphControls from './components/GraphControls';
import EntityInspector from './components/EntityInspector';
import BackgroundNetwork from './components/BackgroundNetwork';

// Rewritten & New Components
import AICopilot from './components/AICopilot';
import CrossCasePanel from './components/CrossCasePanel';
import SmartCaseBrief from './components/SmartCaseBrief';
import LeadVerification from './components/LeadVerification';
import CaseInvestigation from './components/CaseInvestigation';
import DataIngestion from './components/DataIngestion';
import CrimeIntelligenceMap from './components/CrimeIntelligenceMap';
import InvestigationPriority from './components/InvestigationPriority';
import CriminalBoard from './components/CriminalBoard';

// Page labels & icons for Investigator slim top bar
const PAGE_META = {
  network:      { label: 'Knowledge Graph Explorer', icon: Network },
  map:          { label: 'Crime Intelligence Map',   icon: Map },
  copilot:      { label: 'AI Copilot',               icon: Bot },
  ingest:       { label: 'Data Ingestion',           icon: Upload },
  brief:        { label: 'Smart Case Brief',         icon: FileText },
  cases:        { label: 'Case Dossiers',            icon: Database },
  crosscase:    { label: 'Cross-Case Analysis',      icon: Crosshair },
  verification: { label: 'Lead Verification',        icon: CheckCircle },
  priority:     { label: 'Investigation Priority',   icon: Shield },
  audit:        { label: 'Audit Trail',              icon: FileText },
};

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

  const handleFindPath = async (sourceId, targetId) => {
    setIsLoadingGraph(true);
    try {
      const res = await axios.get(`/api/v1/graph/shortest-path?source_id=${sourceId}&target_id=${targetId}`);
      if (res.data?.success && res.data.data.path) {
        setHighlightedPath(res.data.data.path);
        setPathMessage(`Path: ${res.data.data.path.join(' > ')} (Weight: ${res.data.data.weight})`);
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

  const handleSeedGraph = async () => {
    setIsLoadingGraph(true);
    try {
      const res = await axios.post('/api/v1/graph/seed');
      if (res.data?.success) await fetchSubgraph(selectedCase);
    } catch (err) {
      console.error('Seed graph failed:', err);
    } finally {
      setIsLoadingGraph(false);
    }
  };

  useEffect(() => { fetchSubgraph(selectedCase); }, [selectedCase]);

  const suspectList = nodes
    .filter((n) => n.id && (n.name || n.role || n.id.startsWith('P')))
    .map((n) => ({ id: n.id, name: n.name || n.id }));

  const handleFocusEntity = (entityId) => {
    setActiveTab('network');
    const match = nodes.find((n) => n.id === entityId || n.number === entityId);
    if (match) setSelectedEntity(match);
  };

  const handleSelectCase = (caseId) => {
    setSelectedCase(caseId);
    setActiveTab('cases');
  };

  // Investigator mode: full-page board OR full-page sub-tool (no sidebar/header)
  const isInvestigator = currentRole === 'INVESTIGATOR';
  const isBoard = isInvestigator && activeTab === 'dashboard';

  // Slim top bar for investigator sub-pages
  const pageMeta = PAGE_META[activeTab] || { label: activeTab, icon: Shield };
  const PageIcon = pageMeta.icon;

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <BackgroundNetwork />

      {/* Generic Header — only for non-investigator roles */}
      {!isInvestigator && (
        <Header
          currentRole={currentRole}
          setCurrentRole={setCurrentRole}
          selectedCase={selectedCase}
          setSelectedCase={setSelectedCase}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', zIndex: 1 }}>

        {/* Sidebar — only for non-investigator roles */}
        {!isInvestigator && (
          <Sidebar currentRole={currentRole} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        <main
          key={activeTab}
          className="animate-fade-in"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'transparent' }}
        >

          {/* ── INVESTIGATOR SLIM TOP BAR (sub-pages only, not the board) ── */}
          {isInvestigator && !isBoard && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 1.25rem',
              height: '46px',
              flexShrink: 0,
              background: 'rgba(10, 13, 10, 0.98)',
              borderBottom: '1px solid rgba(217,170,61,0.3)',
              boxShadow: '0 4px 18px rgba(0,0,0,0.8)',
              zIndex: 30,
            }}>
              {/* Left: Return to Criminal Board */}
              <button
                onClick={() => setActiveTab('dashboard')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                  background: 'rgba(217,170,61,0.14)',
                  border: '1px solid rgba(217,170,61,0.4)',
                  color: '#D9AA3D',
                  padding: '0.3rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.80rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,170,61,0.25)'; e.currentTarget.style.borderColor = '#D9AA3D'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217,170,61,0.14)'; e.currentTarget.style.borderColor = 'rgba(217,170,61,0.4)'; }}
              >
                <ArrowLeft size={15} />
                <span>Criminal Board</span>
              </button>

              {/* Center: Page name with icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: 'rgba(217,170,61,0.18)',
                  border: '1px solid rgba(217,170,61,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#D9AA3D',
                }}>
                  <PageIcon size={15} />
                </div>
                <span style={{
                  color: '#F1EBDD', fontWeight: 800, fontSize: '0.90rem',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  {pageMeta.label}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  background: 'rgba(217,170,61,0.12)',
                  border: '1px solid rgba(217,170,61,0.25)',
                  color: '#D9AA3D',
                  fontWeight: 700,
                }}>
                  Case #{selectedCase || '101'}
                </span>
              </div>

              {/* Right: Quick Case & Role switchers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <select
                  value={selectedCase || '101'}
                  onChange={e => setSelectedCase(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(217,170,61,0.35)',
                    color: '#F1EBDD',
                    padding: '0.22rem 0.6rem',
                    borderRadius: '5px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="101">Case #101</option>
                  <option value="102">Case #102</option>
                  <option value="103">Case #103</option>
                </select>

                <select
                  value={currentRole}
                  onChange={e => setCurrentRole(e.target.value)}
                  style={{
                    background: 'rgba(217,170,61,0.15)',
                    border: '1px solid rgba(217,170,61,0.45)',
                    color: '#D9AA3D',
                    fontWeight: 700,
                    padding: '0.22rem 0.6rem',
                    borderRadius: '5px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="INVESTIGATOR">Investigator</option>
                  <option value="ANALYST">Analyst</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          )}

          {/* ── CRIMINAL BOARD (Investigator dashboard) ── */}
          {isBoard && (
            <CriminalBoard
              selectedCase={selectedCase || '101'}
              onSelectCase={setSelectedCase}
              onNavigateTab={setActiveTab}
              onFocusEntity={handleFocusEntity}
              onOpenGraphView={() => setActiveTab('network')}
              currentRole={currentRole}
              setCurrentRole={setCurrentRole}
            />
          )}

          {/* ── KNOWLEDGE GRAPH ── */}
          {(activeTab === 'network' || (activeTab === 'dashboard' && !isInvestigator)) && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <GraphControls
                selectedCase={selectedCase}
                onSelectCase={setSelectedCase}
                layoutName={layoutName}
                onSelectLayout={setLayoutName}
                onFindPath={handleFindPath}
                onSeedGraph={handleSeedGraph}
                onClearPath={() => { setHighlightedPath([]); setPathMessage(''); }}
                hasActivePath={highlightedPath.length > 0}
                suspects={suspectList}
              />
              {pathMessage && (
                <div style={{
                  padding: '0.6rem 1rem', margin: '0 1rem', borderRadius: '8px',
                  background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                  color: '#fbbf24', fontSize: '0.82rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <Sparkles size={16} /><span>{pathMessage}</span>
                </div>
              )}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                <GraphCanvas
                  nodes={nodes} edges={edges} layoutName={layoutName}
                  selectedEntity={selectedEntity} onSelectEntity={setSelectedEntity}
                  highlightedPath={highlightedPath} isLoading={isLoadingGraph}
                />
                <EntityInspector entity={selectedEntity} onClose={() => setSelectedEntity(null)} />
              </div>
            </div>
          )}

          {/* ── SUB-PAGE WORKSPACES ── */}
          {activeTab === 'cases' && (
            <CaseInvestigation
              caseNumber={selectedCase || '101'}
              onBack={() => setActiveTab('dashboard')}
              onOpenGraph={() => setActiveTab('network')}
            />
          )}
          {activeTab === 'map'          && <CrimeIntelligenceMap onSelectCase={handleSelectCase} />}
          {activeTab === 'crosscase'    && <CrossCasePanel onFocusEntity={handleFocusEntity} />}
          {activeTab === 'copilot'      && (
            <AICopilot
              onFocusEntity={handleFocusEntity}
              contextCase={selectedCase}
              contextEntity={selectedEntity?.id}
            />
          )}
          {activeTab === 'priority'     && <InvestigationPriority />}
          {activeTab === 'brief'        && <SmartCaseBrief selectedCase={selectedCase} />}
          {activeTab === 'ingest'       && <DataIngestion />}
          {activeTab === 'verification' && <LeadVerification />}
          {activeTab === 'audit'        && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Select a Case to view its tamper-evident Audit Trail Export.
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

