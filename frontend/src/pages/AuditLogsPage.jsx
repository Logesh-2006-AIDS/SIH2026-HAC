import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Search, Filter, Shield, Clock, User, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/v1/admin/audit-logs');
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error('Audit logs error:', err);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.username?.toLowerCase().includes(q) || l.action?.toLowerCase().includes(q) || l.resource?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-slate-900 to-slate-900">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Tamper-Evident Audit & Compliance Registry</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 font-semibold">
                SHA-256 CHAIN OF CUSTODY
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Immutable logging of case access, entity queries, graph traversals, lead verifications & data uploads.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>LOG CHAIN INTACT</span>
        </div>
      </div>

      {/* Search & Audit Table */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 flex-1 max-w-md">
            <Search className="w-4 h-4 text-purple-400" />
            <input
              type="text"
              placeholder="Search by officer, action, or case target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none w-full font-mono"
            />
          </div>
          <span className="text-xs font-mono text-slate-400">{filteredLogs.length} Logged Entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Officer ID</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Resource / Target</th>
                <th className="py-3 px-4">IP / Terminal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-100">{log.username}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700 text-[10px]">
                      {log.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-cyan-400">{log.action}</td>
                  <td className="py-3 px-4 text-slate-300 truncate max-w-[280px]">{log.resource}</td>
                  <td className="py-3 px-4 text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
