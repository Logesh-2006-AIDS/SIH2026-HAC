import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  FolderOpen, ArrowRight, MapPin, Calendar, CheckCircle2, Search,
  Network, ExternalLink, Filter, ChevronRight, Layers, Users, ShieldAlert
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import * as mockService from '../data/mockService';
import { CASES } from '../data/mockData';
import clsx from 'clsx';

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
          };
          dataFound = true;
        } catch {
          dataFound = false;
        }

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
              };
            } else {
              next[id] = {
                entities: (c.entities || []).length || 12,
                relationships: 18,
                crossCase: 5,
                leads: 3,
              };
            }
          } catch {
            next[id] = {
              entities: (c.entities || []).length || 12,
              relationships: 18,
              crossCase: 5,
              leads: 3,
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

  const categories = useMemo(() => {
    const set = new Set(cases.map(c => c.crime_category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [cases]);

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#080a08] text-[#f1ebdd] overflow-hidden">
      {/* ── CLEAN TOP HEADER & SEARCH ────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/5 bg-[#0d100e] px-6 py-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d9aa3d]/15 text-[#d9aa3d] border border-[#d9aa3d]/30">
                <FolderOpen size={17} />
              </div>
              <h1 className="text-base font-bold text-[#f1ebdd] tracking-tight">
                Active Case Dossiers
              </h1>
              <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs font-mono text-[#8a948c]">
                {cases.length} Total
              </span>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a948c]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dossiers, suspects, FIRs…"
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-8 pr-3 py-1.5 text-xs text-[#f1ebdd] placeholder-[#8a948c] outline-none focus:border-[#d9aa3d]/60 transition"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-[#f1ebdd] outline-none cursor-pointer focus:border-[#d9aa3d]/60"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#101311] text-[#f1ebdd]">
                  {cat === 'ALL' ? 'All Crime Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ── CLEAN, SPACIOUS DOSSIER CARDS ────────────────────────────────────── */}
      <main className="flex-1 p-6 overflow-y-auto scrollbar-thin">
        {filteredCases.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl bg-[#0f1311]">
            <FolderOpen size={32} className="text-[#8a948c] mb-2 opacity-60" />
            <h3 className="text-sm font-bold text-[#f1ebdd]">No matching dossiers</h3>
            <p className="text-xs text-[#8a948c] mt-1">Try resetting your search query or filter.</p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); }}
              className="mt-3 rounded-lg bg-[#d9aa3d] px-3 py-1.5 text-xs font-bold text-[#101311] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases.map((c) => {
              const s = stats[c.case_number] || {};
              const isSelected = selectedCase === c.case_number;

              return (
                <div
                  key={c.case_number}
                  className={clsx(
                    'relative rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 space-y-4 group',
                    isSelected
                      ? 'border-[#d9aa3d] bg-[#121614] shadow-lg shadow-[#d9aa3d]/5 ring-1 ring-[#d9aa3d]/40'
                      : 'border-white/5 bg-[#0e1210] hover:border-white/15 hover:bg-[#111613]'
                  )}
                >
                  {/* Top Bar: Case ID & Status */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#d9aa3d]/15 border border-[#d9aa3d]/35 text-[#d9aa3d]">
                          CASE-{c.case_number}
                        </span>
                        <span className="text-[11px] text-[#8a948c] truncate max-w-[140px]">
                          {c.crime_category}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-[#4ade80]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                        Active
                      </span>
                    </div>

                    {/* Case Title */}
                    <h2
                      onClick={() => openCase(c.case_number)}
                      className="text-sm font-bold text-[#f1ebdd] leading-snug hover:text-[#d9aa3d] transition cursor-pointer"
                    >
                      {c.title.replace(/\(CASE-\d+\)/, '')}
                    </h2>

                    {/* Location & Jurisdiction */}
                    <div className="flex items-center gap-2 text-xs text-[#8a948c] mt-1.5">
                      <MapPin size={12} className="text-[#d9aa3d] shrink-0" />
                      <span className="truncate">{c.jurisdiction || 'Special Crime Branch'}</span>
                    </div>

                    {/* Clean Short Summary Preview */}
                    {c.summary && (
                      <p className="text-xs text-[#9ca3af] leading-relaxed mt-2.5 line-clamp-2">
                        {c.summary}
                      </p>
                    )}
                  </div>

                  {/* Bottom Stats & Actions */}
                  <div className="pt-3 border-t border-white/5 space-y-3">
                    {/* Compact 3-Column Stats */}
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      <div className="rounded-lg bg-black/30 border border-white/5 py-1 px-1.5">
                        <div className="font-mono font-bold text-xs text-[#f1ebdd]">{s.entities ?? 12}</div>
                        <div className="text-[9px] text-[#8a948c] uppercase font-medium">Entities</div>
                      </div>
                      <div className="rounded-lg bg-black/30 border border-white/5 py-1 px-1.5">
                        <div className="font-mono font-bold text-xs text-[#f1ebdd]">{s.relationships ?? 18}</div>
                        <div className="text-[9px] text-[#8a948c] uppercase font-medium">Links</div>
                      </div>
                      <div className="rounded-lg bg-black/30 border border-white/5 py-1 px-1.5">
                        <div className="font-mono font-bold text-xs text-[#d9aa3d]">{s.crossCase ?? 2}</div>
                        <div className="text-[9px] text-[#8a948c] uppercase font-medium">Cross-Ties</div>
                      </div>
                    </div>

                    {/* Clean Action Buttons (No aggressive red!) */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCase(c.case_number);
                          setActiveTab('network');
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#c5cfc8] border border-white/10 bg-white/5 hover:border-[#d9aa3d]/40 hover:text-[#d9aa3d] hover:bg-[#d9aa3d]/10 transition cursor-pointer"
                        title="View Knowledge Graph"
                      >
                        <Network size={13} />
                        <span>Graph</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openCase(c.case_number)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#101311] bg-gradient-to-r from-[#d9aa3d] to-[#d97706] hover:brightness-110 shadow-sm transition cursor-pointer"
                      >
                        <span>Open Workspace</span>
                        <ArrowRight size={13} />
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
  );
}
