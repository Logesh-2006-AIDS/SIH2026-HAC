import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import LoginPortal from './components/LoginPortal.jsx';

// 14 Dedicated Investigation Pages
import OverviewPage from './pages/OverviewPage.jsx';
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

import { Activity, Database, Server, User, Search, Bell } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('overview');
  const [selectedCaseId, setSelectedCaseId] = useState('FIR-2025-ND-101');
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Check saved session on startup
  useEffect(() => {
    const token = localStorage.getItem('crime_auth_token');
    const role = localStorage.getItem('crime_user_role');
    const name = localStorage.getItem('crime_user_name');

    if (token) {
      setIsAuthenticated(true);
      setCurrentUser({
        access_token: token,
        role: role || 'Investigator',
        full_name: name || 'Senior IO Rajesh Varma'
      });
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setCurrentUser(userData);
    setActivePage('overview');
  };

  const handleLogout = () => {
    localStorage.removeItem('crime_auth_token');
    localStorage.removeItem('crime_user_role');
    localStorage.removeItem('crime_user_name');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleNavigateToCase = (caseId) => {
    setSelectedCaseId(caseId);
    setActivePage('workbench');
  };

  const handleNavigateToEntity = (entity) => {
    setSelectedEntity(entity);
    setActivePage('graph');
  };

  if (!isAuthenticated) {
    return <LoginPortal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-100 selection:bg-cyan-500 selection:text-black overflow-hidden font-sans">
      {/* 1. Left Professional Sidebar (14 Pages) */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 bg-[#080d1a]/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              NAVIGATION
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-extrabold text-slate-100 uppercase tracking-wider font-mono">
              {activePage.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Neo4j Telemetry Badge */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Graph:</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                <span>Neo4j Active</span>
              </span>
            </div>

            {/* Officer Profile Badge */}
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-slate-300 font-bold">{currentUser?.full_name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                {currentUser?.role}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Routing */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#070b14]">
          <div className="max-w-7xl mx-auto w-full">
            {activePage === 'overview' && (
              <OverviewPage
                onNavigateToCase={handleNavigateToCase}
                onNavigateToEntity={handleNavigateToEntity}
                onNavigateToPage={(page) => setActivePage(page)}
              />
            )}

            {activePage === 'cases' && (
              <CasesPage
                onSelectCase={handleNavigateToCase}
                onNavigateToWorkbench={handleNavigateToCase}
                onNavigateToIngestion={() => setActivePage('ingestion')}
              />
            )}

            {activePage === 'workbench' && (
              <WorkbenchPage
                caseId={selectedCaseId}
                onNavigateToEntity={handleNavigateToEntity}
              />
            )}

            {activePage === 'graph' && (
              <KnowledgeGraphPage
                selectedEntityProp={selectedEntity}
                onNavigateToEntity={handleNavigateToEntity}
              />
            )}

            {activePage === 'heatmap' && (
              <CrimeHeatmapPage
                onNavigateToCase={handleNavigateToCase}
              />
            )}

            {activePage === 'cross_case' && (
              <CrossCasePage
                onNavigateToWorkbench={handleNavigateToCase}
              />
            )}

            {activePage === 'analytics' && (
              <NetworkAnalyticsPage
                onNavigateToEntity={handleNavigateToEntity}
              />
            )}

            {activePage === 'leads' && (
              <AiLeadsPage />
            )}

            {activePage === 'copilot' && (
              <CopilotPage
                onNavigateToEntity={handleNavigateToEntity}
                onNavigateToCase={handleNavigateToCase}
              />
            )}

            {activePage === 'ingestion' && (
              <DataIngestionPage
                onIngestionSuccess={(res) => handleNavigateToCase(res.case_id)}
              />
            )}

            {activePage === 'verification' && (
              <VerificationCenterPage />
            )}

            {activePage === 'audit' && (
              <AuditLogsPage />
            )}

            {activePage === 'users' && (
              <UserManagementPage />
            )}

            {activePage === 'settings' && (
              <SettingsPage currentUser={currentUser} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
