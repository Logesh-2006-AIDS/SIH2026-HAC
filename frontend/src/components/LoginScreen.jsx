import React, { useState } from 'react';
import { Shield, BadgeCheck, Lock, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';

const ROLES = [
  { id: 'investigator', label: 'Investigator', dest: '/dashboard', role: 'INVESTIGATOR' },
  { id: 'analyst',      label: 'Analyst',       dest: '/analyst',   role: 'ANALYST'       },
  { id: 'admin',        label: 'Station Admin', dest: '/admin',     role: 'ADMIN'         },
];

const DEMO_USERS = {
  investigator: {
    id: 1,
    email: 'investigator@police.gov.in',
    password: 'investigator123',
    role: 'INVESTIGATOR',
    name: 'Insp. Rajesh Vardhan',
    full_name: 'Insp. Rajesh Vardhan',
    badge_number: 'DL-CB-9021',
    department: 'Narcotics & Special Cell, Chennai Unit',
  },
  analyst: {
    id: 2,
    email: 'analyst@police.gov.in',
    password: 'analyst123',
    role: 'ANALYST',
    name: 'Dr. Priya Sankar',
    full_name: 'Dr. Priya Sankar',
    badge_number: 'INT-908',
    department: 'Criminal Intelligence & Analytics Wing',
  },
  admin: {
    id: 3,
    email: 'admin@police.gov.in',
    password: 'admin123',
    role: 'ADMIN',
    name: 'Supt. K. Rao',
    full_name: 'Supt. K. Rao',
    badge_number: 'HQ-001',
    department: 'State Crime Records Bureau',
  },
};

export default function LoginScreen({ onAuthenticated }) {
  const [activeRole, setActiveRole] = useState('investigator');
  const [username, setUsername] = useState('investigator@police.gov.in');
  const [password, setPassword] = useState('investigator123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const completeLogin = (userProfile, roleId) => {
    localStorage.setItem('sih_token', 'demo-token');
    localStorage.setItem('sih_user', JSON.stringify(userProfile));

    const dest = roleId === 'admin' || userProfile.role === 'ADMIN'
      ? '/admin'
      : roleId === 'analyst' || userProfile.role === 'ANALYST'
        ? '/analyst'
        : '/dashboard';

    window.history.pushState({}, '', dest);
    if (onAuthenticated) {
      onAuthenticated(userProfile);
    }
  };

  const quickLogin = (roleId) => {
    const u = DEMO_USERS[roleId];
    if (!u) return;
    setUsername(u.email);
    setPassword(u.password);
    setActiveRole(roleId);
    completeLogin(u, roleId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const match = Object.values(DEMO_USERS).find(
      (u) =>
        (u.email.toLowerCase() === username.trim().toLowerCase() ||
         u.badge_number.toLowerCase() === username.trim().toLowerCase()) &&
        u.password === password
    );

    if (!match) {
      const lower = username.toLowerCase();
      let fallbackKey = 'investigator';
      if (lower.includes('admin')) fallbackKey = 'admin';
      else if (lower.includes('analyst')) fallbackKey = 'analyst';

      if (password === 'demo' || password === 'password' || password.endsWith('123')) {
        const fallbackUser = DEMO_USERS[fallbackKey];
        completeLogin(fallbackUser, fallbackKey);
        setLoading(false);
        return;
      }

      setError('Incorrect badge / email or password. Demo passwords: investigator123 / analyst123 / admin123');
      setLoading(false);
      return;
    }

    const roleKey = match.role.toLowerCase();
    completeLogin(match, roleKey);
    setLoading(false);
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#080a08] px-4 text-[#f1ebdd] font-sans select-none">
      {/* Cinematic Ambient Background Gradients */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, rgba(217,170,61,0.12), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(214,40,40,0.1), transparent 50%), radial-gradient(circle at 50% 50%, rgba(8,10,8,0.85) 0%, rgba(8,10,8,0.98) 100%)',
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-15"
        style={{
          backgroundImage: 'radial-gradient(rgba(217,170,61,0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[rgba(217,170,61,0.3)] bg-[#101412] p-7 backdrop-blur-xl shadow-2xl transition-all">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#d9aa3d] to-[#8a6515] text-[#101311] font-bold shadow-lg">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#f1ebdd]">House Targaryen</h1>
            <p className="text-xs text-[#8a948c] font-medium">Forensic Intelligence Access • SIH 2026</p>
          </div>
        </div>

        {/* Quick One-Click Role Selector */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold tracking-wide text-[#8a948c] uppercase flex items-center gap-1">
              <Sparkles size={12} className="text-[#d9aa3d]" /> One-Click Role Access
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => quickLogin(role.id)}
                className={`rounded-lg border px-2.5 py-2 text-center text-xs font-bold transition-all duration-150 cursor-pointer ${
                  activeRole === role.id
                    ? 'border-[#d9aa3d] bg-[#d9aa3d]/20 text-[#d9aa3d] shadow-sm'
                    : 'border-white/10 text-[#8a948c] hover:border-white/20 hover:text-[#f1ebdd] bg-black/30'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative bg-[#101412] px-2 text-[10px] font-semibold text-[#8a948c] uppercase tracking-wider">
            Or credentials sign-in
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Username / Badge input */}
          <div className="mb-3">
            <label className="mb-1 block text-[11px] font-bold tracking-wide text-[#8a948c] uppercase">
              Badge / Official Email
            </label>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 transition focus-within:border-[#d9aa3d]/60">
              <BadgeCheck size={16} className="text-[#d9aa3d] shrink-0" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. investigator@police.gov.in"
                className="w-full bg-transparent text-sm text-[#f1ebdd] outline-none placeholder:text-[#8a948c]/60"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="mb-3">
            <label className="mb-1 block text-[11px] font-bold tracking-wide text-[#8a948c] uppercase">
              Password
            </label>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 transition focus-within:border-[#d9aa3d]/60">
              <Lock size={16} className="text-[#d9aa3d] shrink-0" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter secure password"
                className="w-full bg-transparent text-sm text-[#f1ebdd] outline-none placeholder:text-[#8a948c]/60"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="text-[#8a948c] hover:text-[#f1ebdd] transition p-0.5 cursor-pointer"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d9aa3d] to-[#d97706] px-4 py-3 text-sm font-bold text-[#101311] shadow-lg transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Authenticating…' : 'Enter Forensic Workbench'}
            <ArrowRight size={16} />
          </button>

          <p className="mt-4 text-center text-[11px] text-[#8a948c] font-mono">
            Demo: <code className="text-[#d9aa3d]/90">investigator123</code> / <code className="text-[#d9aa3d]/90">analyst123</code> / <code className="text-[#d9aa3d]/90">admin123</code>
          </p>
        </form>

        <div className="mt-4 pt-3 border-t border-white/5 text-center text-[10px] text-[#8a948c] tracking-wider">
          HOUSE TARGARYEN • AI CRIMINAL NETWORK ANALYSIS PLATFORM • SIH 2026
        </div>
      </div>
    </main>
  );
}
