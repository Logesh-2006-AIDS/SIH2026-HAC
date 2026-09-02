import React, { useState } from 'react';
import { FileText, ShieldAlert, CheckCircle, ExternalLink, Scale, User, Upload, FileCode, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function SmartCaseBrief({ onOpenGraph }) {
  const [activeInputMode, setActiveInputMode] = useState('DEFAULT'); // DEFAULT | PASTE_TEXT | UPLOAD_PDF
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [nlpPredictionResult, setNlpPredictionResult] = useState(null);

  const defaultCaseData = {
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
    leads: [
      'Trace second-degree associates connected to Bank Account 9182736450.',
      'Issue surveillance alert for Vehicle DL-01-AB-1234 at state toll plazas.'
    ]
  };

  const handlePredictFromText = async () => {
    if (!pastedText.trim()) return;
    setIsPredicting(true);
    try {
      const res = await axios.post('/api/v1/nlp/process-text', { text: pastedText, document_id: 'PASTED-FIR-TEXT' });
      if (res.data?.success) {
        setNlpPredictionResult(res.data.data);
      }
    } catch (err) {
      console.error('Text NLP prediction failed:', err);
      alert('Failed to process text FIR copy.');
    } finally {
      setIsPredicting(false);
    }
  };

  const handlePredictFromPdf = async () => {
    if (!selectedFile) return;
    setIsPredicting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await axios.post('/api/v1/nlp/process-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setNlpPredictionResult(res.data.data);
      }
    } catch (err) {
      console.error('PDF NLP prediction failed:', err);
      alert('Failed to process uploaded FIR PDF document.');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div style={{ flex: 1, height: '100%', padding: '1.5rem', overflowY: 'auto', background: 'var(--bg-primary)', color: '#f8fafc' }}>
      {/* Header Bar with Document Input Selectors */}
      <div style={{ padding: '1.25rem 1.5rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00f2fe', textTransform: 'uppercase' }}>Automated Legal Briefing & Prediction</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0.2rem 0 0 0' }}>Smart FIR & Crime Record Intelligence</h2>
        </div>

        {/* Input Mode Selector Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveInputMode('DEFAULT')}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              background: activeInputMode === 'DEFAULT' ? '#00f2fe' : 'var(--bg-primary)',
              color: activeInputMode === 'DEFAULT' ? '#090d16' : '#cbd5e1',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Active Case Brief
          </button>
          <button
            onClick={() => setActiveInputMode('PASTE_TEXT')}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              background: activeInputMode === 'PASTE_TEXT' ? '#00f2fe' : 'var(--bg-primary)',
              color: activeInputMode === 'PASTE_TEXT' ? '#090d16' : '#cbd5e1',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <FileCode size={14} /> Paste FIR Text
          </button>
          <button
            onClick={() => setActiveInputMode('UPLOAD_PDF')}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              background: activeInputMode === 'UPLOAD_PDF' ? '#00f2fe' : 'var(--bg-primary)',
              color: activeInputMode === 'UPLOAD_PDF' ? '#090d16' : '#cbd5e1',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Upload size={14} /> Upload FIR PDF
          </button>
        </div>
      </div>

      {/* Input Mode 1: Paste FIR Text */}
      {activeInputMode === 'PASTE_TEXT' && (
        <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#38bdf8' }}>Paste FIR Copy / Police Report Text</h3>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={8}
            placeholder="Paste raw FIR contents here (e.g. FIR Number, Informant Details, Suspect Name, Vehicle No, Stolen Activa, Engine No...)"
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '8px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              color: '#f8fafc',
              fontSize: '0.88rem',
              outline: 'none',
              fontFamily: 'monospace'
            }}
          />
          <button
            onClick={handlePredictFromText}
            disabled={isPredicting}
            style={{
              marginTop: '0.75rem',
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
            {isPredicting ? 'Running NLP Model Prediction...' : <><Sparkles size={16} /> Run AI Extraction & Model Prediction</>}
          </button>
        </div>
      )}

      {/* Input Mode 2: Upload FIR PDF */}
      {activeInputMode === 'UPLOAD_PDF' && (
        <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#38bdf8' }}>Upload FIR Document (.PDF)</h3>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            style={{ padding: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#cbd5e1', width: '100%' }}
          />
          {selectedFile && (
            <button
              onClick={handlePredictFromPdf}
              disabled={isPredicting}
              style={{
                marginTop: '0.75rem',
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
              {isPredicting ? 'Extracting & Predicting...' : <><Upload size={16} /> Process PDF Document With NLP Model</>}
            </button>
          )}
        </div>
      )}

      {/* Real-time NLP Prediction Output View */}
      {nlpPredictionResult ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid #00f2fe' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00f2fe', textTransform: 'uppercase' }}>AI Prediction Output Summary</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
              Extracted {nlpPredictionResult.summary?.total_entities_extracted} Entities | {nlpPredictionResult.summary?.total_relationships_extracted} Relationships | {nlpPredictionResult.summary?.resolved_unique_entities} Resolved Target Clusters
            </div>
          </div>

          {/* Extracted Entities */}
          <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.75rem' }}>1. Extracted Entities & Patterns</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {nlpPredictionResult.entities?.map((e, idx) => (
                <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#00f2fe', fontWeight: 700 }}>{e.label}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>{e.text}</div>
                  {e.alias && <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Alias: {e.alias}</div>}
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem' }}>Confidence: {intPercent(e.confidence)}% • {e.extractor}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Extracted Semantic Relationships */}
          <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.75rem' }}>2. Extracted Semantic Relationships & Evidence</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {nlpPredictionResult.relationships?.map((r, idx) => (
                <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-primary)', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                    ({r.subject}) ──[{r.predicate}]──► ({r.object})
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                    {r.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Default Active Case Briefing */
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} /> Executive Summary Briefing
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                {defaultCaseData.summary}
              </p>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} /> Core Evidence & Source Records
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {defaultCaseData.keyEvidence.map((ev, idx) => (
                  <div key={idx} style={{ padding: '0.65rem 0.85rem', borderRadius: '6px', background: 'var(--bg-primary)', borderLeft: '3px solid #f59e0b', fontSize: '0.85rem', color: '#f1f5f9' }}>
                    {ev}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} /> Key Suspects
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {defaultCaseData.suspects.map((s, idx) => (
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
          </div>
        </div>
      )}
    </div>
  );
}

function intPercent(val) {
  if (!val) return 90;
  return intVal(val <= 1 ? val * 100 : val);
}

function intVal(val) {
  return Math.round(val);
}
