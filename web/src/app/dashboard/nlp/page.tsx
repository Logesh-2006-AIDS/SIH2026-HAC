"use client";

import React, { useState } from "react";
import { Sparkles, FileText, CheckCircle2 } from "lucide-react";

export default function NLPExtractionPage() {
  const [rawText, setRawText] = useState(
    "During the raid at Godown #4, suspect Ravi Kumar (P001) was observed transferring ₹3,72,400 to Vikram Singh (P002) using Axis Bank account 4402-9912. Communications were routed through burner phone +91-98110-XXXXX registered under Apex Global Logistics."
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-lg font-bold text-[#F1EBDD] flex items-center gap-2">
            <Sparkles className="text-[#D9AA3D]" size={20} />
            <span>AI / NLP Entity Extraction</span>
          </h1>
          <p className="text-xs text-[#8a948c] mt-0.5">
            Extract FIR entities, bank accounts, vehicles, and conspiratorial relationships directly from unstructured police notes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
        <div className="flex flex-col bg-black/50 border border-white/10 rounded-xl p-4 space-y-3 backdrop-blur-md">
          <label className="text-xs font-mono font-bold text-[#D9AA3D] uppercase">Unstructured Police / FIR Document Text</label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="flex-1 bg-black/60 border border-white/15 rounded-lg p-3 text-xs text-[#F1EBDD] font-mono outline-none focus:border-[#D9AA3D] resize-none leading-relaxed"
          />
          <button className="bg-[#D9AA3D] text-[#080A08] font-bold text-xs py-2.5 px-4 rounded-lg hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer shadow-lg">
            <Sparkles size={14} />
            <span>Extract Entities & Inject to Graph</span>
          </button>
        </div>

        <div className="flex flex-col bg-black/40 border border-white/10 rounded-xl p-4 space-y-3 overflow-y-auto scrollbar-thin backdrop-blur-md">
          <div className="text-xs font-mono font-bold text-[#4ade80] uppercase flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>Extracted Forensic Entities & Relationships (4 Entities Detected)</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-500/40 text-purple-200">
              <span className="font-bold">PERSON:</span> Ravi Kumar (P001) — <i>Role: Suspect</i>
            </div>
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-200">
              <span className="font-bold">PERSON:</span> Vikram Singh (P002) — <i>Role: Hawala Receiver</i>
            </div>
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200">
              <span className="font-bold">FINANCIAL:</span> ₹3,72,400 via Axis Bank A/C 4402-9912
            </div>
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
              <span className="font-bold">ORGANIZATION:</span> Apex Global Logistics — <i>Shell Front</i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
