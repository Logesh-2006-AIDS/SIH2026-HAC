import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { 
  Network, 
  Share2, 
  ShieldAlert, 
  Users, 
  GitBranch, 
  Database,
  ArrowRight,
  Sparkles,
  Search
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: 'Total Tracked Entities', value: '1,420', change: '+12 today', icon: Users, color: '#6366f1' },
    { label: 'Extracted Relationships', value: '3,890', change: '+45 verified', icon: Share2, color: '#06b6d4' },
    { label: 'Cross-Case Connectors', value: '18', change: '4 high priority', icon: GitBranch, color: '#f59e0b' },
    { label: 'Pending AI Leads', value: '7', change: 'Requires review', icon: ShieldAlert, color: '#ec4899' },
  ];

  const recentCases = [
    { id: 'FIR-2025-ND-101', title: 'North District Extortion & Armed Robbery Syndicate', entities: 34, status: 'Active Lead' },
    { id: 'FIR-2025-ND-102', title: 'Metro Crypto Laundering & Darknet Exchange', entities: 52, status: 'Under Review' },
    { id: 'FIR-2025-ND-105', title: 'Commercial Hawala Shell Operations (Apex Logistics)', entities: 29, status: 'Cross-Linked' },
  ];

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="main-viewport">
        <Header />
        
        <main className="content-area">
          {/* Welcome & Search Bar */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff' }}>
                  Investigation Command Center
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Analyze multi-source intelligence, trace suspect connections, and verify AI-generated network links.
                </p>
              </div>
            </div>

            {/* Quick Entity Search Box */}
            <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Search size={20} color="#818cf8" />
              <input
                type="text"
                placeholder="Search suspect name, phone number, vehicle plate (e.g. DL-01-AB-1234), or case ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit'
                }}
              />
              <button className="btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
                <Sparkles size={16} />
                <span>Deep Graph Search</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}>
            {stats.map((st, idx) => {
              const Icon = st.icon;
              return (
                <div key={idx} className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {st.label}
                    </span>
                    <div style={{
                      padding: '0.4rem',
                      borderRadius: 8,
                      background: `${st.color}20`,
                      color: st.color
                    }}>
                      <Icon size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>
                    {st.value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: st.color, fontWeight: 500 }}>
                    {st.change}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Two-Column Investigation Insights */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            {/* Active Cross-Case Intelligence Alert */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GitBranch size={20} color="#f59e0b" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Active Cross-Case Intelligence Matches</h3>
                </div>
                <span className="badge badge-lead">Requires Investigator Action</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{
                  padding: '1rem',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <strong style={{ color: '#60a5fa', fontSize: '0.9rem' }}>Apex Global Logistics Pvt Ltd</strong>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>Shared Entity</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                      Common front organization identified across <strong>FIR-2025-ND-101</strong> (Extortion) and <strong>FIR-2025-ND-105</strong> (Hawala).
                    </p>
                  </div>
                  <button className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                    <span>Inspect Graph</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div style={{
                  padding: '1rem',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <strong style={{ color: '#34d399', fontSize: '0.9rem' }}>+91-98765-43210 (Burner Phone)</strong>
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>High CDR Overlap</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                      14 voice calls exchanged between Case 102 (Cyber Fraud) ringleader and Case 103 (Arms Supply).
                    </p>
                  </div>
                  <button className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                    <span>Inspect Graph</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Cases Column */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Database size={18} color="#818cf8" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Active Case Files</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentCases.map((cs) => (
                  <div key={cs.id} style={{
                    padding: '0.75rem',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>
                        {cs.id}
                      </span>
                      <span className="badge badge-healthy" style={{ fontSize: '0.65rem' }}>
                        {cs.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#e5e7eb', marginBottom: '0.35rem' }}>
                      {cs.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                      {cs.entities} entities extracted in Knowledge Graph
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
