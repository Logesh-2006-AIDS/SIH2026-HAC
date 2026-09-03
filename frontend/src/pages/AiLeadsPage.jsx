import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Edit3, Merge, MessageSquare, ArrowRight } from 'lucide-react';

export default function AiLeadsPage({ onLeadUpdated }) {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/v1/leads/');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
        if (data.length > 0 && !selectedLead) {
          setSelectedLead(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleAction = async (leadId, action) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/leads/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          status: action === 'ACCEPT' ? 'VERIFIED' : (action === 'REJECT' ? 'REJECTED' : 'UNDER_REVIEW'),
          officer_notes: remarks
        })
      });
      if (res.ok) {
        await fetchLeads();
        if (onLeadUpdated) onLeadUpdated();
        setRemarks('');
      }
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-slate-900 to-slate-900">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>AI Leads & Link Prediction Engine</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 font-semibold">
                GRAPH AI INFERENCE
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Jaccard & Common Neighbor link predictions. AI inferences are kept strictly separate from verified judicial facts.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Pending Verification: <strong className="text-purple-400">{leads.filter(l => l.status === 'UNDER_REVIEW').length}</strong>
        </div>
      </div>

      {/* Main Grid: Leads Roster (7 cols) + Action Decision Station (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Leads Table (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Predicted Criminal Network Edges</span>
              <span className="text-xs font-mono text-slate-500">{leads.length} Hypotheses</span>
            </h3>

            <div className="space-y-3">
              {leads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                const isVerified = lead.status === 'VERIFIED';
                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-500/10 border-purple-500/60 shadow-lg'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-mono text-xs">
                        <span className="font-bold text-slate-100">{lead.source}</span>
                        <span className="text-purple-400">➔ [{lead.relation}] ➔</span>
                        <span className="font-bold text-slate-100">{lead.target}</span>
                      </div>

                      {/* Status Distinction Badge */}
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-extrabold ${
                        isVerified ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-purple-950 text-purple-300 border-purple-800'
                      }`}>
                        {isVerified ? '● VERIFIED CONNECTION' : '⚡ AI-SUGGESTED LEAD'}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-300 italic">
                      "{lead.evidence}"
                    </p>

                    <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500 font-mono">
                      <span>Case: <strong className="text-slate-300">{lead.case_id}</strong></span>
                      <span>Link Prediction Score: <strong className="text-purple-400 font-bold">{(lead.confidence * 100).toFixed(0)}%</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Lead Decision Station (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {selectedLead ? (
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-2xl space-y-5">
              <div className="pb-4 border-b border-slate-800">
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
                  LEAD EVALUATION STATION
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-1">
                  Lead #{selectedLead.id}: {selectedLead.source} ➔ {selectedLead.target}
                </h3>
              </div>

              {/* Status Banner */}
              <div className={`p-3 rounded-xl border text-xs font-mono font-bold flex items-center space-x-2 ${
                selectedLead.status === 'VERIFIED'
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
                  : 'bg-purple-950/40 text-purple-300 border-purple-800'
              }`}>
                <ShieldCheck className="w-4 h-4" />
                <span>Classification: {selectedLead.status === 'VERIFIED' ? 'CONFIRMED JUDICIAL EVIDENCE' : 'AI HYPOTHESIS (UNVERIFIED)'}</span>
              </div>

              {/* Supporting Evidence */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Ground-Truth Supporting Evidence:
                </label>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed italic">
                  "{selectedLead.evidence}"
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center space-x-1">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Investigator Remarks / Justification:</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter notes or justification..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-slate-900 text-xs text-slate-100 p-3 rounded-xl border border-slate-700 font-mono resize-none focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleAction(selectedLead.id, 'ACCEPT')}
                  disabled={loading}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Lead</span>
                </button>

                <button
                  onClick={() => handleAction(selectedLead.id, 'REJECT')}
                  disabled={loading}
                  className="py-2.5 px-4 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold transition flex items-center justify-center space-x-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Lead</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 text-center text-xs text-slate-500">
              Select an AI lead to review evidence and confirm link.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
