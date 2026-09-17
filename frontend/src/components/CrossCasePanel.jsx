import React, { useEffect, useState } from 'react';
import { 
  GitBranch, ExternalLink, ArrowRight, ShieldAlert, 
  Layers, Users, Phone, DollarSign, Search, CheckCircle2 
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { getCrossLinks, getCrossCaseMatrix, getCentrality } from '../data/mockService.js';

export default function CrossCasePanel({ onFocusEntity, selectedCase = '101' }) {
  const { focusEntityById, setActiveTab, setSelectedCase } = useInvestigation();
  const [links, setLinks] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [globalBridges, setGlobalBridges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCaseTab, setActiveCaseTab] = useState(selectedCase);

  useEffect(() => {
    setActiveCaseTab(selectedCase);
  }, [selectedCase]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCrossLinks(activeCaseTab),
      getCrossCaseMatrix(),
      getCentrality(),
    ]).then(([crossRes, matRes, centRes]) => {
      if (crossRes?.data) setLinks(crossRes.data.links || []);
      if (matRes?.data) setMatrix(matRes.data || []);
      if (centRes?.data) setGlobalBridges(centRes.data || []);
    }).finally(() => setLoading(false));
  }, [activeCaseTab]);

  const handleInspect = (entityId) => {
    if (onFocusEntity) onFocusEntity(entityId);
    else if (focusEntityById) focusEntityById(entityId);
    if (setActiveTab) setActiveTab('network');
  };

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
      {/* Banner */}
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
            <GitBranch size={22} style={{ color: '#D9AA3D' }} />
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F1EBDD' }}>
              Cross-Case Criminal Intelligence & Network Synthesis
            </h1>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: '20px',
              background: 'rgba(214,40,40,0.2)',
              border: '1px solid rgba(214,40,40,0.45)',
              color: '#FF6B6B',
              letterSpacing: '0.05em',
            }}>
              CROSS-CASE CORRELATION
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#A6B0AA' }}>
            Automatically discovers entities and communications bridging isolated police complaints into an organized crime syndicate.
          </p>
        </div>

        {/* Case Selector Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.35rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {['101', '102', '103'].map(c => (
            <button
              key={c}
              onClick={() => setActiveCaseTab(c)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                background: activeCaseTab === c ? '#D9AA3D' : 'transparent',
                color: activeCaseTab === c ? '#0B100D' : '#A6B0AA',
                fontWeight: activeCaseTab === c ? 800 : 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Case {c} Focus
            </button>
          ))}
        </div>
      </div>

      {/* Cross-Case Synergies Matrix */}
      <div style={{
        background: 'rgba(17, 24, 21, 0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
      }}>
        <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#D9AA3D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={16} /> Cross-Case Intersection Matrix
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#6C7A73', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Case Pair</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Shared Suspects / Persons</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Shared Phones (CDR)</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Shared Accounts (Wire)</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Syndicate Link Strength</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: (row.case_a.includes(activeCaseTab) || row.case_b.includes(activeCaseTab)) ? 'rgba(217,170,61,0.06)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: '#F1EBDD' }}>
                    {row.case_a} ↔ {row.case_b}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {(row.shared_persons || []).map((p, i) => (
                        <span key={i} style={{ background: 'rgba(217,170,61,0.15)', color: '#D9AA3D', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.74rem' }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {(row.shared_phones || []).map((ph, i) => (
                        <span key={i} style={{ background: 'rgba(78,205,196,0.15)', color: '#4ECDC4', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.74rem' }}>
                          {ph}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {(row.shared_accounts || []).map((acc, i) => (
                        <span key={i} style={{ background: 'rgba(99,102,241,0.15)', color: '#A5B4FC', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.74rem' }}>
                          {acc}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: row.strength === 'CRITICAL' ? 'rgba(214,40,40,0.2)' : 'rgba(247,127,0,0.2)',
                      color: row.strength === 'CRITICAL' ? '#FF6B6B' : '#FFA726',
                      border: `1px solid ${row.strength === 'CRITICAL' ? 'rgba(214,40,40,0.4)' : 'rgba(247,127,0,0.4)'}`,
                    }}>
                      {row.strength || 'STRONG'} ({row.score || '96%'})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shared Entities Details */}
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#F1EBDD' }}>
        Identified Bridge Entities for Case {activeCaseTab} ({links.length})
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {links.map((link) => (
          <div
            key={link.entity_id}
            style={{
              background: 'rgba(17, 24, 21, 0.85)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: 'rgba(217,170,61,0.15)',
                    color: '#D9AA3D',
                    textTransform: 'uppercase',
                  }}>
                    {link.type}
                  </span>
                  <h4 style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '1rem', fontWeight: 800, color: '#F1EBDD' }}>
                    {link.name}
                  </h4>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#4ADE80',
                  background: 'rgba(94,159,104,0.15)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                }}>
                  {link.total_cases || (link.cases || []).length} Cases
                </span>
              </div>

              <p style={{ margin: '0.5rem 0 0.85rem 0', fontSize: '0.82rem', color: '#A6B0AA', lineHeight: 1.45 }}>
                {link.why_it_matters || link.explanation || `Operates as a high-degree bridge entity between active cases.`}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', color: '#6C7A73' }}>Appears in:</span>
                {(link.shared_cases || link.cases || []).map((c, i) => (
                  <span key={i} style={{ fontSize: '0.7rem', fontFamily: 'monospace', padding: '0.15rem 0.4rem', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', color: '#C5CDC8' }}>
                    {c.startsWith('CASE') ? c : `CASE-${c}`}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => handleInspect(link.entity_id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  background: 'rgba(217,170,61,0.15)',
                  border: '1px solid rgba(217,170,61,0.4)',
                  color: '#D9AA3D',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                Inspect in Graph <ExternalLink size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
