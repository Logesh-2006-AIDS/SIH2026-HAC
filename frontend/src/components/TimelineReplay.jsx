import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Clock, ShieldAlert, Activity } from 'lucide-react';

const TIMELINE_EVENTS = [
  { id: 1, date: '2025-01-10', monthIndex: 0, title: 'Network Origin', desc: 'Suspect Vikram Malhotra created bank account 9182736450.', nodeCount: 2, edgeCount: 1, type: 'FINANCIAL' },
  { id: 2, date: '2025-04-15', monthIndex: 1, title: 'CDR Contact Initialized', desc: '142 calls logged between Vikram Malhotra & Suresh Kumar.', nodeCount: 4, edgeCount: 4, type: 'COMMUNICATION' },
  { id: 3, date: '2025-08-20', monthIndex: 2, title: 'Vehicle Association', desc: 'Vehicle DL-01-AB-1234 registered to Hideout Location.', nodeCount: 6, edgeCount: 7, type: 'LOGISTICS' },
  { id: 4, date: '2025-12-05', monthIndex: 3, title: 'Hawala Transfer', desc: '₹45,00,000 transferred to Shell Account 9182736450.', nodeCount: 9, edgeCount: 12, type: 'FINANCIAL' },
  { id: 5, date: '2026-03-12', monthIndex: 4, title: 'Cross-Case Linkage', desc: 'Suresh Kumar linked to Delhi Police Case #101.', nodeCount: 12, edgeCount: 18, type: 'CRIME' }
];

export default function TimelineReplay({ nodes = [], edges = [] }) {
  const [currentStep, setCurrentStep] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= TIMELINE_EVENTS.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000 / speed);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  const activeEvent = TIMELINE_EVENTS[currentStep] || TIMELINE_EVENTS[0];

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', color: '#f8fafc' }}>
      {/* Top Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe' }}>
            <Activity size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Investigation Timeline Replay</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Replay how the criminal syndicate evolved over time</p>
          </div>
        </div>

        {/* Playback Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-primary)', padding: '0.4rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: isPlaying ? '#ef4444' : '#00f2fe',
              color: '#090d16',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem'
            }}
          >
            {isPlaying ? <><Pause size={16} /> PAUSE</> : <><Play size={16} /> PLAY REPLAY</>}
          </button>
          
          <button
            onClick={() => { setIsPlaying(false); setCurrentStep(0); }}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
            title="Reset to Start"
          >
            <RotateCcw size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            <FastForward size={14} /> Speed:
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: speed === s ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                  color: speed === s ? '#090d16' : '#cbd5e1',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Workspace */}
      <div style={{ flex: 1, padding: '1.5rem', display: 'flex', gap: '1.5rem' }}>
        {/* Left: Active Event Callout Card */}
        <div style={{ width: '360px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00f2fe', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Active Timeline Event ({currentStep + 1} / {TIMELINE_EVENTS.length})
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
              {activeEvent.title}
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem', lineHeight: 1.5 }}>
              {activeEvent.desc}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Visible Nodes</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{activeEvent.nodeCount} Entities</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Active Edges</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>{activeEvent.edgeCount} Links</div>
              </div>
            </div>
          </div>

          {/* Event History Stream */}
          <div style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Chronological Event Log
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {TIMELINE_EVENTS.map((ev, idx) => (
                <div
                  key={ev.id}
                  onClick={() => { setIsPlaying(false); setCurrentStep(idx); }}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: idx === currentStep ? '1px solid #00f2fe' : '1px solid transparent',
                    background: idx <= currentStep ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    opacity: idx <= currentStep ? 1 : 0.4,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#00f2fe', fontWeight: 600 }}>
                    <span>{ev.date}</span>
                    <span>{ev.type}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginTop: '0.2rem' }}>{ev.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Graph Animation Timeline Visualizer Canvas */}
        <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="#00f2fe" /> Time Frame: <strong style={{ color: '#f8fafc' }}>{activeEvent.date}</strong>
            </div>
            <div style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: 600 }}>
              Live Network Replay Active
            </div>
          </div>

          {/* Graphical Representation of Active Subgraph */}
          <div style={{ flex: 1, margin: '1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.05em' }}>
                {activeEvent.nodeCount} NODES // {activeEvent.edgeCount} EDGES
              </div>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '400px', margin: '0.5rem auto' }}>
                Network expanded to include {activeEvent.title}. Non-active historical nodes remain muted.
              </p>
            </div>
          </div>

          {/* Bottom Time Scrubber Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
              <span>JAN 2025 (Origin)</span>
              <span>JUN 2025</span>
              <span>DEC 2025</span>
              <span>MAR 2026 (Present)</span>
            </div>
            <input
              type="range"
              min="0"
              max={TIMELINE_EVENTS.length - 1}
              value={currentStep}
              onChange={(e) => { setIsPlaying(false); setCurrentStep(parseInt(e.target.value)); }}
              style={{ width: '100%', accentColor: '#00f2fe', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
