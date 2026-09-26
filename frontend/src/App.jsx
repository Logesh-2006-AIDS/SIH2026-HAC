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
    <div className="flex items-center justify-between px-6 h-12 bg-black/60 backdrop-blur-md border-b border-white/5 z-40 shrink-0 transition-all">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-gradient-to-br from-[#d9aa3d] to-[#8a6515] text-[#050706] shadow-[0_0_10px_rgba(217,170,61,0.3)]">
          <Shield size={14} />
        </div>
        <span className="text-[#d9aa3d] font-bold text-xs tracking-[0.1em] uppercase">
          RiskLink
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          currentRole === 'ADMIN' ? 'bg-[#d62828]/10 border-[#d62828]/30 text-[#d62828]' : 'bg-[#d9aa3d]/10 border-[#d9aa3d]/30 text-[#d9aa3d]'
        }`}>
          {currentRole} CONSOLE
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-[#8a948c] hidden md:inline">Switch Role:</span>
        <select
          value={currentRole}
          onChange={(e) => setCurrentRole(e.target.value)}
          className="bg-black/40 border border-white/10 text-[#d9aa3d] text-xs rounded px-2 py-1 outline-none focus:border-[#d9aa3d]/50 cursor-pointer transition-colors"
        >
          <option value="ADMIN">Admin Console</option>
          <option value="ANALYST">Analyst Console</option>
          <option value="INVESTIGATOR">Investigator Workbench</option>
        </select>
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center gap-1.5 text-xs text-[#d62828] hover:text-[#fca5a5] hover:bg-[#d62828]/10 px-2 py-1 rounded transition-colors"
        >
          <LogOut size={14} /> Sign out
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
    <div className="flex items-center justify-between px-6 h-14 bg-black/60 backdrop-blur-md border-b border-white/5 z-30 shrink-0">
      <div className="flex items-center gap-4">
        {isInvestigator && (
          <button 
            type="button" 
            onClick={onBack} 
            className="flex items-center gap-2 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#d9aa3d]/30 text-[#f1ebdd] hover:text-[#d9aa3d] px-3 py-1.5 rounded-lg transition-all"
          >
            <ArrowLeft size={14} /> Pinboard
          </button>
        )}
        <div className="flex items-center gap-3">
          <PageIcon size={18} className="text-[#d9aa3d]" />
          <span className="text-[#f1ebdd] font-bold text-sm tracking-wide uppercase">
            {pageMeta.label}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#d9aa3d]/10 text-[#d9aa3d] border border-[#d9aa3d]/30">
            Case {selectedCase}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Entity Search Trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 bg-black/40 border border-white/10 hover:border-[#d9aa3d]/40 text-[#d9aa3d] px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(217,170,61,0.15)] group"
        >
          <Search size={14} className="group-hover:scale-110 transition-transform" />
          <span>Global Search</span>
          <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px] text-[#8a948c] ml-1">
            Ctrl+K
          </span>
        </button>

        <select 
          value={selectedCase} 
          onChange={(e) => setSelectedCase(e.target.value)} 
          className="bg-black/40 border border-white/10 text-white text-xs rounded px-2 py-1.5 outline-none focus:border-[#d9aa3d]/50 cursor-pointer transition-colors h-[28px]"
        >
          {(casesList.length ? casesList : [{ case_number: '101' }, { case_number: '102' }, { case_number: '103' }]).map((c) => (
            <option key={c.case_number} value={c.case_number}>Case {c.case_number}</option>
          ))}
        </select>
        
        <select 
          value={currentRole} 
          onChange={(e) => setCurrentRole(e.target.value)} 
          className="bg-black/40 border border-white/10 text-[#d9aa3d] text-xs rounded px-2 py-1.5 outline-none focus:border-[#d9aa3d]/50 cursor-pointer transition-colors h-[28px]"
        >
          <option value="INVESTIGATOR">Investigator</option>
          <option value="ANALYST">Analyst</option>
          <option value="ADMIN">Admin</option>
        </select>
        
        <button
          type="button"
          onClick={onSignOut}
          className="bg-black/40 border border-[#d62828]/30 hover:bg-[#d62828]/10 hover:border-[#d62828]/50 text-[#d62828] text-xs rounded px-3 py-1.5 cursor-pointer transition-all h-[28px] font-bold"
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
    const interceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('sih_token');
      if (token && token !== 'demo-token') {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

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

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
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
