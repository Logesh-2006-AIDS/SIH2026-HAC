"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Pin, FileText, Upload, Network, BarChart3, Route,
  AlertTriangle, Sparkles, Bot, Database, ShieldCheck
} from "lucide-react";

export const SIDEBAR_NAV_GROUPS = [
  {
    title: "INVESTIGATION",
    items: [
      { id: "pinboard", href: "/dashboard/pinboard", label: "Criminal Pinboard", icon: Pin },
      { id: "dossiers", href: "/dashboard/dossiers", label: "Active Case Dossiers", icon: FileText },
      { id: "ingestion", href: "/dashboard/ingestion", label: "Evidence Ingestion", icon: Upload },
    ],
  },
  {
    title: "NETWORK INTELLIGENCE",
    items: [
      { id: "knowledge-graph", href: "/dashboard/knowledge-graph", label: "Knowledge Graph", icon: Network },
      { id: "key-entities", href: "/dashboard/key-entities", label: "Key & Bridge Entities", icon: BarChart3 },
      { id: "path-finder", href: "/dashboard/path-finder", label: "Red-String Path Finder", icon: Route },
    ],
  },
  {
    title: "AI FORENSIC INTELLIGENCE",
    items: [
      { id: "patterns", href: "/dashboard/patterns", label: "Suspicious Patterns", icon: AlertTriangle },
      { id: "nlp", href: "/dashboard/nlp", label: "AI/NLP Entity Extraction", icon: Sparkles },
      { id: "copilot", href: "/dashboard/copilot", label: "AI Investigation Copilot", icon: Bot },
    ],
  },
  {
    title: "CASE RECORDS & REPORTS",
    items: [
      { id: "workspace", href: "/dashboard/workspace", label: "Case Workspace", icon: Database },
      { id: "report", href: "/dashboard/report", label: "Investigation Report", icon: FileText },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname() || "";

  return (
    <aside
      className="app-sidebar"
      style={{
        width: "270px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "rgba(16, 19, 17, 0.95)",
        borderRight: "1px solid rgba(217, 170, 61, 0.22)",
        backdropFilter: "blur(16px)",
        zIndex: 20,
      }}
    >
      <div style={{ flex: 1, padding: "1.25rem 1rem", overflowY: "auto" }} className="scrollbar-thin">
        {SIDEBAR_NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                fontSize: "0.66rem",
                fontWeight: 800,
                color: "#6C7A73",
                marginBottom: "0.55rem",
                paddingLeft: "0.75rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span>{group.title}</span>
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href === "/dashboard/pinboard" && (pathname === "/dashboard" || pathname === "/dashboard/"));

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "10px",
                      background: isActive
                        ? "linear-gradient(135deg, rgba(217, 170, 61, 0.18) 0%, rgba(214, 40, 40, 0.1) 100%)"
                        : "transparent",
                      color: isActive ? "#F1EBDD" : "#A6B0AA",
                      border: "1px solid",
                      borderColor: isActive ? "rgba(217, 170, 61, 0.45)" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      fontWeight: isActive ? 700 : 500,
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      width: "100%",
                      position: "relative",
                      boxShadow: isActive ? "0 4px 14px rgba(217, 170, 61, 0.15)" : "none",
                      textDecoration: "none",
                    }}
                    className="hover:bg-[rgba(216,197,138,0.06)] hover:text-[#F1EBDD] hover:translate-x-0.5"
                  >
                    {/* Active Left Red Investigation String Indicator */}
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "20%",
                          bottom: "20%",
                          width: "3px",
                          borderRadius: "0 4px 4px 0",
                          background: "#D62828",
                          boxShadow: "0 0 8px #D62828",
                        }}
                      />
                    )}

                    <div
                      style={{
                        color: isActive ? "#D9AA3D" : "#6C7A73",
                        transition: "color 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <span style={{ fontSize: "0.84rem" }}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Security Footer Badge */}
      <div
        style={{
          padding: "0.85rem 1.15rem",
          borderTop: "1px solid rgba(217, 170, 61, 0.22)",
          background: "rgba(8, 10, 9, 0.7)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
            fontSize: "0.72rem",
            color: "#4ADE80",
            fontWeight: 700,
          }}
        >
          <ShieldCheck size={14} />
          <span>Evidence Chain: VERIFIED</span>
        </div>
        <div style={{ fontSize: "0.65rem", color: "#6C7A73", textAlign: "center", marginTop: "0.2rem" }}>
          SIH 2026 Forensic Console • Next.js App Router
        </div>
      </div>
    </aside>
  );
}
