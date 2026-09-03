import React from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Briefcase,
  Share2,
  MapPin,
  GitMerge,
  BarChart3,
  Sparkles,
  Bot,
  UploadCloud,
  ShieldCheck,
  FileSpreadsheet,
  Users,
  Settings,
  ChevronRight,
  Activity,
  LogOut
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, currentUser, onLogout }) {
  const role = currentUser?.role?.toLowerCase() || 'investigator';

  const menuSections = [
    {
      title: 'INTELLIGENCE CORE',
      items: [
        { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard, badge: null },
        { id: 'cases', label: 'Cases Registry', icon: FolderOpen, badge: '4' },
        { id: 'workbench', label: 'Investigation Workbench', icon: Briefcase, badge: 'LIVE' },
        { id: 'graph', label: 'Knowledge Graph', icon: Share2, badge: 'Neo4j' },
        { id: 'heatmap', label: 'Crime Heatmap', icon: MapPin, badge: null },
      ]
    },
    {
      title: 'ANALYTICS & AI COPILOT',
      items: [
        { id: 'cross_case', label: 'Cross-Case Intelligence', icon: GitMerge, badge: 'Links' },
        { id: 'analytics', label: 'Network Analytics', icon: BarChart3, badge: null },
        { id: 'leads', label: 'AI Leads & Link Prediction', icon: Sparkles, badge: '5 New' },
        { id: 'copilot', label: 'AI Investigation Copilot', icon: Bot, badge: 'Smart' },
      ]
    },
    {
      title: 'OPERATIONS & COMPLIANCE',
      items: [
        { id: 'ingestion', label: 'Data Ingestion Pipeline', icon: UploadCloud, badge: null },
        { id: 'verification', label: 'Verification Center', icon: ShieldCheck, badge: 'Review' },
        { id: 'audit', label: 'Tamper-Evident Audit Logs', icon: FileSpreadsheet, badge: 'SHA-256' },
        ...(role === 'admin' ? [{ id: 'users', label: 'User Management', icon: Users, badge: 'Admin' }] : []),
        { id: 'settings', label: 'System Settings', icon: Settings, badge: null },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#080d1a] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-800/80 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-cyan-400 to-indigo-300 bg-clip-text text-transparent">
                CRIMENEXUS AI
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold uppercase">
                SIH '26
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Criminal Network Analysis</p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-170px)] pr-1">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </div>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 border border-cyan-500/50 text-cyan-300 shadow-md'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
            <span className="text-xs font-bold font-mono">IO</span>
          </div>
          <div className="truncate text-left">
            <div className="text-xs font-bold text-slate-200 truncate">
              {currentUser?.full_name || 'Senior IO'}
            </div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase">
              {currentUser?.role || 'Investigator'}
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/80 text-slate-400 hover:text-red-400 transition border border-slate-800 hover:border-red-800 shrink-0"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
