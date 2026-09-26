"use client";

import React, { useState } from "react";
import { Bot, Send, Sparkles, User, Shield } from "lucide-react";

export default function CopilotPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Forensic Intelligence Copilot initialized. I have analyzed Case 101 evidence graph (15 entities, 13 relationships). Ask me about suspect links, Hawala flow, or key bridge nodes." },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    const replyMsg = {
      role: "assistant",
      text: `Investigation analysis on "${input}": Ravi Kumar (P001) is connected to Vikram Singh (P002) via 3 indirect Hawala laundering routes through Apex Global Logistics. Recommended next action: freeze Axis account ending in 4402.`,
    };
    setMessages((prev) => [...prev, userMsg, replyMsg]);
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-lg font-bold text-[#F1EBDD] flex items-center gap-2">
            <Bot className="text-[#D9AA3D]" size={20} />
            <span>AI Forensic Investigation Copilot</span>
          </h1>
          <p className="text-xs text-[#8a948c] mt-0.5">
            Real-time LLM agent with graph RAG for criminal dossier question answering and hypothesis verification.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-black/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 text-xs ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-[#d9aa3d]/20 border border-[#d9aa3d]/40 flex items-center justify-center shrink-0 text-[#d9aa3d]">
                  <Bot size={15} />
                </div>
              )}
              <div
                className={`max-w-[75%] p-3 rounded-xl ${
                  m.role === "user"
                    ? "bg-[#d9aa3d] text-[#080a08] font-bold"
                    : "bg-black/70 border border-white/10 text-[#F1EBDD] leading-relaxed"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-white/10 bg-black/60 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask AI Copilot to investigate links, trace money, or synthesize leads…"
            className="flex-1 bg-black/70 border border-white/15 rounded-lg px-3.5 py-2 text-xs text-[#F1EBDD] outline-none focus:border-[#d9aa3d]"
          />
          <button
            type="button"
            onClick={handleSend}
            className="bg-[#d9aa3d] text-[#080a08] font-bold p-2 rounded-lg hover:brightness-110 cursor-pointer shadow-md"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
