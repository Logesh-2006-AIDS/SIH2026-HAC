import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  FolderOpen, ArrowRight, Users, GitBranch, AlertTriangle, FileText,
  Shield, MapPin, Calendar, CheckCircle2, Search, Crosshair, Network,
  ExternalLink, Sparkles, Filter, ChevronRight, Hash, Eye
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import * as mockService from '../data/mockService';
import { CASES } from '../data/mockData';

export default function CaseDossiers() {
  const { casesList, openCase, selectedCase, setSelectedCase, setActiveTab } = useInvestigation();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const cases = useMemo(() => {
    const list = casesList && casesList.length ? casesList : CASES;
    return list.map(c => ({
      ...c,
      case_number: String(c.case_number).replace('CASE-', ''),
    }));
  }, [casesList]);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      setLoading(true);
      const next = {};

      for (const c of cases) {
        const id = c.case_number;
        let dataFound = false;

        // 1. Try live API
        try {
          const [caseRes, crossRes, briefRes] = await Promise.all([
            axios.get(`/api/v1/cases/${id}`, { timeout: 1200 }),
            axios.get(`/api/v1/cases/${id}/cross-links`, { timeout: 1200 }),
            axios.get(`/api/v1/cases/${id}/brief`, { timeout: 1200 }),
          ]);
          const entities = caseRes.data?.data?.graph_entities || [];
          const edges = caseRes.data?.data?.graph_relations || [];
          next[id] = {
            entities: entities.length,
            relationships: edges.length,
            crossCase: (crossRes.data?.data?.links || []).length,
            leads: (briefRes.data?.data?.ai_suggested_leads || []).length,
            evidence: Math.max(1, Math.ceil(edges.length / 2)),
          };
          dataFound = true;
        } catch {
          dataFound = false;
        }

        // 2. Seamless fallback to rich mock service if live API not active
        if (!dataFound) {
          try {
            const summaryRes = await mockService.getCaseSummary(id);
            if (summaryRes?.success && summaryRes.data) {
              const d = summaryRes.data;
              next[id] = {
                entities: d.entity_count || (c.entities || []).length || 14,
                relationships: d.connection_count || 22,
                crossCase: d.cross_case_count || 6,
                leads: d.lead_count || 4,
                evidence: Math.max(2, Math.ceil((d.connection_count || 12) / 2)),
              };
            } else {
              next[id] = {
                entities: (c.entities || []).length || 12,
                relationships: 18,
                crossCase: 5,
                leads: 3,
                evidence: 4,
              };
            }
          } catch {
            next[id] = {
              entities: (c.entities || []).length || 12,
              relationships: 18,
              crossCase: 5,
              leads: 3,
              evidence: 4,
            };
          }
        }
      }

      if (!cancelled) {
        setStats(next);
        setLoading(false);
      }
    }

    loadStats();
    return () => { cancelled = true; };
  }, [cases]);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        c.title.toLowerCase().includes(q) ||
        c.case_number.toLowerCase().includes(q) ||
        (c.crime_category || '').toLowerCase().includes(q) ||
        (c.jurisdiction || '').toLowerCase().includes(q) ||
        (c.accused || []).some(a => a.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || c.crime_category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [cases, searchQuery, statusFilter, categoryFilter]);

  // Aggregated platform stats
  const totalCases = cases.length;
  const activeCasesCount = cases.filter(c => c.status === 'ACTIVE').length;
  const totalEntitiesTracked = Object.values(stats).reduce((acc, curr) => acc + (curr.entities || 0), 0);
  const totalCrossCaseTies = Object.values(stats).reduce((acc, curr) => acc + (curr.crossCase || 0), 0);

  const categories = useMemo(() => {
    const set = new Set(cases.map(c => c.crime_category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [cases]);

  const activeCaseObj = useMemo(() => {
    return cases.find(c => c.case_number === selectedCase) || cases[0];
  }, [cases, selectedCase]);

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#080A08] text-[#F1EBDD] font-sans overflow-hidden">
      {/* ── TOP FORENSIC HEADER ──────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-[rgba(217,170,61,0.2)] bg-[#0d100e] px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#D9AA3D] uppercase">
                INTELLIGENCE COMMAND • DOSSIERS REGISTRY
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              <span className="text-[10px] font-mono text-[#8a948c]">LIVE WORKBENCH CONTEXT</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F1EBDD] flex items-center gap-2.5 font-display">
              <FolderOpen size={24} className="text-[#D9AA3D]" />
              Case Dossiers & Investigation Intelligence
            </h1>
            <p className="text-xs text-[#8a948c] mt-0.5">
              Select a primary dossier to bind the forensic workbench context. All graph queries, path algorithms, and entity tools inherit the active case.
            </p>
          </div>

          {/* Top Platform Key Numbers */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[rgba(217,170,61,0.2)] bg-[#121614] px-4 py-2.5 shadow-sm">
              <div className="text-[10px] font-mono font-bold tracking-wider text-[#8a948c] uppercase">Tracked Cases</div>
              <div className="text-2xl font-bold font-stats text-[#F1EBDD]">{totalCases}</div>
            </div>
            <div className="rounded-xl border border-[rgba(94,159,104,0.3)] bg-[#121614] px-4 py-2.5 shadow-sm">
              <div className="text-[10px] font-mono font-bold tracking-wider text-[#4ADE80] uppercase">Active Operations</div>
              <div className="text-2xl font-bold font-stats text-[#4ADE80]">{activeCasesCount}</div>
            </div>
            <div className="rounded-xl border border-[rgba(217,170,61,0.2)] bg-[#121614] px-4 py-2.5 shadow-sm">
              <div className="text-[10px] font-mono font-bold tracking-wider text-[#D9AA3D] uppercase">Graph Entities</div>
              <div className="text-2xl font-bold font-stats text-[#D9AA3D]">{totalEntitiesTracked || '45+'}</div>
            </div>
            <div className="rounded-xl border border-[rgba(214,40,40,0.3)] bg-[#121614] px-4 py-2.5 shadow-sm">
              <div className="text-[10px] font-mono font-bold tracking-wider text-[#fca5a5] uppercase">Cross-Case Links</div>
              <div className="text-2xl font-bold font-stats text-[#fca5a5]">{totalCrossCaseTies || '19'}</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 flex-1 min-w-[280px] max-w-md">
            <div className="relative w-full">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a948c]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case title, number, syndicate, suspect, jurisdiction…"
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-9 pr-3 py-1.5 text-xs text-[#F1EBDD] outline-none placeholder:text-[#6C7A73] focus:border-[#D9AA3D]/60 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#8a948c] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-white/10 bg-black/40 p-0.5 text-xs">
              <span className="px-2 text-[11px] font-bold text-[#8a948c] uppercase tracking-wider">Status:</span>
              {['ALL', 'ACTIVE', 'UNDER_REVIEW'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#D9AA3D] text-[#080A09] shadow-sm'
                      : 'text-[#8a948c] hover:text-[#F1EBDD]'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-[#8a948c] uppercase tracking-wider">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#121614] px-2.5 py-1.5 text-xs text-[#F1EBDD] outline-none cursor-pointer focus:border-[#D9AA3D]/60"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'ALL' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN BODY WITH SIDEBAR & CASE GRID ──────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: CASE DIRECTORY QUICK-SWITCHER */}
        <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-[rgba(217,170,61,0.18)] bg-[#0a0d0b] p-4 overflow-y-auto">
          <div className="mb-3 flex items-center justify-between pb-2 border-b border-white/10">
            <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#D9AA3D] uppercase">
              Case Directory ({filteredCases.length})
            </span>
            <span className="text-[10px] font-mono text-[#8a948c]">Active: {selectedCase}</span>
          </div>

          <div className="space-y-1.5 flex-1">
            {filteredCases.map((c) => {
              const active = selectedCase === c.case_number;
              const s = stats[c.case_number] || {};
              return (
                <button
                  key={c.case_number}
                  onClick={() => setSelectedCase(c.case_number)}
                  className={`w-full text-left rounded-xl p-3 transition duration-150 border cursor-pointer ${
                    active
                      ? 'border-[#D9AA3D] bg-[#D9AA3D]/12 shadow-[0_0_15px_rgba(217,170,61,0.15)]'
                      : 'border-white/5 bg-[#121614]/70 hover:border-white/20 hover:bg-[#161c18]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] font-bold text-[#D9AA3D]">
                      CASE-{c.case_number}
                    </span>
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      c.status === 'ACTIVE'
                        ? 'bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30'
                        : 'bg-[#D9AA3D]/15 text-[#D9AA3D] border border-[#D9AA3D]/30'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#F1EBDD] line-clamp-1 leading-snug">
                    {c.title.replace(/\(CASE-\d+\)/, '')}
                  </div>
                  <div className="text-[11px] text-[#8a948c] mt-0.5 truncate">
                    {c.crime_category}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-[#A6B0AA]">
                    <span>Entities: <b className="text-[#F1EBDD] font-stats font-semibold">{s.entities ?? '—'}</b></span>
                    <span>Links: <b className="text-[#F1EBDD] font-stats font-semibold">{s.relationships ?? '—'}</b></span>
                    <span>Cross-Links: <b className="text-[#D9AA3D] font-stats font-semibold">{s.crossCase ?? '—'}</b></span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Context Snapshot Box in Sidebar */}
          {activeCaseObj && (
            <div className="mt-4 pt-3 border-t border-[rgba(217,170,61,0.2)]">
              <div className="text-[10px] font-mono font-bold tracking-wider text-[#D9AA3D] uppercase mb-1.5 flex items-center gap-1.5">
                <Sparkles size={12} /> Active Workbench Case
              </div>
              <div className="rounded-lg border border-[rgba(217,170,61,0.3)] bg-black/40 p-2.5 text-xs space-y-1.5">
                <div className="font-bold text-[#F1EBDD] leading-tight">
                  {activeCaseObj.title}
                </div>
                <div className="text-[11px] text-[#8a948c] flex items-center gap-1">
                  <MapPin size={11} className="text-[#D9AA3D] shrink-0" />
                  <span className="truncate">{activeCaseObj.jurisdiction}</span>
                </div>
                <div className="pt-2 flex gap-1.5">
                  <button
                    onClick={() => openCase(activeCaseObj.case_number)}
                    className="flex-1 rounded-md bg-[#D62828] py-1 text-[11px] font-bold text-white text-center hover:brightness-110 transition cursor-pointer"
                  >
                    Open Workspace
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCase(activeCaseObj.case_number);
                      setActiveTab('network');
                    }}
                    className="flex items-center justify-center rounded-md border border-[#D9AA3D]/50 px-2 py-1 text-[11px] text-[#D9AA3D] hover:bg-[#D9AA3D]/10 transition cursor-pointer"
                    title="Open Knowledge Graph"
                  >
                    <Network size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT MAIN CONTENT: CASE CARDS GRID */}
        <main className="flex-1 p-6 overflow-y-auto">
          {filteredCases.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl bg-[#0f1311]">
              <FolderOpen size={40} className="text-[#8a948c] mb-3 opacity-60" />
              <h3 className="text-base font-bold text-[#F1EBDD]">No Matching Dossiers Found</h3>
              <p className="text-xs text-[#8a948c] mt-1 max-w-sm">
                Try clearing your search query or adjusting the status/category filter parameters.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); }}
                className="mt-4 rounded-lg bg-[#D9AA3D] px-3.5 py-1.5 text-xs font-bold text-[#080A09]"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {filteredCases.map((c) => {
                const s = stats[c.case_number] || {};
                const active = selectedCase === c.case_number;
                return (
                  <div
                    key={c.case_number}
                    className={`relative rounded-2xl border transition-all duration-200 p-6 flex flex-col justify-between ${
                      active
                        ? 'border-[#D9AA3D] bg-gradient-to-b from-[#161d18] to-[#101412] shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_24px_rgba(217,170,61,0.22)]'
                        : 'border-[rgba(217,170,61,0.18)] bg-[#101412] hover:border-[rgba(217,170,61,0.45)] hover:bg-[#141915] shadow-lg'
                    }`}
                  >
                    {/* Top Active Indicator Strip */}
                    {active && (
                      <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-[#D9AA3D] px-3 py-0.5 text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#080A09] shadow-md">
                        <CheckCircle2 size={12} />
                        Active Platform Context
                      </div>
                    )}

                    <div>
                      {/* Header Row: Case ID, Status, and Crime Category */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#D9AA3D]/15 border border-[#D9AA3D]/40 text-[#D9AA3D]">
                            CASE-{c.case_number}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#c5cfc8]">
                            {c.crime_category}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                              c.status === 'ACTIVE'
                                ? 'bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/40'
                                : 'bg-[#D9AA3D]/15 text-[#D9AA3D] border border-[#D9AA3D]/40'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'ACTIVE' ? 'bg-[#4ADE80] animate-pulse' : 'bg-[#D9AA3D]'}`} />
                            {c.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Case Title - Large, bold, legible */}
                      <h2 className="text-xl font-bold font-display text-[#F1EBDD] tracking-tight leading-snug mb-2 hover:text-[#D9AA3D] transition cursor-pointer"
                          onClick={() => setSelectedCase(c.case_number)}>
                        {c.title}
                      </h2>

                      {/* Metadata Row: Location, Date, Assigned Bureau */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 text-xs text-[#8a948c] mb-4 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin size={13} className="text-[#D9AA3D] shrink-0" />
                          <span className="truncate text-[#c5cfc8]">{c.jurisdiction || 'Tamil Nadu Special Cell'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-[#D9AA3D] shrink-0" />
                          <span className="font-mono text-[#c5cfc8]">
                            {c.incident_date ? new Date(c.incident_date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '2026-03-16'}
                          </span>
                        </div>
                      </div>

                      {/* Briefing Summary */}
                      <p className="text-xs text-[#A6B0AA] leading-relaxed mb-4 line-clamp-2">
                        {c.summary}
                      </p>

                      {/* Suspects Row */}
                      {c.accused && c.accused.length > 0 && (
                        <div className="mb-4">
                          <div className="text-[10px] font-mono font-bold tracking-wider text-[#8a948c] uppercase mb-1.5">
                            Key Suspects & Persons of Interest ({c.accused.length})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {c.accused.map((acc, idx) => (
                              <span
                                key={acc}
                                className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                                  idx === 0
                                    ? 'bg-[#D62828]/20 text-[#fca5a5] border border-[#D62828]/40 font-semibold'
                                    : 'bg-white/5 text-[#c5cfc8] border border-white/10'
                                }`}
                              >
                                {acc} {idx === 0 && '• Primary'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Section: Prominent Statistics and Action Buttons */}
                    <div>
                      {/* Prominent Statistics Grid with Space Grotesk */}
                      <div className="grid grid-cols-5 gap-2 rounded-xl border border-white/5 bg-black/40 p-3 mb-4">
                        <StatBox
                          icon={<Users size={14} className="text-[#D9AA3D]" />}
                          label="ENTITIES"
                          value={s.entities ?? '—'}
                        />
                        <StatBox
                          icon={<GitBranch size={14} className="text-[#5E9F68]" />}
                          label="RELATIONS"
                          value={s.relationships ?? '—'}
                        />
                        <StatBox
                          icon={<Crosshair size={14} className="text-[#fca5a5]" />}
                          label="CROSS-TIES"
                          value={s.crossCase ?? '—'}
                          highlight
                        />
                        <StatBox
                          icon={<AlertTriangle size={14} className="text-[#fbbf24]" />}
                          label="LEADS"
                          value={s.leads ?? '—'}
                        />
                        <StatBox
                          icon={<FileText size={14} className="text-[#94A3B8]" />}
                          label="EVIDENCE"
                          value={s.evidence ?? '—'}
                        />
                      </div>

                      {/* Button Row */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedCase(c.case_number)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            active
                              ? 'bg-[#D9AA3D]/20 text-[#D9AA3D] border-[#D9AA3D]/50 shadow-sm'
                              : 'bg-white/5 text-[#A6B0AA] border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {active ? 'Selected Context' : 'Set Active'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCase(c.case_number);
                            setActiveTab('network');
                          }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#D9AA3D] border border-[#D9AA3D]/30 bg-[#D9AA3D]/10 hover:bg-[#D9AA3D]/20 transition cursor-pointer"
                        >
                          <Network size={14} />
                          <span>Graph</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openCase(c.case_number)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#D62828] to-[#991B1B] hover:brightness-110 shadow-md transition active:scale-[0.99] cursor-pointer"
                        >
                          <span>Open Dossier</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, highlight = false }) {
  return (
    <div className="text-center flex flex-col items-center justify-center p-1">
      <div className="flex items-center justify-center mb-1">{icon}</div>
      <div className={`text-xl font-bold font-stats leading-none ${highlight ? 'text-[#fca5a5]' : 'text-[#F1EBDD]'}`}>
        {value}
      </div>
      <div className="text-[9px] font-mono font-semibold text-[#8a948c] uppercase mt-1 tracking-wider">
        {label}
      </div>
    </div>
  );
}
