"use client";

import React from "react";
import { AlertTriangle, ShieldCheck, Flame, ArrowRight } from "lucide-react";

export default function SuspiciousPatternsPage() {
  const patterns = [
    { title: "Circular Hawala Layering Ring", risk: "CRITICAL", entities: 4, desc: "Fund circulation detected between 4 accounts returning 92% of original principal within 48h." },
    { title: "Burner SIM Burst Activity Before Heist", risk: "HIGH", entities: 3, desc: "Synchronized call spikes detected between DL and MH tower locations 2 hours prior to incident." },
    { title: "Shell Company Co-Director Overlap", risk: "HIGH", entities: 5, desc: "Single nominal director associated with 3 offshore shell entities receiving unexplained cash deposits." },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-lg font-bold text-[#F1EBDD] flex items-center gap-2">
            <AlertTriangle className="text-[#D9AA3D]" size={20} />
            <span>Suspicious Pattern Detection Engine</span>
          </h1>
          <p className="text-xs text-[#8a948c] mt-0.5">
            Automated graph typology detection for smurfing, layering rings, and burner SIM clusters.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {patterns.map((p, idx) => (
          <div key={idx} className="rounded-xl border border-white/10 bg-black/50 p-4 flex items-center justify-between hover:border-[#D9AA3D]/50 transition backdrop-blur-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold text-red-400 bg-red-950/60 border border-red-500/40 px-2 py-0.5 rounded">
                  {p.risk}
                </span>
                <h3 className="font-bold text-sm text-[#F1EBDD]">{p.title}</h3>
              </div>
              <p className="text-xs text-[#a6b0aa] max-w-2xl">{p.desc}</p>
            </div>
            <button className="px-3.5 py-1.5 rounded-lg bg-[rgba(217,170,61,0.15)] border border-[rgba(217,170,61,0.35)] text-[#d9aa3d] text-xs font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer">
              <span>Isolate Subgraph</span>
              <ArrowRight size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
