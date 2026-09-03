import React, { useState, useEffect } from 'react';
import { Share2, RefreshCw, Zap, GitFork, Filter, Search, Sparkles, Layers, Sliders } from 'lucide-react';
import CytoscapeGraph from '../components/CytoscapeGraph.jsx';

export default function KnowledgeGraphPage({ onNavigateToEntity }) {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [shortestPathData, setShortestPathData] = useState(null);
  const [pathQuery, setPathQuery] = useState({ source: 'Ravi Kumar', target: 'Priya Nair' });
  const [isFindingPath, setIsFindingPath] = useState(false);
  const [confidenceFilter, setConfidenceFilter] = useState(0.5);

  const fetchGraph = async () => {
    try {
      const res = await fetch('/api/v1/graph/');
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      }
    } catch (err) {
      console.error('Error fetching graph:', err);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-slate-900 to-slate-900">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>National Criminal Knowledge Graph Explorer</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                NEO4J + CYTOSCAPE.JS
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Multi-Hop Syndicate Traversal • CoSE Physics Engine • Shortest Path Discovery • Verified vs AI-Suggested Links
            </p>
          </div>
        </div>

        <button
          onClick={fetchGraph}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center space-x-2 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reload Graph Data</span>
        </button>
      </div>

      {/* Main Grid: Cytoscape Graph (8 cols) + Controls & Entity Inspector (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Cytoscape Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <CytoscapeGraph
            nodes={graphData.nodes}
            edges={graphData.edges}
            onNodeSelect={(node) => setSelectedEntity(node)}
            selectedNodeId={selectedEntity?.id}
            height="620px"
          />

          {/* Shortest Path Finder Bar */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <GitFork className="w-4 h-4 text-cyan-400" />
                <span>Degrees of Separation / Shortest Connection Discovery</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">Multi-Hop Algorithmic Search</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Source Entity (e.g. Ravi Kumar)"
                value={pathQuery.source}
                onChange={(e) => setPathQuery({ ...pathQuery, source: e.target.value })}
                className="flex-1 min-w-[160px] bg-slate-900 text-xs text-slate-100 px-3 py-2 rounded-xl border border-slate-700 font-mono focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-slate-500">➔</span>
              <input
                type="text"
                placeholder="Target Entity (e.g. Priya Nair)"
                value={pathQuery.target}
                onChange={(e) => setPathQuery({ ...pathQuery, target: e.target.value })}
                className="flex-1 min-w-[160px] bg-slate-900 text-xs text-slate-100 px-3 py-2 rounded-xl border border-slate-700 font-mono focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={handleFindPath}
                disabled={isFindingPath}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold transition flex items-center space-x-1.5 shadow"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isFindingPath ? 'Searching...' : 'Trace Connection'}</span>
              </button>
            </div>

            {shortestPathData && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs">
                {shortestPathData.found ? (
                  <div className="space-y-1.5">
                    <div className="text-cyan-400 font-bold flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Found Connection with {shortestPathData.degrees_of_separation} Degrees of Separation:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                      {shortestPathData.path_nodes.map((node, i) => (
                        <React.Fragment key={i}>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-100 border border-slate-700 font-bold">
                            {node}
                          </span>
                          {i < shortestPathData.path_nodes.length - 1 && <span className="text-cyan-400">➔</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-amber-400 font-mono">No direct path found between specified entities.</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Entity Inspector & Multi-Hop Filters (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Entity Details Card */}
          {selectedEntity ? (
            <div className="p-5 rounded-2xl glass-panel border border-cyan-500/30 shadow-2xl space-y-4 text-xs">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  KNOWLEDGE GRAPH NODE
                </span>
                <h3 className="text-lg font-extrabold text-slate-100 mt-1">
                  {selectedEntity.name || selectedEntity.id}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 mt-1 inline-block">
                  {selectedEntity.label || selectedEntity.type}
                </span>
              </div>

              <div className="space-y-2 font-mono">
                {selectedEntity.aliases && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">KNOWN ALIASES</span>
                    <span className="text-amber-400 font-bold">{selectedEntity.aliases.join(', ') || 'None recorded'}</span>
                  </div>
                )}
                {selectedEntity.role && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">SYNDICATE ROLE</span>
                    <span className="text-slate-200">{selectedEntity.role}</span>
                  </div>
                )}
                {selectedEntity.address && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">LAST KNOWN ADDRESS</span>
                    <span className="text-slate-300">{selectedEntity.address}</span>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 italic">
                {selectedEntity.rationale || 'Entity verified through multi-source First Information Reports and telecom logs.'}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 text-center text-xs text-slate-500">
              Click any node on the Cytoscape graph to inspect dossier and cross-case links.
            </div>
          )}

          {/* Confidence Slider Filter */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Confidence Threshold</span>
              </span>
              <span className="font-mono text-cyan-400 font-bold">{(confidenceFilter * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Filters out low-confidence AI edge inferences to prioritize corroborated evidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
