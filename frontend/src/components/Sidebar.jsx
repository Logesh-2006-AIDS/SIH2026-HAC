import React from 'react';
import { 
  Network, 
  Search, 
  GitMerge, 
  CheckCircle2, 
  FolderArchive, 
  SlidersHorizontal,
  History,
  Lock
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Network Overview', icon: Network },
    { id: 'search', label: 'Entity Investigation', icon: Search },
    { id: 'crosscase', label: 'Cross-Case Links', icon: GitMerge, badge: 'New' },
    { id: 'verification', label: 'Lead Verification', icon: CheckCircle2, count: 4 },
    { id: 'cases', label: 'Case Master Records', icon: FolderArchive },
    { id: 'analytics', label: 'Centrality & Clusters', icon: SlidersHorizontal },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <aside className="app-sidebar">
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Navigation
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                border: 'none',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isActive ? '#818cf8' : '#9ca3af',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Icon size={18} color={isActive ? '#818cf8' : '#9ca3af'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.4rem',
                  borderRadius: 4,
                  background: '#6366f1',
                  color: '#ffffff'
                }}>
                  {item.badge}
                </span>
              )}
              {item.count && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24'
                }}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Security & Confidentiality Footer */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(0, 0, 0, 0.2)',
        fontSize: '0.72rem',
        color: '#6b7280',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Lock size={14} color="#10b981" />
        <span>Strict Law Enforcement Confidentiality • SIH 2026</span>
      </div>
    </aside>
  );
}
