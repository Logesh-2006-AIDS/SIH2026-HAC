import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, ExternalLink, Shield, Database, ChevronRight, FileText } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { getCopilotAnswer, getCopilotSuggestions } from '../data/mockService.js';

export default function AICopilot() {
  const { focusEntityById, setActiveTab, selectedCase } = useInvestigation();
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "I am your AI Investigation Copilot. I analyze multi-source crime data across FIR complaints, call detail records, financial ledgers, and field intelligence. Ask me about suspect links, cross-case connections, shortest paths, or evidence details.",
      entities: [
        { entity_id: 'PERSON-001', name: 'Ravi Kumar', type: 'Person', relationship: 'Primary Suspect' },
        { entity_id: 'PHONE-001', name: '+91-9876543210', type: 'Phone', relationship: 'Communications Nexus' },
        { entity_id: 'ACC-001', name: 'Account-204', type: 'Account', relationship: 'Source of Pre-Incident Funds' }
      ],
      sources: ['FIR-CASE-101', 'CDR-CASE-101', 'FIN-CASE-101'],
      cases: ['CASE-101', 'CASE-102', 'CASE-103'],
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    getCopilotSuggestions().then(res => {
      if (res?.data) setSuggestions(res.data);
    });
  }, [selectedCase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  const handleSendQuery = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    setInputQuery('');
    setIsAnalyzing(true);

    try {
      const res = await getCopilotAnswer(textToSend);
      const data = res?.data || {};
      const botResponse = {
        sender: 'assistant',
        text: data.answer || 'No results found for this query in the investigation dataset.',
        confidence: data.confidence ? `${Math.round(data.confidence * 100)}%` : '94%',
        entities: data.entities || [],
        sources: data.sources || [],
        cases: data.cases || [],
        suggestion: data.suggestion || null,
      };
      setMessages([...newMessages, botResponse]);
    } catch (err) {
      console.error('Copilot query failed:', err);
      setMessages([...newMessages, {
        sender: 'assistant',
        text: 'Analysis failed on the selected query. Please try another query from the suggested list below.',
        entities: [],
        sources: [],
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEntityClick = (entityId) => {
    if (focusEntityById) focusEntityById(entityId);
    if (setActiveTab) setActiveTab('network');
  };

  return (
    <div className="animate-fade-in" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent', color: '#F1EBDD', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(16, 19, 17, 0.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(217, 170, 61, 0.18)', color: '#D9AA3D', border: '1px solid rgba(217, 170, 61, 0.3)', boxShadow: '0 0 14px rgba(217, 170, 61, 0.2)' }}>
            <Bot size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#F1EBDD' }}>AI INVESTIGATION COPILOT</h2>
            <p style={{ fontSize: '0.8rem', color: '#A6B0AA', margin: 0 }}>Grounded entity correlation & cross-case intelligence synthesis</p>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.35rem 0.75rem', borderRadius: '20px',
          background: 'rgba(217, 170, 61, 0.15)', border: '1px solid rgba(217, 170, 61, 0.35)',
          color: '#D9AA3D', fontSize: '0.75rem', fontWeight: 700
        }}>
          <Shield size={14} /> Grounded AI Evidence
        </div>
      </div>

      {/* Suggested Queries */}
      <div style={{ padding: '0.85rem 1.75rem', background: 'rgba(8, 10, 9, 0.6)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6C7A73', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.06em' }}>
          Suggested Investigation Queries
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
          {suggestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(q)}
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                background: 'rgba(16, 19, 17, 0.8)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#A6B0AA',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#D9AA3D';
                e.currentTarget.style.color = '#F1EBDD';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.color = '#A6B0AA';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Feed */}
      <div style={{ flex: 1, padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: msg.sender === 'user' ? '70%' : '88%',
            }}
          >
            <div style={{
              padding: '1.1rem 1.35rem',
              borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
              background: msg.sender === 'user' ? 'linear-gradient(135deg, #18221D 0%, #111815 100%)' : 'rgba(22, 32, 27, 0.95)',
              border: msg.sender === 'user' ? '1px solid rgba(217,170,61,0.4)' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              color: '#F1EBDD',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.text}

              {/* Confidence Meter */}
              {msg.confidence && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.78rem', color: '#4ADE80', fontWeight: 800 }}>
                  Evidence Grounding Confidence: {msg.confidence}
                </div>
              )}

              {/* Pinned Evidence Snippets */}
              {msg.entities && msg.entities.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#D9AA3D', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Database size={14} /> Correlated Graph Entities ({msg.entities.length}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                    {msg.entities.slice(0, 10).map((e, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(0, 0, 0, 0.35)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: '#F1EBDD' }}>{e.name || e.entity_id}</div>
                          <div style={{ fontSize: '0.68rem', color: '#A6B0AA', fontWeight: 600 }}>
                            {e.type}{e.relationship ? ` • ${e.relationship.replace('_', ' ')}` : ''}
                          </div>
                        </div>
                        {e.entity_id && (
                          <button
                            onClick={() => handleEntityClick(e.entity_id)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              background: 'rgba(217,170,61,0.2)',
                              border: '1px solid rgba(217,170,61,0.4)',
                              color: '#D9AA3D',
                              borderRadius: '4px',
                            }}
                          >
                            Inspect <ExternalLink size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.74rem', color: '#6C7A73' }}>
                      <span style={{ fontWeight: 800, color: '#A6B0AA' }}>Evidence Sources: </span>
                      {msg.sources.join(' • ')}
                    </div>
                  )}

                  {/* Cases */}
                  {msg.cases && msg.cases.length > 0 && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.74rem', color: '#6C7A73' }}>
                      <span style={{ fontWeight: 800, color: '#A6B0AA' }}>Related Cases: </span>
                      {msg.cases.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div style={{
            padding: '0.85rem 1.35rem',
            background: 'rgba(16, 19, 17, 0.9)',
            borderRadius: '12px',
            border: '1px solid rgba(217,170,61,0.3)',
            width: 'fit-content',
            color: '#D9AA3D',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}>
            <Sparkles size={16} className="animate-spin" /> Analyzing Investigation Dataset & Forensic Graph...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '1.25rem 1.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(16, 19, 17, 0.92)', backdropFilter: 'blur(12px)' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }} style={{ display: 'flex', gap: '0.85rem' }}>
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about suspect links, cross-case connections, shortest paths, or financial trails..."
            style={{
              flex: 1,
              padding: '0.75rem 1.1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(8, 10, 9, 0.7)',
              color: '#F1EBDD',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isAnalyzing}
            style={{
              padding: '0.75rem 1.6rem',
              borderRadius: '10px',
              background: '#D9AA3D',
              border: 'none',
              color: '#0B100D',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            Query Copilot <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
