"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Lock, Shield, ArrowRight, Eye, EyeOff } from "lucide-react";

const ROLES = [
  { id: "investigator", label: "Investigator", dest: "/dashboard", role: "INVESTIGATOR" },
  { id: "analyst", label: "Analyst", dest: "/analyst", role: "ANALYST" },
  { id: "admin", label: "Station Admin", dest: "/admin", role: "ADMIN" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("analyst@police.gov.in");
  const [password, setPassword] = useState("investigator123");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeRole, setActiveRole] = useState("analyst");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = new URLSearchParams();
      body.append("username", username);
      body.append("password", password);
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      let user: Record<string, unknown> | null = null;
      let token = "";
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data?.access_token) {
          token = json.data.access_token;
          user = json.data.user;
        }
      }

      if (!user) {
        setError("Incorrect badge / email or password.");
        return;
      }

      localStorage.setItem("sih_token", token);
      localStorage.setItem("sih_user", JSON.stringify(user));

      const role = String(user.role || "INVESTIGATOR").toUpperCase();
      if (role === "ADMIN") router.push("/admin");
      else if (role === "ANALYST") router.push("/analyst");
      else router.push("/dashboard");
    } catch {
      setError("Unable to reach authentication service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-5 text-parchment">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, rgba(217,170,61,0.12), transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(214,40,40,0.1), transparent 40%)",
        }}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl border border-[var(--line)] bg-panel/95 p-7 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-ink">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl">House Targaryen</h1>
            <p className="text-sm text-muted">Secure access · SIH 2026</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setActiveRole(role.id)}
              className={`rounded-lg border px-2 py-2 text-left text-[11px] font-bold ${
                activeRole === role.id
                  ? "border-gold/70 bg-gold/15 text-gold"
                  : "border-white/10 text-parchment"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-[11px] font-bold tracking-wide text-muted uppercase">Badge / Email</label>
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-3">
          <BadgeCheck size={16} className="text-gold" />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <label className="mb-1 block text-[11px] font-bold tracking-wide text-muted uppercase">Password</label>
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-3">
          <Lock size={16} className="text-gold" />
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
          <button type="button" onClick={() => setShowPw((v) => !v)} className="text-muted">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-signal px-4 py-3 text-sm font-bold text-white disabled:opacity-70"
        >
          {loading ? "Authenticating…" : "Enter Workbench"}
          <ArrowRight size={16} />
        </button>
      </form>
    </main>
  );
}
