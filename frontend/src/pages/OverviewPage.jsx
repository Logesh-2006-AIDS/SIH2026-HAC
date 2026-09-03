import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Users,
  Car,
  Phone,
  MapPin,
  ShieldAlert,
  Sparkles,
  GitMerge,
  TrendingUp,
  Activity,
  ArrowRight,
  Shield,
  Clock,
  Compass,
  FileText
} from 'lucide-react';

export default function OverviewPage({ onNavigateToCase, onNavigateToEntity, onNavigateToPage }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/v1/overview/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching overview stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const kpiCards = [
    { label: 'Active FIR Cases', value: stats?.kpis?.total_cases || 4, icon: FolderOpen, color: 'text-blue-400', border: 'border-blue-500/30 bg-blue-500/10' },
    { label: 'Suspects & Persons', value: stats?.kpis?.persons_count || 10, icon: Users, color: 'text-red-400', border: 'border-red-500/30 bg-red-500/10' },
    { label: 'Tracked Vehicles', value: stats?.kpis?.vehicles_count || 5, icon: Car, color: 'text-purple-400', border: 'border-purple-500/30 bg-purple-500/10' },
    { label: 'Phone & CDR Nodes', value: stats?.kpis?.phones_count || 8, icon: Phone, color: 'text-cyan-400', border: 'border-cyan-500/30 bg-cyan-500/10' },
    { label: 'High-Risk Entities', value: stats?.kpis?.high_risk_count || 4, icon: ShieldAlert, color: 'text-amber-400', border: 'border-amber-500/30 bg-amber-500/10' },
    { label: 'Cross-Case Links', value: stats?.kpis?.cross_case_connections || 8, icon: GitMerge, color: 'text-emerald-400', border: 'border-emerald-500/30 bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl glass-panel border border-red-900/40 bg-gradient-to-r from-red-950/40 via-black to-black shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>NATIONAL CRIMINAL INTELLIGENCE FUSION DESK</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
            CRIMENEXUS AI - Operations Overview Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time entity aggregation, multi-jurisdiction cross-case detection & AI lead intelligence.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateToPage('workbench')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-red-900/40 border border-red-500/30"
          >
            <span>Open Investigation Workbench</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Grid (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={`p-4 rounded-2xl glass-panel border ${kpi.border} shadow-lg space-y-2`}>
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-[10px] font-mono text-slate-500 uppercase">TELEMETRY</span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-100">{kpi.value}</div>
              <div className="text-[11px] font-semibold text-slate-400 truncate">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* 2-Column Analytics: Crime Trend Chart & Crime Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Crime Trend Chart (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Incident Volume & Clearance Rate (Monthly)</span>
            </h3>
            <span className="text-xs font-mono text-slate-500">6-Month Trend</span>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2">
            {stats?.crime_trends?.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex items-end justify-center gap-1.5 h-40">
                  {/* Total Incidents Bar */}
                  <div
                    style={{ height: `${(t.incidents / 45) * 100}%` }}
                    className="w-full max-w-[20px] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                    title={`Total Incidents: ${t.incidents}`}
                  ></div>
                  {/* Resolved Bar */}
                  <div
                    style={{ height: `${(t.resolved / 45) * 100}%` }}
                    className="w-full max-w-[20px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                    title={`Resolved: ${t.resolved}`}
                  ></div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">{t.month.split(' ')[0]}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center space-x-6 pt-2 border-t border-slate-800 text-xs font-mono text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-cyan-400"></span>
              <span>Reported FIRs</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-emerald-400"></span>
              <span>Resolved Chargesheets</span>
            </span>
          </div>
        </div>

        {/* Crime Type Distribution (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Offense Classification Spectrum</span>
          </h3>

          <div className="space-y-3 pt-1">
            {stats?.crime_type_distribution?.map((c, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 truncate pr-2">{c.type}</span>
                  <span className="font-mono text-cyan-400 font-bold">{c.percentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    style={{ width: `${c.percentage}%` }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full"
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Investigations & High-Risk Entities Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Investigations Table (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>Active Case Registries</span>
            </h3>
            <button onClick={() => onNavigateToPage('cases')} className="text-xs text-cyan-400 hover:underline font-mono">
              View All ➔
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">FIR / Case</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Crime Type</th>
                  <th className="py-2.5 px-3">Threat</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {stats?.recent_investigations?.map((c) => (
                  <tr key={c.case_id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-bold text-slate-100">
                      <div>{c.title}</div>
                      <div className="text-[10px] text-cyan-400">{c.fir_number}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{c.location}</td>
                    <td className="py-3 px-3">{c.crime_type}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-bold">
                        {c.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onNavigateToCase(c.case_id)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition"
                      >
                        Workbench
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* High-Risk Suspects Leaderboard (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Syndicate High-Risk Leaderboard</span>
            </h3>
            <span className="text-xs font-mono text-slate-500">Centrality AI</span>
          </div>

          <div className="space-y-2.5">
            {stats?.high_risk_entities?.map((suspect, idx) => (
              <div
                key={suspect.id}
                onClick={() => onNavigateToEntity(suspect)}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-red-500/40 cursor-pointer transition flex items-center justify-between shadow-md"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold flex items-center justify-center text-slate-300">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100">{suspect.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {suspect.aliases?.length ? `alias ${suspect.aliases[0]}` : suspect.role}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-extrabold">
                    Score: {suspect.threat_score}
                  </span>
                  <div className="text-[10px] text-cyan-400 mt-0.5">{suspect.degree} Network Links</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
