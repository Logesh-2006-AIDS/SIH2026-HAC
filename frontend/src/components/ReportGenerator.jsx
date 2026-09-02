import React from 'react';
import { Printer, Download, FileText, ShieldAlert, CheckCircle, Award } from 'lucide-react';

export default function ReportGenerator() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ flex: 1, height: '100%', padding: '1.5rem', overflowY: 'auto', background: 'var(--bg-primary)', color: '#f8fafc' }}>
      {/* Action Header */}
      <div className="no-print" style={{ padding: '1.25rem 1.5rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Official Investigation Intelligence Report</h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Printable / Exportable Law Enforcement Dossier</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handlePrint}
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
            <Printer size={16} /> Print / Export PDF Report
          </button>
        </div>
      </div>

      {/* Printable Official Document Sheet */}
      <div
        style={{
          maxWidth: '850px',
          margin: '0 auto',
          background: '#ffffff',
          color: '#0f172a',
          padding: '2.5rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontFamily: 'sans-serif'
        }}
      >
        {/* Official Letterhead Header */}
        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>SPECIAL CRIME BRANCH // INTELLIGENCE DOSSIER</h1>
            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>CASE REF: CASE-2026-101 (OPERATION SILENT SHADOW)</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
            <div>DATE: 02/09/2026</div>
            <div>CLEARANCE: TOP SECRET // L4</div>
          </div>
        </div>

        {/* Section 1: Executive Overview */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0369a1', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem', margin: '0 0 0.5rem 0' }}>
            1. EXECUTIVE CASE OVERVIEW
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
            This evidence report details the AI Knowledge Graph analysis of Operation Silent Shadow. 
            Target Vikram Malhotra alias 'Viper' has been established as the primary coordinator connecting 
            Hawala financial account 9182736450 with illegal vehicle logistics (DL-01-AB-1234).
          </p>
        </div>

        {/* Section 2: Key Targets Table */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0369a1', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem', margin: '0 0 0.75rem 0' }}>
            2. KEY TARGET SUSPECT MATRIX
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Target Name</th>
                <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Alias</th>
                <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Role</th>
                <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Vikram Malhotra</td>
                <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Viper</td>
                <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Syndicate Leader</td>
                <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', fontWeight: 700, color: '#dc2626' }}>94/100 (Critical)</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Suresh Kumar</td>
                <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Chota</td>
                <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Logistics Accomplice</td>
                <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', fontWeight: 700, color: '#d97706' }}>78/100 (High)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Core Evidence & Network Findings */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0369a1', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem', margin: '0 0 0.5rem 0' }}>
            3. EVIDENCE TRAIL & GRAPH FINDINGS
          </h2>
          <ul style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.6, paddingLeft: '1.2rem', margin: 0 }}>
            <li><strong>Hawala Transaction:</strong> ₹45,00,000 transferred to Account 9182736450 on 12/05/2026.</li>
            <li><strong>CDR Log Anchor:</strong> 142 direct calls verified between Target A and Target B within 30 days.</li>
            <li><strong>Cross-Case Verification:</strong> Target Suresh Kumar linked to Delhi Police Case #101.</li>
          </ul>
        </div>

        {/* Signature Box */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid #cbd5e1', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
          <div>Generated by: AURA-GRAPH Intelligence Engine</div>
          <div>Investigating Officer Signature: _______________________</div>
        </div>
      </div>
    </div>
  );
}
