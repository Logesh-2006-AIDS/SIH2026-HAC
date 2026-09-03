import React, { useState, useEffect } from 'react';
import { GitMerge, ArrowRight, ShieldCheck, Sparkles, User, Phone, Car, MapPin, Building, AlertTriangle } from 'lucide-react';

export default function CrossCasePage({ onNavigateToWorkbench }) {
  const [caseList, setCaseList] = useState([]);
  const [caseA, setCaseA] = useState('FIR-2025-ND-101');
  const [caseB, setCaseB] = useState('FIR-2025-ND-102');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch('/api/v1/cross-case/cases');
        if (res.ok) {
          const data = await res.json();
          setCaseList(data);
        }
      } catch (err) {
        console.error('Error fetching cross-cases:', err);
      }
    };
    fetchCases();
  }, []);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/cross-case/compare?case_a=${encodeURIComponent(caseA)}&case_b=${encodeURIComponent(caseB)}`);
      if (res.ok) {
        const data = await res.json();
        setComparison(data);
      }
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCompare();
  }, [caseA, caseB]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-red-900/40 bg-gradient-to-r from-red-950/40 via-black to-black shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-600/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
            <GitMerge className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Cross-Case Intelligence & Syndicate Linkage</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-semibold font-mono">
                INTER-JURISDICTIONAL
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Discover shared criminal operatives, common getaway vehicles, and laundering corridors across independent FIRs.
            </p>
          </div>
        </div>
      </div>

      {/* Case Selector Comparison Bar */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-bold text-slate-300 block mb-1">Select Primary Case A:</label>
          <select
            value={caseA}
            onChange={(e) => setCaseA(e.target.value)}
            className="w-full bg-slate-900 text-xs text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 font-mono focus:border-indigo-400"
          >
            {caseList.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_id} - {c.title} ({c.district})
              </option>
            ))}
          </select>
        </div>

        <div className="text-indigo-400 font-bold text-lg hidden sm:block">➔ ⨁ ➔</div>

        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-bold text-slate-300 block mb-1">Select Secondary Case B:</label>
          <select
            value={caseB}
            onChange={(e) => setCaseB(e.target.value)}
            className="w-full bg-slate-900 text-xs text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 font-mono focus:border-indigo-400"
          >
            {caseList.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_id} - {c.title} ({c.district})
              </option>
            ))}
          </select>
        </div>

        <div className="self-end">
          <button
            onClick={handleCompare}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition shadow-lg shadow-indigo-500/20"
          >
            {loading ? 'Analyzing...' : 'Run Correlation'}
          </button>
        </div>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Summary Match Score Card */}
          <div className="p-5 rounded-2xl glass-panel border border-indigo-500/30 shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">CORRELATION RESULT</span>
              <h2 className="text-lg font-bold text-slate-100">{comparison.rationale}</h2>
              <p className="text-xs text-slate-400">{comparison.recommended_action}</p>
            </div>

            <div className="flex items-center space-x-3 font-mono">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block">SIMILARITY</span>
                <strong className="text-indigo-400 text-base">{(comparison.similarity_score * 100).toFixed(0)}%</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block">THREAT LEVEL</span>
                <strong className="text-red-400 text-base">{comparison.threat_correlation}</strong>
              </div>
            </div>
          </div>

          {/* Visual Connecting Path */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Multi-Hop Criminal Syndicate Bridge Path</span>
            </h3>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              {comparison.connecting_path?.map((step, idx) => (
                <React.Fragment key={idx}>
                  <span className={`px-3 py-1.5 rounded-lg border font-bold ${
                    step.type === 'Bridge Node'
                      ? 'bg-red-950/80 text-red-300 border-red-800 animate-pulse'
                      : (step.type === 'Relation' ? 'bg-slate-900 text-cyan-400 border-cyan-800/60' : 'bg-slate-800 text-slate-200 border-slate-700')
                  }`}>
                    {step.node}
                  </span>
                  {idx < comparison.connecting_path.length - 1 && <span className="text-indigo-400">➔</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Shared Entities Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Shared Persons */}
            <div className="p-5 rounded-2xl glass-panel border border-red-500/20 shadow-xl space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-red-400">
                <User className="w-4 h-4" />
                <span>Shared Suspects / Persons</span>
              </div>
              <div className="space-y-2 text-xs">
                {comparison.shared_entities?.persons?.length === 0 ? (
                  <span className="text-slate-500">No direct shared persons</span>
                ) : (
                  comparison.shared_entities.persons.map((p, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="font-bold text-slate-200">{p.name} ({p.alias})</div>
                      <div className="text-[10px] text-slate-400 font-mono">Case A: {p.role_in_case_a}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Case B: {p.role_in_case_b}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Shared Vehicles & Phones */}
            <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20 shadow-xl space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400">
                <Phone className="w-4 h-4" />
                <span>Shared Phones / CDR</span>
              </div>
              <div className="space-y-2 text-xs">
                {comparison.shared_entities?.phones?.length === 0 ? (
                  <span className="text-slate-500">No shared phones</span>
                ) : (
                  comparison.shared_entities.phones.map((ph, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-bold font-mono text-cyan-300">{ph.phone}</div>
                      <p className="text-[10px] text-slate-400 mt-1">{ph.evidence}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Shared Organizations / Shells */}
            <div className="p-5 rounded-2xl glass-panel border border-purple-500/20 shadow-xl space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-purple-400">
                <Building className="w-4 h-4" />
                <span>Shared Shell Companies & Fronts</span>
              </div>
              <div className="space-y-2 text-xs">
                {comparison.shared_entities?.organizations?.length === 0 ? (
                  <span className="text-slate-500">No shared shell fronts</span>
                ) : (
                  comparison.shared_entities.organizations.map((org, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-bold text-purple-300">{org.name}</div>
                      <p className="text-[10px] text-slate-400 mt-1">{org.evidence}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
