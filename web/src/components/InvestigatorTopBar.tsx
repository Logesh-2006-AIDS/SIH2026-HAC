"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Shield, LogOut, Pin, FileText, Upload,
  Network, BarChart3, Route, AlertTriangle, Sparkles, Bot, Database
} from "lucide-react";

const ROUTE_META: Record<string, { label: string; icon: React.ElementType }> = {
  "/dashboard": { label: "Criminal Pinboard", icon: Pin },
  "/dashboard/pinboard": { label: "Criminal Pinboard", icon: Pin },
  "/dashboard/dossiers": { label: "Active Case Dossiers", icon: FileText },
  "/dashboard/cases": { label: "Active Case Dossiers", icon: FileText },
  "/dashboard/ingestion": { label: "Evidence Ingestion", icon: Upload },
  "/dashboard/knowledge-graph": { label: "Knowledge Graph", icon: Network },
  "/dashboard/key-entities": { label: "Key & Bridge Entities", icon: BarChart3 },
  "/dashboard/path-finder": { label: "Red-String Path Finder", icon: Route },
  "/dashboard/patterns": { label: "Suspicious Patterns", icon: AlertTriangle },
  "/dashboard/nlp": { label: "AI/NLP Entity Extraction", icon: Sparkles },
  "/dashboard/copilot": { label: "AI Investigation Copilot", icon: Bot },
  "/dashboard/workspace": { label: "Case Workspace", icon: Database },
  "/dashboard/report": { label: "Investigation Report", icon: FileText },
};

export default function InvestigatorTopBar() {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();
  const [selectedCase, setSelectedCase] = useState("101");

  const meta = ROUTE_META[pathname] || { label: "Forensic Workbench", icon: Shield };
  const PageIcon = meta.icon;
  const isPinboard = pathname === "/dashboard" || pathname === "/dashboard/pinboard";

  const handleSignOut = () => {
    localStorage.removeItem("sih_token");
    localStorage.removeItem("sih_user");
    router.push("/login");
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.25rem",
        height: "48px",
        background: "rgba(10, 13, 10, 0.98)",
        borderBottom: "1px solid rgba(217, 170, 61, 0.3)",
        zIndex: 30,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {!isPinboard && (
          <Link
            href="/dashboard/pinboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.78rem",
              padding: "0.3rem 0.7rem",
              borderRadius: "6px",
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(217,170,61,0.35)",
              color: "#F1EBDD",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={14} /> Pinboard
          </Link>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <PageIcon size={16} color="#D9AA3D" />
          <span
            style={{
              color: "#F1EBDD",
              fontWeight: 800,
              fontSize: "0.86rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {meta.label}
          </span>
          <span
            style={{
              fontSize: "0.66rem",
              fontWeight: 700,
              padding: "0.15rem 0.45rem",
              borderRadius: "4px",
              background: "rgba(217,170,61,0.15)",
              color: "#D9AA3D",
              border: "1px solid rgba(217,170,61,0.35)",
            }}
          >
            Case {selectedCase}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <select
          value={selectedCase}
          onChange={(e) => setSelectedCase(e.target.value)}
          style={{
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(217,170,61,0.35)",
            color: "#F1EBDD",
            padding: "0.25rem 0.6rem",
            borderRadius: "6px",
            fontSize: "0.75rem",
            outline: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <option value="101">Case 101</option>
          <option value="102">Case 102</option>
          <option value="103">Case 103</option>
        </select>

        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            padding: "0.22rem 0.6rem",
            borderRadius: "6px",
            background: "rgba(217,170,61,0.18)",
            border: "1px solid rgba(217,170,61,0.4)",
            color: "#D9AA3D",
          }}
        >
          INVESTIGATOR
        </span>

        <button
          type="button"
          onClick={handleSignOut}
          style={{
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(217,170,61,0.35)",
            color: "#fca5a5",
            padding: "0.25rem 0.6rem",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <LogOut size={12} /> Logout
        </button>
      </div>
    </header>
  );
}
