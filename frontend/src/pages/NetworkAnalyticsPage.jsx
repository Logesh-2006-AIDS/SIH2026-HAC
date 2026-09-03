import React, { useState, useEffect } from 'react';
import { BarChart3, Network, ShieldAlert, GitFork, Users, Zap, ArrowRight, Eye, Sparkles, Filter, RefreshCw } from 'lucide-react';

export default function NetworkAnalyticsPage({ onNavigateToEntity }) {
  const [centralityList, setCentralityList] = useState([]);
  const [syndicates, setSyndicates] = useState([]);
  const [activeTab, setActiveTab] = useState('centrality');
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [centRes, synRes] = await Promise.all([
        fetch('/api/v1/analytics/centrality'),
        fetch('/api/v1/analytics/syndicates')
      ]);
      if (centRes.ok) setCentralityList(await centRes.json());
      if (synRes.ok) setSyndicates(await synRes.json());
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const filteredCentrality = centralityList.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.label === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-red-900/40 bg-gradient-to-r from-red-950/40 via-black to-black shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-600/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Graph Analytics & Centrality Intelligence</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-semibold font-mono">
                ALGORITHMIC NETWORK METRICS
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Degree & Betweenness Centrality • Louvain Community Clusters • Bridge Node Detection ({centralityList.length} Nodes Indexed)
            </p>
          </div>
        </div>

        {/* Tab & Refresh Controls */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-xl bg-black/80 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-red-950/60 transition"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
          </button>

          <div className="flex items-center bg-black/80 p-1 rounded-xl border border-red-950/60 text-xs font-mono">
            <button
              onClick={() => setActiveTab('centrality')}
              className={`px-3.5 py-1.5 rounded-lg transition font-bold ${
                activeTab === 'centrality' 
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Centrality Rankings
            </button>
            <button
              onClick={() => setActiveTab('communities')}
              className={`px-3.5 py-1.5 rounded-lg transition font-bold ${
                activeTab === 'communities' 
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Community Clusters
            </button>
          </div>
        </div>
      </div>

      {/* Centrality View */}
      {activeTab === 'centrality' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-panel border border-red-900/40 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Centrality Leaderboard (Betweenness & Degree Indices)
                </h2>
              </div>

              {/* Filter by Entity Type */}
              <div className="flex items-center space-x-1.5 text-xs font-mono">
                {['ALL', 'SUSPECT_PERSON', 'PHONE_NUMBER', 'VEHICLE_NUMBER', 'LOCATION'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold transition border ${
                      filterType === type
                        ? 'bg-red-950 text-red-400 border-red-700'
                        : 'bg-black/60 text-slate-500 border-red-950/60 hover:text-slate-300'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-black/90 text-red-400 uppercase text-[10px] font-mono border-b border-red-950/80">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Suspect / Node</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Direct Connections (Degree)</th>
                    <th className="py-3 px-4">Betweenness Score</th>
                    <th className="py-3 px-4">Threat Index</th>
                    <th className="py-3 px-4">Role Hypothesis</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-950/40 font-mono text-[11px]">
                  {filteredCentrality.slice(0, 50).map((c, idx) => (
                    <tr key={c.id} className="hover:bg-red-950/20 transition">
                      <td className="py-3 px-4 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-100">
                        {c.name}
                        {c.aliases?.length > 0 && (
                          <div className="text-[10px] text-red-400 font-normal">alias {c.aliases[0]}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-black text-red-400 border border-red-950 text-[10px] font-bold">
                          {c.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-red-400 font-bold">{c.degree_connections} Links</td>
                      <td className="py-3 px-4 font-bold text-slate-300">{c.betweenness_centrality}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          c.threat_index >= 80 
                            ? 'bg-red-950 text-red-400 border border-red-700 glow-red-subtle' 
                            : 'bg-black text-slate-400 border border-red-950'
                        }`}>
                          {c.threat_index}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-sans">{c.role_hypothesis}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigateToEntity ? onNavigateToEntity(c) : null}
                          className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-700/60 text-[10px] font-bold transition inline-flex items-center space-x-1"
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
          {syndicates.map((syn, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl glass-panel border border-red-900/40 hover:border-red-600/60 shadow-xl space-y-4 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-red-400 border border-red-950 font-bold">
                    {syn.cluster_id || `Cluster #${idx + 1}`}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                    {syn.threat_level || 'CRITICAL'} THREAT
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 font-mono">{syn.name || syn.syndicate_name || `Syndicate Network Alpha`}</h3>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-lg bg-black/80 border border-red-950/60">
                    <span className="text-slate-500 text-[10px] block">NODES</span>
                    <strong className="text-slate-200">{syn.total_nodes || 25}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-black/80 border border-red-950/60">
                    <span className="text-slate-500 text-[10px] block">SUSPECTS</span>
                    <strong className="text-red-400">{syn.suspects_count || 12}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-black/80 border border-red-950/60">
                    <span className="text-slate-500 text-[10px] block">VEHICLES</span>
                    <strong className="text-red-300">{syn.vehicles_count || 6}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 font-mono">Identified Members:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(syn.members || ['Vikram Singh', 'Ravi Kumar', 'DL01AB1234', '+91-98765-32100']).map((m, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-black text-slate-300 border border-red-950/60 text-[10px] font-mono">
                        {typeof m === 'object' ? m.name : m}
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
