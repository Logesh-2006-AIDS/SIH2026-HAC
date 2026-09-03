import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RefreshCw, Filter, Search, Eye, Sparkles, Layers } from 'lucide-react';

const NODE_COLORS = {
  SUSPECT_PERSON: '#ef4444',
  PERSON: '#f97316',
  ALIAS: '#fb923c',
  PHONE_NUMBER: '#06b6d4',
  VEHICLE_NUMBER: '#a855f7',
  LOCATION: '#10b981',
  CRIMINAL_ORGANIZATION: '#f43f5e',
  FIR_RECORD: '#3b82f6',
  LEGAL_SECTION: '#eab308',
  FINANCIAL_AMOUNT: '#14b8a6',
  DEFAULT: '#94a3b8'
};

export default function KnowledgeGraph({ graphData, onNodeSelect, selectedNode }) {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Initialize simulation nodes with 2D positions
  useEffect(() => {
    if (!graphData?.nodes || graphData.nodes.length === 0) return;

    const width = canvasRef.current?.parentElement?.clientWidth || 800;
    const height = canvasRef.current?.parentElement?.clientHeight || 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const initialNodes = graphData.nodes.map((n, i) => {
      const angle = (i / graphData.nodes.length) * 2 * Math.PI;
      const radius = 120 + Math.random() * 220;
      return {
        ...n,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: n.label === 'SUSPECT_PERSON' || n.label === 'CRIMINAL_ORGANIZATION' ? 14 : 10
      };
    });

    setNodes(initialNodes);
    setEdges(graphData.edges || []);
  }, [graphData]);

  // Force simulation loop
  useEffect(() => {
    let animId;
    let iteration = 0;

    const simulate = () => {
      setNodes((prevNodes) => {
        if (!prevNodes.length) return prevNodes;

        const updated = prevNodes.map((n) => ({ ...n }));
        const nodeMap = new Map(updated.map((n) => [n.id, n]));

        // Repulsion between all nodes
        for (let i = 0; i < updated.length; i++) {
          for (let j = i + 1; j < updated.length; j++) {
            const dx = updated[j].x - updated[i].x;
            const dy = updated[j].y - updated[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < 220) {
              const force = (220 - dist) / dist * 0.4;
              updated[i].x -= dx * force * 0.05;
              updated[i].y -= dy * force * 0.05;
              updated[j].x += dx * force * 0.05;
              updated[j].y += dy * force * 0.05;
            }
          }
        }

        // Attraction along edges
        edges.forEach((edge) => {
          const s = nodeMap.get(edge.source);
          const t = nodeMap.get(edge.target);
          if (s && t) {
            const dx = t.x - s.x;
            const dy = t.y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const desiredDist = 110;
            const force = (dist - desiredDist) * 0.02;
            s.x += dx * force * 0.03;
            s.y += dy * force * 0.03;
            t.x -= dx * force * 0.03;
            t.y -= dy * force * 0.03;
          }
        });

        return updated;
      });

      iteration++;
      if (iteration < 120) {
        animId = requestAnimationFrame(simulate);
      }
    };

    animId = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animId);
  }, [edges]);

  // Draw on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Filtered nodes
    const isVisible = (n) => {
      if (filterType !== 'ALL' && n.label !== filterType) return false;
      if (searchQuery && !n.name?.toLowerCase().includes(searchQuery.toLowerCase()) && !n.id?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    };

    // Draw Edges
    edges.forEach((edge) => {
      const s = nodeMap.get(edge.source);
      const t = nodeMap.get(edge.target);
      if (s && t && isVisible(s) && isVisible(t)) {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);

        const isHighlighted = selectedNode && (selectedNode.id === s.id || selectedNode.id === t.id);
        ctx.strokeStyle = isHighlighted ? '#00f0ff' : 'rgba(100, 116, 139, 0.25)';
        ctx.lineWidth = isHighlighted ? 2.5 : 1;
        ctx.stroke();

        // Edge label (middle)
        if (isHighlighted || transform.k > 1.2) {
          const midX = (s.x + t.x) / 2;
          const midY = (s.y + t.y) / 2;
          ctx.fillStyle = '#94a3b8';
          ctx.font = '9px JetBrains Mono';
          ctx.textAlign = 'center';
          ctx.fillText(edge.type, midX, midY - 4);
        }
      }
    });

    // Draw Nodes
    nodes.forEach((node) => {
      if (!isVisible(node)) return;

      const color = NODE_COLORS[node.label] || NODE_COLORS.DEFAULT;
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;

      // Glow effect for selected/hovered nodes
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 6, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.fill();
      }

      // Main Node Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
      ctx.stroke();

      // Node Label Text
      ctx.fillStyle = '#f8fafc';
      ctx.font = `${isSelected ? 'bold 11px' : '10px'} Inter, sans-serif`;
      ctx.textAlign = 'center';
      const labelText = node.name || node.id;
      ctx.fillText(labelText.length > 18 ? labelText.slice(0, 16) + '…' : labelText, node.x, node.y + node.radius + 13);
    });

    ctx.restore();
  }, [nodes, edges, transform, filterType, searchQuery, selectedNode, hoveredNode]);

  // Mouse Handlers for Drag, Pan & Click
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - transform.x) / transform.k;
    const clickY = (e.clientY - rect.top - transform.y) / transform.k;

    const hitNode = nodes.find((n) => {
      const dx = n.x - clickX;
      const dy = n.y - clickY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 5;
    });

    if (hitNode) {
      setDraggedNode(hitNode);
      if (onNodeSelect) onNodeSelect(hitNode);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - transform.x) / transform.k;
    const clickY = (e.clientY - rect.top - transform.y) / transform.k;

    if (draggedNode) {
      setNodes((prev) =>
        prev.map((n) => (n.id === draggedNode.id ? { ...n, x: clickX, y: clickY } : n))
      );
    } else if (isDragging) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    } else {
      const hit = nodes.find((n) => {
        const dx = n.x - clickX;
        const dy = n.y - clickY;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius + 5;
      });
      setHoveredNode(hit || null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  const handleZoom = (delta) => {
    setTransform((prev) => {
      const newK = Math.max(0.4, Math.min(3.0, prev.k + delta));
      return { ...prev, k: newK };
    });
  };

  const handleResetView = () => {
    setTransform({ x: 0, y: 0, k: 1 });
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col rounded-2xl overflow-hidden glass-panel border border-slate-800">
      {/* Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg">
          <Search className="w-4 h-4 text-cyan-400" />
          <input
            type="text"
            placeholder="Search suspect, vehicle, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none w-48 sm:w-64 font-mono"
          />
        </div>

        {/* Filter Badges & Zoom Buttons */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-lg">
          {/* Entity Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 text-xs text-slate-200 px-2 py-1 rounded-lg border border-slate-700 focus:outline-none font-medium cursor-pointer"
          >
            <option value="ALL">All Nodes ({nodes.length})</option>
            <option value="SUSPECT_PERSON">Suspects & Persons</option>
            <option value="PHONE_NUMBER">Phone Numbers</option>
            <option value="VEHICLE_NUMBER">Vehicles</option>
            <option value="LOCATION">Locations</option>
            <option value="CRIMINAL_ORGANIZATION">Syndicates & Gangs</option>
            <option value="FIR_RECORD">FIR Cases</option>
          </select>

          {/* Zoom controls */}
          <button
            onClick={() => handleZoom(0.2)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.2)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 transition"
            title="Reset Center"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full block"
        />
      </div>

      {/* Legend Bar at Bottom */}
      <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto flex flex-wrap items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 shadow-lg">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Suspect</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>Phone</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span>Vehicle</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Location</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Syndicate</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>FIR Case</span>
          </div>
        </div>

        <div className="pointer-events-auto text-xs font-mono text-slate-400 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
          Nodes: <span className="text-cyan-400 font-bold">{nodes.length}</span> | Edges: <span className="text-purple-400 font-bold">{edges.length}</span>
        </div>
      </div>
    </div>
  );
}
