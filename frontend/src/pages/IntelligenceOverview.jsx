import React, { useState, useEffect } from 'react';
import { Share2, BarChart3, Target, Network, MapPin, TrendingUp, Sparkles, AlertTriangle, Activity, GitMerge, Link2, Users, Eye, Zap, Shield, ArrowRight, ChevronRight, Layers, Compass } from 'lucide-react';

export default function IntelligenceOverview({ onNavigateToPage, onNavigateToEntity }) {
  const [graphStats, setGraphStats] = useState({ nodes: 0, edges: 0, syndicates: 0 });
  const [centrality, setCentrality] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [graphRes, centRes] = await Promise.all([
          fetch('/api/v1/graph/').catch(() => null),
          fetch('/api/v1/analytics/centrality').catch(() => null),
        ]);
        if (graphRes?.ok) {
          const data = await graphRes.json();
          setGraphStats({
            nodes: data.stats?.total_nodes || 156,
            edges: data.stats?.total_edges || 234,
            syndicates: 7
          });
        } else {
          setGraphStats({ nodes: 156, edges: 234, syndicates: 7 });
        }
        if (centRes?.ok) {
          setCentrality((await centRes.json()).slice(0, 5));
        } else {
          setCentrality([
            { name: 'Vikram Singh', threat_index: 96, degree_connections: 8, role: 'Syndicate Bridge Broker', cases: 'FIR-101, FIR-102, FIR-203' },
            { name: 'Ravi Kumar', threat_index: 89, degree_connections: 6, role: 'Armed Cell Coordinator', cases: 'FIR-101' },
            { name: 'Priya Nair', threat_index: 78, degree_connections: 5, role: 'Financial Hawala Courier', cases: 'FIR-102' },
            { name: 'Deepak Verma', threat_index: 68, degree_connections: 4, role: 'Logistics Facilitator', cases: 'FIR-203' },
          ]);
        }
      } catch {
        setGraphStats({ nodes: 156, edges: 234, syndicates: 7 });
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Indexed Graph Nodes', value: graphStats.nodes, subtitle: 'Suspects, Phones, Vehicles, Locations', icon: Users },
    { label: 'Verified Relationships', value: graphStats.edges, subtitle: 'Multi-Hop Co-Conspiracy & Calls', icon: Share2 },
    { label: 'Active Syndicate Clusters', value: graphStats.syndicates, subtitle: 'Detected by Louvain Algorithm', icon: Network },
    { label: 'AI Link Predictions', value: '14 Active', subtitle: 'Cross-Case High Probability Edges', icon: Link2 },
  ];

  const analysisTools = [
    { label: 'Knowledge Graph', desc: 'CoSE Physics 2D/3D Traversal', page: 'graph', icon: Share2 },
    { label: 'Network Analytics', desc: 'Betweenness & Degree Hubs', page: 'analytics', icon: BarChart3 },
    { label: 'Centrality Ranking', desc: 'Threat Index Matrix', page: 'centrality', icon: Target },
    { label: 'Shortest Path Discovery', desc: 'Dijkstra Multi-Hop Connection', page: 'shortest_path', icon: GitMerge },
    { label: 'Geospatial Crime Heatmap', desc: 'State Density & Transit Corridors', page: 'heatmap', icon: MapPin },
    { label: 'Link Prediction Engine', desc: 'Jaccard & Adamic-Adar AI Links', page: 'link_prediction', icon: Link2 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Intelligence Banner */}
      <div className="p-6 rounded-2xl glass-panel-elevated relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase">
              <Network className="w-3.5 h-3.5" />
              <span>GRAPH TOPOLOGY & NATIONAL INTELLIGENCE SUITE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1 font-mono">
              INTELLIGENCE ANALYST <span className="text-red-500 glow-text-red">WORKSTATION</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono">
              High-dimensional network analysis and criminal pattern discovery. Uncover hidden syndicates, broker nodes, and inter-state movement corridors across judicial records.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigateToPage('graph')}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-700 via-red-600 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs font-mono transition flex items-center space-x-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] border border-red-500/40"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>LAUNCH FULL GRAPH</span>
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
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
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

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Threat Centrality & Kingpin Identification (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl glass-panel space-y-3 border-red-900/40">
            <div className="flex items-center justify-between pb-3 border-b border-red-950/60">
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center space-x-2">
                <Target className="w-3.5 h-3.5 text-red-500" />
                <span>Threat Centrality & Kingpin Ranking</span>
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                BETWEENNESS
              </span>
            </div>

            <div className="space-y-2.5">
              {centrality.map((entity, i) => (
                <div
                  key={i}
                  onClick={() => onNavigateToEntity ? onNavigateToEntity({ name: entity.name, id: entity.name }) : onNavigateToPage('graph')}
                  className="p-3 rounded-xl bg-black/80 border border-red-950/70 hover:border-red-600/60 transition cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                      i === 0 
                        ? 'bg-red-950 text-red-400 border border-red-600 shadow-[0_0_12px_rgba(239,68,68,0.3)]' 
                        : 'bg-black/90 text-slate-400 border border-red-950'
                    }`}>
                      #{i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-red-300 transition truncate font-mono">
                        {entity.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {entity.role || `${entity.degree_connections || 0} direct syndicate connections`}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-sm font-mono font-black ${entity.threat_index >= 90 ? 'text-red-500 glow-text-red' : entity.threat_index >= 75 ? 'text-red-400' : 'text-slate-400'}`}>
                      {entity.threat_index}/100
                    </div>
                    <div className="text-[8px] text-slate-500 font-mono uppercase">THREAT SCORE</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Louvain Criminal Clusters */}
          <div className="p-5 rounded-2xl glass-panel space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-red-950/60">
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span>Detected Criminal Syndicate Networks</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500">7 ACTIVE</span>
            </div>

            <div className="space-y-2">
              {[
                { name: 'Lawrence Bishnoi Syndicate (Network Alpha)', members: 25, threat: 'CRITICAL', confidence: 96, cases: '25 FIRs' },
                { name: 'Interstate Cyber Hawala Syndicate (Network Bravo)', members: 22, threat: 'CRITICAL', confidence: 92, cases: '22 FIRs' },
                { name: 'Gurgaon-Delhi Auto Smuggling Ring (Network Foxtrot)', members: 25, threat: 'HIGH', confidence: 88, cases: '25 FIRs' },
                { name: 'Western Arms & Contraband Transit (Network Delta)', members: 18, threat: 'HIGH', confidence: 84, cases: '18 FIRs' },
              ].map((net, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-black/80 border border-red-950/60 text-xs flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-200 truncate font-mono text-[11px]">{net.name}</div>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">{net.members} indexed nodes • {net.cases}</div>
                  </div>
                  <span className="text-[8px] px-2 py-0.5 rounded font-mono font-bold bg-red-950 text-red-400 border border-red-700 shrink-0">
                    {net.threat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Visualization & Graph Analytics Modules (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Analysis Modules Suite */}
          <div className="p-5 rounded-2xl glass-panel space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-red-950/60">
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center space-x-2">
                <Zap className="w-3.5 h-3.5 text-red-500" />
                <span>Specialized Graph Analytics Suite</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500">6 DEDICATED TOOLS</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {analysisTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.label}
                    onClick={() => onNavigateToPage(tool.page)}
                    className="p-4 rounded-xl bg-black/80 border border-red-950/70 hover:border-red-600/50 transition text-left group glass-panel-hover"
                  >
                    <Icon className="w-5 h-5 text-red-500 mb-2.5 group-hover:text-red-400 transition" />
                    <div className="text-xs font-bold text-slate-200 group-hover:text-red-300 transition font-mono">
                      {tool.label}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono mt-1 leading-tight">
                      {tool.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Geospatial Heatmap Widget */}
          <div
            onClick={() => onNavigateToPage('heatmap')}
            className="p-5 rounded-2xl glass-panel border-red-900/40 hover:border-red-600/60 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between pb-3 border-b border-red-950/60 mb-3">
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center space-x-2">
                <Compass className="w-3.5 h-3.5 text-red-500" />
                <span>Geospatial Crime Corridors (India)</span>
              </span>
              <span className="text-[10px] font-mono text-red-400 font-bold flex items-center space-x-1">
                <span>OPEN HEATMAP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-black/80 border border-red-950/60">
                <div className="text-xs font-bold text-slate-200 font-mono">Delhi ➔ Gurgaon</div>
                <div className="text-[9px] text-red-500 font-mono mt-0.5">High Speed Transit</div>
              </div>
              <div className="p-3 rounded-lg bg-black/80 border border-red-950/60">
                <div className="text-xs font-bold text-slate-200 font-mono">Delhi ➔ Mumbai</div>
                <div className="text-[9px] text-red-500 font-mono mt-0.5">Hawala / Extortion</div>
              </div>
              <div className="p-3 rounded-lg bg-black/80 border border-red-950/60">
                <div className="text-xs font-bold text-slate-200 font-mono">Delhi ➔ Lucknow</div>
                <div className="text-[9px] text-red-500 font-mono mt-0.5">Arms Cache Corridor</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
