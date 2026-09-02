import React from 'react';
import { 
  LayoutDashboard, FileText, Network, Map, GitBranch, 
  Bot, BarChart3, Upload, CheckCircle2, ShieldAlert, ShieldCheck
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
    <aside className="app-sidebar">
      <div style={{ flex: 1, padding: '1.25rem 1rem', overflowY: 'auto' }}>
        {currentMenu.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: '1.75rem' }}>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#6C7A73',
                marginBottom: '0.65rem',
                paddingLeft: '0.75rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>{group.title}</span>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
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
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(217, 170, 61, 0.18) 0%, rgba(214, 40, 40, 0.1) 100%)'
                        : 'transparent',
                      color: isActive ? '#F1EBDD' : '#A6B0AA',
                      border: '1px solid',
                      borderColor: isActive ? 'rgba(217, 170, 61, 0.45)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: isActive ? 700 : 500,
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      width: '100%',
                      position: 'relative',
                      boxShadow: isActive ? '0 4px 14px rgba(217, 170, 61, 0.15)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(216, 197, 138, 0.06)';
                        e.currentTarget.style.color = '#F1EBDD';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#A6B0AA';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    {isActive && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '20%',
                          bottom: '20%',
                          width: '3px',
                          borderRadius: '0 4px 4px 0',
                          background: '#D62828', // Red investigation string line
                          boxShadow: '0 0 8px #D62828',
                        }}
                      />
                    )}
                    <div style={{ color: isActive ? '#D9AA3D' : '#6C7A73', transition: 'color 0.2s ease' }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: '0.86rem' }}>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Security Footer Badge */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'rgba(8, 10, 9, 0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.73rem', color: '#5E9F68', fontWeight: 700 }}>
          <ShieldCheck size={14} />
          <span>Evidence Chain: VERIFIED</span>
        </div>
        <div style={{ fontSize: '0.68rem', color: '#6C7A73', textAlign: 'center', marginTop: '0.2rem' }}>
          SIH 2026 Forensic Console v3.0
        </div>
      </div>
    </aside>
  );
}
