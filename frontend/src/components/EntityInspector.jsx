import React from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  FolderArchive, 
  Shield, 
  Car, 
  Building2, 
  CreditCard, 
  X,
  FileText,
  Route
} from 'lucide-react';

export default function EntityInspector({
  entity = null,
  onClose = () => {},
  onSetAsPathSource = () => {},
}) {
  if (!entity) return null;

  const isPerson = !!entity.role || !!entity.name;
  const isVehicle = !!entity.reg_number;
  const isOrg = !!entity.alias || (entity.type && entity.type.includes('Company'));
  const isPhone = !!entity.number && !entity.name;
  const isAccount = !!entity.account_number;
  const isLocation = !!entity.lat && !!entity.lon;

  const getTitle = () => {
    if (isPerson) return entity.name || entity.id;
    if (isVehicle) return `Vehicle: ${entity.reg_number}`;
    if (isOrg) return entity.name || entity.alias;
    if (isPhone) return `Phone: ${entity.number}`;
    if (isAccount) return `Account: ${entity.account_number}`;
    if (isLocation) return `Location: ${entity.name || entity.id}`;
    return entity.id || 'Entity Details';
  };

  const getSubtitle = () => {
    if (isPerson) return entity.role || 'Suspect / Associate';
    if (isVehicle) return `${entity.color || ''} ${entity.model || ''} (${entity.type || 'Vehicle'})`.trim();
    if (isOrg) return entity.type || 'Organization / Front Syndicate';
    if (isPhone) return entity.registered ? 'Registered Subscriber' : 'Unregistered Burner Phone';
    if (isAccount) return `${entity.bank || 'Bank'} (IFSC: ${entity.ifsc || 'N/A'})`;
    if (isLocation) return `Coordinates: ${entity.lat}, ${entity.lon}`;
    return 'Knowledge Graph Entity';
  };

  return (
    <div
      className="glass-panel"
      style={{
        width: '340px',
        maxHeight: 'calc(100vh - 180px)',
        overflowY: 'auto',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        borderLeft: '2px solid rgba(99, 102, 241, 0.4)',
        animation: 'slideIn 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              padding: '0.45rem',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#818cf8',
            }}
          >
            {isPerson && <User size={20} />}
            {isVehicle && <Car size={20} />}
            {isOrg && <Building2 size={20} />}
            {isPhone && <Phone size={20} />}
            {isAccount && <CreditCard size={20} />}
            {isLocation && <MapPin size={20} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
              {getTitle()}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{getSubtitle()}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '0.2rem',
          }}
          title="Close Inspector"
        >
          <X size={18} />
        </button>
      </div>

      {/* Entity Identifier Pill */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#d1d5db' }}>
          ID: {entity.id || entity.number || 'N/A'}
        </span>
        {entity.cases && entity.cases.length > 0 && (
          <span className="badge badge-lead">
            {entity.cases.length > 1 ? `🔗 Cross-Case (${entity.cases.join(', ')})` : `Case: ${entity.cases[0]}`}
          </span>
        )}
      </div>

      {/* Detailed Properties */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '0.85rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          fontSize: '0.82rem',
        }}
      >
        {/* Aliases */}
        {entity.aliases && entity.aliases.length > 0 && (
          <div>
            <span style={{ color: '#9ca3af', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>KNOWN ALIASES</span>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
              {entity.aliases.map((al, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                >
                  "{al}"
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Primary Phone */}
        {entity.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone size={14} color="#06b6d4" />
            <span style={{ color: '#e5e7eb' }}>{entity.phone}</span>
          </div>
        )}

        {/* Address */}
        {entity.address && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <MapPin size={14} color="#ef4444" style={{ marginTop: '0.15rem' }} />
            <span style={{ color: '#d1d5db', lineHeight: 1.3 }}>{entity.address}</span>
          </div>
        )}

        {/* Registration */}
        {entity.reg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={14} color="#f59e0b" />
            <span style={{ color: '#e5e7eb' }}>Reg: {entity.reg}</span>
          </div>
        )}
      </div>

      {/* Case Affiliation & Evidence */}
      <div>
        <h4 style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          Investigative Links
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {(entity.cases || []).map((cId) => (
            <div
              key={cId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.65rem',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
              }}
            >
              <FolderArchive size={14} color="#818cf8" />
              <span style={{ color: '#e5e7eb', fontWeight: 500 }}>FIR Case No. {cId}/2025</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Button */}
      <button
        onClick={() => onSetAsPathSource(entity.id || entity.number)}
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', fontSize: '0.82rem' }}
      >
        <Route size={15} />
        <span>Trace Paths from this Entity</span>
      </button>
    </div>
  );
}
