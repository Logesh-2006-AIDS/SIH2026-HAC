"use client";

import React, { useState } from "react";
import { Network, Activity, ZoomIn, ZoomOut, Shield, Sparkles, Filter } from "lucide-react";

export default function KnowledgeGraphPage() {
  const [selectedEntity, setSelectedEntity] = useState<string | null>("P001");
  const [scannedNode, setScannedNode] = useState<string | null>(null);

  const mockEntities = [
    { id: "P001", name: "Ravi Kumar", type: "central", role: "Primary Syndicate Kingpin", x: 480, y: 280, risk: 96 },
    { id: "P002", name: "Vikram Singh", type: "highRisk", role: "Hawala Logistics Coordinator", x: 670, y: 310, risk: 88 },
    { id: "ACC-4490", name: "HDFC A/C 9912", type: "suspicious", role: "Layering Account", x: 740, y: 190, risk: 78 },
    { id: "PH-9921", name: "+91-98110-XXXXX", type: "device", role: "Burner SIM (VoIP Linked)", x: 310, y: 190, risk: 65 },
    { id: "ORG-08", name: "Apex Global Logistics", type: "organization", role: "Shell Front Corporation", x: 380, y: 440, risk: 72 },
    { id: "VEH-101", name: "Black Toyota Fortuner", type: "device", role: "Surveillance / Transit Vehicle", x: 260, y: 360, risk: 58 },
    { id: "ACC-8890", name: "Axis A/C 4402", type: "suspicious", role: "Mule Cash-Out Target", x: 590, y: 460, risk: 82 },
  ];

  const mockEdges = [
    { from: "P001", to: "P002", label: "Direct Syndicate Command", colorA: "#c084fc", colorB: "#f87171" },
    { from: "P002", to: "ACC-4490", label: "₹3,72,400 Transfer", colorA: "#f87171", colorB: "#fbbf24" },
    { from: "P001", to: "PH-9921", label: "18 Calls (CDR)", colorA: "#c084fc", colorB: "#38bdf8" },
    { from: "P001", to: "ORG-08", label: "100% Beneficiary", colorA: "#c084fc", colorB: "#34d399" },
    { from: "ORG-08", to: "VEH-101", label: "Registered Owner", colorA: "#34d399", colorB: "#38bdf8" },
    { from: "ORG-08", to: "ACC-8890", label: "₹85,000 Hawala Payout", colorA: "#34d399", colorB: "#fbbf24" },
  ];

  const activeFocus = scannedNode || selectedEntity;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 space-y-3">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between bg-black/60 border border-[rgba(217,170,61,0.25)] rounded-xl px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#f59e0b] animate-pulse" />
          <span className="font-mono text-xs font-bold text-[#f1ebdd]">
            CASE 101 • Dynamic Force Threat Map (SVG Next.js Routing)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[rgba(217,170,61,0.15)] border border-[rgba(217,170,61,0.35)] text-[#d9aa3d] text-xs font-bold hover:brightness-110">
            <Filter size={13} />
            <span>All Ties</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-bold hover:brightness-110">
            <Activity size={13} />
            <span>Trace Red String</span>
          </button>
        </div>
      </div>

      {/* Main SVG Interactive Graph Area */}
      <div className="flex-1 relative rounded-2xl border border-[rgba(217,170,61,0.25)] bg-[#070a12] overflow-hidden shadow-2xl flex flex-col select-none">
        
        {/* Tactical Grid Background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(30, 58, 95, 0.45) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(30, 58, 95, 0.45) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        <svg className="w-full h-full min-h-[460px] cursor-grab active:cursor-grabbing">
          <defs>
            {mockEdges.map((e, i) => (
              <linearGradient
                key={`grad-${i}`}
                id={`grad-${e.from}-${e.to}`}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={e.colorA} stopOpacity="0.9" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="100%" stopColor={e.colorB} stopOpacity="0.9" />
              </linearGradient>
            ))}
          </defs>

          {/* Edges */}
          {mockEdges.map((e, idx) => {
            const p1 = mockEntities.find((n) => n.id === e.from);
            const p2 = mockEntities.find((n) => n.id === e.to);
            if (!p1 || !p2) return null;

            const isConnected = activeFocus === e.from || activeFocus === e.to;
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            return (
              <g key={idx} className="transition-opacity duration-300" style={{ opacity: activeFocus && !isConnected ? 0.15 : 1 }}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={`url(#grad-${e.from}-${e.to})`}
                  strokeWidth={isConnected ? 3.5 : 2}
                  strokeDasharray="6, 5"
                  className="animate-edge-flow"
                />

                {/* Energy Pulse Packet */}
                <circle r={isConnected ? 4 : 2.5} fill="#ffffff">
                  <animateMotion
                    path={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                    dur={isConnected ? "1.8s" : "3.2s"}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Badge along the line */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x={-e.label.length * 3.4 - 6}
                    y={-9}
                    width={e.label.length * 6.8 + 12}
                    height={18}
                    rx={5}
                    fill="rgba(7, 10, 18, 0.95)"
                    stroke={isConnected ? "#f59e0b" : "rgba(255, 255, 255, 0.18)"}
                    strokeWidth={1}
                  />
                  <text
                    y={3.5}
                    textAnchor="middle"
                    fill={isConnected ? "#fbbf24" : "#94a3b8"}
                    fontSize={9}
                    fontFamily="sans-serif"
                    fontWeight={700}
                  >
                    {e.label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Nodes */}
          {mockEntities.map((node) => {
            const isSelected = selectedEntity === node.id;
            const isScanned = scannedNode === node.id;
            const isHub = node.type === "central";
            const radius = isHub ? 28 : 20;

            const color =
              node.type === "central"
                ? "#c084fc"
                : node.type === "highRisk"
                ? "#f87171"
                : node.type === "suspicious"
                ? "#fbbf24"
                : node.type === "organization"
                ? "#34d399"
                : "#38bdf8";

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setScannedNode(node.id)}
                onMouseLeave={() => setScannedNode(null)}
                onClick={() => setSelectedEntity(node.id)}
                className="cursor-pointer"
              >
                {/* Radar Ripple on Hover/Select */}
                {(isScanned || isSelected || isHub) && (
                  <circle r={radius} fill="none" stroke={color} className="animate-radar pointer-events-none" />
                )}

                {/* Glowing Outer Ring */}
                <circle
                  r={radius}
                  fill="#0f172a"
                  stroke={isSelected ? "#ffffff" : color}
                  strokeWidth={isSelected ? 4 : 2.5}
                  className={isHub ? "animate-focal-glow" : ""}
                />

                {/* Center Core Dot */}
                <circle r={4} fill={isSelected ? "#ffffff" : color} />

                {/* Sub-label Underneath */}
                <g transform={`translate(0, ${radius + 15})`}>
                  <rect
                    x={-node.name.length * 3.4 - 8}
                    y={-10}
                    width={node.name.length * 6.8 + 16}
                    height={20}
                    rx={6}
                    fill="rgba(7, 10, 18, 0.95)"
                    stroke={isSelected || isScanned ? color : "rgba(255, 255, 255, 0.16)"}
                    strokeWidth={1}
                  />
                  <text
                    y={3.5}
                    textAnchor="middle"
                    fill={isSelected || isScanned ? "#ffffff" : "#e2e8f0"}
                    fontSize={10.5}
                    fontFamily="sans-serif"
                    fontWeight={700}
                  >
                    {node.name}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="border-t border-white/10 bg-[#070b14]/95 px-6 py-2.5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-[#f3e8ff]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#a855f7]" /> Central Suspect
            </span>
            <span className="flex items-center gap-1.5 text-[#fee2e2]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> High-Risk Suspect
            </span>
            <span className="flex items-center gap-1.5 text-[#fef3c7]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> Mule / Account
            </span>
            <span className="flex items-center gap-1.5 text-[#e0f2fe]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#38bdf8]" /> Phone / Device
            </span>
            <span className="flex items-center gap-1.5 text-[#d1fae5]">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#10b981]" /> Shell Corp
            </span>
          </div>

          <div className="text-[10px] text-[#8a948c] flex items-center gap-1">
            <Sparkles size={12} className="text-[#f59e0b]" />
            <span>Hover node for radar scan • Client-side Next.js Navigation Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
