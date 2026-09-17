import React, { useEffect, useState } from 'react';
import {
  User, Phone, MapPin, FolderArchive, Car, Building2, CreditCard, X,
  Route, Network, FileText, GitBranch, Crosshair, ExternalLink, ShieldCheck
} from 'lucide-react';
import { getEntityProfile } from '../data/mockService';

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
    getEntityProfile(entity.id)
      .then((res) => { if (res?.data) setProfile(res.data); })
      .catch(() => setProfile(null));
  }, [entity?.id]);

  if (!entity) return null;

  const isPerson = !!entity.role || !!entity.name;
  const isVehicle = !!entity.reg_number;
  const isOrg = !!entity.alias || (entity.type && (entity.type.includes('Company') || entity.type.includes('Organization')));
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

  const entityType = profile?.entity?.type || profile?.entity?.entity_type
    || (isPerson ? 'Person' : isVehicle ? 'Vehicle' : isPhone ? 'Phone' : isAccount ? 'FinancialAccount' : isLocation ? 'Location' : isOrg ? 'Organization' : 'Entity');

  const cases = entity.cases || profile?.entity?.cases || [];
  const isCrossCase = cases.length > 1;
  const connections = profile?.entity?.connections || [];
  const evidenceCount = profile?.entity?.evidence_count || connections.length;

  return (
    <div
      className="evidence-card animate-slide-up"
      style={{
        width: 360, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
        padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem',
        borderLeft: '4px solid #D62828', position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 30,
        borderRadius: '12px 0 0 12px', background: '#D8C58A', color: '#24251F',
        boxShadow: '-8px 0 24px rgba(0,0,0,0.4)',
      }}
    >
      <div className="pin-detail pin-detail-red" />

      {/* Title / Close */}
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
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1B1E1C' }}>{getTitle()}</h3>
            <span style={{ fontSize: '0.72rem', color: '#54564B', fontWeight: 700 }}>{entityType} {entity.role ? `• ${entity.role}` : ''}</span>
          </div>
        </div>
        <button type="button" onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 6, cursor: 'pointer', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span className="badge" style={{ background: 'rgba(0,0,0,0.08)', fontWeight: 700, fontFamily: 'monospace' }}>
          {entity.id}
        </span>
        {cases.map((c) => (
          <span key={c} className="badge badge-red" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
            {c.startsWith('CASE') ? c : `Case ${c}`}
          </span>
        ))}
        {isCrossCase && (
          <span className="badge badge-gold" style={{ fontSize: '0.68rem', fontWeight: 800 }}>
            CROSS-CASE BRIDGE
          </span>
        )}
      </div>

      {/* Mini Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.78rem' }}>
        <MiniStat label="Direct Connections" value={connections.length || (entity.connections?.length ?? 4)} />
        <MiniStat label="Cases Involved" value={cases.length || 1} />
        <MiniStat label="Evidence Records" value={evidenceCount || 6} />
        <MiniStat label="Confidence Score" value={`${Math.round((entity.confidence || 0.94) * 100)}%`} />
      </div>

      {/* Direct Connections / Relationships */}
      {connections.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#54564B', letterSpacing: '0.05em', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
            Connected Entities ({connections.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {connections.slice(0, 5).map((c, i) => (
              <div key={i} style={{ fontSize: '0.76rem', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.3)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 800 }}>{c.name}</span>
                  <span style={{ fontSize: '0.68rem', color: '#54564B', marginLeft: 6 }}>({c.relationship?.replace(/_/g, ' ') || c.type})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCrossCase && (
        <div style={{ fontSize: '0.76rem', color: '#900', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(214,40,40,0.1)', padding: '0.5rem', borderRadius: 6 }}>
          <GitBranch size={14} /> Shared across {cases.join(', ')} — Prime Nexus Candidate
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
        <button type="button" className="btn-red" style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }} onClick={() => onFocusEntity(entity)}>
          <Network size={14} /> Focus Entity in Graph
        </button>
        <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }} onClick={() => onTraceFrom(entity.id)}>
          <Route size={14} /> Trace Path from Here
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button type="button" className="btn-secondary" style={{ fontSize: '0.72rem', justifyContent: 'center' }} onClick={onViewEvidence}>
            <FileText size={12} /> Evidence
          </button>
          <button type="button" className="btn-secondary" style={{ fontSize: '0.72rem', justifyContent: 'center' }} onClick={onViewCrossCase}>
            <Crosshair size={12} /> Cross-Case
          </button>
        </div>
        {cases.length > 0 && (
          <button type="button" className="btn-secondary" style={{ width: '100%', fontSize: '0.72rem', justifyContent: 'center' }} onClick={() => onOpenCase(cases[0])}>
            <FolderArchive size={12} /> Open Case {cases[0]}
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
      <div style={{ fontWeight: 800, color: '#1B1E1C' }}>{value}</div>
    </div>
  );
}
