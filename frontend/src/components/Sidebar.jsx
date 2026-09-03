/**
 * CRIMENEXUS AI — Masterclass Role-Based Tactical Sidebar
 * Strict Matte Black + Neon Red Identity.
 */
import React from 'react';
import { Shield, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNavigationForRole, getRoleMetadata } from '../config/rbacConfig';

export default function Sidebar({ activePage, setActivePage }) {
  const { user, role, logout } = useAuth();
  const sections = getNavigationForRole(role);
  const roleMeta = getRoleMetadata(role);

  return (
    <aside className="w-64 bg-[#050102] border-r border-red-950/40 flex flex-col justify-between shrink-0 select-none z-30 shadow-[6px_0_30px_rgba(0,0,0,0.9)]">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-red-950/50 flex items-center space-x-3 bg-black/50">
          <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-600/50 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.25)] shrink-0">
            <Shield className="w-4 h-4 text-red-500" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm tracking-wider text-slate-100 font-mono">
                CRIMENEXUS <span className="text-red-500 glow-text-red">AI</span>
              </span>
            </div>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[9px] text-red-400 font-mono tracking-widest uppercase font-bold">
                {roleMeta.workstationTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Sections */}
        <div className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[9px] font-mono font-bold tracking-widest text-red-700/80 uppercase">
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-red-950/80 via-red-950/40 to-transparent border-l-2 border-red-500 text-red-200 font-semibold shadow-[0_0_12px_rgba(239,68,68,0.12)] pl-2.5'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-red-950/20'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-400' : 'text-slate-500'}`} />
                        <span className="truncate text-[11px]">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                          isActive 
                            ? 'bg-red-950 text-red-400 border border-red-700/60' 
                            : 'bg-black/60 text-slate-500 border border-red-950/50'
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
      <div className="p-3 border-t border-red-950/50 bg-black/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-800/40 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-extrabold font-mono text-red-400">
              {role === 'investigator' ? 'IO' : role === 'analyst' ? 'AN' : 'AD'}
            </span>
          </div>
          <div className="truncate text-left">
            <div className="text-xs font-bold text-slate-200 truncate font-mono">
              {user?.full_name || 'Officer'}
            </div>
            <div className="text-[9px] font-mono uppercase text-red-500/80 font-bold">
              {roleMeta.shortName}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-1.5 rounded-lg bg-black/60 hover:bg-red-950 text-slate-500 hover:text-red-400 transition border border-red-950/60 hover:border-red-700 shrink-0"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
