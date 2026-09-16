"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardStub() {
  const router = useRouter();
  useEffect(() => {
    if (!localStorage.getItem("sih_user")) router.replace("/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 text-parchment">
      <div className="max-w-lg border border-[var(--line)] bg-panel p-8 text-center">
        <p className="text-xs tracking-[0.2em] text-gold uppercase">Investigator</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">Station Board</h1>
        <p className="mt-3 text-sm text-muted">
          Investigator workflow remains in the existing Vite console. Analyst work lives at /analyst.
        </p>
        <div className="mt-6 flex justify-center gap-4 text-sm text-gold">
          <Link href="/analyst">Open Analyst</Link>
          <Link href="/login">Login</Link>
        </div>
      </div>
    </main>
  );
}
