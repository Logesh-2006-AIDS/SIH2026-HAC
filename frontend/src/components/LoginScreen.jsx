import React, { useState } from 'react';
import { Shield, Lock, BadgeCheck, Sparkles, UserCheck, ArrowRight } from 'lucide-react';
import axios from 'axios';

/**
 * Investigator login — supporting instant one-click Demo login
 */
export default function LoginScreen({ onAuthenticated }) {
  const [username, setUsername] = useState('investigator@police.gov.in');
  const [password, setPassword] = useState('investigator123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loginWithRole = (role = 'INVESTIGATOR') => {
    const userProfiles = {
      INVESTIGATOR: {
        id: 1,
        email: 'investigator@police.gov.in',
        full_name: 'Insp. Rajesh Vardhan',
        badge_number: 'DL-CB-9021',
        role: 'INVESTIGATOR',
        department: 'Narcotics & Special Cell, Chennai Unit',
      },
      ANALYST: {
        id: 2,
        email: 'analyst@forensics.gov.in',
        full_name: 'Dr. Priya Sankar',
        badge_number: 'INT-908',
        role: 'ANALYST',
        department: 'Criminal Intelligence & Analytics Wing',
      },
      ADMIN: {
        id: 3,
        email: 'admin@police.gov.in',
        full_name: 'Superintendent K. Rao',
        badge_number: 'HQ-001',
        role: 'ADMIN',
        department: 'State Crime Records Bureau',
      },
    };

    const demoUser = userProfiles[role] || userProfiles.INVESTIGATOR;
    localStorage.setItem('sih_token', 'demo-token');
    localStorage.setItem('sih_user', JSON.stringify(demoUser));
    onAuthenticated(demoUser);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Instantly detect role from username in demo mode
    let targetRole = 'INVESTIGATOR';
    const lower = (username || '').toLowerCase();
    if (lower.includes('analyst')) targetRole = 'ANALYST';
    else if (lower.includes('admin')) targetRole = 'ADMIN';

    // Log in immediately without backend lag
    loginWithRole(targetRole);
    setLoading(false);
  };

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 20%, #1a1510 0%, #080a08 70%)', color: '#F1EBDD',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div className="forensic-panel" style={{
        width: 420, maxWidth: '92vw', padding: '2rem', border: '1px solid rgba(217,170,61,0.4)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'linear-gradient(135deg,#d9aa3d,#8a6515)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000',
          }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.05rem', letterSpacing: '0.06em', color: '#F1EBDD' }}>
              HOUSE TARGARYEN
            </div>
            <div style={{ fontSize: '0.74rem', color: '#D9AA3D', fontWeight: 700 }}>
              AI Criminal Network Analysis Platform • SIH26189
            </div>
          </div>
        </div>

        {/* Quick Demo Access Bar */}
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.85rem',
          borderRadius: '8px',
          background: 'rgba(217, 170, 61, 0.1)',
          border: '1px solid rgba(217, 170, 61, 0.3)',
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D9AA3D', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={13} /> One-Click Demo Mode Access
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => loginWithRole('INVESTIGATOR')}
              style={{
                padding: '0.5rem 0.3rem',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #D62828 0%, #A31B1B 100%)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
              }}
            >
              <UserCheck size={12} /> Investigator
            </button>
            <button
              type="button"
              onClick={() => loginWithRole('ANALYST')}
              style={{
                padding: '0.5rem 0.3rem',
                borderRadius: '6px',
                background: 'rgba(217,170,61,0.2)',
                border: '1px solid rgba(217,170,61,0.4)',
                color: '#D9AA3D',
                fontWeight: 700,
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
              }}
            >
              Analyst
            </button>
            <button
              type="button"
              onClick={() => loginWithRole('ADMIN')}
              style={{
                padding: '0.5rem 0.3rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#F1EBDD',
                fontWeight: 700,
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
              }}
            >
              Admin Control
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0', color: '#6C7A73', fontSize: '0.7rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span>OR SIGN IN WITH CREDENTIALS</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Badge / Email</label>
          <div style={inputWrap}>
            <BadgeCheck size={14} color="#D9AA3D" />
            <input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} autoComplete="username" />
          </div>

          <label style={labelStyle}>Password</label>
          <div style={inputWrap}>
            <Lock size={14} color="#D9AA3D" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="current-password" />
          </div>

          {error && <div style={{ color: '#f87171', fontSize: '0.78rem', marginBottom: 12 }}>{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 10, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Authenticating…' : 'Enter Secure Workspace'}
          </button>
        </form>

        <div style={{ marginTop: 14, fontSize: '0.68rem', color: '#6C7A73', lineHeight: 1.5, textAlign: 'center' }}>
          SIH 2026 • AI-Powered Criminal Network Analysis Platform • House Targaryen
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.7rem', color: '#A6B0AA', fontWeight: 700,
  letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4,
};

const inputWrap = {
  display: 'flex', alignItems: 'center', gap: 8,
  background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(217,170,61,0.25)',
  borderRadius: 8, padding: '0.5rem 0.75rem', marginBottom: 12,
};

const inputStyle = {
  background: 'transparent', border: 'none', color: '#F1EBDD',
  fontSize: '0.85rem', width: '100%', outline: 'none',
};
