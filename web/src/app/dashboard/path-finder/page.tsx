"use client";

import React, { useState } from "react";
import { Route, Sparkles, ArrowRight, Shield, Crosshair } from "lucide-react";

export default function PathFinderPage() {
  const [sourceId, setSourceId] = useState("P001");
  const [targetId, setTargetId] = useState("ACC-8890");

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-lg font-bold text-[#F1EBDD] flex items-center gap-2">
            <Route className="text-[#D9AA3D]" size={20} />
            <span>Red-String Path Finder</span>
          </h1>
          <p className="text-xs text-[#8a948c] mt-0.5">
            Identify multi-hop conspiracy, Hawala transfers, and burner phone connections between suspects.
          </p>
        </div>
      </div>

      {/* Path Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/50 border border-[rgba(217,170,61,0.3)] p-4 rounded-xl backdrop-blur-md">
        <div>
          <label className="text-[10px] font-mono uppercase text-[#8a948c] block mb-1">Source Entity</label>
          <input
            type="text"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-[#F1EBDD] font-mono outline-none focus:border-[#D9AA3D]"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase text-[#8a948c] block mb-1">Target Entity</label>
          <input
            type="text"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-[#F1EBDD] font-mono outline-none focus:border-[#D9AA3D]"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            className="w-full bg-gradient-to-r from-[#D62828] to-[#991b1b] hover:brightness-110 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Calculate Red-String Chain</span>
          </button>
        </div>
      </div>

      {/* Active Path Visual Result Card */}
      <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-5 flex flex-col justify-start space-y-4 overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D9AA3D]">
            <Crosshair size={15} />
            <span>PRIMARY EVIDENTIARY TRAIL DETECTED (3 HOPS)</span>
          </div>
          <span className="text-[11px] font-mono text-[#4ade80] bg-green-950/60 border border-green-500/40 px-2.5 py-0.5 rounded">
            94% Evidentiary Strength
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 py-3">
          <div className="rounded-xl border border-purple-500/50 bg-purple-950/40 px-4 py-3">
            <div className="text-[10px] text-purple-300 font-mono">KINGPIN</div>
            <div className="text-xs font-bold text-[#F1EBDD]">Ravi Kumar (P001)</div>
          </div>
          <ArrowRight className="text-[#D9AA3D]" size={16} />
          <div className="rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-3">
            <div className="text-[10px] text-red-300 font-mono">CO-CONSPIRATOR</div>
            <div className="text-xs font-bold text-[#F1EBDD]">Vikram Singh (P002)</div>
          </div>
          <ArrowRight className="text-[#D9AA3D]" size={16} />
          <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/40 px-4 py-3">
            <div className="text-[10px] text-emerald-300 font-mono">SHELL CORP</div>
            <div className="text-xs font-bold text-[#F1EBDD]">Apex Global Logistics</div>
          </div>
          <ArrowRight className="text-[#D9AA3D]" size={16} />
          <div className="rounded-xl border border-amber-500/50 bg-amber-950/40 px-4 py-3">
            <div className="text-[10px] text-amber-300 font-mono">MULE CASH-OUT</div>
            <div className="text-xs font-bold text-[#F1EBDD]">Axis A/C 4402</div>
          </div>
        </div>
      </div>
    </div>
  );
}
