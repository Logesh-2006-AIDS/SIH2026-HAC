import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock, 
  ChevronDown, ChevronUp, ExternalLink, Filter, Sparkles, 
  MessageSquare, FileText, ArrowRight, Eye, ShieldAlert
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { apiPost } from '../lib/api.js';

const PRIORITY_BADGES = {
  CRITICAL: { bg: 'rgba(214,40,40,0.18)', border: 'rgba(214,40,40,0.4)', color: '#FF6B6B' },
  HIGH:     { bg: 'rgba(247,127,0,0.18)',  border: 'rgba(247,127,0,0.4)',  color: '#FFA726' },
  MEDIUM:   { bg: 'rgba(217,170,61,0.18)', border: 'rgba(217,170,61,0.4)', color: '#D9AA3D' },
  LOW:      { bg: 'rgba(78,205,196,0.18)', border: 'rgba(78,205,196,0.4)', color: '#4ECDC4' },
};

const STATUS_BADGES = {
  AI_SUGGESTED: { label: 'AI Suggested', bg: 'rgba(99,102,241,0.18)', border: 'rgba(99,102,241,0.4)', color: '#818CF8' },
  PENDING:      { label: 'Pending Review', bg: 'rgba(217,170,61,0.18)', border: 'rgba(217,170,61,0.4)', color: '#D9AA3D' },
  UNDER_REVIEW: { label: 'Under Review', bg: 'rgba(247,127,0,0.18)', border: 'rgba(247,127,0,0.4)', color: '#FFA726' },
  VERIFIED:     { label: 'Human Verified', bg: 'rgba(94,159,104,0.22)', border: 'rgba(94,159,104,0.5)', color: '#4ADE80' },
  REJECTED:     { label: 'Rejected', bg: 'rgba(108,122,115,0.2)', border: 'rgba(108,122,115,0.4)', color: '#A6B0AA' },
};

export default function InvestigationLeads() {
  const { leads, dispatchLeads, focusEntityById, setActiveTab } = useInvestigation();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedLeads, setExpandedLeads] = useState({ 'LEAD-001': true, 'LEAD-002': true });
  const [remarks, setRemarks] = useState({});

  const toggleExpand = (id) => {
    setExpandedLeads(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStatusChange = async (id, newStatus) => {
    const remarkText = remarks[id] || (newStatus === 'VERIFIED' ? 'Investigator human verification confirmed against case files.' : newStatus === 'REJECTED' ? 'Reviewed and dismissed by investigating officer.' : 'Marked for detailed forensic review.');
    dispatchLeads({ type: 'VERIFY_LEAD', id, status: newStatus, remarks: remarkText, reviewed_by: 'DL-CB-9021', reviewed_at: new Date().toISOString() });
    try {
      await apiPost(`/api/v1/leads/${id}/verify`, {
        action: newStatus,
        remarks: remarkText,
      });
    } catch (err) {
      console.warn('Live lead verification fallback:', err);
    }
  };

  const filteredLeads = (leads || []).filter(l => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'PENDING') return l.status === 'PENDING' || l.status === 'AI_SUGGESTED';
    return l.status === filterStatus;
  });

  const totalCount = (leads || []).length;
  const verifiedCount = (leads || []).filter(l => l.status === 'VERIFIED').length;
  const pendingCount = (leads || []).filter(l => l.status === 'PENDING' || l.status === 'AI_SUGGESTED' || l.status === 'UNDER_REVIEW').length;
  const criticalCount = (leads || []).filter(l => l.priority === 'CRITICAL').length;

  return (
    <div style={{
      flex: 1,
      height: '100%',
      overflowY: 'auto',
      padding: '1.75rem',
      background: 'transparent',
      color: '#F1EBDD',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20,28,24,0.95) 0%, rgba(13,20,17,0.95) 100%)',
        border: '1px solid rgba(217,170,61,0.25)',
        borderRadius: '12px',
        padding: '1.25rem 1.75rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <Sparkles size={22} style={{ color: '#D9AA3D' }} />
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F1EBDD' }}>
              Actionable Investigation Leads
            </h1>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: '20px',
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.45)',
              color: '#A5B4FC',
              letterSpacing: '0.05em',
            }}>
              HUMAN-IN-THE-LOOP
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#A6B0AA' }}>
            AI-extracted leads synthesized from FIR text, CDR call records, and financial transaction links. All leads require investigator human sign-off.
          </p>
        </div>

        {/* Status Counters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '0.5rem 0.9rem',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F1EBDD' }}>{totalCount}</div>
            <div style={{ fontSize: '0.68rem', color: '#6C7A73', textTransform: 'uppercase' }}>Total Leads</div>
          </div>
          <div style={{
            background: 'rgba(214,40,40,0.12)',
            padding: '0.5rem 0.9rem',
            borderRadius: '8px',
            border: '1px solid rgba(214,40,40,0.3)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FF6B6B' }}>{criticalCount}</div>
            <div style={{ fontSize: '0.68rem', color: '#FF6B6B', textTransform: 'uppercase' }}>Critical</div>
          </div>
          <div style={{
            background: 'rgba(217,170,61,0.12)',
            padding: '0.5rem 0.9rem',
            borderRadius: '8px',
            border: '1px solid rgba(217,170,61,0.3)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#D9AA3D' }}>{pendingCount}</div>
            <div style={{ fontSize: '0.68rem', color: '#D9AA3D', textTransform: 'uppercase' }}>Pending</div>
          </div>
          <div style={{
            background: 'rgba(94,159,104,0.12)',
            padding: '0.5rem 0.9rem',
            borderRadius: '8px',
            border: '1px solid rgba(94,159,104,0.3)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4ADE80' }}>{verifiedCount}</div>
            <div style={{ fontSize: '0.68rem', color: '#4ADE80', textTransform: 'uppercase' }}>Verified</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: '0.75rem',
      }}>
        {[
          { id: 'ALL', label: 'All Leads' },
          { id: 'PENDING', label: 'Needs Review' },
          { id: 'UNDER_REVIEW', label: 'Under Review' },
          { id: 'VERIFIED', label: 'Verified Leads' },
          { id: 'REJECTED', label: 'Dismissed' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilterStatus(t.id)}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: filterStatus === t.id ? 'rgba(217,170,61,0.2)' : 'rgba(255,255,255,0.03)',
              border: '1px solid',
              borderColor: filterStatus === t.id ? 'rgba(217,170,61,0.5)' : 'rgba(255,255,255,0.08)',
              color: filterStatus === t.id ? '#F1EBDD' : '#A6B0AA',
              transition: 'all 0.15s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lead Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredLeads.map((lead) => {
          const priorityStyle = PRIORITY_BADGES[lead.priority] || PRIORITY_BADGES.MEDIUM;
          const statusStyle = STATUS_BADGES[lead.status] || STATUS_BADGES.PENDING;
          const isExpanded = !!expandedLeads[lead.id];

          return (
            <div
              key={lead.id}
              style={{
                background: 'rgba(17, 24, 21, 0.85)',
                border: `1px solid ${lead.status === 'VERIFIED' ? 'rgba(94,159,104,0.4)' : lead.priority === 'CRITICAL' ? 'rgba(214,40,40,0.35)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: '10px',
                padding: '1.25rem 1.5rem',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Card Top Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      background: priorityStyle.bg,
                      border: `1px solid ${priorityStyle.border}`,
                      color: priorityStyle.color,
                    }}>
                      {lead.priority}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      background: statusStyle.bg,
                      border: `1px solid ${statusStyle.border}`,
                      color: statusStyle.color,
                    }}>
                      {statusStyle.label}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#6C7A73', fontFamily: 'monospace' }}>
                      {lead.id}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#D9AA3D', background: 'rgba(217,170,61,0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      {lead.match_type}
                    </span>
                    {lead.evidentiary_strength && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(94,159,104,0.18)',
                        border: '1px solid rgba(94,159,104,0.4)',
                        color: '#4ADE80',
                        fontFamily: 'monospace',
                      }}>
                        Strength: {Math.round((lead.evidentiary_strength.score || 0.8) * 100)}% ({lead.evidentiary_strength.label || 'MEDIUM'})
                      </span>
                    )}
                    {lead.reviewed_by && (
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#A6B0AA',
                      }}>
                        Officer #{lead.reviewed_by}
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: '0.2rem 0 0.45rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#F1EBDD' }}>
                    {lead.title}
                  </h3>

                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#C5CDC8', lineHeight: 1.5 }}>
                    {lead.reason}
                  </p>
                </div>

                {/* Right metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', minWidth: '120px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#6C7A73' }}>AI Confidence:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#D9AA3D' }}>
                      {Math.round((lead.confidence || 0.85) * 100)}%
                    </span>
                  </div>
                  <div style={{
                    width: '100px',
                    height: '5px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${Math.round((lead.confidence || 0.85) * 100)}%`,
                      height: '100%',
                      background: '#D9AA3D',
                    }} />
                  </div>
                  {lead.verified_at && (
                    <div style={{ fontSize: '0.68rem', color: '#4ADE80', marginTop: '0.25rem' }}>
                      Verified {lead.verified_at}
                    </div>
                  )}
                </div>
              </div>

              {/* Badges & Entity links */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#6C7A73' }}>Cases:</span>
                  {(lead.cases || []).map(c => (
                    <span
                      key={c}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(217,170,61,0.12)',
                        border: '1px solid rgba(217,170,61,0.25)',
                        color: '#D9AA3D',
                        fontFamily: 'monospace',
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#6C7A73' }}>Entities:</span>
                  {(lead.entities || []).map(entId => (
                    <button
                      key={entId}
                      onClick={() => {
                        focusEntityById && focusEntityById(entId);
                        setActiveTab && setActiveTab('network');
                      }}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#4ECDC4',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                      title="Inspect Entity in Graph"
                    >
                      {entId}
                      <ExternalLink size={10} />
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => toggleExpand(lead.id)}
                  style={{
                    marginLeft: 'auto',
                    background: 'transparent',
                    border: 'none',
                    color: '#D9AA3D',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {isExpanded ? 'Hide Evidence' : `Review Evidence (${(lead.evidence || []).length})`}
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Expandable Evidence Section */}
              {isExpanded && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(10, 15, 13, 0.7)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D9AA3D', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={13} />
                    Supporting Evidence Records
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {(lead.evidence || []).map((ev, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                          fontSize: '0.8rem',
                          color: '#C5CDC8',
                          lineHeight: 1.4,
                        }}
                      >
                        <span style={{ color: '#D9AA3D', fontWeight: 700 }}>•</span>
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>

                  {/* Investigator Notes input */}
                  <div style={{ marginTop: '0.85rem' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#6C7A73', marginBottom: '0.3rem' }}>
                      Investigator Verification Remarks:
                    </label>
                    <input
                      type="text"
                      placeholder="Add investigation notes, verification justification, or instructions..."
                      value={remarks[lead.id] || ''}
                      onChange={(e) => setRemarks({ ...remarks, [lead.id]: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        color: '#F1EBDD',
                        fontSize: '0.8rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div style={{
                marginTop: '1rem',
                display: 'flex',
                gap: '0.6rem',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => {
                    focusEntityById && focusEntityById(lead.entities?.[0] || 'PERSON-001');
                    setActiveTab && setActiveTab('network');
                  }}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#A6B0AA',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Eye size={13} />
                  View in Graph
                </button>

                {lead.status !== 'UNDER_REVIEW' && lead.status !== 'VERIFIED' && (
                  <button
                    onClick={() => handleStatusChange(lead.id, 'UNDER_REVIEW')}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      background: 'rgba(247,127,0,0.15)',
                      border: '1px solid rgba(247,127,0,0.35)',
                      color: '#FFA726',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Clock size={13} />
                    Mark Under Review
                  </button>
                )}

                {lead.status !== 'VERIFIED' && (
                  <button
                    onClick={() => handleStatusChange(lead.id, 'VERIFIED')}
                    style={{
                      padding: '0.4rem 0.95rem',
                      borderRadius: '6px',
                      background: 'rgba(94,159,104,0.22)',
                      border: '1px solid rgba(94,159,104,0.5)',
                      color: '#4ADE80',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    Approve / Verify Lead
                  </button>
                )}

                {lead.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleStatusChange(lead.id, 'REJECTED')}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      background: 'rgba(214,40,40,0.12)',
                      border: '1px solid rgba(214,40,40,0.3)',
                      color: '#FF6B6B',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <XCircle size={13} />
                    Dismiss Lead
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
