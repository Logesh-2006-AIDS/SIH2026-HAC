"use client";

import React from "react";
import { FileText, Download, Printer, CheckCircle2 } from "lucide-react";

export default function ReportPage() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-lg font-bold text-[#F1EBDD] flex items-center gap-2">
            <FileText className="text-[#D9AA3D]" size={20} />
            <span>Court-Ready Forensic Investigation Dossier</span>
          </h1>
          <p className="text-xs text-[#8a948c] mt-0.5">
            Auto-synthesized prosecution report with graph topology exhibits and cryptographic evidence hashes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-[#F1EBDD] hover:bg-white/10 cursor-pointer">
            <Printer size={14} />
            <span>Print Dossier</span>
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D9AA3D] text-[#080a08] font-bold text-xs hover:brightness-110 cursor-pointer shadow-md">
            <Download size={14} />
            <span>Export PDF Brief</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-black/50 border border-white/10 rounded-xl p-6 overflow-y-auto space-y-4 font-mono text-xs text-[#F1EBDD] scrollbar-thin backdrop-blur-md">
        <div className="text-center pb-4 border-b border-white/10">
          <div className="text-[#D9AA3D] font-bold text-sm">CENTRAL FORENSIC CRIME INTELLIGENCE UNIT</div>
          <div className="text-[#8a948c] text-[10px] mt-1">CONFIDENTIAL PROSECUTION BRIEF • CASE #101</div>
        </div>

        <div className="space-y-2">
          <div className="text-[#D9AA3D] font-bold">1. EXECUTIVE SUMMARY & SYNDICATE STRUCTURE</div>
          <p className="text-[#a6b0aa] leading-relaxed">
            Multi-source intelligence graph demonstrates a coordinated extortion and Hawala laundering syndicate operating across NCT Delhi and Mumbai. Primary target Ravi Kumar (P001) directs financial conduits via Vikram Singh (P002) utilizing front corporation Apex Global Logistics.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-[#D9AA3D] font-bold">2. PRIMARY EVIDENTIARY EXHIBITS</div>
          <ul className="list-disc list-inside space-y-1 text-[#a6b0aa]">
            <li>Exhibit A-1: 18 CDR calls exchanged prior to extortion transactions.</li>
            <li>Exhibit B-4: ₹3,72,400 Axis Bank transfer ledger linked to mule account 4402.</li>
            <li>Exhibit C-2: Vehicle tracking logs for Toyota Fortuner (DL-3C-8812) registered to front entity.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
