"use client";

import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, ShieldAlert } from "lucide-react";

export default function IngestionPage() {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-lg font-bold text-[#F1EBDD] flex items-center gap-2">
            <Upload className="text-[#D9AA3D]" size={20} />
            <span>Multi-Modal Evidence Ingestion Pipeline</span>
          </h1>
          <p className="text-xs text-[#8a948c] mt-0.5">
            Ingest FIR records, CDR telecom CSVs, bank Hawala statements, and digital forensic transcripts.
          </p>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-3 transition-colors ${
          dragActive ? "border-[#D9AA3D] bg-[#D9AA3D]/10" : "border-white/15 bg-black/40"
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-[#D9AA3D]/20 border border-[#D9AA3D]/40 flex items-center justify-center text-[#D9AA3D]">
          <Upload size={24} />
        </div>
        <div>
          <h3 className="font-bold text-sm text-[#F1EBDD]">Drag & Drop Forensic Evidence Files Here</h3>
          <p className="text-xs text-[#8a948c] mt-1">Supports PDF, CSV, JSON, TXT (FIR Reports, CDR Logs, Bank Records)</p>
        </div>
        <button className="bg-[#D9AA3D] text-[#080a08] font-bold text-xs py-2 px-5 rounded-lg hover:brightness-110 cursor-pointer shadow-md">
          Browse Local Files
        </button>
      </div>
    </div>
  );
}
