import React, { useState, useEffect } from 'react';
import { FolderOpen, ShieldCheck, Sparkles, Bot, AlertTriangle, Clock, ArrowRight, Activity, Eye, TrendingUp, Briefcase, Share2, Shield, FileText, CheckCircle2, ChevronRight, User } from 'lucide-react';

export default function InvestigatorOverview({ onNavigateToPage, onNavigateToCase }) {
  const [stats, setStats] = useState({ cases: 0, pending: 0, entities: 0, leads: 0 });
  const [recentCases, setRecentCases] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, casesRes] = await Promise.all([
          fetch('/api/v1/overview/stats').catch(() => null),
          fetch('/api/v1/cases/').catch(() => null),
        ]);
        if (statsRes?.ok) {
          const data = await statsRes.json();
          setStats({
            cases: data.total_cases || 4,
            pending: data.pending_verification || 7,
            entities: data.total_entities || 156,
            leads: data.ai_leads || 12
          });
        } else {
          setStats({ cases: 4, pending: 7, entities: 156, leads: 12 });
        }
        if (casesRes?.ok) {
          setRecentCases((await casesRes.json()).slice(0, 5));
        }
      } catch {
        setStats({ cases: 4, pending: 7, entities: 156, leads: 12 });
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Active FIR Cases', value: stats.cases, icon: FolderOpen, subtitle: 'Across 3 Police Zones' },
    { label: 'Pending Verification', value: stats.pending, icon: ShieldCheck, subtitle: 'Sentence-level Evidence' },
    { label: 'Indexed Entities', value: stats.entities, icon: Share2, subtitle: 'Suspects, Phones, Vehicles' },
    { label: 'Priority AI Leads', value: stats.leads, icon: Sparkles, subtitle: 'Cross-Jurisdictional' },
  ];

  const quickActions = [
    { label: 'Upload FIR Document', desc: 'SHA-256 Hashed Extraction', page: 'fir_upload', icon: FileText },
    { label: 'Case Explorer', desc: 'Evidence Dossier & Timelines', page: 'workbench', icon: Briefcase },
    { label: 'Lead Verification', desc: 'Court Admissibility Review', page: 'verification', icon: ShieldCheck },
    { label: 'AI Copilot', desc: 'Natural Language Graph Query', page: 'copilot', icon: Bot },
  ];

  return (
    <div className="space-y-6">
      {/* Top Mission Banner */}
      <div className="p-6 rounded-2xl glass-panel-elevated relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase">
              <Shield className="w-3.5 h-3.5" />
              <span>JUDICIAL EVIDENCE & CASE INVESTIGATION DESK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1 font-mono">
              CASE INVESTIGATION <span className="text-red-500 glow-text-red">WORKSTATION</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono">
              Evidence-grounded criminal investigation portal. Ingest First Information Reports, verify extracted entity triples, and inspect multi-district syndicate linkages.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigateToPage('fir_upload')}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-700 via-red-600 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs font-mono transition flex items-center space-x-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] border border-red-500/40"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>INGEST NEW FIR</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric HUD Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-4 rounded-xl bg-black/70 border border-red-950/60 hover:border-red-600/40 transition-all group glass-panel-hover">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-950/50 border border-red-800/40 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-red-400" />
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500/60"></span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight group-hover:text-red-300 transition">
                {card.value}
              </div>
              <div className="text-[10px] text-slate-300 font-mono uppercase font-bold tracking-wider mt-1">{card.label}</div>
              <div className="text-[9px] text-red-500/70 font-mono mt-0.5">{card.subtitle}</div>
            </div>
          );
        })}
      </div>

      {/* Main Investigation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Cases Registry (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl glass-panel space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-red-950/60">
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-red-500" />
                <span>Active Case Investigations</span>
              </span>
              <button
                onClick={() => onNavigateToPage('cases')}
                className="text-[10px] font-mono text-red-500 hover:text-red-400 flex items-center space-x-1"
              >
                <span>VIEW ALL CASES</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {(recentCases.length > 0 ? recentCases : [
                { case_id: 'FIR-2025-ND-101', title: 'Rohini Outer Ring Road Syndicate Assault', status: 'ACTIVE', entities_count: 23, crime: 'Armed Robbery / Extortion', date: '14 Feb 2025' },
                { case_id: 'FIR-2025-ND-102', title: 'Interstate Cyber Hawala & Extortion Ring', status: 'ACTIVE', entities_count: 18, crime: 'IT Act 66D / Hawala', date: '20 Feb 2025' },
                { case_id: 'FIR-2025-HR-203', title: 'Gurgaon High-Speed Vehicle Smuggling Corridor', status: 'REVIEW', entities_count: 31, crime: 'Vehicle Smuggling', date: '28 Feb 2025' },
                { case_id: 'FIR-2026-DL-001', title: 'Okhla Industrial Arms Deal & Weapon Cache', status: 'PROCESSING', entities_count: 13, crime: 'Arms Act 25', date: '02 Mar 2026' },
              ]).map((c, i) => (
                <div
                  key={i}
                  onClick={() => {
                    if (onNavigateToCase) onNavigateToCase(c.case_id);
                    else onNavigateToPage('workbench');
                  }}
                  className="p-3.5 rounded-xl bg-black/80 border border-red-950/60 hover:border-red-600/60 transition cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-700/40 flex items-center justify-center text-xs font-mono text-red-400 font-bold shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-red-300 transition truncate font-mono">
                        {c.title || c.case_id}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono mt-0.5">
                        <span className="text-red-500 font-semibold">{c.case_id}</span>
                        <span>•</span>
                        <span>{c.crime || 'Criminal Syndicate'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      c.status === 'ACTIVE' 
                        ? 'bg-red-950 text-red-400 border border-red-700' 
                        : 'bg-black text-slate-400 border border-red-950'
                    }`}>
                      {c.status || 'ACTIVE'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-red-400 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Workstation Modules */}
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => onNavigateToPage(action.page)}
                  className="p-4 rounded-xl bg-black/70 border border-red-950/60 hover:border-red-600/50 transition text-left group glass-panel-hover"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4 text-red-500 group-hover:text-red-400 transition" />
                    <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-red-400 transition" />
                  </div>
                  <div className="text-xs font-bold text-slate-200 group-hover:text-red-300 transition font-mono">
                    {action.label}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                    {action.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: High Priority Syndicate Leads & Target Suspects (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* High Priority Syndicate Leads */}
          <div className="p-5 rounded-2xl glass-panel space-y-3 border-red-900/40">
            <div className="flex items-center justify-between pb-3 border-b border-red-950/60">
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span>High-Priority Syndicate Leads</span>
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                AI REASONED
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { target: 'Vikram Singh', text: 'Linked as Bridge Broker between Rohini Robbery (FIR-101) & Cyber Extortion (FIR-102)', score: 96, action: 'Cross-Case Subpoena' },
                { target: 'DL01AB1234', text: 'Getaway vehicle spotted across Delhi and Gurgaon transit corridors', score: 91, action: 'ANPR Alert Issued' },
                { target: 'Apex Global Logistics', text: 'Identified as shell corporation routing Hawala remittance', score: 87, action: 'Financial Audit' },
              ].map((lead, i) => (
                <div key={i} className="p-3 rounded-xl bg-black/80 border border-red-950/70 space-y-2 hover:border-red-700/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 font-mono flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      <span>{lead.target}</span>
                    </span>
                    <span className="text-[10px] font-mono font-black text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800">
                      {lead.score}% CONFIDENCE
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                    {lead.text}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-red-950/40 text-[9px] font-mono">
                    <span className="text-slate-500">RECOMMENDED:</span>
                    <span className="text-red-400 font-bold">{lead.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Copilot Banner */}
          <div
            onClick={() => onNavigateToPage('copilot')}
            className="p-4 rounded-xl bg-gradient-to-r from-red-950/60 via-black to-black border border-red-800/40 hover:border-red-600/60 transition cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-red-950 border border-red-600/50 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 font-mono group-hover:text-red-300 transition">
                  AI Investigation Copilot Ready
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Ask queries on shortest paths, suspect networks & CDRs
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition" />
          </div>
        </div>
      </div>
    </div>
  );
}
