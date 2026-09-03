import React, { useState } from 'react';
import { Bot, Sparkles, Send, ShieldAlert, CheckCircle2, ArrowRight, Share2, FolderOpen, Zap } from 'lucide-react';

export default function CopilotPage({ onNavigateToEntity, onNavigateToCase }) {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'copilot',
      response: {
        intent: 'GREETING',
        answer: 'CRIMENEXUS AI Copilot ready. Ask any question about criminal syndicates, suspect connections, vehicle movements, or cross-case linkages.',
        evidence_backed_facts: [
          'Directly integrated with the active Neo4j Knowledge Graph and judicial FIR databases.',
          'All inferences are grounded in sentence-level FIR evidence.'
        ],
        ai_inferences: [],
        suggested_leads: [
          'Try asking: "Find the shortest connection between Ravi Kumar and Priya Nair"',
          'Or ask: "Show all people connected to Vikram Singh"'
        ],
        related_entities: [],
        related_cases: [],
        confidence_score: 1.0
      }
    }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = React.useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  const sampleQuestions = [
    'Find the shortest connection between Ravi Kumar and Priya Nair',
    'Show all people connected to Vikram Singh',
    'Which person connects the most cases?',
    'Are there possible links between FIR-2025-ND-101 and FIR-2025-ND-102?'
  ];

  const handleSend = async (customQuery = null) => {
    const q = customQuery || query;
    if (!q || !q.trim()) return;

    // Add user message
    setChatHistory((prev) => [...prev, { sender: 'user', text: q }]);
    if (!customQuery) setQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, active_case_id: 'FIR-2025-ND-101' })
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory((prev) => [...prev, { sender: 'copilot', response: data }]);
      }
    } catch (err) {
      console.error('Copilot error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-slate-900 to-slate-900">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>AI Investigation Copilot</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                EVIDENCE-GROUNDED INTENT PARSER
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Natural language graph queries with strict separation of evidence-backed facts, AI inferences, and suggested leads.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-mono font-semibold">Suggested Inquiries:</span>
        {sampleQuestions.map((sq, i) => (
          <button
            key={i}
            onClick={() => handleSend(sq)}
            className="px-3 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Main Chat Stream */}
      <div className="space-y-4">
        {chatHistory.map((item, idx) => {
          if (item.sender === 'user') {
            return (
              <div key={idx} className="flex justify-end">
                <div className="max-w-xl p-4 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 text-xs text-cyan-100 font-mono font-bold shadow-lg">
                  {item.text}
                </div>
              </div>
            );
          }

          const resp = item.response;
          return (
            <div key={idx} className="p-6 rounded-3xl glass-panel border border-slate-800 shadow-2xl space-y-4">
              {/* Answer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>{resp.intent || 'KNOWLEDGE GRAPH RESPONSE'}</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                  {(resp.confidence_score * 100).toFixed(0)}% Confidence
                </span>
              </div>

              {/* Main Answer text */}
              <p className="text-sm font-semibold text-slate-100 leading-relaxed font-sans">
                {resp.answer}
              </p>

              {/* 3 Strict Sections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* 1. Evidence-Backed Facts */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Evidence-Backed Facts</span>
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc pl-4">
                    {resp.evidence_backed_facts?.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>

                {/* 2. AI Inferences */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-purple-500/30 space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-purple-400 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Graph Inferences</span>
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc pl-4">
                    {resp.ai_inferences?.map((inf, i) => (
                      <li key={i}>{inf}</li>
                    ))}
                  </ul>
                </div>

                {/* 3. Suggested Leads */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-400 flex items-center space-x-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Suggested Next Leads</span>
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc pl-4">
                    {resp.suggested_leads?.map((lead, i) => (
                      <li key={i}>{lead}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Related Entities & Cases Chips */}
              {(resp.related_entities?.length > 0 || resp.related_cases?.length > 0) && (
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 text-[10px] font-mono">RELATED ENTITIES:</span>
                    {resp.related_entities?.map((e, i) => (
                      <button
                        key={i}
                        onClick={() => onNavigateToEntity(e)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[10px] font-mono transition"
                      >
                        {e.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 text-[10px] font-mono">CASES:</span>
                    {resp.related_cases?.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => onNavigateToCase(c)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] font-mono transition"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Live Loading Card */}
        {loading && (
          <div className="p-6 rounded-3xl glass-panel border border-cyan-500/30 shadow-2xl space-y-3 animate-pulse">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold">
              <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span>AI COPILOT SYNTHESIZING INTELLIGENCE...</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Traversing Knowledge Graph subgraphs, CDR matrices, and FIR evidence records...
            </p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Query Input Bar */}
      <div className="sticky bottom-4 z-20">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="p-2 rounded-2xl glass-panel border border-cyan-500/40 shadow-2xl flex items-center gap-2 bg-slate-950/95"
        >
          <input
            type="text"
            placeholder="Ask AI Copilot (e.g. Find the shortest path between Ravi Kumar and Priya Nair)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent px-4 py-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-90 text-black font-extrabold text-xs transition flex items-center space-x-1.5 shadow"
          >
            <span>{loading ? 'Synthesizing...' : 'Query'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
