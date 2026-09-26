"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import InvestigatorTopBar from "@/components/InvestigatorTopBar";
import RadarSweepBackground from "@/components/RadarSweepBackground";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const isPinboard = pathname === "/dashboard" || pathname === "/dashboard/pinboard";

  return (
    <div
      className="app-container"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative",
        background: "var(--ink)",
      }}
    >
      {/* 1. Full-Page Ambient Radar / Lighthouse Sweep Background */}
      <RadarSweepBackground />

      {/* 2. Persistent Top Navigation Bar */}
      {!isPinboard && <InvestigatorTopBar />}

      {/* 3. Main Body: Persistent Sidebar + Client Content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", zIndex: 1, position: "relative" }}>
        {!isPinboard && <Sidebar />}

        <main
          className="animate-fade-in"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
