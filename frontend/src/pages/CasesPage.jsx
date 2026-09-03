import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Search,
  Filter,
  ArrowRight,
  Shield,
  Calendar,
  MapPin,
  Hash,
  User,
  Plus,
  Download
} from 'lucide-react';

export default function CasesPage({ onSelectCase, onNavigateToWorkbench, onNavigateToIngestion }) {
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterCrime, setFilterCrime] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch('/api/v1/cases/');
        if (res.ok) {
          const data = await res.json();
          setCases(data);
        }
      } catch (err) {
        console.error('Error fetching cases:', err);
      }
    };
    fetchCases();
  }, []);

  // Filter & Sort cases
  const filteredCases = cases.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchFir = c.fir_number?.toLowerCase().includes(q);
      const matchLoc = c.police_station?.toLowerCase().includes(q);
      if (!matchTitle && !matchFir && !matchLoc) return false;
    }
    if (filterDistrict !== 'ALL' && !c.police_station?.includes(filterDistrict)) return false;
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-red-900/40 bg-gradient-to-r from-red-950/40 via-black to-black shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-600/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Case Investigation Registry</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-semibold font-mono">
                POLICE DOCKETS
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage FIR records, search legal sections, filter cross-jurisdiction cases, and launch workbench.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToIngestion}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-red-900/30 border border-red-500/40"
        >
          <Plus className="w-4 h-4" />
          <span>Upload & Ingest New FIR</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="flex items-center space-x-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-cyan-400" />
          <input
            type="text"
            placeholder="Search by FIR number, suspect, or crime..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none w-full font-mono"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="bg-slate-900 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none font-medium"
          >
            <option value="ALL">All Districts</option>
            <option value="Delhi">Delhi NCR</option>
            <option value="Rohini">Rohini Sector</option>
            <option value="Crime Branch">Crime Branch</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PROCESSED">Processed</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none font-medium"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCases.map((c) => (
          <div
            key={c.case_id}
            className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-cyan-500/40 shadow-xl space-y-4 transition flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-cyan-400 border border-slate-700 font-bold">
                  {c.fir_number || c.case_id}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  {c.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-100 line-clamp-2">{c.title}</h3>

              <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{c.police_station || 'Delhi Crime Branch'}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="flex items-center space-x-1 font-mono text-cyan-400">
                <User className="w-3.5 h-3.5" />
                <span>{c.entities_count || 6} Linked Entities</span>
              </span>

              <button
                onClick={() => onNavigateToWorkbench(c.case_id)}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold text-xs transition flex items-center space-x-1 shadow"
              >
                <span>Launch Workbench</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
