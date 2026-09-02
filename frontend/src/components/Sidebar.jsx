import React from 'react';
import { 
  LayoutDashboard, FileText, Network, Map, GitBranch, 
  Bot, BarChart3, Upload, CheckCircle2, ShieldAlert
} from 'lucide-react';

const ROLE_MENUS = {
  INVESTIGATOR: [
    {
      title: 'TACTICAL OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Investigation Workspace', icon: <LayoutDashboard size={18} /> },
        { id: 'cases', label: 'Active Case Dossiers', icon: <FileText size={18} /> },
        { id: 'network', label: 'Network & Path Finder', icon: <Network size={18} /> },
        { id: 'verification', label: 'Lead Verification', icon: <CheckCircle2 size={18} /> },
      ]
    },
    {
      title: 'AI ASSISTANT',
      items: [
        { id: 'copilot', label: 'Investigation Copilot', icon: <Bot size={18} /> },
        { id: 'brief', label: 'Smart Case Briefs', icon: <FileText size={18} /> },
      ]
    }
  ],
  ANALYST: [
    {
      title: 'STRATEGIC INTELLIGENCE',
      items: [
        { id: 'map', label: 'Crime Intelligence Map', icon: <Map size={18} /> },
        { id: 'crosscase', label: 'Cross-Case Network', icon: <GitBranch size={18} /> },
        { id: 'priority', label: 'Centrality & Priority', icon: <BarChart3 size={18} /> },
      ]
    },
    {
      title: 'ANALYTICS',
      items: [
        { id: 'network', label: 'Full Network Explore', icon: <Network size={18} /> },
      ]
    }
  ],
  ADMIN: [
    {
      title: 'SYSTEM OPERATIONS',
      items: [
        { id: 'ingest', label: 'Data Ingestion Engine', icon: <Upload size={18} /> },
        { id: 'audit', label: 'Audit Trail & Logs', icon: <ShieldAlert size={18} /> },
      ]
    }
  ]
};

export default function Sidebar({ currentRole, activeTab, setActiveTab }) {
  const currentMenu = ROLE_MENUS[currentRole] || ROLE_MENUS.INVESTIGATOR;

  return (
    <aside className="app-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
      <div style={{ flex: 1, padding: '1.25rem 1rem', overflowY: 'auto' }}>
        {currentMenu.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: '1.75rem' }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#6b7280',
              marginBottom: '0.75rem',
              paddingLeft: '0.75rem',
              letterSpacing: '0.05em'
            }}>
              {group.title}
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: isActive ? '#f8fafc' : '#9ca3af',
                      border: '1px solid',
                      borderColor: isActive ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: isActive ? 600 : 500,
                      transition: 'all 0.15s ease',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#9ca3af';
                      }
                    }}
                  >
                    <div style={{ color: isActive ? '#818cf8' : '#6b7280' }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: '0.85rem' }}>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0, 0, 0, 0.2)' }}>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
          SIH 2026 Core Platform v2.0
          <br />
          Data Integrity: VERIFIED
        </div>
      </div>
    </aside>
  );
}
