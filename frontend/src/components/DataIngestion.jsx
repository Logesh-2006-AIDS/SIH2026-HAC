import React, { useState, useRef } from 'react';
import { 
  Upload, CheckCircle, AlertTriangle, Loader, ChevronRight, 
  Database, Users, X, FileText, Phone, DollarSign, ShieldAlert, 
  Sparkles, ArrowRight, Play, CheckCircle2
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { getIngestionStats } from '../data/mockService.js';

const DATA_TYPES = [
  { id: 'fir_report', label: 'FIR Report Document', ext: '.txt', icon: '📋', count: '1 Case Document', desc: 'First Information Report with accused, narrative, vehicle numbers' },
  { id: 'cdr', label: 'CDR / Call Detail Records', ext: '.csv', icon: '📞', count: '142 Call Logs', desc: 'Cell tower records, IMEI, timestamps, duration, frequency' },
  { id: 'financial', label: 'Financial Transactions', ext: '.csv', icon: '💰', count: '28 Transactions', desc: 'NEFT/RTGS wire transfers, account numbers, amounts, dates' },
  { id: 'intelligence', label: 'Intelligence Brief', ext: '.json', icon: '🔍', count: '4 Field Reports', desc: 'Covert field reports, suspect affiliations, informant tips' },
];

const PIPELINE_STAGES = [
  { id: 'upload', label: 'Evidence Validation & Checksum Verification', duration: 400 },
  { id: 'ocr_nlp', label: 'AI/NLP Named Entity Recognition (Persons, Vehicles, Phones)', duration: 600 },
  { id: 'resolution', label: 'Cross-Case Entity Resolution & Alias Disambiguation', duration: 500 },
  { id: 'graph', label: 'Knowledge Graph Topology Generation & Relationship Mapping', duration: 600 },
  { id: 'pattern', label: 'Suspicious Pattern Detection & Centrality Computation', duration: 400 },
];

export default function DataIngestion({ caseId = '101', onComplete }) {
  const { setIngestionDone, setActiveTab, focusEntityById } = useInvestigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStageIdx, setPipelineStageIdx] = useState(-1);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [summaryStats, setSummaryStats] = useState(null);
  const fileRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setCurrentStep(2);
    }
  };

  const runPipelineAnimation = async () => {
    setIsProcessing(true);
    setPipelineStageIdx(0);
    setPipelineProgress(15);
    setCompleted(false);

    // Step 1
    await new Promise(r => setTimeout(r, 450));
    setPipelineStageIdx(1);
    setPipelineProgress(40);

    // Step 2
    await new Promise(r => setTimeout(r, 550));
    setPipelineStageIdx(2);
    setPipelineProgress(65);

    // Step 3
    await new Promise(r => setTimeout(r, 500));
    setPipelineStageIdx(3);
    setPipelineProgress(85);

    // Step 4
    await new Promise(r => setTimeout(r, 450));
    setPipelineStageIdx(4);
    setPipelineProgress(100);

    await new Promise(r => setTimeout(r, 300));
    const stats = await getIngestionStats();
    setSummaryStats(stats.data);
    setIsProcessing(false);
    setCompleted(true);
    if (setIngestionDone) setIngestionDone(true);
    if (onComplete) onComplete();
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
      {/* Top Banner */}
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
            <Database size={22} style={{ color: '#D9AA3D' }} />
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F1EBDD' }}>
              Multi-Source Crime Data Ingestion & Entity Resolution
            </h1>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: '20px',
              background: 'rgba(94,159,104,0.2)',
              border: '1px solid rgba(94,159,104,0.45)',
              color: '#4ADE80',
              letterSpacing: '0.05em',
            }}>
              AUTOMATED PIPELINE
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#A6B0AA' }}>
            Ingests unstructured FIR text, telecom CDR dumps, banking statements, and field intelligence into a unified forensic graph.
          </p>
        </div>

        {/* Action Button to run full multi-source demo pipeline */}
        {!isProcessing && !completed && (
          <button
            onClick={runPipelineAnimation}
            style={{
              padding: '0.75rem 1.4rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #D9AA3D 0%, #C49830 100%)',
              border: 'none',
              color: '#0B100D',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(217,170,61,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <Play size={16} />
            Run Multi-Source Ingestion (Demo Pipeline)
          </button>
        )}
      </div>

      {/* Progress / Pipeline Execution Display */}
      {isProcessing && (
        <div style={{
          background: 'rgba(17, 24, 21, 0.95)',
          border: '1px solid rgba(217,170,61,0.35)',
          borderRadius: '12px',
          padding: '1.75rem',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Loader size={18} className="animate-spin" style={{ color: '#D9AA3D' }} />
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1EBDD' }}>
                Executing Ingestion Pipeline: {PIPELINE_STAGES[pipelineStageIdx]?.label}
              </span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#D9AA3D' }}>
              {pipelineProgress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '1.25rem',
          }}>
            <div style={{
              width: `${pipelineProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #D9AA3D 0%, #4ADE80 100%)',
              transition: 'width 0.4s ease',
            }} />
          </div>

          {/* Step items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {PIPELINE_STAGES.map((stg, i) => {
              const isPast = i < pipelineStageIdx;
              const isCurr = i === pipelineStageIdx;
              return (
                <div
                  key={stg.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    background: isCurr ? 'rgba(217,170,61,0.1)' : 'rgba(255,255,255,0.02)',
                    color: isPast ? '#4ADE80' : isCurr ? '#D9AA3D' : '#6C7A73',
                    fontSize: '0.82rem',
                    fontWeight: isCurr ? 700 : 500,
                  }}
                >
                  {isPast ? <CheckCircle2 size={16} /> : isCurr ? <Loader size={16} className="animate-spin" /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid #6C7A73' }} />}
                  <span>{stg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completion Summary Card */}
      {completed && summaryStats && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(94,159,104,0.15) 0%, rgba(17,24,21,0.95) 100%)',
          border: '1px solid rgba(94,159,104,0.4)',
          borderRadius: '12px',
          padding: '1.75rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                background: 'rgba(94,159,104,0.25)',
                borderRadius: '50%',
                padding: '0.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(94,159,104,0.5)',
              }}>
                <CheckCircle2 size={28} color="#4ADE80" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#F1EBDD' }}>
                  Ingestion & Graph Synthesis Completed Successfully
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#A6B0AA' }}>
                  All 4 sources processed, unified, and linked into the criminal knowledge graph.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={() => setActiveTab && setActiveTab('nlp')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  background: 'rgba(99,102,241,0.2)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  color: '#A5B4FC',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Sparkles size={14} />
                Inspect NLP Extractions
              </button>
              <button
                onClick={() => setActiveTab && setActiveTab('network')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  background: '#D9AA3D',
                  border: 'none',
                  color: '#0B100D',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <ChevronRight size={14} />
                Explore Knowledge Graph
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.7rem', color: '#6C7A73', textTransform: 'uppercase' }}>Data Sources Ingested</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F1EBDD', marginTop: '0.2rem' }}>4 Sources</div>
              <div style={{ fontSize: '0.72rem', color: '#4ADE80', marginTop: '0.2rem' }}>FIR, CDR, Banking, Intel</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.7rem', color: '#6C7A73', textTransform: 'uppercase' }}>Entities Resolved</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D9AA3D', marginTop: '0.2rem' }}>{summaryStats.entities_resolved || 24} Entities</div>
              <div style={{ fontSize: '0.72rem', color: '#A6B0AA', marginTop: '0.2rem' }}>5 aliases mapped to suspects</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.7rem', color: '#6C7A73', textTransform: 'uppercase' }}>Graph Edges Created</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ECDC4', marginTop: '0.2rem' }}>{summaryStats.edges_created || 38} Edges</div>
              <div style={{ fontSize: '0.72rem', color: '#A6B0AA', marginTop: '0.2rem' }}>Co-occurrence & Call logs</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.7rem', color: '#6C7A73', textTransform: 'uppercase' }}>Cross-Case Bridge Nodes</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FF6B6B', marginTop: '0.2rem' }}>3 Shared Entities</div>
              <div style={{ fontSize: '0.72rem', color: '#FF6B6B', marginTop: '0.2rem' }}>Ravi Kumar, Phone-001, Acc-204</div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Source Cards */}
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#F1EBDD' }}>
        Active Evidence Data Sources ({DATA_TYPES.length})
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {DATA_TYPES.map(dt => (
          <div
            key={dt.id}
            style={{
              background: 'rgba(17, 24, 21, 0.8)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.8rem' }}>{dt.icon}</span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  background: completed ? 'rgba(94,159,104,0.15)' : 'rgba(217,170,61,0.15)',
                  border: `1px solid ${completed ? 'rgba(94,159,104,0.4)' : 'rgba(217,170,61,0.4)'}`,
                  color: completed ? '#4ADE80' : '#D9AA3D',
                }}>
                  {completed ? 'SYNCHRONIZED' : 'READY TO INGEST'}
                </span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1EBDD', marginBottom: '0.25rem' }}>
                {dt.label}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6C7A73', marginBottom: '0.6rem' }}>
                {dt.count} • {dt.ext}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#A6B0AA', lineHeight: 1.4 }}>
                {dt.desc}
              </div>
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#6C7A73' }}>Format: {dt.ext}</span>
              <button
                onClick={() => { setSelectedType(dt); setCurrentStep(1); }}
                style={{
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
                Upload New {dt.ext}
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Custom File Modal / Dropzone */}
      {currentStep === 1 && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem',
        }}>
          <div style={{
            background: 'rgba(17, 24, 21, 0.98)',
            border: '1px solid rgba(217,170,61,0.3)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F1EBDD' }}>
                Upload {selectedType?.label}
              </h3>
              <button
                onClick={() => setCurrentStep(0)}
                style={{ background: 'transparent', border: 'none', color: '#A6B0AA', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              style={{
                padding: '2.5rem',
                border: '2px dashed rgba(217, 170, 61, 0.4)',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(217, 170, 61, 0.03)',
              }}
            >
              <Upload size={38} color="#D9AA3D" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1EBDD' }}>
                Click to select {selectedType?.ext} file
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6C7A73', marginTop: '0.35rem' }}>
                File will be processed through AI entity recognition pipeline
              </div>
            </div>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
          </div>
        </div>
      )}

      {currentStep === 2 && selectedFile && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem',
        }}>
          <div style={{
            background: 'rgba(17, 24, 21, 0.98)',
            border: '1px solid rgba(217,170,61,0.3)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#F1EBDD' }}>
              File Ready for Ingestion
            </h3>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ color: '#A6B0AA' }}>File: <strong style={{ color: '#F1EBDD' }}>{selectedFile.name}</strong></div>
              <div style={{ color: '#A6B0AA', marginTop: '0.3rem' }}>Size: {(selectedFile.size / 1024).toFixed(1)} KB</div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setCurrentStep(0)}
                style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#A6B0AA', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setCurrentStep(0);
                  runPipelineAnimation();
                }}
                style={{ padding: '0.5rem 1.25rem', background: '#D9AA3D', border: 'none', color: '#0B100D', fontWeight: 800, borderRadius: '6px', cursor: 'pointer' }}
              >
                Run Ingestion Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
