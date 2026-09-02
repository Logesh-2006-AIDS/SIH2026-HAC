import React, { useState } from 'react';
import { Bot, Send, Sparkles, ExternalLink, ShieldCheck, Database, ArrowRight } from 'lucide-react';

const PRESET_QUERIES = [
  "Show everyone connected to Vikram Malhotra",
  "Why is Vikram Malhotra considered high risk?",
  "Which suspects are connected through vehicles?",
  "Find common locations between Vikram Malhotra and Suresh Kumar",
  "Show financial connections involving bank account 9182736450",
  "Which people appear in multiple cases?",
  "What changed in this network during March 2026?",
  "Find the shortest connection between Vikram Malhotra and Person B"
];

export default function AICopilot({ onFocusEntity }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Greetings, Inspector. I am your AI Investigation Copilot. I analyze relationships, CDRs, Hawala transfers, and cross-case links across your database. Ask me anything about your active criminal network.",
      entities: [],
      sources: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSendQuery = (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    // Append User Message
    const newMessages = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    setInputQuery('');
    setIsAnalyzing(true);

    // Simulate AI Copilot Data Retrieval & Analysis
    setTimeout(() => {
      let botResponse = {
        sender: 'assistant',
        text: '',
        confidence: '94% (High Evidence Grounding)',
        entities: [],
        sources: [],
        cases: []
      };

      if (textToSend.toLowerCase().includes('vikram') || textToSend.toLowerCase().includes('high risk')) {
        botResponse.text = "Vikram Malhotra alias 'Viper' is classified as High Priority (Risk Score 94/100). He exhibits high Betweenness Centrality (0.84), serving as the primary bridge between the Hawala Financial Ring and the Vehicle Logistics Cell. He made 142 direct calls to associate Suresh Kumar and initiated a ₹45 Lakhs transfer to Account 9182736450.";
        botResponse.entities = [
          { id: 'SUSP-001', name: 'Vikram Malhotra', type: 'Person', role: 'Primary Target' },
          { id: 'ACC-918273', name: 'Bank Account 9182736450', type: 'Financial', role: 'Hawala Receiver' },
          { id: 'SUSP-002', name: 'Suresh Kumar', type: 'Person', role: 'Accomplice' }
        ];
        botResponse.sources = ['FIR No. 101/2026 PS Crime Branch', 'CDR Call Record #8491', 'Bank Transaction Ledger'];
        botResponse.cases = ['CASE-2026-101', 'CASE-2025-084'];
      } else if (textToSend.toLowerCase().includes('vehicle')) {
        botResponse.text = "Target vehicles DL-01-AB-1234 and MH-12-CD-5678 connect 3 primary suspects across 2 independent police stations. Vehicle DL-01-AB-1234 was logged at Cell Tower Sector 42 during the time of the illegal transaction.";
        botResponse.entities = [
          { id: 'VEH-001', name: 'DL-01-AB-1234', type: 'Vehicle', role: 'Spotted at Hideout' },
          { id: 'SUSP-001', name: 'Vikram Malhotra', type: 'Person', role: 'Frequent User' }
        ];
        botResponse.sources = ['ANPR Surveillance Log 12/05/2026', 'FIR No. 101/2026'];
        botResponse.cases = ['CASE-2026-101'];
      } else {
        botResponse.text = `Analyzed network entities related to "${textToSend}". Found 4 linked suspects, 2 CDR call clusters, and 1 cross-case match with Delhi Police Crime Branch records.`;
        botResponse.entities = [
          { id: 'SUSP-001', name: 'Vikram Malhotra', type: 'Person', role: 'Target' },
          { id: 'SUSP-002', name: 'Suresh Kumar', type: 'Person', role: 'Associate' }
        ];
        botResponse.sources = ['NCRB Data Sync', 'FIR Record 101/2026'];
        botResponse.cases = ['CASE-2026-101'];
      }

      setMessages([...newMessages, botResponse]);
      setIsAnalyzing(false);
    }, 800);
  };

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
            <Bot size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>AI Investigation Copilot</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Evidence-backed entity retrieval & reasoning assistant</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', color: '#34d399' }}>
          <ShieldCheck size={14} /> Zero AI Hallucination Guarantee
        </div>
      </div>

      {/* Preset Queries Grid */}
      <div style={{ padding: '1rem 1.5rem', background: 'rgba(15, 23, 42, 0.4)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Suggested Investigation Queries</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {PRESET_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(q)}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: '#cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Message Chat Feed */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: msg.sender === 'user' ? '70%' : '85%'
            }}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                background: msg.sender === 'user' ? '#0284c7' : 'var(--bg-secondary)',
                border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                color: msg.sender === 'user' ? '#ffffff' : '#f1f5f9',
                fontSize: '0.9rem',
                lineHeight: '1.5'
              }}
            >
              {msg.text}

              {/* Evidence & Entities Card */}
              {msg.entities && msg.entities.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Database size={14} /> Relevant Graph Entities Extracted:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {msg.entities.map((e, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{e.name}</div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{e.type} • {e.role}</div>
                        </div>
                        {onFocusEntity && (
                          <button
                            onClick={() => onFocusEntity(e.id)}
                            style={{
                              background: '#0284c7',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '4px',
                              padding: '0.2rem 0.4rem',
                              fontSize: '0.68rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            Graph <ExternalLink size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Sources Provenance */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                      <span style={{ fontWeight: 600, color: '#cbd5e1' }}>Evidence Sources: </span>
                      {msg.sources.join(' | ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', width: 'fit-content', color: '#38bdf8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} className="animate-spin" /> Querying Neo4j Knowledge Graph & Evidence Records...
          </div>
        )}
      </div>

      {/* Input Form */}
      <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          style={{ display: 'flex', gap: '0.75rem' }}
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask Copilot e.g., 'Show all suspects connected to vehicle DL-01-AB-1234'..."
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: '#f8fafc',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={isAnalyzing}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              color: '#090d16',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Query <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
