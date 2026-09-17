import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, ShieldCheck, FileText, 
  MessageSquare, Sparkles, RefreshCw, AlertTriangle, ExternalLink
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { getPendingLeads } from '../data/mockService.js';

export default function LeadVerification() {
  const { leads: ctxLeads, dispatchLeads, focusEntityById, setActiveTab } = useInvestigation();
  const [localLeads, setLocalLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState({});

  useEffect(() => {
    if (ctxLeads && ctxLeads.length > 0) {
      setLocalLeads(ctxLeads);
    } else {
      setLoading(true);
      getPendingLeads().then(res => {
        if (res?.data?.leads) {
          setLocalLeads(res.data.leads);
        }
      }).finally(() => setLoading(false));
    }
  }, [ctxLeads]);

  const handleAction = (leadId, newStatus) => {
    if (dispatchLeads) {
      dispatchLeads({ type: 'VERIFY_LEAD', id: leadId, status: newStatus });
    }
    setLocalLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, status: newStatus, verified_at: new Date().toLocaleTimeString(), verified_by: 'Investigator' } : l
    ));
  };

  const pendingCount = localLeads.filter(l => l.status === 'PENDING' || l.status === 'AI_SUGGESTED').length;

  return (
    <div className="animate-fade-in" style={{ flex: 1, height: '100%', padding: '1.75rem', overflowY: 'auto', background: 'transparent', color: '#F1EBDD' }}>
      {/* Top Banner */}
      <div className="forensic-panel" style={{
        padding: '1.35rem 1.75rem', marginBottom: '1.75rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(217, 170, 61, 0.15) 0%, rgba(94, 159, 104, 0.15) 100%)',
        border: '1px solid rgba(94, 159, 104, 0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.3rem' }}>
            <ShieldCheck size={24} color="#5E9F68" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F1EBDD' }}>
              Human-in-the-Loop Lead Verification Workbench
            </h2>
          </div>
          <p style={{ color: '#A6B0AA', fontSize: '0.86rem' }}>
            Law enforcement verification queue. Confirm or reject AI-predicted entity merges and multi-case links with evidentiary justification.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '20px', background: 'rgba(94,159,104,0.2)', color: '#4ADE80', border: '1px solid rgba(94,159,104,0.4)' }}>
            DEMO MODE ACTIVE
          </span>
        </div>
      </div>

      {/* Leads Queue */}
      <div className="forensic-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <Sparkles size={19} color="#D9AA3D" />
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800 }}>Pending Entity Resolutions & Link Suggestions</h3>
          </div>
          <span className="badge badge-lead">{pendingCount} Pending Officer Review</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#A6B0AA', fontSize: '0.9rem' }}>
            <div className="animate-spin" style={{ width: 22, height: 22, border: '3px solid rgba(217,170,61,0.3)', borderTopColor: '#D9AA3D', borderRadius: '50%', margin: '0 auto 0.75rem' }} />
            Loading verification queue...
          </div>
        ) : localLeads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6C7A73' }}>
            <AlertTriangle size={26} style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1EBDD' }}>No pending leads in the verification queue</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {localLeads.map((lead) => {
              const isPending = lead.status === 'PENDING' || lead.status === 'AI_SUGGESTED';
              return (
                <div key={lead.id} className="evidence-card animate-slide-up" style={{
                  padding: '1.35rem',
                  border: lead.status === 'VERIFIED' || lead.status === 'APPROVED' ? '2px solid #5E9F68'
                    : lead.status === 'REJECTED' ? '2px solid #C92A2A'
                    : '1px solid rgba(180, 160, 100, 0.4)',
                  display: 'flex', flexDirection: 'column', gap: '0.85rem',
                  position: 'relative',
                }}>
                  <div className="pin-detail" style={{ top: '-7px' }} />

                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#24251F', fontWeight: 800 }}>
                        {lead.id}
                      </span>
                      <span className="badge" style={{ background: 'rgba(214, 40, 40, 0.15)', color: '#900', border: '1px solid rgba(214, 40, 40, 0.3)', fontWeight: 800 }}>
                        {lead.match_type || 'Entity Resolution'}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: '#54564B', fontWeight: 700 }}>
                        {lead.title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '0.82rem', color: '#54564B', fontWeight: 700 }}>AI Confidence:</span>
                      <span style={{
                        fontWeight: 800, fontSize: '0.95rem',
                        color: (lead.similarity || lead.confidence || 0) >= 0.9 ? '#1b5e20' : '#b78103',
                      }}>
                        {Math.round((lead.similarity || lead.confidence || 0.9) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Compared Entities */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                    gap: '1.25rem', alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.5)', padding: '0.85rem 1.15rem', borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                  }}>
                    <div style={{ color: '#24251F', fontWeight: 800, fontSize: '0.92rem' }}>
                      {lead.entity_a || (lead.entities?.[0] || 'Entity A')}
                    </div>
                    <div style={{ color: '#D62828', fontSize: '0.85rem', fontWeight: 800 }}>⟷</div>
                    <div style={{ color: '#24251F', fontWeight: 800, fontSize: '0.92rem' }}>
                      {lead.entity_b || (lead.cases?.join(' / ') || 'Cross-Case Links')}
                    </div>
                  </div>

                  {/* Evidence Citation */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: '#24251F' }}>
                    <FileText size={15} color="#D62828" style={{ marginTop: '0.15rem' }} />
                    <span>
                      <strong>Supporting Evidence:</strong>{' '}
                      {Array.isArray(lead.evidence) ? lead.evidence.join('; ') : (lead.evidence || 'Awaiting evidence correlation')}
                    </span>
                  </div>

                  {lead.reason && (
                    <div style={{
                      fontSize: '0.8rem', color: '#24251F', background: 'rgba(94,159,104,0.12)',
                      border: '1px solid rgba(94,159,104,0.35)', borderRadius: 8, padding: '0.65rem 0.85rem',
                    }}>
                      <strong>Reasoning:</strong> {lead.reason}
                    </div>
                  )}

                  {/* Action Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flex: 1, maxWidth: '420px' }}>
                      <MessageSquare size={16} color="#54564B" />
                      <input
                        type="text"
                        placeholder="Investigator remarks / reference note..."
                        value={remarks[lead.id] || ''}
                        onChange={(e) => setRemarks({ ...remarks, [lead.id]: e.target.value })}
                        disabled={!isPending}
                        style={{
                          width: '100%', background: 'rgba(255, 255, 255, 0.6)',
                          border: '1px solid rgba(0, 0, 0, 0.18)', borderRadius: '8px',
                          padding: '0.45rem 0.75rem', color: '#24251F', fontSize: '0.83rem', outline: 'none', fontWeight: 600,
                        }}
                      />
                    </div>

                    {isPending ? (
                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button
                          onClick={() => handleAction(lead.id, 'VERIFIED')}
                          className="btn-primary"
                          style={{ background: 'linear-gradient(135deg, #5E9F68 0%, #3e7546 100%)', color: '#fff', padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
                        >
                          <CheckCircle2 size={16} /><span>Approve & Merge</span>
                        </button>
                        <button
                          onClick={() => handleAction(lead.id, 'REJECTED')}
                          className="btn-red"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                        >
                          <XCircle size={16} /><span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <span className={`badge ${lead.status === 'VERIFIED' || lead.status === 'APPROVED' ? 'badge-verified' : 'badge-danger'}`}>
                          {lead.status} at {lead.verified_at || 'just now'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
