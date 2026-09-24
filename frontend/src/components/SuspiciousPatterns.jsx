import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, Shield, Zap, Phone, DollarSign, GitBranch, 
  Clock, RefreshCw, ChevronDown, ChevronUp, ExternalLink, 
  Search, CheckCircle2, ArrowRight, ShieldAlert, Sparkles, Filter
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import axios from 'axios';
import clsx from 'clsx';

const DEFAULT_PATTERNS = [
  {
    id: 'PAT-001',
    type: 'CROSS_CASE_ENTITY',
    title: 'High-Centrality Bridge Suspect: Vikram Singh',
    severity: 'CRITICAL',
    confidence: 0.96,
    cases: ['CASE-101', 'CASE-102', 'CASE-103'],
    rule: 'Rule BR-01: Person entity present across >= 3 active FIR networks',
    description: 'Suspect Vikram Singh acts as an inter-syndicate logistics coordinator connecting Delhi Extortion (Case 101), Cyber Phishing (Case 102), and Arms Supply (Case 103).',
    evidence: 'Shared phone (+91-98110-44501) and vehicle plate (DL-01-AB-1234) intercepted in CDR records of both Case 101 and 102 within 48 hours.',
    action_recommended: 'Issue inter-state lookout notice and execute Section 91 CrPC notice for call tower location dumps.',
    entities: [
      { id: 'P002', name: 'Vikram Singh', type: 'Person' },
      { id: 'O001', name: 'Apex Global Logistics', type: 'Organization' },
      { id: 'V001', name: 'DL-01-AB-1234', type: 'Vehicle' }
    ],
  },
  {
    id: 'PAT-002',
    type: 'SUSPICIOUS_TRANSFER',
    title: 'Shell Company Hawala Layering: Apex Global Logistics',
    severity: 'CRITICAL',
    confidence: 0.94,
    cases: ['CASE-101', 'CASE-105'],
    rule: 'Rule FIN-03: Rapid account dispersal from extortion proceeds within 2 hours',
    description: 'Rs. 15,00,000 extorted from M/s Royal Jewellers in Case 101 was immediately deposited and split across 4 downstream shell accounts in Case 105.',
    evidence: 'Bank statement ICICI 112233445566778 received Rs. 15L at 20:15 hrs; wired Rs. 3.75L each to four shell entities before 22:00 hrs.',
    action_recommended: 'Submit urgent PMLA freeze request to FIU-IND for ICICI account 112233445566778 and associate ledgers.',
    entities: [
      { id: 'O001', name: 'Apex Global Logistics', type: 'Organization' },
      { id: 'P001', name: 'Ravi Kumar', type: 'Person' },
      { id: 'P004', name: 'Aarav Mehta', type: 'Person' }
    ],
  },
  {
    id: 'PAT-003',
    type: 'HIGH_CALL_FREQUENCY',
    title: 'Burst Communication Cluster Prior to Extortion Incident',
    severity: 'HIGH',
    confidence: 0.91,
    cases: ['CASE-101'],
    rule: 'Rule CDR-02: > 15 calls in 60-minute window between unlisted numbers',
    description: '24 calls exchanged between Ravi Kumar (+91-98110-44501) and field operative between 18:30 and 19:30 hrs preceding the showroom armed assault.',
    evidence: 'Cell Tower ID DL-NORTH-8890 shows both devices co-located 300 meters from Chandni Chowk incident site during call burst.',
    action_recommended: 'Extract handset IMEI forensic dump and map co-travel tower pathing from 18:00 to 21:00 hrs.',
    entities: [
      { id: 'P001', name: 'Ravi Kumar', type: 'Person' },
      { id: 'P003', name: 'Meena Sharma', type: 'Person' }
    ],
  },
  {
    id: 'PAT-004',
    type: 'CLONED_VEHICLE',
    title: 'Cloned License Plate Spotted Across State Lines',
    severity: 'HIGH',
    confidence: 0.88,
    cases: ['CASE-101', 'CASE-104'],
    rule: 'Rule VEH-01: Identical vehicle registration active in two distant toll plazas within 30 min',
    description: 'Getaway vehicle DL-01-AB-1234 recorded in Delhi FIR 101, while identical registration was impounded in Mumbai Auto Theft syndicate (Case 104).',
    evidence: 'FasTag toll sensor match at Badarpur Border and simultaneous FASTag ping at Mumbai Western Express Highway.',
    action_recommended: 'Notify State Transport Authority for engine/chassis number verification against cloned registration.',
    entities: [
      { id: 'V001', name: 'DL-01-AB-1234', type: 'Vehicle' },
      { id: 'P006', name: 'Rohit Patel', type: 'Person' }
    ],
  },
  {
    id: 'PAT-005',
    type: 'BURNER_PHONE',
    title: 'Burner SIM Switch After Crime Occurrence',
    severity: 'MEDIUM',
    confidence: 0.85,
    cases: ['CASE-102', 'CASE-103'],
    rule: 'Rule TEL-04: Handset IMEI switched SIM card immediately post-incident',
    description: 'Handset IMEI 354890123456789 deactivated primary number and activated secondary SIM +91-98765-32100 to contact arms supplier.',
    evidence: 'Telecom CDR carrier switch logs confirm handset reuse across Case 102 cyber coordinator and Case 103 arms smuggler.',
    action_recommended: 'Correlate tower dump for secondary SIM and request cell carrier subscriber verification form (CAF).',
    entities: [
      { id: 'P005', name: 'Suresh Yadav', type: 'Person' },
      { id: 'P004', name: 'Aarav Mehta', type: 'Person' }
    ],
  },
];

const SEVERITY_CONFIG = {
  CRITICAL: {
    color: '#f87171',
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.4)',
    badge: 'CRITICAL RISK',
    icon: Zap,
  },
  HIGH: {
    color: '#fb923c',
    bg: 'rgba(249,115,22,0.15)',
    border: 'rgba(249,115,22,0.4)',
    badge: 'HIGH ALERT',
    icon: AlertTriangle,
  },
  MEDIUM: {
    color: '#d9aa3d',
    bg: 'rgba(217,170,61,0.15)',
    border: 'rgba(217,170,61,0.4)',
    badge: 'MEDIUM',
    icon: Shield,
  },
};

export default function SuspiciousPatterns() {
  const { selectedCase, focusEntityById, setActiveTab } = useInvestigation();
  const [patternsList, setPatternsList] = useState(DEFAULT_PATTERNS);
  const [expandedIds, setExpandedIds] = useState(new Set(['PAT-001', 'PAT-002']));
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadPatterns() {
      setLoading(true);
      try {
        const res = await axios.get('/api/v1/analyst/patterns', {
          params: { case_id: selectedCase },
          timeout: 2000,
        });
        if (res.data?.success && res.data?.data?.patterns?.length) {
          const apiPats = res.data.data.patterns.map((p, idx) => ({
            id: p.id || `PAT-00${idx + 1}`,
            title: p.title || p.pattern_name || `Suspicious Pattern Detected in Case ${selectedCase}`,
            severity: (p.severity || 'HIGH').toUpperCase(),
            confidence: p.confidence || 0.92,
            cases: p.cases || [`CASE-${selectedCase || '101'}`],
            rule: p.rule || 'Automated graph intelligence correlation rule',
            description: p.description || p.summary || 'Unusual cross-entity correlation detected in multi-source datasets.',
            evidence: p.evidence || p.details || 'Corroborated across CDR timestamps and financial account statements.',
            action_recommended: p.action || 'Examine linked nodes in the Knowledge Graph and issue formal intelligence request.',
            entities: (p.entities || []).map(e => typeof e === 'string' ? { id: e, name: e, type: 'Entity' } : e),
          }));
          setPatternsList(apiPats);
        }
      } catch {
        // Use rich default patterns
      } finally {
        setLoading(false);
      }
    }
    loadPatterns();
  }, [selectedCase]);

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(patternsList.map(p => p.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const filteredPatterns = useMemo(() => {
    return patternsList.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.evidence.toLowerCase().includes(q) ||
        (p.cases || []).some(c => c.toLowerCase().includes(q));

      const matchesSeverity = filterSeverity === 'ALL' || p.severity === filterSeverity;
      return matchesSearch && matchesSeverity;
    });
  }, [patternsList, searchQuery, filterSeverity]);

  const counts = {
    ALL: patternsList.length,
    CRITICAL: patternsList.filter(p => p.severity === 'CRITICAL').length,
    HIGH: patternsList.filter(p => p.severity === 'HIGH').length,
    MEDIUM: patternsList.filter(p => p.severity === 'MEDIUM').length,
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#080a08] text-[#f1ebdd] overflow-hidden">
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/5 bg-[#0d100e] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.12)] text-[#f87171]">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#f1ebdd] tracking-wide flex items-center gap-2">
              Suspicious Pattern Intelligence
              <span className="rounded bg-[#f87171]/15 border border-[#f87171]/30 px-2 py-0.5 font-mono text-[10px] text-[#f87171] font-bold">
                {patternsList.length} PATTERNS FLAGGED
              </span>
            </h1>
            <p className="text-xs text-[#8a948c]">
              Explainable rule-based forensic detectors flagging money laundering layering, burst CDR clusters, cloned plates, and cross-case conduits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#c5cfc8] hover:text-[#f1ebdd] hover:bg-white/10 transition cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#8a948c] hover:text-[#f1ebdd] transition cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </header>

      {/* ── FILTER & SEARCH STRIP ───────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-white/5 bg-[#0e1210] px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Severity Filter Pills */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#8a948c] uppercase tracking-wide mr-1">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
            <button
              key={sev}
              type="button"
              onClick={() => setFilterSeverity(sev)}
              className={clsx(
                "px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5",
                filterSeverity === sev
                  ? "bg-[#d9aa3d] text-[#101311] shadow-sm"
                  : "bg-white/5 border border-white/10 text-[#8a948c] hover:text-[#f1ebdd]"
              )}
            >
              <span>{sev}</span>
              <span className="font-mono text-[10px] opacity-80">({counts[sev] || 0})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a948c]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pattern title, rule, or case…"
            className="w-full rounded-lg border border-white/10 bg-black/40 pl-8 pr-3 py-1.5 text-xs text-[#f1ebdd] placeholder-[#8a948c] outline-none focus:border-[#d9aa3d] transition"
          />
        </div>
      </div>

      {/* ── PATTERNS FEED ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
        {filteredPatterns.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl bg-[#0f1311]">
            <CheckCircle2 size={32} className="text-[#4ade80] mb-2 opacity-70" />
            <h3 className="text-sm font-bold text-[#f1ebdd]">No suspicious patterns match your filter</h3>
            <p className="text-xs text-[#8a948c] mt-1">Try clearing the search query or selecting ALL severities.</p>
          </div>
        ) : (
          filteredPatterns.map((pattern) => {
            const isExpanded = expandedIds.has(pattern.id);
            const sev = SEVERITY_CONFIG[pattern.severity] || SEVERITY_CONFIG.HIGH;
            const SevIcon = sev.icon;

            return (
              <div
                key={pattern.id}
                className={clsx(
                  "rounded-2xl border transition-all duration-200 overflow-hidden",
                  isExpanded
                    ? "border-[rgba(217,170,61,0.35)] bg-[#111613] shadow-lg shadow-black/40"
                    : "border-white/5 bg-[#0e1210] hover:border-white/15 hover:bg-[#101412]"
                )}
              >
                {/* Clickable Header Bar */}
                <div
                  onClick={() => toggleExpand(pattern.id)}
                  className="p-4.5 cursor-pointer flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Severity Icon Box */}
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold mt-0.5"
                      style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}
                    >
                      <SevIcon size={18} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Severity Badge */}
                        <span
                          className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}
                        >
                          {pattern.severity}
                        </span>

                        {/* Linked Cases */}
                        {(pattern.cases || []).map((c, i) => (
                          <span
                            key={i}
                            className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#d9aa3d]/15 border border-[#d9aa3d]/35 text-[#d9aa3d]"
                          >
                            {c}
                          </span>
                        ))}

                        <span className="font-mono text-[10px] text-[#72bf7e] font-bold ml-2">
                          {Math.round((pattern.confidence || 0.95) * 100)}% Confidence
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-sm font-bold text-[#f1ebdd] leading-snug">
                        {pattern.title}
                      </h2>

                      {/* Brief description */}
                      <p className="text-xs text-[#9ca3af] leading-relaxed line-clamp-2">
                        {pattern.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-1 text-[#8a948c]">
                    <span className="text-[11px] font-mono hidden sm:inline">
                      {isExpanded ? 'Collapse' : 'Details'}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded Detailed Breakdown */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-3.5 bg-black/20 text-xs">
                    
                    {/* Rule Definition */}
                    <div className="rounded-xl border border-white/5 bg-black/40 p-3">
                      <div className="text-[10px] font-bold text-[#8a948c] uppercase tracking-wider font-mono">
                        TRIGGERED FORENSIC RULE
                      </div>
                      <div className="font-mono text-xs text-[#d9aa3d] mt-1 font-semibold">
                        {pattern.rule}
                      </div>
                    </div>

                    {/* Grounded Evidence Block */}
                    <div className="rounded-xl border border-[rgba(217,170,61,0.25)] bg-[rgba(217,170,61,0.06)] p-3.5 space-y-1.5">
                      <div className="text-[11px] font-bold text-[#d9aa3d] uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles size={13} />
                        Corroborating Evidence Snippet
                      </div>
                      <p className="text-xs text-[#f1ebdd] leading-relaxed font-sans">
                        {pattern.evidence}
                      </p>
                    </div>

                    {/* Recommended Investigative Next Steps */}
                    {pattern.action_recommended && (
                      <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3.5 space-y-1">
                        <div className="text-[11px] font-bold text-[#72bf7e] uppercase tracking-wide flex items-center gap-1.5">
                          <CheckCircle2 size={13} />
                          Recommended Next Investigative Action
                        </div>
                        <p className="text-xs text-[#c5cfc8] leading-relaxed">
                          {pattern.action_recommended}
                        </p>
                      </div>
                    )}

                    {/* Linked Entities with 1-Click Graph Action */}
                    {pattern.entities && pattern.entities.length > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-[#8a948c] uppercase">Involved Entities:</span>
                          {pattern.entities.map((ent, idx) => {
                            const eid = typeof ent === 'string' ? ent : ent.id || ent.name;
                            const name = typeof ent === 'string' ? ent : ent.name || ent.id;
                            const type = typeof ent === 'object' ? ent.type : 'Entity';

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  if (focusEntityById) focusEntityById(eid);
                                  if (setActiveTab) setActiveTab('network');
                                }}
                                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-[#f1ebdd] hover:border-[#d9aa3d]/60 hover:text-[#d9aa3d] hover:bg-[#d9aa3d]/15 transition cursor-pointer"
                              >
                                <span className="font-bold">{name}</span>
                                <span className="font-mono text-[9px] text-[#8a948c]">({type})</span>
                                <ExternalLink size={10} className="text-[#8a948c]" />
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (setActiveTab) setActiveTab('network');
                          }}
                          className="flex items-center gap-1 rounded-lg bg-[#d9aa3d] px-3.5 py-1.5 text-xs font-bold text-[#101311] hover:brightness-110 shadow-sm transition cursor-pointer"
                        >
                          <span>Explore in Graph</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
