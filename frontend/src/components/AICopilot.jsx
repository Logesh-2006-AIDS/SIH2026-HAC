import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, ExternalLink, Shield, Database, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function AICopilot({ onFocusEntity, contextCase, contextEntity }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "I am your AI Investigation Copilot. I query the Neo4j Knowledge Graph and PostgreSQL evidence database to answer your questions. Ask me about entity connections, cross-case links, shortest paths, or case details.",
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
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
            <Bot size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>AI Investigation Copilot</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Evidence-backed entity retrieval from Neo4j Knowledge Graph</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', color: '#34d399' }}>
          <Shield size={14} /> Evidence-Grounded AI
        </div>
      </div>

      {/* Suggested Queries */}
      <div style={{ padding: '1rem 1.5rem', background: 'rgba(15, 23, 42, 0.4)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Suggested Investigation Queries</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {suggestions.map((q, idx) => (
            <button key={idx} onClick={() => handleSendQuery(q)} style={{
              fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '9999px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              color: '#cbd5e1', cursor: 'pointer', transition: 'all 0.15s ease'
            }}>{q}</button>
          ))}
        </div>
      </div>

      {/* Chat Feed */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{
            display: 'flex', flexDirection: 'column',
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: msg.sender === 'user' ? '70%' : '90%'
          }}>
            <div style={{
              padding: '1rem 1.25rem', borderRadius: '12px',
              background: msg.sender === 'user' ? '#0284c7' : 'var(--bg-secondary)',
              border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
              color: msg.sender === 'user' ? '#ffffff' : '#f1f5f9',
              fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap'
            }}>
              {msg.text}

              {/* Confidence */}
              {msg.confidence && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                  Confidence: {msg.confidence}
                </div>
              )}

              {/* Entities */}
              {msg.entities && msg.entities.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Database size={14} /> Graph Entities ({msg.entities.length}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {msg.entities.slice(0, 10).map((e, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)',
                        padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{e.name || e.entity_id}</div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{e.type}{e.relationship ? ` | ${e.relationship.replace('_', ' ')}` : ''}</div>
                        </div>
                        {onFocusEntity && e.entity_id && (
                          <button onClick={() => onFocusEntity(e.entity_id)} style={{
                            background: '#0284c7', border: 'none', color: '#fff', borderRadius: '4px',
                            padding: '0.2rem 0.4rem', fontSize: '0.68rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.2rem'
                          }}>
                            Graph <ExternalLink size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                      <span style={{ fontWeight: 600, color: '#cbd5e1' }}>Evidence Sources: </span>
                      {msg.sources.join(' | ')}
                    </div>
                  )}

                  {/* Cases */}
                  {msg.cases && msg.cases.length > 0 && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                      <span style={{ fontWeight: 600, color: '#cbd5e1' }}>Related Cases: </span>
                      {msg.cases.map(c => `Case ${c}`).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', width: 'fit-content', color: '#38bdf8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} className="animate-spin" /> Querying Neo4j Knowledge Graph...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }} style={{ display: 'flex', gap: '0.75rem' }}>
          <input type="text" value={inputQuery} onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about entity connections, case links, shortest paths..."
            style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: '#f8fafc', fontSize: '0.9rem', outline: 'none' }} />
          <button type="submit" disabled={isAnalyzing} style={{
            padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            Query <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
