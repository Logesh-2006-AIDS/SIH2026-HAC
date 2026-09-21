import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Sparkles, ArrowLeft, Network, Map, Bot, Upload, FileText,
  Database, Shield, CheckCircle, Crosshair, Search, FolderOpen,
  AlertTriangle, BarChart3, Route, Pin, LogOut
} from 'lucide-react';
import { InvestigationProvider, useInvestigation } from './context/InvestigationContext';


import Sidebar from './components/Sidebar';
import GraphCanvas from './components/GraphCanvas';
import GraphControls from './components/GraphControls';
import EntityInspector from './components/EntityInspector';
import BackgroundNetwork from './components/BackgroundNetwork';
import AICopilot from './components/AICopilot';
import CrossCasePanel from './components/CrossCasePanel';
import SmartCaseBrief from './components/SmartCaseBrief';

import CaseInvestigation from './components/CaseInvestigation';
import EntityInvestigation from './components/EntityInvestigation';
import DataIngestion from './components/DataIngestion';
import CrimeMap from './components/analyst/CrimeMap';
import CriminalBoard from './components/CriminalBoard';
import CaseDossiers from './components/CaseDossiers';
import LoginScreen from './components/LoginScreen';

// Core specialized investigation components
import NLPEntityExtraction from './components/NLPEntityExtraction';
import SuspiciousPatterns from './components/SuspiciousPatterns';
import KeyEntities from './components/KeyEntities';
import PathFinder from './components/PathFinder';
import InvestigationLeads from './components/InvestigationLeads';

// Upgraded Operational Dashboards
import AdminDashboard from './components/AdminDashboard';
import AnalystDashboard from './components/AnalystDashboard';

const PAGE_META = {
  dashboard:         { label: 'Criminal Pinboard',          icon: Pin },
  admin_dashboard:   { label: 'System & Security Control',  icon: Shield },
  analyst_dashboard: { label: 'Pattern & Intelligence',     icon: BarChart3 },
  network:           { label: 'Knowledge Graph',            icon: Network },
  map:               { label: 'Crime Heatmap',             icon: Map },
  copilot:           { label: 'AI Investigation Copilot',   icon: Bot },
  ingest:            { label: 'Evidence Ingestion',         icon: Upload },
  brief:             { label: 'Case Brief',                 icon: FileText },
  investigation:     { label: 'Case Workspace',             icon: Database },
  entity:            { label: 'Entity Investigation',       icon: Search },
  crosscase:         { label: 'Cross-Case Intelligence',    icon: Crosshair },
  leads:             { label: 'Actionable Leads',           icon: CheckCircle },
  report:            { label: 'Investigation Report',       icon: FileText },
  cases:             { label: 'Case Dossiers',              icon: FolderOpen },
  dossiers:          { label: 'Case Dossiers',              icon: FolderOpen },
  patterns:          { label: 'Suspicious Patterns',        icon: AlertTriangle },
  nlp:               { label: 'AI/NLP Entity Extraction',   icon: Sparkles },
  keyentities:       { label: 'Key & Bridge Entities',      icon: BarChart3 },
  pathfinder:        { label: 'Red-String Path Finder',     icon: Route },
};

function RoleSwitcherBar({ currentRole, setCurrentRole, onSignOut }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', height: 40,
      background: 'rgba(10,13,10,0.98)', borderBottom: '1px solid rgba(217,170,61,0.25)', zIndex: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5, background: 'linear-gradient(135deg,#d9aa3d,#8a6515)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000'
        }}>
          <Shield size={13} />
        </div>
        <span style={{ color: '#D9AA3D', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          HOUSE TARGARYEN
        </span>
        <span style={{
          fontSize: '0.65rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: 10,
          background: currentRole === 'ADMIN' ? 'rgba(214,40,40,0.2)' : 'rgba(217,170,61,0.18)',
          border: currentRole === 'ADMIN' ? '1px solid rgba(214,40,40,0.45)' : '1px solid rgba(217,170,61,0.35)',
          color: currentRole === 'ADMIN' ? '#fca5a5' : '#D9AA3D'
        }}>
          {currentRole} CONSOLE
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: '#8a948c' }}>Switch Role:</span>
        <select
          value={currentRole}
          onChange={(e) => setCurrentRole(e.target.value)}
          style={{ ...barSelect, color: '#D9AA3D', cursor: 'pointer' }}
        >
          <option value="ADMIN">Admin Console</option>
          <option value="ANALYST">Analyst Console</option>
          <option value="INVESTIGATOR">Investigator Workbench</option>
        </select>
        <button
          type="button"
          onClick={onSignOut}
          style={{ ...barSelect, cursor: 'pointer', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <LogOut size={12} /> Sign out
        </button>
      </div>
    </div>
  );
}

function AppInner({ onSignOut }) {
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

  // 1. ADMIN ROLE VIEW (NEW Console from web/)
  if (currentRole === 'ADMIN') {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <RoleSwitcherBar currentRole={currentRole} setCurrentRole={setCurrentRole} onSignOut={onSignOut} />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          <AdminDashboard onSignOut={onSignOut} />
        </div>
      </div>
    );
  }

  // 2. ANALYST ROLE VIEW (NEW Console from web/)
  if (currentRole === 'ANALYST') {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <RoleSwitcherBar currentRole={currentRole} setCurrentRole={setCurrentRole} onSignOut={onSignOut} />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          <AnalystDashboard onSignOut={onSignOut} />
        </div>
      </div>
    );
  }

  // 3. INVESTIGATOR ROLE VIEW (MAIN WORKING APPLICATION - 100% PRESERVED)
  const isInvestigator = true;
  const isBoard = activeTab === 'dashboard';
  const pageMeta = PAGE_META[activeTab] || { label: activeTab, icon: Shield };
  const PageIcon = pageMeta.icon;

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <BackgroundNetwork />

      {/* When not on corkboard, render top bar */}
      {!isBoard && (
        <InvestigatorBar
          pageMeta={pageMeta} PageIcon={PageIcon}
          selectedCase={selectedCase} setSelectedCase={setSelectedCase}
          casesList={casesList} currentRole={currentRole} setCurrentRole={setCurrentRole}
          onBack={() => setActiveTab('dashboard')}
          isInvestigator={isInvestigator}
          onSignOut={onSignOut}
        />
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', zIndex: 1 }}>
        {/* Sidebar visible when not on the full-screen corkboard */}
        {!isBoard && (
          <Sidebar currentRole={currentRole} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        <main key={activeTab} className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {isBoard && <CriminalBoard />}
          {(activeTab === 'dossiers' || activeTab === 'cases') && <CaseDossiers />}

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

          {/* Operational Dashboards within investigator context if opened */}
          {activeTab === 'admin_dashboard' && <AdminDashboard onSignOut={onSignOut} />}
          {activeTab === 'analyst_dashboard' && <AnalystDashboard onSignOut={onSignOut} />}

          {/* Core Feature Tabs */}
          {activeTab === 'patterns' && <SuspiciousPatterns />}
          {activeTab === 'nlp' && <NLPEntityExtraction />}
          {activeTab === 'keyentities' && <KeyEntities />}
          {activeTab === 'pathfinder' && <PathFinder />}
          {activeTab === 'leads' && <InvestigationLeads />}


          {activeTab === 'investigation' && <CaseInvestigation />}
          {activeTab === 'entity' && <EntityInvestigation />}
          {activeTab === 'map' && <CrimeMap />}
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
          {activeTab === 'report' && <SmartCaseBrief selectedCase={selectedCase} reportMode />}
        </main>
      </div>
    </div>
  );
}

function InvestigatorBar({ pageMeta, PageIcon, selectedCase, setSelectedCase, casesList, currentRole, setCurrentRole, onBack, isInvestigator, onSignOut }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', height: 48,
      background: 'rgba(10,13,10,0.98)', borderBottom: '1px solid rgba(217,170,61,0.3)', zIndex: 30,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isInvestigator && (
          <button type="button" onClick={onBack} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', padding: '0.3rem 0.7rem', cursor: 'pointer' }}>
            <ArrowLeft size={14} /> Pinboard
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PageIcon size={16} color="#D9AA3D" />
          <span style={{ color: '#F1EBDD', fontWeight: 800, fontSize: '0.86rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {pageMeta.label}
          </span>
          <span style={{
            fontSize: '0.66rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 4,
            background: 'rgba(217,170,61,0.15)', color: '#D9AA3D', border: '1px solid rgba(217,170,61,0.35)'
          }}>
            Case {selectedCase}
          </span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 12,
            background: 'rgba(94,159,104,0.2)', border: '1px solid rgba(94,159,104,0.4)', color: '#4ADE80'
          }}>
            DEMO MODE
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)} style={barSelect}>
          {(casesList.length ? casesList : [{ case_number: '101' }, { case_number: '102' }, { case_number: '103' }]).map((c) => (
            <option key={c.case_number} value={c.case_number}>Case {c.case_number}</option>
          ))}
        </select>
        <select value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} style={{ ...barSelect, color: '#D9AA3D' }}>
          <option value="INVESTIGATOR">Investigator</option>
          <option value="ANALYST">Analyst</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          type="button"
          onClick={onSignOut}
          style={{ ...barSelect, cursor: 'pointer', color: '#fca5a5' }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function PathBanner({ message, hops }) {
  return (
    <div style={{ padding: '0.6rem 1rem', margin: '0.5rem 1rem 0', borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: '0.82rem' }}>
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
  padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', outline: 'none', fontWeight: 600,
};

function AuthenticatedApp() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const handleSignOut = () => {
    localStorage.removeItem('sih_token');
    localStorage.removeItem('sih_user');
    window.history.pushState({}, '', '/login');
    setUser(null);
  };

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
        Loading forensic workbench…
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onAuthenticated={setUser} />;
  }

  return (
    <InvestigationProvider>
      <AppInner onSignOut={handleSignOut} />
    </InvestigationProvider>
  );
}

export default function App() {
  return <AuthenticatedApp />;
}
