import React, { useRef, useEffect, useState } from 'react';
import cytoscape from 'cytoscape';
import { ZoomIn, ZoomOut, RefreshCw, Layout, Eye, Search, Layers, Filter, Sparkles } from 'lucide-react';

export default function CytoscapeGraph({
  nodes = [],
  edges = [],
  onNodeSelect,
  onNodeDoubleClick,
  selectedNodeId,
  centerNodeId,
  highlightedPathNodes = [],
  highlightedPathEdges = [],
  animatePath = false,
  height = "580px",
  focusMode = false
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [currentLayout, setCurrentLayout] = useState('cose');
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize and update Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    // Build Cytoscape elements format
    const cyElements = [];

    // Filter nodes
    nodes.forEach((n) => {
      if (filterType !== 'ALL' && n.label !== filterType) return;
      if (searchQuery && !n.name?.toLowerCase().includes(searchQuery.toLowerCase()) && !n.id?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }

      let color = '#71717a';
      if (n.label === 'SUSPECT_PERSON' || n.label === 'Person') color = '#ef4444';
      else if (n.label === 'PERSON') color = '#dc2626';
      else if (n.label === 'PHONE_NUMBER' || n.label === 'Phone') color = '#f87171';
      else if (n.label === 'VEHICLE_NUMBER' || n.label === 'Vehicle') color = '#fb7185';
      else if (n.label === 'LOCATION' || n.label === 'Location') color = '#991b1b';
      else if (n.label === 'CRIMINAL_ORGANIZATION' || n.label === 'Organization') color = '#b91c1c';
      else if (n.label === 'FIR_RECORD' || n.label === 'Case') color = '#ef4444';
      else if (n.label === 'LEGAL_SECTION' || n.label === 'LegalSection') color = '#7f1d1d';
      else if (n.label === 'FINANCIAL_AMOUNT' || n.label === 'Financial') color = '#fca5a5';

      const isPathNode = highlightedPathNodes.some(p => p.id === n.id || p.name === n.name || p.id === n.name);
      const isCenter = n.id === centerNodeId || n.is_center;

      cyElements.push({
        group: 'nodes',
        data: {
          id: n.id,
          label: n.name || n.id,
          type: n.label,
          threat: n.threat_score || n.threat_index || 0,
          color: color,
          isCenter: isCenter,
          isPath: isPathNode,
          raw: n
        }
      });
    });

    const activeNodeIds = new Set(cyElements.map((e) => e.data.id));

    // Filter edges
    edges.forEach((edge, i) => {
      if (activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target)) {
        const isAiSuggested = edge.properties?.is_ai_suggested || edge.type?.includes('SUGGESTED');
        const isPathEdge = highlightedPathEdges.some(
          pe => (pe.source === edge.source && pe.target === edge.target) || (pe.source === edge.target && pe.target === edge.source)
        );

        cyElements.push({
          group: 'edges',
          data: {
            id: `edge_${i}_${edge.source}_${edge.target}`,
            source: edge.source,
            target: edge.target,
            label: edge.type,
            isAi: isAiSuggested,
            isPath: isPathEdge,
            raw: edge
          }
        });
      }
    });

    // Destroy prior instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // Create Cytoscape instance
    const cy = cytoscape({
      container: containerRef.current,
      elements: cyElements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-family': 'Plus Jakarta Sans, sans-serif',
            'font-size': '11px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-background-color': '#050102',
            'text-background-opacity': 0.85,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'width': 28,
            'height': 28,
            'border-width': 2,
            'border-color': 'rgba(239,68,68,0.5)',
            'transition-property': 'background-color, border-color, width, height, shadow-blur, shadow-opacity',
            'transition-duration': '0.3s'
          }
        },
        {
          selector: 'node[?isCenter]',
          style: {
            'width': 44,
            'height': 44,
            'border-width': 4,
            'border-color': '#ff1a1a',
            'shadow-blur': 35,
            'shadow-color': '#ff1a1a',
            'shadow-opacity': 1.0,
            'font-size': '13px'
          }
        },
        {
          selector: 'node[?isPath]',
          style: {
            'width': 38,
            'height': 38,
            'border-width': 3.5,
            'border-color': '#ef4444',
            'shadow-blur': 25,
            'shadow-color': '#ef4444',
            'shadow-opacity': 0.95
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#ef4444',
            'width': 40,
            'height': 40,
            'shadow-blur': 30,
            'shadow-color': '#ef4444',
            'shadow-opacity': 0.95
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': 'rgba(239, 68, 68, 0.22)',
            'target-arrow-color': 'rgba(239, 68, 68, 0.4)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': '9px',
            'color': '#f87171',
            'text-background-color': '#050102',
            'text-background-opacity': 0.85,
            'text-background-padding': '2px',
            'text-rotation': 'autorotate',
            'transition-property': 'width, line-color, shadow-blur',
            'transition-duration': '0.3s'
          }
        },
        {
          selector: 'edge[?isPath]',
          style: {
            'width': 3.5,
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'shadow-blur': 15,
            'shadow-color': '#ef4444',
            'shadow-opacity': 0.9
          }
        },
        {
          selector: 'edge[?isAi]',
          style: {
            'line-style': 'dashed',
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'width': 2
          }
        }
      ],
      layout: {
        name: currentLayout,
        animate: true,
        animationDuration: 500,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: 120,
        nodeRepulsion: 6500,
        nodeOverlap: 20
      }
    });

    // Event listeners
    cy.on('tap', 'node', (evt) => {
      const nodeData = evt.target.data();
      if (onNodeSelect) {
        onNodeSelect(nodeData.raw);
      }
    });

    // Double click to expand
    let lastTapTime = 0;
    cy.on('tap', 'node', (evt) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapTime;
      if (tapLength < 300 && tapLength > 0) {
        // Double click detected!
        if (onNodeDoubleClick) {
          onNodeDoubleClick(evt.target.data().raw);
        }
      }
      lastTapTime = currentTime;
    });

    cyRef.current = cy;

    // Progressive Path Animation Sequence
    if (animatePath && highlightedPathNodes.length >= 2) {
      highlightedPathNodes.forEach((node, idx) => {
        setTimeout(() => {
          const cyNode = cy.$(`node[id = "${node.id}"]`);
          if (cyNode.length > 0) {
            cyNode.animate({
              style: {
                'width': 44,
                'height': 44,
                'border-color': '#ff1a1a',
                'shadow-blur': 40
              },
              duration: 350
            });
          }
        }, idx * 400);
      });
    }

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [nodes, edges, filterType, searchQuery, currentLayout, highlightedPathNodes, centerNodeId, animatePath]);

  // Layout switcher
  const handleLayoutChange = (layoutName) => {
    setCurrentLayout(layoutName);
    if (cyRef.current) {
      cyRef.current.layout({
        name: layoutName,
        animate: true,
        animationDuration: 500,
        idealEdgeLength: 120,
        nodeRepulsion: 6500
      }).run();
    }
  };

  const handleZoomIn = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current && cyRef.current.fit(null, 40);

  return (
    <div className="relative w-full rounded-2xl glass-panel-elevated overflow-hidden border border-red-900/40 shadow-2xl bg-black/90">
      {/* HUD Control Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        {/* Layout Switcher */}
        <div className="flex items-center bg-black/80 backdrop-blur-md rounded-xl p-1 border border-red-950/60">
          {['cose', 'concentric', 'circle', 'grid'].map((layout) => (
            <button
              key={layout}
              onClick={() => handleLayoutChange(layout)}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-lg transition ${
                currentLayout === layout
                  ? 'bg-red-950 text-red-400 border border-red-700 shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {layout}
            </button>
          ))}
        </div>

        {/* Entity Type Filter */}
        <div className="hidden sm:flex items-center bg-black/80 backdrop-blur-md rounded-xl p-1 border border-red-950/60">
          {['ALL', 'SUSPECT_PERSON', 'PHONE_NUMBER', 'VEHICLE_NUMBER', 'CRIMINAL_ORGANIZATION'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded transition ${
                filterType === type
                  ? 'bg-red-950 text-red-400 border border-red-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {type.replace('SUSPECT_', '').replace('_NUMBER', '').replace('CRIMINAL_', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Zoom & Fit HUD (Top Right) */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-1.5 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-red-950/60 shadow-lg">
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg bg-black hover:bg-red-950 text-slate-300 hover:text-red-400 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg bg-black hover:bg-red-950 text-slate-300 hover:text-red-400 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleFit}
          className="p-1.5 rounded-lg bg-black hover:bg-red-950 text-slate-300 hover:text-red-400 transition"
          title="Fit to Canvas"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Graph Canvas Container */}
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full bg-[#030102] bg-tactical-grid cursor-grab active:cursor-grabbing select-none"
      />

      {/* Bottom Tactical Legend HUD */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-black/85 backdrop-blur-md border border-red-950/60 text-[10px] font-mono">
        <div className="flex items-center space-x-3 overflow-x-auto py-0.5">
          <span className="flex items-center space-x-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
            <span>Suspect Person</span>
          </span>
          <span className="flex items-center space-x-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
            <span>Phone Node</span>
          </span>
          <span className="flex items-center space-x-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <span>Vehicle Node</span>
          </span>
          <span className="flex items-center space-x-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
            <span>Location Node</span>
          </span>
          <span className="flex items-center space-x-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>Organization</span>
          </span>
        </div>

        <div className="text-[9px] text-red-500/80 font-bold hidden md:block">
          DOUBLE-CLICK NODE TO EXPAND +1 HOP • CLICK TO FOCUS
        </div>
      </div>
    </div>
  );
}
