"use client";

import React from "react";
import { Database, Shield, Users, Layers, ExternalLink } from "lucide-react";

export default function WorkspacePage() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-lg font-bold text-[#F1EBDD] flex items-center gap-2">
            <Database className="text-[#D9AA3D]" size={20} />
            <span>Case 101 Workspace & Evidence Vault</span>
          </h1>
          <p className="text-xs text-[#8a948c] mt-0.5">
            Full evidentiary chain of custody, seized asset registers, and investigative audit logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-2">
          <div className="text-[10px] font-mono font-bold text-[#D9AA3D] uppercase">Identified Accused</div>
          <div className="text-xl font-bold text-[#F1EBDD]">4 Suspects</div>
          <div className="text-xs text-[#8a948c]">Ravi Kumar, Vikram Singh, Meena Sharma, Manish Tiwari</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-2">
          <div className="text-[10px] font-mono font-bold text-[#38bdf8] uppercase">Monitored Accounts</div>
          <div className="text-xl font-bold text-[#F1EBDD]">₹4.57 Lakhs Seized</div>
          <div className="text-xs text-[#8a948c]">3 Axis/HDFC mule accounts linked</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-2">
          <div className="text-[10px] font-mono font-bold text-[#4ade80] uppercase">Integrity Verification</div>
          <div className="text-xl font-bold text-[#4ade80]">100% SHA-256</div>
          <div className="text-xs text-[#8a948c]">Zero tampering detected in chain of custody</div>
        </div>
      </div>
    </div>
  );
}
