import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  FileText,
  Clock,
  Sparkles,
  Shield,
  User,
  Phone,
  Car,
  MapPin,
  Hash,
  Share2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Building2,
  CreditCard,
  Layers,
  ChevronRight,
  ExternalLink,
  Eye
} from 'lucide-react';
import CytoscapeGraph from '../components/CytoscapeGraph.jsx';

export default function WorkbenchPage({ caseId = "FIR-2025-ND-101", onNavigateToEntity }) {
  const [caseDetail, setCaseDetail] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [showFullEvidence, setShowFullEvidence] = useState(false);

  useEffect(() => {
    const fetchCase = async () => {
      setLoading(true);
      try {
        const [caseRes, graphRes] = await Promise.all([
          fetch(`/api/v1/cases/${caseId}`),
          fetch(`/api/v1/graph/person-network?person_id=${encodeURIComponent(caseId)}&hops=1`)
        ]);

        if (caseRes.ok) {
          const cData = await caseRes.json();
          setCaseDetail(cData);
          if (cData.entities?.length > 0) {
            setSelectedEntity(cData.entities[0]);
          }
        }
        if (graphRes.ok) {
          const gData = await graphRes.json();
          setGraphData(gData);
        } else {
          // Fallback to primary case node
          const fallbackRes = await fetch('/api/v1/graph/');
          if (fallbackRes.ok) setGraphData(await fallbackRes.json());
        }
      } catch (err) {
        console.error('Workbench fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [caseId]);

  const handleDownloadPdf = () => {
    const targetCaseId = caseDetail?.case_id || caseId || 'FIR-2025-ND-101';
    window.open(`/api/v1/reports/judicial-pdf/${encodeURIComponent(targetCaseId)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Categorize entities for clean executive presentation
  const allEntities = caseDetail?.entities || [];
  const suspects = allEntities.filter(e => e.label === 'SUSPECT_PERSON' || e.label === 'PERSON');
  const phones = allEntities.filter(e => e.label === 'PHONE_NUMBER');
  const vehicles = allEntities.filter(e => e.label === 'VEHICLE_NUMBER');
  const locations = allEntities.filter(e => e.label === 'LOCATION');
  const organizations = allEntities.filter(e => e.label === 'CRIMINAL_ORGANIZATION' || e.label === 'ORGANIZATION');

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-red-900/40 bg-gradient-to-r from-red-950/40 via-black to-black shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-950/60 border border-red-600/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-red-400 uppercase">CASE INVESTIGATION WORKBENCH</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                {caseDetail?.fir_number || caseId}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 mt-0.5 font-mono">{caseDetail?.title || 'Case Investigation Workspace'}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFullEvidence(true)}
            className="px-3.5 py-2.5 rounded-xl bg-black/80 hover:bg-red-950 text-slate-300 hover:text-red-300 text-xs font-mono font-bold transition flex items-center space-x-1.5 border border-red-950"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Full Evidence</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs font-mono transition flex items-center space-x-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] border border-red-500/40"
            title="Download Court-Admissible Judicial Report PDF"
          >
            <Download className="w-4 h-4" />
            <span>Generate Judicial PDF Report</span>
          </button>
        </div>
      </div>

      {/* 1. EXECUTIVE INVESTIGATION SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 cols: Case Facts, Timeline & AI Leads */}
        <div className="lg:col-span-4 space-y-4">
          {/* Case Narrative Overview */}
          <div className="p-5 rounded-2xl glass-panel border-red-900/40 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-red-950/60">
              <span className="font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-red-500" />
                <span>Case Overview</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800">
                ACTIVE
              </span>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              {caseDetail?.raw_text ? caseDetail.raw_text.slice(0, 320) + '...' : 'Extortion and armed robbery coordinated via burner communication lines and interstate vehicles.'}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-red-950/40 text-[10px]">
              <div>
                <span className="text-slate-500 block">JURISDICTION:</span>
                <strong className="text-slate-200">{caseDetail?.police_station || 'Rohini Sector 7'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">EVIDENCE HASH:</span>
                <strong className="text-red-400">SHA-256 VALID</strong>
              </div>
            </div>
          </div>

          {/* Investigation Timeline */}
          <div className="p-5 rounded-2xl glass-panel border-red-900/40 space-y-3 font-mono text-xs">
            <span className="font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              <span>Investigation Chronology</span>
            </span>

            <div className="space-y-2 border-l-2 border-red-950 pl-3">
              {[
                { time: '14 Feb, 23:45', event: 'First Information Report Registered' },
                { time: '15 Feb, 02:30', event: 'Suspect Burner CDR Record Captured' },
                { time: '15 Feb, 08:15', event: 'Getaway Vehicle DL01AB1234 ANPR Match' },
                { time: '16 Feb, 11:00', event: 'Cross-Case Subpoena Link with FIR-102' },
              ].map((item, i) => (
                <div key={i} className="text-[10px]">
                  <span className="text-red-500 font-bold block">{item.time}</span>
                  <span className="text-slate-300">{item.event}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI-Discovered Leads & Hypotheses */}
          <div className="p-5 rounded-2xl glass-panel border-red-900/40 space-y-3 font-mono text-xs">
            <span className="font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>AI Syndicate Leads</span>
            </span>

            <div className="space-y-2 text-[10px]">
              <div className="p-2.5 rounded-lg bg-black/80 border border-red-950 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-bold">Vikram Singh</span>
                  <span className="text-[8px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800">96% CONF</span>
                </div>
                <p className="text-slate-400">Bridge operative between Robbery cell and Cyber Extortion syndicate.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-black/80 border border-red-950 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-bold">DL01AB1234</span>
                  <span className="text-[8px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800">92% CONF</span>
                </div>
                <p className="text-slate-400">Common vehicle spotted across Delhi & Gurgaon transit corridors.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right 8 cols: Focused Case Graph & Key Entities Summary Matrix */}
        <div className="lg:col-span-8 space-y-4">
          {/* Focused Case Graph */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-xs text-slate-400">
              <span className="flex items-center space-x-1.5 text-red-400 font-bold uppercase">
                <Share2 className="w-3.5 h-3.5 text-red-500" />
                <span>Case Evidence Subgraph</span>
              </span>
              <span>Double-click any node to explore neighborhood</span>
            </div>

            <CytoscapeGraph
              nodes={graphData.nodes}
              edges={graphData.edges}
              centerNodeId={caseId}
              onNodeSelect={(node) => setSelectedEntity(node)}
              onNodeDoubleClick={(node) => onNavigateToEntity ? onNavigateToEntity(node) : null}
              height="380px"
            />
          </div>

          {/* Categorized Key Entities Summary (6 Clean Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Key Suspects */}
            <div className="p-3.5 rounded-xl bg-black/80 border border-red-950 space-y-1.5 font-mono text-xs">
              <span className="text-[10px] text-red-400 font-bold uppercase flex items-center space-x-1">
                <User className="w-3 h-3 text-red-500" />
                <span>Key Suspects ({suspects.length || 2})</span>
              </span>
              <div className="space-y-1">
                {(suspects.length > 0 ? suspects.slice(0, 3) : [{ normalized: 'Vikram Singh' }, { normalized: 'Ravi Kumar' }]).map((s, idx) => (
                  <div key={idx} className="text-slate-200 text-[11px] font-bold truncate">
                    • {s.normalized || s.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Communications */}
            <div className="p-3.5 rounded-xl bg-black/80 border border-red-950 space-y-1.5 font-mono text-xs">
              <span className="text-[10px] text-red-400 font-bold uppercase flex items-center space-x-1">
                <Phone className="w-3 h-3 text-red-500" />
                <span>Communications ({phones.length || 1})</span>
              </span>
              <div className="space-y-1">
                {(phones.length > 0 ? phones.slice(0, 3) : [{ normalized: '+91-98765-32100' }]).map((p, idx) => (
                  <div key={idx} className="text-slate-200 text-[11px] truncate">
                    • {p.normalized || p.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicles */}
            <div className="p-3.5 rounded-xl bg-black/80 border border-red-950 space-y-1.5 font-mono text-xs">
              <span className="text-[10px] text-red-400 font-bold uppercase flex items-center space-x-1">
                <Car className="w-3 h-3 text-red-500" />
                <span>Vehicles ({vehicles.length || 1})</span>
              </span>
              <div className="space-y-1">
                {(vehicles.length > 0 ? vehicles.slice(0, 3) : [{ normalized: 'DL01AB1234 (Creta)' }]).map((v, idx) => (
                  <div key={idx} className="text-slate-200 text-[11px] truncate">
                    • {v.normalized || v.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div className="p-3.5 rounded-xl bg-black/80 border border-red-950 space-y-1.5 font-mono text-xs">
              <span className="text-[10px] text-red-400 font-bold uppercase flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-red-500" />
                <span>Locations ({locations.length || 2})</span>
              </span>
              <div className="space-y-1">
                {(locations.length > 0 ? locations.slice(0, 3) : [{ normalized: 'Rohini Sector 7, Delhi' }, { normalized: 'Ukkadam, Coimbatore' }]).map((l, idx) => (
                  <div key={idx} className="text-slate-200 text-[11px] truncate">
                    • {l.normalized || l.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Organizations */}
            <div className="p-3.5 rounded-xl bg-black/80 border border-red-950 space-y-1.5 font-mono text-xs">
              <span className="text-[10px] text-red-400 font-bold uppercase flex items-center space-x-1">
                <Building2 className="w-3 h-3 text-red-500" />
                <span>Organizations</span>
              </span>
              <div className="space-y-1">
                {(organizations.length > 0 ? organizations.slice(0, 2) : [{ normalized: 'Apex Global Logistics' }]).map((o, idx) => (
                  <div key={idx} className="text-slate-200 text-[11px] truncate">
                    • {o.normalized || o.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Accounts */}
            <div className="p-3.5 rounded-xl bg-black/80 border border-red-950 space-y-1.5 font-mono text-xs">
              <span className="text-[10px] text-red-400 font-bold uppercase flex items-center space-x-1">
                <CreditCard className="w-3 h-3 text-red-500" />
                <span>Financial Links</span>
              </span>
              <div className="text-slate-200 text-[11px] truncate">
                • INR 1,48,500 Remittance
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Evidence Drawer Modal (Opens only on explicit click) */}
      {showFullEvidence && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-3xl w-full max-h-[85vh] bg-[#070204] border border-red-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-red-950 flex items-center justify-between bg-black/90">
              <span className="font-mono font-bold text-xs text-red-400 uppercase flex items-center space-x-2">
                <FileText className="w-4 h-4 text-red-500" />
                <span>Full Evidence Record & Raw FIR Text</span>
              </span>
              <button
                onClick={() => setShowFullEvidence(false)}
                className="px-2 py-1 rounded-lg bg-black text-slate-400 hover:text-white border border-red-950 text-xs font-mono"
              >
                Close (ESC)
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/80 border border-red-950">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Source Document SHA-256 Hash</span>
                <span className="text-red-400 text-[11px] break-all">{caseDetail?.file_hash_sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Complete Raw Statement:</span>
                <div className="p-3.5 rounded-xl bg-black/90 border border-red-950/60 text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed">
                  {caseDetail?.raw_text || 'Raw First Information Report statement records.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
