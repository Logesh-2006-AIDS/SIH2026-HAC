import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Edit3, Merge, MessageSquare, Sparkles, User, ArrowRight } from 'lucide-react';

export default function VerificationCenterPage() {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/v1/leads/');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
        if (data.length > 0 && !selectedLead) setSelectedLead(data[0]);
      }
    } catch (err) {
      console.error('Leads fetch error:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDecision = async (leadId, status) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/leads/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          status,
          officer_notes: notes
        })
      });
      if (res.ok) {
        await fetchLeads();
        setNotes('');
      }
    } catch (err) {
      console.error('Decision error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-slate-900 to-slate-900">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Human-in-the-Loop Evidence Verification Center</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 font-semibold">
                JUDICIAL QUALITY CONTROL
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Formally approve or reject AI-generated entity matches, alias resolution & edge predictions before court submission.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Pending Judicial Approval: <strong className="text-blue-400">{leads.filter(l => l.status === 'UNDER_REVIEW').length}</strong>
        </div>
      </div>

      {/* Main Verification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Queue Table (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Pending AI Inferences Queue</span>
              <span className="text-xs font-mono text-slate-500">{leads.length} Records</span>
            </h3>

            <div className="space-y-2.5">
              {leads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                const statusBadge = {
                  VERIFIED: 'bg-emerald-950 text-emerald-400 border-emerald-800',
                  UNDER_REVIEW: 'bg-amber-950 text-amber-400 border-amber-800',
                  REJECTED: 'bg-red-950 text-red-400 border-red-800'
                }[lead.status] || 'bg-slate-800 text-slate-400';

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500/50 shadow-md'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <div>
                        <span className="font-bold text-slate-100">{lead.source}</span>
                        <span className="text-blue-400"> ➔ [{lead.relation}] ➔ </span>
                        <span className="font-bold text-slate-100">{lead.target}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${statusBadge}`}>
                        {lead.status}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-300 italic">
                      "{lead.evidence}"
                    </p>

                    <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500 font-mono">
                      <span>Case: <strong className="text-slate-300">{lead.case_id}</strong></span>
                      <span>NLP Confidence: <strong className="text-cyan-400">{(lead.confidence * 100).toFixed(0)}%</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Decision Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {selectedLead ? (
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-2xl space-y-5 text-xs">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold">
                  JUDICIAL VERIFICATION PANEL
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-1">
                  Evidence Item #{selectedLead.id}
                </h3>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400 font-bold uppercase block text-[10px]">Underlying Citation:</span>
                <p className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 italic leading-relaxed">
                  "{selectedLead.evidence}"
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400 font-bold uppercase block text-[10px]">Investigating Officer Findings:</span>
                <textarea
                  rows={3}
                  placeholder="Enter corroboration or rejection notes for trial..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 text-xs text-slate-100 p-3 rounded-xl border border-slate-700 font-mono resize-none focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleDecision(selectedLead.id, 'VERIFIED')}
                  disabled={loading}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-xs transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Lock In</span>
                </button>

                <button
                  onClick={() => handleDecision(selectedLead.id, 'REJECTED')}
                  disabled={loading}
                  className="py-2.5 px-4 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-extrabold text-xs transition flex items-center justify-center space-x-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Evidence</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 text-center text-xs text-slate-500">
              Select an item on the left to verify.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
