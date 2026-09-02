import React from 'react';
import { ShieldAlert, Info, Activity, GitBranch, Layers, Clock } from 'lucide-react';

const TARGET_RISK_SCORES = [
  {
    id: 'SUSP-001',
    name: 'Vikram Malhotra',
    alias: 'Viper',
    type: 'Person',
    score: 94,
    level: 'CRITICAL PRIORITY',
    breakdown: { connectivity: 28, crossCase: 24, financial: 19, centrality: 15, recentActivity: 8 }
  },
  {
    id: 'ACC-918273',
    name: 'Bank Account 9182736450',
    alias: 'Hawala Hub',
    type: 'Financial',
    score: 88,
    level: 'HIGH PRIORITY',
    breakdown: { connectivity: 25, crossCase: 22, financial: 20, centrality: 13, recentActivity: 8 }
  },
  {
    id: 'SUSP-002',
    name: 'Suresh Kumar',
    alias: 'Chota',
    type: 'Person',
    score: 76,
    level: 'MEDIUM PRIORITY',
    breakdown: { connectivity: 22, crossCase: 18, financial: 14, centrality: 12, recentActivity: 10 }
  }
];

export default function RiskScoreMatrix() {
  return (
    <div style={{ flex: 1, height: '100%', padding: '1.5rem', overflowY: 'auto', background: 'var(--bg-primary)', color: '#f8fafc' }}>
      {/* Header Bar */}
      <div style={{ padding: '1.25rem 1.5rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Investigation Risk & Analytical Priority Matrix</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Data-driven priority ranking calculated via graph centrality, volume & cross-case links</p>
          </div>
        </div>

        {/* Disclaimer Safety Callout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.75rem', color: '#fbbf24' }}>
          <Info size={14} /> Analytical Prioritization Score (Not Determination of Guilt)
        </div>
      </div>

      {/* Target Scores Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {TARGET_RISK_SCORES.map((target) => (
          <div
            key={target.id}
            style={{
              padding: '1.25rem',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              display: 'grid',
              gridTemplateColumns: '250px 1fr 180px',
              gap: '1.5rem',
              alignItems: 'center'
            }}
          >
            {/* Target Identity */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>{target.type} Target</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.2rem 0', color: '#f8fafc' }}>{target.name}</h3>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Alias: {target.alias} • ID: {target.id}</div>
            </div>

            {/* Score Component Breakdown Progress Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1' }}>
                <span>Network Connectivity (30%)</span>
                <strong>{target.breakdown.connectivity}/30</strong>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(target.breakdown.connectivity / 30) * 100}%`, height: '100%', background: '#00f2fe' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1' }}>
                <span>Cross-Case Association (25%)</span>
                <strong>{target.breakdown.crossCase}/25</strong>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(target.breakdown.crossCase / 25) * 100}%`, height: '100%', background: '#8b5cf6' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1' }}>
                <span>Transaction & Hawala Activity (20%)</span>
                <strong>{target.breakdown.financial}/20</strong>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(target.breakdown.financial / 20) * 100}%`, height: '100%', background: '#f59e0b' }} />
              </div>
            </div>

            {/* Large Score Dial Badge */}
            <div style={{ textAlign: 'center', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: target.score >= 85 ? '#ef4444' : '#f59e0b' }}>
                {target.score}<span style={{ fontSize: '1rem', color: '#94a3b8' }}>/100</span>
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: target.score >= 85 ? '#f87171' : '#fbbf24', marginTop: '0.2rem' }}>
                {target.level}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
