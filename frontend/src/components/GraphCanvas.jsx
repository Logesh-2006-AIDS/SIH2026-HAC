import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ZoomIn, ZoomOut, Shield, DollarSign, Building2, User, Phone, MapPin, 
  Activity, ChevronRight, X, Sparkles, Filter, Route, Car 
} from 'lucide-react';
import clsx from 'clsx';

// ── COLOR & THEME DEFINITIONS (100% HARMONIZED WITH PLATFORM UI) ─────────────
const ENTITY_THEMES = {
  central: {
    id: 'central',
    label: 'Central Kingpin / Target',
    stroke: '#D9AA3D',
    glow: '#D9AA3D',
    fill: '#241D0D',
    darkFill: '#141006',
    text: '#F1EBDD',
    badgeBg: 'rgba(217, 170, 61, 0.22)',
    badgeBorder: 'rgba(217, 170, 61, 0.55)',
    icon: User,
  },
  highRisk: {
    id: 'highRisk',
    label: 'High-Risk Suspect',
    stroke: '#D62828',
    glow: '#D62828',
    fill: '#2B0D0D',
    darkFill: '#170606',
    text: '#FEE2E2',
    badgeBg: 'rgba(214, 40, 40, 0.22)',
    badgeBorder: 'rgba(214, 40, 40, 0.55)',
    icon: User,
  },
  suspicious: {
    id: 'suspicious',
    label: 'Suspicious / Mule Account',
    stroke: '#F59E0B',
    glow: '#F59E0B',
    fill: '#291B07',
    darkFill: '#170F03',
    text: '#FEF3C7',
    badgeBg: 'rgba(245, 158, 11, 0.22)',
    badgeBorder: 'rgba(245, 158, 11, 0.55)',
    icon: DollarSign,
  },
  device: {
    id: 'device',
    label: 'Device / Phone / Vehicle',
    stroke: '#38BDF8',
    glow: '#0EA5E9',
    fill: '#08253B',
    darkFill: '#031421',
    text: '#E0F2FE',
    badgeBg: 'rgba(56, 189, 248, 0.22)',
    badgeBorder: 'rgba(56, 189, 248, 0.55)',
    icon: Phone,
  },
  organization: {
    id: 'organization',
    label: 'Organization / Shell Co',
    stroke: '#5E9F68',
    glow: '#5E9F68',
    fill: '#0C2B16',
    darkFill: '#051A0C',
    text: '#D1FAE5',
    badgeBg: 'rgba(94, 159, 104, 0.22)',
    badgeBorder: 'rgba(94, 159, 104, 0.55)',
    icon: Building2,
  },
  location: {
    id: 'location',
    label: 'Location / Scene',
    stroke: '#E11D48',
    glow: '#E11D48',
    fill: '#2B0B14',
    darkFill: '#17040A',
    text: '#FFE4E6',
    badgeBg: 'rgba(225, 29, 72, 0.22)',
    badgeBorder: 'rgba(225, 29, 72, 0.55)',
    icon: MapPin,
  },
  normal: {
    id: 'normal',
    label: 'Normal / Corroborative',
    stroke: '#A6B0AA',
    glow: '#8A948C',
    fill: '#151A17',
    darkFill: '#0C100D',
    text: '#F1EBDD',
    badgeBg: 'rgba(166, 176, 170, 0.2)',
    badgeBorder: 'rgba(166, 176, 170, 0.4)',
    icon: Shield,
  },
};

const EDGE_THEMES = {
  FINANCIAL: {
    stroke: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.85)',
    dash: '6, 4',
    label: 'Hawala / Transfer',
  },
  COMMUNICATION: {
    stroke: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.85)',
    dash: '5, 4',
    label: 'CDR Call / SMS',
  },
  CRIME: {
    stroke: '#D62828',
    glow: 'rgba(214, 40, 40, 0.9)',
    dash: 'none',
    label: 'Conspiracy / Crime',
  },
  VEHICLE: {
    stroke: '#FB923C',
    glow: 'rgba(251, 146, 60, 0.85)',
    dash: '6, 4',
    label: 'Vehicle Logistics',
  },
  ASSOCIATE: {
    stroke: '#D9AA3D',
    glow: 'rgba(217, 170, 61, 0.75)',
    dash: '4, 4',
    label: 'Syndicate Link',
  },
};

function inferNodeTheme(node) {
  if (!node) return 'normal';
  const type = (node.type || node.category || '').toUpperCase();
  const id = String(node.id || node.entity_id || '').toUpperCase();
  const role = String(node.role || '').toLowerCase();
  const name = String(node.name || node.label || '').toLowerCase();

  if (
    node.is_primary_suspect || 
    role.includes('primary') || 
    role.includes('kingpin') || 
    role.includes('boss') || 
    id === 'P001' || 
    id === 'P002' || 
    name.includes('ravi kumar') || 
    name.includes('vikram singh')
  ) {
    return 'central';
  }

  if (type === 'ORGANIZATION' || type === 'COMPANY' || /ltd|pvt|logistics|enterprises|exchange|jewellers/i.test(name)) {
    return 'organization';
  }

  if (type === 'PHONE' || type === 'VEHICLE' || node.reg_number || (node.number && !node.name) || /dl-\d|mh-\d|\+91/i.test(id) || /\+91|\d{10}/.test(name)) {
    return 'device';
  }

  if (type === 'FINANCIAL_ACCOUNT' || type === 'ACCOUNT' || type === 'BANK' || node.account_number || /icici|axis|hdfc|account|\d{11}/i.test(name)) {
    return 'suspicious';
  }

  if (type === 'LOCATION' || (node.lat != null && node.lon != null)) {
    return 'location';
  }

  if (type === 'PERSON' || type === 'SUSPECT' || role.includes('accused') || role.includes('suspect') || (node.risk_score && node.risk_score > 55)) {
    return 'highRisk';
  }

  return 'normal';
}

function inferEdgeCategory(rel) {
  const r = String(rel || '').toUpperCase();
  if (r.includes('TRANSFER') || r.includes('FINANCE') || r.includes('HAWALA') || r.includes('MONEY')) return 'FINANCIAL';
  if (r.includes('CALL') || r.includes('COMMUNICAT') || r.includes('PHONE') || r.includes('CDR')) return 'COMMUNICATION';
  if (r.includes('ACCUSED') || r.includes('CONSPIR') || r.includes('GANG')) return 'CRIME';
  if (r.includes('OPERATES') || r.includes('VEHICLE') || r.includes('DRIVES')) return 'VEHICLE';
  return 'ASSOCIATE';
}

export default function GraphCanvas({
  nodes = [],
  edges = [],
  selectedEntity = null,
  onSelectEntity = () => {},
  selectedEdge = null,
  onSelectEdge = () => {},
  highlightedPath = [],
  layoutName = 'cose',
  isLoading = false,
  focusEntityId = null,
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Pan and Zoom Transformation State
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Interactive Hover/Tap "Scan" State
  const [scannedNodeId, setScannedNodeId] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [nodePositions, setNodePositions] = useState({});

  // Connected Neighbors Mapping for Instant Scan Highlighting
  const adjacency = useMemo(() => {
    const map = {};
    nodes.forEach(n => { map[n.id] = new Set(); });
    edges.forEach(e => {
      const src = e.source || e.from_id;
      const tgt = e.target || e.to_id;
      if (src && tgt) {
        if (!map[src]) map[src] = new Set();
        if (!map[tgt]) map[tgt] = new Set();
        map[src].add(tgt);
        map[tgt].add(src);
      }
    });
    return map;
  }, [nodes, edges]);

  // Node by ID lookup map
  const nodeMap = useMemo(() => {
    const m = {};
    nodes.forEach(n => { m[n.id] = n; });
    return m;
  }, [nodes]);

  // Initial Physics Simulation / Force Position Calculation (Spacious Layout)
  useEffect(() => {
    if (!nodes.length) return;

    const width = containerRef.current?.clientWidth || 960;
    const height = containerRef.current?.clientHeight || 620;
    const centerX = width / 2;
    const centerY = height / 2;

    const pos = {};
    const count = nodes.length;

    // Find central hub
    const centralNode = nodes.find(n => inferNodeTheme(n) === 'central') || nodes[0];

    nodes.forEach((n, idx) => {
      const isHub = centralNode && n.id === centralNode.id;
      if (isHub) {
        pos[n.id] = { x: centerX, y: centerY, vx: 0, vy: 0 };
      } else {
        // Distribute in two spacious concentric orbits
        const ring = idx % 2 === 0 ? 210 : 330;
        const angle = (idx / (count - 1 || 1)) * 2 * Math.PI + (idx % 2 === 0 ? 0.25 : -0.35);
        pos[n.id] = {
          x: centerX + Math.cos(angle) * ring + (Math.sin(idx * 4) * 25),
          y: centerY + Math.sin(angle) * (ring * 0.82) + (Math.cos(idx * 4) * 25),
          vx: 0,
          vy: 0,
        };
      }
    });

    // Run 55 iterations of spring / repulsion relaxation for spacious separation
    const nodeIds = nodes.map(n => n.id);
    for (let iter = 0; iter < 55; iter++) {
      // Repulsion between all node pairs
      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          const idA = nodeIds[i];
          const idB = nodeIds[j];
          const pA = pos[idA];
          const pB = pos[idB];
          if (!pA || !pB) continue;

          let dx = pB.x - pA.x;
          let dy = pB.y - pA.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minSeparation = 210;
          if (dist < minSeparation) {
            const force = (minSeparation - dist) / dist * 0.15;
            pA.x -= dx * force;
            pA.y -= dy * force;
            pB.x += dx * force;
            pB.y += dy * force;
          }
        }
      }

      // Spring Attraction along edges
      edges.forEach(e => {
        const src = e.source || e.from_id;
        const tgt = e.target || e.to_id;
        const pA = pos[src];
        const pB = pos[tgt];
        if (!pA || !pB) return;

        let dx = pB.x - pA.x;
        let dy = pB.y - pA.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ideal = 200;
        const force = (dist - ideal) * 0.035;
        pA.x += (dx / dist) * force;
        pA.y += (dy / dist) * force;
        pB.x -= (dx / dist) * force;
        pB.y -= (dy / dist) * force;
      });
    }

    setNodePositions(pos);
  }, [nodes, edges]);

  // Center on Selected / Focused Node
  useEffect(() => {
    const focusId = selectedEntity?.id || focusEntityId;
    if (focusId && nodePositions[focusId]) {
      const p = nodePositions[focusId];
      const width = containerRef.current?.clientWidth || 960;
      const height = containerRef.current?.clientHeight || 620;
      setTransform(prev => ({
        ...prev,
        x: width / 2 - p.x * prev.k,
        y: height / 2 - p.y * prev.k,
      }));
    }
  }, [selectedEntity, focusEntityId]);

  // Mouse Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    const newK = Math.max(0.35, Math.min(3.5, transform.k * zoomFactor));

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setTransform(prev => ({
      k: newK,
      x: mouseX - (mouseX - prev.x) * (newK / prev.k),
      y: mouseY - (mouseY - prev.y) * (newK / prev.k),
    }));
  };

  // Canvas Pan Handlers
  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.id === 'bg-grid') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      }));
    } else if (draggingNodeId) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const canvasX = (e.clientX - rect.left - transform.x) / transform.k;
      const canvasY = (e.clientY - rect.top - transform.y) / transform.k;
      setNodePositions(prev => ({
        ...prev,
        [draggingNodeId]: { x: canvasX, y: canvasY },
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Zoom Controls
  const zoomIn = () => setTransform(prev => ({ ...prev, k: Math.min(3.5, prev.k * 1.25) }));
  const zoomOut = () => setTransform(prev => ({ ...prev, k: Math.max(0.35, prev.k * 0.8) }));
  const fitView = () => setTransform({ x: 0, y: 0, k: 1 });

  // Tap Background -> Reset All Scan & Selection
  const handleBackgroundClick = (e) => {
    if (e.target.tagName === 'svg' || e.target.id === 'bg-grid') {
      setScannedNodeId(null);
      onSelectEntity(null);
      onSelectEdge(null);
    }
  };

  // Determine Active Focus / Scanned Set
  const activeFocusId = scannedNodeId || selectedEntity?.id || focusEntityId;
  const activeNeighbors = activeFocusId && adjacency[activeFocusId] ? adjacency[activeFocusId] : null;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full min-h-[580px] rounded-2xl overflow-hidden border border-[rgba(217,170,61,0.3)] bg-[#090D0A] shadow-2xl flex flex-col select-none"
    >
      
      {/* ── HIGH-TECH TACTICAL GRID OVERLAY (UI HARMONIZED) ───────────────── */}
      <div
        id="bg-grid"
        onClick={handleBackgroundClick}
        className="absolute inset-0 z-0 opacity-40 cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(217, 170, 61, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(217, 170, 61, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '44px 44px',
        }}
      />

      {/* Radial Vignette Matching Platform Dark Green/Ink Palette */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(22, 28, 24, 0.35) 0%, rgba(8, 10, 8, 0.98) 100%)',
        }}
      />

      {/* ── TOP STATUS OVERLAY ────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl bg-black/80 border border-[rgba(217,170,61,0.35)] px-3.5 py-1.5 backdrop-blur-md text-xs shadow-lg">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#D9AA3D] animate-pulse" />
          <span className="font-mono text-[11px] font-bold text-[#F1EBDD]">
            {nodes.length} Entities • {edges.length} Relationships
          </span>
        </div>

        {activeFocusId && (
          <div className="flex items-center gap-2 rounded-xl bg-[rgba(217,170,61,0.18)] border border-[rgba(217,170,61,0.5)] px-3 py-1.5 text-xs font-mono font-bold text-[#D9AA3D] backdrop-blur-md shadow-lg animate-fade-in">
            <Activity size={12} className="text-[#D9AA3D] animate-spin" />
            <span>ENERGY FLOW / SCAN: {activeFocusId}</span>
          </div>
        )}
      </div>

      {/* ── FLOATING ZOOM & DOCK CONTROLS ─────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/80 border border-[rgba(217,170,61,0.35)] p-1.5 rounded-xl backdrop-blur-md shadow-xl">
        <button
          type="button"
          onClick={zoomIn}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#A6B0AA] hover:text-[#F1EBDD] hover:bg-white/10 transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>

        <button
          type="button"
          onClick={zoomOut}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#A6B0AA] hover:text-[#F1EBDD] hover:bg-white/10 transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>

        <button
          type="button"
          onClick={fitView}
          className="flex h-8 px-2.5 items-center justify-center rounded-lg text-xs font-mono font-bold text-[#D9AA3D] hover:bg-[#D9AA3D]/15 transition cursor-pointer"
          title="Reset View"
        >
          FIT
        </button>
      </div>

      {/* ── INTERACTIVE SVG GRAPH RENDERER ───────────────────────────────── */}
      <svg
        ref={svgRef}
        onClick={handleBackgroundClick}
        className="relative z-10 w-full h-full min-h-[520px] cursor-grab active:cursor-grabbing"
      >
        <defs>
          {/* SVG Glow Filters for Node Rings */}
          <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#D9AA3D" floodOpacity="0.95" />
            <feDropShadow dx="0" dy="0" stdDeviation="15" floodColor="#D9AA3D" floodOpacity="0.5" />
          </filter>

          <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#D62828" floodOpacity="0.95" />
            <feDropShadow dx="0" dy="0" stdDeviation="13" floodColor="#D62828" floodOpacity="0.5" />
          </filter>

          <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#F59E0B" floodOpacity="0.9" />
            <feDropShadow dx="0" dy="0" stdDeviation="13" floodColor="#F59E0B" floodOpacity="0.45" />
          </filter>

          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#38BDF8" floodOpacity="0.9" />
            <feDropShadow dx="0" dy="0" stdDeviation="13" floodColor="#38BDF8" floodOpacity="0.45" />
          </filter>

          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#5E9F68" floodOpacity="0.9" />
          </filter>

          <filter id="glow-rose" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#E11D48" floodOpacity="0.9" />
          </filter>

          {/* ── DYNAMIC COLOR-PASS LINEAR GRADIENTS FOR EDGES ──────────────── */}
          {edges.map((edge, idx) => {
            const srcId = edge.source || edge.from_id;
            const tgtId = edge.target || edge.to_id;
            const p1 = nodePositions[srcId];
            const p2 = nodePositions[tgtId];
            if (!p1 || !p2) return null;

            const srcNode = nodeMap[srcId] || { id: srcId };
            const tgtNode = nodeMap[tgtId] || { id: tgtId };
            const srcTheme = ENTITY_THEMES[inferNodeTheme(srcNode)] || ENTITY_THEMES.normal;
            const tgtTheme = ENTITY_THEMES[inferNodeTheme(tgtNode)] || ENTITY_THEMES.normal;

            const gradId = `edge-flow-grad-${srcId}-${tgtId}-${idx}`;

            return (
              <linearGradient
                key={gradId}
                id={gradId}
                gradientUnits="userSpaceOnUse"
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
              >
                <stop offset="0%" stopColor={srcTheme.stroke} stopOpacity="0.95" />
                <stop offset="50%" stopColor="#F1EBDD" stopOpacity="0.85" />
                <stop offset="100%" stopColor={tgtTheme.stroke} stopOpacity="0.95" />
              </linearGradient>
            );
          })}
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          
          {/* 1. EDGES LAYER — WITH BI-DIRECTIONAL COLOR PASSING & FLOW PARTICLES */}
          {edges.map((edge, idx) => {
            const srcId = edge.source || edge.from_id;
            const tgtId = edge.target || edge.to_id;
            const p1 = nodePositions[srcId];
            const p2 = nodePositions[tgtId];
            if (!p1 || !p2) return null;

            const category = inferEdgeCategory(edge.type || edge.relation);
            const edgeTheme = EDGE_THEMES[category] || EDGE_THEMES.ASSOCIATE;
            const gradId = `edge-flow-grad-${srcId}-${tgtId}-${idx}`;

            // Highlight logic during Scan/Select mode
            const isConnectedToActive = activeFocusId && (srcId === activeFocusId || tgtId === activeFocusId);
            const isEdgeDimmed = activeFocusId && !isConnectedToActive;
            const isPathEdge = highlightedPath.length >= 2 && highlightedPath.includes(srcId) && highlightedPath.includes(tgtId);

            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            // Optional amount / value or label
            const valueLabel = edge.properties?.amount || edge.amount || edge.type?.replace(/_/g, ' ');

            return (
              <g
                key={edge.id || `edge-${srcId}-${tgtId}-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEntity(null);
                  onSelectEdge(edge);
                }}
                className="cursor-pointer transition-opacity duration-300"
                style={{ opacity: isEdgeDimmed ? 0.12 : 1 }}
              >
                {/* Wider Invisible Hit Target */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="transparent"
                  strokeWidth={16}
                />

                {/* Base Subtle Underlying Glow Track */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={`url(#${gradId})`}
                  strokeWidth={isConnectedToActive ? 4.5 : isPathEdge ? 5 : 2}
                  strokeOpacity={isConnectedToActive ? 0.95 : 0.45}
                  style={{
                    filter: isConnectedToActive ? `drop-shadow(0 0 8px ${edgeTheme.glow})` : undefined,
                  }}
                />

                {/* Flowing Dashed Gradient Line (Color Passing Through Effect) */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={`url(#${gradId})`}
                  strokeWidth={isConnectedToActive ? 3.2 : isPathEdge ? 3.5 : 1.8}
                  strokeDasharray={isPathEdge ? 'none' : '6, 5'}
                  className="animate-edge-flow"
                  style={{
                    transition: 'all 0.25s ease',
                  }}
                />

                {/* Flowing Energy Transit Particle Passing Between Nodes */}
                {(isConnectedToActive || idx % 2 === 0) && (
                  <circle r={isConnectedToActive ? 3.5 : 2.5} fill="#FFFFFF">
                    <animateMotion
                      path={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                      dur={isConnectedToActive ? '1.8s' : '3.2s'}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Small Value / Relationship Badge along Edge */}
                {valueLabel && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x={-valueLabel.length * 3.4 - 7}
                      y={-9}
                      width={valueLabel.length * 6.8 + 14}
                      height={18}
                      rx={6}
                      fill="rgba(10, 13, 10, 0.96)"
                      stroke={isConnectedToActive ? '#D9AA3D' : 'rgba(217, 170, 61, 0.25)'}
                      strokeWidth={1}
                    />
                    <text
                      y={3.5}
                      textAnchor="middle"
                      fill={isConnectedToActive ? '#D9AA3D' : '#A6B0AA'}
                      fontSize={9}
                      fontFamily='"Plus Jakarta Sans", sans-serif'
                      fontWeight={700}
                    >
                      {valueLabel}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 2. NODES LAYER */}
          {nodes.map((node) => {
            const p = nodePositions[node.id];
            if (!p) return null;

            const themeKey = inferNodeTheme(node);
            const theme = ENTITY_THEMES[themeKey] || ENTITY_THEMES.normal;
            const isHub = themeKey === 'central';
            const isSelected = selectedEntity && (selectedEntity.id === node.id || selectedEntity.number === node.id);
            const isScanned = scannedNodeId === node.id;
            const isDirectNeighbor = activeNeighbors && activeNeighbors.has(node.id);
            const isNodeActive = isScanned || isSelected || (activeFocusId === node.id) || isDirectNeighbor;
            const isNodeDimmed = activeFocusId && !isNodeActive;

            const radius = isHub ? 27 : themeKey === 'organization' ? 22 : 19;
            const labelText = node.name || node.reg_number || node.number || node.account_number || node.id;
            const shortLabel = labelText.length > 18 ? `${labelText.substring(0, 16)}…` : labelText;

            return (
              <g
                key={node.id}
                transform={`translate(${p.x}, ${p.y})`}
                onMouseEnter={() => setScannedNodeId(node.id)}
                onMouseLeave={() => setScannedNodeId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEdge(null);
                  onSelectEntity(node);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingNodeId(node.id);
                }}
                className="cursor-pointer transition-all duration-300"
                style={{ opacity: isNodeDimmed ? 0.15 : 1 }}
              >
                
                {/* ── RADAR SCAN EXPANDING RIPPLE ANIMATION ───────────────── */}
                {(isScanned || isSelected || isHub) && (
                  <circle
                    r={radius}
                    fill="none"
                    stroke={theme.stroke}
                    className="animate-radar pointer-events-none"
                  />
                )}

                {/* Secondary Orbital Ring on Active Kingpin */}
                {isHub && (
                  <circle
                    r={radius + 10}
                    fill="none"
                    stroke={theme.stroke}
                    strokeDasharray="5, 4"
                    className="animate-spin pointer-events-none opacity-45"
                    style={{ transformOrigin: '0 0', animationDuration: '12s' }}
                  />
                )}

                {/* Outer Glowing Ring Border */}
                <circle
                  r={radius}
                  fill={theme.fill}
                  stroke={isSelected ? '#FFFFFF' : theme.stroke}
                  strokeWidth={isSelected ? 4 : isHub ? 3.5 : 2.5}
                  filter={`url(#glow-${themeKey === 'central' ? 'gold' : themeKey === 'highRisk' ? 'red' : themeKey === 'suspicious' ? 'amber' : themeKey === 'organization' ? 'green' : themeKey === 'location' ? 'rose' : 'cyan'})`}
                  className={clsx(
                    "transition-transform duration-200",
                    isScanned ? "scale-125" : "",
                    isHub ? "animate-focal-glow" : ""
                  )}
                />

                {/* Inner Dark Core */}
                <circle
                  r={radius - 5}
                  fill={theme.darkFill}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={1}
                />

                {/* Center Core Indicator Dot */}
                <circle
                  r={3.5}
                  fill={isSelected ? '#FFFFFF' : theme.stroke}
                />

                {/* ── CRISP MONOSPACE / SANS LABEL UNDERNEATH ─────────────── */}
                <g transform={`translate(0, ${radius + 14})`}>
                  <rect
                    x={-shortLabel.length * 3.4 - 8}
                    y={-10}
                    width={shortLabel.length * 6.8 + 16}
                    height={20}
                    rx={6}
                    fill="rgba(10, 13, 10, 0.96)"
                    stroke={isNodeActive ? theme.stroke : 'rgba(217, 170, 61, 0.28)'}
                    strokeWidth={isNodeActive ? 1.5 : 1}
                    className="shadow-lg"
                  />
                  <text
                    y={3.5}
                    textAnchor="middle"
                    fill={isNodeActive ? '#FFFFFF' : theme.text}
                    fontSize={10.5}
                    fontFamily='"Plus Jakarta Sans", "JetBrains Mono", sans-serif'
                    fontWeight={700}
                    className="pointer-events-none"
                  >
                    {shortLabel}
                  </text>
                </g>
              </g>
            );
          })}

        </g>
      </svg>

      {/* ── BOTTOM THREAT MAP LEGEND ──────────────────────────────────────── */}
      <div className="relative z-20 shrink-0 border-t border-[rgba(217,170,61,0.25)] bg-[#090D0A]/95 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        
        {/* Node Entity Types Legend */}
        <div className="flex flex-wrap items-center gap-5 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#D9AA3D] border border-[#F1EBDD] shadow-md shadow-[#D9AA3D]/60" />
            <span className="text-[#F1EBDD] font-bold">Central Kingpin</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#D62828] border border-[#FCA5A5] shadow-md shadow-[#D62828]/60" />
            <span className="text-[#FEE2E2]">High-Risk Suspect</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#F59E0B] border border-[#FCD34D] shadow-md shadow-[#F59E0B]/50" />
            <span className="text-[#FEF3C7]">Suspicious / Mule Account</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#38BDF8] border border-[#7DD3FC]" />
            <span className="text-[#E0F2FE]">Device / Phone / Vehicle</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-[#5E9F68] border border-[#86EFAC]" />
            <span className="text-[#D1FAE5]">Organization / Shell Co</span>
          </div>
        </div>

        {/* Scan Interaction Hint */}
        <div className="text-[10px] text-[#A6B0AA] font-mono hidden md:flex items-center gap-1">
          <Sparkles size={12} className="text-[#D9AA3D]" />
          <span>Hover / Tap node for live radar scan • Tap background to reset</span>
        </div>
      </div>

      {/* ── SLIDE-OUT FORENSIC NODE DETAIL SIDE PANEL ──────────────────────── */}
      {selectedEntity && (
        <div className="absolute top-4 right-4 bottom-16 w-84 z-30 rounded-2xl border border-[rgba(217,170,61,0.45)] bg-[#101411]/95 backdrop-blur-xl p-5 shadow-2xl flex flex-col justify-between space-y-4 animate-fade-in text-xs select-text">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${ENTITY_THEMES[inferNodeTheme(selectedEntity)]?.badgeBorder} ${ENTITY_THEMES[inferNodeTheme(selectedEntity)]?.badgeBg}`}>
                  {React.createElement(ENTITY_THEMES[inferNodeTheme(selectedEntity)]?.icon || Shield, { size: 18, className: "text-[#D9AA3D]" })}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#F1EBDD] leading-snug">
                    {selectedEntity.name || selectedEntity.reg_number || selectedEntity.number || selectedEntity.id}
                  </h3>
                  <span className={`inline-block font-mono text-[10px] font-bold px-2 py-0.2 rounded mt-0.5 border ${ENTITY_THEMES[inferNodeTheme(selectedEntity)]?.badgeBorder} ${ENTITY_THEMES[inferNodeTheme(selectedEntity)]?.badgeBg}`}>
                    {ENTITY_THEMES[inferNodeTheme(selectedEntity)]?.label}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectEntity(null)}
                className="text-[#8A948C] hover:text-white p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Entity Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 my-3">
              <div className="rounded-xl bg-black/40 border border-white/5 p-2.5">
                <div className="text-[10px] text-[#8A948C] uppercase font-mono">Entity ID</div>
                <div className="font-mono font-bold text-xs text-[#F1EBDD] mt-0.5">{selectedEntity.id}</div>
              </div>
              <div className="rounded-xl bg-black/40 border border-white/5 p-2.5">
                <div className="text-[10px] text-[#8A948C] uppercase font-mono">Risk Level</div>
                <div className="font-mono font-bold text-xs text-[#D62828] mt-0.5">
                  {selectedEntity.risk_score ? `${selectedEntity.risk_score}% CRITICAL` : 'HIGH ALERT'}
                </div>
              </div>
            </div>

            {/* Role / Description */}
            {selectedEntity.role && (
              <div className="rounded-xl bg-black/30 border border-white/5 p-3 space-y-1">
                <div className="text-[10px] font-bold text-[#D9AA3D] uppercase font-mono">Forensic Role</div>
                <div className="text-xs text-[#C5CFC8]">{selectedEntity.role}</div>
              </div>
            )}

            {/* Connected Relationships List */}
            <div className="mt-3 space-y-2">
              <div className="text-[10px] font-bold text-[#8A948C] uppercase font-mono flex items-center justify-between">
                <span>Direct Network Ties ({adjacency[selectedEntity.id]?.size || 0})</span>
                <span className="text-[#D9AA3D]">RADAR SCANNED</span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                {Array.from(adjacency[selectedEntity.id] || []).map((neighborId) => {
                  const neighborNode = nodes.find(n => n.id === neighborId) || { id: neighborId };
                  return (
                    <div
                      key={neighborId}
                      onClick={() => onSelectEntity(neighborNode)}
                      className="flex items-center justify-between rounded-lg bg-black/40 border border-white/5 p-2 hover:border-[#D9AA3D]/50 hover:bg-[#D9AA3D]/10 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#D9AA3D]" />
                        <span className="font-bold text-xs text-[#F1EBDD] truncate max-w-[150px]">
                          {neighborNode.name || neighborNode.id}
                        </span>
                      </div>
                      <ChevronRight size={13} className="text-[#8A948C]" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectEntity(null)}
              className="flex-1 rounded-xl bg-[#D9AA3D] py-2 text-xs font-bold text-[#080A08] hover:brightness-110 shadow-md transition cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#090D0A]/85 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 rounded-2xl bg-black/70 border border-[#D9AA3D]/40 px-5 py-3 text-xs font-mono text-[#D9AA3D]">
            <Sparkles size={16} className="animate-spin" />
            <span>Rendering High-Precision SVG Threat Graph…</span>
          </div>
        </div>
      )}

    </div>
  );
}
