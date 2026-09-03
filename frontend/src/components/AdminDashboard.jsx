import React, { useState, useEffect } from 'react';
import { Shield, Database, Server, Cpu, RefreshCw, Trash2, CheckCircle2, AlertCircle, FileSpreadsheet, Activity, ListFilter, Users } from 'lucide-react';

export default function AdminDashboard({ systemStatus, onRefreshStatus }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/v1/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleSeedDataset = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch('/api/v1/admin/seed-dataset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSeedResult(data);
        if (onRefreshStatus) onRefreshStatus();
        fetchAuditLogs();
      } else {
        alert('Failed to seed dataset.');
      }
    } catch (err) {
      console.error('Seeding error:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetGraph = async () => {
    if (!window.confirm('Are you sure you want to reset the entire Knowledge Graph?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/v1/admin/reset-graph', { method: 'POST' });
      if (res.ok) {
        alert('Knowledge Graph wiped clean.');
        if (onRefreshStatus) onRefreshStatus();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-red-900/40 bg-gradient-to-r from-red-950/40 via-black to-black shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-600/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Admin Operations & Infrastructure Control</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-semibold font-mono">
                SYSTEM HEALTH & INGESTION
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Dataset Ingestion Pipeline • Relational & Graph Store Management • Audit & Compliance Trail
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshStatus}
          className="px-4 py-2 rounded-xl bg-black/80 hover:bg-red-950/60 text-red-400 border border-red-900/40 text-xs font-bold flex items-center space-x-2 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh System Health</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Knowledge Graph Nodes */}
        <div className="p-5 rounded-2xl glass-panel border border-red-900/40 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">Neo4j Graph Engine</span>
            <Database className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100 font-mono">
            {systemStatus?.neo4j_graph?.total_nodes || 0}
            <span className="text-xs text-slate-500 font-sans font-normal ml-2">Nodes</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>Edges: <strong className="text-cyan-400">{systemStatus?.neo4j_graph?.total_edges || 0}</strong></span>
            <span className="text-[10px] font-mono text-emerald-400">● {systemStatus?.neo4j_graph?.engine}</span>
          </div>
        </div>

        {/* Database Cases */}
        <div className="p-5 rounded-2xl glass-panel border border-amber-500/20 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Relational Store</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100 font-mono">
            {systemStatus?.database?.total_cases || 0}
            <span className="text-xs text-slate-500 font-sans font-normal ml-2">FIR Documents</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>DB Entities: <strong className="text-amber-400">{systemStatus?.database?.total_db_entities || 0}</strong></span>
            <span className="text-[10px] font-mono text-emerald-400">● HEALTHY</span>
          </div>
        </div>

        {/* Active Users & RBAC */}
        <div className="p-5 rounded-2xl glass-panel border border-purple-500/20 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">RBAC Security</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100 font-mono">
            {systemStatus?.database?.total_users || 3}
            <span className="text-xs text-slate-500 font-sans font-normal ml-2">Authorized Roles</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>Admin • Investigator • Analyst</span>
            <span className="text-[10px] font-mono text-purple-400">JWT ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Dataset Ingestion Control Center */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
              <span>SIH Investigation Database Ingestion Pipeline</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Reads and links the 9 CSV tables from your dataset archive into the unified Knowledge Graph.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSeedDataset}
              disabled={isSeeding}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-black font-extrabold text-xs transition flex items-center space-x-2 shadow-lg shadow-cyan-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Ingesting 9 CSV Tables...' : 'Seed / Re-Ingest 9 CSV Dataset'}</span>
            </button>

            <button
              onClick={handleResetGraph}
              disabled={isResetting}
              className="px-4 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-800/80 text-xs font-bold transition flex items-center space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Graph</span>
            </button>
          </div>
        </div>

        {/* 9 CSV Table Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { name: 'people.csv', desc: 'Suspects & Aliases' },
            { name: 'phones.csv', desc: 'IMEI & CDR Records' },
            { name: 'vehicles.csv', desc: 'Registrations & Models' },
            { name: 'relationships.csv', desc: 'Criminal Edges' },
            { name: 'transactions.csv', desc: 'Hawala Transfers' },
            { name: 'locations.csv', desc: 'Geo-Hotspots' },
            { name: 'court_cases.csv', desc: 'IPC Chargesheets' },
            { name: 'cluster_summaries.csv', desc: 'Syndicate Clusters' },
            { name: 'master_case_match.csv', desc: 'Cross-Case Links' },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-xs font-mono font-bold text-cyan-300">{item.name}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>

        {seedResult && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{seedResult.message}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-slate-300">
              <div>Suspects: <strong>{seedResult.stats?.people_loaded}</strong></div>
              <div>Phones: <strong>{seedResult.stats?.phones_loaded}</strong></div>
              <div>Vehicles: <strong>{seedResult.stats?.vehicles_loaded}</strong></div>
              <div>Relationships: <strong>{seedResult.stats?.relationships_loaded}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Audit Logs Table */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-2xl space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <span>Real-Time Audit & Compliance Logs</span>
          </span>
          <span className="text-xs font-mono text-slate-500">{auditLogs.length} Events Logged</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource / Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-200">{log.username}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700 text-[10px]">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-cyan-400 font-bold">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-400 truncate max-w-[260px]">{log.resource}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
