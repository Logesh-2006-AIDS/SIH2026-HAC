import React from 'react';
import { 
  LayoutDashboard, 
  FolderArchive, 
  Network, 
  PlayCircle, 
  MapPin, 
  Bot, 
  FileText, 
  BookOpen, 
  ShieldAlert,
  GitMerge,
  History,
  Lock
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Main Workspace', icon: LayoutDashboard },
    { id: 'network', label: 'Network Analysis & Focus', icon: Network },
    { id: 'timeline', label: 'Timeline Replay', icon: PlayCircle, badge: 'Interactive' },
    { id: 'copilot', label: 'AI Investigation Copilot', icon: Bot, badge: 'AI' },
    { id: 'smartbrief', label: 'Smart Case Brief', icon: FileText },
    { id: 'heatmap', label: 'Investigation Heatmap', icon: MapPin },
    { id: 'riskscore', label: 'Entity Risk Scoring', icon: ShieldAlert },
    { id: 'story', label: 'Investigation Story', icon: BookOpen, badge: 'Unique' },
    { id: 'crosscase', label: 'Cross-Case Links', icon: GitMerge },
    { id: 'cases', label: 'Case Master Records', icon: FolderArchive },
    { id: 'report', label: '1-Click Report Generator', icon: FileText, highlight: true },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <aside className="app-sidebar" style={{ width: '280px', minWidth: '280px', height: '100vh', borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Operational Intelligence
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: item.highlight ? '1px solid rgba(0, 242, 254, 0.4)' : 'none',
                background: isActive 
                  ? 'rgba(0, 242, 254, 0.15)' 
                  : item.highlight 
                  ? 'rgba(0, 242, 254, 0.05)' 
                  : 'transparent',
                color: isActive ? '#00f2fe' : item.highlight ? '#38bdf8' : '#94a3b8',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Icon size={18} color={isActive ? '#00f2fe' : item.highlight ? '#38bdf8' : '#94a3b8'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.4rem',
                  borderRadius: 4,
                  background: item.badge === 'AI' ? '#8b5cf6' : item.badge === 'Unique' ? '#ec4899' : '#0284c7',
                  color: '#ffffff'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Confidentiality Footer */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(0, 0, 0, 0.3)',
        fontSize: '0.72rem',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Lock size={14} color="#00f2fe" />
        <div>
          <div style={{ fontWeight: 600, color: '#cbd5e1' }}>RESTRICTED ACCESS</div>
          <div>Law Enforcement Grade // L4</div>
        </div>
      </div>
    </aside>
  );
}
