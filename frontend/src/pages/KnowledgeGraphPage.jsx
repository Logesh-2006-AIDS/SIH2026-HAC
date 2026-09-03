import React, { useState, useEffect } from 'react';
import {
  Share2,
  Search,
  Users,
  Target,
  GitMerge,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Download,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Car,
  FileText,
  MapPin,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import CytoscapeGraph from '../components/CytoscapeGraph.jsx';

export default function KnowledgeGraphPage({ selectedEntityProp, onNavigateToEntity }) {
  // Graph data state
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [centerPerson, setCenterPerson] = useState('Vikram Singh');
  const [expansionHops, setExpansionHops] = useState(1);
  const [loading, setLoading] = useState(true);

  // Two-Person Relationship Analysis State
  const [personA, setPersonA] = useState('Vikram Singh');
  const [personB, setPersonB] = useState('Ravi Kumar');
  const [analyzingPath, setAnalyzingPath] = useState(false);
  const [pathAnalysisResult, setPathAnalysisResult] = useState(null);
  const [isPathMode, setIsPathMode] = useState(false);

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // View mode tabs: 'focused', 'twoperson', 'full'
  const [viewMode, setViewMode] = useState('focused');

  // Fetch focused ego-network for a person
  const fetchPersonNetwork = async (personId, hops = 1) => {
    setLoading(true);
    setIsPathMode(false);
    setPathAnalysisResult(null);
    try {
      const res = await fetch(`/api/v1/graph/person-network?person_id=${encodeURIComponent(personId)}&hops=${hops}`);
      if (res.ok) {
        const data = await res.json();
        setGraphData({ nodes: data.nodes || [], edges: data.edges || [] });
        setCenterPerson(personId);
        setExpansionHops(hops);
        if (data.center_node) {
          setSelectedEntity(data.center_node);
        }
      }
    } catch (err) {
      console.error('Error fetching person network:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (selectedEntityProp?.name || selectedEntityProp?.id) {
      const id = selectedEntityProp.name || selectedEntityProp.id;
      fetchPersonNetwork(id, 1);
    } else {
      fetchPersonNetwork('Vikram Singh', 1);
    }
  }, [selectedEntityProp]);

  // Autocomplete search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/graph/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
        if (res.ok) {
          setSearchResults(await res.json());
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Two-Person Connection Analysis
  const handleAnalyzeConnection = async (src = personA, tgt = personB) => {
    if (!src || !tgt) return;
    setAnalyzingPath(true);
    setIsPathMode(true);
    setViewMode('twoperson');
    try {
      const res = await fetch(`/api/v1/graph/path-analysis?source=${encodeURIComponent(src)}&target=${encodeURIComponent(tgt)}`);
      if (res.ok) {
        const data = await res.json();
        setPathAnalysisResult(data);
        if (data.found && data.path_nodes?.length > 0) {
          // Render only path nodes and path edges on canvas for zero clutter!
          setGraphData({
            nodes: data.path_nodes,
            edges: data.path_edges
          });
          setCenterPerson(src);
        }
      }
    } catch (err) {
      console.error('Connection analysis error:', err);
    } finally {
      setAnalyzingPath(false);
    }
  };

  // Expand +1 hop
  const handleExpandHops = () => {
    const nextHop = Math.min(3, expansionHops + 1);
    fetchPersonNetwork(centerPerson, nextHop);
  };

  // Node selection handler
  const handleNodeSelect = (node) => {
    setSelectedEntity(node);
  };

  // Double click handler on canvas
  const handleNodeDoubleClick = (node) => {
    if (node?.name || node?.id) {
      fetchPersonNetwork(node.name || node.id, 1);
    }
  };

  // Download 2-Person PDF report
  const handleDownloadConnectionPdf = () => {
    const src = pathAnalysisResult?.source || personA;
    const tgt = pathAnalysisResult?.target || personB;
    window.open(`/api/v1/reports/connection-pdf?source=${encodeURIComponent(src)}&target=${encodeURIComponent(tgt)}`, '_blank');
  };

  // Demo Presets for Quick Jury Evaluation
  const demoPresets = [
    { label: 'Vikram Singh ➔ Ravi Kumar', pA: 'Vikram Singh', pB: 'Ravi Kumar', desc: 'Direct Burner Phone & Extortion Cell' },
    { label: 'Vikram Singh ➔ Priya Nair', pA: 'Vikram Singh', pB: 'Priya Nair', desc: 'Hawala Remittance Wire Channel' },
    { label: 'Ravi Kumar ➔ Deepak Verma', pA: 'Ravi Kumar', pB: 'Deepak Verma', desc: 'Getaway Vehicle & Logistics Transit' },
    { label: 'Lawrence Bishnoi ➔ Rohit Godara', pA: 'Lawrence Bishnoi', pB: 'Rohit Godara', desc: 'Interstate Syndicate Command' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Person-Centric Header Banner */}
      <div className="p-6 rounded-2xl glass-panel-elevated relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase">
              <Share2 className="w-3.5 h-3.5" />
              <span>PERSON-CENTRIC INVESTIGATION & RELATIONSHIP DISCOVERY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1 font-mono">
              NATIONAL CRIMINAL <span className="text-red-500 glow-text-red">KNOWLEDGE GRAPH</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono">
              Select any person to view only their relevant connections. Trace multi-hop connection paths between two suspects with explainable evidence citations.
            </p>
          </div>

          {/* Quick PDF Action */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadConnectionPdf}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs font-mono transition flex items-center space-x-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] border border-red-500/40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT JUDICIAL REPORT (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* CORE TOOLBAR: 1. Person Search Bar + 2. Two-Person Relationship Tracer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Search Bar (5 cols) */}
        <div className="lg:col-span-5 relative">
          <div className="p-4 rounded-2xl glass-panel border-red-900/40 space-y-2">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 flex items-center space-x-1.5">
              <Search className="w-3.5 h-3.5 text-red-500" />
              <span>Find Person / Entity (Search & Focus)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search suspect name, phone, vehicle, case ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full bg-black/90 text-xs text-slate-100 px-3.5 py-2.5 rounded-xl border border-red-950/80 focus:border-red-600 focus:outline-none font-mono placeholder:text-slate-600"
              />

              {/* Autocomplete Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#080204] border border-red-800/60 rounded-xl shadow-2xl z-40 overflow-hidden max-h-64 overflow-y-auto divide-y divide-red-950/50">
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        fetchPersonNetwork(item.name || item.id, 1);
                        setSearchQuery('');
                        setShowSearchResults(false);
                      }}
                      className="p-2.5 hover:bg-red-950/40 cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-200 font-mono">{item.name || item.id}</div>
                        <div className="text-[9px] text-red-400 font-mono uppercase">{item.label}</div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">Focus Node ➔</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Two-Person Connection Analyzer (7 cols) */}
        <div className="lg:col-span-7">
          <div className="p-4 rounded-2xl glass-panel border-red-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 flex items-center space-x-1.5">
                <GitMerge className="w-3.5 h-3.5 text-red-500" />
                <span>Relationship Between Two Persons (Path Tracer)</span>
              </label>
              <span className="text-[9px] font-mono text-slate-500">EXPLAINABLE FORENSIC PATH</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Person A (e.g. Vikram Singh)"
                  value={personA}
                  onChange={(e) => setPersonA(e.target.value)}
                  className="w-full bg-black/90 text-xs text-slate-100 px-3 py-2 rounded-xl border border-red-950/80 focus:border-red-600 focus:outline-none font-mono"
                />
              </div>
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Person B (e.g. Ravi Kumar)"
                  value={personB}
                  onChange={(e) => setPersonB(e.target.value)}
                  className="w-full bg-black/90 text-xs text-slate-100 px-3 py-2 rounded-xl border border-red-950/80 focus:border-red-600 focus:outline-none font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  onClick={() => handleAnalyzeConnection(personA, personB)}
                  disabled={analyzingPath || !personA || !personB}
                  className="w-full h-full py-2 px-3 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs font-mono transition flex items-center justify-center space-x-1 shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-red-500/40 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-red-300" />
                  <span>Analyze</span>
                </button>
              </div>
            </div>

            {/* Quick Demo Presets Bar */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pt-1">
              <span className="text-[9px] font-mono text-slate-500 shrink-0">JURY PRESETS:</span>
              {demoPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPersonA(preset.pA);
                    setPersonB(preset.pB);
                    handleAnalyzeConnection(preset.pA, preset.pB);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-black/80 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-red-950 text-[9px] font-mono transition shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar (Focus, Expand +1 Hop, Reset) */}
      <div className="p-3 rounded-xl glass-panel border-red-900/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">ACTIVE CENTER:</span>
          <span className="px-2.5 py-0.5 rounded-lg bg-red-950 text-red-400 border border-red-700 font-bold">
            {centerPerson}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{graphData.nodes.length} Visible Nodes ({expansionHops}-Hop Ego Network)</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExpandHops}
            className="px-3 py-1.5 rounded-lg bg-black/80 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-red-950 transition flex items-center space-x-1"
            title="Expand +1 Hop Neighborhood"
          >
            <span>Expand (+1 Hop)</span>
            <ChevronRight className="w-3 h-3" />
          </button>

          <button
            onClick={() => fetchPersonNetwork('Vikram Singh', 1)}
            className="px-3 py-1.5 rounded-lg bg-black/80 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-red-950 transition"
          >
            Reset Focus
          </button>
        </div>
      </div>

      {/* Main Grid: Graph Canvas (8 cols) + Side Explain Connection Dossier (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Focused Graph Visualization (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <CytoscapeGraph
            nodes={graphData.nodes}
            edges={graphData.edges}
            centerNodeId={centerPerson}
            highlightedPathNodes={pathAnalysisResult?.path_nodes || []}
            highlightedPathEdges={pathAnalysisResult?.path_edges || []}
            animatePath={isPathMode}
            onNodeSelect={handleNodeSelect}
            onNodeDoubleClick={handleNodeDoubleClick}
            height="560px"
          />
        </div>

        {/* Right: Explain Connection / Entity Dossier (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* If in Two-Person Path Mode -> Render Explain Connection Dossier */}
          {isPathMode && pathAnalysisResult ? (
            <div className="p-5 rounded-2xl glass-panel-elevated border-red-900/50 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-red-950/80">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-red-500" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                    Connection Explanation & Evidence
                  </h3>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                  {pathAnalysisResult.degrees_of_separation}-HOP PATH
                </span>
              </div>

              {/* Relationship Diagram Chain */}
              <div className="p-3 rounded-xl bg-black/90 border border-red-900/60 font-mono text-[10px] text-red-300 space-y-1">
                <span className="text-[8px] uppercase text-slate-500 block font-bold">Relationship Chain:</span>
                <div className="leading-relaxed font-bold">
                  {pathAnalysisResult.diagram}
                </div>
              </div>

              {/* Natural Language Investigation Narrative */}
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                {pathAnalysisResult.narrative}
              </p>

              {/* Step-by-Step Evidence Dossier */}
              <div className="space-y-2.5 pt-2 border-t border-red-950/60">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                  Step-by-Step Evidence Records:
                </span>

                {pathAnalysisResult.steps?.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/80 border border-red-950/60 space-y-1.5 font-mono text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200 font-bold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span>{step.from_node} ➔ {step.to_node}</span>
                      </span>
                      <span className="text-[8px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                        {step.verification_status}
                      </span>
                    </div>

                    <div className="text-red-400 font-bold text-[9px]">
                      RELATION: {step.relation} ({step.confidence}% CONFIDENCE)
                    </div>

                    <div className="text-slate-400 text-[9px] leading-tight">
                      <strong>EVIDENCE:</strong> {step.evidence_source} • {step.evidence_details}
                    </div>
                  </div>
                ))}
              </div>

              {/* Export PDF Button */}
              <button
                onClick={handleDownloadConnectionPdf}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold font-mono text-xs flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-red-500/40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Relationship Report (PDF)</span>
              </button>
            </div>
          ) : (
            /* Selected Node Inspector Dossier */
            <div className="p-5 rounded-2xl glass-panel border-red-900/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-red-950/80">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-red-500" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                    Focused Entity Dossier
                  </h3>
                </div>
                {selectedEntity?.is_center && (
                  <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                    CENTER NODE
                  </span>
                )}
              </div>

              {selectedEntity ? (
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">IDENTIFIED NAME</span>
                    <div className="text-base font-bold text-slate-100">{selectedEntity.name || selectedEntity.id}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-black/80 border border-red-950">
                      <span className="text-[9px] text-slate-500 block">CATEGORY</span>
                      <span className="text-red-400 font-bold text-[10px]">{selectedEntity.label || selectedEntity.type}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/80 border border-red-950">
                      <span className="text-[9px] text-slate-500 block">THREAT INDEX</span>
                      <span className="text-red-500 font-black text-sm">{selectedEntity.threat_index || selectedEntity.threat_score || 94}/100</span>
                    </div>
                  </div>

                  {selectedEntity.aliases?.length > 0 && (
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block mb-1">KNOWN ALIASES</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedEntity.aliases.map((a, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-black text-slate-300 border border-red-950 text-[10px]">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions on Node */}
                  <div className="pt-3 border-t border-red-950/60 space-y-2">
                    <button
                      onClick={() => fetchPersonNetwork(selectedEntity.name || selectedEntity.id, 1)}
                      className="w-full py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-700/60 text-xs font-bold transition flex items-center justify-center space-x-1.5"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Make Center & Focus Subgraph</span>
                    </button>

                    <button
                      onClick={() => {
                        setPersonA(centerPerson);
                        setPersonB(selectedEntity.name || selectedEntity.id);
                        handleAnalyzeConnection(centerPerson, selectedEntity.name || selectedEntity.id);
                      }}
                      className="w-full py-2 rounded-xl bg-black/80 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-red-950 text-xs font-bold transition flex items-center justify-center space-x-1.5"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>Trace Path to Center Node</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500 font-mono">
                  Select any node on the graph to inspect evidence and trace relationships.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
