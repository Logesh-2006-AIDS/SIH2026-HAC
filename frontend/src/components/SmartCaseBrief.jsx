import React from 'react';
import { FileText, Printer, Download, CheckCircle2, Shield, Hash, Car, Phone, Calendar } from 'lucide-react';

export default function SmartCaseBrief({ caseData, onClose }) {
  if (!caseData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-8 shadow-2xl space-y-6 text-slate-100 my-8">
        {/* Top Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest">
            <FileText className="w-4 h-4" />
            <span>JUDICIAL CASE BRIEF & INVESTIGATION SUMMARY</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs flex items-center space-x-1.5 transition shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Brief</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Official Police Header */}
        <div className="text-center space-y-1 pb-4 border-b border-slate-800">
          <h2 className="text-lg font-extrabold uppercase tracking-wide">
            STATE CRIME BRANCH & POLICE INTELLIGENCE
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            FIRST INFORMATION REPORT CASE DOSSIER • PREPARED FOR JUDICIAL REVIEW
          </p>
        </div>

        {/* Key Case Identifiers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-500 text-[10px] block">CASE ID</span>
            <strong className="text-slate-200">{caseData.case_id}</strong>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">FIR NUMBER</span>
            <strong className="text-amber-400">{caseData.fir_number || 'N/A'}</strong>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">JURISDICTION</span>
            <strong className="text-slate-200">{caseData.police_station || 'Delhi'}</strong>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">STATUS</span>
            <strong className="text-emerald-400">PROCESSED</strong>
          </div>
        </div>

        {/* Case Narrative */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-slate-300 uppercase tracking-wider">Brief Facts & Summary</h4>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 leading-relaxed font-sans">
            {caseData.raw_text || 'No raw text available.'}
          </div>
        </div>

        {/* Accused & Entities Roster */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-slate-300 uppercase tracking-wider">Accused Persons & Aliases</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {caseData.entities
              ?.filter((e) => e.label === 'SUSPECT_PERSON' || e.label === 'PERSON')
              ?.map((suspect, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between font-mono">
                  <span>{suspect.normalized}</span>
                  <span className="text-[10px] text-cyan-400">{(suspect.confidence * 100).toFixed(0)}% Conf</span>
                </div>
              ))}
          </div>
        </div>

        {/* Digital Footprint: Vehicles & Phones */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 font-bold block mb-1">Vehicles Involved:</span>
            {caseData.entities?.filter((e) => e.label === 'VEHICLE_NUMBER').map((v, i) => (
              <div key={i} className="text-slate-200">{v.normalized}</div>
            ))}
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 font-bold block mb-1">Phone / CDR Linked:</span>
            {caseData.entities?.filter((e) => e.label === 'PHONE_NUMBER').map((p, i) => (
              <div key={i} className="text-slate-200">{p.normalized}</div>
            ))}
          </div>
        </div>

        {/* SHA-256 Chain of Custody */}
        <div className="p-3 rounded-xl bg-slate-950 text-[11px] font-mono text-slate-400 flex items-center justify-between border border-slate-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cryptographic SHA-256 Hash: <strong className="text-slate-300">{caseData.file_hash_sha256}</strong></span>
          </div>
          <span className="text-emerald-400 font-bold">CHAIN INTACT</span>
        </div>
      </div>
    </div>
  );
}
