"use client";

import React from "react";
import { FolderOpen, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function DossiersPage() {
  const cases = [
    { case_number: "101", title: "Armed Robbery & Extortion Syndicate", category: "Extortion & Hawala", entities: 15, status: "ACTIVE INVESTIGATION" },
    { case_number: "102", title: "Cross-Border Cyber Mule Network", category: "Cyber Financial Fraud", entities: 27, status: "ACTIVE INVESTIGATION" },
    { case_number: "103", title: "Illicit Arms Procurement Ring", category: "Organized Arms Trafficking", entities: 18, status: "UNDER SURVEILLANCE" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-lg font-bold text-[#F1EBDD] flex items-center gap-2">
            <FolderOpen className="text-[#D9AA3D]" size={20} />
            <span>Active Case Dossiers</span>
          </h1>
          <p className="text-xs text-[#8a948c] mt-0.5">
            Select a case to inspect evidence graph, suspect profiles, and cross-case connections.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cases.map((c) => (
          <div key={c.case_number} className="rounded-xl border border-[rgba(217,170,61,0.3)] bg-black/50 p-5 space-y-3 flex flex-col justify-between backdrop-blur-md">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#D9AA3D]">CASE #{c.case_number}</span>
                <span className="text-[10px] font-mono text-[#4ade80] bg-green-950/60 border border-green-500/40 px-2 py-0.5 rounded">
                  {c.status}
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#F1EBDD]">{c.title}</h3>
              <p className="text-xs text-[#8a948c] font-mono">{c.category} • {c.entities} Entities</p>
            </div>

            <Link
              href="/dashboard/knowledge-graph"
              className="w-full py-2 px-3 rounded-lg bg-[rgba(217,170,61,0.15)] border border-[rgba(217,170,61,0.35)] text-[#d9aa3d] text-xs font-bold hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer no-underline text-center"
            >
              <span>Launch Knowledge Graph</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
