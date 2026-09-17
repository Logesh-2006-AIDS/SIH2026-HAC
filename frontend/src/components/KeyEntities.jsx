import React, { useState, useEffect } from 'react';
import { BarChart3, User, Phone, Building2, CreditCard, ExternalLink, TrendingUp, ChevronRight } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { getCentrality } from '../data/mockService.js';

const TYPE_ICONS = {
  Person: User, Phone, Organization: Building2, FinancialAccount: CreditCard,
};

const TYPE_COLORS = {
  Person: '#D9AA3D', Phone: '#38bdf8', Organization: '#5E9F68', FinancialAccount: '#34D399',
};

function ScoreBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? '#D62828' : pct >= 70 ? '#D9AA3D' : '#5E9F68';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: '0.7rem', color, fontWeight: 800, minWidth: 34 }}>{(value).toFixed(2)}</span>
    </div>
  );
}

export default function KeyEntities() {
  const { focusEntityById, setActiveTab } = useInvestigation();
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('cross_case_score');
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    getCentrality().then(res => {
      if (res.success) setEntities(res.data || []);
      setLoading(false);
    });
  }, []);

  const sorted = [...entities].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

  const handleEntityClick = (entity) => {
    focusEntityById(entity.entity_id, true);
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D9AA3D' }}>
        <BarChart3 size={22} className="animate-spin" style={{ marginRight: 8 }} /> Calculating...
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#F1EBDD' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(16,19,17,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: '0.5rem', borderRadius: 10, background: 'rgba(217,170,61,0.15)', color: '#D9AA3D', border: '1px solid rgba(217,170,61,0.3)' }}>
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Key & Bridge Entities</h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#A6B0AA' }}>
              Entities ranked by cross-case connectivity — click any row to view focused network graph
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: '#6C7A73', fontWeight: 700 }}>SORT BY:</span>
          {[
            { key: 'cross_case_score', label: 'Bridge Score' },
            { key: 'connections', label: 'Connections' },
            { key: 'cases', label: 'Cases' },
            { key: 'evidence_count', label: 'Evidence' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setSortBy(key)} style={{
              padding: '0.25rem 0.6rem', borderRadius: 6, border: '1px solid', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
              background: sortBy === key ? 'rgba(217,170,61,0.15)' : 'transparent',
              borderColor: sortBy === key ? 'rgba(217,170,61,0.4)' : 'var(--border-color)',
              color: sortBy === key ? '#D9AA3D' : '#6C7A73',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Top 3 cards */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 10, flexShrink: 0 }}>
        {sorted.slice(0, 3).map((ent, i) => {
          const Icon = TYPE_ICONS[ent.type] || User;
          const color = TYPE_COLORS[ent.type] || '#D9AA3D';
          const medals = ['🥇', '🥈', '🥉'];
          return (
            <div
              key={ent.entity_id}
              onClick={() => handleEntityClick(ent)}
              className="forensic-panel"
              style={{ flex: 1, padding: '0.85rem 1rem', cursor: 'pointer', border: i === 0 ? '1px solid rgba(217,170,61,0.4)' : undefined, transition: 'all 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: '1.1rem' }}>{medals[i]}</span>
                <Icon size={14} color={color} />
                <span style={{ fontSize: '0.65rem', color, fontWeight: 700 }}>{ent.type.toUpperCase()}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>{ent.name}</div>
              <div style={{ fontSize: '0.68rem', color: '#A6B0AA', marginBottom: 6 }}>{ent.cases} cases · {ent.connections} connections</div>
              <ScoreBar value={ent.cross_case_score} />
              <div style={{ fontSize: '0.62rem', color: '#6C7A73', marginTop: 3 }}>Cross-Case Bridge Score</div>
            </div>
          );
        })}
      </div>

      {/* Full table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
          <thead>
            <tr>
              {['Entity', 'Type', 'Cases', 'Connections', 'Cross-Case Score', 'Evidence', 'Activity', 'Actions'].map(h => (
                <th key={h} style={{ padding: '0.5rem 0.75rem', fontSize: '0.65rem', color: '#6C7A73', fontWeight: 800, textTransform: 'uppercase', textAlign: 'left', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((ent, i) => {
              const Icon = TYPE_ICONS[ent.type] || User;
              const color = TYPE_COLORS[ent.type] || '#D9AA3D';
              const isHot = hovered === ent.entity_id;
              return (
                <tr key={ent.entity_id} onMouseEnter={() => setHovered(ent.entity_id)} onMouseLeave={() => setHovered(null)}>
                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.07)' : 'rgba(20,23,21,0.7)', borderRadius: '8px 0 0 8px', borderLeft: isHot ? '3px solid #D9AA3D' : '3px solid transparent', transition: 'all 0.2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon size={14} color={color} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.84rem' }}>{ent.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#6C7A73' }}>{ent.entity_id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.07)' : 'rgba(20,23,21,0.7)', transition: 'all 0.2s ease' }}>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: 10, background: `${color}22`, color, fontSize: '0.65rem', fontWeight: 700 }}>{ent.type}</span>
                  </td>
                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.07)' : 'rgba(20,23,21,0.7)', fontWeight: 800, color: '#D62828', fontSize: '0.88rem', transition: 'all 0.2s ease' }}>{ent.cases}</td>
                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.07)' : 'rgba(20,23,21,0.7)', fontWeight: 700, transition: 'all 0.2s ease' }}>{ent.connections}</td>
                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.07)' : 'rgba(20,23,21,0.7)', minWidth: 140, transition: 'all 0.2s ease' }}>
                    <ScoreBar value={ent.cross_case_score} />
                  </td>
                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.07)' : 'rgba(20,23,21,0.7)', transition: 'all 0.2s ease' }}>{ent.evidence_count}</td>
                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.07)' : 'rgba(20,23,21,0.7)', transition: 'all 0.2s ease' }}>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.65rem', fontWeight: 700, background: ent.activity_score === 'HIGH' ? 'rgba(214,40,40,0.12)' : 'rgba(217,170,61,0.1)', color: ent.activity_score === 'HIGH' ? '#D62828' : '#D9AA3D' }}>
                      {ent.activity_score}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', background: isHot ? 'rgba(217,170,61,0.07)' : 'rgba(20,23,21,0.7)', borderRadius: '0 8px 8px 0', transition: 'all 0.2s ease' }}>
                    <button
                      onClick={() => handleEntityClick(ent)}
                      className="btn-red"
                      style={{ fontSize: '0.68rem', padding: '0.25rem 0.55rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      Graph <ExternalLink size={9} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Legend note */}
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', fontSize: '0.72rem', color: '#6C7A73', lineHeight: 1.6 }}>
          <strong style={{ color: '#A6B0AA' }}>Note on scoring:</strong> Cross-Case Bridge Score is a composite measure of an entity's presence across multiple cases, number of unique relationships, and frequency of appearance in evidence records. It does <em>not</em> claim to be a standard graph-theoretic betweenness centrality — it is an investigation-specific connectivity indicator designed for operational use.
        </div>
      </div>
    </div>
  );
}
