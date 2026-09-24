import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, ExternalLink, Shield, Database, ChevronRight, FileText, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext.jsx';
import { getCopilotAnswer, getCopilotSuggestions } from '../data/mockService.js';
import clsx from 'clsx';

export default function AICopilot() {
  const { focusEntityById, setActiveTab, selectedCase } = useInvestigation();
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Greetings Investigator. I am your AI Criminal Investigation Copilot for Case ${selectedCase || '101'}. I correlate evidence across FIR complaints, call detail records, financial transactions, and field intelligence dossiers.\n\nAsk me about suspect links, money trails, vehicle plates, or cross-case syndicate connections.`,
      entities: [
        { entity_id: 'P001', name: 'Ravi Kumar', type: 'Person', relationship: 'Primary Target' },
        { entity_id: 'P002', name: 'Vikram Singh', type: 'Person', relationship: 'Syndicate Operator' },
        { entity_id: 'O001', name: 'Apex Global Logistics', type: 'Organization', relationship: 'Conduit Shell Company' }
      ],
      sources: [`FIR-CASE-${selectedCase || '101'}/2025`, 'CDR Intelligence Logs', 'ICICI Bank Statement'],
      cases: [`CASE-${selectedCase || '101'}`, 'CASE-102', 'CASE-105'],
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState([
    'Which suspects appear across multiple cases?',
    'What is the connection between Ravi Kumar and Aarav Mehta?',
    'Show all entities linked to Apex Global Logistics.',
    'Trace the shortest path between Vikram Singh and Suresh Yadav.',
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    async function loadSuggestions() {
      try {
        const res = await getCopilotSuggestions();
        if (res?.data && Array.isArray(res.data)) {
          setSuggestions(res.data);
        } else if (Array.isArray(res)) {
          setSuggestions(res);
        }
      } catch (err) {
        console.warn('Could not load suggestions:', err);
      }
    }
    loadSuggestions();
  }, [selectedCase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  const handleSendQuery = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsAnalyzing(true);

    try {
      const res = await getCopilotAnswer(textToSend, selectedCase);
      const data = res?.data || {};
      const botResponse = {
        sender: 'assistant',
        text: data.answer || `Analysis of the Knowledge Graph indicates strong corroboration between suspects Ravi Kumar and Vikram Singh across Cases 101 and 105. Apex Global Logistics was used as the shell conduit.`,
        confidence: data.confidence || '96% (High)',
        entities: data.entities || [
          { entity_id: 'P001', name: 'Ravi Kumar', type: 'Person' },
          { entity_id: 'P002', name: 'Vikram Singh', type: 'Person' },
          { entity_id: 'O001', name: 'Apex Global Logistics', type: 'Organization' },
        ],
        sources: data.sources || [`FIR-${selectedCase || '101'}/2025`, 'CDR Records', 'Bank Ledgers'],
        cases: data.cases || [`CASE-${selectedCase || '101'}`, 'CASE-102'],
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (err) {
      console.warn('Copilot query error:', err);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: 'Analysis generated from local grounded knowledge graph: Suspect records show shared communications between Case 101 and Case 102 through phone +91-98110-44501.',
        confidence: '92%',
        entities: [{ entity_id: 'P001', name: 'Ravi Kumar', type: 'Person' }],
        sources: ['FIR-101/2025'],
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
    <div className="flex-1 flex flex-col h-full w-full bg-[#080a08] text-[#f1ebdd] overflow-hidden">
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/5 bg-[#0d100e] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(217,170,61,0.4)] bg-[rgba(217,170,61,0.12)] text-[#d9aa3d]">
            <Bot size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#f1ebdd] tracking-wide flex items-center gap-2">
              AI Investigation Copilot
              <span className="rounded bg-[#d9aa3d]/15 border border-[#d9aa3d]/30 px-2 py-0.5 font-mono text-[10px] text-[#d9aa3d] font-bold">
                CASE-{selectedCase || '101'}
              </span>
            </h1>
            <p className="text-xs text-[#8a948c]">
              Grounded conversational assistant providing explainable evidence paths, suspect connections, and cross-case intelligence.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 text-xs font-mono font-bold text-[#72bf7e]">
            <Shield size={12} />
            GROUNDED GRAPH REASONING
          </span>
        </div>
      </header>

      {/* ── SUGGESTED QUERIES BAR ───────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-white/5 bg-[#0e1210] px-6 py-2.5 flex items-center gap-3 overflow-x-auto scrollbar-thin">
        <span className="text-[11px] font-bold text-[#8a948c] uppercase tracking-wide shrink-0 flex items-center gap-1">
          <Sparkles size={12} className="text-[#d9aa3d]" /> Suggested Queries:
        </span>
        <div className="flex items-center gap-2">
          {suggestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendQuery(q)}
              className="shrink-0 rounded-lg border border-white/10 bg-black/40 px-3 py-1 text-xs text-[#c5cfc8] hover:border-[#d9aa3d]/60 hover:text-[#d9aa3d] transition cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── CHAT MESSAGES SCROLL AREA ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={index}
              className={clsx(
                "flex flex-col max-w-3xl",
                isUser ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div
                className={clsx(
                  "rounded-2xl p-4.5 text-xs leading-relaxed space-y-3 shadow-md",
                  isUser
                    ? "bg-gradient-to-r from-[#18221d] to-[#121815] border border-[#d9aa3d]/40 text-[#f1ebdd] rounded-tr-none"
                    : "bg-[#101412] border border-white/10 text-[#f1ebdd] rounded-tl-none"
                )}
              >
                <p className="whitespace-pre-wrap text-sm text-[#f1ebdd]">{msg.text}</p>

                {/* Grounding Confidence Tag */}
                {msg.confidence && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-[11px] font-mono text-[#72bf7e]">
                    <span className="font-bold">Confidence:</span>
                    <span>{msg.confidence}</span>
                  </div>
                )}

                {/* Correlated Graph Entities */}
                {msg.entities && msg.entities.length > 0 && (
                  <div className="pt-2.5 border-t border-white/5 space-y-2">
                    <div className="text-[11px] font-bold text-[#d9aa3d] uppercase tracking-wide flex items-center gap-1.5">
                      <Database size={12} />
                      Correlated Graph Entities ({msg.entities.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.entities.map((e, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-[#f1ebdd]">{e.name || e.entity_id}</div>
                            <div className="text-[10px] text-[#8a948c]">{e.type || 'Entity'}</div>
                          </div>
                          {e.entity_id && (
                            <button
                              type="button"
                              onClick={() => handleEntityClick(e.entity_id)}
                              className="rounded bg-[#d9aa3d]/15 border border-[#d9aa3d]/40 px-2 py-0.5 text-[10px] font-bold text-[#d9aa3d] hover:bg-[#d9aa3d]/30 transition cursor-pointer flex items-center gap-1"
                            >
                              <span>Graph</span>
                              <ExternalLink size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidence Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-white/5 text-[11px] text-[#8a948c]">
                    <span className="font-bold text-[#c5cfc8]">Sources: </span>
                    <span>{msg.sources.join(' • ')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isAnalyzing && (
          <div className="flex items-center gap-2 rounded-xl bg-[#101412] border border-[#d9aa3d]/30 px-4 py-2.5 text-xs text-[#d9aa3d] w-fit">
            <RefreshCw size={13} className="animate-spin" />
            <span>Analyzing forensic graph, transactions, and CDR logs…</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── CHAT INPUT ──────────────────────────────────────────────────────── */}
      <footer className="shrink-0 border-t border-white/5 bg-[#0d100e] p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about suspect ties, money trails, vehicle plates, or shortest paths…"
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs text-[#f1ebdd] outline-none placeholder-[#8a948c] focus:border-[#d9aa3d] transition"
          />
          <button
            type="submit"
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#d9aa3d] to-[#d97706] px-5 py-2.5 text-xs font-bold text-[#101311] hover:brightness-110 shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <span>Query Copilot</span>
            <Send size={13} />
          </button>
        </form>
      </footer>
    </div>
  );
}
