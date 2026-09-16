"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  FileUp,
  Fingerprint,
  Gauge,
  GitBranch,
  LogOut,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import clsx from "clsx";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

type View = "overview" | "users" | "access" | "data" | "graph" | "nlp" | "health" | "audit";

const NAV: Array<{ id: View; label: string; icon: typeof Gauge; group: string }> = [
  { id: "overview", label: "Operations Overview", icon: Gauge, group: "Control Room" },
  { id: "users", label: "User Management", icon: Users, group: "Access" },
  { id: "access", label: "Roles & Access", icon: ShieldCheck, group: "Access" },
  { id: "data", label: "Data & Ingestion", icon: FileUp, group: "Data Operations" },
  { id: "graph", label: "Memgraph Cloud", icon: GitBranch, group: "Intelligence Services" },
  { id: "nlp", label: "AI / NLP Pipeline", icon: Workflow, group: "Intelligence Services" },
  { id: "health", label: "System Health", icon: Activity, group: "System" },
  { id: "audit", label: "Audit Log", icon: Fingerprint, group: "System" },
];

const ROLES = ["ADMIN", "INVESTIGATOR", "ANALYST", "VIEWER"];

export default function AdminConsole() {
  const router = useRouter();
  const [view, setView] = useState<View>("overview");
  const [overview, setOverview] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [imports, setImports] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [roles, setRoles] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [uploading, setUploading] = useState(false);

  const loadCore = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [adminOverview, serviceHealth] = await Promise.all([
        apiGet<any>("/api/v1/admin/overview"),
        fetch("/api/v1/health", { cache: "no-store" }).then(async (response) => {
          if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
          return response.json();
        }),
      ]);
      setOverview(adminOverview);
      setHealth(serviceHealth);
    } catch (err: any) {
      setError(err.message === "Request failed: 403" ? "Administrator access is required." : "Admin services are unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const payload = await apiGet<any>("/api/v1/admin/users", { query: search || undefined, role: roleFilter === "ALL" ? undefined : roleFilter });
      setUsers(payload.items || []);
    } catch (err: any) { setError(err.message); }
  }, [search, roleFilter]);

  const loadImports = useCallback(async () => {
    try { setImports((await apiGet<any>("/api/v1/admin/imports")).items || []); } catch (err: any) { setError(err.message); }
  }, []);
  const loadAudit = useCallback(async () => {
    try { setAudit((await apiGet<any>("/api/v1/admin/audit")).items || []); } catch (err: any) { setError(err.message); }
  }, []);
  const loadRoles = useCallback(async () => {
    try { setRoles(await apiGet<any>("/api/v1/admin/roles")); } catch (err: any) { setError(err.message); }
  }, []);

  useEffect(() => {
    const rawUser = localStorage.getItem("sih_user");
    if (!rawUser) { router.replace("/login"); return; }
    try {
      if (JSON.parse(rawUser).role !== "ADMIN") { setError("Administrator access is required."); return; }
    } catch { router.replace("/login"); return; }
    loadCore();
  }, [loadCore, router]);

  useEffect(() => {
    if (view === "users") loadUsers();
    if (view === "data") loadImports();
    if (view === "audit") loadAudit();
    if (view === "access") loadRoles();
  }, [view, loadUsers, loadImports, loadAudit, loadRoles]);

  const updateUser = async (id: number, change: any) => {
    try {
      await apiPatch(`/api/v1/admin/users/${id}`, change);
      setNotice("User access updated.");
      loadUsers();
      loadCore();
    } catch (err: any) { setError(err.message); }
  };

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!(form.get("file") as File)?.name) return;
    setUploading(true); setError("");
    try {
      const token = localStorage.getItem("sih_token");
      const response = await fetch("/api/v1/admin/imports/file", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
      if (!response.ok) throw new Error(`Import failed: ${response.status}`);
      setNotice("File submitted to the existing ingestion pipeline.");
      event.currentTarget.reset();
      loadImports(); loadCore();
    } catch (err: any) { setError(err.message); } finally { setUploading(false); }
  };

  const logout = () => { localStorage.removeItem("sih_token"); localStorage.removeItem("sih_user"); router.push("/login"); };
  const navGroups = useMemo(() => [...new Set(NAV.map((item) => item.group))], []);

  return (
    <main className="flex min-h-screen bg-ink text-parchment">
      <aside className="hidden w-64 shrink-0 border-r border-[var(--line)] bg-panel p-4 lg:block">
        <div className="mb-7 border-b border-[var(--line)] pb-4"><p className="text-xs tracking-[0.22em] text-gold uppercase">House Targaryen</p><h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl">Admin Control</h1><p className="mt-1 text-xs text-muted">Operational command centre</p></div>
        {navGroups.map((group) => <div key={group} className="mb-5"><p className="mb-1 px-2 text-[10px] font-bold tracking-[0.15em] text-muted uppercase">{group}</p>{NAV.filter((item) => item.group === group).map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setView(item.id)} className={clsx("mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm", view === item.id ? "bg-gold/15 text-gold" : "text-muted hover:bg-white/5 hover:text-parchment")}><Icon size={16} />{item.label}</button>; })}</div>)}
        <button onClick={logout} className="mt-4 flex items-center gap-2 px-3 text-sm text-muted hover:text-parchment"><LogOut size={16} />Sign out</button>
      </aside>
      <section className="min-w-0 flex-1 p-4 md:p-6">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4"><div><p className="text-xs tracking-[0.16em] text-gold uppercase">Administrator</p><h2 className="font-[family-name:var(--font-display)] text-2xl">{NAV.find((item) => item.id === view)?.label}</h2></div><div className="flex items-center gap-2"><DataMode value={overview?.data_mode} /><button onClick={loadCore} className="rounded-md border border-gold/35 px-3 py-1.5 text-xs text-gold">Refresh</button></div></header>
        <nav className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Admin sections">
          {NAV.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={clsx("shrink-0 rounded-md border px-2.5 py-1.5 text-xs", view === item.id ? "border-gold bg-gold/15 text-gold" : "border-white/10 text-muted")}>{item.label}</button>)}
        </nav>
        {notice && <div className="mb-4 rounded border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">{notice}<button onClick={() => setNotice("")} className="ml-3 underline">dismiss</button></div>}
        {error && <div className="mb-4 rounded border border-signal/40 bg-signal/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {loading && !overview ? <Loading /> : <AdminView view={view} overview={overview} health={health} users={users} imports={imports} audit={audit} roles={roles} search={search} setSearch={setSearch} roleFilter={roleFilter} setRoleFilter={setRoleFilter} updateUser={updateUser} upload={upload} uploading={uploading} reloadUsers={loadUsers} />}
      </section>
    </main>
  );
}

function AdminView(props: any) {
  if (props.view === "overview") return <Overview data={props.overview} health={props.health} />;
  if (props.view === "users") return <UsersView {...props} />;
  if (props.view === "access") return <AccessView roles={props.roles} />;
  if (props.view === "data") return <DataView {...props} />;
  if (props.view === "graph") return <GraphView graph={props.overview?.graph} />;
  if (props.view === "nlp") return <NlpView nlp={props.overview?.nlp} imports={props.imports} />;
  if (props.view === "health") return <HealthView health={props.health} overview={props.overview} />;
  return <AuditView audit={props.audit} />;
}

function Overview({ data, health }: any) { const userRoles = data?.users?.by_role || {}; return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Total users" value={data?.users?.total} /><Metric label="Investigators" value={userRoles.INVESTIGATOR} /><Metric label="Analysts" value={userRoles.ANALYST} /><Metric label="Active cases" value={data?.cases?.active} /><Metric label="Pending jobs" value={data?.jobs?.pending} /></div><div className="grid gap-4 xl:grid-cols-2"><Panel title="Service status"><ServiceRows health={health} /></Panel><Panel title="Graph intelligence"><div className="grid grid-cols-2 gap-3"><Metric label="Graph entities" value={data?.graph?.node_count} /><Metric label="Relationships" value={data?.graph?.relationship_count} /><Metric label="Imports" value={data?.records?.imports} /><Metric label="Raw records" value={data?.records?.raw_entities} /></div></Panel></div><Panel title="Ingestion pipeline"><Pipeline /></Panel></div>; }
function UsersView({ users, search, setSearch, roleFilter, setRoleFilter, updateUser, reloadUsers }: any) { const [showForm,setShowForm]=useState(false); return <div className="space-y-4"><div className="flex flex-wrap gap-2"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search name, email, badge" className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm" /><select value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value)} className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm"><option>ALL</option>{ROLES.map((role)=><option key={role}>{role}</option>)}</select><button onClick={reloadUsers} className="rounded border border-gold/40 px-3 text-sm text-gold">Apply</button><button onClick={()=>setShowForm(!showForm)} className="rounded bg-gold px-3 text-sm font-bold text-ink">Create user</button></div>{showForm && <CreateUser onDone={()=>{setShowForm(false);reloadUsers();}} />}<Panel title="User directory"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-white/10 text-xs text-muted"><tr><th className="pb-2">Officer</th><th>Role</th><th>Status</th><th>Last activity</th><th>Access</th></tr></thead><tbody>{users.map((user:any)=><tr key={user.id} className="border-b border-white/5"><td className="py-3"><p className="font-semibold">{user.full_name}</p><p className="text-xs text-muted">{user.email} · {user.badge_number}</p></td><td><select value={user.role} onChange={(e)=>updateUser(user.id,{role:e.target.value})} className="rounded border border-white/10 bg-black/20 p-1 text-xs">{ROLES.map((role)=><option key={role}>{role}</option>)}</select></td><td><Status value={user.is_active ? "ACTIVE" : "DISABLED"} /></td><td className="text-xs text-muted">{formatDate(user.last_activity)}</td><td><button onClick={()=>updateUser(user.id,{is_active:!user.is_active})} className="text-xs text-gold">{user.is_active ? "Disable" : "Enable"}</button></td></tr>)}</tbody></table>{!users.length && <Empty text="No users match the current filter." />}</div></Panel></div>; }
function CreateUser({ onDone }: { onDone: () => void }) { const [error,setError]=useState(""); const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault(); const form=new FormData(e.currentTarget); try{await apiPost("/api/v1/admin/users",Object.fromEntries(form));onDone();}catch(err:any){setError(err.message);}}; return <form onSubmit={submit} className="grid gap-2 rounded-xl border border-[var(--line)] bg-panel p-4 md:grid-cols-3">{["full_name","email","badge_number","password","department"].map((field)=><input key={field} required={field!=="department"} name={field} type={field==="password"?"password":"text"} placeholder={field.replaceAll("_"," ")} className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm" />)}<select name="role" className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm">{ROLES.map((role)=><option key={role}>{role}</option>)}</select><button className="rounded bg-signal px-3 py-2 text-sm font-bold text-white">Create secure account</button>{error && <p className="text-sm text-red-300">{error}</p>}</form>; }
function AccessView({ roles }: any) { return <div className="space-y-4"><p className="text-sm text-muted">Permissions are enforced server-side through FastAPI role dependencies; this view does not grant access by itself.</p><div className="grid gap-3 lg:grid-cols-2">{(roles?.roles || []).map((role:any)=><Panel key={role.role} title={role.role}><ul className="space-y-2 text-sm text-muted">{role.permissions.map((permission:string)=><li key={permission}>• {permission}</li>)}</ul></Panel>)}</div></div>; }
function DataView({ imports, upload, uploading }: any) { return <div className="space-y-4"><Panel title="Import data"><form onSubmit={upload} className="flex flex-wrap items-center gap-3"><input required name="file" type="file" accept=".txt,.csv,.json,.pdf" className="text-sm text-muted"/><input name="case_id" placeholder="Case ID (optional)" className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm"/><select name="source_type" defaultValue=""><option value="">Auto-detect source type</option><option value="FIR_REPORT">FIR document</option><option value="CSV_IMPORT">CSV dataset</option><option value="JSON_IMPORT">JSON dataset</option></select><button disabled={uploading} className="rounded bg-gold px-3 py-2 text-sm font-bold text-ink disabled:opacity-60">{uploading?"Processing…":"Upload & process"}</button></form><p className="mt-3 text-xs text-muted">Supported sources are run synchronously through the existing validation, extraction, and entity-resolution pipeline.</p></Panel><Panel title="Import history"><ImportTable imports={imports}/><p className="mt-3 text-xs text-muted">Reprocessing is unavailable because the current data model retains source metadata and extracted records, not the original document content.</p></Panel></div>; }
function GraphView({ graph }: any) { return <div className="space-y-4"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Metric label="Connection" value={graph?.status} /><Metric label="Graph entities" value={graph?.node_count} /><Metric label="Relationships" value={graph?.relationship_count} /><Metric label="Data mode" value={graph?.data_mode} /></div><Panel title="Memgraph Cloud health"><dl className="grid gap-3 text-sm md:grid-cols-2"><Row label="Last successful query" value={graph?.last_successful_query}/><Row label="Last synchronization" value={graph?.last_synchronization}/><Row label="Import status" value={graph?.import_status}/><Row label="Database availability" value={graph?.status === "UP" ? "Available" : "Unavailable — fallback graph active"}/></dl></Panel></div>; }
function NlpView({ nlp, imports }: any) { return <div className="space-y-4"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Metric label="Documents processed" value={nlp?.documents_processed}/><Metric label="Entities extracted" value={nlp?.entities_extracted}/><Metric label="Relationships extracted" value={nlp?.relationships_extracted}/><Metric label="Pending documents" value={nlp?.pending_documents}/><Metric label="Failed documents" value={nlp?.failed_documents}/><Metric label="Avg. entity confidence" value={nlp?.average_entity_confidence}/></div><Panel title="Processing history"><ImportTable imports={imports}/></Panel></div>; }
function HealthView({ health, overview }: any) { return <div className="space-y-4"><Panel title="Live service checks"><ServiceRows health={health}/></Panel><Panel title="Background processing"><div className="grid gap-3 md:grid-cols-2"><Metric label="Pending jobs" value={overview?.jobs?.pending}/><Metric label="Failed jobs" value={overview?.jobs?.failed}/></div><p className="mt-3 text-xs text-muted">The current ingestion implementation processes uploads synchronously; no separate background worker is configured.</p></Panel></div>; }
function AuditView({ audit }: any) { return <Panel title="Immutable audit events"><div className="overflow-x-auto"><table className="w-full min-w-[670px] text-left text-sm"><thead className="border-b border-white/10 text-xs text-muted"><tr><th className="pb-2">Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>Status</th><th>IP</th></tr></thead><tbody>{audit.map((log:any)=><tr key={log.id} className="border-b border-white/5"><td className="py-3 text-xs text-muted">{formatDate(log.timestamp)}</td><td>{log.user}</td><td>{log.action}</td><td>{log.resource}</td><td><Status value={log.status}/></td><td className="text-xs text-muted">{log.ip_address || "Not recorded"}</td></tr>)}</tbody></table>{!audit.length&&<Empty text="No audit events are available."/>}</div></Panel>; }
function ImportTable({ imports }: any) { return <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-white/10 text-xs text-muted"><tr><th className="pb-2">Source</th><th>Type</th><th>Status</th><th>Rows</th><th>Received</th><th>Notes</th></tr></thead><tbody>{imports.map((item:any)=><tr key={item.id} className="border-b border-white/5"><td className="py-3 font-semibold">{item.filename}</td><td className="text-xs text-muted">{item.source_type}</td><td><Status value={item.status}/></td><td>{item.rows_processed ?? "—"}</td><td className="text-xs text-muted">{formatDate(item.ingested_at)}</td><td className="max-w-60 text-xs text-muted">{item.error || (item.reprocess_supported ? "Reprocessing available" : "Original content not retained")}</td></tr>)}</tbody></table>{!imports.length&&<Empty text="No imports have been recorded."/>}</div>; }
function ServiceRows({ health }: any) { const services=health?.services || {}; return <div className="space-y-2">{Object.entries(services).map(([name,service]:any)=><div key={name} className="flex items-center justify-between gap-3 rounded border border-white/5 px-3 py-2"><div><p className="text-sm font-semibold uppercase">{name.replaceAll("_"," ")}</p><p className="text-xs text-muted">{service.details}</p></div><Status value={service.status}/></div>)}</div>; }
function Pipeline(){return <div className="flex flex-wrap items-center gap-2 text-xs text-muted">{["Upload","Validate","Clean","NLP extraction","Entity resolution","Relationship extraction","Graph insertion","Completed"].map((step,index)=><span key={step} className="flex items-center gap-2"><span className="rounded border border-gold/30 bg-gold/10 px-2 py-1 text-gold">{step}</span>{index<7&&<span>→</span>}</span>)}</div>;}
function Metric({label,value}:any){return <div className="rounded-xl border border-[var(--line)] bg-panel p-4"><p className="text-[10px] tracking-[0.12em] text-muted uppercase">{label}</p><p className="mt-1 break-words font-[family-name:var(--font-display)] text-2xl">{value ?? "Not available"}</p></div>;}
function Panel({title,children}:any){return <section className="rounded-xl border border-[var(--line)] bg-panel p-4"><h3 className="mb-3 font-[family-name:var(--font-display)] text-lg">{title}</h3>{children}</section>;}
function Status({value}:any){const positive=["UP","ACTIVE","COMPLETED","RECORDED"].includes(value);const warning=["PENDING","PROCESSING","DEGRADED"].includes(value);return <span className={clsx("rounded border px-2 py-1 text-[10px] font-bold",positive?"border-ok/40 bg-ok/10 text-ok":warning?"border-gold/40 bg-gold/10 text-gold":"border-signal/40 bg-signal/10 text-red-300")}>{value||"Not available"}</span>;}
function DataMode({value}:any){return <span className={clsx("rounded border px-2 py-1 text-[10px] font-bold",value==="LIVE"?"border-ok/40 text-ok":"border-gold/40 text-gold")}>{value||"CHECKING DATA MODE"}</span>;}
function Row({label,value}:any){return <div><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 text-sm">{value??"Not available"}</dd></div>;}
function Empty({text}:any){return <p className="py-5 text-center text-sm text-muted">{text}</p>;}
function Loading(){return <div className="flex h-64 items-center justify-center text-sm text-muted">Loading protected operational data…</div>;}
function formatDate(value?:string){return value?new Date(value).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}):"Not available";}
