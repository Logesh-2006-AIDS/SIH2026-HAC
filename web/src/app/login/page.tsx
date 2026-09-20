"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Lock, Shield, ArrowRight, Eye, EyeOff } from "lucide-react";

const ROLES = [
  { id: "investigator", label: "Investigator", dest: "/dashboard", role: "INVESTIGATOR" },
  { id: "analyst",      label: "Analyst",       dest: "/analyst",   role: "ANALYST"       },
  { id: "admin",        label: "Station Admin", dest: "/admin",     role: "ADMIN"         },
];

// Demo credentials — no backend required
const DEMO_USERS: Record<string, { email: string; password: string; role: string; name: string }> = {
  investigator: { email: "investigator@police.gov.in", password: "investigator123", role: "INVESTIGATOR", name: "Insp. Rajesh Vardhan" },
  analyst:      { email: "analyst@police.gov.in",      password: "analyst123",      role: "ANALYST",      name: "Dr. Priya Sankar"   },
  admin:        { email: "admin@police.gov.in",        password: "admin123",        role: "ADMIN",        name: "Supt. K. Rao"       },
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("investigator@police.gov.in");
  const [password, setPassword] = useState("investigator123");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [activeRole, setActiveRole] = useState("investigator");

  // One-click role login
  const quickLogin = (roleId: string) => {
    const u = DEMO_USERS[roleId];
    if (!u) return;
    setUsername(u.email);
    setPassword(u.password);
    setActiveRole(roleId);
    const user = { email: u.email, role: u.role, full_name: u.name };
    localStorage.setItem("sih_token", "demo-token");
    localStorage.setItem("sih_user", JSON.stringify(user));
    if (u.role === "ADMIN") router.push("/admin");
    else if (u.role === "ANALYST") router.push("/analyst");
    else router.push("/dashboard");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const match = Object.values(DEMO_USERS).find(
      (u) => u.email.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (!match) {
      setError("Incorrect badge / email or password.");
      setLoading(false);
      return;
    }

    const user = { email: match.email, role: match.role, full_name: match.name };
    localStorage.setItem("sih_token", "demo-token");
    localStorage.setItem("sih_user", JSON.stringify(user));

    if (match.role === "ADMIN") router.push("/admin");
    else if (match.role === "ANALYST") router.push("/analyst");
    else router.push("/dashboard");

    setLoading(false);
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
              onClick={() => quickLogin(role.id)}
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
          {loading ? "Authenticating..." : "Enter Workbench"}
          <ArrowRight size={16} />
        </button>

        <p className="mt-4 text-center text-[10px] text-muted">
          Demo: investigator123 / analyst123 / admin123
        </p>
      </form>
    </main>
  );
}
