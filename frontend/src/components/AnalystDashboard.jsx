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
  Users
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
    title: "Network Analytics",
    items: [
      { id: "network", label: "Network Overview", icon: Network },
      { id: "communities", label: "Communities & Clusters", icon: Users },
      { id: "centrality", label: "Centrality & Key Entities", icon: Target }
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
  useEffect(() => {
    refreshHealth();
    loadOverview();
  }, [refreshHealth, loadOverview]);
  useEffect(() => {
    if (view === "heatmap" || view === "overview") loadHeatmap();
  }, [view, loadHeatmap]);
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
  const dataModeLabel = overview?.label || heatmap?.label || (health?.services?.data_mode?.details === "LIVE" ? "LIVE" : "DEMO / FALLBACK DATA");
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
  const openLeadFromPattern = (p) => {
    setLeadDraft({
      title: p.title || p.type,
      description: p.what,
      priority: p.trend === "increasing" || p.type === "Cross-Case Entity" ? "HIGH" : "MEDIUM",
      related_cases: p.cases || [],
      entities: (p.entities || []).map((n) => ({ name: n })),
      locations: p.where ? [p.where] : [],
      evidence: p.evidence || [],
      reason: p.why,
      confidence: p.confidence,
      confidence_reason: p.confidence_reason,
      pattern_type: p.type,
      created_by: "ANALYST"
    });
    setView("leads");
  };
  const logout = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      localStorage.removeItem("sih_user");
      localStorage.removeItem("sih_token");
      window.history.pushState({}, "", "/login");
      window.location.reload();
    }
  };
  return <div className="flex min-h-screen bg-ink text-parchment"><aside className="flex w-64 shrink-0 flex-col border-r border-[var(--line)] bg-panel"><div className="border-b border-[var(--line)] px-4 py-4"><p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] text-gold uppercase">
            House Targaryen
          </p><h1 className="mt-1 font-[family-name:var(--font-display)] text-xl leading-tight">
            Analyst Intelligence
          </h1></div><nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">{NAV.map((group) => <div key={group.title} className="mb-4"><p className="px-2 pb-1 text-[10px] font-bold tracking-[0.14em] text-muted uppercase">{group.title}</p>{group.items.map((item) => {
    const Icon = item.icon;
    const active = view === item.id;
    return <button
      key={item.id}
      onClick={() => setView(item.id)}
      className={clsx(
        "mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm",
        active ? "bg-gold/15 text-parchment" : "text-muted hover:bg-white/5 hover:text-parchment"
      )}
    ><Icon size={15} className={active ? "text-gold" : ""} />{item.label}</button>;
  })}</div>)}</nav><button onClick={logout} className="flex items-center gap-2 border-t border-[var(--line)] px-4 py-3 text-sm text-muted hover:text-parchment"><LogOut size={14} /> Sign out
        </button></aside><div className="flex min-w-0 flex-1 flex-col"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-panel/80 px-5 py-3"><div><h2 className="font-[family-name:var(--font-display)] text-lg">What is happening?</h2><p className="text-xs text-muted">Strategic crime intelligence across the dataset</p></div><div className="flex flex-wrap items-center gap-3 text-[11px] font-[family-name:var(--font-mono)]"><StatusPill label="API" up={health?.services?.api?.status === "UP"} /><StatusPill label="PostgreSQL" up={health?.services?.postgresql?.status === "UP"} /><StatusPill label="Memgraph" up={health?.services?.memgraph?.status === "UP"} /><span
    className={clsx(
      "rounded border px-2 py-1 font-bold",
      String(dataModeLabel).includes("LIVE") && !String(dataModeLabel).includes("FALLBACK") ? "border-ok/50 text-ok" : "border-gold/50 text-gold"
    )}
  >
              DATA: {dataModeLabel}</span></div></header><div className="flex flex-wrap gap-2 border-b border-[var(--line)] bg-panel-elevated/50 px-5 py-2.5"><FilterSelect
    label="Crime Type"
    value={filters.crime_type}
    options={["All", ...overview?.crime_types || []]}
    onChange={(v) => setFilters((f) => ({ ...f, crime_type: v }))}
  /><FilterSelect
    label="Geography"
    value={filters.geography}
    options={["All", ...overview?.geographies || []]}
    onChange={(v) => setFilters((f) => ({ ...f, geography: v }))}
  /><FilterSelect
    label="Status"
    value={filters.status}
    options={["All", "Active", "Closed"]}
    onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
  /><label className="flex items-center gap-1 text-[11px] text-muted">
            Start
            <input
    type="date"
    value={filters.start}
    onChange={(e) => setFilters((f) => ({ ...f, start: e.target.value }))}
    className="rounded border border-white/10 bg-black/30 px-2 py-1 text-parchment"
  /></label><label className="flex items-center gap-1 text-[11px] text-muted">
            End
            <input
    type="date"
    value={filters.end}
    onChange={(e) => setFilters((f) => ({ ...f, end: e.target.value }))}
    className="rounded border border-white/10 bg-black/30 px-2 py-1 text-parchment"
  /></label></div><main className="flex-1 overflow-y-auto p-5 scrollbar-thin">{toast && <div className="mb-3 rounded border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">{toast}<button className="ml-3 underline" onClick={() => setToast("")}>
                dismiss
              </button></div>}{view === "overview" && <OverviewView
    overview={overview}
    loading={loading}
    onOpenHeatmap={() => setView("heatmap")}
    onSelectRegion={(id) => {
      setSelectedRegion(id);
      setView("heatmap");
    }}
    onOpenPatterns={() => setView("patterns")}
  />}{view === "heatmap" && <HeatmapView
    heatmap={heatmap}
    mode={heatMode}
    setMode={setHeatMode}
    geographicMode={geographicMode}
    setGeographicMode={(next) => {
      setSelectedRegion(null);
      setGeographicMode(next);
    }}
    selectedRegion={selectedRegion}
    setSelectedRegion={setSelectedRegion}
    detail={regionDetail}
    onCreateLead={(payload) => {
      setLeadDraft(payload);
      setView("leads");
    }}
  />}{view === "trends" && <TrendsView trends={trends} />}{view === "crosscase" && <CrossCaseView
    cross={cross}
    onLead={(cl) => openLeadFromPattern({
      title: `Cross-case: ${cl.shared_entity?.name}`,
      type: "Cross-Case Entity",
      what: `${cl.shared_entity?.name} links cases ${cl.related_cases?.join(", ")}`,
      cases: cl.related_cases,
      entities: [cl.shared_entity?.name],
      why: `Shared ${cl.shared_entity?.type} across multiple cases`,
      evidence: [cl.evidence],
      confidence: cl.connection_strength === "HIGH" ? 0.85 : 0.7,
      confidence_reason: "Deterministic multi-case membership",
      trend: "recurring",
      where: "Cross-jurisdiction"
    })}
  />}{view === "network" && <NetworkView network={network} />}{view === "communities" && <CommunitiesView communities={communities} />}{view === "centrality" && <CentralityView
    centrality={centrality}
    onLead={(e) => openLeadFromPattern({
      title: `Key entity: ${e.name}`,
      type: e.classification,
      what: e.explanation,
      cases: e.cases,
      entities: [e.name],
      why: e.explanation,
      evidence: ["Graph degree", "Cross-case membership"],
      confidence: 0.8,
      confidence_reason: e.betweenness_note,
      where: "Network"
    })}
  />}{view === "patterns" && <PatternsView patterns={patterns} onLead={openLeadFromPattern} />}{view === "leads" && <LeadsView
    leads={leads}
    draft={leadDraft}
    setDraft={setLeadDraft}
    onSend={sendLead}
  />}{view === "ask" && <AskView
    question={askQ}
    setQuestion={setAskQ}
    answer={askA}
    onAsk={async () => {
      const data = await apiPost("/api/v1/analyst/ask", { question: askQ });
      setAskA(data);
    }}
  />}</main></div></div>;
}
function StatusPill({ label, up }) {
  return <span className={clsx("rounded border px-2 py-1", up ? "border-ok/40 text-ok" : "border-signal/40 text-signal")}>{label}: {up ? "HEALTHY" : "OFFLINE"}</span>;
}
function FilterSelect({
  label,
  value,
  options,
  onChange
}) {
  return <label className="flex items-center gap-1 text-[11px] text-muted">{label}<select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="rounded border border-white/10 bg-black/30 px-2 py-1 text-parchment"
  >{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>;
}
function Stat({ label, value }) {
  return <div className="rounded-xl border border-[var(--line)] bg-panel px-4 py-3"><p className="text-[10px] tracking-wide text-muted uppercase">{label}</p><p className="mt-1 font-[family-name:var(--font-display)] text-2xl">{value ?? "\u2014"}</p></div>;
}
function OverviewView({ overview, loading, onOpenHeatmap, onSelectRegion, onOpenPatterns }) {
  const s = overview?.summary || {};
  return <div className="space-y-5"><div className="flex items-end justify-between gap-3"><div><h3 className="font-[family-name:var(--font-display)] text-2xl">Crime Intelligence Overview</h3><p className="text-sm text-muted">{overview?.label || "Loading\u2026"}{loading ? " \xB7 refreshing" : ""}</p></div><button onClick={onOpenHeatmap} className="rounded-lg border border-gold/40 px-3 py-1.5 text-sm text-gold">
          Open Heatmap
        </button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"><Stat label="Total Cases" value={s.total_cases} /><Stat label="Active Crime Zones" value={s.active_crime_zones} /><Stat label="Increasing Zones" value={s.increasing_zones} /><Stat label="Repeated Crime Zones" value={s.repeated_crime_zones} /><Stat label="Cross-Case Connections" value={s.cross_case_connections} /><Stat label="Important Network Entities" value={s.important_network_entities} /></div><div className="grid gap-4 lg:grid-cols-2"><Panel title="Geographic Intelligence">{(overview?.geographic_intelligence || []).length === 0 ? <Empty>Insufficient geographic data</Empty> : <ul className="space-y-2">{(overview?.geographic_intelligence || []).map((g) => <li key={g.name}><button
    className="flex w-full items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-left hover:border-gold/30"
    onClick={() => onSelectRegion(g.name.toLowerCase().replace(/\s+/g, "_"))}
  ><span>{g.name}</span><span className="text-xs text-muted">{g.cases} cases · {g.trend} · {g.band}</span></button></li>)}</ul>}</Panel><Panel title="Crime Trend Snapshot">{(overview?.crime_trend_snapshot || []).map((t) => <div key={t.crime_type} className="mb-2 flex justify-between border-b border-white/5 py-2 text-sm"><span>{t.crime_type}</span><span className="text-muted">{t.direction === "increasing" ? "\u2197" : t.direction === "decreasing" ? "\u2198" : "\u2192"}{" "}{t.change_pct == null ? "n/a" : `${t.change_pct}%`} · {t.total} cases
              </span></div>)}</Panel><Panel title="Key Patterns">{(overview?.key_patterns || []).slice(0, 4).map((p) => <div key={p.pattern_id} className="mb-2 rounded border border-white/5 px-3 py-2 text-sm"><div className="font-semibold">{p.title}</div><div className="text-xs text-muted">{p.why}</div></div>)}<button onClick={onOpenPatterns} className="mt-2 text-sm text-gold">
            Open Pattern Discovery →
          </button></Panel><Panel title="Cross-Case Signals">{(overview?.cross_case_signals || []).map((c) => <div key={c.cluster_id} className="mb-2 text-sm"><span className="text-gold">{c.shared_entity?.name}</span><span className="text-muted"> → cases {c.related_cases?.join(", ")}</span></div>)}</Panel></div></div>;
}
function HeatmapView({ heatmap, mode, setMode, geographicMode, setGeographicMode, selectedRegion, setSelectedRegion, detail, onCreateLead }) {
  const regions = heatmap?.regions || [];
  const visible = regions.filter((r) => r.visible);
  return <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]"><div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-[family-name:var(--font-display)] text-xl">{heatmap?.mode_meta?.title || "Crime Heatmap"}</h3><div className="flex flex-wrap gap-1">{[
    ["density", "Crime Density"],
    ["increasing", "Increasing Zones"],
    ["decreasing", "Decreasing Zones"],
    ["repeated", "Repeated Crime Zones"]
  ].map(([id, label]) => <button
    key={id}
    onClick={() => setMode(id)}
    className={clsx(
      "rounded-md border px-2.5 py-1 text-xs",
      mode === id ? "border-gold bg-gold/15 text-gold" : "border-white/10 text-muted"
    )}
  >{label}</button>)}</div></div><p className="text-xs text-muted">{heatmap?.mode_meta?.explanation}</p><p className="text-[11px] text-gold">{heatmap?.label}</p><div className="rounded-xl border border-[var(--line)] bg-panel p-3"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex rounded-md border border-white/10 p-0.5 text-xs"><button
    onClick={() => setGeographicMode("heatmap")}
    className={clsx("rounded px-2.5 py-1", geographicMode === "heatmap" ? "bg-gold/20 text-gold" : "text-muted")}
  >
                Heatmap
              </button><button
    onClick={() => setGeographicMode("region_density")}
    className={clsx("rounded px-2.5 py-1", geographicMode === "region_density" ? "bg-gold/20 text-gold" : "text-muted")}
  >
                Region Density
              </button></div><p className="text-[11px] text-muted">{heatmap?.spatial_precision?.recorded_coordinate_points || 0} recorded coordinate locations · {heatmap?.spatial_precision?.unlocated_cases || 0} region-only cases
            </p></div><CrimeMap
    heatmap={heatmap}
    geographicMode={geographicMode}
    selectedRegion={selectedRegion}
    onSelectRegion={setSelectedRegion}
  /><div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted">{(heatmap?.mode_meta?.legend || []).map((l) => <span key={l}>{l.replace("_", " ")}</span>)}</div>{heatmap?.period && <p className="mt-2 text-[11px] text-muted">
              Comparison: prev {heatmap.period.previous || "n/a"} ({heatmap.period.previous_case_count}) → current{" "}{heatmap.period.current || "n/a"} ({heatmap.period.current_case_count})
            </p>}</div></div><div className="rounded-xl border border-[var(--line)] bg-panel p-4">{!detail?.found ? <div><div className="mb-2 flex items-center gap-2 text-gold"><MapIcon size={16} /><h4 className="font-[family-name:var(--font-display)] text-lg">Geographic Intelligence</h4></div><p className="text-sm text-muted">Select a region to investigate:</p><ul className="mt-3 space-y-1 text-sm text-muted"><li>• Crime volume</li><li>• Crime trend</li><li>• Repeated locations</li><li>• Top crime types</li><li>• Cross-case links</li><li>• Important entities</li></ul><div className="mt-4 grid grid-cols-2 gap-2"><Stat label="Visible regions" value={visible.length} /><Stat label="Cases in filter" value={heatmap?.totals?.cases} /></div></div> : <RegionPanel detail={detail} onCreateLead={onCreateLead} />}</div></div>;
}
function RegionPanel({ detail, onCreateLead }) {
  const r = detail.region;
  const act = detail.crime_activity || {};
  return <div className="space-y-3"><h4 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide">{r.name}</h4><p className="text-[11px] text-gold">{detail.label}</p><div className="grid grid-cols-2 gap-2"><Stat label="Cases" value={act.cases} /><Stat
    label="Trend"
    value={act.change_pct == null ? act.trend : `${act.trend === "increasing" ? "\u2191" : act.trend === "decreasing" ? "\u2193" : "\u2192"} ${act.change_pct}%`}
  /></div><Section title="Top Crime Types">{(detail.top_crime_types || []).map((t) => <div key={t.type} className="flex justify-between text-sm"><span>{t.type}</span><span className="text-muted">{t.count}</span></div>)}</Section><Section title="Repeated Zones">{(detail.repeated_zones || []).length ? detail.repeated_zones.map((z) => <div key={z.name} className="text-sm">{z.name} · {z.cases} incident link(s)
            </div>) : <Empty>Insufficient data</Empty>}</Section><Section title="Cross-Case Connections"><p className="text-sm">{detail.cross_case_connections}</p></Section><Section title="Important Entities">{(detail.important_entities || []).map((e) => <div key={e.id} className="text-sm">{e.name} {e.cross_case ? <span className="text-gold">(cross-case)</span> : null}</div>)}</Section><div className="flex flex-wrap gap-2 pt-2"><button
    className="rounded-lg bg-signal px-3 py-2 text-xs font-bold text-white"
    onClick={() => onCreateLead({
      title: `Regional intelligence: ${r.name}`,
      description: `${act.cases} cases; trend ${act.trend}`,
      priority: act.trend === "increasing" ? "HIGH" : "MEDIUM",
      related_cases: r.cases || [],
      entities: (detail.important_entities || []).map((e) => ({ id: e.id, name: e.name })),
      locations: [r.name, ...(detail.repeated_zones || []).map((z) => z.name)],
      evidence: ["Location registry", "Case metadata"],
      reason: `Region selected from density heatmap with ${act.cases} linked cases.`,
      confidence: r.density?.intensity ?? 0.7,
      confidence_reason: "Normalized from region case density in filtered set.",
      pattern_type: "Geographic Concentration",
      created_by: "ANALYST"
    })}
  >
          Create Intelligence Lead
        </button></div></div>;
}
function TrendsView({ trends }) {
  if (!trends) return <Empty>Loading trends…</Empty>;
  return <div className="space-y-4"><h3 className="font-[family-name:var(--font-display)] text-2xl">Crime Trends</h3><p className="text-xs text-gold">{trends.label}</p><div className="grid gap-3 md:grid-cols-3">{(trends.by_type || []).map((t) => <div key={t.crime_type} className="rounded-xl border border-[var(--line)] bg-panel p-4"><div className="flex items-center justify-between"><h4 className="font-semibold">{t.crime_type}</h4><span className="text-xl">{t.direction === "increasing" ? "\u2197" : t.direction === "decreasing" ? "\u2198" : "\u2192"}</span></div><p className="mt-2 text-sm text-muted">{t.previous} → {t.current}{t.change_pct == null ? " (insufficient baseline)" : ` (${t.change_pct}%)`}</p><div className="mt-3 flex h-16 items-end gap-1">{(t.monthly || []).map((m) => <div key={m.month} className="flex-1 rounded-t bg-gold/70" style={{ height: `${Math.max(8, m.count * 28)}px` }} title={`${m.month}: ${m.count}`} />)}</div></div>)}</div><Panel title="Top Affected Regions">{(trends.top_regions || []).map((r) => <div key={r.name} className="flex justify-between border-b border-white/5 py-2 text-sm"><span>{r.name}</span><span className="text-muted">{r.cases} · {r.trend}</span></div>)}</Panel></div>;
}
function CrossCaseView({ cross, onLead }) {
  if (!cross) return <Empty>Loading cross-case intelligence…</Empty>;
  return <div className="space-y-4"><h3 className="font-[family-name:var(--font-display)] text-2xl">Cross-Case Intelligence</h3><p className="text-sm text-muted">Which cases are connected through shared entities?</p><p className="text-xs text-gold">{cross.label} · {cross.total_links} clusters</p><div className="grid gap-3 lg:grid-cols-2">{(cross.clusters || []).slice(0, 20).map((cl) => <div key={cl.cluster_id} className="rounded-xl border border-[var(--line)] bg-panel p-4"><div className="flex items-center justify-between gap-2"><h4 className="font-semibold">{cl.shared_entity?.name}</h4><span className="text-[10px] font-bold text-signal">{cl.connection_strength}</span></div><p className="text-xs text-muted">{cl.shared_entity?.type}</p><p className="mt-2 text-sm">Cases: {cl.related_cases?.join(", ")}</p><div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted"><div>People: {cl.shared?.people?.length || 0}</div><div>Phones: {cl.shared?.phones?.length || 0}</div><div>Vehicles: {cl.shared?.vehicles?.length || 0}</div><div>Orgs: {cl.shared?.organizations?.length || 0}</div></div><button onClick={() => onLead(cl)} className="mt-3 text-xs font-bold text-gold">
              Create Intelligence Lead
            </button></div>)}</div></div>;
}
function NetworkView({ network }) {
  if (!network) return <Empty>Loading network overview…</Empty>;
  const s = network.stats || {};
  const preview = network.preview || { nodes: [], edges: [] };
  return <div className="space-y-4"><h3 className="font-[family-name:var(--font-display)] text-2xl">Network Overview</h3><p className="text-xs text-muted">{network.note}</p><p className="text-xs text-gold">{network.label}</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Stat label="Nodes" value={s.nodes} /><Stat label="Edges" value={s.edges} /><Stat label="Density" value={s.density} /><Stat label="Bridge Entities" value={s.bridge_entities} /><Stat label="Cross-Case Entities" value={s.cross_case_entities} /></div><div className="grid gap-4 lg:grid-cols-2"><Panel title="Highly Connected">{(network.highly_connected || []).map((e) => <div key={e.id} className="flex justify-between py-1.5 text-sm"><span>{e.name}</span><span className="text-muted">deg {e.degree}</span></div>)}</Panel><Panel title="Bridge Entities">{(network.bridge_entities || []).map((e) => <div key={e.id} className="py-1.5 text-sm">{e.name} <span className="text-muted">· cases {(e.cases || []).join(", ")}</span></div>)}</Panel></div><Panel title="Aggregated Preview (top nodes)"><svg viewBox="0 0 640 280" className="h-64 w-full">{preview.edges?.map((e, i) => {
    const a = preview.nodes.findIndex((n) => n.id === e.source);
    const b = preview.nodes.findIndex((n) => n.id === e.target);
    if (a < 0 || b < 0) return null;
    const ax = 40 + a % 8 * 75;
    const ay = 40 + Math.floor(a / 8) * 90;
    const bx = 40 + b % 8 * 75;
    const by = 40 + Math.floor(b / 8) * 90;
    return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke="rgba(217,170,61,0.35)" strokeWidth="1" />;
  })}{preview.nodes?.map((n, i) => {
    const x = 40 + i % 8 * 75;
    const y = 40 + Math.floor(i / 8) * 90;
    return <g key={n.id}><circle cx={x} cy={y} r={10 + Math.min(8, n.degree || 0)} fill="#D62828" fillOpacity={0.7} /><text x={x} y={y + 22} textAnchor="middle" fill="#A6B0AA" fontSize="8">{(n.label || "").slice(0, 10)}</text></g>;
  })}</svg></Panel></div>;
}
function CommunitiesView({ communities }) {
  if (!communities) return <Empty>Loading communities…</Empty>;
  return <div className="space-y-4"><h3 className="font-[family-name:var(--font-display)] text-2xl">Communities & Clusters</h3><p className="text-sm text-muted">Network communities from graph connected components — not labeled as gangs.</p><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(communities.communities || []).map((c) => <div key={c.community_id} className="rounded-xl border border-[var(--line)] bg-panel p-4"><p className="text-[10px] tracking-wide text-gold uppercase">{c.label}</p><h4 className="font-[family-name:var(--font-display)] text-xl">{c.community_id}</h4><div className="mt-2 space-y-1 text-sm text-muted"><div>Entities: {c.entities}</div><div>Cases: {c.case_count} ({c.cases?.join(", ")})</div><div>Locations: {c.location_count}</div><div>Key entity: {c.key_entity?.name}</div><div>Cross-case links: {c.cross_case_links}</div></div></div>)}</div></div>;
}
function CentralityView({ centrality, onLead }) {
  if (!centrality) return <Empty>Loading key entities…</Empty>;
  return <div className="space-y-4"><h3 className="font-[family-name:var(--font-display)] text-2xl">Centrality & Key Entities</h3><p className="text-sm text-muted">
        Centrality is network importance — not proof of criminal activity.
      </p><div className="space-y-3">{(centrality.entities || []).map((e) => <div key={e.entity_id} className="rounded-xl border border-[var(--line)] bg-panel p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="font-[family-name:var(--font-display)] text-xl">{e.name}</h4><p className="text-xs font-bold text-gold">{e.classification}</p></div><button onClick={() => onLead(e)} className="text-xs font-bold text-gold">
                Create Intelligence Lead
              </button></div><div className="mt-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-4"><div>Cases: {e.case_count}</div><div>Degree: {e.degree}</div><div>Betweenness: {e.betweenness}</div><div>Cross-case: {e.cross_case}</div></div><p className="mt-2 text-sm text-muted">{e.explanation}</p><p className="mt-1 text-[11px] text-muted">{e.betweenness_note}</p><p className="mt-1 text-[11px] text-signal">{e.disclaimer}</p></div>)}</div></div>;
}
function PatternsView({ patterns, onLead }) {
  if (!patterns) return <Empty>Loading patterns…</Empty>;
  return <div className="space-y-4"><h3 className="font-[family-name:var(--font-display)] text-2xl">Pattern Discovery</h3><p className="text-xs text-gold">{patterns.label} · {patterns.total} patterns</p><div className="grid gap-3 lg:grid-cols-2">{(patterns.patterns || []).map((p) => <div key={p.pattern_id} className="rounded-xl border border-[var(--line)] bg-panel p-4"><p className="text-[10px] tracking-wide text-gold uppercase">{p.type}</p><h4 className="font-semibold">{p.title}</h4><div className="mt-2 space-y-1 text-sm text-muted"><div><strong className="text-parchment">What:</strong> {p.what}</div><div><strong className="text-parchment">Where:</strong> {p.where}</div><div><strong className="text-parchment">When:</strong> {p.when}</div><div><strong className="text-parchment">Cases:</strong> {p.case_count} {p.cases?.length ? `(${p.cases.join(", ")})` : ""}</div><div><strong className="text-parchment">Why:</strong> {p.why}</div><div><strong className="text-parchment">Evidence:</strong> {(p.evidence || []).join(", ")}</div><div><strong className="text-parchment">Confidence:</strong> {p.confidence} — {p.confidence_reason}</div></div><button onClick={() => onLead(p)} className="mt-3 text-xs font-bold text-gold">
              Create Intelligence Lead
            </button></div>)}</div></div>;
}
function LeadsView({ leads, draft, setDraft, onSend }) {
  return <div className="space-y-4"><h3 className="font-[family-name:var(--font-display)] text-2xl">Intelligence Leads</h3><p className="text-sm text-muted">
        Convert patterns into leads and send them to the existing Investigator verification queue.
      </p>{draft && <div className="rounded-xl border border-gold/40 bg-panel p-4"><h4 className="font-semibold text-gold">Draft Lead</h4><label className="mt-2 block text-xs text-muted">Title</label><input
    className="mt-1 w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
    value={draft.title || ""}
    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
  /><label className="mt-2 block text-xs text-muted">Reason</label><textarea
    className="mt-1 w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
    rows={3}
    value={draft.reason || ""}
    onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
  /><p className="mt-2 text-xs text-muted">Cases: {(draft.related_cases || []).join(", ") || "\u2014"}</p><p className="text-xs text-muted">
            Confidence: {draft.confidence ?? "\u2014"} {draft.confidence_reason ? `\xB7 ${draft.confidence_reason}` : ""}</p><div className="mt-3 flex gap-2"><button onClick={() => onSend(draft)} className="rounded-lg bg-signal px-3 py-2 text-xs font-bold text-white">
              Send to Investigator
            </button><button onClick={() => setDraft(null)} className="rounded-lg border border-white/10 px-3 py-2 text-xs">
              Discard
            </button></div></div>}<div className="space-y-2">{leads.length === 0 ? <Empty>No intelligence leads sent yet.</Empty> : leads.map((l) => <div key={l.id} className="rounded-xl border border-[var(--line)] bg-panel p-4 text-sm"><div className="flex justify-between gap-2"><strong>{l.lead_id || l.id}</strong><span className="text-xs text-gold">{l.status} · {l.priority}</span></div><div className="mt-1">{l.title}</div><div className="text-xs text-muted">{l.reason}</div><div className="mt-1 text-xs text-muted">Cases: {(l.related_cases || []).join(", ")}</div></div>)}</div></div>;
}
function AskView({ question, setQuestion, answer, onAsk }) {
  return <div className="mx-auto max-w-3xl space-y-4"><h3 className="font-[family-name:var(--font-display)] text-2xl">Analyst Assistant</h3><p className="text-sm text-muted">Answers are computed from backend analytics — no invented statistics.</p><div className="flex gap-2"><input
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm"
  /><button onClick={onAsk} className="rounded-xl bg-gold px-4 py-3 text-sm font-bold text-ink">
          Ask
        </button></div>{answer && <div className="rounded-xl border border-[var(--line)] bg-panel p-4"><p className="text-xs text-gold">{answer.label}</p><p className="mt-2 text-sm">{answer.answer}</p>{(answer.findings || []).map((f, i) => <div key={i} className="mt-4 border-t border-white/5 pt-3 text-sm"><div className="font-semibold">{f.finding}</div><div className="text-muted">Reason: {f.reason}</div><div className="text-muted">Confidence: {f.confidence}</div><div className="text-muted">Sources: {(f.data_sources || []).join(", ")}</div><pre className="mt-2 max-h-48 overflow-auto rounded bg-black/40 p-2 text-[11px] text-muted scrollbar-thin">{JSON.stringify(f.evidence, null, 2)}</pre></div>)}</div>}</div>;
}
function Panel({ title, children }) {
  return <section className="rounded-xl border border-[var(--line)] bg-panel p-4"><h4 className="mb-3 flex items-center gap-2 font-[family-name:var(--font-display)] text-lg"><BarChart3 size={16} className="text-gold" />{title}</h4>{children}</section>;
}
function Section({ title, children }) {
  return <div><p className="mb-1 text-[10px] font-bold tracking-wide text-muted uppercase">{title}</p>{children}</div>;
}
function Empty({ children }) {
  return <div className="flex items-center gap-2 rounded-lg border border-dashed border-white/10 px-3 py-6 text-sm text-muted"><AlertTriangle size={14} /> {children}</div>;
}
