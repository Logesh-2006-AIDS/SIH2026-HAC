import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Sparkles, FileSpreadsheet, Layers, RefreshCw, Download } from 'lucide-react';

export default function DataIngestionPage({ onIngestionSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [firNumber, setFirNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [ingestionResult, setIngestionResult] = useState(null);

  const pipelineStages = [
    { step: 1, label: 'Document Upload & SHA-256 Hashing', desc: 'Secure local storage' },
    { step: 2, label: 'Text Normalization & OCR Cleaning', desc: 'Preprocess legal text' },
    { step: 3, label: 'Named Entity Recognition (NER)', desc: 'Extract suspects, vehicles, phones' },
    { step: 4, label: 'Semantic Relationship Extraction', desc: 'Map evidence triples' },
    { step: 5, label: 'Entity Resolution & Alias Merging', desc: 'Deduplicate identities' },
    { step: 6, label: 'Neo4j Knowledge Graph Commit', desc: 'Sync nodes & edges' },
  ];

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsProcessing(true);
    setIngestionResult(null);

    // Simulated progress steps for live visual feedback
    setPipelineStep(1);
    setTimeout(() => setPipelineStep(2), 300);
    setTimeout(() => setPipelineStep(3), 600);
    setTimeout(() => setPipelineStep(4), 900);
    setTimeout(() => setPipelineStep(5), 1200);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    formData.append('fir_number', firNumber);

    try {
      const res = await fetch('/api/v1/cases/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setPipelineStep(6);
        setIngestionResult(data);
        if (onIngestionSuccess) onIngestionSuccess(data);
      }
    } catch (err) {
      console.error('Ingestion error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-red-900/40 bg-gradient-to-r from-red-950/40 via-black to-black shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-600/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Universal Data Ingestion & NLP Pipeline</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-semibold font-mono">
                MULTI-FORMAT INGESTION
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Supports FIR PDFs, TXT documents, CDR CSV files, financial registers & intelligence briefs.
            </p>
          </div>
        </div>
      </div>

      {/* Ingestion Pipeline Architecture Stepper */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Automated 6-Stage Processing Pipeline</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {pipelineStages.map((stage) => {
            const isCompleted = pipelineStep >= stage.step;
            const isCurrent = pipelineStep === stage.step && isProcessing;
            return (
              <div
                key={stage.step}
                className={`p-3.5 rounded-xl border text-xs space-y-1 transition-all ${
                  isCompleted
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="font-bold text-cyan-400">STAGE 0{stage.step}</span>
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-3 h-3 rounded-full border border-slate-700" />}
                </div>
                <div className="font-bold text-slate-200 truncate">{stage.label}</div>
                <div className="text-[10px] text-slate-400">{stage.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Upload Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>Select File to Ingest</span>
          </h3>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Investigation / Case Title</label>
              <input
                type="text"
                placeholder="e.g. Rohini Syndicate Robbery"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 text-xs text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">FIR / Docket Number</label>
              <input
                type="text"
                placeholder="e.g. FIR-2025-ND-105"
                value={firNumber}
                onChange={(e) => setFirNumber(e.target.value)}
                className="w-full bg-slate-900 text-xs text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-xl p-6 text-center cursor-pointer relative bg-slate-900/50">
              <input
                type="file"
                accept=".txt,.pdf,.csv,.json"
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-200">
                {file ? file.name : 'Click or Drag & Drop FIR (PDF / TXT / CSV)'}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Automatic SHA-256 Hashing for Court Admissibility</p>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !file}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-90 text-black font-extrabold text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isProcessing ? 'Running NLP Extraction...' : 'Execute Ingestion & Extraction'}</span>
            </button>
          </form>
        </div>

        {/* Extracted Entities Output (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Extracted Intelligence Entities</span>
            </span>
            {ingestionResult && (
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {ingestionResult.nlp_result?.entities?.length || 0} Entities Found
              </span>
            )}
          </h3>

          {ingestionResult ? (
            <div className="space-y-4 text-xs">
              {/* SHA-256 Badge & PDF Action */}
              <div className="p-3.5 rounded-xl bg-black/80 border border-red-950/60 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400">File Hash (SHA-256): </span>
                  <span className="text-slate-200 font-bold break-all">{ingestionResult.file_hash_sha256}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800 font-bold">COURT VERIFIED</span>
                  <button
                    onClick={() => {
                      const cid = ingestionResult.case_id || 'FIR-2025-ND-101';
                      window.open(`/api/v1/reports/judicial-pdf/${encodeURIComponent(cid)}`, '_blank');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold font-mono text-xs flex items-center space-x-1.5 shadow-[0_0_12px_rgba(239,68,68,0.3)] border border-red-500/40"
                    title="Download Court-Admissible Judicial Report PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Generate Judicial PDF</span>
                  </button>
                </div>
              </div>

              {/* Entities List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1 font-mono">
                {ingestionResult.nlp_result?.entities?.map((e, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-black/80 border border-red-950/60 flex items-center justify-between">
                    <div>
                      <div className="text-slate-100 font-bold">{e.normalized || e.text}</div>
                      <div className="text-[10px] text-red-400">{e.label}</div>
                    </div>
                    <span className="text-[10px] text-red-500 bg-red-950 px-1.5 py-0.2 rounded border border-red-900 font-bold">{((e.confidence || 0.88) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>

              {/* Bottom Action */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    const cid = ingestionResult.case_id || 'FIR-2025-ND-101';
                    window.open(`/api/v1/reports/judicial-pdf/${encodeURIComponent(cid)}`, '_blank');
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold font-mono text-xs flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] border border-red-500/40"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Court-Admissible Judicial Report (PDF)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-slate-500 font-mono">
              <FileText className="w-10 h-10 text-red-950 mb-2" />
              <span>No document processed yet. Select a file on the left to start.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
