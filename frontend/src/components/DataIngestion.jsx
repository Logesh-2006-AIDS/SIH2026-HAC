import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader, ChevronRight, Database, Users, ArrowRight, X } from 'lucide-react';
import axios from 'axios';

const DATA_TYPES = [
  { id: 'fir_report', label: 'FIR Report', ext: '.txt', icon: '📋' },
  { id: 'cdr', label: 'CDR / Call Detail Records', ext: '.csv', icon: '📞' },
  { id: 'financial', label: 'Financial Transactions', ext: '.csv', icon: '💰' },
  { id: 'intelligence', label: 'Intelligence Brief', ext: '.json', icon: '🔍' },
  { id: 'csv_import', label: 'CSV Data', ext: '.csv', icon: '📊' },
  { id: 'json_import', label: 'JSON Data', ext: '.json', icon: '📄' },
];

const STEPS = [
  'Select Data Type',
  'Upload File',
  'File Information',
  'Processing',
  'Entities Extracted',
  'Relationships',
  'Entity Resolution',
  'Import Complete',
];

export default function DataIngestion() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ingestionResult, setIngestionResult] = useState(null);
  const [nlpResult, setNlpResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setCurrentStep(2);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setCurrentStep(3);
    setError(null);

    try {
      // Step 1: Ingest file through backend
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (selectedType) formData.append('source_type', selectedType.id);

      const ingestRes = await axios.post('/api/v1/ingest/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (ingestRes.data?.success) {
        setIngestionResult(ingestRes.data.data);
        setCurrentStep(4);

        // Step 2: If it's a text file, also run NLP
        if (selectedType?.id === 'fir_report' || selectedFile.name.endsWith('.txt')) {
          try {
            const text = await selectedFile.text();
            const nlpRes = await axios.post('/api/v1/nlp/process-text', {
              text: text,
              document_id: selectedFile.name,
            });
            if (nlpRes.data?.success) {
              setNlpResult(nlpRes.data.data);
            }
          } catch (nlpErr) {
            console.warn('NLP processing not available:', nlpErr);
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Processing failed');
      setCurrentStep(2);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSelectedType(null);
    setSelectedFile(null);
    setIngestionResult(null);
    setNlpResult(null);
    setError(null);
  };

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', color: '#f8fafc', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Upload size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Upload Investigation Data</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Upload → Process → Review → Graph</p>
          </div>
        </div>
        {currentStep > 0 && (
          <button onClick={handleReset} style={{ padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <X size={14} /> New Upload
          </button>
        )}
      </div>

      {/* Step Progress Bar */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.5)' }}>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {STEPS.map((step, idx) => (
            <React.Fragment key={idx}>
              <div style={{
                padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600,
                background: idx <= currentStep ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                color: idx <= currentStep ? '#a5b4fc' : '#4b5563',
                border: idx === currentStep ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              }}>{idx + 1}. {step}</div>
              {idx < STEPS.length - 1 && <ChevronRight size={12} color="#4b5563" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        {error && (
          <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Step 0: Select Data Type */}
        {currentStep === 0 && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#cbd5e1' }}>Select Investigation Data Source Type</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {DATA_TYPES.map(dt => (
                <button key={dt.id} onClick={() => { setSelectedType(dt); setCurrentStep(1); }}
                  style={{ padding: '1.25rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer', textAlign: 'left', color: '#f8fafc', transition: 'all 0.15s ease' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{dt.icon}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{dt.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Accepts {dt.ext} files</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Upload File */}
        {currentStep === 1 && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#cbd5e1' }}>
              Upload {selectedType?.label} File
            </h3>
            <div onClick={() => fileRef.current?.click()}
              style={{ padding: '3rem', borderRadius: '12px', border: '2px dashed var(--border-color)', background: 'rgba(255,255,255,0.02)', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}>
              <Upload size={40} color="#818cf8" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#cbd5e1' }}>Click to select file or drag & drop</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.3rem' }}>Supported: {selectedType?.ext}</div>
            </div>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
          </div>
        )}

        {/* Step 2: File Information */}
        {currentStep === 2 && selectedFile && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#cbd5e1' }}>File Information</h3>
            <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><span style={{ fontSize: '0.75rem', color: '#64748b' }}>Filename</span><div style={{ fontWeight: 600 }}>{selectedFile.name}</div></div>
                <div><span style={{ fontSize: '0.75rem', color: '#64748b' }}>Format</span><div style={{ fontWeight: 600 }}>{selectedFile.type || selectedFile.name.split('.').pop().toUpperCase()}</div></div>
                <div><span style={{ fontSize: '0.75rem', color: '#64748b' }}>Size</span><div style={{ fontWeight: 600 }}>{(selectedFile.size / 1024).toFixed(1)} KB</div></div>
                <div><span style={{ fontSize: '0.75rem', color: '#64748b' }}>Data Type</span><div style={{ fontWeight: 600 }}>{selectedType?.label || 'Auto-detect'}</div></div>
                <div><span style={{ fontSize: '0.75rem', color: '#64748b' }}>Upload Time</span><div style={{ fontWeight: 600 }}>{new Date().toLocaleString()}</div></div>
              </div>
            </div>
            <button onClick={handleProcess} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={16} /> Run Preprocessing & Entity Extraction
            </button>
          </div>
        )}

        {/* Step 3: Processing */}
        {currentStep === 3 && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader size={40} color="#818cf8" className="animate-spin" />
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '1rem', color: '#cbd5e1' }}>Processing Investigation Data...</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>Validating → Cleaning → Extracting Entities → Extracting Relationships</div>
          </div>
        )}

        {/* Step 4: Entities Extracted */}
        {currentStep >= 4 && ingestionResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Summary Banner */}
            <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle size={18} color="#34d399" />
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399' }}>Data Processed Successfully</span>
              </div>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <div>Source: <strong>{ingestionResult.filename}</strong></div>
                <div>Type: <strong>{ingestionResult.source_type}</strong></div>
                <div>Records: <strong>{ingestionResult.rows_processed}</strong></div>
                <div>Entities Extracted: <strong>{ingestionResult.entities_extracted}</strong></div>
              </div>
            </div>

            {/* NLP Entities */}
            {nlpResult?.entities && nlpResult.entities.length > 0 && (
              <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} /> Extracted Entities ({nlpResult.entities.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {nlpResult.entities.map((e, idx) => (
                    <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.7rem', color: '#00f2fe', fontWeight: 700 }}>{e.label}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>{e.text}</div>
                      {e.alias && <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Alias: {e.alias}</div>}
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        Confidence: {Math.round((e.confidence || 0.9) * 100)}% | {e.extractor || 'pattern'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NLP Relationships */}
            {nlpResult?.relationships && nlpResult.relationships.length > 0 && (
              <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.75rem' }}>
                  Extracted Relationships ({nlpResult.relationships.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {nlpResult.relationships.map((r, idx) => (
                    <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-primary)', borderLeft: '3px solid #f59e0b' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                        ({r.subject}) --[{r.predicate}]--> ({r.object})
                      </div>
                      {r.explanation && <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '0.25rem' }}>{r.explanation}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Entity Resolution */}
            {nlpResult?.resolved_clusters && nlpResult.resolved_clusters.length > 0 && (
              <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#a78bfa', marginBottom: '0.75rem' }}>Entity Resolution</h3>
                {nlpResult.resolved_clusters.map((cluster, idx) => (
                  <div key={idx} style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.5rem' }}>
                      Possible Match — Confidence: {Math.round((cluster.confidence || 0.9) * 100)}%
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>{cluster.explanation || cluster.reason}</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Approve Merge</button>
                      <button style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'transparent', color: '#f87171', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                      <button style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Review Later</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Final Status */}
            <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Database size={18} color="#818cf8" />
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#a5b4fc' }}>Data Imported to Knowledge Graph</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                {ingestionResult.entities_extracted} entities stored in PostgreSQL. Graph analytics will be updated automatically.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
