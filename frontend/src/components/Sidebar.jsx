import React from 'react';
import { 
  Pin, LayoutDashboard, FileText, Network, Map, GitBranch, 
  Bot, BarChart3, Upload, CheckCircle2, Shield, ShieldAlert, ShieldCheck,
  AlertTriangle, Sparkles, Route, Database, Search
} from 'lucide-react';

const ROLE_MENUS = {
  INVESTIGATOR: [
    {
      title: 'INVESTIGATION',
      items: [
        { id: 'dashboard', label: 'Criminal Pinboard', icon: <Pin size={18} /> },
        { id: 'cases', label: 'Active Case Dossiers', icon: <FileText size={18} /> },
        { id: 'ingest', label: 'Evidence Ingestion', icon: <Upload size={18} /> },
      ]
    },
    {
      title: 'NETWORK INTELLIGENCE',
      items: [
        { id: 'network', label: 'Knowledge Graph', icon: <Network size={18} /> },
        { id: 'keyentities', label: 'Key & Bridge Entities', icon: <BarChart3 size={18} /> },
        { id: 'crosscase', label: 'Cross-Case Network', icon: <GitBranch size={18} /> },
        { id: 'pathfinder', label: 'Red-String Path Finder', icon: <Route size={18} /> },
      ]
    },
    {
      title: 'AI FORENSIC INTELLIGENCE',
      items: [
        { id: 'patterns', label: 'Suspicious Patterns', icon: <AlertTriangle size={18} /> },
        { id: 'nlp', label: 'AI/NLP Entity Extraction', icon: <Sparkles size={18} /> },
        { id: 'copilot', label: 'AI Investigation Copilot', icon: <Bot size={18} /> },
        { id: 'leads', label: 'Actionable Leads', icon: <CheckCircle2 size={18} /> },
      ]
    },
    {
      title: 'CASE RECORDS & REPORTS',
      items: [
        { id: 'investigation', label: 'Case Workspace', icon: <Database size={18} /> },
        { id: 'report', label: 'Investigation Report', icon: <FileText size={18} /> },
      ]
    }
  ]
};

export default function Sidebar({ currentRole, activeTab, setActiveTab }) {
  const currentMenu = ROLE_MENUS.INVESTIGATOR;

  return (
    <aside className="app-sidebar">
      <div style={{ flex: 1, padding: '1.25rem 1rem', overflowY: 'auto' }}>
        {currentMenu.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: '#6C7A73',
                marginBottom: '0.55rem',
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
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
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
                      padding: '0.6rem 0.85rem',
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
                    <div style={{ color: isActive ? '#D9AA3D' : '#6C7A73', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center' }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: '0.84rem' }}>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Security Footer Badge */}
      <div style={{ padding: '0.85rem 1.15rem', borderTop: '1px solid var(--border-color)', background: 'rgba(8, 10, 9, 0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#4ADE80', fontWeight: 700 }}>
          <ShieldCheck size={14} />
          <span>Evidence Chain: VERIFIED</span>
        </div>
        <div style={{ fontSize: '0.65rem', color: '#6C7A73', textAlign: 'center', marginTop: '0.2rem' }}>
          SIH 2026 Forensic Console • Demo
        </div>
      </div>
    </aside>
  );
}
