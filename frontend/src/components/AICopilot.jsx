import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, ExternalLink, Shield, Database } from 'lucide-react';
import axios from 'axios';

export default function AICopilot({ onFocusEntity, contextCase, contextEntity }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "I am your AI Investigation Assistant. I analyze graph evidence and query PostgreSQL records to assist your investigation. Ask me about suspect links, cross-case connections, red-string shortest paths, or evidence details.",
      entities: [],
      sources: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const chatEndRef = useRef(null);

  // Fetch dynamic suggestions based on context
  useEffect(() => {
    const params = new URLSearchParams();
    if (contextCase) params.append('case_id', contextCase);
    if (contextEntity) params.append('entity_id', contextEntity);
    axios.get(`/api/v1/copilot/suggestions?${params.toString()}`)
      .then(res => {
        if (res.data?.data) setSuggestions(res.data.data);
      })
      .catch(() => {
        setSuggestions([
          "Which people appear in multiple cases?",
          "Show the strongest cross-case connections",
          "Find entities with highest network importance",
        ]);
      });
  }, [contextCase, contextEntity]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendQuery = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    setInputQuery('');
    setIsAnalyzing(true);

    try {
      const res = await axios.post('/api/v1/copilot/query', {
        question: textToSend,
        context_case: contextCase || null,
        context_entity: contextEntity || null,
      });

      const data = res.data?.data || {};
      const botResponse = {
        sender: 'assistant',
        text: data.answer || 'No results found for this query.',
        confidence: data.confidence || null,
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
        text: `Query failed: ${err.response?.data?.detail || err.message}. Please try rephrasing.`,
        entities: [],
        sources: [],
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent', color: '#F1EBDD' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(16, 19, 17, 0.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ padding: '0.55rem', borderRadius: '10px', background: 'rgba(217, 170, 61, 0.18)', color: '#D9AA3D', border: '1px solid rgba(217, 170, 61, 0.3)', boxShadow: '0 0 14px rgba(217, 170, 61, 0.2)' }}>
            <Bot size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#F1EBDD' }}>AI INVESTIGATION ASSISTANT</h2>
            <p style={{ fontSize: '0.8rem', color: '#A6B0AA', margin: 0 }}>Evidence-backed entity retrieval & network analysis engine</p>
          </div>
        </div>
        <div className="badge badge-gold">
          <Shield size={14} /> Grounded AI Evidence
        </div>
      </div>

      {/* Suggested Queries */}
      <div style={{ padding: '0.85rem 1.75rem', background: 'rgba(8, 10, 9, 0.6)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6C7A73', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.06em' }}>Suggested Forensic Queries</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
          {suggestions.map((q, idx) => (
            <button key={idx} onClick={() => handleSendQuery(q)} style={{
              fontSize: '0.78rem', padding: '0.35rem 0.85rem', borderRadius: '9999px',
              background: 'rgba(16, 19, 17, 0.8)', border: '1px solid var(--border-color)',
              color: '#A6B0AA', cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: 600
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#D9AA3D';
              e.currentTarget.style.color = '#F1EBDD';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = '#A6B0AA';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>{q}</button>
          ))}
        </div>
      </div>

      {/* Chat Feed */}
      <div style={{ flex: 1, padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {messages.map((msg, index) => (
          <div key={index} className="animate-slide-up" style={{
            display: 'flex', flexDirection: 'column',
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: msg.sender === 'user' ? '70%' : '88%'
          }}>
            <div style={{
              padding: '1.1rem 1.35rem', borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
              background: msg.sender === 'user' ? 'linear-gradient(135deg, #101311 0%, #141715 100%)' : '#D8C58A',
              border: msg.sender === 'user' ? '1px solid var(--border-gold)' : '1px solid rgba(180, 160, 100, 0.4)',
              boxShadow: msg.sender === 'user' ? '0 4px 16px rgba(0,0,0,0.5)' : '0 6px 20px rgba(0,0,0,0.4)',
              color: msg.sender === 'user' ? '#F1EBDD' : '#24251F',
              fontSize: '0.9rem', lineHeight: '1.55', whiteSpace: 'pre-wrap', position: 'relative'
            }}>
              {/* If Assistant response, render parchment style with gold/red badges */}
              {msg.sender === 'assistant' && <div className="pin-detail" style={{ top: '-7px' }} />}
              
              {msg.text}

              {/* Confidence Meter */}
              {msg.confidence && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: '0.78rem', color: '#5E9F68', fontWeight: 800 }}>
                  Evidence Confidence: {msg.confidence}
                </div>
              )}

              {/* Pinned Evidence Snippets */}
              {msg.entities && msg.entities.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.12)' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#D62828', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Database size={14} /> Correlated Graph Evidence ({msg.entities.length}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                    {msg.entities.slice(0, 10).map((e, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255, 255, 255, 0.55)', border: '1px solid rgba(0,0,0,0.15)',
                        padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem',
                        display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#24251F' }}>{e.name || e.entity_id}</div>
                          <div style={{ fontSize: '0.68rem', color: '#54564B', fontWeight: 600 }}>{e.type}{e.relationship ? ` | ${e.relationship.replace('_', ' ')}` : ''}</div>
                        </div>
                        {onFocusEntity && e.entity_id && (
                          <button onClick={() => onFocusEntity(e.entity_id)} className="btn-red" style={{
                            padding: '0.25rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.2rem'
                          }}>
                            View Pin <ExternalLink size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.74rem', color: '#54564B' }}>
                      <span style={{ fontWeight: 800, color: '#24251F' }}>Evidence Sources: </span>
                      {msg.sources.join(' | ')}
                    </div>
                  )}

                  {/* Cases */}
                  {msg.cases && msg.cases.length > 0 && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.74rem', color: '#54564B' }}>
                      <span style={{ fontWeight: 800, color: '#24251F' }}>Related Cases: </span>
                      {msg.cases.map(c => `FIR-${c}`).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div style={{ padding: '0.85rem 1.35rem', background: 'rgba(16, 19, 17, 0.9)', borderRadius: '12px', border: '1px solid var(--border-gold)', width: 'fit-content', color: '#D9AA3D', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={16} className="animate-spin" /> Querying Neo4j Knowledge Graph & Evidence Records...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '1.25rem 1.75rem', borderTop: '1px solid var(--border-color)', background: 'rgba(16, 19, 17, 0.92)', backdropFilter: 'blur(12px)' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }} style={{ display: 'flex', gap: '0.85rem' }}>
          <input type="text" value={inputQuery} onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about suspect links, cross-case connections, red-string shortest paths..."
            style={{ flex: 1, padding: '0.75rem 1.1rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'rgba(8, 10, 9, 0.7)', color: '#F1EBDD', fontSize: '0.9rem', outline: 'none' }} />
          <button type="submit" disabled={isAnalyzing} className="btn-primary" style={{ padding: '0.75rem 1.6rem', borderRadius: '10px' }}>
            Query Assistant <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
