import React from 'react';
import { BookOpen, GitCommit, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

const STORY_TIMELINE = [
  {
    date: '10 Jan 2025',
    title: 'Initial Entity Genesis',
    desc: 'Vikram Malhotra created Hawala bank account 9182736450 in Delhi NCR. Account flagged for initial zero-balance setup.',
    entities: ['Vikram Malhotra', 'Account 9182736450']
  },
  {
    date: '15 Apr 2025',
    title: 'Communication Network Establishment',
    desc: 'CDR logs record 142 direct call interactions between Vikram Malhotra and accomplice Suresh Kumar across 3 cell towers.',
    entities: ['Vikram Malhotra', 'Suresh Kumar', 'CDR +91-98765-43210']
  },
  {
    date: '20 Aug 2025',
    title: 'Logistics Asset Linked',
    desc: 'Vehicle DL-01-AB-1234 registered to Sector 42 hideout address and associated with Suresh Kumar.',
    entities: ['Vehicle DL-01-AB-1234', 'Suresh Kumar']
  },
  {
    date: '05 Dec 2025',
    title: 'Major Hawala Transfer Executed',
    desc: '₹45,00,000 transferred via illegal Hawala transfer to Shell Account 9182736450.',
    entities: ['Account 9182736450', 'Vikram Malhotra']
  },
  {
    date: '12 Mar 2026',
    title: 'Cross-Case Interconnection Discovery',
    desc: 'AI Cross-Case Engine connected Suresh Kumar to existing Delhi Police Crime Branch Case #101.',
    entities: ['Suresh Kumar', 'Delhi Police Case #101']
  }
];

export default function InvestigationStory() {
  return (
    <div style={{ flex: 1, height: '100%', padding: '1.5rem', overflowY: 'auto', background: 'var(--bg-primary)', color: '#f8fafc' }}>
      {/* Header Bar */}
      <div style={{ padding: '1.25rem 1.5rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>HOW THIS NETWORK EVOLVED — Data Narrative Story</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Chronological intelligence story generated automatically from verified graph evidence</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)', padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.75rem', color: '#f472b6' }}>
          <ShieldCheck size={14} /> Unique Data-Driven Narrative
        </div>
      </div>

      {/* Narrative Vertical Step Stream */}
      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {STORY_TIMELINE.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '1.25rem' }}>
            {/* Left Timeline Indicator Line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ padding: '0.4rem', borderRadius: '50%', background: '#ec4899', color: '#fff' }}>
                <GitCommit size={14} />
              </div>
              {idx !== STORY_TIMELINE.length - 1 && (
                <div style={{ flex: 1, width: '2px', background: 'var(--border-color)', margin: '0.25rem 0' }} />
              )}
            </div>

            {/* Story Card */}
            <div style={{ flex: 1, padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00f2fe', textTransform: 'uppercase' }}>
                {item.date}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.25rem 0 0.5rem 0', color: '#f8fafc' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 0.75rem 0' }}>
                {item.desc}
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {item.entities.map((e, eIdx) => (
                  <span key={eIdx} style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--bg-primary)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
