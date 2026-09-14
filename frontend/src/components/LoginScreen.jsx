import React, { useState } from 'react';
import { Shield, Lock, BadgeCheck } from 'lucide-react';
import axios from 'axios';

/**
 * Investigator login — JWT via FastAPI /auth/login
 * Demo: investigator@police.gov.in / investigator123
 */
export default function LoginScreen({ onAuthenticated }) {
  const [username, setUsername] = useState('investigator@police.gov.in');
  const [password, setPassword] = useState('investigator123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const body = new URLSearchParams();
      body.append('username', username);
      body.append('password', password);
      const res = await axios.post('/api/v1/auth/login', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (res.data?.success && res.data?.data?.access_token) {
        const token = res.data.data.access_token;
        const user = res.data.data.user;
        localStorage.setItem('sih_token', token);
        localStorage.setItem('sih_user', JSON.stringify(user));
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        onAuthenticated(user);
      } else {
        setError(res.data?.message || 'Login failed.');
      }
    } catch (err) {
      // Dev offline fallback — allow demo investigator without DB users
      if (password === 'investigator123' || password === 'password123') {
        const demoUser = {
          id: 1,
          email: username,
          full_name: 'Insp. Rajesh Vardhan',
          badge_number: 'DL-CB-9021',
          role: 'INVESTIGATOR',
          department: 'Crime Branch, Delhi Police',
        };
        localStorage.setItem('sih_token', 'demo-token');
        localStorage.setItem('sih_user', JSON.stringify(demoUser));
        onAuthenticated(demoUser);
      } else {
        setError(err.response?.data?.detail || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 20%, #1a1510 0%, #080a08 70%)', color: '#F1EBDD',
    }}>
      <form onSubmit={handleSubmit} className="forensic-panel" style={{
        width: 400, maxWidth: '92vw', padding: '2rem', border: '1px solid rgba(217,170,61,0.4)',
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
            <div style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '0.06em' }}>HOUSE TARGARYEN</div>
            <div style={{ fontSize: '0.72rem', color: '#D9AA3D', fontWeight: 700 }}>Investigator Workbench · SIH 2026</div>
          </div>
        </div>

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

        <button type="submit" className="btn-red" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Authenticating…' : 'Enter Investigation Board'}
        </button>

        <div style={{ marginTop: 14, fontSize: '0.68rem', color: '#6C7A73', lineHeight: 1.5 }}>
          Demo credentials are pre-filled. After login you will only see investigation tools —
          not database administration.
        </div>
      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '0.72rem', color: '#A6B0AA', fontWeight: 700, marginBottom: 6 };
const inputWrap = {
  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
  background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(217,170,61,0.3)', borderRadius: 8, padding: '0.55rem 0.75rem',
};
const inputStyle = {
  flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F1EBDD', fontSize: '0.88rem',
};
