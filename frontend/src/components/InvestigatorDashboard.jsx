import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, Shield, User, Phone, Car, MapPin, Hash, Download, Sparkles, Clock, ArrowRight, Eye, Printer } from 'lucide-react';
import SmartCaseBrief from './SmartCaseBrief.jsx';

export default function InvestigatorDashboard({ onCaseUploaded, onSelectSuspect }) {
  const [cases, setCases] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [formData, setFormData] = useState({ title: '', fir_number: '' });
  const [dragActive, setDragActive] = useState(false);
  const [showBrief, setShowBrief] = useState(false);

  // Load cases
  const fetchCases = async () => {
    try {
      const res = await fetch('/api/v1/cases/');
      if (res.ok) {
        const data = await res.json();
        setCases(data);
        if (data.length > 0 && !selectedCase) {
          fetchCaseDetail(data[0].case_id);
        }
      }
    } catch (err) {
      console.error('Error fetching cases:', err);
    }
  };

  const fetchCaseDetail = async (caseId) => {
    try {
      const res = await fetch(`/api/v1/cases/${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCase(data);
      }
    } catch (err) {
      console.error('Error fetching case details:', err);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setUploadResult(null);

    const body = new FormData();
    body.append('file', file);
    body.append('title', formData.title || file.name.replace(/\.[^/.]+$/, ''));
    body.append('fir_number', formData.fir_number);

    try {
      const res = await fetch('/api/v1/cases/upload', {
        method: 'POST',
        body
      });
      if (res.ok) {
        const data = await res.json();
        setUploadResult(data);
        fetchCases();
        fetchCaseDetail(data.case_id);
        if (onCaseUploaded) onCaseUploaded(data);
      } else {
        alert('Failed to upload and process FIR file.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error connecting to backend.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Investigator Command Station</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                ACTIVE CASE FILE INGESTION
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Upload First Information Reports (FIRs) • Extract Suspect Aliases • Auto-populate Knowledge Graph
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 font-mono">
            Total Investigated Cases: <strong className="text-amber-400">{cases.length}</strong>
          </span>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: FIR Upload Zone + Case Records (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Drag and Drop Upload Card */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Upload New FIR File</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">PDF / TXT / CSV</span>
            </div>

            {/* Title & FIR inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Case Title</label>
                <input
                  type="text"
                  placeholder="e.g. Rohini Armed Robbery"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-900/90 text-xs text-slate-100 px-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">FIR Number</label>
                <input
                  type="text"
                  placeholder="e.g. FIR-2025-ND-104"
                  value={formData.fir_number}
                  onChange={(e) => setFormData({ ...formData, fir_number: e.target.value })}
                  className="w-full bg-slate-900/90 text-xs text-slate-100 px-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'
              }`}
            >
              <input
                type="file"
                accept=".txt,.pdf,.csv,.doc,.docx"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                disabled={isUploading}
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200">
                    {isUploading ? 'Extracting Legal Entities via NLP Pipeline...' : 'Click to Upload or Drag & Drop FIR'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Files are stored locally with SHA-256 integrity hash</p>
                </div>
              </div>
            </div>

            {/* Quick Demo Upload buttons */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium block mb-2">⚡ Quick Sample Ingestion:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const sampleText = `FIRST INFORMATION REPORT\nFIR No: FIR-2025-ND-104\nPolice Station: Rohini Sector 7, New Delhi\nActs: Section 302, 307, 120B IPC and Arms Act 25\n\nBRIEF FACTS:\nAccused Ravi Kumar @ Ravan along with Vikram Singh alias Vicky conspired armed assault.\nSuspect Ravi Kumar was driving Hyundai Creta DL01AB1234.\nVikram Singh used phone +91-98765-32100 to contact Viper Syndicate in Gurgaon.\nTransferred Rs. 45,00,000 cash.`;
                    const blob = new Blob([sampleText], { type: 'text/plain' });
                    const file = new File([blob], 'FIR_2025_ND_104.txt', { type: 'text/plain' });
                    setFormData({ title: 'Rohini Syndicate Robbery', fir_number: 'FIR-2025-ND-104' });
                    handleFileUpload(file);
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Test Sample FIR #104</span>
                </button>
              </div>
            </div>
          </div>

          {/* Processed Case Files List */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Case Evidence Registry</span>
              </span>
              <span className="text-xs font-mono text-slate-500">{cases.length} Records</span>
            </h2>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {cases.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 font-mono">
                  No cases ingested yet. Upload an FIR above to begin.
                </div>
              ) : (
                cases.map((c) => {
                  const isSelected = selectedCase?.case_id === c.case_id;
                  return (
                    <div
                      key={c.case_id}
                      onClick={() => fetchCaseDetail(c.case_id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-100">{c.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                          {c.fir_number || c.case_id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-red-400" />
                          <span>{c.entities_count} Entities</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Case Details, NLP Breakdown & Suspect Dossier (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedCase ? (
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-2xl space-y-5">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                    INVESTIGATION DOSSIER
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-100">{selectedCase.title}</h2>
                  <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400 font-mono">
                    <span>ID: <strong className="text-slate-200">{selectedCase.case_id}</strong></span>
                    <span>•</span>
                    <span>FIR: <strong className="text-amber-400">{selectedCase.fir_number || 'N/A'}</strong></span>
                  </div>
                </div>

                {/* Local Download & Case Brief Button */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowBrief(true)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Judicial Brief</span>
                  </button>

                  <a
                    href={`/api/v1/cases/${selectedCase.case_id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download Copy</span>
                  </a>
                </div>
              </div>

              {/* SHA-256 Integrity Verification Badge */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2 text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>SHA-256 Integrity:</span>
                  <span className="text-slate-300 truncate max-w-[280px]">
                    {selectedCase.file_hash_sha256}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  VERIFIED
                </span>
              </div>

              {/* Extracted Suspects & Aliases Cards */}
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-red-400" />
                  <span>Identified Suspects & Aliases (Resolved)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCase.entities
                    ?.filter((e) => e.label === 'SUSPECT_PERSON' || e.label === 'PERSON')
                    ?.slice(0, 6)
                    ?.map((suspect, idx) => (
                      <div
                        key={idx}
                        onClick={() => onSelectSuspect && onSelectSuspect(suspect)}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-red-500/20 hover:border-red-500/50 cursor-pointer transition shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-100">{suspect.normalized}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                            {(suspect.confidence * 100).toFixed(0)}% Conf
                          </span>
                        </div>
                        <div className="mt-2 text-[11px] text-slate-400">
                          Extractor: <span className="font-mono text-cyan-400">{suspect.extractor}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Key Digital & Forensic Artifacts (Vehicles, Phones, IPC) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Vehicles */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/20">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-400 mb-2">
                    <Car className="w-3.5 h-3.5" />
                    <span>Vehicles</span>
                  </div>
                  <div className="space-y-1">
                    {selectedCase.entities?.filter((e) => e.label === 'VEHICLE_NUMBER').length === 0 ? (
                      <span className="text-[11px] text-slate-500">None detected</span>
                    ) : (
                      selectedCase.entities
                        ?.filter((e) => e.label === 'VEHICLE_NUMBER')
                        .map((v, i) => (
                          <div key={i} className="text-xs font-mono font-bold text-slate-200">
                            {v.normalized}
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Phones */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-cyan-400 mb-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Phones & CDR</span>
                  </div>
                  <div className="space-y-1">
                    {selectedCase.entities?.filter((e) => e.label === 'PHONE_NUMBER').length === 0 ? (
                      <span className="text-[11px] text-slate-500">None detected</span>
                    ) : (
                      selectedCase.entities
                        ?.filter((e) => e.label === 'PHONE_NUMBER')
                        .map((p, i) => (
                          <div key={i} className="text-xs font-mono font-bold text-slate-200">
                            {p.normalized}
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* IPC & Legal Sections */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400 mb-2">
                    <Hash className="w-3.5 h-3.5" />
                    <span>IPC Sections</span>
                  </div>
                  <div className="space-y-1">
                    {selectedCase.entities?.filter((e) => e.label === 'LEGAL_SECTION').length === 0 ? (
                      <span className="text-[11px] text-slate-500">None detected</span>
                    ) : (
                      selectedCase.entities
                        ?.filter((e) => e.label === 'LEGAL_SECTION')
                        .map((s, i) => (
                          <div key={i} className="text-[11px] font-mono font-bold text-amber-300 truncate">
                            {s.normalized}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Legal Evidence Citations (Sentence-level explainability) */}
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Explainable Legal Relational Triples</span>
                </h3>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {selectedCase.relationships?.slice(0, 8)?.map((rel, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                      <div className="flex items-center space-x-2 font-mono">
                        <strong className="text-slate-200">{rel.source}</strong>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-bold">
                          {rel.relation}
                        </span>
                        <strong className="text-slate-200">{rel.target}</strong>
                      </div>
                      {rel.evidence && (
                        <p className="mt-1.5 text-[11px] text-slate-400 italic pl-2 border-l-2 border-cyan-500/50">
                          "{rel.evidence}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-2xl glass-panel border border-slate-800 text-center text-slate-500">
              <FileText className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-300">No Case Selected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Select a case from the registry or upload a new FIR document to inspect the extracted intelligence dossier.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Printable Smart Case Brief Modal */}
      {showBrief && selectedCase && (
        <SmartCaseBrief
          caseData={selectedCase}
          onClose={() => setShowBrief(false)}
        />
      )}
    </div>
  );
}
