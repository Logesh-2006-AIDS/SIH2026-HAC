import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertTriangle, Loader, ChevronRight, Database, Users, X } from 'lucide-react';
import axios from 'axios';

const DATA_TYPES = [
  { id: 'fir_report', label: 'FIR Report Document', ext: '.txt', icon: '📋' },
  { id: 'cdr', label: 'CDR / Call Detail Records', ext: '.csv', icon: '📞' },
  { id: 'financial', label: 'Financial Transactions', ext: '.csv', icon: '💰' },
  { id: 'intelligence', label: 'Intelligence Brief', ext: '.json', icon: '🔍' },
  { id: 'csv_import', label: 'CSV Evidence Data', ext: '.csv', icon: '📊' },
  { id: 'json_import', label: 'JSON Graph Data', ext: '.json', icon: '📄' },
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
    <div className="animate-fade-in" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent', color: '#F1EBDD', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(16, 19, 17, 0.92)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(217, 170, 61, 0.18)', color: '#D9AA3D', border: '1px solid rgba(217, 170, 61, 0.3)', boxShadow: '0 0 12px rgba(217, 170, 61, 0.2)' }}>
            <Upload size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Data Ingestion & Evidence Ingestion Engine</h2>
            <p style={{ fontSize: '0.8rem', color: '#A6B0AA', margin: 0 }}>Ingest CDRs, FIRs & Financial Statements directly into Neo4j Knowledge Graph</p>
          </div>
        </div>
        {currentStep > 0 && (
          <button onClick={handleReset} className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
            <X size={14} /> New Evidence Upload
          </button>
        )}
      </div>

      {/* Step Progress Bar */}
      <div style={{ padding: '0.85rem 1.75rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(8, 10, 9, 0.6)' }}>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', overflowX: 'auto' }}>
          {STEPS.map((step, idx) => (
            <React.Fragment key={idx}>
              <div style={{
                padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.73rem', fontWeight: 700,
                background: idx <= currentStep ? 'rgba(217, 170, 61, 0.2)' : 'rgba(255,255,255,0.03)',
                color: idx <= currentStep ? '#D9AA3D' : '#6C7A73',
                border: idx === currentStep ? '1px solid rgba(217, 170, 61, 0.5)' : '1px solid transparent',
                boxShadow: idx === currentStep ? '0 0 10px rgba(217, 170, 61, 0.2)' : 'none',
                whiteSpace: 'nowrap',
              }}>{idx + 1}. {step}</div>
              {idx < STEPS.length - 1 && <ChevronRight size={12} color="#6C7A73" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: '1.75rem', overflowY: 'auto' }}>
        {error && (
          <div style={{ padding: '1.1rem 1.35rem', borderRadius: '10px', background: 'rgba(201, 42, 42, 0.15)', border: '1px solid rgba(201, 42, 42, 0.4)', color: '#ff6b6b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', fontWeight: 600 }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {/* Step 0: Select Data Type */}
        {currentStep === 0 && (
          <div className="animate-slide-up">
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, marginBottom: '1.25rem', color: '#F1EBDD' }}>Select Investigation Data Source Type</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {DATA_TYPES.map(dt => (
                <button key={dt.id} onClick={() => { setSelectedType(dt); setCurrentStep(1); }}
                  className="forensic-panel glass-panel-interactive"
                  style={{ padding: '1.5rem', cursor: 'pointer', textAlign: 'left', color: '#F1EBDD' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.65rem' }}>{dt.icon}</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{dt.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#A6B0AA', marginTop: '0.3rem', fontWeight: 600 }}>Accepts {dt.ext} formatted files</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Upload File */}
        {currentStep === 1 && (
          <div className="animate-slide-up">
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, marginBottom: '1.25rem', color: '#F1EBDD' }}>
              Upload {selectedType?.label} File
            </h3>
            <div onClick={() => fileRef.current?.click()}
              className="forensic-panel glass-panel-interactive"
              style={{ padding: '3.5rem', border: '2px dashed rgba(217, 170, 61, 0.4)', textAlign: 'center', cursor: 'pointer' }}>
              <Upload size={48} color="#D9AA3D" style={{ marginBottom: '1rem' }} className="animate-pulse-glow" />
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F1EBDD' }}>Click to select evidence file or drag & drop</div>
              <div style={{ fontSize: '0.83rem', color: '#A6B0AA', marginTop: '0.4rem' }}>Supported Formats: <strong>{selectedType?.ext}</strong></div>
            </div>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
          </div>
        )}

        {/* Step 2: File Information */}
        {currentStep === 2 && selectedFile && (
          <div className="animate-slide-up">
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, marginBottom: '1.25rem', color: '#F1EBDD' }}>File Information Overview</h3>
            <div className="forensic-panel" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div><span style={{ fontSize: '0.75rem', color: '#6C7A73', fontWeight: 700 }}>Filename</span><div style={{ fontWeight: 800, color: '#F1EBDD', fontSize: '0.95rem' }}>{selectedFile.name}</div></div>
                <div><span style={{ fontSize: '0.75rem', color: '#6C7A73', fontWeight: 700 }}>Format</span><div style={{ fontWeight: 800, color: '#F1EBDD', fontSize: '0.95rem' }}>{selectedFile.type || selectedFile.name.split('.').pop().toUpperCase()}</div></div>
                <div><span style={{ fontSize: '0.75rem', color: '#6C7A73', fontWeight: 700 }}>Size</span><div style={{ fontWeight: 800, color: '#F1EBDD', fontSize: '0.95rem' }}>{(selectedFile.size / 1024).toFixed(1)} KB</div></div>
                <div><span style={{ fontSize: '0.75rem', color: '#6C7A73', fontWeight: 700 }}>Data Type</span><div style={{ fontWeight: 800, color: '#F1EBDD', fontSize: '0.95rem' }}>{selectedType?.label || 'Auto-detect'}</div></div>
              </div>
            </div>
            <button onClick={handleProcess} className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '0.92rem' }}>
              <Database size={18} /> Execute Preprocessing & Entity Extraction
            </button>
          </div>
        )}

        {/* Step 3: Processing */}
        {currentStep === 3 && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Loader size={44} color="#D9AA3D" className="animate-spin" />
            <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '1.25rem', color: '#F1EBDD' }}>Processing Evidence Dataset...</div>
            <div style={{ fontSize: '0.86rem', color: '#A6B0AA', marginTop: '0.5rem' }}>Validating → Cleaning → Extracting Entities → Extracting Relationships</div>
          </div>
        )}

        {/* Step 4: Entities Extracted */}
        {currentStep >= 4 && ingestionResult && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Summary Banner */}
            <div style={{ padding: '1.35rem', borderRadius: '12px', background: 'rgba(94, 159, 104, 0.15)', border: '1px solid rgba(94, 159, 104, 0.4)', boxShadow: '0 0 16px rgba(94, 159, 104, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.65rem' }}>
                <CheckCircle size={20} color="#5E9F68" />
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#72bf7e' }}>Dataset Processed & Graph Synced Successfully</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', fontSize: '0.88rem', color: '#F1EBDD' }}>
                <div>Source: <strong>{ingestionResult.filename}</strong></div>
                <div>Type: <strong>{ingestionResult.source_type}</strong></div>
                <div>Records: <strong>{ingestionResult.rows_processed}</strong></div>
                <div>Entities Extracted: <strong>{ingestionResult.entities_extracted}</strong></div>
              </div>
            </div>

            {/* NLP Entities */}
            {nlpResult?.entities && nlpResult.entities.length > 0 && (
              <div className="forensic-panel" style={{ padding: '1.35rem' }}>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#D9AA3D', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <Users size={20} /> Extracted Entities ({nlpResult.entities.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '0.85rem' }}>
                  {nlpResult.entities.map((e, idx) => (
                    <div key={idx} className="evidence-card" style={{ padding: '0.85rem' }}>
                      <div style={{ fontSize: '0.72rem', color: '#D62828', fontWeight: 800 }}>{e.label}</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#24251F' }}>{e.text}</div>
                      {e.alias && <div style={{ fontSize: '0.76rem', color: '#800', fontWeight: 700 }}>Alias: {e.alias}</div>}
                      <div style={{ fontSize: '0.72rem', color: '#54564B', marginTop: '0.25rem', fontWeight: 600 }}>
                        Confidence: {Math.round((e.confidence || 0.9) * 100)}% | {e.extractor || 'pattern'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NLP Relationships */}
            {nlpResult?.relationships && nlpResult.relationships.length > 0 && (
              <div className="forensic-panel" style={{ padding: '1.35rem' }}>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#D62828', marginBottom: '0.85rem' }}>
                  Extracted Relationships ({nlpResult.relationships.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {nlpResult.relationships.map((r, idx) => (
                    <div key={idx} style={{ padding: '0.85rem 1.1rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', borderLeft: '3px solid #D62828', borderTop: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F1EBDD' }}>
                        {`(${r.subject}) --[${r.predicate}]--> (${r.object})`}
                      </div>
                      {r.explanation && <div style={{ fontSize: '0.8rem', color: '#A6B0AA', marginTop: '0.3rem' }}>{r.explanation}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Final Status */}
            <div style={{ padding: '1.35rem', borderRadius: '12px', background: 'rgba(217, 170, 61, 0.12)', border: '1px solid rgba(217, 170, 61, 0.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.45rem' }}>
                <Database size={20} color="#D9AA3D" />
                <span style={{ fontSize: '1.02rem', fontWeight: 800, color: '#D9AA3D' }}>Data Persisted to Neo4j Knowledge Graph</span>
              </div>
              <div style={{ fontSize: '0.88rem', color: '#F1EBDD' }}>
                {ingestionResult.entities_extracted} entities stored in database. Analytics recalculation scheduled.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
