import React from 'react';
import { X, FileText, Link2, Calendar, CheckCircle2, ShieldAlert, Cpu, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export default function EdgeEvidenceDrawer({ edgeData, onClose, onFocusEntity }) {
  if (!edgeData) return null;

  const props = edgeData.properties || {};

  const source = edgeData.source || edgeData.from_id || 'Entity A';
  const target = edgeData.target || edgeData.to_id || 'Entity B';
  const relType = edgeData.type || edgeData.relationship || edgeData.label || 'ASSOCIATED_WITH';

  const sourceDocumentId =
    props.source_document_id ||
    edgeData.source_document_id ||
    props.source_case ||
    edgeData.source_case ||
    edgeData.document ||
    edgeData.source_document ||
    'FIR Document Record';

  const evidenceSnippet =
    props.evidence_snippet ||
    edgeData.evidence_snippet ||
    props.evidence ||
    edgeData.evidence ||
    edgeData.snippet ||
    edgeData.text_snippet ||
    'Evidence record logged during case investigation.';

  const extractionMethod =
    props.extraction_method ||
    edgeData.extraction_method ||
    edgeData.evidence_type ||
    'NLP_HYBRID';

  const verificationStatus =
    props.verification_status ||
    edgeData.verification_status ||
    'AI_SUGGESTED';

  const createdAt =
    props.created_at ||
    edgeData.created_at ||
    edgeData.timestamp ||
    '';

  const confidence = Number(props.confidence ?? edgeData.confidence ?? 0.85);
  const confPercent = Math.round(confidence * 100);

  // Evidentiary strength calculation (bounded 0.0 - 1.0)
  const strengthObj = props.evidentiary_strength || edgeData.evidentiary_strength;
  const strengthPct = strengthObj?.score_pct ?? Math.min(100, Math.max(10, Math.round(
    (confidence * 0.40 + (verificationStatus === 'VERIFIED' ? 1.0 : verificationStatus === 'AI_SUGGESTED' ? 0.80 : 0.50) * 0.35 + 0.70 * 0.25) * 100
  )));
  const strengthLevel = strengthObj?.level || (strengthPct >= 80 ? 'HIGH' : strengthPct >= 50 ? 'MEDIUM' : 'LOW');
  const strengthLabel = strengthObj?.label || `${strengthPct}% (${strengthLevel === 'HIGH' ? 'High' : strengthLevel === 'MEDIUM' ? 'Medium' : 'Low'})`;

  return (
    <div className="absolute right-0 top-0 bottom-0 z-30 w-84 sm:w-96 border-l border-[rgba(217,170,61,0.3)] bg-[#0d100e]/95 backdrop-blur-md shadow-2xl flex flex-col animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#141815]">
        <div className="flex items-center gap-2">
          <Link2 size={16} className="text-[#d9aa3d]" />
          <h3 className="font-bold text-sm text-[#f1ebdd] uppercase tracking-wide">
            Relationship Provenance
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-[#8a948c] hover:bg-white/10 hover:text-[#f1ebdd] cursor-pointer transition-colors"
          title="Close drawer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
        {/* Node Link Diagram Banner */}
        <div className="rounded-xl border border-[rgba(217,170,61,0.25)] bg-[rgba(217,170,61,0.06)] p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] gap-1">
            <button
              type="button"
              onClick={() => onFocusEntity && onFocusEntity(source)}
              className="font-mono text-[#d9aa3d] font-bold truncate max-w-[110px] hover:underline text-left cursor-pointer"
              title={`Focus ${source}`}
            >
              {edgeData.from_name || source}
            </button>
            <span className="rounded bg-black/60 border border-white/10 px-2 py-0.5 font-mono text-[9px] text-[#f1ebdd] whitespace-nowrap">
              {relType}
            </span>
            <button
              type="button"
              onClick={() => onFocusEntity && onFocusEntity(target)}
              className="font-mono text-[#d9aa3d] font-bold truncate max-w-[110px] hover:underline text-right cursor-pointer"
              title={`Focus ${target}`}
            >
              {edgeData.to_name || target}
            </button>
          </div>

          {/* Evidentiary Strength Display */}
          <div className="pt-2 border-t border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#8a948c]">Evidentiary Strength:</span>
              <span
                className={clsx(
                  'font-mono font-bold px-1.5 py-0.5 rounded text-[10px]',
                  strengthLevel === 'HIGH' && 'bg-[#5e9f68]/20 text-[#72bf7e] border border-[#5e9f68]/40',
                  strengthLevel === 'MEDIUM' && 'bg-[#d9aa3d]/20 text-[#d9aa3d] border border-[#d9aa3d]/40',
                  strengthLevel === 'LOW' && 'bg-red-500/20 text-red-400 border border-red-500/40'
                )}
              >
                {strengthLabel}
              </span>
            </div>

            {/* Bounded Progress Bar */}
            <div className="h-1.5 w-full rounded-full bg-black/60 overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-300',
                  strengthLevel === 'HIGH' && 'bg-gradient-to-r from-[#d9aa3d] to-[#72bf7e]',
                  strengthLevel === 'MEDIUM' && 'bg-[#d9aa3d]',
                  strengthLevel === 'LOW' && 'bg-red-500'
                )}
                style={{ width: `${strengthPct}%` }}
              />
            </div>
            <p className="text-[9px] text-[#8a948c] italic">
              * Evidentiary strength (officer verification required)
            </p>
          </div>
        </div>

        {/* Source Document Card */}
        <div className="rounded-xl border border-[var(--line)] bg-[#101311] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#f1ebdd] flex items-center gap-1.5">
              <FileText size={13} className="text-[#d9aa3d]" /> Source Document Reference
            </span>
            <span
              className={clsx(
                'rounded px-1.5 py-0.5 text-[9px] font-mono border',
                verificationStatus === 'VERIFIED'
                  ? 'bg-[#5e9f68]/20 text-[#72bf7e] border-[#5e9f68]/40'
                  : 'bg-white/5 text-[#8a948c] border-white/10'
              )}
            >
              {verificationStatus}
            </span>
          </div>

          <p className="font-mono text-[11px] text-[#e8d9a8] break-all">
            {sourceDocumentId}
          </p>

          {createdAt && (
            <div className="flex items-center gap-2 text-[10px] text-[#8a948c] pt-1 border-t border-white/5">
              <Calendar size={11} />
              <span>Created / Logged: {createdAt}</span>
            </div>
          )}
        </div>

        {/* Evidence Snippet */}
        <div className="rounded-xl border border-white/10 bg-[#101311] p-3 space-y-2">
          <span className="text-[10px] font-bold text-[#8a948c] uppercase tracking-wider flex items-center gap-1">
            <Cpu size={11} className="text-[#d9aa3d]" /> Evidence Record Snippet:
          </span>
          <div className="rounded-lg bg-black/50 p-2.5 border border-white/5 text-[11px] text-[#f1ebdd] leading-relaxed italic font-serif">
            "{evidenceSnippet}"
          </div>
        </div>

        {/* Real Provenance Metadata */}
        <div className="rounded-xl border border-white/5 bg-panel p-3 text-[10px] text-[#8a948c] space-y-2">
          <div className="flex justify-between items-center">
            <span>Extraction Method:</span>
            <span className="text-[#f1ebdd] font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
              {extractionMethod}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Extraction Confidence:</span>
            <span className="text-[#e8d9a8] font-mono font-bold">
              {confPercent}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Verification Status:</span>
            <span className="text-[#f1ebdd] font-medium">
              {verificationStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

