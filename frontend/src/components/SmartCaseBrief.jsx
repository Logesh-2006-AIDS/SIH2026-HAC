import React, { useState } from 'react';
import { FileText, ShieldAlert, CheckCircle, ExternalLink, Calendar, MapPin, Scale, User, DollarSign } from 'lucide-react';

export default function SmartCaseBrief({ onOpenGraph }) {
  const [selectedCaseId, setSelectedCaseId] = useState('CASE-2026-101');

  const caseData = {
    caseId: 'CASE-2026-101',
    title: 'Operation Silent Shadow - Organized Hawala & Cyber Fraud',
    ps: 'PS Crime Branch, Delhi',
    crimeType: 'Financial Syndicate & Organized Money Laundering',
    ipcSections: 'BNS 318 (Cheating), BNS 111 (Organized Crime), IPC 420, IT Act Sec 66D',
    summary: 'Investigation into a syndicate operating shell bank accounts and CDR communications across state borders. AI model identified high contextual overlap between suspect Vikram Malhotra and multiple financial laundering accounts.',
    suspects: [
      { name: 'Vikram Malhotra', alias: 'Viper', risk: '94/100', role: 'Primary Syndicate Mastermind' },
      { name: 'Suresh Kumar', alias: 'Chota', risk: '78/100', role: 'Logistics Accomplice' }
    ],
    keyEvidence: [
      '₹45,00,000 NEFT transfer from Shell Account 9182736450 to Primary Target.',
      '142 direct CDR communications between key accused within 30 days.',
      'ANPR Vehicle hit for DL-01-AB-1234 near illegal hideout location.'
    ],
    timeline: [
      { date: '10/01/2025', event: 'Bank Account 9182736450 opened using fake ID.' },
      { date: '15/04/2025', event: 'First flagged CDR call recorded.' },
      { date: '12/05/2026', event: 'Hawala transaction of ₹45 Lakhs executed.' }
    ],
    leads: [
      'Trace second-degree associates connected to Bank Account 9182736450.',
      'Issue surveillance alert for Vehicle DL-01-AB-1234 at state toll plazas.'
    ]
  };

  return (
    <div style={{ flex: 1, height: '100%', padding: '1.5rem', overflowY: 'auto', background: 'var(--bg-primary)', color: '#f8fafc' }}>
      {/* Header Bar */}
      <div style={{ padding: '1.25rem 1.5rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00f2fe', textTransform: 'uppercase' }}>Automated Legal Briefing</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0.2rem 0 0 0' }}>{caseData.title}</h2>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>{caseData.caseId} • {caseData.ps}</div>
        </div>

        <button
          onClick={() => onOpenGraph && onOpenGraph(caseData.caseId)}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            color: '#090d16',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          Open in Knowledge Graph <ExternalLink size={16} />
        </button>
      </div>

      {/* Grid Briefing Modules */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Summary & Evidence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Executive Summary */}
          <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} /> Executive Summary Briefing
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
              {caseData.summary}
            </p>
          </div>

          {/* Key Evidence Anchor Table */}
          <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} /> Core Evidence & Source Records
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {caseData.keyEvidence.map((ev, idx) => (
                <div key={idx} style={{ padding: '0.65rem 0.85rem', borderRadius: '6px', background: 'var(--bg-primary)', borderLeft: '3px solid #f59e0b', fontSize: '0.85rem', color: '#f1f5f9' }}>
                  {ev}
                </div>
              ))}
            </div>
          </div>

          {/* Potential Leads */}
          <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} /> Recommended Actionable Leads
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.6 }}>
              {caseData.leads.map((lead, idx) => (
                <li key={idx} style={{ marginBottom: '0.4rem' }}>{lead}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Suspects & Legal Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Key Suspects */}
          <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} /> Key Suspects
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {caseData.suspects.map((s, idx) => (
                <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>{s.name} ({s.alias})</span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                      Risk {s.risk}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>{s.role}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Applicable Legal Sections */}
          <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#a78bfa', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scale size={18} /> Applicable Legal Sections
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-primary)' }}>
              {caseData.ipcSections}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
