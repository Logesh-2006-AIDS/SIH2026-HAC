/**
 * CRIMENEXUS AI — Masterclass Role-Based Application Shell
 * Black & Red Tactical Intelligence System.
 */
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar.jsx';
import LoginPortal from './components/LoginPortal.jsx';
import PermissionGuard from './components/guards/PermissionGuard.jsx';

// ─── Role-Specific Landing Dashboards ───────────────────────────────
import InvestigatorOverview from './pages/InvestigatorOverview.jsx';
import IntelligenceOverview from './pages/IntelligenceOverview.jsx';
import AdminOverview from './pages/AdminOverview.jsx';

// ─── Shared Workstation Pages ───────────────────────────────────────
import CasesPage from './pages/CasesPage.jsx';
import WorkbenchPage from './pages/WorkbenchPage.jsx';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage.jsx';
import CrimeHeatmapPage from './pages/CrimeHeatmapPage.jsx';
import CrossCasePage from './pages/CrossCasePage.jsx';
import NetworkAnalyticsPage from './pages/NetworkAnalyticsPage.jsx';
import AiLeadsPage from './pages/AiLeadsPage.jsx';
import CopilotPage from './pages/CopilotPage.jsx';
import DataIngestionPage from './pages/DataIngestionPage.jsx';
import VerificationCenterPage from './pages/VerificationCenterPage.jsx';
import AuditLogsPage from './pages/AuditLogsPage.jsx';
import UserManagementPage from './pages/UserManagementPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import OverviewPage from './pages/OverviewPage.jsx';

import { Shield, Database, Lock, Radio } from 'lucide-react';
import { getLandingPage, hasPermission, getRoleMetadata } from './config/rbacConfig';

// ─── Page Registry ──────────────────────────────────────────────────
const PAGE_COMPONENTS = {
  // Investigator pages
  inv_overview:       { component: InvestigatorOverview, needsNav: true },
  cases:              { component: CasesPage, needsNav: true, needsCase: true },
  fir_upload:         { component: DataIngestionPage, needsIngestion: true },
  workbench:          { component: WorkbenchPage, needsCase: true, needsEntity: true },
  entity_search:      { component: KnowledgeGraphPage, needsEntity: true },
  inv_network:        { component: KnowledgeGraphPage, needsEntity: true },
  cross_case:         { component: CrossCasePage, needsCase: true },
  verification:       { component: VerificationCenterPage },
  copilot:            { component: CopilotPage, needsEntity: true, needsCase: true },
  inv_reports:        { component: OverviewPage, needsNav: true, needsEntity: true },

  // Analyst pages
  intel_overview:     { component: IntelligenceOverview, needsNav: true },
  graph:              { component: KnowledgeGraphPage, needsEntity: true },
  analytics:          { component: NetworkAnalyticsPage, needsEntity: true },
  entity_explorer:    { component: KnowledgeGraphPage, needsEntity: true },
  centrality:         { component: NetworkAnalyticsPage, needsEntity: true },
  community:          { component: NetworkAnalyticsPage, needsEntity: true },
  shortest_path:      { component: NetworkAnalyticsPage, needsEntity: true },
  link_prediction:    { component: AiLeadsPage },
  cross_intel:        { component: CrossCasePage, needsCase: true },
  heatmap:            { component: CrimeHeatmapPage, needsCase: true },
  crime_trends:       { component: CrimeHeatmapPage, needsCase: true },
  ai_insights:        { component: CopilotPage, needsEntity: true, needsCase: true },
  intel_reports:      { component: OverviewPage, needsNav: true, needsEntity: true },

  // Admin pages
  admin_overview:     { component: AdminOverview, needsNav: true },
  dataset_mgmt:       { component: AdminDashboard, needsNav: true },
  ingestion:          { component: DataIngestionPage, needsIngestion: true },
  data_validation:    { component: VerificationCenterPage },
  entity_resolution:  { component: VerificationCenterPage },
  neo4j_db:           { component: KnowledgeGraphPage, needsEntity: true },
  system_health:      { component: SettingsPage, needsUser: true },
  users:              { component: UserManagementPage },
  security:           { component: SettingsPage, needsUser: true },
  audit:              { component: AuditLogsPage },
  data_quality:       { component: VerificationCenterPage },
  sys_config:         { component: SettingsPage, needsUser: true },
};

function AppShell() {
  const { isAuthenticated, user, role, login, logout, landingPage, metadata } = useAuth();
  const [activePage, setActivePage] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState('FIR-2025-ND-101');
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Set landing page when role changes
  useEffect(() => {
    if (role && !activePage) {
      setActivePage(getLandingPage(role));
    }
  }, [role]);

  // Guard: if user navigates to a page they don't have permission for, redirect
  useEffect(() => {
    if (role && activePage && !hasPermission(role, activePage)) {
      setActivePage(getLandingPage(role));
    }
  }, [activePage, role]);

  const handleLoginSuccess = (userData) => {
    login(userData);
    setActivePage(getLandingPage(userData.role || 'investigator'));
  };

  const handleNavigateToCase = (caseId) => {
    setSelectedCaseId(caseId);
    setActivePage('workbench');
  };

  const handleNavigateToEntity = (entity) => {
    setSelectedEntity(entity);
    if (role === 'analyst') setActivePage('graph');
    else if (role === 'admin') setActivePage('neo4j_db');
    else setActivePage('entity_search');
  };

  const handleNavigateToPage = (pageId) => {
    if (hasPermission(role, pageId)) {
      setActivePage(pageId);
    }
  };

  // ─── Login Screen ─────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <LoginPortal onLoginSuccess={handleLoginSuccess} />;
  }

  // ─── Render Active Page ───────────────────────────────────────────
  const renderActivePage = () => {
    const pageConfig = PAGE_COMPONENTS[activePage];
    if (!pageConfig) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-slate-500 text-xs font-mono">
            <p>Module offline: <span className="text-red-500">{activePage}</span></p>
          </div>
        </div>
      );
    }

    const Component = pageConfig.component;
    const props = {};

    if (pageConfig.needsNav) {
      props.onNavigateToPage = handleNavigateToPage;
      props.onNavigateToCase = handleNavigateToCase;
      props.onNavigateToEntity = handleNavigateToEntity;
    }
    if (pageConfig.needsCase) {
      props.caseId = selectedCaseId;
      props.onSelectCase = handleNavigateToCase;
      props.onNavigateToWorkbench = handleNavigateToCase;
      props.onNavigateToIngestion = () => handleNavigateToPage('fir_upload');
    }
    if (pageConfig.needsEntity) {
      props.selectedEntityProp = selectedEntity;
      props.onNavigateToEntity = handleNavigateToEntity;
    }
    if (pageConfig.needsIngestion) {
      props.onIngestionSuccess = (res) => handleNavigateToCase(res.case_id);
    }
    if (pageConfig.needsUser) {
      props.currentUser = user;
    }

    return (
      <PermissionGuard pageId={activePage} onRedirect={() => setActivePage(landingPage)}>
        <Component {...props} />
      </PermissionGuard>
    );
  };

  const roleMeta = getRoleMetadata(role);

  return (
    <div className="flex h-screen bg-[#030102] text-slate-100 selection:bg-red-600 selection:text-white overflow-hidden font-sans bg-tactical-grid">
      {/* Dynamic Tactical Sidebar */}
      <Sidebar activePage={activePage} setActivePage={handleNavigateToPage} />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#030102]">
        {/* Top Tactical HUD Header */}
        <header className="h-14 bg-[#060203]/95 backdrop-blur-md border-b border-red-950/50 px-6 flex items-center justify-between shrink-0 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
          {/* Breadcrumb Module Indicator */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-red-500 font-bold tracking-widest uppercase">
              {roleMeta.workstationTitle}
            </span>
            <span className="text-red-800">/</span>
            <span className="text-slate-300 font-bold uppercase tracking-wider">
              {activePage?.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Right Status Badges */}
          <div className="flex items-center space-x-3.5">
            {/* Live Graph Status */}
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-black/80 border border-red-950/60 text-[10px] font-mono">
              <Database className="w-3.5 h-3.5 text-red-500" />
              <span className="text-slate-500">GRAPH:</span>
              <span className="text-red-400 font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span>NEO4J ACTIVE</span>
              </span>
            </div>

            {/* Security Indicator */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-black/80 border border-red-950/60 text-[10px] font-mono text-slate-400">
              <Lock className="w-3 h-3 text-red-600" />
              <span className="text-red-500/80 font-bold">POL-SECURE</span>
            </div>

            {/* Officer Profile Badge */}
            <div className="flex items-center space-x-2 text-xs font-mono bg-red-950/40 border border-red-800/40 px-3 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span className="text-slate-200 font-bold">{user?.full_name}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-700 font-bold uppercase">
                {roleMeta.shortName}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-[#030102] bg-radial-vignette">
          <div className="max-w-7xl mx-auto w-full">
            {renderActivePage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
