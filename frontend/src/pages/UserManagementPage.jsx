import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, CheckCircle2, Lock, KeyRound, ArrowRight } from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/v1/system/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error('Users fetch error:', err);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-slate-900 to-slate-900">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Departmental User & Role-Based Access Control</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 font-semibold">
                ADMIN ACCESS ONLY
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage authorized law-enforcement personnel, role permissions (Admin, Investigator, Analyst, Viewer) & credential policies.
            </p>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Authorized Personnel Roster</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">{users.length} Active Officers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Officer / User</th>
                <th className="py-3 px-4">Designation Role</th>
                <th className="py-3 px-4">Badge Number</th>
                <th className="py-3 px-4">Official Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-slate-100 font-sans">
                    <div>{u.full_name}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">@{u.username}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold ${
                      u.role === 'Admin' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                      (u.role === 'Investigator' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                      (u.role === 'Analyst' ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-slate-800 text-slate-400 border-slate-700'))
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{u.badge}</td>
                  <td className="py-3 px-4 text-slate-400">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{u.last_active}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
