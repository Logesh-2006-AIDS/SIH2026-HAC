import React, { useState, useEffect } from 'react';
import { BarChart3, Network, Zap, ShieldAlert, GitFork, Users, Search, ArrowRight, Sparkles, AlertTriangle, Layers } from 'lucide-react';
import KnowledgeGraph from './KnowledgeGraph.jsx';

export default function AnalystDashboard({ graphData, onRefreshGraph }) {
  const [centralityList, setCentralityList] = useState([]);
  const [syndicates, setSyndicates] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [shortestPathData, setShortestPathData] = useState(null);
  const [pathQuery, setPathQuery] = useState({ source: 'Ravi Kumar', target: 'Priya Nair' });
  const [isFindingPath, setIsFindingPath] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Fetch analytics
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
        console.error('Error fetching analytics:', err);
      }
    };
    fetchAnalytics();
  }, [graphData]);

  // Shortest Path Finder
  const handleFindPath = async () => {
    if (!pathQuery.source || !pathQuery.target) return;
    setIsFindingPath(true);
    try {
      const res = await fetch(`/api/v1/graph/shortest-path?source=${encodeURIComponent(pathQuery.source)}&target=${encodeURIComponent(pathQuery.target)}`);
      if (res.ok) {
        const data = await res.json();
        setShortestPathData(data);
      }
    } catch (err) {
      console.error('Path error:', err);
    } finally {
      setIsFindingPath(false);
    }
  };

  // AI Copilot Query Engine
  const handleAiAsk = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setIsAiLoading(true);

    setTimeout(() => {
      const q = aiQuery.toLowerCase();
      let answer = '';
      if (q.includes('ravi') || q.includes('ravan')) {
        answer = 'Ravi Kumar (alias Ravan) is identified as a primary syndicate organizer linked to 2 active FIR cases. He operates a black Hyundai Creta (DL01AB1234) and is connected directly to Vikram Singh and Meena Sharma for interstate hawala routing.';
      } else if (q.includes('vikram') || q.includes('viper')) {
        answer = 'Vikram Singh (alias Vicky / Viper) has the highest Betweenness Centrality score (0.64). He functions as the core bridge node connecting North India operatives (Delhi/Gurgaon) to Western cyber cells in Bandra, Mumbai.';
      } else if (q.includes('vehicle') || q.includes('car')) {
        answer = 'Detected 5 high-priority vehicles: DL01AB1234 (Hyundai Creta - Ravi Kumar), HR26DQ5544 (Toyota Fortuner - Vikram Singh), MH02EZ9081 (Mahindra Scorpio - Aarav Mehta).';
      } else {
        answer = `Analysis of ${graphData?.nodes?.length || 0} nodes across the Knowledge Graph shows strong multi-hop connectivity between northern extortion rings and western financial laundering cells. Top recommended investigation lead: Interrogate Vikram Singh for cross-case links.`;
      }
      setAiAnswer(answer);
      setIsAiLoading(false);
    }, 600);
  };

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
              <span>Criminal Network Intelligence & Graph Analytics</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                NEO4J KNOWLEDGE GRAPH
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Betweenness Centrality • Cross-Case Bridge Detection • Syndicate Community Clustering • AI Graph Copilot
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshGraph}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center space-x-2 transition"
        >
          <Network className="w-4 h-4" />
          <span>Refresh Knowledge Graph</span>
        </button>
      </div>

      {/* Main Grid: Interactive Canvas (8 cols) + Intelligence Side Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 2D/3D Force Graph (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="h-[620px] w-full">
            <KnowledgeGraph
              graphData={graphData}
              selectedNode={selectedNode}
              onNodeSelect={(node) => setSelectedNode(node)}
            />
          </div>

          {/* Shortest Path Link Explorer */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <GitFork className="w-4 h-4 text-cyan-400" />
                <span>Degrees of Separation & Shortest Path Investigator</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Multi-Hop Link Discovery</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Source Suspect (e.g. Ravi Kumar)"
                value={pathQuery.source}
                onChange={(e) => setPathQuery({ ...pathQuery, source: e.target.value })}
                className="flex-1 min-w-[180px] bg-slate-900 text-xs text-slate-100 px-3 py-2 rounded-xl border border-slate-700 font-mono focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-slate-500">➔</span>
              <input
                type="text"
                placeholder="Target Suspect (e.g. Priya Nair)"
                value={pathQuery.target}
                onChange={(e) => setPathQuery({ ...pathQuery, target: e.target.value })}
                className="flex-1 min-w-[180px] bg-slate-900 text-xs text-slate-100 px-3 py-2 rounded-xl border border-slate-700 font-mono focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={handleFindPath}
                disabled={isFindingPath}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isFindingPath ? 'Calculating...' : 'Find Connection'}</span>
              </button>
            </div>

            {/* Path Result */}
            {shortestPathData && (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs space-y-2">
                {shortestPathData.found ? (
                  <div>
                    <div className="flex items-center space-x-2 text-cyan-400 font-bold mb-2">
                      <Sparkles className="w-4 h-4" />
                      <span>
                        Found Link with {shortestPathData.degrees_of_separation} Degrees of Separation!
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 font-mono">
                      {shortestPathData.path_nodes.map((node, i) => (
                        <React.Fragment key={i}>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 font-bold">
                            {node}
                          </span>
                          {i < shortestPathData.path_nodes.length - 1 && (
                            <span className="text-cyan-400">➔</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-amber-400 font-mono">
                    No direct connection found between these entities in the current Knowledge Graph.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Centrality Leaderboard & AI Copilot (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Key Suspect Centrality Ranking */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Key Suspect Threat Ranking</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">Centrality AI</span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {centralityList
                .filter((s) => s.label === 'SUSPECT_PERSON' || s.label === 'PERSON')
                .slice(0, 6)
                .map((suspect, idx) => (
                  <div
                    key={suspect.id}
                    onClick={() => setSelectedNode(suspect)}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-red-500/40 cursor-pointer transition shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono flex items-center justify-center text-slate-300">
                          #{idx + 1}
                        </span>
                        <span>{suspect.name}</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                        Threat: {suspect.threat_index}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{suspect.role_hypothesis}</span>
                      <span className="font-mono text-cyan-400">{suspect.degree_connections} Links</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* AI Intelligence Query Assistant */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Investigation Copilot</span>
            </h3>

            <form onSubmit={handleAiAsk} className="space-y-3">
              <textarea
                rows={2}
                placeholder="Ask graph intel (e.g. Who connects Vikram Singh to Bandra West?)..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="w-full bg-slate-900/90 text-xs text-slate-100 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500 font-mono resize-none"
              />
              <button
                type="submit"
                disabled={isAiLoading}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiLoading ? 'Synthesizing Graph...' : 'Query AI Copilot'}</span>
              </button>
            </form>

            {aiAnswer && (
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-slate-200 leading-relaxed font-sans">
                {aiAnswer}
              </div>
            )}
          </div>

          {/* Detected Syndicates & Gangs */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-rose-400" />
              <span>Criminal Syndicate Rings</span>
            </h3>

            <div className="space-y-2">
              {syndicates.map((syn) => (
                <div key={syn.cluster_id} className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">{syn.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold">
                      {syn.threat_level}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-400">
                    Members: {syn.members.slice(0, 3).join(', ')}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
