"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InvestigatorBoard from "@/components/investigator/InvestigatorBoard";

export default function InvestigatorDashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("sih_user");
    if (!raw) { router.replace("/login"); return; }
    try {
      const role = String(JSON.parse(raw).role || "").toUpperCase();
      if (role === "ADMIN") { router.replace("/admin"); return; }
      if (role === "ANALYST") { router.replace("/analyst"); return; }
    } catch { router.replace("/login"); return; }
    setReady(true);
  }, [router]);

  return ready
    ? <InvestigatorBoard />
    : <div className="flex min-h-screen items-center justify-center bg-ink text-parchment text-sm">Loading workbench…</div>;
}
