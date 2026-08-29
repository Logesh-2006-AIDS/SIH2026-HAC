import React, { useEffect, useState } from 'react';
import { Shield, Activity, Bell, UserCheck, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function Header() {
  const [health, setHealth] = useState({ status: 'checking', services: {} });

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await axios.get('/api/v1/health');
        setHealth(res.data);
      } catch (err) {
        setHealth({ status: 'offline', services: {} });
      }
    };
    fetchHealth();
  }, []);

  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)'
        }}>
          <Shield size={20} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 600, color: '#f3f4f6', letterSpacing: '-0.01em' }}>
            CRIMINAL NETWORK INTELLIGENCE PLATFORM
          </h1>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            SIH 2026 • Authorized Investigation Workspace
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* System Health Badge */}
        <div className={`badge ${health.status === 'healthy' ? 'badge-healthy' : health.status === 'degraded' ? 'badge-lead' : 'badge-danger'}`}>
          <Activity size={12} />
          <span>Core API: {health.status}</span>
        </div>

        {/* Investigator Profile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.35rem 0.75rem',
          borderRadius: 8,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-color)'
        }}>
          <UserCheck size={16} color="#6366f1" />
          <div style={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
            <div style={{ fontWeight: 500, color: '#e5e7eb' }}>Insp. R. Vardhan</div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Lead Investigator</div>
          </div>
        </div>
      </div>
    </header>
  );
}
