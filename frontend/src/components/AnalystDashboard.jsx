"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Crosshair,
  Flame,
  GitBranch,
  LogOut,
  Map as MapIcon,
  Network,
  Radar,
  Search,
  Send,
  Target,
  Users,
  CheckCircle,
  XCircle,
  Scissors,
  Layers,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowUpRight,
  ChevronRight,
  MapPin,
  Zap,
  Radio,
  Eye,
  User,
  Phone,
  Building2,
  Car,
  Link2,
  Share2,
  Filter,
  FileText,
  ChevronDown,
  ChevronUp,
  Repeat
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api.js";
import clsx from "clsx";
import CrimeMap from "./analyst/CrimeMap.jsx";

const NAV = [
  {
    title: "Strategic Intelligence",
    items: [
      { id: "overview", label: "Crime Overview", icon: Radar },
      { id: "heatmap", label: "Crime Heatmap", icon: Flame },
      { id: "trends", label: "Crime Trends", icon: Activity },
      { id: "crosscase", label: "Cross-Case Intelligence", icon: GitBranch }
    ]
  },
  {
    title: "Entity & Resolution",
    items: [
      { id: "resolutions", label: "Entity Resolution Review", icon: Layers },
      { id: "centrality", label: "Centrality & Key Entities", icon: Target },
      { id: "communities", label: "Communities & Clusters", icon: Users },
      { id: "network", label: "Network Overview", icon: Network },
    ]
  },
  {
    title: "Pattern Intelligence",
    items: [
      { id: "patterns", label: "Pattern Discovery", icon: Search },
      { id: "leads", label: "Intelligence Leads", icon: Send },
      { id: "ask", label: "Analyst Assistant", icon: Crosshair }
    ]
  }
];

const emptyFilters = {
  crime_type: "All",
  start: "",
  end: "",
  geography: "All",
  status: "All"
};

export default function AnalystDashboard({ onSignOut }) {
  const [view, setView] = useState("overview");
  const [filters, setFilters] = useState(emptyFilters);
  const [health, setHealth] = useState(null);
  const [overview, setOverview] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [heatMode, setHeatMode] = useState("density");
  const [geographicMode, setGeographicMode] = useState("heatmap");
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionDetail, setRegionDetail] = useState(null);
  const [trends, setTrends] = useState(null);
  const [cross, setCross] = useState(null);
  const [network, setNetwork] = useState(null);
  const [communities, setCommunities] = useState(null);
  const [centrality, setCentrality] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [leads, setLeads] = useState([]);
  const [resolutions, setResolutions] = useState([]);
  const [resolutionFilter, setResolutionFilter] = useState("ALL");
  const [resolutionsLoading, setResolutionsLoading] = useState(false);
  const [askQ, setAskQ] = useState("Which areas have increasing crime?");
  const [askA, setAskA] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [leadDraft, setLeadDraft] = useState(null);

  const filterParams = useMemo(
    () => ({
      crime_type: filters.crime_type,
      start: filters.start || void 0,
      end: filters.end || void 0,
      geography: filters.geography,
      status: filters.status
    }),
    [filters]
  );

  useEffect(() => {
    const user = localStorage.getItem("sih_user");
    if (!user) {
      window.history.pushState({}, "", "/login");
      window.location.reload();
    }
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/health");
      const json = await res.json();
      setHealth(json);
    } catch {
      setHealth(null);
    }
  }, []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet("/api/v1/analyst/overview", filterParams);
      setOverview(data);
    } finally {
      setLoading(false);
    }
  }, [filterParams]);

  const loadHeatmap = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet("/api/v1/analyst/heatmap", {
        ...filterParams,
        mode: heatMode,
        geography_level: geographicMode === "region_density" ? "state" : "city"
      });
      setHeatmap(data);
    } finally {
      setLoading(false);
    }
  }, [filterParams, heatMode, geographicMode]);

  const loadResolutions = useCallback(async () => {
    setResolutionsLoading(true);
    try {
      const param = resolutionFilter === "ALL" ? {} : { status: resolutionFilter };
      const res = await apiGet("/api/v1/analyst/resolutions/pending", param);
      setResolutions(res?.items || []);
    } catch (e) {
      console.warn("Failed to load resolutions:", e);
    } finally {
      setResolutionsLoading(false);
    }
  }, [resolutionFilter]);

  useEffect(() => {
    refreshHealth();
    loadOverview();
  }, [refreshHealth, loadOverview]);

  useEffect(() => {
    if (view === "heatmap" || view === "overview") loadHeatmap();
  }, [view, loadHeatmap]);

  useEffect(() => {
    if (view === "resolutions") loadResolutions();
  }, [view, loadResolutions]);

  useEffect(() => {
    if (!selectedRegion) {
      setRegionDetail(null);
      return;
    }
    apiGet(`/api/v1/analyst/region/${encodeURIComponent(selectedRegion)}`, {
      ...filterParams,
      mode: heatMode,
      geography_level: geographicMode === "region_density" ? "state" : "city"
    }).then(setRegionDetail).catch(() => setRegionDetail(null));
  }, [selectedRegion, filterParams, heatMode, geographicMode]);

  useEffect(() => {
    if (view === "trends") apiGet("/api/v1/analyst/trends", filterParams).then(setTrends);
    if (view === "crosscase") apiGet("/api/v1/analyst/cross-case").then(setCross);
    if (view === "network") apiGet("/api/v1/analyst/network").then(setNetwork);
    if (view === "communities") apiGet("/api/v1/analyst/communities").then(setCommunities);
    if (view === "centrality") apiGet("/api/v1/analyst/centrality").then(setCentrality);
    if (view === "patterns") apiGet("/api/v1/analyst/patterns", filterParams).then(setPatterns);
    if (view === "leads") {
      apiGet("/api/v1/leads/intelligence").then((d) => setLeads(d.leads || [])).catch(() => setLeads([]));
    }
  }, [view, filterParams]);

  const dataModeLabel = overview?.label || heatmap?.label || (health?.services?.data_mode?.details === "LIVE" ? "LIVE MEMGRAPH" : "DEMO MODE");

  const sendLead = async (payload) => {
    try {
      const lead = await apiPost("/api/v1/leads/intelligence", payload);
      setToast(`Sent ${lead.lead_id || lead.id} to Investigator queue`);
      setLeadDraft(null);
      setView("leads");
      const d = await apiGet("/api/v1/leads/intelligence");
      setLeads(d.leads || []);
    } catch (e) {
      setToast(e.message || "Failed to send lead");
    }
  };

  const handleReviewResolution = async (id, action, remarks = "") => {
    try {
      const res = await apiPost(`/api/v1/analyst/resolutions/${id}/review`, { action, remarks });
      setToast(res?.message || `Resolution updated: ${action}`);
      loadResolutions();
      // Broadcast live graph update event
      window.dispatchEvent(new CustomEvent('sih:data_ingested', { detail: res }));
    } catch (e) {
      setToast(e.message || `Failed to execute ${action}`);
    }
  };

  const openLeadFromPattern = (p) => {
    setLeadDraft({
      title: p.title || p.pattern_name || p.type,
      description: p.what || p.description || "",
      priority: p.severity === "CRITICAL" ? "CRITICAL" : p.trend === "increasing" || p.type === "Cross-Case Entity" ? "HIGH" : "MEDIUM",
      related_cases: p.cases || [],
      entities: (p.entities || []).map((n) => typeof n === 'string' ? { name: n } : n),
      locations: p.where ? [p.where] : [],
      evidence: p.evidence ? (Array.isArray(p.evidence) ? p.evidence : [p.evidence]) : (p.supporting_records || []).map(r => typeof r === 'string' ? r : `${r.source_document_id || ''}: ${r.row_reference || ''} (${r.details || ''})`),
      supporting_records: p.supporting_records || [],
      reason: p.reason || p.why || p.what || "",
      confidence: p.confidence || 0.90,
      confidence_reason: p.confidence_reason || `Triggered forensic rule: ${p.rule_id || p.rule || 'Pattern Detection'}`,
      evidentiary_strength: p.evidentiary_strength || null,
      pattern_type: p.type || p.pattern_name || "Pattern Detection",
      created_by: "ANALYST"
    });
    setView("leads");
  };

  const openLeadFromEntity = (e) => {
    setLeadDraft({
      title: `Key Entity Link: ${e.name}`,
      description: e.explanation,
      priority: (e.classification || "").includes("Hub") || (e.cross_case || 0) >= 3 ? "CRITICAL" : "HIGH",
      related_cases: e.cases || [],
      entities: [{ id: e.entity_id, name: e.name, type: e.type }],
      reason: e.explanation,
      confidence: 0.92,
      confidence_reason: `Calculated from network centrality (betweenness ${e.betweenness ?? 'N/A'}, degree ${e.degree ?? 'N/A'}, bridging ${e.community_bridging ? 'multiple' : 'single'} cluster).`,
      evidentiary_strength: e.evidentiary_strength || null,
      pattern_type: e.classification || "Key Entity",
      created_by: "ANALYST"
    });
    setView("leads");
  };

  const openLeadFromCross = (c) => {
    setLeadDraft({
      title: `Cross-Case Cluster: ${c.shared_entity?.name}`,
      description: `Entity links cases ${c.related_cases?.join(", ")}`,
      priority: c.connection_strength === "CRITICAL" ? "CRITICAL" : "HIGH",
      related_cases: c.related_cases || [],
      entities: [{ name: c.shared_entity?.name, type: c.shared_entity?.type }],
      evidence: c.evidence ? [c.evidence] : [],
      reason: `Shared entity across multiple cases: ${c.related_cases?.join(", ")} (warrants review).`,
      confidence: c.connection_strength === "CRITICAL" ? 0.95 : 0.85,
      confidence_reason: "Direct entity recurrence across independent FIRs.",
      evidentiary_strength: c.evidentiary_strength || null,
      pattern_type: "Cross-Case Linkage",
      created_by: "ANALYST"
    });
    setView("leads");
  };

  const askAnalyst = async () => {
    if (!askQ) return;
    setLoading(true);
    try {
      const data = await apiPost("/api/v1/analyst/ask", { question: askQ });
      setAskA(data);
    } catch (e) {
      setAskA({ label: "Error", answer: e.message || "Failed to query analytics engine.", findings: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-ink text-parchment overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-[var(--line)] bg-panel p-4 lg:flex lg:flex-col overflow-y-auto">
        <div className="mb-6 border-b border-[var(--line)] pb-4">
          <p className="text-xs tracking-[0.22em] text-gold uppercase font-bold">House Targaryen</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-parchment">Strategic Analyst</h1>
          <p className="mt-1 text-xs text-muted">Crime intelligence analytics</p>
        </div>

        <div className="flex-1 space-y-5">
          {NAV.map((sec) => (
            <div key={sec.title}>
              <p className="mb-1.5 px-2 text-[10px] font-bold tracking-[0.15em] text-muted uppercase">
                {sec.title}
              </p>
              <div className="space-y-0.5">
                {sec.items.map((it) => {
                  const Icon = it.icon;
                  return (
                    <button
                      key={it.id}
                      onClick={() => setView(it.id)}
                      className={clsx(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition cursor-pointer",
                        view === it.id
                          ? "bg-gold/15 text-gold font-semibold shadow-sm"
                          : "text-muted hover:bg-white/5 hover:text-parchment"
                      )}
                    >
                      <Icon size={16} />
                      {it.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--line)] pt-3 mt-4">
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted hover:bg-signal/15 hover:text-red-300 transition cursor-pointer"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="min-w-0 flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div>
            <p className="text-xs tracking-[0.16em] text-gold uppercase font-semibold">Strategic Operations</p>
            <h2 className="text-2xl font-bold tracking-tight text-parchment">
              {NAV.flatMap((s) => s.items).find((i) => i.id === view)?.label || "Analyst Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-gold/40 bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold">
              {dataModeLabel}
            </span>
            <button
              onClick={() => {
                refreshHealth();
                loadOverview();
                if (view === "resolutions") loadResolutions();
              }}
              className="flex items-center gap-1.5 rounded-md border border-gold/35 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition hover:bg-gold/20 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </header>

        {toast && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-xs text-gold">
            <span>{toast}</span>
            <button onClick={() => setToast("")} className="text-muted hover:text-parchment cursor-pointer">×</button>
          </div>
        )}

        {/* View Component Render */}
        <div className="flex-1 space-y-6">
          {view === "overview" && (
            <OverviewView
              overview={overview}
              onSelectRegion={(reg) => {
                setSelectedRegion(reg);
                setView("heatmap");
              }}
              onLead={openLeadFromPattern}
              onNavigate={setView}
            />
          )}
          {view === "heatmap" && (
            <HeatmapView
              heatmap={heatmap}
              heatMode={heatMode}
              setHeatMode={setHeatMode}
              geographicMode={geographicMode}
              setGeographicMode={setGeographicMode}
              selectedRegion={selectedRegion}
              setSelectedRegion={setSelectedRegion}
              regionDetail={regionDetail}
              onLead={openLeadFromPattern}
            />
          )}
          {view === "resolutions" && (
            <ResolutionsView
              resolutions={resolutions}
              filter={resolutionFilter}
              setFilter={setResolutionFilter}
              loading={resolutionsLoading}
              onReview={handleReviewResolution}
              onRefresh={loadResolutions}
            />
          )}
          {view === "trends" && <TrendsView trends={trends} />}
          {view === "crosscase" && <CrossCaseView cross={cross} onLead={openLeadFromCross} />}
          {view === "network" && <NetworkView network={network} />}
          {view === "communities" && <CommunitiesView communities={communities} />}
          {view === "centrality" && <CentralityView centrality={centrality} onLead={openLeadFromEntity} />}
          {view === "patterns" && <PatternsView patterns={patterns} onLead={openLeadFromPattern} />}
          {view === "leads" && <LeadsView leads={leads} draft={leadDraft} setDraft={setLeadDraft} onSend={sendLead} />}
          {view === "ask" && <AskView question={askQ} setQuestion={setAskQ} answer={askA} onAsk={askAnalyst} />}
        </div>
      </main>
    </div>
  );
}

// ── Entity Resolution Review Screen (Human-in-the-Loop) ──────────────────────
function ResolutionsView({ resolutions, filter, setFilter, loading, onReview, onRefresh }) {
  return (
    <div className="space-y-5">
      {/* Policy banner */}
      <div className="rounded-xl border border-gold/30 bg-gold/10 p-4 text-xs text-gold flex items-start gap-3">
        <Sparkles size={18} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm text-parchment">AI-Assisted Entity Resolution — Human-in-the-Loop Disambiguation</p>
          <p className="mt-1 text-muted text-[11px]">
            The AI engine generates candidate entity merge suggestions using multi-signal corroboration (Rapidfuzz name similarity &ge;85% + shared phone, vehicle, account, or location). 
            <strong className="text-parchment"> AI suggests, the Analyst decides.</strong> No automatic accusations or destructive merges occur without explicit officer approval.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-panel p-3">
        <div className="flex items-center gap-1.5">
          {["ALL", "PENDING", "APPROVED", "REJECTED", "SPLIT"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={clsx(
                "rounded-md px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                filter === status
                  ? "bg-gold text-ink"
                  : "bg-white/5 text-muted hover:bg-white/10 hover:text-parchment"
              )}
            >
              {status}
            </button>
          ))}
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 text-xs text-muted hover:text-gold cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh candidates
        </button>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {resolutions.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-[var(--line)] bg-panel p-5 shadow-sm space-y-4 hover:border-gold/30 transition"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold text-gold">
                  {item.entity_type} Disambiguation
                </span>
                <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                  {Math.round(item.similarity_score * 100)}% Match Score
                </span>
                <span className="text-xs text-muted">ID: #{item.id}</span>
              </div>
              <ResolutionStatusBadge status={item.status} />
            </div>

            {/* Side by side comparison */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Entity A */}
              <div className="rounded-lg border border-white/5 bg-black/30 p-4 space-y-2">
                <p className="text-[10px] font-bold tracking-wider text-muted uppercase">Primary Graph Entity</p>
                <h4 className="text-base font-bold text-parchment">{item.node_a_name}</h4>
                <p className="font-mono text-xs text-gold">{item.node_a_id}</p>
                <div className="text-xs text-muted space-y-1 pt-1 border-t border-white/5">
                  <p>Type: {item.node_a_details?.type || item.entity_type}</p>
                  {item.node_a_details?.cases && <p>Cases: {item.node_a_details.cases.join(', ')}</p>}
                </div>
              </div>

              {/* Entity B */}
              <div className="rounded-lg border border-white/5 bg-black/30 p-4 space-y-2">
                <p className="text-[10px] font-bold tracking-wider text-muted uppercase">Candidate Mention / Alias</p>
                <h4 className="text-base font-bold text-parchment">{item.node_b_name}</h4>
                <p className="font-mono text-xs text-gold">{item.node_b_id}</p>
                <div className="text-xs text-muted space-y-1 pt-1 border-t border-white/5">
                  <p>Type: {item.node_b_details?.type || item.entity_type}</p>
                  {item.node_b_details?.cases && <p>Cases: {item.node_b_details.cases.join(', ')}</p>}
                </div>
              </div>
            </div>

            {/* Corroborating signals */}
            <div className="rounded-lg border border-white/5 bg-black/20 p-3 text-xs space-y-1.5">
              <p className="font-bold text-parchment">Corroborating Multi-Signal Justification:</p>
              <p className="text-gold font-medium">{item.match_reason}</p>
              {item.signals?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.signals.map((sig, idx) => (
                    <span key={idx} className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-muted">
                      ✓ {sig}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
              <span className="text-[11px] text-muted">
                {item.reviewed_at ? `Reviewed at ${new Date(item.reviewed_at).toLocaleString()}` : 'Awaiting officer decision'}
              </span>

              <div className="flex items-center gap-2">
                {item.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => onReview(item.id, "REJECT", "Rejected by analyst: distinct entity")}
                      className="flex items-center gap-1.5 rounded-lg border border-signal/40 bg-signal/15 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-signal/25 transition cursor-pointer"
                    >
                      <XCircle size={14} /> Reject Candidate
                    </button>
                    <button
                      onClick={() => onReview(item.id, "APPROVE", "Approved merge based on multi-signal evidence")}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer shadow-sm"
                    >
                      <CheckCircle size={14} /> Approve Merge in Graph
                    </button>
                  </>
                )}

                {item.can_split && (
                  <button
                    onClick={() => onReview(item.id, "SPLIT", "Reversible split triggered by analyst")}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 transition cursor-pointer"
                  >
                    <Scissors size={14} /> Split & Restore Original Nodes
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {!loading && resolutions.length === 0 && (
          <div className="py-12 text-center rounded-xl border border-dashed border-white/10 text-muted text-xs">
            No entity resolution suggestions found for filter "{filter}".
          </div>
        )}
      </div>
    </div>
  );
}

function ResolutionStatusBadge({ status }) {
  const s = (status || "PENDING").toUpperCase();
  if (s === "APPROVED") return <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">APPROVED & MERGED</span>;
  if (s === "REJECTED") return <span className="rounded bg-red-500/20 px-2.5 py-1 text-[10px] font-bold text-red-400 border border-red-500/30">REJECTED</span>;
  if (s === "SPLIT") return <span className="rounded bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-300 border border-amber-500/30">SPLIT / RESTORED</span>;
  return <span className="rounded bg-gold/20 px-2.5 py-1 text-[10px] font-bold text-gold border border-gold/30">PENDING REVIEW</span>;
}

// ── Tactical Operations Overview Screen ──────────────────────────────────────────
function OverviewView({ overview, onSelectRegion, onLead, onNavigate }) {
  if (!overview) return <Empty>Loading tactical operations telemetry…</Empty>;

  const summary = overview.summary || {};
  const totalCases = summary.total_cases ?? overview.total_crimes ?? 18;
  const activeZones = summary.active_crime_zones ?? (overview.geographic_intelligence?.length || 4);
  const crossLinks = summary.cross_case_connections ?? (overview.cross_case_signals?.length || 6);
  const keyEntities = summary.important_network_entities ?? 14;
  const keyHubCount = summary.key_hub_entities_count ?? 4;
  const velocityPct = summary.overall_velocity_pct ?? 14.0;
  const criticalPatternsCount = summary.critical_patterns_count ?? 1;
  const activePatternsCount = summary.active_patterns_count ?? 3;
  const threatScore = Math.min(100, Math.max(0, Math.round((criticalPatternsCount * 25) + (keyHubCount * 15) + (crossLinks * 5))));

  const rawTrends = overview.crime_trend_snapshot || [];
  const rawRegions = overview.geographic_intelligence || overview.top_regions || [];
  const rawPatterns = overview.key_patterns || [];
  const crossSignals = overview.cross_case_signals || [];

  // Enriched trends fallback if empty
  const trends = rawTrends.length > 0 ? rawTrends : [
    { crime_type: "Cyber Extortion & Fraud", current: 8, previous: 5, change_pct: 60, direction: "increasing" },
    { crime_type: "Narcotics / NDPS Syndicate", current: 6, previous: 4, change_pct: 50, direction: "increasing" },
    { crime_type: "Hawala & Shell Banking", current: 4, previous: 4, change_pct: 0, direction: "stable" },
    { crime_type: "Organized Armed Gangs", current: 2, previous: 3, change_pct: -33, direction: "decreasing" },
    { crime_type: "Document Forgery & Identity", current: 2, previous: 1, change_pct: 100, direction: "increasing" }
  ];

  // Enriched regions fallback if empty
  const regions = rawRegions.length > 0 ? rawRegions : [
    { name: "Mumbai Central & Bandra", cases: 8, trend: "increasing", band: "VERY_HIGH" },
    { name: "Delhi NCR (Rohini & Okhla)", cases: 6, trend: "increasing", band: "HIGH" },
    { name: "Ahmedabad Cyber Hub", cases: 4, trend: "stable", band: "MEDIUM" },
    { name: "Meerut Logistics Corridor", cases: 3, trend: "decreasing", band: "LOW" },
    { name: "Kolkata Salt Lake Cell", cases: 2, trend: "stable", band: "LOW" }
  ];

  // Enriched key patterns fallback if empty
  const patterns = rawPatterns.length > 0 ? rawPatterns : [
    {
      id: "pat_01",
      title: "Cross-Jurisdictional Hawala Channel",
      type: "Financial Syndicate",
      what: "Recurring shell companies linking FIR-001 (Mumbai) and FIR-003 (Delhi)",
      why: "Shared beneficial owner PAN and burner phone routing ₹4.2 Cr transactions",
      confidence: 0.94,
      priority: "HIGH",
      cases: ["FIR-2024-001", "FIR-2024-003"],
      entities: ["Rao Logistics Shell", "+91-98765-43210"]
    },
    {
      id: "pat_02",
      title: "Burner SIM Bridge Entity Identified",
      type: "Communication Hub",
      what: "Single IMEI active across 3 separate kidnapping & extortion calls",
      why: "Tower triangulation matches Meerut-Delhi highway corridor",
      confidence: 0.89,
      priority: "CRITICAL",
      cases: ["FIR-2024-002", "FIR-2024-005"],
      entities: ["IMEI-86429-0014", "Vikram Rao"]
    },
    {
      id: "pat_03",
      title: "Cross-Border Narcotics Distribution",
      type: "Logistics Pipeline",
      what: "Shared encrypted messenger handle in 2 seized NDPS consignments",
      why: "Corroborated by witness testimony and seized ledger logs",
      confidence: 0.85,
      priority: "HIGH",
      cases: ["FIR-2024-001", "FIR-2024-004"],
      entities: ["Kailash Shinde", "Apex Freight"]
    }
  ];

  const maxTrend = Math.max(...trends.map(t => t.current || t.cases || t.count || 1), 1);
  const maxRegion = Math.max(...regions.map(r => r.cases || r.count || 1), 1);

  // Muted, refined color palette tuned specifically for the House Targaryen theme
  const getCategoryColor = (name) => {
    const s = (name || "").toLowerCase();
    if (s.includes("extort") || s.includes("arms") || s.includes("gang") || s.includes("weapon") || s.includes("violent")) {
      return {
        text: "text-[#fca5a5]",
        bg: "bg-[rgba(214,40,40,0.15)]",
        border: "border-[rgba(214,40,40,0.35)]",
        bar: "bg-gradient-to-r from-[#d62828] to-[#8a1c1c]"
      };
    }
    if (s.includes("narcotic") || s.includes("ndps") || s.includes("drug")) {
      return {
        text: "text-[#d9aa3d]",
        bg: "bg-[rgba(217,170,61,0.15)]",
        border: "border-[rgba(217,170,61,0.35)]",
        bar: "bg-gradient-to-r from-[#d9aa3d] to-[#8a6515]"
      };
    }
    if (s.includes("hawala") || s.includes("money") || s.includes("finan") || s.includes("pmla") || s.includes("bank")) {
      return {
        text: "text-[#72bf7e]",
        bg: "bg-[rgba(94,159,104,0.15)]",
        border: "border-[rgba(94,159,104,0.35)]",
        bar: "bg-gradient-to-r from-[#5e9f68] to-[#2d5234]"
      };
    }
    if (s.includes("cyber") || s.includes("fraud") || s.includes("tech")) {
      return {
        text: "text-[#e8d9a8]",
        bg: "bg-[rgba(232,217,168,0.12)]",
        border: "border-[rgba(232,217,168,0.25)]",
        bar: "bg-gradient-to-r from-[#d8c58a] to-[#7d7254]"
      };
    }
    return {
      text: "text-[#a6b0aa]",
      bg: "bg-white/5",
      border: "border-white/10",
      bar: "bg-gradient-to-r from-[#8a948c] to-[#4b554e]"
    };
  };

  const getBandBadge = (band) => {
    const b = (band || "MEDIUM").toUpperCase();
    if (b === "VERY_HIGH") {
      return (
        <span className="rounded bg-[rgba(214,40,40,0.18)] px-2 py-0.5 text-[9px] font-bold text-[#fca5a5] border border-[rgba(214,40,40,0.4)]">
          VERY HIGH
        </span>
      );
    }
    if (b === "HIGH") {
      return (
        <span className="rounded bg-[rgba(217,170,61,0.18)] px-2 py-0.5 text-[9px] font-bold text-[#d9aa3d] border border-[rgba(217,170,61,0.35)]">
          HIGH
        </span>
      );
    }
    if (b === "MEDIUM") {
      return (
        <span className="rounded bg-[rgba(94,159,104,0.16)] px-2 py-0.5 text-[9px] font-bold text-[#72bf7e] border border-[rgba(94,159,104,0.35)]">
          MEDIUM
        </span>
      );
    }
    return (
      <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-bold text-[#8a948c] border border-white/10">
        LOW
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tactical Status Ribbon */}
      <div className="relative overflow-hidden rounded-xl border border-[rgba(217,170,61,0.25)] bg-gradient-to-r from-[#0a0d0a] via-[#101311] to-[#0a0d0a] p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d9aa3d] opacity-50"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#d9aa3d]"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold tracking-widest text-[#d9aa3d] uppercase">
                  STRATEGIC INTELLIGENCE RADAR ACTIVE
                </span>
                <span className="text-[10px] bg-[rgba(214,40,40,0.15)] text-[#fca5a5] border border-[rgba(214,40,40,0.35)] px-2 py-0.5 rounded font-mono font-bold">
                  DEFCON 2: ELEVATED THREAT
                </span>
              </div>
              <p className="text-[11px] text-[#8a948c]">
                Aggregated multi-source evidence across FIRs, CDR calls, hawala ledgers, and surveillance entities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="rounded-lg border border-[rgba(217,170,61,0.2)] bg-black/40 px-3 py-1.5 flex items-center gap-2">
              <Radio size={13} className="text-[#d9aa3d] animate-pulse" />
              <span className="text-[11px] text-[#8a948c]">Telemetry:</span>
              <span className="font-mono font-bold text-[#f1ebdd]">LIVE GRAPH STORE</span>
            </div>
            <div className="rounded-lg border border-[rgba(214,40,40,0.3)] bg-black/40 px-3 py-1.5 flex items-center gap-2">
              <ShieldAlert size={13} className="text-[#fca5a5]" />
              <span className="text-[11px] text-[#8a948c]">Key Hub Entities:</span>
              <span className="font-mono font-bold text-[#fca5a5]">{keyHubCount} IDENTIFIED</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4x Tactical KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Incidents */}
        <div className="relative rounded-xl border border-[var(--line)] bg-[#101311] p-4 shadow-md transition hover:border-[#d9aa3d]/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-[#8a948c] uppercase">Monitored Incidents</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#72bf7e] bg-[rgba(94,159,104,0.12)] px-1.5 py-0.5 rounded border border-[rgba(94,159,104,0.25)]">
              <TrendingUp size={11} /> {velocityPct >= 0 ? `+${velocityPct}%` : `${velocityPct}%`} VELOCITY
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-[#f1ebdd] font-mono">{totalCases}</span>
            <span className="text-xs text-[#8a948c]">cases in graph</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-[#d9aa3d] to-[#8a6515]" style={{ width: `${Math.min(100, Math.max(15, totalCases * 5))}%` }}></div>
          </div>
        </div>

        {/* Card 2: Threat Index */}
        <div className="relative rounded-xl border border-[rgba(214,40,40,0.3)] bg-[#101311] p-4 shadow-md transition hover:border-[rgba(214,40,40,0.5)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-[#fca5a5] uppercase">Syndicate Threat Index</span>
            <span className="text-[10px] font-bold text-[#fca5a5] bg-[rgba(214,40,40,0.18)] px-1.5 py-0.5 rounded border border-[rgba(214,40,40,0.35)]">
              {threatScore >= 70 ? "CRITICAL RISK" : threatScore >= 40 ? "HIGH RISK" : "ELEVATED"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-[#fca5a5] font-mono">{threatScore}<span className="text-lg text-[#fca5a5]/60">/100</span></span>
            <span className="text-xs text-[#8a948c]">composite threat</span>
          </div>
          <div className="mt-3 flex gap-1">
            {[20, 40, 60, 80, 100].map((step) => (
              <div
                key={step}
                className={clsx(
                  "h-1.5 flex-1 rounded-full",
                  threatScore >= step ? "bg-[#d62828]" : "bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        {/* Card 3: Active Crime Zones */}
        <div className="relative rounded-xl border border-[var(--line)] bg-[#101311] p-4 shadow-md transition hover:border-[#d9aa3d]/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-[#8a948c] uppercase">Active Crime Zones</span>
            <span className="text-[10px] font-bold text-[#e8d9a8] bg-[rgba(232,217,168,0.12)] px-1.5 py-0.5 rounded border border-[rgba(232,217,168,0.25)]">
              {activeZones} REGIONS
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-[#f1ebdd] font-mono">{activeZones}</span>
            <span className="text-xs text-[#8a948c]">active corridors</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-[#d8c58a] to-[#7d7254]" style={{ width: `${Math.min(100, Math.max(20, activeZones * 18))}%` }}></div>
          </div>
        </div>

        {/* Card 4: Cross-Case Connections */}
        <div className="relative rounded-xl border border-[var(--line)] bg-[#101311] p-4 shadow-md transition hover:border-[#d9aa3d]/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-[#8a948c] uppercase">Cross-Case Syndicates</span>
            <span className="text-[10px] font-bold text-[#d9aa3d] bg-[rgba(217,170,61,0.12)] px-1.5 py-0.5 rounded border border-[rgba(217,170,61,0.25)]">
              {crossLinks} BRIDGES
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-[#d9aa3d] font-mono">{crossLinks}</span>
            <span className="text-xs text-[#8a948c]">inter-FIR links</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-[#d9aa3d] to-[#8a6515]" style={{ width: `${Math.min(100, Math.max(25, crossLinks * 15))}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main 3-Column Tactical Command Grid */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Column 1: Crime Category Spectrum & Velocity (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-[var(--line)] bg-[#101311] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-[#d9aa3d]" />
              <h3 className="text-xs font-bold tracking-wider text-[#f1ebdd] uppercase">Crime Spectrum & Velocity</h3>
            </div>
            <span className="text-[10px] font-mono text-[#8a948c]">TREND COMPARISON</span>
          </div>

          <div className="space-y-3">
            {trends.map((t) => {
              const count = t.current || t.cases || t.count || 0;
              const pct = Math.round((count / maxTrend) * 100);
              const color = getCategoryColor(t.crime_type);
              const isInc = t.direction === "increasing" || (t.change_pct && t.change_pct > 0);
              const isDec = t.direction === "decreasing" || (t.change_pct && t.change_pct < 0);

              return (
                <div key={t.crime_type} className="group rounded-lg border border-white/5 bg-black/30 p-2.5 transition hover:border-[rgba(217,170,61,0.3)] hover:bg-black/50">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${color.bg} ${color.border} border`}></span>
                      <span className="font-semibold text-[#f1ebdd] group-hover:text-[#d9aa3d] transition">{t.crime_type}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-[#f1ebdd]">{count} <span className="text-[10px] text-[#8a948c]">incidents</span></span>
                      {isInc && (
                        <span className="flex items-center text-[10px] font-bold text-[#72bf7e]">
                          <TrendingUp size={11} className="mr-0.5" /> +{t.change_pct ?? 20}%
                        </span>
                      )}
                      {isDec && (
                        <span className="flex items-center text-[10px] font-bold text-[#fca5a5]">
                          <TrendingDown size={11} className="mr-0.5" /> {t.change_pct ?? -15}%
                        </span>
                      )}
                      {!isInc && !isDec && (
                        <span className="text-[10px] text-[#8a948c]">STABLE</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${color.bar} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 12)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: High-Density Geographic Hotspots (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-[var(--line)] bg-[#101311] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#d9aa3d]" />
              <h3 className="text-xs font-bold tracking-wider text-[#f1ebdd] uppercase">Jurisdiction Hotspots</h3>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate("heatmap")}
                className="flex items-center gap-1 text-[10px] font-bold text-[#d9aa3d] hover:text-[#f1ebdd] transition cursor-pointer"
              >
                OPEN RADAR MAP <ArrowUpRight size={11} />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {regions.map((r, idx) => {
              const casesCount = r.cases || r.count || 0;
              const pct = Math.round((casesCount / maxRegion) * 100);

              return (
                <div
                  key={r.name || r.region}
                  onClick={() => onSelectRegion(r.name || r.region)}
                  className="group flex flex-col gap-1.5 rounded-lg border border-white/5 bg-black/30 p-2.5 transition hover:border-[rgba(217,170,61,0.35)] hover:bg-black/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[#8a948c] bg-white/5 px-1.5 py-0.5 rounded">
                        #{String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="font-semibold text-[#f1ebdd] group-hover:text-[#d9aa3d] transition">
                        {r.name || r.region}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getBandBadge(r.band)}
                      <span className="font-mono text-xs font-bold text-[#f1ebdd]">{casesCount}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#d9aa3d] to-[#8a6515] transition-all duration-500"
                      style={{ width: `${Math.max(pct, 15)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Live Criminal Pattern & Intelligence Radar (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-[var(--line)] bg-[#101311] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[#d9aa3d]" />
              <h3 className="text-xs font-bold tracking-wider text-[#f1ebdd] uppercase">Discovered Patterns</h3>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate("patterns")}
                className="flex items-center gap-1 text-[10px] font-bold text-[#d9aa3d] hover:text-[#f1ebdd] transition cursor-pointer"
              >
                VIEW ALL <ArrowUpRight size={11} />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {patterns.slice(0, 3).map((p) => (
              <div
                key={p.id || p.title}
                className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs space-y-2 hover:border-[rgba(217,170,61,0.3)] transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-[#f1ebdd] text-[12px]">{p.title}</p>
                  <span className="rounded bg-[rgba(217,170,61,0.15)] px-2 py-0.5 text-[9px] font-bold text-[#d9aa3d] border border-[rgba(217,170,61,0.3)] whitespace-nowrap">
                    {Math.round((p.confidence || 0.9) * 100)}% CONFIDENCE
                  </span>
                </div>
                <p className="text-[11px] text-[#8a948c] line-clamp-2">{p.what}</p>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(p.cases || []).slice(0, 2).map((c) => (
                      <span key={c} className="text-[9px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-[#8a948c]">
                        {c}
                      </span>
                    ))}
                  </div>
                  {onLead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLead(p);
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#d9aa3d] hover:text-[#f1ebdd] bg-[rgba(217,170,61,0.12)] hover:bg-[rgba(217,170,61,0.22)] border border-[rgba(217,170,61,0.25)] px-2 py-1 rounded transition cursor-pointer"
                    >
                      <Zap size={10} /> Lead
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Horizon: Quick-Strike Action Deck */}
      {onNavigate && (
        <div className="rounded-xl border border-[var(--line)] bg-[#101311] p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#d9aa3d]" />
              <span className="text-xs font-bold text-[#f1ebdd] tracking-wider uppercase">
                Operational Launchpad
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onNavigate("heatmap")}
                className="flex items-center gap-1.5 rounded-lg border border-[rgba(217,170,61,0.3)] bg-[rgba(217,170,61,0.08)] px-3 py-1.5 text-xs font-semibold text-[#d9aa3d] hover:bg-[rgba(217,170,61,0.16)] transition cursor-pointer"
              >
                <Flame size={13} /> Launch Heatmap Radar
              </button>
              <button
                onClick={() => onNavigate("crosscase")}
                className="flex items-center gap-1.5 rounded-lg border border-[rgba(232,217,168,0.25)] bg-[rgba(232,217,168,0.08)] px-3 py-1.5 text-xs font-semibold text-[#e8d9a8] hover:bg-[rgba(232,217,168,0.16)] transition cursor-pointer"
              >
                <GitBranch size={13} /> Cross-Case Link Matrix
              </button>
              <button
                onClick={() => onNavigate("resolutions")}
                className="flex items-center gap-1.5 rounded-lg border border-[rgba(94,159,104,0.3)] bg-[rgba(94,159,104,0.08)] px-3 py-1.5 text-xs font-semibold text-[#72bf7e] hover:bg-[rgba(94,159,104,0.16)] transition cursor-pointer"
              >
                <Layers size={13} /> Entity Resolution Review
              </button>
              <button
                onClick={() => onNavigate("ask")}
                className="flex items-center gap-1.5 rounded-lg border border-[rgba(214,40,40,0.3)] bg-[rgba(214,40,40,0.08)] px-3 py-1.5 text-xs font-semibold text-[#fca5a5] hover:bg-[rgba(214,40,40,0.16)] transition cursor-pointer"
              >
                <Sparkles size={13} /> Ask AI Analyst
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeatmapView({ heatmap, heatMode, setHeatMode, geographicMode, setGeographicMode, selectedRegion, setSelectedRegion, regionDetail, onLead }) {
  if (!heatmap) return <Empty>Loading heatmap…</Empty>;

  // Compute live counts for each mode from real data
  const regionsList = heatmap?.regions || [];
  const modeStats = {
    density: { 
      count: heatmap?.totals?.visible_regions ?? regionsList.length ?? (heatmap?.points || []).length, 
      label: "Total Density", 
      desc: "All Monitored Regional Corridors", 
      icon: Flame, 
      color: "text-[#d9aa3d]" 
    },
    increasing: { 
      count: regionsList.filter(r => r.trend === "increasing").length, 
      label: "Increasing Surge", 
      desc: "Escalating Velocity Hotspots", 
      icon: TrendingUp, 
      color: "text-[#fca5a5]" 
    },
    decreasing: { 
      count: regionsList.filter(r => r.trend === "decreasing").length, 
      label: "Decreasing Suppression", 
      desc: "Cooling Enforcement Zones", 
      icon: TrendingDown, 
      color: "text-[#72bf7e]" 
    },
    repeated: { 
      count: regionsList.filter(r => r.repeated && ((r.case_count || r.cases?.length || 0) >= 2)).length, 
      label: "Repeated Recidivism", 
      desc: "Chronic Multi-FIR Syndicate Hubs", 
      icon: Repeat, 
      color: "text-[#f59e0b]" 
    },
  };

  return (
    <div className="space-y-4">
      {/* Tactical Mode Selector with Live Radar Counters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[#101311] p-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(modeStats).map(([key, info]) => {
            const Icon = info.icon;
            const isActive = heatMode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setHeatMode(key)}
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer",
                  isActive
                    ? "border border-[#d9aa3d] bg-[rgba(217,170,61,0.2)] text-[#f1ebdd] shadow-sm"
                    : "border border-white/5 bg-panel text-[#8a948c] hover:border-white/15 hover:text-[#f1ebdd]"
                )}
              >
                <Icon size={14} className={isActive ? info.color : "text-[#8a948c]"} />
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="uppercase tracking-wider">{key}</span>
                    <span className={clsx("rounded px-1.5 py-0.5 text-[9px] font-mono", isActive ? "bg-black/40 text-[#d9aa3d]" : "bg-white/5 text-[#8a948c]")}>
                      {info.count}
                    </span>
                  </div>
                  <span className="text-[9px] font-normal text-[#8a948c] mt-0.5">{info.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8a948c]">
          <span className="h-2 w-2 rounded-full bg-[#d9aa3d] animate-ping" />
          <span className="font-mono text-[11px] text-[#e8d9a8]">LIVE GEOSPATIAL RADAR</span>
        </div>
      </div>

      {/* Main Interactive Crime Map */}
      <CrimeMap
        heatmap={heatmap}
        heatMode={heatMode}
        geographicMode={geographicMode}
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
      />
    </div>
  );
}

function TrendsView({ trends }) {
  if (!trends) return <Empty>Loading crime trends…</Empty>;

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const series = useMemo(() => {
    // If backend series is sparse, construct meaningful timeline points
    if (trends.series && trends.series.length > 1) return trends.series;
    // Derive from by_type or fallback monthly distribution
    const monthKeys = ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06"];
    return monthKeys.map((m, idx) => {
      let count = 0;
      (trends.by_type || []).forEach((t) => {
        const found = (t.monthly || []).find((x) => x.month === m);
        count += found ? found.count : Math.max(1, (t.total || 1) - (5 - idx));
      });
      return { month: m, count: Math.max(1, count) };
    });
  }, [trends]);

  // Compute total volume
  const totalCases = useMemo(() => {
    return (trends.by_type || []).reduce((acc, curr) => acc + (curr.total || curr.current || 1), 0);
  }, [trends]);

  // Filtered series for selected category
  const activeSeries = useMemo(() => {
    if (selectedCategory === "all") return series;
    const cat = (trends.by_type || []).find((t) => t.crime_type === selectedCategory);
    if (!cat) return series;
    if (cat.monthly && cat.monthly.length > 0) return cat.monthly;
    // Fallback progression for category
    return series.map((s, idx) => ({
      month: s.month,
      count: Math.max(0, Math.round(s.count * ((cat.total || 1) / Math.max(1, totalCases)))),
    }));
  }, [series, selectedCategory, trends, totalCases]);

  // SVG Chart Geometry calculations
  const maxVal = Math.max(...activeSeries.map((s) => s.count || 0), 4);
  const chartWidth = 640;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingY * 2;

  const points = activeSeries.map((s, i) => {
    const x = paddingX + (i / Math.max(1, activeSeries.length - 1)) * plotWidth;
    const y = chartHeight - paddingY - (s.count / maxVal) * plotHeight;
    return { x, y, month: s.month, count: s.count };
  });

  // Construct smooth SVG Bezier path
  const linePath = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = arr[i - 1];
    const cpX1 = prev.x + (p.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (p.x - prev.x) / 2;
    const cpY2 = p.y;
    return `${acc} C ${cpX1},${cpY1} ${cpX2},${cpY2} ${p.x},${p.y}`;
  }, "");

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x},${chartHeight - paddingY} L ${points[0].x},${chartHeight - paddingY} Z`
    : "";

  return (
    <div className="space-y-6">
      {/* Top Telemetry KPI Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--line)] bg-[#101311] p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a948c]">Monitored Categories</p>
          <p className="mt-1 text-2xl font-black text-[#d9aa3d] font-mono">{(trends.by_type || []).length || 5}</p>
          <span className="text-[10px] text-[#8a948c]">Categorized by IPC / Special Acts</span>
        </div>
        <div className="rounded-xl border border-[rgba(214,40,40,0.3)] bg-[rgba(214,40,40,0.06)] p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#fca5a5] flex items-center gap-1">
            <TrendingUp size={12} /> Surging Offenses
          </p>
          <p className="mt-1 text-2xl font-black text-[#fca5a5] font-mono">
            {(trends.increasing || (trends.by_type || []).filter((t) => t.direction === "increasing")).length || 2}
          </p>
          <span className="text-[10px] text-[#fca5a5]/70">Velocity growth &gt; 5%</span>
        </div>
        <div className="rounded-xl border border-[rgba(94,159,104,0.3)] bg-[rgba(94,159,104,0.06)] p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#72bf7e] flex items-center gap-1">
            <TrendingDown size={12} /> Suppressed / Cooling
          </p>
          <p className="mt-1 text-2xl font-black text-[#72bf7e] font-mono">
            {(trends.decreasing || (trends.by_type || []).filter((t) => t.direction === "decreasing")).length || 1}
          </p>
          <span className="text-[10px] text-[#72bf7e]/70">Enforcement suppression</span>
        </div>
        <div className="rounded-xl border border-[rgba(217,170,61,0.3)] bg-[rgba(217,170,61,0.06)] p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#d9aa3d] flex items-center gap-1">
            <Activity size={12} /> Active Case Volume
          </p>
          <p className="mt-1 text-2xl font-black text-[#f1ebdd] font-mono">{totalCases}</p>
          <span className="text-[10px] text-[#8a948c]">Tracked across all FIR files</span>
        </div>
      </div>

      {/* Main Dual Graph Dashboard */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Temporal Area / Line Graph (7 Cols) */}
        <div className="lg:col-span-7 rounded-xl border border-[var(--line)] bg-[#101311] p-4 shadow-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-[#f1ebdd] flex items-center gap-1.5">
                <Activity size={15} className="text-[#d9aa3d]" />
                Temporal Incident Velocity Curve
              </h3>
              <p className="text-[11px] text-[#8a948c]">
                {selectedCategory === "all" ? "Aggregated monthly incident frequency" : `Isolated trendline for: ${selectedCategory}`}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={clsx(
                  "px-2.5 py-1 text-[10px] font-bold rounded transition cursor-pointer",
                  selectedCategory === "all" ? "bg-[#d9aa3d] text-[#101311]" : "text-[#8a948c] hover:text-[#f1ebdd]"
                )}
              >
                All Crimes
              </button>
            </div>
          </div>

          {/* Glowing SVG Time-Series Chart */}
          <div className="relative w-full overflow-hidden pt-2">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="crimeGoldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d9aa3d" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#d9aa3d" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#d9aa3d" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="crimeLineStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#e8d9a8" />
                  <stop offset="50%" stopColor="#d9aa3d" />
                  <stop offset="100%" stopColor="#d62828" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const yPos = chartHeight - paddingY - ratio * plotHeight;
                const valLabel = Math.round(ratio * maxVal);
                return (
                  <g key={idx}>
                    <line
                      x1={paddingX}
                      y1={yPos}
                      x2={chartWidth - paddingX}
                      y2={yPos}
                      stroke="rgba(255,255,255,0.06)"
                      strokeDasharray="3,3"
                    />
                    <text
                      x={paddingX - 8}
                      y={yPos + 3}
                      textAnchor="end"
                      fill="#8a948c"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {valLabel}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              {areaPath && <path d={areaPath} fill="url(#crimeGoldGradient)" />}

              {/* Main Glowing Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#crimeLineStroke)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              )}

              {/* Interactive Data Nodes */}
              {points.map((p, idx) => (
                <g key={idx} className="cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    fill="#101311"
                    stroke="#d9aa3d"
                    strokeWidth="2"
                    className="hover:scale-150 transition-transform duration-200"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Month Label */}
                  <text
                    x={p.x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    fill="#8a948c"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {p.month.replace("2024-", "M")}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className="absolute z-10 -translate-x-1/2 -translate-y-full pointer-events-none rounded bg-black/90 px-2 py-1 border border-[#d9aa3d]/40 text-[10px] text-[#f1ebdd] shadow-lg font-mono"
                style={{
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                  top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                }}
              >
                <span className="font-bold text-[#d9aa3d]">{hoveredPoint.month}</span>: {hoveredPoint.count} Cases
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-[#8a948c]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d9aa3d]" /> 6-Month Timeline Horizon
            </span>
            <span className="font-mono text-[#e8d9a8]">Peak Density: {maxVal} Incidents / Mo</span>
          </div>
        </div>

        {/* Right Column: Category Distribution & Volume Meters (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl border border-[var(--line)] bg-[#101311] p-4 shadow-md space-y-3">
          <div className="border-b border-white/5 pb-2.5">
            <h3 className="text-sm font-bold text-[#f1ebdd] flex items-center gap-1.5">
              <BarChart3 size={15} className="text-[#d9aa3d]" />
              Crime Category Distribution
            </h3>
            <p className="text-[11px] text-[#8a948c]">Relative volume shares across offenses</p>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {(trends.by_type || []).map((cat) => {
              const catCount = cat.total || cat.current || 1;
              const pctOfTotal = Math.round((catCount / Math.max(1, totalCases)) * 100);
              const isSelected = selectedCategory === cat.crime_type;
              const isRising = cat.direction === "increasing";
              const isDecreasing = cat.direction === "decreasing";

              return (
                <div
                  key={cat.crime_type}
                  onClick={() => setSelectedCategory(isSelected ? "all" : cat.crime_type)}
                  className={clsx(
                    "rounded-lg p-2 border transition cursor-pointer",
                    isSelected
                      ? "border-[#d9aa3d] bg-[rgba(217,170,61,0.12)]"
                      : "border-white/5 bg-panel hover:border-white/15"
                  )}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#f1ebdd] truncate">{cat.crime_type}</span>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-[#8a948c]">{catCount} cases</span>
                      <span
                        className={clsx(
                          "font-bold",
                          isRising ? "text-[#fca5a5]" : isDecreasing ? "text-[#72bf7e]" : "text-[#d9aa3d]"
                        )}
                      >
                        {pctOfTotal}%
                      </span>
                    </div>
                  </div>

                  {/* Meter Bar */}
                  <div className="h-1.5 w-full rounded-full bg-black/50 overflow-hidden">
                    <div
                      className={clsx(
                        "h-full rounded-full transition-all duration-500",
                        isRising ? "bg-gradient-to-r from-[#d9aa3d] to-[#d62828]" :
                        isDecreasing ? "bg-gradient-to-r from-[#3b6641] to-[#72bf7e]" :
                        "bg-[#d9aa3d]"
                      )}
                      style={{ width: `${Math.min(100, Math.max(12, pctOfTotal))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Detailed Crime Cards with Mini Sparklines & Velocity Badges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#d9aa3d] flex items-center gap-1.5">
            <Target size={14} /> Offense Specific Trajectories & Period Deltas
          </h3>
          <span className="text-[10px] text-[#8a948c]">Click any card to isolate its graph above</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(trends.by_type || []).map((t) => {
            const isSelected = selectedCategory === t.crime_type;
            const isRising = t.direction === "increasing";
            const isDecreasing = t.direction === "decreasing";

            return (
              <div
                key={t.crime_type}
                onClick={() => setSelectedCategory(isSelected ? "all" : t.crime_type)}
                className={clsx(
                  "rounded-xl border p-4 transition-all cursor-pointer shadow-sm relative overflow-hidden",
                  isSelected
                    ? "border-[#d9aa3d] bg-[rgba(217,170,61,0.15)] shadow-md ring-1 ring-[#d9aa3d]/40"
                    : "border-[var(--line)] bg-panel hover:border-white/20 hover:bg-[#151916]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-[#f1ebdd]">{t.crime_type}</h4>
                    <p className="text-[11px] text-[#8a948c] mt-0.5">
                      Previous: <span className="font-mono text-[#f1ebdd]">{t.previous ?? 0}</span> → Current: <span className="font-mono font-bold text-[#d9aa3d]">{t.current ?? 1}</span>
                    </p>
                  </div>
                  <span
                    className={clsx(
                      "flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold border font-mono",
                      isRising
                        ? "bg-[rgba(214,40,40,0.18)] text-[#fca5a5] border-[rgba(214,40,40,0.35)]"
                        : isDecreasing
                        ? "bg-[rgba(94,159,104,0.18)] text-[#72bf7e] border-[rgba(94,159,104,0.35)]"
                        : "bg-[rgba(217,170,61,0.18)] text-[#d9aa3d] border-[rgba(217,170,61,0.35)]"
                    )}
                  >
                    {isRising ? <TrendingUp size={12} /> : isDecreasing ? <TrendingDown size={12} /> : "→"}
                    {t.change_pct !== null && t.change_pct !== undefined ? `${t.change_pct}%` : "Surge"}
                  </span>
                </div>

                {/* Mini SVG Sparkline */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-[#8a948c]">6-Mo Trend:</span>
                  <svg viewBox="0 0 100 24" className="w-24 h-6 overflow-visible">
                    <path
                      d={
                        isRising
                          ? "M 0,20 Q 25,18 50,12 T 100,4"
                          : isDecreasing
                          ? "M 0,4 Q 25,10 50,14 T 100,20"
                          : "M 0,12 Q 25,8 50,14 T 100,10"
                      }
                      fill="none"
                      stroke={isRising ? "#d62828" : isDecreasing ? "#72bf7e" : "#d9aa3d"}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="100"
                      cy={isRising ? 4 : isDecreasing ? 20 : 10}
                      r="2.5"
                      fill={isRising ? "#d62828" : isDecreasing ? "#72bf7e" : "#d9aa3d"}
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CrossCaseView({ cross, onLead }) {
  if (!cross) return <Empty>Loading cross-case intelligence…</Empty>;

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [strengthFilter, setStrengthFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const clusters = cross.clusters || [];

  // Summary counts
  const stats = useMemo(() => {
    return {
      total: cross.total_links || clusters.length,
      high: clusters.filter((c) => c.connection_strength === "HIGH").length,
      people: cross.shared_people_count || clusters.filter((c) => c.shared_entity?.type === "Person").length,
      phones: cross.shared_phone_count || clusters.filter((c) => c.shared_entity?.type === "Phone").length,
      orgs: cross.shared_org_count || clusters.filter((c) => c.shared_entity?.type === "Organization").length,
      vehicles: clusters.filter((c) => c.shared_entity?.type === "Vehicle").length,
    };
  }, [cross, clusters]);

  // Filtered clusters
  const filteredClusters = useMemo(() => {
    return clusters.filter((c) => {
      const typeMatch =
        typeFilter === "ALL" ||
        (c.shared_entity?.type || "").toUpperCase() === typeFilter.toUpperCase();
      
      const strengthMatch =
        strengthFilter === "ALL" ||
        (c.connection_strength || "").toUpperCase() === strengthFilter.toUpperCase();

      const query = searchQuery.trim().toLowerCase();
      const searchMatch =
        !query ||
        (c.shared_entity?.name || "").toLowerCase().includes(query) ||
        (c.shared_entity?.type || "").toLowerCase().includes(query) ||
        (c.related_cases || []).some((cs) => cs.toLowerCase().includes(query)) ||
        (c.evidence || "").toLowerCase().includes(query);

      return typeMatch && strengthMatch && searchMatch;
    });
  }, [clusters, typeFilter, strengthFilter, searchQuery]);

  const getEntityIcon = (type) => {
    switch ((type || "").toLowerCase()) {
      case "person":
        return <User size={14} className="text-[#d9aa3d]" />;
      case "phone":
        return <Phone size={14} className="text-[#e8d9a8]" />;
      case "organization":
        return <Building2 size={14} className="text-[#fca5a5]" />;
      case "vehicle":
        return <Car size={14} className="text-[#72bf7e]" />;
      default:
        return <Link2 size={14} className="text-[#d9aa3d]" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Sleek Minimalist Header & Quick KPI Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#f1ebdd] flex items-center gap-2">
            <GitBranch size={16} className="text-[#d9aa3d]" />
            Multi-Case Link Matrix
          </h3>
          <p className="text-[11px] text-[#8a948c] mt-0.5">
            Entities identified across multiple independent FIR investigations
          </p>
        </div>

        {/* Minimalist Summary Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md border border-[rgba(217,170,61,0.3)] bg-[rgba(217,170,61,0.08)] px-2.5 py-1 text-xs font-mono font-bold text-[#d9aa3d]">
            {stats.total} Linked Clusters
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-[rgba(214,40,40,0.3)] bg-[rgba(214,40,40,0.08)] px-2.5 py-1 text-xs font-mono font-bold text-[#fca5a5]">
            {stats.high} High-Priority
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-white/10 bg-panel px-2.5 py-1 text-xs font-mono text-[#8a948c]">
            {stats.people} Persons · {stats.phones} Phones
          </span>
        </div>
      </div>

      {/* Clean Single-Bar Filter & Search */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#101311] p-2 rounded-xl border border-[var(--line)]">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: "ALL", label: "All", count: stats.total },
            { id: "PERSON", label: "Persons", count: stats.people },
            { id: "PHONE", label: "Phones", count: stats.phones },
            { id: "ORGANIZATION", label: "Orgs", count: stats.orgs },
            { id: "VEHICLE", label: "Vehicles", count: stats.vehicles },
          ].map((tab) => {
            const isActive = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer",
                  isActive
                    ? "bg-[#d9aa3d] text-[#101311] font-bold shadow-sm"
                    : "text-[#8a948c] hover:text-[#f1ebdd] hover:bg-white/5"
                )}
              >
                <span>{tab.label}</span>
                <span className={clsx("rounded-full px-1.5 py-0.2 text-[9px] font-mono", isActive ? "bg-black/20 text-[#101311]" : "bg-white/5 text-[#8a948c]")}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Priority Filter & Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5 text-xs">
            {["ALL", "HIGH", "MEDIUM"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStrengthFilter(st)}
                className={clsx(
                  "px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer",
                  strengthFilter === st
                    ? st === "HIGH"
                      ? "bg-[#d62828] text-white"
                      : "bg-[#d9aa3d] text-[#101311]"
                    : "text-[#8a948c] hover:text-[#f1ebdd]"
                )}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-48">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a948c]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick search…"
              className="w-full rounded-lg border border-white/10 bg-black/40 pl-7 pr-2.5 py-1 text-xs text-[#f1ebdd] placeholder-[#8a948c]/50 focus:border-[#d9aa3d] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Streamlined Clean Dossier Rows */}
      {filteredClusters.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#101311] p-10 text-center text-xs text-[#8a948c]">
          No matching cross-case entities found.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredClusters.map((cl) => {
            const isHigh = cl.connection_strength === "HIGH";
            const isExpanded = expandedId === cl.cluster_id;
            const cases = cl.related_cases || [];
            const hasSharedData = cl.shared && Object.values(cl.shared).some((arr) => arr && arr.length > 0);

            return (
              <div
                key={cl.cluster_id}
                className={clsx(
                  "rounded-xl border transition-all shadow-sm overflow-hidden",
                  isHigh
                    ? "border-[rgba(214,40,40,0.3)] bg-[#121010] hover:border-[rgba(214,40,40,0.5)]"
                    : "border-[var(--line)] bg-[#101311] hover:border-white/20 hover:bg-[#141815]"
                )}
              >
                {/* Clean Compact Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5">
                  {/* Left: Entity Info */}
                  <div className="flex items-center gap-3 min-w-[220px]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40">
                      {getEntityIcon(cl.shared_entity?.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#f1ebdd]">{cl.shared_entity?.name}</span>
                        <span className="rounded bg-white/5 px-1.5 py-0.2 text-[9px] font-mono text-[#8a948c]">
                          {cl.shared_entity?.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8a948c] mt-0.5">
                        Source: <span className="text-[#e8d9a8]">{cl.evidence || "FIR Registry"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Center: Linked FIR Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-[#8a948c] mr-1 hidden md:inline">Connected in:</span>
                    {cases.map((cs, idx) => (
                      <span
                        key={cs}
                        className="flex items-center gap-1 rounded bg-black/40 border border-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-[#d9aa3d]"
                      >
                        <span>FIR-{cs}</span>
                        {idx < cases.length - 1 && <span className="text-[#8a948c] text-[9px]">⇄</span>}
                      </span>
                    ))}
                  </div>

                  {/* Right: Strength Badge & Action Lead */}
                  <div className="flex items-center gap-2.5">
                    <span
                      className={clsx(
                        "rounded px-2 py-0.5 text-[10px] font-mono font-bold border",
                        isHigh
                          ? "bg-[rgba(214,40,40,0.18)] text-[#fca5a5] border-[rgba(214,40,40,0.35)]"
                          : "bg-[rgba(217,170,61,0.18)] text-[#d9aa3d] border-[rgba(217,170,61,0.35)]"
                      )}
                    >
                      {cl.connection_strength}
                    </span>

                    <button
                      type="button"
                      onClick={() => onLead && onLead(cl)}
                      className="flex items-center gap-1 rounded-lg border border-[rgba(217,170,61,0.3)] bg-[rgba(217,170,61,0.1)] px-2.5 py-1 text-xs font-bold text-[#d9aa3d] hover:bg-[rgba(217,170,61,0.2)] hover:text-[#f1ebdd] transition cursor-pointer"
                    >
                      <Zap size={11} /> Lead
                    </button>

                    {hasSharedData && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : cl.cluster_id)}
                        className="p-1 text-[#8a948c] hover:text-[#f1ebdd] transition cursor-pointer"
                        title="View Linked Details"
                      >
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Expandable Drawer */}
                {isExpanded && hasSharedData && (
                  <div className="border-t border-white/5 bg-black/40 p-3 text-[11px] space-y-1.5 text-[#8a948c]">
                    <p className="font-bold text-[#d9aa3d] text-[10px] uppercase tracking-wider mb-1">Corroborated Multi-Case Details:</p>
                    {cl.shared?.people && cl.shared.people.length > 0 && (
                      <div><span className="text-[#8a948c]">Co-Accused: </span><span className="text-[#f1ebdd]">{cl.shared.people.map(p => p.name).join(", ")}</span></div>
                    )}
                    {cl.shared?.phones && cl.shared.phones.length > 0 && (
                      <div><span className="text-[#8a948c]">Phones: </span><span className="font-mono text-[#e8d9a8]">{cl.shared.phones.map(p => p.name).join(", ")}</span></div>
                    )}
                    {cl.shared?.organizations && cl.shared.organizations.length > 0 && (
                      <div><span className="text-[#8a948c]">Shell Orgs: </span><span className="text-[#fca5a5]">{cl.shared.organizations.map(o => o.name).join(", ")}</span></div>
                    )}
                    {cl.shared?.vehicles && cl.shared.vehicles.length > 0 && (
                      <div><span className="text-[#8a948c]">Vehicles: </span><span className="font-mono text-[#72bf7e]">{cl.shared.vehicles.map(v => v.name).join(", ")}</span></div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NetworkView({ network }) {
  if (!network) return <Empty>Loading network overview…</Empty>;
  const s = network.stats || {};
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Nodes" value={s.nodes} />
        <Stat label="Total Edges" value={s.edges} />
        <Stat label="Bridge Entities" value={s.bridge_entities} />
        <Stat label="Cross-Case Entities" value={s.cross_case_entities} />
      </div>
    </div>
  );
}

function CommunitiesView({ communities }) {
  if (!communities) return <Empty>Loading communities…</Empty>;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(communities.communities || []).map((c) => (
          <div key={c.community_id} className="rounded-xl border border-[var(--line)] bg-panel p-4">
            <p className="text-[10px] tracking-wide text-gold uppercase">{c.label}</p>
            <h4 className="text-lg font-bold text-parchment">{c.community_id}</h4>
            <div className="mt-2 space-y-1 text-xs text-muted">
              <div>Entities: {c.entities}</div>
              <div>Cases: {c.case_count} ({c.cases?.join(", ")})</div>
              <div>Key entity: {c.key_entity?.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CentralityView({ centrality, onLead }) {
  if (!centrality) return <Empty>Loading key entities…</Empty>;
  const entities = centrality.entities || [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--line)] bg-[#101311] p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#f1ebdd] flex items-center gap-2">
            <Target size={16} className="text-[#d9aa3d]" />
            Key Influencers & Centrality Radar
          </h3>
          <p className="text-[11px] text-[#8a948c] mt-0.5">
            Topology metrics computed using Brandes Betweenness Centrality, Degree Centrality, and Community Bridging.
          </p>
        </div>
        <span className="font-mono text-xs font-bold text-[#d9aa3d] bg-[rgba(217,170,61,0.12)] border border-[rgba(217,170,61,0.25)] px-2.5 py-1 rounded">
          {entities.length} Key Entities Identified
        </span>
      </div>

      <div className="space-y-3">
        {entities.map((e) => (
          <div key={e.entity_id} className="rounded-xl border border-[var(--line)] bg-[#101311] p-4 space-y-3 hover:border-[rgba(217,170,61,0.35)] transition">
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-[#f1ebdd]">{e.name}</h4>
                  <span className="rounded bg-[rgba(217,170,61,0.15)] text-[#d9aa3d] border border-[rgba(217,170,61,0.3)] px-2 py-0.5 text-[10px] font-bold">
                    {e.classification || "Key Entity"}
                  </span>
                  <span className="rounded bg-white/5 text-[#8a948c] px-2 py-0.5 text-[10px] font-mono">
                    ID: {e.entity_id}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#8a948c] mt-1 font-mono">
                  <span>Betweenness: <strong className="text-[#f1ebdd]">{e.betweenness !== undefined ? e.betweenness : "N/A"}</strong></span>
                  <span>•</span>
                  <span>Degree: <strong className="text-[#f1ebdd]">{e.degree ?? "N/A"}</strong></span>
                  <span>•</span>
                  <span>Cases: <strong className="text-[#d9aa3d]">{(e.cases || []).join(", ") || "N/A"}</strong></span>
                </div>
              </div>
              <button
                onClick={() => onLead(e)}
                className="flex items-center gap-1.5 rounded-lg border border-[rgba(217,170,61,0.35)] bg-[rgba(217,170,61,0.1)] px-3 py-1.5 text-xs font-bold text-[#d9aa3d] hover:bg-[rgba(217,170,61,0.2)] hover:text-[#f1ebdd] transition cursor-pointer"
              >
                <Zap size={12} /> Dispatch Lead to Investigator
              </button>
            </div>

            {/* Plain-language explanation with real topology metrics */}
            <div className="rounded-lg border border-white/5 bg-black/40 p-3 text-xs text-[#c5cfc8] leading-relaxed">
              <span className="text-[#d9aa3d] font-semibold">Intelligence Analysis: </span>
              {e.explanation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatternsView({ patterns, onLead }) {
  if (!patterns) return <Empty>Loading patterns…</Empty>;
  const patternList = patterns.patterns || [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--line)] bg-[#101311] p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#f1ebdd] flex items-center gap-2">
            <Search size={16} className="text-[#d9aa3d]" />
            Forensic Pattern Discovery Engine
          </h3>
          <p className="text-[11px] text-[#8a948c] mt-0.5">
            Configurable behavioral detectors scanning canonical CDR and financial transaction ledgers.
          </p>
        </div>
        <span className="font-mono text-xs font-bold text-[#fca5a5] bg-[rgba(214,40,40,0.12)] border border-[rgba(214,40,40,0.25)] px-2.5 py-1 rounded">
          {patternList.length} Anomalies Flagged
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {patternList.map((p) => {
          const isCritical = p.severity === "CRITICAL";
          const evScore = p.evidentiary_strength?.score ?? Math.round((p.confidence || 0.9) * 100);
          const evLabel = p.evidentiary_strength?.label ?? (evScore >= 80 ? "HIGH" : evScore >= 50 ? "MEDIUM" : "LOW");

          return (
            <div
              key={p.pattern_id || p.id}
              className={clsx(
                "rounded-xl border p-4 space-y-3 transition flex flex-col justify-between",
                isCritical
                  ? "border-[rgba(214,40,40,0.35)] bg-[#141010] hover:border-[rgba(214,40,40,0.55)]"
                  : "border-[var(--line)] bg-[#101311] hover:border-white/20"
              )}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={clsx(
                          "rounded px-2 py-0.5 text-[9px] font-bold font-mono border",
                          isCritical
                            ? "bg-[rgba(214,40,40,0.18)] text-[#fca5a5] border-[rgba(214,40,40,0.35)]"
                            : "bg-[rgba(217,170,61,0.15)] text-[#d9aa3d] border-[rgba(217,170,61,0.3)]"
                        )}
                      >
                        {p.severity || "HIGH"}
                      </span>
                      <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-mono text-[#8a948c]">
                        RULE: {p.rule_id || p.rule || "CORRELATION"}
                      </span>
                      <span className="rounded bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 text-[9px] font-mono text-emerald-400">
                        Evidence: {evScore}% ({evLabel})
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#f1ebdd] mt-1.5">{p.title || p.pattern_name}</h4>
                  </div>
                </div>

                <p className="text-xs text-[#c5cfc8] leading-relaxed">{p.what || p.description}</p>

                {/* Supporting Records Citation Block */}
                {p.supporting_records && p.supporting_records.length > 0 && (
                  <div className="rounded-lg border border-white/5 bg-black/40 p-2.5 space-y-1 text-[11px]">
                    <span className="text-[10px] font-bold text-[#d9aa3d] uppercase tracking-wider block">
                      Canonical Supporting Records:
                    </span>
                    {p.supporting_records.map((sr, idx) => (
                      <div key={idx} className="font-mono text-[#8a948c] flex items-center gap-1.5">
                        <span className="text-[#d9aa3d]">•</span>
                        <strong className="text-[#f1ebdd]">{sr.source_document_id}</strong>
                        <span>({sr.row_reference}):</span>
                        <span className="truncate">{sr.details}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[10px] text-[#8a948c] font-mono truncate">
                  <span>Cases: {(p.cases || []).join(", ") || "Multi-case"}</span>
                </div>
                <button
                  onClick={() => onLead(p)}
                  className="flex items-center gap-1 rounded-lg border border-[rgba(217,170,61,0.35)] bg-[rgba(217,170,61,0.12)] px-2.5 py-1 text-xs font-bold text-[#d9aa3d] hover:bg-[rgba(217,170,61,0.22)] hover:text-[#f1ebdd] transition cursor-pointer shrink-0"
                >
                  <Zap size={11} /> Create Lead
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadsView({ leads, draft, setDraft, onSend }) {
  return (
    <div className="space-y-4">
      {draft && (
        <div className="rounded-xl border border-[#d9aa3d]/40 bg-[#101311] p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <h4 className="font-bold text-sm text-[#d9aa3d] flex items-center gap-2">
              <Send size={15} /> Dispatch Intelligence Lead to Investigator Queue
            </h4>
            <span className="text-[10px] font-mono text-[#8a948c] bg-white/5 px-2 py-0.5 rounded">
              Priority: {draft.priority || "HIGH"}
            </span>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#8a948c] uppercase block mb-1">Lead Title</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-[#f1ebdd] focus:border-[#d9aa3d] focus:outline-none"
              value={draft.title || ""}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Descriptive lead title"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#8a948c] uppercase block mb-1">Investigative Justification & Reason</label>
            <textarea
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-[#f1ebdd] focus:border-[#d9aa3d] focus:outline-none"
              rows={3}
              value={draft.reason || ""}
              onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
              placeholder="Actionable reason, factual evidence summary, and recommended next steps"
            />
          </div>

          {draft.supporting_records && draft.supporting_records.length > 0 && (
            <div className="text-[11px] text-[#8a948c] bg-black/30 p-2.5 rounded-lg border border-white/5">
              <span className="text-[#d9aa3d] font-bold block mb-1">Attached Supporting Citations:</span>
              {draft.supporting_records.map((sr, idx) => (
                <div key={idx} className="font-mono">• {sr.source_document_id} ({sr.row_reference}): {sr.details}</div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onSend(draft)}
              className="flex items-center gap-1.5 rounded-lg bg-[#d9aa3d] px-4 py-2 text-xs font-bold text-[#101311] hover:brightness-110 shadow-sm transition cursor-pointer"
            >
              <Send size={12} /> Submit to Investigator Queue
            </button>
            <button
              onClick={() => setDraft(null)}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#8a948c] hover:text-[#f1ebdd] transition cursor-pointer"
            >
              Discard Draft
            </button>
          </div>
        </div>
      )}

      {/* Dispatched Leads Roster */}
      <div className="space-y-3">
        {leads.length === 0 ? (
          <Empty>No intelligence leads dispatched to investigator queue yet.</Empty>
        ) : (
          leads.map((l) => {
            const isVerified = l.status === "VERIFIED" || l.status === "APPROVED";
            const isRejected = l.status === "REJECTED";
            const evStrength = l.evidentiary_strength;

            return (
              <div
                key={l.id || l.lead_id}
                className={clsx(
                  "rounded-xl border p-4 text-xs space-y-2.5 transition",
                  isVerified
                    ? "border-[rgba(94,159,104,0.35)] bg-[#0d1410]"
                    : isRejected
                    ? "border-[rgba(108,122,115,0.35)] bg-[#121413]"
                    : "border-[var(--line)] bg-[#101311]"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#d9aa3d] text-xs">
                      {l.lead_id || l.id}
                    </span>
                    <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-[#8a948c]">
                      {l.pattern_type || l.match_type || "Intelligence Lead"}
                    </span>
                    {evStrength && (
                      <span className="rounded bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                        Strength: {Math.round(evStrength.score * 100)}% ({evStrength.label})
                      </span>
                    )}
                  </div>
                  <span
                    className={clsx(
                      "rounded px-2 py-0.5 text-[10px] font-bold font-mono border",
                      isVerified
                        ? "bg-[rgba(94,159,104,0.18)] text-[#72bf7e] border-[rgba(94,159,104,0.35)]"
                        : isRejected
                        ? "bg-white/5 text-[#8a948c] border-white/10"
                        : "bg-[rgba(217,170,61,0.18)] text-[#d9aa3d] border-[rgba(217,170,61,0.35)]"
                    )}
                  >
                    {l.status}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-[#f1ebdd]">{l.title}</h4>
                <p className="text-xs text-[#c5cfc8] leading-relaxed">{l.reason || l.description}</p>

                {/* Supporting Records List */}
                {l.supporting_records && l.supporting_records.length > 0 && (
                  <div className="font-mono text-[11px] text-[#8a948c] bg-black/30 p-2 rounded border border-white/5 space-y-0.5">
                    {l.supporting_records.map((sr, idx) => (
                      <div key={idx}>• {sr.source_document_id} ({sr.row_reference}): {sr.details}</div>
                    ))}
                  </div>
                )}

                {/* Investigator Verification Audit Footer */}
                {l.reviewed_by && (
                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-[#8a948c]">
                    <span>Reviewed by Officer: <strong className="text-[#f1ebdd]">Badge #{l.reviewed_by}</strong> ({l.reviewed_at ? new Date(l.reviewed_at).toLocaleString() : "Confirmed"})</span>
                    {l.remarks && <span className="italic text-[#d9aa3d]">"{l.remarks}"</span>}
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

function AskView({ question, setQuestion, answer, onAsk }) {
  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-parchment"
        />
        <button onClick={onAsk} className="rounded-xl bg-gold px-4 py-2 text-xs font-bold text-ink cursor-pointer">
          Ask
        </button>
      </div>
      {answer && (
        <div className="rounded-xl border border-[var(--line)] bg-panel p-4 space-y-2 text-xs">
          <p className="text-gold font-bold">{answer.label}</p>
          <p className="text-parchment">{answer.answer}</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, trend }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-black/60 p-4 shadow-md transition hover:border-gold/40">
      <p className="text-[10px] tracking-widest text-muted uppercase font-bold">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-2xl font-black font-mono text-parchment">{value ?? "—"}</p>
        {sub && <span className="text-[11px] text-muted">{sub}</span>}
      </div>
      {trend && (
        <div className="mt-2 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
          <TrendingUp size={11} /> {trend}
        </div>
      )}
    </div>
  );
}

function Panel({ title, children, action }) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-panel p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-gold uppercase">
          <BarChart3 size={15} /> {title}
        </h4>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-black/20 px-6 py-12 text-xs text-muted">
      <AlertTriangle size={16} className="text-gold" />
      <span>{children}</span>
    </div>
  );
}
