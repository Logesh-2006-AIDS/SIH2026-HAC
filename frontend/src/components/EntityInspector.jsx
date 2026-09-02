import React from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  FolderArchive, 
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
    return entity.id || 'Evidence Record';
  };

  const getSubtitle = () => {
    if (isPerson) return entity.role || 'Suspect / Associate';
    if (isVehicle) return `${entity.color || ''} ${entity.model || ''} (${entity.type || 'Vehicle'})`.trim();
    if (isOrg) return entity.type || 'Organization / Front Syndicate';
    if (isPhone) return entity.registered ? 'Registered Subscriber' : 'Unregistered Burner Phone';
    if (isAccount) return `${entity.bank || 'Bank'} (IFSC: ${entity.ifsc || 'N/A'})`;
    if (isLocation) return `Coordinates: ${entity.lat}, ${entity.lon}`;
    return 'Knowledge Graph Evidence Node';
  };

  return (
    <div
      className="evidence-card animate-slide-up"
      style={{
        width: '350px',
        maxHeight: 'calc(100vh - 180px)',
        overflowY: 'auto',
        padding: '1.5rem 1.35rem 1.35rem 1.35rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.1rem',
        borderLeft: '4px solid #D62828', // Red string indicator edge
        boxShadow: '-8px 0 32px rgba(0,0,0,0.6)',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        borderRadius: '12px 0 0 12px',
        background: '#D8C58A',
        color: '#24251F',
      }}
    >
      {/* Metallic Pin at Top */}
      <div className="pin-detail pin-detail-red" />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              padding: '0.55rem',
              borderRadius: '10px',
              background: 'rgba(36, 37, 31, 0.12)',
              color: '#24251F',
              border: '1px solid rgba(36, 37, 31, 0.25)',
            }}
          >
            {isPerson && <User size={22} />}
            {isVehicle && <Car size={22} />}
            {isOrg && <Building2 size={22} />}
            {isPhone && <Phone size={22} />}
            {isAccount && <CreditCard size={22} />}
            {isLocation && <MapPin size={22} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#24251F', lineHeight: 1.2 }}>
              {getTitle()}
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#54564B', fontWeight: 600 }}>{getSubtitle()}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.15)',
            color: '#24251F',
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '0.3rem',
            transition: 'all 0.2s ease',
          }}
          title="Unpin Inspector"
        >
          <X size={18} />
        </button>
      </div>

      {/* Entity Identifier Pill */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span className="badge" style={{ background: 'rgba(0,0,0,0.08)', color: '#24251F', border: '1px solid rgba(0,0,0,0.15)', fontWeight: 700 }}>
          ID: {entity.id || entity.number || 'N/A'}
        </span>
        {entity.cases && entity.cases.length > 0 && (
          <span className="badge" style={{ background: 'rgba(214, 40, 40, 0.18)', color: '#900', border: '1px solid rgba(214, 40, 40, 0.4)', fontWeight: 700 }}>
            {entity.cases.length > 1 ? `🔗 Cross-Case (${entity.cases.join(', ')})` : `Case: ${entity.cases[0]}`}
          </span>
        )}
      </div>

      {/* Detailed Properties Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          background: 'rgba(255, 255, 255, 0.45)',
          padding: '0.95rem',
          borderRadius: '8px',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          fontSize: '0.83rem',
        }}
      >
        {/* Aliases */}
        {entity.aliases && entity.aliases.length > 0 && (
          <div>
            <span style={{ color: '#54564B', display: 'block', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em' }}>KNOWN ALIASES</span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
              {entity.aliases.map((al, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(214, 40, 40, 0.12)',
                    color: '#800',
                    border: '1px solid rgba(214, 40, 40, 0.3)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
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
            <Phone size={15} color="#24251F" />
            <span style={{ color: '#24251F', fontWeight: 700 }}>{entity.phone}</span>
          </div>
        )}

        {/* Address */}
        {entity.address && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <MapPin size={15} color="#D62828" style={{ marginTop: '0.15rem' }} />
            <span style={{ color: '#24251F', lineHeight: 1.35, fontWeight: 500 }}>{entity.address}</span>
          </div>
        )}

        {/* Registration */}
        {entity.reg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={15} color="#24251F" />
            <span style={{ color: '#24251F', fontWeight: 700 }}>Reg: {entity.reg}</span>
          </div>
        )}
      </div>

      {/* Case Affiliation & Evidence */}
      <div>
        <h4 style={{ fontSize: '0.78rem', color: '#54564B', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800, letterSpacing: '0.05em' }}>
          Pointers to Active Dossiers
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {(entity.cases || []).map((cId) => (
            <div
              key={cId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.45)',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                fontSize: '0.82rem',
              }}
            >
              <FolderArchive size={15} color="#D62828" />
              <span style={{ color: '#24251F', fontWeight: 700 }}>FIR Case No. {cId}/2025</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Button */}
      <button
        onClick={() => onSetAsPathSource(entity.id || entity.number)}
        className="btn-red"
        style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', fontSize: '0.84rem' }}
      >
        <Route size={16} />
        <span>Attach Red String Trace</span>
      </button>
    </div>
  );
}
