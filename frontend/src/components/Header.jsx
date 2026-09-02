import React, { useEffect, useState } from 'react';
import { Shield, Radio, UserCheck, Lock } from 'lucide-react';
import axios from 'axios';

export default function Header({ currentRole, setCurrentRole }) {
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
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRoleColor = () => {
    if (currentRole === 'INVESTIGATOR') return '#D9AA3D'; // Gold
    if (currentRole === 'ANALYST') return '#5E9F68';      // Verified Green
    return '#D62828';                                    // Red
  };

  return (
    <header className="top-header">
      {/* Brand & Platform Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          className="animate-pulse-glow"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #D9AA3D 0%, #B8860B 50%, #D62828 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(217, 170, 61, 0.35)',
            border: '1px solid rgba(255, 235, 170, 0.3)',
          }}
        >
          <Shield size={22} color="#1a1708" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#F1EBDD', letterSpacing: '-0.01em' }}>
              CRIMINAL NETWORK INTELLIGENCE PLATFORM
            </h1>
            <span style={{
              fontSize: '0.65rem',
              padding: '0.1rem 0.45rem',
              borderRadius: '4px',
              background: 'rgba(217, 170, 61, 0.18)',
              color: '#D9AA3D',
              border: '1px solid rgba(217, 170, 61, 0.4)',
              fontWeight: 800,
              letterSpacing: '0.05em'
            }}>
              SIH 2026
            </span>
          </div>
          <span style={{ fontSize: '0.73rem', color: '#A6B0AA', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Lock size={11} color="#5E9F68" /> Digital Forensic Evidence Command Board
          </span>
        </div>
      </div>

      {/* Right Controls: System Health & Role Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* System Health Badge */}
        <div
          className={`badge ${
            health.status === 'healthy'
              ? 'badge-verified'
              : health.status === 'degraded'
              ? 'badge-warning'
              : 'badge-danger'
          }`}
          title="Live API Status Check"
        >
          <Radio size={12} className={health.status === 'healthy' ? 'animate-pulse-glow' : ''} />
          <span>Core API: {health.status.toUpperCase()}</span>
        </div>

        {/* Role Switcher Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 10,
            background: 'rgba(16, 19, 17, 0.85)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${getRoleColor()}50`,
            boxShadow: `0 0 12px ${getRoleColor()}20`,
            transition: 'all 0.2s ease',
          }}
        >
          <UserCheck size={16} color={getRoleColor()} />
          <div style={{ fontSize: '0.8rem', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.73rem', color: '#A6B0AA', fontWeight: 500 }}>Role:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#F1EBDD',
                fontWeight: 700,
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                padding: '0 0.2rem',
              }}
            >
              <option value="INVESTIGATOR" style={{ background: '#101311', color: '#D9AA3D' }}>🕵️‍♂️ Investigator</option>
              <option value="ANALYST" style={{ background: '#101311', color: '#5E9F68' }}>🧠 Analyst</option>
              <option value="ADMIN" style={{ background: '#101311', color: '#D62828' }}>⚙️ Admin</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
