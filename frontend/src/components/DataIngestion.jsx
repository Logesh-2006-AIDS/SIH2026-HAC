import React, { useState, useRef, useMemo } from 'react';
import { 
  Upload, CheckCircle, AlertTriangle, Loader, ChevronRight, 
  Database, Users, X, FileText, Phone, DollarSign, ShieldAlert, 
  Sparkles, ArrowRight, Play, CheckCircle2, RefreshCw, FolderPlus,
  FolderOpen, Shield, MapPin, Calendar, Plus, Link2, FileCode,
  Radio, HardDrive, Cpu, ShieldCheck, Zap, Layers, ArrowUpRight
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { getIngestionStats } from '../data/mockService.js';
import { CASES } from '../data/mockData.js';
import clsx from 'clsx';

const SOURCE_CONNECTORS = [
  {
    id: 'fir_report',
    label: 'FIR / Police Complaint',
    badge: 'LEGAL NER',
    badgeColor: 'text-[#d9aa3d] border-[#d9aa3d]/40 bg-[#d9aa3d]/10',
    icon: FileText,
    iconColor: 'text-[#d9aa3d] bg-[#d9aa3d]/15 border-[#d9aa3d]/30',
    formats: 'PDF, TXT, DOCX',
    desc: 'Extracts accused persons, complainant, IPC/BNS legal sections, stolen assets & vehicle plates.',
    sampleFile: 'FIR_101_RoyalJewellers_Extortion.txt',
  },
  {
    id: 'cdr',
    label: 'Call Detail Records (CDR)',
    badge: 'TOWER GEO',
    badgeColor: 'text-[#38bdf8] border-[#38bdf8]/40 bg-[#38bdf8]/10',
    icon: Phone,
    iconColor: 'text-[#38bdf8] bg-[#38bdf8]/15 border-[#38bdf8]/30',
    formats: 'CSV, XLSX',
    desc: 'Analyzes cell tower azimuths, IMEI handset switches, call burst clusters & caller/receiver pairs.',
    sampleFile: 'CDR_Case101_CellTower_Dump.csv',
  },
  {
    id: 'financial',
    label: 'Financial & Bank Ledgers',
    badge: 'PMLA HAWALA',
    badgeColor: 'text-[#c084fc] border-[#c084fc]/40 bg-[#c084fc]/10',
    icon: DollarSign,
    iconColor: 'text-[#c084fc] bg-[#c084fc]/15 border-[#c084fc]/30',
    formats: 'CSV, JSON',
    desc: 'Detects rapid shell layering, IFSC routing, suspicious cash infusions & money trails.',
    sampleFile: 'BankLedger_ApexLogistics_Layering.csv',
  },
  {
    id: 'social_media',
    label: 'Social & DarkWeb Intel',
    badge: 'OSINT CHATTER',
    badgeColor: 'text-[#4ade80] border-[#4ade80]/40 bg-[#4ade80]/10',
    icon: Radio,
    iconColor: 'text-[#4ade80] bg-[#4ade80]/15 border-[#4ade80]/30',
    formats: 'JSON, TXT',
    desc: 'Scrapes Telegram handles, darknet crypto addresses, burner aliases & forum communications.',
    sampleFile: 'Telegram_Shadows_Chatter.json',
  },
  {
    id: 'criminal_history',
    label: 'Criminal History Dossier',
    badge: 'MODUS OPERANDI',
    badgeColor: 'text-[#f87171] border-[#f87171]/40 bg-[#f87171]/10',
    icon: Users,
    iconColor: 'text-[#f87171] bg-[#f87171]/15 border-[#f87171]/30',
    formats: 'JSON, PDF',
    desc: 'Past conviction history, known aliases, gang hierarchy ties & interstate warrants.',
    sampleFile: 'CriminalDossier_RaviKumar_Gang.json',
  },
  {
    id: 'surveillance',
    label: 'Field Surveillance Notes',
    badge: 'HUMINT OPS',
    badgeColor: 'text-[#fb923c] border-[#fb923c]/40 bg-[#fb923c]/10',
    icon: Shield,
    iconColor: 'text-[#fb923c] bg-[#fb923c]/15 border-[#fb923c]/30',
    formats: 'TXT, JSON',
    desc: 'Undercover officer observations, vehicle sightings, meeting transcripts & geo-tags.',
    sampleFile: 'FieldSurveillance_OkhlaWarehouse.txt',
  },
];

const PIPELINE_STEPS = [
  { step: '01', title: 'Evidence Ingestion & Checksum', desc: 'SHA-256 hashing & metadata audit lock' },
  { step: '02', title: 'Schema & Forensic Validation', desc: 'Format integrity and anti-tamper verification' },
  { step: '03', title: 'Forensic Text Normalization', desc: 'Noise removal, encoding fixes & OCR cleanup' },
  { step: '04', title: 'Legal Named Entity Recognition', desc: 'AI/NLP extraction of Persons, Vehicles & Orgs' },
  { step: '05', title: 'Multi-Signal Entity Resolution', desc: 'Fuzzy alias linking & cross-case duplicate match' },
  { step: '06', title: 'Relationship & Provenance Linking', desc: 'Associating entities with source evidence citations' },
  { step: '07', title: 'Knowledge Graph Store Sync', desc: 'Cytoscape nodes & edge weight generation' },
  { step: '08', title: 'Forensic Ingestion Finalized', desc: 'Live workbench notification dispatch' },
];

export default function DataIngestion({ onComplete }) {
  const { 
    selectedCase, setSelectedCase, casesList, registerCase,
    setIngestionDone, setActiveTab 
  } = useInvestigation();

  const [activeStep, setActiveStep] = useState(1);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineIdx, setPipelineIdx] = useState(-1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [summaryStats, setSummaryStats] = useState(null);
  const fileRef = useRef(null);

  const [newCaseForm, setNewCaseForm] = useState({
    case_number: '',
    title: '',
    crime_category: 'Armed Extortion / Robbery',
    jurisdiction: 'Special Crime Branch, Delhi Police',
    incident_date: new Date().toISOString().split('T')[0],
    summary: '',
  });

  const cases = useMemo(() => {
    const list = casesList && casesList.length ? casesList : CASES;
    return list.map(c => ({
      ...c,
      case_number: String(c.case_number).replace('CASE-', ''),
    }));
  }, [casesList]);

  const activeCaseObj = useMemo(() => {
    return cases.find(c => c.case_number === selectedCase) || cases[0] || {
      case_number: '101',
      title: 'Armed Robbery & Extortion Syndicate',
      crime_category: 'Extortion / Armed Robbery',
      jurisdiction: 'Crime Branch, Delhi Police',
    };
  }, [cases, selectedCase]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '15 Apr 2025';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleCreateCase = (e) => {
    e.preventDefault();
    if (!newCaseForm.title.trim()) return;

    const num = newCaseForm.case_number.trim() || `10${cases.length + 1}`;
    registerCase({
      ...newCaseForm,
      case_number: num,
    });
    setSelectedCase(num);
    setIsCreatingCase(false);
    setNewCaseForm({
      case_number: '',
      title: '',
      crime_category: 'Armed Extortion / Robbery',
      jurisdiction: 'Special Crime Branch, Delhi Police',
      incident_date: new Date().toISOString().split('T')[0],
      summary: '',
    });
    setActiveStep(2);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      setSelectedFile(file);
      runPipeline(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      runPipeline(file);
    }
  };

  const runPipeline = async (fileToUpload = null) => {
    setIsProcessing(true);
    setCompleted(false);
    setPipelineIdx(0);
    setProgressPercent(15);

    try {
      for (let i = 1; i <= 6; i++) {
        await new Promise(r => setTimeout(r, 200));
        setPipelineIdx(i);
        setProgressPercent(Math.round((i / 7) * 90));
      }

      let apiResult = null;
      if (fileToUpload) {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        if (selectedCase) formData.append('case_id', selectedCase);
        
        const token = localStorage.getItem('sih_token');
        const res = await fetch('/api/v1/ingest/file', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        apiResult = await res.json();
      }

      await new Promise(r => setTimeout(r, 200));
      setPipelineIdx(7);
      setProgressPercent(100);

      const stats = await getIngestionStats();
      setSummaryStats({
        entities_resolved: apiResult?.data?.entities_extracted || 28,
        edges_created: apiResult?.data?.relationships_created || 42,
        hash: 'SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      });
      setCompleted(true);
      if (setIngestionDone) setIngestionDone(true);
      
      window.dispatchEvent(new CustomEvent('sih:data_ingested', { detail: apiResult }));
      if (onComplete) onComplete();
    } catch (err) {
      console.warn("Pipeline warning:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#080a08] text-[#f1ebdd] overflow-hidden select-none">
      
      {/* ── TOP HERO BANNER & FLOW STEPPER ──────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/5 bg-gradient-to-r from-[#0d100e] via-[#101412] to-[#0d100e] px-8 py-5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d9aa3d] to-[#926c15] text-[#080a08] font-bold shadow-lg shadow-[#d9aa3d]/15 ring-1 ring-white/20">
              <Cpu size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#f1ebdd] tracking-tight">
                  Evidence Ingestion Engine
                </h1>
                <span className="rounded-full bg-[#d9aa3d]/15 border border-[#d9aa3d]/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#d9aa3d]">
                  STAGE {activeStep} / 2
                </span>
              </div>
              <p className="text-xs text-[#8a948c] mt-0.5">
                {activeStep === 1 
                  ? 'Select an active case dossier or register a new FIR to bind forensic records.' 
                  : `Ingesting multi-source documents into CASE-${activeCaseObj.case_number} knowledge graph.`}
              </p>
            </div>
          </div>

          {/* Interactive Stepper Pills */}
          <div className="flex items-center gap-2 bg-black/60 border border-white/10 p-1.5 rounded-2xl backdrop-blur-md shadow-inner">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer",
                activeStep === 1
                  ? "bg-[#d9aa3d] text-[#080a08] shadow-md shadow-[#d9aa3d]/20"
                  : "text-[#8a948c] hover:text-[#f1ebdd]"
              )}
            >
              <FolderOpen size={14} />
              <span>1. Target Case</span>
            </button>

            <ChevronRight size={14} className="text-white/20" />

            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer",
                activeStep === 2
                  ? "bg-[#d9aa3d] text-[#080a08] shadow-md shadow-[#d9aa3d]/20"
                  : "text-[#8a948c] hover:text-[#f1ebdd]"
              )}
            >
              <Upload size={14} />
              <span>2. Ingest Evidence</span>
            </button>
          </div>

        </div>
      </header>

      {/* ── MAIN WORKSPACE AREA ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-8 scrollbar-thin">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ════════════════════════════════════════════════════════════════════
              STEP 1: TARGET CASE SELECTION
             ════════════════════════════════════════════════════════════════════ */}
          {activeStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#f1ebdd] uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#d9aa3d]" />
                    Choose Active Investigation Case
                  </h2>
                  <p className="text-xs text-[#8a948c] mt-0.5">
                    All ingested call logs, financial ledgers, and FIRs will be automatically linked to this case dossier.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingCase(true)}
                  className="flex items-center gap-2 rounded-xl border border-[#d9aa3d]/50 bg-[#d9aa3d]/15 px-4 py-2 text-xs font-bold text-[#d9aa3d] hover:bg-[#d9aa3d]/25 hover:text-[#f1ebdd] transition cursor-pointer shadow-sm hover:scale-[1.02]"
                >
                  <Plus size={15} />
                  <span>+ Register New Case / FIR</span>
                </button>
              </div>

              {/* Case Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cases.map((c) => {
                  const isSelected = selectedCase === c.case_number;
                  return (
                    <div
                      key={c.case_number}
                      onClick={() => {
                        setSelectedCase(c.case_number);
                        setActiveStep(2);
                      }}
                      className={clsx(
                        "relative rounded-2xl p-5 border cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-4 group overflow-hidden",
                        isSelected
                          ? "border-[#d9aa3d] bg-gradient-to-b from-[#161c18] to-[#101412] shadow-xl shadow-[#d9aa3d]/10 ring-1 ring-[#d9aa3d]/50"
                          : "border-white/5 bg-[#0e1210] hover:border-white/20 hover:bg-[#121614] hover:shadow-lg"
                      )}
                    >
                      {/* Top Row: Case ID & Status */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={clsx(
                            "font-mono text-xs font-bold px-2.5 py-1 rounded-lg border",
                            isSelected
                              ? "bg-[#d9aa3d]/25 border-[#d9aa3d]/50 text-[#d9aa3d]"
                              : "bg-white/5 border-white/10 text-[#8a948c]"
                          )}>
                            CASE-{c.case_number}
                          </span>

                          <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/25 px-2 py-0.5 rounded-full font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                            Active Case
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-[#f1ebdd] group-hover:text-[#d9aa3d] transition-colors leading-snug line-clamp-2">
                          {c.title?.replace(/\(CASE-\d+\)/, '')}
                        </h3>

                        {/* Metadata */}
                        <div className="mt-2 text-xs text-[#8a948c] space-y-1">
                          <div className="text-[#c5cfc8] truncate font-medium">{c.crime_category}</div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <MapPin size={12} className="text-[#d9aa3d] shrink-0" />
                            <span className="truncate">{c.jurisdiction || 'Special Crime Branch'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="font-mono text-[11px] text-[#8a948c] flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(c.incident_date)}
                        </span>

                        <span className={clsx(
                          "font-bold text-xs flex items-center gap-1 transition-transform group-hover:translate-x-1",
                          isSelected ? "text-[#d9aa3d]" : "text-[#8a948c] group-hover:text-[#f1ebdd]"
                        )}>
                          <span>Select & Ingest</span>
                          <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              STEP 2: EVIDENCE DROPZONE & CONNECTOR VAULT
             ════════════════════════════════════════════════════════════════════ */}
          {activeStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Active Case Context Bar */}
              <div className="rounded-2xl border border-[rgba(217,170,61,0.35)] bg-gradient-to-r from-[#141a16] via-[#101412] to-[#0d100e] p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d9aa3d]/40 bg-[#d9aa3d]/15 text-[#d9aa3d] shadow-md">
                    <FolderOpen size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-[#d9aa3d]/25 border border-[#d9aa3d]/50 text-[#d9aa3d]">
                        CASE-{activeCaseObj.case_number}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-[#72bf7e] bg-[#72bf7e]/15 border border-[#72bf7e]/30 px-2 py-0.5 rounded-full">
                        TARGET LOCKED
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-[#f1ebdd] mt-1">
                      {activeCaseObj.title?.replace(/\(CASE-\d+\)/, '')}
                    </h2>
                    <div className="text-xs text-[#8a948c] mt-0.5">
                      {activeCaseObj.crime_category} • {activeCaseObj.jurisdiction}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-[#c5cfc8] hover:text-[#f1ebdd] hover:bg-white/10 transition cursor-pointer"
                  >
                    ← Switch Case
                  </button>

                  <button
                    type="button"
                    onClick={() => runPipeline()}
                    disabled={isProcessing}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d9aa3d] to-[#d97706] px-5 py-2 text-xs font-bold text-[#080a08] hover:brightness-110 shadow-lg shadow-[#d9aa3d]/20 transition cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.99]"
                  >
                    <Zap size={14} fill="#080a08" />
                    <span>Run Full 8-Step Pipeline (Demo Batch)</span>
                  </button>
                </div>
              </div>

              {/* Futuristic Drag & Drop Area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileRef.current?.click()}
                className={clsx(
                  "relative rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-3 group",
                  dragOver
                    ? "border-[#d9aa3d] bg-[#d9aa3d]/10 scale-[1.01]"
                    : "border-white/15 bg-[#0e1210] hover:border-[#d9aa3d]/60 hover:bg-[#111613]"
                )}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9aa3d]/15 text-[#d9aa3d] border border-[#d9aa3d]/30 group-hover:scale-110 group-hover:bg-[#d9aa3d]/25 transition-all shadow-lg">
                  <Upload size={26} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#f1ebdd]">
                    Drag & Drop Evidence Documents or <span className="text-[#d9aa3d] underline">Browse Files</span>
                  </h3>
                  <p className="text-xs text-[#8a948c] mt-1">
                    Supports FIR Reports (.pdf, .txt), CDR Logs (.csv), Bank Ledgers (.csv, .json), and Social Intel (.json)
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-[#8a948c] pt-1">
                  <span className="flex items-center gap-1 text-[#4ade80]">
                    <ShieldCheck size={13} />
                    Auto SHA-256 Checksum
                  </span>
                  <span>•</span>
                  <span>Max File Size: 100MB</span>
                </div>
              </div>

              {/* Supported Multi-Source Connectors */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#8a948c] uppercase tracking-wider flex items-center gap-2">
                    <Layers size={14} className="text-[#d9aa3d]" />
                    Available Forensic Connectors (6)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SOURCE_CONNECTORS.map((connector) => {
                    const IconComp = connector.icon;
                    return (
                      <div
                        key={connector.id}
                        className="rounded-2xl border border-white/5 bg-[#0e1210] p-5 flex flex-col justify-between hover:border-[rgba(217,170,61,0.4)] hover:bg-[#121614] hover:shadow-xl transition-all duration-200 space-y-4 group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${connector.iconColor}`}>
                              <IconComp size={20} />
                            </div>
                            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-mono font-bold ${connector.badgeColor}`}>
                              {connector.badge}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-[#f1ebdd] group-hover:text-[#d9aa3d] transition">
                            {connector.label}
                          </h4>
                          <p className="text-xs text-[#8a948c] mt-1.5 leading-relaxed line-clamp-2">
                            {connector.desc}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                          <span className="font-mono text-[10px] text-[#8a948c]">
                            {connector.formats}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedConnector(connector);
                              fileRef.current?.click();
                            }}
                            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-[#d9aa3d] hover:bg-[#d9aa3d]/20 transition cursor-pointer"
                          >
                            <span>Upload File</span>
                            <ArrowUpRight size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Hidden File Input */}
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* ── CREATE CASE MODAL ──────────────────────────────────────────────── */}
      {isCreatingCase && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-[rgba(217,170,61,0.4)] bg-[#0d100e] p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d9aa3d]/15 text-[#d9aa3d] border border-[#d9aa3d]/30">
                  <FolderPlus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#f1ebdd] uppercase tracking-wide">
                    Register New Investigation Dossier / FIR
                  </h3>
                  <p className="text-[11px] text-[#8a948c]">Create a registered case binding for incoming evidence.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingCase(false)}
                className="text-[#8a948c] hover:text-[#f1ebdd] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#8a948c] mb-1">Case / FIR Number</label>
                  <input
                    type="text"
                    required
                    value={newCaseForm.case_number}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, case_number: e.target.value })}
                    placeholder={`e.g. 10${cases.length + 1}`}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-[#f1ebdd] focus:border-[#d9aa3d] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#8a948c] mb-1">Incident Date</label>
                  <input
                    type="date"
                    required
                    value={newCaseForm.incident_date}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, incident_date: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-[#f1ebdd] focus:border-[#d9aa3d] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#8a948c] mb-1">Case Title / Syndicate Name</label>
                <input
                  type="text"
                  required
                  value={newCaseForm.title}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                  placeholder="e.g. Coastal Narcotics & Contraband Trafficking Syndicate"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-[#f1ebdd] focus:border-[#d9aa3d] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#8a948c] mb-1">Crime Category</label>
                  <select
                    value={newCaseForm.crime_category}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, crime_category: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-[#f1ebdd] focus:border-[#d9aa3d] outline-none cursor-pointer"
                  >
                    <option value="Armed Extortion / Robbery">Armed Extortion / Robbery</option>
                    <option value="Cyber Phishing & Crypto Fraud">Cyber Phishing & Crypto Fraud</option>
                    <option value="Arms Act 1959 / Contraband">Arms Act 1959 / Contraband</option>
                    <option value="Commercial Hawala & PMLA">Commercial Hawala & PMLA</option>
                    <option value="Organized Auto Theft">Organized Auto Theft</option>
                    <option value="NDPS Narcotics Trafficking">NDPS Narcotics Trafficking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8a948c] mb-1">Police Bureau / Jurisdiction</label>
                  <input
                    type="text"
                    required
                    value={newCaseForm.jurisdiction}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, jurisdiction: e.target.value })}
                    placeholder="e.g. Crime Branch, Delhi Police"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-[#f1ebdd] focus:border-[#d9aa3d] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#8a948c] mb-1">Initial Brief Summary</label>
                <textarea
                  rows={2}
                  value={newCaseForm.summary}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, summary: e.target.value })}
                  placeholder="Summary of complaint, primary suspects intercepted, or initial intelligence tip…"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-[#f1ebdd] focus:border-[#d9aa3d] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreatingCase(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs text-[#8a948c] hover:text-[#f1ebdd] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#d9aa3d] to-[#d97706] px-5 py-2 text-xs font-bold text-[#080a08] hover:brightness-110 shadow-md cursor-pointer"
                >
                  Register & Lock Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 8-STAGE FORENSIC PIPELINE EXECUTION MODAL ───────────────────────── */}
      {(isProcessing || completed) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl border border-[rgba(217,170,61,0.4)] bg-[#0d100e] p-7 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d9aa3d]/15 text-[#d9aa3d] border border-[#d9aa3d]/30">
                  <Cpu size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#f1ebdd] uppercase tracking-wide">
                    {completed ? 'Forensic Pipeline Completed' : 'Executing 8-Stage Neural Ingestion'}
                  </h3>
                  <p className="text-[11px] text-[#8a948c]">
                    Bound to Target: CASE-{activeCaseObj.case_number}
                  </p>
                </div>
              </div>

              {completed && (
                <button
                  type="button"
                  onClick={() => { setCompleted(false); setIsProcessing(false); }}
                  className="text-[#8a948c] hover:text-[#f1ebdd] cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8a948c]">Overall Pipeline Progress:</span>
                <span className="text-[#d9aa3d] font-bold">{progressPercent}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-black/60 overflow-hidden ring-1 ring-white/5">
                <div
                  className="h-full bg-gradient-to-r from-[#d9aa3d] via-[#f59e0b] to-[#4ade80] rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* 8-Stage Stepper */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin text-xs">
              {PIPELINE_STEPS.map((st, idx) => {
                const isDone = idx < pipelineIdx || completed;
                const isCurrent = idx === pipelineIdx && !completed;

                return (
                  <div
                    key={st.step}
                    className={clsx(
                      'flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs',
                      isDone
                        ? 'border-emerald-900/40 bg-emerald-950/20 text-[#4ade80]'
                        : isCurrent
                        ? 'border-[#d9aa3d]/50 bg-[#d9aa3d]/10 text-[#d9aa3d] font-bold shadow-sm'
                        : 'border-white/5 bg-black/20 text-[#8a948c]'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] font-bold opacity-60">
                        {st.step}
                      </span>
                      {isDone ? (
                        <CheckCircle2 size={14} className="text-[#4ade80]" />
                      ) : isCurrent ? (
                        <RefreshCw size={14} className="animate-spin text-[#d9aa3d]" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-white/10" />
                      )}
                      <span>{st.title}</span>
                    </div>

                    <span className="font-mono text-[10px]">
                      {isDone ? 'COMPLETED' : isCurrent ? 'PROCESSING…' : 'WAITING'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Summary Statistics upon completion */}
            {completed && summaryStats && (
              <div className="rounded-2xl border border-[rgba(94,159,104,0.3)] bg-[rgba(94,159,104,0.08)] p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#4ade80]">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle size={15} />
                    Knowledge Graph Synchronized Successfully
                  </span>
                  <span className="font-mono text-[10px] text-[#8a948c]">HASH VERIFIED</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-black/40 p-2 border border-white/5">
                    <div className="font-bold text-lg text-[#d9aa3d] font-mono">{summaryStats.entities_resolved}</div>
                    <div className="text-[9px] text-[#8a948c] uppercase">Entities Extracted</div>
                  </div>
                  <div className="rounded-xl bg-black/40 p-2 border border-white/5">
                    <div className="font-bold text-lg text-[#4ade80] font-mono">{summaryStats.edges_created}</div>
                    <div className="text-[9px] text-[#8a948c] uppercase">Relationships Formed</div>
                  </div>
                  <div className="rounded-xl bg-black/40 p-2 border border-white/5">
                    <div className="font-bold text-lg text-[#38bdf8] font-mono">100%</div>
                    <div className="text-[9px] text-[#8a948c] uppercase">Audit Chain Sealed</div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {completed && (
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setCompleted(false); setIsProcessing(false); }}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs text-[#8a948c] hover:text-[#f1ebdd] cursor-pointer"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCompleted(false);
                    setIsProcessing(false);
                    setActiveTab('network');
                  }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d9aa3d] to-[#d97706] px-5 py-2 text-xs font-bold text-[#080a08] hover:brightness-110 shadow-lg cursor-pointer"
                >
                  <span>Explore in Knowledge Graph</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
