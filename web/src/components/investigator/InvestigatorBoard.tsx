"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRight, BarChart3, Bot, CheckCircle2, Crosshair,
  FileText, FolderOpen, Lightbulb, Map, Network, Route, Search, Shield,
  Sparkles, Upload,
} from "lucide-react";

type CaseRecord = { case_number: string; crime_category?: string; title?: string; status?: string };

const FALLBACK_CASES: CaseRecord[] = [
  { case_number: "101", crime_category: "Drug Trafficking", status: "ACTIVE" },
  { case_number: "102", crime_category: "Financial Fraud", status: "ACTIVE" },
  { case_number: "103", crime_category: "Arms Smuggling", status: "ACTIVE" },
];

const NOTES = [
  { id: "dossiers", label: "Case Dossiers", icon: FolderOpen, tone: "cream", pin: "gold", x: 3, y: 10, rot: -2, w: 135 },
  { id: "brief", label: "Case Brief", icon: FileText, tone: "yellow", pin: "red", x: 19, y: 8, rot: 1.5, w: 125 },
  { id: "nlp", label: "NLP Extraction", icon: Sparkles, tone: "blue", pin: "gold", x: 34, y: 8, rot: -1.5, w: 130 },
  { id: "entity", label: "Entity Investigation", icon: Search, tone: "orange", pin: "red", x: 50, y: 10, rot: 1, w: 145 },
  { id: "network", label: "Knowledge Graph", icon: Network, tone: "cream", pin: "blue", x: 4, y: 32, rot: 2, w: 135 },
  { id: "bridge", label: "Bridge Entities", icon: BarChart3, tone: "yellow", pin: "gold", x: 19, y: 32, rot: -1, w: 130 },
  { id: "crosscase", label: "Cross-Case", icon: Crosshair, tone: "yellow", pin: "red", x: 34, y: 34, rot: 1, w: 125 },
  { id: "path", label: "Path Finder", icon: Route, tone: "orange", pin: "red", x: 49, y: 34, rot: -2, w: 125 },
  { id: "patterns", label: "Suspicious Patterns", icon: AlertTriangle, tone: "orange", pin: "red", x: 4, y: 55, rot: 1.5, w: 145 },
  { id: "leads", label: "Actionable Leads", icon: CheckCircle2, tone: "yellow", pin: "gold", x: 22, y: 58, rot: -1, w: 140 },
  { id: "evidence", label: "Evidence & Records", icon: Shield, tone: "cream", pin: "blue", x: 38, y: 56, rot: 2, w: 135 },
  { id: "ingest", label: "Evidence Ingestion", icon: Upload, tone: "blue", pin: "blue", x: 4, y: 76, rot: -2, w: 135 },
  { id: "report", label: "Investigation Report", icon: FileText, tone: "cream", pin: "gold", x: 38, y: 78, rot: -1.5, w: 145 },
] as const;

const PINS: Record<string, [number, number]> = {
  hub: [48, 26], dossiers: [9, 14], brief: [25, 12], nlp: [40, 12], entity: [57, 14],
  network: [10, 36], bridge: [25, 36], crosscase: [40, 38], path: [55, 38],
  patterns: [11, 60], copilot: [76, 30], leads: [29, 63], evidence: [44, 61],
  ingest: [10, 80], map: [75, 64], report: [45, 82],
};
const ROPES = [["hub", "dossiers"], ["hub", "brief"], ["hub", "nlp"], ["hub", "network"], ["hub", "crosscase"], ["hub", "copilot"], ["hub", "map"], ["hub", "leads"], ["dossiers", "brief"], ["brief", "nlp"], ["nlp", "entity"], ["entity", "network"], ["network", "bridge"], ["bridge", "crosscase"], ["crosscase", "path"], ["patterns", "leads"], ["leads", "evidence"], ["evidence", "report"], ["ingest", "patterns"], ["copilot", "map"]] as const;

function ropePath(a: string, b: string, index: number) {
  const [x1, y1] = PINS[a]; const [x2, y2] = PINS[b];
  const bend = (index % 2 ? -1 : 1) * (3 + (index % 3));
  return `M ${x1} ${y1} Q ${(x1 + x2) / 2 + bend} ${(y1 + y2) / 2 - bend} ${x2} ${y2}`;
}

export default function InvestigatorBoard() {
  const [selectedCase, setSelectedCase] = useState("101");
  const [cases, setCases] = useState<CaseRecord[]>(FALLBACK_CASES);
  const [lampOn, setLampOn] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/v1/cases")
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => { if (Array.isArray(payload?.data) && payload.data.length) setCases(payload.data); })
      .catch(() => undefined);
  }, []);

  const dossier = useMemo(() => cases.find((item) => item.case_number === selectedCase) ?? FALLBACK_CASES[0], [cases, selectedCase]);
  const openFeature = (feature: string) => setNotice(`${feature} is selected for Case ${selectedCase}.`);
  const logout = () => { localStorage.removeItem("sih_token"); localStorage.removeItem("sih_user"); window.location.assign("/login"); };

  return (
    <main className="investigator-board" aria-label="Investigator Workbench">
      <header className="investigator-topbar">
        <div className="investigator-brand"><span className="investigator-shield"><Shield size={15} /></span><strong>Investigator Workbench</strong><span className="investigator-demo">DEMO MODE</span></div>
        <div className="investigator-actions">
          <select value={selectedCase} onChange={(event) => setSelectedCase(event.target.value)} aria-label="Select case">{cases.map((item) => <option key={item.case_number} value={item.case_number}>Case {item.case_number}</option>)}</select>
          <span className="investigator-role">Investigator</span>
          <button onClick={() => setLampOn((current) => !current)}><Lightbulb size={13} /> {lampOn ? "Lamp" : "Dark"}</button>
          <button className="investigator-logout" onClick={logout}>Logout</button>
        </div>
      </header>

      <section className="investigator-summary">
        <div><p>ACTIVE INVESTIGATION</p><h1>CASE {selectedCase} — {dossier.crime_category || dossier.title || "Coastal Smuggling Network"}</h1><small>Status: {dossier.status || "ACTIVE"}</small></div>
        <div className="investigator-metrics">{[["Entities", "15"], ["Relationships", "13"], ["Cross-Case", "12"], ["Patterns", "6"], ["Leads", "2"]].map(([label, value]) => <div key={label}><b>{value}</b><span>{label}</span></div>)}</div>
        <button className="investigator-continue" onClick={() => openFeature("Case workspace")}>Continue Investigation <ArrowRight size={15} /></button>
      </section>
      {notice && <p className="investigator-notice" role="status">{notice}</p>}

      <div className="investigator-lamp" onClick={() => setLampOn((current) => !current)} role="button" tabIndex={0} aria-label="Toggle desk lamp"><i /><span><em className={lampOn ? "" : "off"} /></span></div>
      <section className="investigator-frame">
        <div className="investigator-cork">
          <div className={`investigator-spotlight ${lampOn ? "" : "off"}`} />
          <svg className="investigator-ropes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {ROPES.map(([a, b], index) => <path key={`${a}-${b}`} d={ropePath(a, b, index)} className={hovered === a || hovered === b ? "hot" : ""} />)}
          </svg>
          <button className="investigator-hub" onClick={() => openFeature("Case workspace")} onMouseEnter={() => setHovered("hub")} onMouseLeave={() => setHovered(null)}><i className="investigator-pin red" /><b>CASE {selectedCase}</b><span className="investigator-silhouette" /><small>ACTIVE HUB</small></button>
          {NOTES.map((note) => { const Icon = note.icon; return <button key={note.id} className={`investigator-note ${note.tone}`} style={{ left: `${note.x}%`, top: `${note.y}%`, width: note.w, transform: `rotate(${note.rot}deg)` }} onClick={() => openFeature(note.label)} onMouseEnter={() => setHovered(note.id)} onMouseLeave={() => setHovered(null)}><i className={`investigator-pin ${note.pin}`} /><span><Icon size={16} /><b>{note.label}</b></span></button>; })}
          <button className="investigator-copilot" onClick={() => openFeature("AI Copilot")} onMouseEnter={() => setHovered("copilot")} onMouseLeave={() => setHovered(null)}><i className="investigator-pin gold" /><Bot size={30} /><b><Bot size={14} /> AI Copilot</b></button>
          <button className="investigator-map" onClick={() => openFeature("Crime map")} onMouseEnter={() => setHovered("map")} onMouseLeave={() => setHovered(null)}><i className="investigator-pin blue" /><Map size={38} /><b><Map size={14} /> Crime Map</b></button>
        </div>
      </section>
    </main>
  );
}
