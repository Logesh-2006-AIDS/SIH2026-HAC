import React, { useState, useEffect } from 'react';
import { Settings, Shield, Sliders, Bell, Laptop, Lock, CheckCircle2 } from 'lucide-react';

export default function SettingsPage({ currentUser }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/v1/system/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Settings fetch error:', err);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-slate-700/80 bg-gradient-to-r from-slate-800/40 via-slate-900 to-slate-900">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-lg">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Platform & Departmental Settings</span>
            </h1>
            <p className="text-xs text-slate-400">
              Configure system parameters, security policies, NLP confidence thresholds, and Cytoscape physics engine.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Active Officer Profile</span>
          </h3>

          <div className="space-y-2.5 font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400">OFFICER NAME:</span>
              <strong className="text-slate-100">{currentUser?.full_name || 'Senior IO Rajesh Varma'}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400">DESIGNATED ROLE:</span>
              <strong className="text-cyan-400 uppercase">{currentUser?.role || 'INVESTIGATOR'}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400">SESSION EXPIRY:</span>
              <span className="text-emerald-400">24 Hours (JWT Active)</span>
            </div>
          </div>
        </div>

        {/* Security Policies */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Lock className="w-4 h-4 text-purple-400" />
            <span>Security & Cryptography</span>
          </h3>

          <div className="space-y-2.5 font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400">FILE INTEGRITY PROTOCOL:</span>
              <strong className="text-purple-300">SHA-256 Mandatory</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400">AUDIT LOGGING:</span>
              <strong className="text-emerald-400">Immutable Relational Store</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400">TWO-FACTOR AUTH:</span>
              <strong className="text-cyan-400">Enabled</strong>
            </div>
          </div>
        </div>

        {/* NLP Extraction Thresholds */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Legal NLP Engine Configuration</span>
          </h3>

          <div className="space-y-2.5 font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400">NER CONFIDENCE CUTOFF:</span>
              <strong className="text-amber-400">85% Minimum</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400">HUMAN VERIFICATION:</span>
              <strong className="text-cyan-400">Enforced for Trial Evidence</strong>
            </div>
          </div>
        </div>

        {/* Graph Engine Specs */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Laptop className="w-4 h-4 text-emerald-400" />
            <span>Graph Rendering Specs</span>
          </h3>

          <div className="space-y-2.5 font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400">VISUALIZER ENGINE:</span>
              <strong className="text-slate-200">Cytoscape.js + CoSE</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400">DATABASE BACKEND:</span>
              <strong className="text-emerald-400">Neo4j Bolt + Polyglot Store</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
