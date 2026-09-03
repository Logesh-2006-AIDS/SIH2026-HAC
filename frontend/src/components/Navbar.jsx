import React from 'react';
import { Shield, Search, BarChart3, Database, Server, Activity, User, MapPin, ShieldCheck, AlertTriangle, LogOut, Sparkles } from 'lucide-react';

export default function Navbar({ activeRole, setActiveRole, currentUser, onLogout, systemStatus }) {
  // Navigation tabs organized by relevance
  const navTabs = [
    { id: 'analyst', label: 'Knowledge Graph', icon: BarChart3, color: 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10' },
    { id: 'investigator', label: 'FIR Ingestion & Dossiers', icon: Search, color: 'text-amber-400 border-amber-500/50 bg-amber-500/10' },
    { id: 'map', label: 'Geospatial Map', icon: MapPin, color: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10' },
    { id: 'leads', label: 'Lead Verification', icon: ShieldCheck, color: 'text-blue-400 border-blue-500/50 bg-blue-500/10' },
    { id: 'priority', label: 'Priority Matrix', icon: AlertTriangle, color: 'text-red-400 border-red-500/50 bg-red-500/10' },
    { id: 'admin', label: 'Admin Ops', icon: Shield, color: 'text-purple-400 border-purple-500/50 bg-purple-500/10' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-base sm:text-lg tracking-wider bg-gradient-to-r from-cyan-400 via-teal-200 to-indigo-300 bg-clip-text text-transparent">
              CRIMENEXUS AI
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold tracking-wide uppercase">
              SIH 2026
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">AI Criminal Network & Legal NLP Intelligence</p>
        </div>
      </div>

      {/* Clean Interactive Navigation Tabs */}
      <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner overflow-x-auto max-w-full">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeRole === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveRole(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? `${tab.color} border shadow-md`
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* User Info & Telemetry & Sign Out */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Graph Engine Status */}
        <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Neo4j:</span>
          <span className="text-emerald-400 font-semibold flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
            <span>{systemStatus?.neo4j_graph?.engine || 'Active'}</span>
          </span>
        </div>

        {/* Authenticated Officer Badge */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-bold text-slate-100 truncate max-w-[140px]">
              {currentUser?.full_name || 'Authorized Officer'}
            </div>
            <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
              {currentUser?.role || activeRole}
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={onLogout}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-red-950/60 border border-slate-800 hover:border-red-800 text-slate-400 hover:text-red-400 transition"
          title="Sign Out to Login Portal"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
