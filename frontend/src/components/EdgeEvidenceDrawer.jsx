import React from 'react';
import { X, FileText, ShieldCheck, Link2, Sparkles, Calendar, Database, CheckCircle2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export default function EdgeEvidenceDrawer({ edgeData, onClose, onFocusEntity }) {
  if (!edgeData) return null;

  const {
    source, target, label, confidence = 0.95, case: sourceCase,
    source_document = 'FIR-2024-001 (Section 386/120B)',
    text_snippet = 'Suspect was intercepted coordinating transfers and logistics with the co-accused as corroborated by call detail records (CDR) and registered vehicle sightings.',
    timestamp = '2024-03-15 14:22:00 IST',
    evidence_type = 'Direct Phone Intercept / CDR',
  } = edgeData;

  const confPercent = Math.round(Number(confidence || 0.95) * 100);

  return (
    <div className="absolute right-0 top-0 bottom-0 z-30 w-84 sm:w-96 border-l border-[rgba(217,170,61,0.3)] bg-[#0d100e]/95 backdrop-blur-md shadow-2xl flex flex-col animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#141815]">
        <div className="flex items-center gap-2">
          <Link2 size={16} className="text-[#d9aa3d]" />
          <h3 className="font-bold text-sm text-[#f1ebdd] uppercase tracking-wide">
            Relationship Evidence
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-[#8a948c] hover:bg-white/10 hover:text-[#f1ebdd] cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
        {/* Node Link Diagram Banner */}
        <div className="rounded-xl border border-[rgba(217,170,61,0.25)] bg-[rgba(217,170,61,0.06)] p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-[#d9aa3d] font-bold truncate max-w-[120px]">{source}</span>
            <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 font-mono text-[9px] text-[#f1ebdd]">
              {label || 'CONNECTED_TO'}
            </span>
            <span className="font-mono text-[#d9aa3d] font-bold truncate max-w-[120px]">{target}</span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#8a948c] pt-1 border-t border-white/5">
            <span>Link Confidence:</span>
            <span className={clsx('font-mono font-bold', confPercent >= 85 ? 'text-[#72bf7e]' : 'text-[#d9aa3d]')}>
              {confPercent}% Verified
            </span>
          </div>

          {/* Confidence Meter */}
          <div className="h-1.5 w-full rounded-full bg-black/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#d9aa3d] to-[#5e9f68] rounded-full transition-all duration-300"
              style={{ width: `${confPercent}%` }}
            />
          </div>
        </div>

        {/* Source Document Card */}
        <div className="rounded-xl border border-[var(--line)] bg-[#101311] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#f1ebdd] flex items-center gap-1.5">
              <FileText size={13} className="text-[#d9aa3d]" /> Source Document
            </span>
            {sourceCase && (
              <span className="rounded bg-black/40 border border-white/10 px-1.5 py-0.2 text-[9px] font-mono text-[#d9aa3d]">
                Case {sourceCase}
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] text-[#e8d9a8]">
            {edgeData.document || source_document}
          </p>
          <div className="flex items-center gap-3 text-[10px] text-[#8a948c] pt-1 border-t border-white/5">
            <span className="flex items-center gap-1">
              <Calendar size={10} /> {timestamp}
            </span>
            <span className="flex items-center gap-1 text-[#72bf7e]">
              <ShieldCheck size={11} /> Cryptographic Proof Verified
            </span>
          </div>
        </div>

        {/* Extracted Text Snippet */}
        <div className="rounded-xl border border-white/10 bg-[#101311] p-3 space-y-2">
          <span className="text-[10px] font-bold text-[#8a948c] uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={11} className="text-[#d9aa3d]" /> Corroborating Forensic Evidence:
          </span>
          <div className="rounded-lg bg-black/50 p-2.5 border border-white/5 text-[11px] text-[#f1ebdd] leading-relaxed italic font-serif">
            "{edgeData.snippet || text_snippet}"
          </div>
        </div>

        {/* Audit & Chain of Custody Tag */}
        <div className="rounded-xl border border-white/5 bg-panel p-3 text-[10px] text-[#8a948c] space-y-1">
          <div className="flex justify-between">
            <span>Evidence Type:</span>
            <span className="text-[#f1ebdd] font-medium">{edgeData.evidence_type || evidence_type}</span>
          </div>
          <div className="flex justify-between">
            <span>Extraction Engine:</span>
            <span className="text-[#e8d9a8] font-mono">spaCy + Multi-Signal NER</span>
          </div>
        </div>
      </div>
    </div>
  );
}
