"use client";

import React from "react";
import { BarChart3, ShieldAlert, Award, ArrowUpRight } from "lucide-react";

export default function KeyEntitiesPage() {
  const topEntities = [
    { id: "P001", name: "Ravi Kumar", betweenness: 0.89, degree: 14, role: "Syndicate Kingpin", status: "Primary Target" },
    { id: "P002", name: "Vikram Singh", betweenness: 0.74, degree: 11, role: "Logistics Coordinator", status: "Arrest Issued" },
    { id: "ORG-08", name: "Apex Global Logistics", betweenness: 0.68, degree: 9, role: "Money Laundering Front", status: "Under Freeze" },
    { id: "ACC-4490", name: "HDFC A/C 9912", betweenness: 0.59, degree: 8, role: "Layering Mule Account", status: "Flagged" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-lg font-bold text-[#F1EBDD] flex items-center gap-2">
            <BarChart3 className="text-[#D9AA3D]" size={20} />
            <span>Key & Bridge Entities Analysis</span>
          </h1>
          <p className="text-xs text-[#8a948c] mt-0.5">
            Graph centrality algorithms (Betweenness, PageRank, Degree) identifying pivotal syndicate nodes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {topEntities.map((e, idx) => (
          <div key={idx} className="rounded-xl border border-[rgba(217,170,61,0.3)] bg-black/50 p-4 space-y-2 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#D9AA3D]">RANK #{idx + 1}</span>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 rounded">
                Score: {Math.round(e.betweenness * 100)}%
              </span>
            </div>
            <div className="font-bold text-sm text-[#F1EBDD]">{e.name}</div>
            <div className="text-xs text-[#a6b0aa]">{e.role}</div>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-[#8a948c]">
              <span>Degree: {e.degree} ties</span>
              <span className="text-[#4ade80]">{e.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
