import React, { useState, useEffect } from 'react';
import { BarChart3, Network, ShieldAlert, GitFork, Users, Zap, ArrowRight, Eye, Sparkles } from 'lucide-react';

export default function NetworkAnalyticsPage({ onNavigateToEntity }) {
  const [centralityList, setCentralityList] = useState([]);
  const [syndicates, setSyndicates] = useState([]);
  const [activeTab, setActiveTab] = useState('centrality');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [centRes, synRes] = await Promise.all([
          fetch('/api/v1/analytics/centrality'),
          fetch('/api/v1/analytics/syndicates')
        ]);
        if (centRes.ok) setCentralityList(await centRes.json());
        if (synRes.ok) setSyndicates(await synRes.json());
      } catch (err) {
        console.error('Analytics error:', err);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-slate-900 to-slate-900">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Graph Analytics & Centrality Intelligence</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                ALGORITHMIC NETWORK METRICS
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Degree & Betweenness Centrality • Louvain Community Clusters • Bridge Node Detection
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('centrality')}
            className={`px-3.5 py-1.5 rounded-lg transition ${activeTab === 'centrality' ? 'bg-cyan-600 text-black font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Centrality Rankings
          </button>
          <button
            onClick={() => setActiveTab('communities')}
            className={`px-3.5 py-1.5 rounded-lg transition ${activeTab === 'communities' ? 'bg-cyan-600 text-black font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Community Clusters
          </button>
        </div>
      </div>

      {/* Centrality View */}
      {activeTab === 'centrality' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Centrality Leaderboard (Betweenness & Degree Indices)</span>
              </h2>
              <span className="text-xs font-mono text-slate-500">Auto-Calculated by Graph AI</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Suspect / Node</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Direct Connections (Degree)</th>
                    <th className="py-3 px-4">Betweenness Score</th>
                    <th className="py-3 px-4">Threat Index</th>
                    <th className="py-3 px-4">Role Hypothesis</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {centralityList.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-100">
                        {c.name}
                        {c.aliases?.length > 0 && (
                          <div className="text-[10px] text-amber-400 font-normal">alias {c.aliases[0]}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                          {c.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-cyan-400 font-bold">{c.degree_connections} Links</td>
                      <td className="py-3 px-4 font-bold text-slate-200">{c.betweenness_centrality}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                          {c.threat_index}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans">{c.role_hypothesis}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onNavigateToEntity(c)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition flex items-center space-x-1"
                        >
                          <span>Explore</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Community Clusters View */}
      {activeTab === 'communities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {syndicates.map((syn) => (
            <div
              key={syn.cluster_id}
              className="p-6 rounded-2xl glass-panel border border-slate-800 hover:border-rose-500/40 shadow-xl space-y-4 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-rose-400 border border-slate-700 font-bold">
                    {syn.cluster_id}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold">
                    {syn.threat_level} THREAT
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100">{syn.name}</h3>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">NODES</span>
                    <strong className="text-slate-200">{syn.total_nodes}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">SUSPECTS</span>
                    <strong className="text-red-400">{syn.suspects_count}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">VEHICLES</span>
                    <strong className="text-purple-400">{syn.vehicles_count}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Identified Members:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {syn.members?.map((m, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-mono">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
