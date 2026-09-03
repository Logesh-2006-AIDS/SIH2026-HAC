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
  Printer
} from 'lucide-react';
import CytoscapeGraph from '../components/CytoscapeGraph.jsx';
import SmartCaseBrief from '../components/SmartCaseBrief.jsx';

export default function WorkbenchPage({ caseId = "FIR-2025-ND-101", onNavigateToEntity }) {
  const [caseDetail, setCaseDetail] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [showBrief, setShowBrief] = useState(false);

  useEffect(() => {
    const fetchCase = async () => {
      setLoading(true);
      try {
        const [caseRes, graphRes] = await Promise.all([
          fetch(`/api/v1/cases/${caseId}`),
          fetch('/api/v1/graph/')
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
        }
      } catch (err) {
        console.error('Workbench fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workbench Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-slate-900 to-slate-900">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase">ACTIVE INVESTIGATION WORKBENCH</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                {caseDetail?.fir_number || caseId}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 mt-0.5">{caseDetail?.title || 'Case Investigation Workspace'}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowBrief(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center space-x-1.5 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Generate Judicial Brief</span>
          </button>
        </div>
      </div>

      {/* 3-Column Main Grid (3 cols Left, 6 cols Center Graph, 3 cols Right Entity) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Case Info & Legal Sections (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-3.5 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>FIR Legal Particulars</span>
            </h3>

            <div className="space-y-2 font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">JURISDICTION</span>
                <span className="text-slate-200 font-bold">{caseDetail?.police_station || 'Rohini Sector 7, Delhi'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">DATE & TIME</span>
                <span className="text-slate-200">{new Date(caseDetail?.created_at || Date.now()).toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">APPLICABLE IPC / ACTS</span>
                <span className="text-amber-400 font-bold">Section 302, 307, 120B IPC & Arms Act 25</span>
              </div>
            </div>

            {/* Brief Narrative */}
            <div>
              <span className="text-slate-400 text-[10px] font-bold block mb-1">INCIDENT NARRATIVE:</span>
              <p className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
                {caseDetail?.raw_text || 'Raid conducted near Rohini Outer Ring Road. Accused Ravi Kumar @ Ravan along with Vikram Singh alias Vicky conspired armed assault.'}
              </p>
            </div>
          </div>
        </div>

        {/* CENTER: Cytoscape Relationship Graph (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <CytoscapeGraph
            nodes={graphData.nodes}
            edges={graphData.edges}
            onNodeSelect={(node) => setSelectedEntity(node)}
            selectedNodeId={selectedEntity?.id || selectedEntity?.normalized}
            height="480px"
          />
        </div>

        {/* RIGHT: Selected Entity Evidence & Connections (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {selectedEntity ? (
            <div className="p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4 text-xs">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  ENTITY INSPECTOR
                </span>
                <h3 className="text-base font-extrabold text-slate-100 mt-1">
                  {selectedEntity.name || selectedEntity.normalized || selectedEntity.text}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 mt-1 inline-block">
                  {selectedEntity.label || selectedEntity.type || 'SUSPECT_PERSON'}
                </span>
              </div>

              {/* Confidence & Centrality */}
              <div className="grid grid-cols-2 gap-2 font-mono text-center">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[9px] block">CONFIDENCE</span>
                  <strong className="text-cyan-400">96% Conf</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[9px] block">THREAT INDEX</span>
                  <strong className="text-red-400">92/100</strong>
                </div>
              </div>

              {/* Evidence Sentence */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Judicial Evidence Quote:</span>
                <p className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-200 italic leading-relaxed">
                  "Accused identified operating vehicle DL01AB1234 and phone +91-98765-32100 during armed robbery incident."
                </p>
              </div>

              <button
                onClick={() => onNavigateToEntity(selectedEntity)}
                className="w-full py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center justify-center space-x-1"
              >
                <span>Full Cross-Case Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 text-center text-xs text-slate-500">
              Click a node on the central relationship graph to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Investigation Timeline & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Investigation Chronology & Evidence Timeline</span>
          </h3>

          <div className="space-y-2 font-mono text-xs max-h-48 overflow-y-auto pr-1">
            {[
              { time: '14 Feb 2025, 21:30', text: 'FIR Registered under Section 302/307/120B IPC at PS Rohini.', status: 'FILED' },
              { time: '14 Feb 2025, 22:15', text: 'Getaway vehicle DL01AB1234 flagged at Outer Ring Road toll camera.', status: 'DETECTED' },
              { time: '15 Feb 2025, 03:00', text: 'CDR analysis revealed 12 encrypted calls to Gurgaon cell tower.', status: 'INTERCEPTED' },
              { time: '16 Feb 2025, 11:45', text: 'Cross-case linkage established with Bandra Cyber syndicate (FIR-102).', status: 'LINKED' }
            ].map((ev, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 text-[10px] block">{ev.time}</span>
                  <span className="text-slate-200">{ev.text}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-amber-400 border border-slate-700">
                  {ev.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Suggested Leads & Insights (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Suggested Leads for this Case</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-slate-100">Vikram Singh ➔ Apex Logistics Front</span>
                <span className="text-[10px] font-bold text-purple-400">94% Confidence</span>
              </div>
              <p className="text-[11px] text-slate-300 italic">
                AI Link Prediction: Strong probability of hidden bank remittance to Apex Logistics shell accounts.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-slate-100">DL01AB1234 ➔ HR26DQ5544 Convoy</span>
                <span className="text-[10px] font-bold text-cyan-400">91% Confidence</span>
              </div>
              <p className="text-[11px] text-slate-300 italic">
                Vehicles were recorded moving in tandem along the Delhi-Gurgaon expressway within 180 seconds.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Case Brief Modal */}
      {showBrief && (
        <SmartCaseBrief
          caseData={caseDetail}
          onClose={() => setShowBrief(false)}
        />
      )}
    </div>
  );
}
