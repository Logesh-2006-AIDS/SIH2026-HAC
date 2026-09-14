import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  User, Phone, MapPin, FolderArchive, Car, Building2, CreditCard, X,
  Route, Network, FileText, GitBranch, Crosshair,
} from 'lucide-react';

export default function EntityInspector({
  entity = null,
  onClose = () => {},
  onFocusEntity = () => {},
  onTraceFrom = () => {},
  onViewCrossCase = () => {},
  onViewEvidence = () => {},
  onOpenCase = () => {},
}) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!entity?.id) {
      setProfile(null);
      return;
    }
    axios.get(`/api/v1/graph/entity/${entity.id}/profile`)
      .then((res) => { if (res.data?.success) setProfile(res.data.data); })
      .catch(() => setProfile(null));
  }, [entity?.id]);

  if (!entity) return null;

  const isPerson = !!entity.role || !!entity.name;
  const isVehicle = !!entity.reg_number;
  const isOrg = !!entity.alias || (entity.type && entity.type.includes('Company'));
  const isPhone = !!entity.number && !entity.name;
  const isAccount = !!entity.account_number;
  const isLocation = entity.lat != null && entity.lon != null;

  const getTitle = () => {
    if (isPerson) return entity.name || entity.id;
    if (isVehicle) return entity.reg_number;
    if (isOrg) return entity.name || entity.alias;
    if (isPhone) return entity.number;
    if (isAccount) return entity.account_number;
    if (isLocation) return entity.name || entity.id;
    return entity.id;
  };

  const entityType = profile?.entity?.entity_type
    || (isPerson ? 'Person' : isVehicle ? 'Vehicle' : isPhone ? 'Phone' : isAccount ? 'FinancialAccount' : isLocation ? 'Location' : isOrg ? 'Organization' : 'Entity');

  const stats = profile?.statistics || {};
  const relationships = (profile?.relationships || []).slice(0, 6);

  return (
    <div
      className="evidence-card animate-slide-up"
      style={{
        width: 360, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
        padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem',
        borderLeft: '4px solid #D62828', position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 30,
        borderRadius: '12px 0 0 12px', background: '#D8C58A', color: '#24251F',
      }}
    >
      <div className="pin-detail pin-detail-red" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ padding: 8, borderRadius: 8, background: 'rgba(36,37,31,0.12)' }}>
            {isPerson && <User size={20} />}
            {isVehicle && <Car size={20} />}
            {isOrg && <Building2 size={20} />}
            {isPhone && <Phone size={20} />}
            {isAccount && <CreditCard size={20} />}
            {isLocation && <MapPin size={20} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{getTitle()}</h3>
            <span style={{ fontSize: '0.72rem', color: '#54564B', fontWeight: 700 }}>{entityType}</span>
          </div>
        </div>
        <button type="button" onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 6, cursor: 'pointer', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span className="badge" style={{ background: 'rgba(0,0,0,0.08)', fontWeight: 700 }}>ID: {entity.id}</span>
        {(entity.cases || []).map((c) => (
          <span key={c} className="badge badge-red" style={{ fontSize: '0.68rem' }}>Case {c}</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.78rem' }}>
        <MiniStat label="Direct Connections" value={stats.connection_count ?? '—'} />
        <MiniStat label="Cases" value={stats.case_count ?? entity.cases?.length ?? '—'} />
        <MiniStat label="Priority" value={stats.priority_level ?? '—'} />
        <MiniStat label="Centrality" value={stats.degree_centrality ?? '—'} />
      </div>

      {relationships.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#54564B', letterSpacing: '0.05em', marginBottom: 6 }}>IMPORTANT RELATIONSHIPS</h4>
          {relationships.map((r, i) => (
            <div key={i} style={{ fontSize: '0.76rem', padding: '0.35rem 0', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              → {(r.relationship || '').replace(/_/g, ' ').toLowerCase()} → <strong>{r.target_name}</strong>
              <div style={{ fontSize: '0.68rem', color: '#54564B' }}>
                {r.evidence_source} · {Math.round((r.confidence || 0.9) * 100)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {profile?.cross_case && (
        <div style={{ fontSize: '0.76rem', color: '#900', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <GitBranch size={14} /> Appears in multiple cases — cross-case entity
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
        <button type="button" className="btn-red" style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }} onClick={() => onFocusEntity(entity)}>
          <Network size={14} /> Focus This Entity
        </button>
        <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }} onClick={() => onTraceFrom(entity.id)}>
          <Route size={14} /> Trace Connection
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button type="button" className="btn-secondary" style={{ fontSize: '0.72rem', justifyContent: 'center' }} onClick={onViewEvidence}>
            <FileText size={12} /> Evidence
          </button>
          <button type="button" className="btn-secondary" style={{ fontSize: '0.72rem', justifyContent: 'center' }} onClick={onViewCrossCase}>
            <Crosshair size={12} /> Cross-Case
          </button>
        </div>
        {(entity.cases || []).length > 0 && (
          <button type="button" className="btn-secondary" style={{ width: '100%', fontSize: '0.72rem', justifyContent: 'center' }} onClick={() => onOpenCase(entity.cases[0])}>
            <FolderArchive size={12} /> Open Case {entity.cases[0]}
          </button>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.45)', padding: '0.45rem 0.55rem', borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: '0.62rem', color: '#54564B', fontWeight: 700 }}>{label}</div>
      <div style={{ fontWeight: 800 }}>{value}</div>
    </div>
  );
}
