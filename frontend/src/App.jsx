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
import DataIngestion from './components/DataIngestion';
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

// Global Forensic Search & Edge Evidence Panels
import GlobalEntitySearch from './components/GlobalEntitySearch';
import EdgeEvidenceDrawer from './components/EdgeEvidenceDrawer';

const PAGE_META = {
  dashboard:         { label: 'Criminal Pinboard',          icon: Pin },
  admin_dashboard:   { label: 'System & Security Control',  icon: Shield },
  analyst_dashboard: { label: 'Pattern & Intelligence',     icon: BarChart3 },
  network:           { label: 'Knowledge Graph',            icon: Network },
  copilot:           { label: 'AI Investigation Copilot',   icon: Bot },
  ingest:            { label: 'Evidence Ingestion',         icon: Upload },
  brief:             { label: 'Case Brief',                 icon: FileText },
  investigation:     { label: 'Case Workspace',             icon: Database },
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
    minConfidence, setMinConfidence,
    relationshipTypeFilter, setRelationshipTypeFilter,
    entityTypeFilter, setEntityTypeFilter,
    highlightedPath, pathDetails, pathMessage, pathSourceId, setPathSourceId,
    handleFindPath, clearPath, focusEntityById, openCase,
    setInvestigationSection, suspectList,
  } = inv;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(null);

  // Global Ctrl+K hotkey for Global Entity Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

      {/* Global Forensic Entity Search Palette */}
      <GlobalEntitySearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        nodes={nodes}
        onSelectEntity={(e) => {
          selectEntity(e, { focusGraph: true });
          setActiveTab('network');
        }}
      />

      {/* When not on corkboard, render top bar */}
      {!isBoard && (
        <InvestigatorBar
          pageMeta={pageMeta} PageIcon={PageIcon}
          selectedCase={selectedCase} setSelectedCase={setSelectedCase}
          casesList={casesList} currentRole={currentRole} setCurrentRole={setCurrentRole}
          onBack={() => setActiveTab('dashboard')}
          isInvestigator={isInvestigator}
          onOpenSearch={() => setIsSearchOpen(true)}
          onSignOut={onSignOut}
        />
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', zIndex: 1 }}>
        {/* Sidebar visible when not on the full-screen corkboard */}
        {!isBoard && (
          <Sidebar currentRole={currentRole} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        <main key={activeTab} className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {isBoard && <CriminalBoard onOpenSearch={() => setIsSearchOpen(true)} />}
          {(activeTab === 'dossiers' || activeTab === 'cases') && <CaseDossiers />}

          {activeTab === 'network' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <GraphControls
                selectedCase={selectedCase}
                onSelectCase={setSelectedCase}
                layoutName={layoutName}
                onSelectLayout={setLayoutName}
                minConfidence={minConfidence}
                onSelectMinConfidence={setMinConfidence}
                relationshipType={relationshipTypeFilter}
                onSelectRelationshipType={setRelationshipTypeFilter}
                entityType={entityTypeFilter}
                onSelectEntityType={setEntityTypeFilter}
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
                <PathBanner
                  message={pathMessage}
                  hops={pathDetails?.hops}
                  evidentiaryStrength={pathDetails?.evidentiary_strength}
                  onSelectHop={(hop) => {
                    setSelectedEntity(null);
                    setSelectedEdge({
                      source: hop.from_id,
                      target: hop.to_id,
                      from_name: hop.from_name,
                      to_name: hop.to_name,
                      type: hop.relationship,
                      relationship: hop.relationship,
                      confidence: hop.confidence,
                      evidence_snippet: hop.evidence_snippet || hop.evidence,
                      source_document_id: hop.source_document_id || hop.source_document,
                      extraction_method: hop.extraction_method,
                      verification_status: hop.verification_status,
                      created_at: hop.created_at,
                      evidentiary_strength: hop.evidentiary_strength,
                    });
                  }}
                />
              )}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                <GraphCanvas
                  nodes={nodes} edges={edges} layoutName={layoutName}
                  selectedEntity={selectedEntity} onSelectEntity={(e) => { setSelectedEdge(null); selectEntity(e); }}
                  selectedEdge={selectedEdge} onSelectEdge={(edge) => { setSelectedEntity(null); setSelectedEdge(edge); }}
                  highlightedPath={highlightedPath} isLoading={isLoadingGraph}
                  focusEntityId={focusMode ? graphFocusEntity : null}
                />
                
                {/* Edge Evidence Slide-Out Drawer */}
                <EdgeEvidenceDrawer
                  edgeData={selectedEdge}
                  onClose={() => setSelectedEdge(null)}
                  onFocusEntity={focusEntityById}
                />

                {/* Entity Inspector */}
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

function InvestigatorBar({ pageMeta, PageIcon, selectedCase, setSelectedCase, casesList, currentRole, setCurrentRole, onBack, isInvestigator, onOpenSearch, onSignOut }) {
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
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Global Entity Search Trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(217,170,61,0.35)',
            color: '#D9AA3D', padding: '0.3rem 0.75rem', borderRadius: 6,
            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
          }}
        >
          <Search size={13} />
          <span>Global Search</span>
          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.05rem 0.35rem', borderRadius: 4, fontSize: '0.65rem', color: '#8a948c' }}>
            Ctrl+K
          </span>
        </button>

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

function PathBanner({ message, hops, evidentiaryStrength, onSelectHop }) {
  return (
    <div style={{ padding: '0.65rem 1rem', margin: '0.5rem 1rem 0', borderRadius: 8, background: 'rgba(217,170,61,0.08)', border: '1px solid rgba(217,170,61,0.25)', color: '#F1EBDD', fontSize: '0.82rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#D9AA3D' }}>
          <Sparkles size={16} />
          <span>{message}</span>
        </div>
        {evidentiaryStrength && (
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#72bf7e', background: 'rgba(94,159,104,0.15)', padding: '0.15rem 0.5rem', borderRadius: 6, border: '1px solid rgba(94,159,104,0.3)' }}>
            Evidentiary Strength: {evidentiaryStrength.label}
          </span>
        )}
      </div>
      {hops?.length > 0 && (
        <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#A6B0AA', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {hops.map((h, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectHop && onSelectHop(h)}
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                padding: '0.25rem 0.55rem',
                color: '#F1EBDD',
                cursor: 'pointer',
                fontSize: '0.73rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Click hop to view evidence drawer"
            >
              <span style={{ color: '#D9AA3D', fontWeight: 700 }}>{h.from_name}</span>
              <span style={{ color: '#8a948c' }}>—[{h.relationship}]→</span>
              <span style={{ color: '#D9AA3D', fontWeight: 700 }}>{h.to_name}</span>
              <span style={{ color: '#72bf7e', fontSize: '0.68rem', marginLeft: 4 }}>
                {h.evidentiary_strength?.label || `${Math.round((h.confidence || 0.9) * 100)}%`}
              </span>
            </button>
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
