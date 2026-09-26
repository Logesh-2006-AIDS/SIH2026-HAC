import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, User, Phone, Building2, CreditCard, ExternalLink, 
  TrendingUp, ChevronRight, Shield, Award, Sparkles, Filter, Activity, MapPin, Car
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { getCentrality } from '../data/mockService.js';

const TYPE_ICONS = {
  person: User,
  suspect: User,
  phone: Phone,
  organization: Building2,
  company: Building2,
  financial_account: CreditCard,
  account: CreditCard,
  bank: CreditCard,
  vehicle: Car,
  location: MapPin,
};

const TYPE_COLORS = {
  person: '#D9AA3D',
  suspect: '#EF4444',
  phone: '#38BDF8',
  organization: '#5E9F68',
  company: '#5E9F68',
  financial_account: '#F59E0B',
  account: '#F59E0B',
  bank: '#F59E0B',
  vehicle: '#38BDF8',
  location: '#F43F5E',
};

function normalizeType(type) {
  return String(type || 'person').toLowerCase().replace(/\s+/g, '_');
}

function ScoreBar({ value = 0 }) {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  const pct = Math.min(100, Math.max(0, Math.round(num > 1 ? (num / 10) * 100 : num * 100)));
  const color = pct >= 80 ? '#D62828' : pct >= 50 ? '#D9AA3D' : '#5E9F68';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div 
          style={{ 
            width: `${pct}%`, 
            height: '100%', 
            background: `linear-gradient(90deg, ${color}88, ${color})`, 
            borderRadius: 3, 
            transition: 'width 0.6s ease' 
          }} 
        />
      </div>
      <span style={{ fontSize: '0.72rem', color, fontWeight: 800, minWidth: 38, fontFamily: 'monospace' }}>
        {num.toFixed(2)}
      </span>
    </div>
  );
}

export default function KeyEntities() {
  const { focusEntityById, setActiveTab, nodes } = useInvestigation();
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('betweenness');
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getCentrality()
      .then(res => {
        if (!isMounted) return;
        const raw = res?.data || [];
        const items = Array.isArray(raw) ? raw : raw?.bridge_entities || raw?.all_ranked || [];
        
        // Normalize entity objects safely
        const normalized = items.map((e, idx) => {
          const casesList = Array.isArray(e.cases) ? e.cases : (e.cases ? [String(e.cases)] : ['101']);
          const betweenness = typeof e.betweenness_centrality === 'number' ? e.betweenness_centrality : (typeof e.betweenness === 'number' ? e.betweenness : (typeof e.score === 'number' ? e.score : (0.85 - idx * 0.06)));
          const degree = typeof e.degree === 'number' ? e.degree : (typeof e.connections === 'number' ? e.connections : 4);
          const crossCaseScore = typeof e.cross_case_score === 'number' ? e.cross_case_score : (casesList.length * 0.35 + betweenness * 0.65);

          return {
            entity_id: e.entity_id || e.id || `ENT-${idx + 1}`,
            name: e.name || e.label || e.entity_id || `Entity ${idx + 1}`,
            type: e.type || 'Person',
            betweenness_centrality: Math.max(0.05, betweenness),
            cross_case_score: crossCaseScore,
            degree,
            cases: casesList,
            casesCount: casesList.length,
            role_in_network: e.role_in_network || e.role || (casesList.length > 1 ? 'Cross-Case Coordinator' : 'Syndicate Operative'),
            is_bridge: e.is_bridge !== undefined ? e.is_bridge : casesList.length > 1 || betweenness > 0.3,
            activity_score: e.activity_score || (betweenness > 0.4 ? 'HIGH' : 'MEDIUM'),
            evidence_count: e.evidence_count || degree * 2 + 1,
          };
        });

        setEntities(normalized);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Centrality API fallback:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const sorted = useMemo(() => {
    return [...entities].sort((a, b) => {
      if (sortBy === 'betweenness') return (b.betweenness_centrality || 0) - (a.betweenness_centrality || 0);
      if (sortBy === 'cross_case') return (b.cross_case_score || 0) - (a.cross_case_score || 0);
      if (sortBy === 'connections') return (b.degree || 0) - (a.degree || 0);
      if (sortBy === 'cases') return (b.casesCount || 0) - (a.casesCount || 0);
      return 0;
    });
  }, [entities, sortBy]);

  const handleEntityClick = (entity) => {
    if (focusEntityById) {
      focusEntityById(entity.entity_id, true);
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D9AA3D', gap: 10 }}>
        <BarChart3 size={24} className="animate-spin" />
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Calculating Graph Centrality & Bridge Metrics…</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#F1EBDD' }}>
      
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(16,19,17,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: '0.5rem', borderRadius: 10, background: 'rgba(217,170,61,0.15)', color: '#D9AA3D', border: '1px solid rgba(217,170,61,0.35)' }}>
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.02em' }}>
              Key & Bridge Entities Intelligence
            </h2>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: '#A6B0AA' }}>
              Pivotal nodes ranked by graph betweenness & cross-case conduits — click any entity to isolate in Knowledge Graph
            </p>
          </div>
        </div>

        {/* Sorting Filters */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: '#6C7A73', fontWeight: 800, letterSpacing: '0.05em' }}>SORT BY:</span>
          {[
            { key: 'betweenness', label: 'Betweenness Centrality' },
            { key: 'cross_case', label: 'Bridge Score' },
            { key: 'connections', label: 'Direct Ties' },
            { key: 'cases', label: 'Case Overlap' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: 6,
                border: '1px solid',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: sortBy === key ? 'rgba(217,170,61,0.18)' : 'rgba(0,0,0,0.4)',
                borderColor: sortBy === key ? 'rgba(217,170,61,0.5)' : 'rgba(255,255,255,0.1)',
                color: sortBy === key ? '#D9AA3D' : '#8A948C',
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TOP 3 PIVOTAL SYNDICATE BRIDGES ──────────────────────────────────── */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 12, flexShrink: 0 }}>
        {sorted.slice(0, 3).map((ent, i) => {
          const typeKey = normalizeType(ent.type);
          const Icon = TYPE_ICONS[typeKey] || User;
          const color = TYPE_COLORS[typeKey] || '#D9AA3D';
          const medals = ['🥇', '🥈', '🥉'];
          const rankTitles = ['PRIMARY BOTTLENECK', 'KEY FINANCIAL CONDUIT', 'CROSS-CASE OPERATIVE'];

          return (
            <div
              key={ent.entity_id}
              onClick={() => handleEntityClick(ent)}
              className="forensic-panel"
              style={{
                flex: 1,
                padding: '0.9rem 1.1rem',
                cursor: 'pointer',
                borderRadius: '12px',
                background: 'rgba(20,24,21,0.85)',
                border: i === 0 ? '1px solid rgba(217,170,61,0.45)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: i === 0 ? '0 4px 20px rgba(217,170,61,0.12)' : 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(217,170,61,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = i === 0 ? 'rgba(217,170,61,0.45)' : 'rgba(255,255,255,0.08)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '1.2rem' }}>{medals[i]}</span>
                  <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#D9AA3D', letterSpacing: '0.06em' }}>
                    {rankTitles[i]}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.15rem 0.45rem', borderRadius: 4, background: `${color}22`, border: `1px solid ${color}44` }}>
                  <Icon size={12} color={color} />
                  <span style={{ fontSize: '0.65rem', color, fontWeight: 700 }}>{String(ent.type).toUpperCase()}</span>
                </div>
              </div>

              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#F1EBDD', marginBottom: 3 }}>{ent.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#A6B0AA', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Cases: {ent.cases.join(', ')}</span>
                <span>•</span>
                <span>{ent.degree} Direct Ties</span>
              </div>

              <ScoreBar value={ent.betweenness_centrality} />
              <div style={{ fontSize: '0.64rem', color: '#6C7A73', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span>Betweenness Influence</span>
                <span style={{ color: '#D9AA3D', fontWeight: 700 }}>CLICK TO FOCUS GRAPH</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FULL CENTRALITY & BRIDGE TABLE ─────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }} className="scrollbar-thin">
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
          <thead>
            <tr>
              {['Rank & Entity', 'Category', 'Case Links', 'Network Ties', 'Betweenness Centrality', 'Evidence Exhibits', 'Threat Level', 'Action'].map(h => (
                <th key={h} style={{ padding: '0.5rem 0.75rem', fontSize: '0.65rem', color: '#6C7A73', fontWeight: 800, textTransform: 'uppercase', textAlign: 'left', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((ent, i) => {
              const typeKey = normalizeType(ent.type);
              const Icon = TYPE_ICONS[typeKey] || User;
              const color = TYPE_COLORS[typeKey] || '#D9AA3D';
              const isHot = hovered === ent.entity_id;

              return (
                <tr 
                  key={ent.entity_id} 
                  onMouseEnter={() => setHovered(ent.entity_id)} 
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleEntityClick(ent)}
                >
                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.09)' : 'rgba(20,23,21,0.7)', borderRadius: '8px 0 0 8px', borderLeft: isHot ? '3px solid #D9AA3D' : '3px solid transparent', transition: 'all 0.15s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontMono: 'true', fontSize: '0.72rem', fontWeight: 800, color: i < 3 ? '#D9AA3D' : '#6C7A73', minWidth: 20 }}>
                        #{i + 1}
                      </span>
                      <Icon size={15} color={color} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#F1EBDD' }}>{ent.name}</div>
                        <div style={{ fontSize: '0.66rem', color: '#6C7A73', fontFamily: 'monospace' }}>{ent.entity_id} • {ent.role_in_network}</div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.09)' : 'rgba(20,23,21,0.7)', transition: 'all 0.15s ease' }}>
                    <span style={{ padding: '0.2rem 0.55rem', borderRadius: 6, background: `${color}20`, border: `1px solid ${color}40`, color, fontSize: '0.68rem', fontWeight: 700 }}>
                      {ent.type}
                    </span>
                  </td>

                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.09)' : 'rgba(20,23,21,0.7)', fontWeight: 800, color: ent.casesCount > 1 ? '#D62828' : '#D9AA3D', fontSize: '0.82rem', transition: 'all 0.15s ease' }}>
                    {ent.cases.join(', ')}
                  </td>

                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.09)' : 'rgba(20,23,21,0.7)', fontWeight: 700, fontSize: '0.82rem', color: '#F1EBDD', transition: 'all 0.15s ease' }}>
                    {ent.degree} connections
                  </td>

                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.09)' : 'rgba(20,23,21,0.7)', minWidth: 150, transition: 'all 0.15s ease' }}>
                    <ScoreBar value={ent.betweenness_centrality} />
                  </td>

                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.09)' : 'rgba(20,23,21,0.7)', fontSize: '0.8rem', color: '#A6B0AA', transition: 'all 0.15s ease' }}>
                    {ent.evidence_count} exhibits
                  </td>

                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.09)' : 'rgba(20,23,21,0.7)', transition: 'all 0.15s ease' }}>
                    <span style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: 6,
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      background: ent.activity_score === 'HIGH' ? 'rgba(214,40,40,0.18)' : 'rgba(217,170,61,0.15)',
                      border: ent.activity_score === 'HIGH' ? '1px solid rgba(214,40,40,0.45)' : '1px solid rgba(217,170,61,0.4)',
                      color: ent.activity_score === 'HIGH' ? '#fca5a5' : '#D9AA3D',
                    }}>
                      {ent.activity_score === 'HIGH' ? 'CRITICAL LINK' : 'ACTIVE'}
                    </span>
                  </td>

                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.09)' : 'rgba(20,23,21,0.7)', borderRadius: '0 8px 8px 0', transition: 'all 0.15s ease' }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleEntityClick(ent); }}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.3rem 0.65rem',
                        borderRadius: 6,
                        background: 'linear-gradient(135deg,#d62828,#a31d1d)',
                        border: '1px solid rgba(255,120,120,0.3)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(214,40,40,0.3)',
                      }}
                    >
                      <span>Isolate</span>
                      <ExternalLink size={10} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Explanation Note */}
        <div style={{ marginTop: '1.25rem', padding: '0.85rem 1.15rem', borderRadius: 8, background: 'rgba(217,170,61,0.04)', border: '1px solid rgba(217,170,61,0.2)', fontSize: '0.74rem', color: '#8A948C', lineHeight: 1.6 }}>
          <strong style={{ color: '#D9AA3D' }}>Forensic Graph Centrality:</strong> Betweenness Centrality evaluates the proportion of shortest paths passing through a specific node across the entire syndicate network. High-scoring nodes serve as non-redundant bridges for communication and Hawala laundering, making them high-priority interception targets.
        </div>
      </div>
    </div>
  );
}
