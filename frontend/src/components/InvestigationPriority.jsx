import React from 'react';
import { AlertTriangle, ShieldAlert, Zap, Flame, UserX, Clock, ArrowUpRight, Phone, Car } from 'lucide-react';

const PRIORITY_SUSPECTS = [
  {
    id: 'P002',
    name: 'Vikram Singh',
    alias: 'Vicky / Viper',
    threatScore: 94,
    dangerLevel: 'CRITICAL',
    flightRisk: 'HIGH',
    activeWarrants: 2,
    caseInvolvement: ['FIR-2025-ND-101', 'FIR-2025-ND-102'],
    lastLocation: 'MG Road, Gurgaon',
    vehicle: 'HR26DQ5544 (Fortuner)',
    rationale: 'Primary bridge operative connecting Delhi NCR extortion cells to Mumbai cyber syndicates. High flight risk.'
  },
  {
    id: 'P001',
    name: 'Ravi Kumar',
    alias: 'Ravan',
    threatScore: 89,
    dangerLevel: 'HIGH',
    flightRisk: 'MEDIUM',
    activeWarrants: 1,
    caseInvolvement: ['FIR-2025-ND-101'],
    lastLocation: 'Sector 7, Rohini, New Delhi',
    vehicle: 'DL01AB1234 (Creta)',
    rationale: 'Syndicate kingpin involved in armed robbery and illegal firearm possession under Section 302/307 IPC.'
  },
  {
    id: 'P004',
    name: 'Aarav Mehta',
    alias: 'AJ',
    threatScore: 82,
    dangerLevel: 'HIGH',
    flightRisk: 'SEVERE',
    activeWarrants: 1,
    caseInvolvement: ['FIR-2025-ND-102'],
    lastLocation: 'Bandra West, Mumbai',
    vehicle: 'MH02EZ9081 (Scorpio)',
    rationale: 'Key money coordinator. Manages shell company transfers and crypto remittance.'
  },
  {
    id: 'P005',
    name: 'Suresh Yadav',
    alias: 'Chota Suresh',
    threatScore: 78,
    dangerLevel: 'MEDIUM',
    flightRisk: 'MEDIUM',
    activeWarrants: 1,
    caseInvolvement: ['FIR-2025-ND-103'],
    lastLocation: 'Gomti Nagar, Lucknow',
    vehicle: 'UP32XY4411 (Bolero)',
    rationale: 'Procures country-made pistols and ammunition from eastern UP corridors.'
  }
];

export default function InvestigationPriority({ onSelectSuspect }) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-red-500/20 bg-gradient-to-r from-red-500/10 via-slate-900 to-slate-900">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/10">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Investigation Priority & Danger Matrix</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-semibold">
                URGENT APPREHENSION ALERTS
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Automated AI Threat Scoring • Flight Risk Estimation • Cross-Case Network Density
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Critical Suspects Flagged: <strong className="text-red-400">4</strong>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PRIORITY_SUSPECTS.map((suspect) => (
          <div
            key={suspect.id}
            className="p-6 rounded-2xl glass-panel border border-slate-800 hover:border-red-500/40 shadow-xl space-y-4 transition-all duration-200"
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-extrabold text-slate-100">{suspect.name}</h3>
                  <span className="text-xs text-amber-400 font-mono">(@ {suspect.alias})</span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {suspect.id} • Last Seen: <strong className="text-slate-200">{suspect.lastLocation}</strong>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-lg bg-red-950 text-red-400 border border-red-800">
                  Threat: {suspect.threatScore}/100
                </span>
              </div>
            </div>

            {/* Rationale Quote */}
            <p className="text-xs text-slate-300 italic bg-slate-900/80 p-3 rounded-xl border border-slate-800 leading-relaxed">
              "{suspect.rationale}"
            </p>

            {/* Quick Specs */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">FLIGHT RISK</span>
                <strong className="text-red-400">{suspect.flightRisk}</strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">WARRANTS</span>
                <strong className="text-amber-400">{suspect.activeWarrants} NBW</strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">CASES</span>
                <strong className="text-cyan-400">{suspect.caseInvolvement.length} FIRs</strong>
              </div>
            </div>

            {/* Associated Vehicle & Action Button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400 flex items-center space-x-1.5 font-mono">
                <Car className="w-3.5 h-3.5 text-purple-400" />
                <span>{suspect.vehicle}</span>
              </span>

              <button
                onClick={() => onSelectSuspect && onSelectSuspect(suspect)}
                className="px-3.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold transition flex items-center space-x-1"
              >
                <span>Inspect in Graph</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
