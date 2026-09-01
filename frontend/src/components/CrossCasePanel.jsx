import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  GitBranch, 
  ShieldAlert, 
  Users, 
  Building2, 
  PhoneCall, 
  ArrowRight, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

const STATIC_SCENARIOS = [
  {
    id: 'XC-001',
    title: 'Shared Shell Company: Apex Global Logistics',
    type: 'Financial Conduit',
    cases: ['Case 101 (Robbery)', 'Case 105 (Hawala)'],
    description: 'Beneficial owner Ravi Kumar (P001) laundered extortion proceeds from Case 101 through Apex Global accounts seized in Case 105.',
    entityId: 'O001',
    priority: 'HIGH',
  },
  {
    id: 'XC-002',
    title: 'Burner Phone Bridge: +91-98110-99999',
    type: 'Communication Nexus',
    cases: ['Case 102 (Cyber Fraud)', 'Case 103 (Arms)'],
    description: 'Unregistered burner phone in frequent contact with Vikram Singh (102) and Suresh Yadav (103) before the arms consignment transit.',
    entityId: 'P011',
    priority: 'CRITICAL',
  },
  {
    id: 'XC-003',
    title: 'High-Betweenness Bridge: Vikram Singh',
    type: 'Key Coordinator',
    cases: ['Case 101', 'Case 102', 'Case 103'],
    description: 'Vikram Singh links armed robbery muscle, cyber fraud servers, and arms logistics — identified as the syndicate broker.',
    entityId: 'P002',
    priority: 'CRITICAL',
  },
];

export default function CrossCasePanel({
  onFocusEntity = () => {},
}) {
  const [centralityData, setCentralityData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCentrality = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/graph/centrality');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setCentralityData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch centrality:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCentrality();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <GitBranch size={22} color="#f59e0b" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              Cross-Case Link & Syndicate Detection Center
            </h2>
          </div>
          <p style={{ color: '#d1d5db', fontSize: '0.85rem' }}>
            Automated graph analytics uncovering bridge suspects, shared front companies, and communication overlaps across independent FIRs.
          </p>
        </div>

        <button
          onClick={fetchCentrality}
          className="btn-primary"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Two-Column Grid: Centrality Rankings vs Active Scenarios */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.25rem' }}>
        {/* Left: Ranked Bridge Suspects */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Users size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Top Cross-Case Bridge Suspects</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {centralityData.map((item, idx) => (
              <div
                key={item.entity_id || idx}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  background: idx === 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: idx === 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <strong style={{ color: idx === 0 ? '#fbbf24' : '#e5e7eb', fontSize: '0.9rem' }}>
                      {item.name}
                    </strong>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', fontSize: '0.7rem' }}>
                      {item.entity_id}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                    Connected across Cases: <strong style={{ color: '#a5b4fc' }}>{item.cases?.join(', ')}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>
                      {item.cross_case_degree}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase' }}>Cases</div>
                  </div>

                  <button
                    onClick={() => onFocusEntity(item.entity_id)}
                    className="btn-primary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    title="Focus in Knowledge Graph"
                  >
                    <span>Inspect</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detected Cross-Case Scenarios */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Sparkles size={18} color="#f59e0b" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>High-Priority Investigation Scenarios</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {STATIC_SCENARIOS.map((sc) => (
              <div
                key={sc.id}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.2rem' }}>
                      {sc.title}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 500 }}>
                      {sc.type} • {sc.cases.join(' ↔ ')}
                    </span>
                  </div>
                  <span className={`badge ${sc.priority === 'CRITICAL' ? 'badge-danger' : 'badge-lead'}`}>
                    {sc.priority}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.4 }}>
                  {sc.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <button
                    onClick={() => onFocusEntity(sc.entityId)}
                    className="btn-primary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                  >
                    <span>Highlight Syndicate Chain</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
