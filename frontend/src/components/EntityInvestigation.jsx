import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, User, Phone, Car, Building2, MapPin, CreditCard, FolderOpen, Network } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

const TYPE_ICONS = {
  Person: User,
  Phone,
  Vehicle: Car,
  Organization: Building2,
  Location: MapPin,
  FinancialAccount: CreditCard,
  Case: FolderOpen,
};

export default function EntityInvestigation() {
  const {
    selectedCase, selectedEntity, selectEntity, focusEntityById,
    setActiveTab, setInvestigationSection,
  } = useInvestigation();

  const [query, setQuery] = useState('');
  const [entities, setEntities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedCase) return;
    setLoading(true);
    axios.get(`/api/v1/cases/${selectedCase}`)
      .then((res) => {
        if (res.data?.success) {
          setEntities(res.data.data.graph_entities || []);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedCase]);

  useEffect(() => {
    const id = selectedEntity?.id;
    if (!id) {
      setProfile(null);
      return;
    }
    axios.get(`/api/v1/graph/entity/${id}/profile`)
      .then((res) => {
        if (res.data?.success) setProfile(res.data.data);
      })
      .catch(() => setProfile(null));
  }, [selectedEntity?.id]);

  const filtered = entities.filter((e) => {
    const label = (e.name || e.reg_number || e.number || e.account_number || e.id || '').toLowerCase();
    return !query || label.includes(query.toLowerCase()) || (e.id || '').toLowerCase().includes(query.toLowerCase());
  });

  const inferType = (e) => {
    if (e.reg_number) return 'Vehicle';
    if (e.number && !e.name) return 'Phone';
    if (e.account_number) return 'FinancialAccount';
    if (e.lat != null) return 'Location';
    if (e.type?.match(/Company|Exchange|Syndicate|Hawala|Front|Services/)) return 'Organization';
    return 'Person';
  };

  return (
    <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden', color: '#F1EBDD' }}>
      {/* Entity list */}
      <div style={{ width: 300, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: 'rgba(8,10,9,0.85)' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D9AA3D', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            CASE {selectedCase} ENTITIES
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '0.4rem 0.6rem', border: '1px solid var(--border-color)' }}>
            <Search size={14} color="#A6B0AA" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search entity..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F1EBDD', fontSize: '0.82rem' }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {loading ? (
            <div style={{ padding: '1rem', color: '#A6B0AA', fontSize: '0.82rem' }}>Loading entities...</div>
          ) : filtered.map((e) => {
            const type = inferType(e);
            const Icon = TYPE_ICONS[type] || User;
            const active = selectedEntity?.id === e.id;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => selectEntity(e)}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.65rem 0.75rem', marginBottom: 6,
                  borderRadius: 8, border: active ? '1px solid #D62828' : '1px solid var(--border-color)',
                  background: active ? 'rgba(214,40,40,0.15)' : 'rgba(255,255,255,0.03)',
                  color: '#F1EBDD', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={14} color={active ? '#D62828' : '#D9AA3D'} />
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>{e.name || e.reg_number || e.number || e.id}</div>
                    <div style={{ fontSize: '0.68rem', color: '#A6B0AA' }}>{type} · {e.id}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile panel */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        {!selectedEntity ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#A6B0AA' }}>
            Select an entity to begin investigation
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              {selectedEntity.name || selectedEntity.id}
            </h2>
            <div style={{ fontSize: '0.78rem', color: '#A6B0AA', marginBottom: '1.25rem' }}>
              {profile?.entity?.entity_type || inferType(selectedEntity)} · ID {selectedEntity.id}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <Stat label="Connections" value={profile?.statistics?.connection_count ?? '—'} />
              <Stat label="Cases" value={profile?.statistics?.case_count ?? '—'} />
              <Stat label="Priority" value={profile?.statistics?.priority_level ?? '—'} />
              <Stat label="Centrality" value={profile?.statistics?.degree_centrality ?? '—'} />
            </div>

            {selectedEntity.aliases?.length > 0 && (
              <Section title="Aliases">
                {selectedEntity.aliases.map((a) => (
                  <span key={a} className="badge badge-gold" style={{ marginRight: 6 }}>{a}</span>
                ))}
              </Section>
            )}

            <Section title="Connected Cases">
              {(profile?.connected_cases || selectedEntity.cases || []).map((c) => (
                <span key={c} className="badge badge-red" style={{ marginRight: 6 }}>Case {c}</span>
              ))}
            </Section>

            <Section title="Relationships">
              {(profile?.relationships || []).length === 0 ? (
                <div style={{ color: '#A6B0AA', fontSize: '0.82rem' }}>No relationships loaded.</div>
              ) : (
                profile.relationships.map((r, i) => (
                  <div key={i} className="forensic-panel" style={{ padding: '0.65rem 0.85rem', marginBottom: 8, fontSize: '0.82rem' }}>
                    <strong>{selectedEntity.name || selectedEntity.id}</strong>
                    {' → '}
                    <em>{(r.relationship || '').replace(/_/g, ' ').toLowerCase()}</em>
                    {' → '}
                    <button
                      type="button"
                      onClick={() => focusEntityById(r.target_id, false)}
                      style={{ background: 'none', border: 'none', color: '#D9AA3D', cursor: 'pointer', fontWeight: 700, padding: 0 }}
                    >
                      {r.target_name}
                    </button>
                    <div style={{ marginTop: 4, fontSize: '0.72rem', color: '#A6B0AA' }}>
                      Source: {r.evidence_source || 'Graph'} · Confidence: {Math.round((r.confidence || 0.9) * 100)}%
                    </div>
                  </div>
                ))
              )}
            </Section>

            <div style={{ display: 'flex', gap: 10, marginTop: '1rem' }}>
              <button type="button" className="btn-red" onClick={() => { focusEntityById(selectedEntity.id); setActiveTab('network'); }}>
                <Network size={14} /> Focus in Network
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setInvestigationSection('evidence'); setActiveTab('investigation'); }}>
                View Evidence
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="forensic-panel" style={{ padding: '0.75rem' }}>
      <div style={{ fontSize: '0.68rem', color: '#A6B0AA', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#D9AA3D' }}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <h3 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#D9AA3D', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{title.toUpperCase()}</h3>
      {children}
    </div>
  );
}
