import React, { useRef, useEffect, useState } from 'react';
import cytoscape from 'cytoscape';
import { ZoomIn, ZoomOut, RefreshCw, Layout, Eye, Search, Layers, Filter } from 'lucide-react';

export default function CytoscapeGraph({
  nodes = [],
  edges = [],
  onNodeSelect,
  selectedNodeId,
  height = "560px",
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

      let color = '#94a3b8';
      if (n.label === 'SUSPECT_PERSON' || n.label === 'Person') color = '#ef4444';
      else if (n.label === 'PERSON') color = '#f97316';
      else if (n.label === 'PHONE_NUMBER' || n.label === 'Phone') color = '#06b6d4';
      else if (n.label === 'VEHICLE_NUMBER' || n.label === 'Vehicle') color = '#a855f7';
      else if (n.label === 'LOCATION' || n.label === 'Location') color = '#10b981';
      else if (n.label === 'CRIMINAL_ORGANIZATION' || n.label === 'Organization') color = '#f43f5e';
      else if (n.label === 'FIR_RECORD' || n.label === 'Case') color = '#3b82f6';
      else if (n.label === 'LEGAL_SECTION' || n.label === 'LegalSection') color = '#eab308';
      else if (n.label === 'FINANCIAL_AMOUNT' || n.label === 'Financial') color = '#14b8a6';

      cyElements.push({
        group: 'nodes',
        data: {
          id: n.id,
          label: n.name || n.id,
          type: n.label,
          threat: n.threat_score || n.threat_index || 0,
          color: color,
          raw: n
        }
      });
    });

    const activeNodeIds = new Set(cyElements.map((e) => e.data.id));

    // Filter edges
    edges.forEach((edge, i) => {
      if (activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target)) {
        const isAiSuggested = edge.properties?.is_ai_suggested || edge.type?.includes('SUGGESTED');
        cyElements.push({
          group: 'edges',
          data: {
            id: `edge_${i}_${edge.source}_${edge.target}`,
            source: edge.source,
            target: edge.target,
            label: edge.type,
            isAi: isAiSuggested,
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
            'font-family': 'Inter, sans-serif',
            'font-size': '11px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-background-color': '#070b14',
            'text-background-opacity': 0.75,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'width': 28,
            'height': 28,
            'border-width': 2,
            'border-color': 'rgba(255,255,255,0.4)',
            'transition-property': 'background-color, border-color, width, height',
            'transition-duration': '0.2s'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#00f0ff',
            'width': 36,
            'height': 36,
            'shadow-blur': 25,
            'shadow-color': '#00f0ff',
            'shadow-opacity': 0.8
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': 'rgba(100, 116, 139, 0.4)',
            'target-arrow-color': 'rgba(100, 116, 139, 0.6)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': '9px',
            'color': '#94a3b8',
            'text-background-color': '#0b0f19',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px',
            'text-rotation': 'autorotate'
          }
        },
        {
          selector: 'edge[?isAi]',
          style: {
            'line-style': 'dashed',
            'line-color': '#a855f7',
            'target-arrow-color': '#a855f7',
            'width': 2
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#00f0ff',
            'target-arrow-color': '#00f0ff',
            'width': 3
          }
        }
      ],
      layout: {
        name: currentLayout,
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 40
      }
    });

    // Node click listener
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (onNodeSelect) {
        onNodeSelect(node.data('raw'));
      }
    });

    cyRef.current = cy;

    // Focus on specific node if provided
    if (selectedNodeId) {
      const targetNode = cy.getElementById(selectedNodeId);
      if (targetNode.length) {
        targetNode.select();
        cy.animate({
          center: { eles: targetNode },
          zoom: 1.6,
          duration: 400
        });
      }
    }

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [nodes, edges, currentLayout, filterType, searchQuery, selectedNodeId]);

  const handleZoom = (factor) => {
    if (!cyRef.current) return;
    const newZoom = cyRef.current.zoom() * factor;
    cyRef.current.zoom(newZoom);
  };

  const handleFit = () => {
    if (cyRef.current) cyRef.current.fit(40);
  };

  return (
    <div className="relative w-full rounded-2xl glass-panel border border-slate-800 overflow-hidden shadow-2xl flex flex-col" style={{ height }}>
      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Search */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 shadow-lg">
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <input
            type="text"
            placeholder="Search graph entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none w-36 sm:w-52 font-mono"
          />
        </div>

        {/* Layout & Filter Controls */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-lg">
          {/* Layout Selector */}
          <select
            value={currentLayout}
            onChange={(e) => setCurrentLayout(e.target.value)}
            className="bg-slate-800 text-[11px] text-slate-200 px-2 py-1 rounded-lg border border-slate-700 focus:outline-none font-mono cursor-pointer"
          >
            <option value="cose">CoSE Physics</option>
            <option value="concentric">Concentric Hierarchy</option>
            <option value="circle">Circular Ring</option>
            <option value="breadthfirst">Breadthfirst Tree</option>
            <option value="grid">Grid</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 text-[11px] text-slate-200 px-2 py-1 rounded-lg border border-slate-700 focus:outline-none font-medium cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="SUSPECT_PERSON">Suspects</option>
            <option value="PHONE_NUMBER">Phones</option>
            <option value="VEHICLE_NUMBER">Vehicles</option>
            <option value="CRIMINAL_ORGANIZATION">Syndicates</option>
            <option value="LOCATION">Locations</option>
            <option value="FIR_RECORD">Cases</option>
          </select>

          {/* Zoom Buttons */}
          <button onClick={() => handleZoom(1.2)} className="p-1 rounded bg-slate-800 text-slate-300 hover:text-cyan-400">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleZoom(0.8)} className="p-1 rounded bg-slate-800 text-slate-300 hover:text-cyan-400">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleFit} className="p-1 rounded bg-slate-800 text-slate-300 hover:text-cyan-400">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cytoscape Canvas Container */}
      <div ref={containerRef} className="flex-1 w-full h-full bg-[#070b14]" />

      {/* Bottom Legend */}
      <div className="p-2.5 bg-slate-950/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono px-4">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-red-500"></span><span>Suspect</span></span>
          <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span><span>Phone</span></span>
          <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span><span>Vehicle</span></span>
          <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span>Location</span></span>
          <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span><span>Syndicate</span></span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-slate-400">Solid: <strong>Verified</strong></span>
          <span className="text-purple-400">Dashed: <strong>AI-Suggested</strong></span>
        </div>
      </div>
    </div>
  );
}
