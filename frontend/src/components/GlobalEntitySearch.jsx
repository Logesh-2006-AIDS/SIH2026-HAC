import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, User, Phone, Building2, Car, CreditCard, MapPin, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { ALL_CANONICAL_NODES } from '../data/mockData.js';

export default function GlobalEntitySearch({ isOpen, onClose, onSelectEntity, nodes = [] }) {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [apiResults, setApiResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setApiResults(null);
    }
  }, [isOpen]);

  // Query backend search API with debouncing
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setApiResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const typeParam = selectedType !== 'ALL' ? `&entity_type=${encodeURIComponent(selectedType)}` : '';
        const res = await fetch(`/api/v1/search/entities?q=${encodeURIComponent(q)}${typeParam}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setApiResults(json.data);
            return;
          }
        }
      } catch (err) {
        // Fallback to local filtering
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, selectedType]);

  // Combine live graph nodes + canonical repository as fallback
  const searchableEntities = useMemo(() => {
    const list = nodes.length > 0 ? nodes : ALL_CANONICAL_NODES;
    const seen = new Set();
    return list.filter((e) => {
      const id = e.id || e.number || e.name;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [nodes]);

  // Infer entity type helper
  const getEntityType = (e) => {
    if (e.type) return e.type;
    if (e.reg_number) return 'Vehicle';
    if (e.number || /^\+?\d{8,}/.test(e.id || '')) return 'Phone';
    if (e.account_number || /Bank|Account|ACC/i.test(e.id || '')) return 'FinancialAccount';
    if (e.lat != null && e.lon != null) return 'Location';
    if (/Company|Logistics|Jewellers|Exports|Traders/i.test(e.name || e.id || '')) return 'Organization';
    return 'Person';
  };

  const getEntityIcon = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'person': return <User size={15} className="text-[#d9aa3d]" />;
      case 'phone': return <Phone size={15} className="text-[#5e9f68]" />;
      case 'organization': return <Building2 size={15} className="text-[#e8d9a8]" />;
      case 'vehicle': return <Car size={15} className="text-[#94a3b8]" />;
      case 'financialaccount': return <CreditCard size={15} className="text-[#d8c58a]" />;
      case 'location': return <MapPin size={15} className="text-[#c92a2a]" />;
      default: return <User size={15} className="text-[#d9aa3d]" />;
    }
  };

  // Filter entities
  const results = useMemo(() => {
    if (apiResults !== null) {
      return apiResults;
    }
    const q = query.trim().toLowerCase();
    return searchableEntities.filter((e) => {
      const type = getEntityType(e);
      const typeMatch = selectedType === 'ALL' || type.toUpperCase() === selectedType.toUpperCase();
      if (!typeMatch) return false;
      if (!q) return true;

      const name = (e.name || e.id || '').toLowerCase();
      const phone = (e.phone || e.number || '').toLowerCase();
      const reg = (e.reg_number || '').toLowerCase();
      const acc = (e.account_number || '').toLowerCase();
      const alias = (e.alias || '').toLowerCase();
      const cases = (e.cases || []).join(' ').toLowerCase();

      return name.includes(q) || phone.includes(q) || reg.includes(q) || acc.includes(q) || alias.includes(q) || cases.includes(q);
    }).slice(0, 30);
  }, [searchableEntities, query, selectedType, apiResults]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-16 sm:pt-24 animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[rgba(217,170,61,0.35)] bg-[#0d100e] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 bg-[#141815]">
          <Search size={18} className="text-[#d9aa3d] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && results.length > 0) {
                onSelectEntity(results[0]);
                onClose();
              }
            }}
            placeholder="Search suspect by Name, Phone, Vehicle Plate, Bank Account, Alias, or Case #…"
            className="w-full bg-transparent text-sm text-[#f1ebdd] placeholder-[#8a948c] focus:outline-none font-sans"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="text-[#8a948c] hover:text-[#f1ebdd] cursor-pointer">
              <X size={16} />
            </button>
          )}
          <span className="rounded bg-black/50 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-[#8a948c]">
            ESC
          </span>
        </div>

        {/* Quick Filter Type Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5 bg-[#101311] overflow-x-auto scrollbar-thin">
          {['ALL', 'PERSON', 'PHONE', 'ORGANIZATION', 'VEHICLE', 'FINANCIALACCOUNT', 'LOCATION'].map((t) => {
            const label = t === 'FINANCIALACCOUNT' ? 'ACCOUNTS' : t;
            const active = selectedType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={clsx(
                  'rounded-md px-2.5 py-1 text-[11px] font-bold uppercase transition cursor-pointer whitespace-nowrap',
                  active
                    ? 'bg-[#d9aa3d] text-[#101311]'
                    : 'text-[#8a948c] hover:text-[#f1ebdd] hover:bg-white/5'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8a948c]">
              No matching suspects or entities found across database.
            </div>
          ) : (
            results.map((e) => {
              const type = getEntityType(e);
              const displayName = e.name || e.reg_number || e.number || e.account_number || e.id;
              const cases = e.cases || [];

              return (
                <div
                  key={e.id || displayName}
                  onClick={() => {
                    onSelectEntity(e);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-panel hover:border-[rgba(217,170,61,0.4)] hover:bg-[#181d19] transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40">
                      {getEntityIcon(type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#f1ebdd] group-hover:text-[#d9aa3d] transition">
                          {displayName}
                        </span>
                        <span className="rounded bg-white/5 px-1.5 py-0.2 text-[9px] font-mono text-[#8a948c]">
                          {type}
                        </span>
                        {e.risk_score != null && (
                          <span className="rounded bg-red-950/60 border border-red-800/50 px-1.5 py-0.2 text-[9px] font-mono text-red-400 font-bold">
                            Risk {e.risk_score}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#8a948c] mt-0.5">
                        {e.alias && <span>Alias: <strong className="text-[#e8d9a8]">{e.alias}</strong></span>}
                        {e.number && <span className="font-mono text-[#5e9f68]">{e.number}</span>}
                        {e.reg_number && <span className="font-mono text-[#94a3b8]">{e.reg_number}</span>}
                        {e.role && <span>Role: {e.role}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Connected Cases */}
                  <div className="flex items-center gap-2">
                    {cases.length > 0 && (
                      <div className="flex items-center gap-1">
                        {cases.map((c) => (
                          <span key={c} className="rounded bg-black/40 border border-white/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#d9aa3d]">
                            FIR-{c}
                          </span>
                        ))}
                      </div>
                    )}
                    <ArrowRight size={14} className="text-[#8a948c] group-hover:text-[#d9aa3d] group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-[#101311] text-[10px] text-[#8a948c]">
          <span>Found {results.length} entities</span>
          <span className="font-mono">Press ↵ to select • ESC to close</span>
        </div>
      </div>
    </div>
  );
}
