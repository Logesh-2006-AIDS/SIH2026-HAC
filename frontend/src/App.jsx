import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Sparkles, ArrowLeft, Network, Map, Bot, Upload, FileText, Database, Shield, CheckCircle, Crosshair, Search, FolderOpen } from 'lucide-react';
import { InvestigationProvider, useInvestigation } from './context/InvestigationContext';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GraphCanvas from './components/GraphCanvas';
import GraphControls from './components/GraphControls';
import EntityInspector from './components/EntityInspector';
import BackgroundNetwork from './components/BackgroundNetwork';
import AICopilot from './components/AICopilot';
import CrossCasePanel from './components/CrossCasePanel';
import SmartCaseBrief from './components/SmartCaseBrief';
import LeadVerification from './components/LeadVerification';
import CaseInvestigation from './components/CaseInvestigation';
import EntityInvestigation from './components/EntityInvestigation';
import DataIngestion from './components/DataIngestion';
import CrimeIntelligenceMap from './components/CrimeIntelligenceMap';
import CriminalBoard from './components/CriminalBoard';
import CaseDossiers from './components/CaseDossiers';
import LoginScreen from './components/LoginScreen';

const PAGE_META = {
  network:       { label: 'Link Analysis',              icon: Network },
  map:           { label: 'Crime Intelligence Map',     icon: Map },
  copilot:       { label: 'AI Copilot',                 icon: Bot },
  ingest:        { label: 'Add Evidence',               icon: Upload },
  brief:         { label: 'Case Brief',                 icon: FileText },
  investigation: { label: 'Case Investigation',         icon: Database },
  entity:        { label: 'Entity Investigation',       icon: Search },
  crosscase:     { label: 'Cross-Case Intelligence',    icon: Crosshair },
  verification:  { label: 'Lead Verification',          icon: CheckCircle },
  report:        { label: 'Investigation Report',       icon: FileText },
  dossiers:      { label: 'Case Dossiers',              icon: FolderOpen },
};

function AppInner() {
  const inv = useInvestigation();
  const {
    activeTab, setActiveTab, currentRole, setCurrentRole,
    selectedCase, setSelectedCase, casesList,
    nodes, edges, isLoadingGraph, layoutName, setLayoutName,
    selectedEntity, selectEntity, graphFocusEntity, setGraphFocusEntity,
    focusMode, setFocusMode, expandHops, setExpandHops,
    highlightedPath, pathDetails, pathMessage, pathSourceId, setPathSourceId,
    handleFindPath, clearPath, focusEntityById, openCase,
    setInvestigationSection, suspectList,
  } = inv;

  const isInvestigator = currentRole === 'INVESTIGATOR';
  const isBoard = isInvestigator && activeTab === 'dashboard';
  const pageMeta = PAGE_META[activeTab] || { label: activeTab, icon: Shield };
  const PageIcon = pageMeta.icon;

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <BackgroundNetwork />

      {!isInvestigator && (
        <Header currentRole={currentRole} setCurrentRole={setCurrentRole} selectedCase={selectedCase} setSelectedCase={setSelectedCase} />
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', zIndex: 1 }}>
        {!isInvestigator && (
          <Sidebar currentRole={currentRole} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        <main key={activeTab} className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {isInvestigator && !isBoard && (
            <InvestigatorBar
              pageMeta={pageMeta} PageIcon={PageIcon}
              selectedCase={selectedCase} setSelectedCase={setSelectedCase}
              casesList={casesList} currentRole={currentRole} setCurrentRole={setCurrentRole}
              onBack={() => setActiveTab('dashboard')}
            />
          )}

          {isBoard && <CriminalBoard />}
          {activeTab === 'dossiers' && <CaseDossiers />}

          {activeTab === 'network' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <GraphControls
                selectedCase={selectedCase}
                onSelectCase={setSelectedCase}
                layoutName={layoutName}
                onSelectLayout={setLayoutName}
                onFindPath={handleFindPath}
                onClearPath={clearPath}
                hasActivePath={highlightedPath.length > 0}
                suspects={suspectList}
                pathSourceId={pathSourceId}
                focusMode={focusMode}
                onToggleFocusMode={() => setFocusMode((v) => !v)}
                expandHops={expandHops}
                onExpandHops={setExpandHops}
                graphFocusEntity={graphFocusEntity}
                onClearFocus={() => { setGraphFocusEntity(null); setFocusMode(false); }}
              />
              {(pathMessage || pathDetails?.hops?.length) && (
                <PathBanner message={pathMessage} hops={pathDetails?.hops} />
              )}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                <GraphCanvas
                  nodes={nodes} edges={edges} layoutName={layoutName}
                  selectedEntity={selectedEntity} onSelectEntity={(e) => selectEntity(e)}
                  highlightedPath={highlightedPath} isLoading={isLoadingGraph}
                  focusEntityId={focusMode ? graphFocusEntity : null}
                />
                <EntityInspector
                  entity={selectedEntity}
                  onClose={() => selectEntity(null)}
                  onFocusEntity={(e) => { selectEntity(e); setGraphFocusEntity(e.id); setFocusMode(true); }}
                  onTraceFrom={(id) => { setPathSourceId(id); }}
                  onViewCrossCase={() => setActiveTab('crosscase')}
                  onViewEvidence={() => { setInvestigationSection('evidence'); setActiveTab('investigation'); }}
                  onOpenCase={(cid) => openCase(cid)}
                />
              </div>
            </div>
          )}

          {activeTab === 'investigation' && <CaseInvestigation />}
          {activeTab === 'entity' && <EntityInvestigation />}
          {activeTab === 'map' && <CrimeIntelligenceMap onSelectCase={openCase} selectedCase={selectedCase} />}
          {activeTab === 'crosscase' && <CrossCasePanel onFocusEntity={focusEntityById} selectedCase={selectedCase} />}
          {activeTab === 'copilot' && (
            <AICopilot onFocusEntity={focusEntityById} contextCase={selectedCase} contextEntity={selectedEntity?.id} />
          )}
          {activeTab === 'brief' && <SmartCaseBrief selectedCase={selectedCase} />}
          {activeTab === 'ingest' && (
            <DataIngestion
              caseId={selectedCase}
              onComplete={() => inv.fetchSubgraph(selectedCase, graphFocusEntity, expandHops)}
            />
          )}
          {activeTab === 'verification' && <LeadVerification caseId={selectedCase} />}
          {activeTab === 'report' && <SmartCaseBrief selectedCase={selectedCase} reportMode />}
        </main>
      </div>
    </div>
  );
}

function InvestigatorBar({ pageMeta, PageIcon, selectedCase, setSelectedCase, casesList, currentRole, setCurrentRole, onBack }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', height: 46,
      background: 'rgba(10,13,10,0.98)', borderBottom: '1px solid rgba(217,170,61,0.3)', zIndex: 30,
    }}>
      <button type="button" onClick={onBack} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
        <ArrowLeft size={15} /> Investigator Board
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <PageIcon size={15} color="#D9AA3D" />
        <span style={{ color: '#F1EBDD', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{pageMeta.label}</span>
        <span className="badge badge-gold">Case {selectedCase}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)} style={barSelect}>
          {(casesList.length ? casesList : [{ case_number: '103' }]).map((c) => (
            <option key={c.case_number} value={c.case_number}>Case {c.case_number}</option>
          ))}
        </select>
        <select value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} style={{ ...barSelect, color: '#D9AA3D' }}>
          <option value="INVESTIGATOR">Investigator</option>
          <option value="ANALYST">Analyst</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
    </div>
  );
}

function PathBanner({ message, hops }) {
  return (
    <div style={{ padding: '0.6rem 1rem', margin: '0 1rem', borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: '0.82rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><Sparkles size={16} />{message}</div>
      {hops?.length > 0 && (
        <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#fde68a' }}>
          {hops.map((h, i) => (
            <div key={i}>
              {h.from_name} —[{h.relationship}]→ {h.to_name} (Source: {h.evidence_source}, {Math.round((h.confidence || 0.9) * 100)}%)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const barSelect = {
  background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(217,170,61,0.35)', color: '#F1EBDD',
  padding: '0.22rem 0.55rem', borderRadius: 5, fontSize: '0.75rem', outline: 'none',
};

function AuthenticatedApp() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sih_token');
    const raw = localStorage.getItem('sih_user');
    if (token && raw) {
      try {
        const parsed = JSON.parse(raw);
        if (token !== 'demo-token') {
          axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        }
        setUser(parsed);
      } catch {
        localStorage.removeItem('sih_token');
        localStorage.removeItem('sih_user');
      }
    }
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080a08', color: '#D9AA3D' }}>
        Loading workbench…
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onAuthenticated={setUser} />;
  }

  return (
    <InvestigationProvider>
      <AppInner />
    </InvestigationProvider>
  );
}

export default function App() {
  return <AuthenticatedApp />;
}
