import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Key, FileText, Activity, Server, AlertTriangle, 
  CheckCircle2, XCircle, Search, RefreshCw, Lock, Database, ArrowUpRight, 
  Clock, ShieldAlert, Cpu, HardDrive, Terminal
} from 'lucide-react';
import { getAdminData } from '../data/mockService.js';
import { useInvestigation } from '../context/InvestigationContext.jsx';

export default function AdminDashboard() {
  const { setActiveTab } = useInvestigation();
  const [adminData, setAdminData] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [usersList, setUsersList] = useState([]);
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getAdminData().then(res => {
      if (res?.data) {
        setAdminData(res.data);
        setUsersList(res.data.users || []);
      }
    });
  }, []);

  const toggleUserStatus = (userId) => {
    setUsersList(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE' }
        : u
    ));
  };

  if (!adminData) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D9AA3D' }}>
        Initializing Command Center System Console...
      </div>
    );
  }

  const { system_overview, access_control, audit_logs, data_sources } = adminData;

  const filteredLogs = (audit_logs || []).filter(l => {
    if (auditFilter !== 'ALL' && l.severity !== auditFilter) return false;
    if (searchQuery && !l.detail.toLowerCase().includes(searchQuery.toLowerCase()) && !l.user.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{
      flex: 1,
      height: '100%',
      overflowY: 'auto',
      padding: '1.75rem',
      background: 'transparent',
      color: '#F1EBDD',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Top Banner - Command Center Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20,28,24,0.98) 0%, rgba(13,18,15,0.98) 100%)',
        border: '1px solid rgba(217,170,61,0.3)',
        borderRadius: '12px',
        padding: '1.25rem 1.75rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(217,170,61,0.18)', color: '#D9AA3D' }}>
              <Shield size={22} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#F1EBDD', letterSpacing: '0.02em' }}>
              COMMAND CENTER — SYSTEM & SECURITY CONTROL
            </h1>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              background: 'rgba(94,159,104,0.2)',
              border: '1px solid rgba(94,159,104,0.45)',
              color: '#4ADE80',
            }}>
              ROLE: ADMIN OVERSIGHT
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#A6B0AA' }}>
            Global platform governance, RBAC access policies, audit event trails, and forensic data pipeline integrity.
          </p>
        </div>

        {/* Quick System Health Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.4)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px #4ADE80' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F1EBDD' }}>{system_overview.system_health}</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6C7A73' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: '#D9AA3D', fontWeight: 600 }}>Latency: {system_overview.api_latency_ms}ms</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: '0.75rem',
      }}>
        {[
          { id: 'overview', label: 'System Overview & Services', icon: Activity },
          { id: 'users', label: 'User & Role Management', icon: Users },
          { id: 'access', label: 'Access Control & RBAC', icon: Key },
          { id: 'audit', label: 'Audit & Security Logs', icon: FileText },
          { id: 'sources', label: 'Data Source Governance', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                background: isActive ? 'rgba(217,170,61,0.2)' : 'rgba(255,255,255,0.03)',
                border: '1px solid',
                borderColor: isActive ? 'rgba(217,170,61,0.5)' : 'rgba(255,255,255,0.08)',
                color: isActive ? '#F1EBDD' : '#A6B0AA',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} color={isActive ? '#D9AA3D' : '#A6B0AA'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: SYSTEM OVERVIEW & SERVICES */}
      {activeSection === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Key Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(17,24,21,0.85)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: '#6C7A73', textTransform: 'uppercase', fontWeight: 700 }}>Total Authorized Personnel</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#F1EBDD', marginTop: '0.3rem' }}>{system_overview.total_users}</div>
              <div style={{ fontSize: '0.72rem', color: '#4ADE80', marginTop: '0.2rem' }}>14 Active • 4 Viewers</div>
            </div>
            <div style={{ background: 'rgba(17,24,21,0.85)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: '#6C7A73', textTransform: 'uppercase', fontWeight: 700 }}>Active Investigations</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#D9AA3D', marginTop: '0.3rem' }}>{system_overview.active_investigations} Cases</div>
              <div style={{ fontSize: '0.72rem', color: '#A6B0AA', marginTop: '0.2rem' }}>Case 101, 102, 103 under focus</div>
            </div>
            <div style={{ background: 'rgba(17,24,21,0.85)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: '#6C7A73', textTransform: 'uppercase', fontWeight: 700 }}>Data Ingestion Feeds</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#4ECDC4', marginTop: '0.3rem' }}>{system_overview.data_sources_ingested} Synchronized</div>
              <div style={{ fontSize: '0.72rem', color: '#A6B0AA', marginTop: '0.2rem' }}>FIR, CDR, Bank, Intel</div>
            </div>
            <div style={{ background: 'rgba(17,24,21,0.85)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: '#6C7A73', textTransform: 'uppercase', fontWeight: 700 }}>Encrypted Local Storage</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#818CF8', marginTop: '0.3rem' }}>{system_overview.storage_used_mb} MB</div>
              <div style={{ fontSize: '0.72rem', color: '#A6B0AA', marginTop: '0.2rem' }}>of {system_overview.storage_capacity_mb} MB allocated</div>
            </div>
          </div>

          {/* Micro-Services Health Monitor */}
          <div style={{ background: 'rgba(17,24,21,0.85)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#D9AA3D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={18} /> Core Forensic Engine Services Health
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {system_overview.services.map((srv, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#F1EBDD' }}>{srv.name}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#4ADE80', background: 'rgba(94,159,104,0.15)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      {srv.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6C7A73' }}>
                    <span>Engine: {srv.version}</span>
                    <span style={{ color: '#D9AA3D' }}>Response: {srv.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: USER & ROLE MANAGEMENT */}
      {activeSection === 'users' && (
        <div style={{ background: 'rgba(17,24,21,0.85)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F1EBDD' }}>Personnel & Role Authorization Directory</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#A6B0AA' }}>Assign law enforcement privileges, department affiliations, and authentication states.</p>
            </div>
            <span style={{ fontSize: '0.75rem', background: 'rgba(217,170,61,0.15)', color: '#D9AA3D', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 700 }}>
              {usersList.length} Registered Officers
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#6C7A73', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Officer / Badge</th>
                  <th style={{ padding: '0.75rem' }}>Department</th>
                  <th style={{ padding: '0.75rem' }}>System Role</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Last Active</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 800, color: '#F1EBDD' }}>{user.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6C7A73', fontFamily: 'monospace' }}>{user.badge} • {user.email}</div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#C5CDC8' }}>{user.department}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800,
                        background: user.role === 'ADMIN' ? 'rgba(214,40,40,0.2)' : user.role === 'INVESTIGATOR' ? 'rgba(217,170,61,0.2)' : 'rgba(99,102,241,0.2)',
                        color: user.role === 'ADMIN' ? '#FF6B6B' : user.role === 'INVESTIGATOR' ? '#D9AA3D' : '#A5B4FC',
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700,
                        color: user.status === 'ACTIVE' ? '#4ADE80' : '#A6B0AA',
                      }}>
                        ● {user.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#6C7A73', fontSize: '0.76rem' }}>{user.last_active}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: user.status === 'ACTIVE' ? 'rgba(214,40,40,0.3)' : 'rgba(94,159,104,0.3)',
                          background: user.status === 'ACTIVE' ? 'rgba(214,40,40,0.1)' : 'rgba(94,159,104,0.1)',
                          color: user.status === 'ACTIVE' ? '#FF6B6B' : '#4ADE80',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {user.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: ACCESS CONTROL & RBAC */}
      {activeSection === 'access' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(17,24,21,0.85)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#F1EBDD' }}>
              Role-Based Access Control (RBAC) Policies
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {access_control.map((rbac, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontWeight: 900, fontSize: '1rem', color: '#D9AA3D' }}>{rbac.role}</span>
                    <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: rbac.lead_signoff ? 'rgba(94,159,104,0.15)' : 'rgba(255,255,255,0.05)', color: rbac.lead_signoff ? '#4ADE80' : '#6C7A73' }}>
                      {rbac.lead_signoff ? 'Lead Sign-off: AUTHORIZED' : 'Lead Sign-off: RESTRICTED'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#A6B0AA', lineHeight: 1.45, marginBottom: '0.85rem' }}>{rbac.description}</p>
                  <div style={{ fontSize: '0.74rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem' }}>
                    <div style={{ color: '#6C7A73' }}>Jurisdiction: <strong style={{ color: '#F1EBDD' }}>{rbac.cases_access}</strong></div>
                    <div style={{ color: '#6C7A73', marginTop: '0.2rem' }}>Datasets: <strong style={{ color: '#F1EBDD' }}>{rbac.data_sources}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: AUDIT & SECURITY LOGS */}
      {activeSection === 'audit' && (
        <div style={{ background: 'rgba(17,24,21,0.85)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F1EBDD' }}>Forensic Audit & Evidentiary Chain Ledger</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#A6B0AA' }}>Immutable event trail tracking authentication, data ingestion, query operations, and lead verifications.</p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F1EBDD', fontSize: '0.78rem', outline: 'none' }}
              />
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F1EBDD', fontSize: '0.78rem' }}
              >
                <option value="ALL">All Events</option>
                <option value="NORMAL">Normal</option>
                <option value="INFO">Info</option>
                <option value="WARNING">Security Warnings</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {filteredLogs.map(log => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  background: log.severity === 'WARNING' ? 'rgba(214,40,40,0.12)' : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${log.severity === 'WARNING' ? 'rgba(214,40,40,0.35)' : 'rgba(255,255,255,0.06)'}`,
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#D9AA3D', fontWeight: 700 }}>{log.timestamp}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: '#F1EBDD' }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#A6B0AA' }}>{log.user}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: log.severity === 'WARNING' ? '#FFA726' : '#C5CDC8' }}>
                    {log.detail}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.7rem', color: '#6C7A73', fontFamily: 'monospace' }}>IP: {log.ip}</div>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 800,
                    color: log.severity === 'WARNING' ? '#FF6B6B' : log.severity === 'INFO' ? '#4ECDC4' : '#4ADE80',
                  }}>
                    {log.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: DATA SOURCE GOVERNANCE */}
      {activeSection === 'sources' && (
        <div style={{ background: 'rgba(17,24,21,0.85)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F1EBDD' }}>Data Ingestion & Integrity Verification</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#A6B0AA' }}>Active ingestion feeds, cryptographic checksums, and synchronization status.</p>
            </div>
            <button
              onClick={() => setActiveTab('ingest')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '6px',
                background: '#D9AA3D',
                border: 'none',
                color: '#0B100D',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Open Ingestion Engine
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {data_sources.map(src => (
              <div key={src.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#F1EBDD' }}>{src.name}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#4ADE80', background: 'rgba(94,159,104,0.15)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    {src.sync}
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#A6B0AA', marginBottom: '0.5rem' }}>{src.type} • {src.count}</div>
                <div style={{ fontSize: '0.68rem', color: '#6C7A73', fontFamily: 'monospace', wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', padding: '0.4rem', borderRadius: '4px' }}>
                  SHA-256: {src.hash}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
