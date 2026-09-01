import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  FileText, 
  HelpCircle,
  MessageSquare,
  Sparkles
} from 'lucide-react';

const INITIAL_LEADS = [
  {
    id: 'LEAD-001',
    entityA: 'Ravi Kumar (FIR 101)',
    entityB: 'Ravan (FIR 105)',
    matchType: 'Fuzzy Alias & Phone Overlap',
    similarity: 0.94,
    evidence: 'Both mention phone +91-98110-44501 and associate with Apex Global Logistics.',
    status: 'PENDING',
  },
  {
    id: 'LEAD-002',
    entityA: 'Vikram Singh (FIR 101)',
    entityB: 'Vicky (FIR 102)',
    matchType: 'Phone & Vehicle Plate Match',
    similarity: 0.96,
    evidence: 'DL-01-AB-1234 Fortuner spotted at robbery scene in 101; phone registered in 102.',
    status: 'PENDING',
  },
  {
    id: 'LEAD-003',
    entityA: 'Account 112233445566778 (ICICI)',
    entityB: 'Aarav Mehta (Case 105 Hawala)',
    matchType: 'Direct Account Number Match',
    similarity: 1.0,
    evidence: 'Identical bank account received crypto layering funds in Case 102 and Hawala transfers in Case 105.',
    status: 'PENDING',
  },
  {
    id: 'LEAD-004',
    entityA: 'Rohit Patel (Case 104)',
    entityB: 'R. Patel (Case 105)',
    matchType: 'Name & IFSC Routing Overlap',
    similarity: 0.88,
    evidence: 'Axis Bank transfers from vehicle theft buyers routed to Shroff Money Services.',
    status: 'PENDING',
  },
];

export default function LeadVerification() {
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [remarks, setRemarks] = useState({});

  const handleAction = (id, newStatus) => {
    setLeads((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: newStatus, verifiedAt: new Date().toLocaleTimeString() } : item
      )
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <ShieldCheck size={22} color="#10b981" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              Human-in-the-Loop Lead Verification Workbench
            </h2>
          </div>
          <p style={{ color: '#d1d5db', fontSize: '0.85rem' }}>
            Law enforcement verification queue. Review, confirm, or reject AI-predicted entity merges with evidentiary justification.
          </p>
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Pending Entity Resolutions & Link Suggestions</h3>
          </div>
          <span className="badge badge-lead">
            {leads.filter((l) => l.status === 'PENDING').length} Pending Officer Review
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {leads.map((lead) => {
            const isPending = lead.status === 'PENDING';
            return (
              <div
                key={lead.id}
                style={{
                  padding: '1.25rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border:
                    lead.status === 'APPROVED'
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : lead.status === 'REJECTED'
                      ? '1px solid rgba(239, 68, 68, 0.4)'
                      : '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#818cf8', fontWeight: 600 }}>
                      {lead.id}
                    </span>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
                      {lead.matchType}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>AI Match Confidence:</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: lead.similarity >= 0.95 ? '#34d399' : '#fbbf24',
                        fontSize: '0.9rem',
                      }}
                    >
                      {Math.round(lead.similarity * 100)}%
                    </span>
                  </div>
                </div>

                {/* Compared Entities */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: '1rem',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ color: '#60a5fa', fontWeight: 600, fontSize: '0.88rem' }}>
                    {lead.entityA}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 700 }}>⟷</div>
                  <div style={{ color: '#34d399', fontWeight: 600, fontSize: '0.88rem' }}>
                    {lead.entityB}
                  </div>
                </div>

                {/* Evidence Citation */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.8rem', color: '#9ca3af' }}>
                  <FileText size={14} color="#f59e0b" style={{ marginTop: '0.15rem' }} />
                  <span>
                    <strong>Supporting Evidence:</strong> {lead.evidence}
                  </span>
                </div>

                {/* Action Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
                    <MessageSquare size={15} color="#6b7280" />
                    <input
                      type="text"
                      placeholder="Investigator remarks / reference note..."
                      value={remarks[lead.id] || ''}
                      onChange={(e) => setRemarks({ ...remarks, [lead.id]: e.target.value })}
                      disabled={!isPending}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '0.35rem 0.65rem',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {isPending ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleAction(lead.id, 'APPROVED')}
                        className="btn-primary"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          padding: '0.35rem 0.85rem',
                          fontSize: '0.8rem',
                        }}
                      >
                        <CheckCircle2 size={15} />
                        <span>Approve & Merge</span>
                      </button>
                      <button
                        onClick={() => handleAction(lead.id, 'REJECTED')}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          borderRadius: '8px',
                          padding: '0.35rem 0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        <XCircle size={15} />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${lead.status === 'APPROVED' ? 'badge-healthy' : 'badge-danger'}`}>
                        {lead.status} at {lead.verifiedAt}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
