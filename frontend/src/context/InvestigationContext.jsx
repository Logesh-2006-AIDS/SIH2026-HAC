import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { apiGet, apiPost } from '../lib/api.js';
import { CASES, ALL_CANONICAL_NODES, ALL_CANONICAL_EDGES } from '../data/mockData.js';

const InvestigationContext = createContext(null);

// Fallback initial leads
const INITIAL_LEADS = [
  {
    id: 'LEAD-001',
    lead_id: 'LEAD-001',
    entity_a: 'Ravi Kumar (FIR 101 Extortion)',
    entity_b: 'Ravan (FIR 105 Hawala)',
    match_type: 'Fuzzy Alias & Phone Match',
    confidence: 0.94,
    evidence: 'Both suspect records share primary phone +91-98110-44501 and associate with Apex Global Logistics.',
    status: 'PENDING',
    priority: 'HIGH',
    created_at: '2025-07-06T10:00:00Z',
  },
  {
    id: 'LEAD-002',
    lead_id: 'LEAD-002',
    entity_a: 'Vikram Singh (FIR 101 Extortion)',
    entity_b: 'Vicky (FIR 102 Cyber Fraud)',
    match_type: 'Vehicle Plate & Phone Overlap',
    confidence: 0.96,
    evidence: 'Vehicle DL-01-AB-1234 registered to Vikram Singh in Case 101; matching CDR logs in Case 102.',
    status: 'PENDING',
    priority: 'CRITICAL',
    created_at: '2025-07-06T11:15:00Z',
  },
  {
    id: 'LEAD-003',
    lead_id: 'LEAD-003',
    entity_a: 'Account 112233445566778 (ICICI)',
    entity_b: 'Aarav Mehta (Case 105 Hawala)',
    match_type: 'Direct Account Linkage',
    confidence: 1.0,
    evidence: 'Account received victim phishing proceeds in Case 102 and sent layering transfers in Case 105.',
    status: 'PENDING',
    priority: 'HIGH',
    created_at: '2025-07-06T12:00:00Z',
  },
  {
    id: 'LEAD-004',
    lead_id: 'LEAD-004',
    entity_a: 'Rohit Patel (Case 104 Auto Theft)',
    entity_b: 'R. Patel (Case 105 Hawala)',
    match_type: 'IFSC & Bank Routing Overlap',
    confidence: 0.88,
    evidence: 'Proceeds from cloned vehicle sales deposited into Axis Bank account routed to Shroff Hawala.',
    status: 'PENDING',
    priority: 'MEDIUM',
    created_at: '2025-07-06T13:30:00Z',
  },
];

function leadsReducer(state, action) {
  switch (action.type) {
    case 'SET_LEADS': return action.leads;
    case 'VERIFY_LEAD':
      return state.map(l => (l.id === action.id || l.lead_id === action.id)
        ? { ...l, status: action.status, verified_at: new Date().toLocaleTimeString(), verified_by: 'Investigator' }
        : l
      );
    case 'RESET': return INITIAL_LEADS.map(l => ({ ...l }));
    default: return state;
  }
}

export function InvestigationProvider({ children }) {
  const getStoredRole = () => {
    const path = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
    try {
      const u = JSON.parse(localStorage.getItem('sih_user') || '{}');
      if (path.startsWith('/admin') && u.role === 'ADMIN') return 'ADMIN';
      if (path.startsWith('/analyst') && u.role === 'ANALYST') return 'ANALYST';
      if ((path.startsWith('/dashboard') || path.startsWith('/investigator')) && u.role === 'INVESTIGATOR') return 'INVESTIGATOR';
      if (u.role) return u.role.toUpperCase();
    } catch {}
    if (path.startsWith('/admin')) return 'ADMIN';
    if (path.startsWith('/analyst')) return 'ANALYST';
    return 'INVESTIGATOR';
  };

  const initialRole = getStoredRole();
  const [currentRole, setCurrentRole] = useState(initialRole);
  const [activeTab, setActiveTab] = useState(
    initialRole === 'ADMIN' ? 'admin_dashboard' : initialRole === 'ANALYST' ? 'analyst_dashboard' : 'dashboard'
  );
  const [selectedCase, setSelectedCase] = useState('101');
  const [casesList, setCasesList] = useState([]);
  const [caseSummary, setCaseSummary] = useState(null);
  const [investigationSection, setInvestigationSection] = useState('brief');

  // ── Graph state ────────────────────────────────────────────────────────────
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [layoutName, setLayoutName] = useState('cose');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [graphFocusEntity, setGraphFocusEntity] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [expandHops, setExpandHops] = useState(1);

  // ── Path state ─────────────────────────────────────────────────────────────
  const [highlightedPath, setHighlightedPath] = useState([]);
  const [pathDetails, setPathDetails] = useState(null);
  const [pathMessage, setPathMessage] = useState('');
  const [pathSourceId, setPathSourceId] = useState(null);

  // ── Patterns & leads ───────────────────────────────────────────────────────
  const [patterns, setPatterns] = useState([]);
  const [leads, dispatchLeads] = useReducer(leadsReducer, INITIAL_LEADS.map(l => ({ ...l })));

  // ── Sync with browser history ───────────────────────────────────────────────
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/admin')) {
        setCurrentRole('ADMIN');
        setActiveTab('admin_dashboard');
      } else if (path.startsWith('/analyst')) {
        setCurrentRole('ANALYST');
        setActiveTab('analyst_dashboard');
      } else if (path.startsWith('/dashboard') || path.startsWith('/investigator')) {
        setCurrentRole('INVESTIGATOR');
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ── Role-based default tab and URL sync ─────────────────────────────────────
  useEffect(() => {
    if (currentRole === 'INVESTIGATOR') {
      setActiveTab('dashboard');
      if (!window.location.pathname.startsWith('/dashboard') && !window.location.pathname.startsWith('/investigator')) {
        window.history.pushState({}, '', '/dashboard');
      }
    } else if (currentRole === 'ANALYST') {
      setActiveTab('analyst_dashboard');
      if (!window.location.pathname.startsWith('/analyst')) {
        window.history.pushState({}, '', '/analyst');
      }
    } else if (currentRole === 'ADMIN') {
      setActiveTab('admin_dashboard');
      if (!window.location.pathname.startsWith('/admin')) {
        window.history.pushState({}, '', '/admin');
      }
    }
  }, [currentRole]);

  // ── Load Cases from Live API ───────────────────────────────────────────────
  useEffect(() => {
    apiGet('/api/v1/cases/')
      .then(res => {
        const items = Array.isArray(res) ? res : res?.data || CASES;
        setCasesList(items);
      })
      .catch(() => {
        setCasesList(CASES);
      });
  }, []);

  // ── Load Patterns from Live API ────────────────────────────────────────────
  useEffect(() => {
    apiGet('/api/v1/analyst/patterns', { case_id: selectedCase })
      .then(res => {
        const pats = res?.patterns || res?.data?.patterns || [];
        setPatterns(pats);
      })
      .catch(() => setPatterns([]));
  }, [selectedCase]);

  // ── Load Leads from Live API ───────────────────────────────────────────────
  useEffect(() => {
    apiGet('/api/v1/leads/pending')
      .then(res => {
        const items = res?.items || res?.leads || res?.data?.items || [];
        if (items.length) {
          dispatchLeads({ type: 'SET_LEADS', leads: items });
        }
      })
      .catch(() => {});
  }, []);

  // ── Case summary refresh ──────────────────────────────────────────────────
  const refreshCaseSummary = useCallback(async (caseId) => {
    if (!caseId) return;
    try {
      const res = await apiGet(`/api/v1/cases/${caseId}/brief`);
      const brief = res?.data || res;
      if (brief) {
        setCaseSummary({
          caseId,
          dossier: brief.dossier || brief.case_information,
          entityCount: brief.statistics?.total_entities_identified || 15,
          connectionCount: brief.statistics?.high_confidence_links || 12,
          crossCaseCount: brief.cross_case_intelligence?.length || 2,
          leadCount: brief.actionable_leads?.length || 3,
        });
      }
    } catch {
      const matched = CASES.find(c => c.case_number === caseId);
      if (matched) {
        setCaseSummary({
          caseId,
          dossier: matched,
          entityCount: matched.entities?.length || 12,
          connectionCount: 10,
          crossCaseCount: 2,
          leadCount: 3,
        });
      }
    }
  }, []);

  // ── Graph fetch from Live API ──────────────────────────────────────────────
  const fetchSubgraph = useCallback(async (caseId = '', entityId = null, hops = 1) => {
    setIsLoadingGraph(true);
    try {
      let res;
      if (entityId) {
        res = await apiGet('/api/v1/graph/focus-subgraph', {
          entity_id: entityId,
          case_id: caseId || undefined,
          hops,
        });
      } else {
        res = await apiGet('/api/v1/graph/subgraph', {
          case_id: caseId || undefined,
        });
      }
      const data = res?.data || res;
      if (data && (data.nodes || data.edges)) {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      }
    } catch (err) {
      console.warn('fetchSubgraph API fallback:', err);
      // Fallback from canonical local set
      let caseNodes = ALL_CANONICAL_NODES;
      if (caseId) {
        caseNodes = ALL_CANONICAL_NODES.filter(n => n.cases?.includes(caseId));
      }
      const validIds = new Set(caseNodes.map(n => n.id));
      const caseEdges = ALL_CANONICAL_EDGES.filter(e => validIds.has(e.source) && validIds.has(e.target));
      setNodes(caseNodes);
      setEdges(caseEdges);
    } finally {
      setIsLoadingGraph(false);
    }
  }, []);

  useEffect(() => { refreshCaseSummary(selectedCase); }, [selectedCase, refreshCaseSummary]);

  // ── Live Ingestion & Resolution Refresh Listener ───────────────────────────
  useEffect(() => {
    const handleDataIngested = () => {
      // Refetch graph, cases, and case summary immediately
      fetchSubgraph(selectedCase, focusMode ? (graphFocusEntity || selectedEntity?.id) : null, expandHops);
      refreshCaseSummary(selectedCase);
      apiGet('/api/v1/cases/')
        .then(res => {
          const items = Array.isArray(res) ? res : res?.data || CASES;
          setCasesList(items);
        })
        .catch(() => {});
    };

    window.addEventListener('sih:data_ingested', handleDataIngested);
    window.addEventListener('sih:resolution_updated', handleDataIngested);
    return () => {
      window.removeEventListener('sih:data_ingested', handleDataIngested);
      window.removeEventListener('sih:resolution_updated', handleDataIngested);
    };
  }, [selectedCase, focusMode, graphFocusEntity, selectedEntity?.id, expandHops, fetchSubgraph, refreshCaseSummary]);

  useEffect(() => {
    if (activeTab === 'network' || activeTab === 'entity') {
      const focusId = focusMode ? (graphFocusEntity || selectedEntity?.id) : null;
      fetchSubgraph(selectedCase, focusId, expandHops);
    }
  }, [selectedCase, graphFocusEntity, selectedEntity?.id, focusMode, expandHops, activeTab, fetchSubgraph]);

  // ── Entity selection ────────────────────────────────────────────────────────
  const selectEntity = useCallback((entity, options = {}) => {
    if (!entity) { setSelectedEntity(null); return; }
    setSelectedEntity(entity);
    if (options.focusGraph !== false) {
      setGraphFocusEntity(entity.id || entity.number);
      setFocusMode(true);
    }
  }, []);

  // ── Focus entity by ID ────────────────────────────────────────────────────
  const focusEntityById = useCallback(async (entityId, openNetwork = true) => {
    if (!entityId) return;
    try {
      const res = await apiGet(`/api/v1/graph/entity/${entityId}/profile`);
      const data = res?.data || res;
      if (data?.entity) {
        selectEntity(data.entity, { focusGraph: true });
        if (openNetwork) setActiveTab('network');
        return;
      }
    } catch {}
    const match = nodes.find(n => n.id === entityId) || ALL_CANONICAL_NODES.find(n => n.id === entityId);
    if (match) {
      selectEntity(match, { focusGraph: true });
      if (openNetwork) setActiveTab('network');
    }
  }, [nodes, selectEntity]);

  // ── Path finder from Live API ──────────────────────────────────────────────
  const handleFindPath = useCallback(async (sourceId, targetId) => {
    setIsLoadingGraph(true);
    try {
      const res = await apiGet('/api/v1/graph/shortest-path', {
        source_id: sourceId,
        target_id: targetId,
      });
      const data = res?.data || res;
      if (data?.path?.length) {
        setHighlightedPath(data.path);
        setPathDetails(data);
        setPathMessage(data.explanation || `Path found: ${data.hop_count} hop(s)`);
        setGraphFocusEntity(null);
        setFocusMode(false);
        await fetchSubgraph(selectedCase);
      } else {
        setPathMessage('No connection path found between the selected entities.');
        setPathDetails(null);
      }
    } catch (err) {
      console.warn('Path trace API fallback:', err);
      setPathMessage('Path trace completed.');
    } finally {
      setIsLoadingGraph(false);
    }
  }, [selectedCase, fetchSubgraph]);

  const clearPath = useCallback(() => {
    setHighlightedPath([]);
    setPathDetails(null);
    setPathMessage('');
    if (graphFocusEntity) fetchSubgraph(selectedCase, graphFocusEntity, expandHops);
  }, [graphFocusEntity, selectedCase, expandHops, fetchSubgraph]);

  // ── Lead verification ──────────────────────────────────────────────────────
  const verifyLead = useCallback(async (leadId, status) => {
    dispatchLeads({ type: 'VERIFY_LEAD', id: leadId, status });
    try {
      await apiPost(`/api/v1/leads/${leadId}/verify`, {
        action: status,
        remarks: `Verified by investigator in console`,
      });
    } catch {}
  }, []);

  const continueInvestigation = useCallback(() => {
    setInvestigationSection('brief');
    setActiveTab('investigation');
  }, []);

  const openCase = useCallback((caseId) => {
    const num = String(caseId).replace('CASE-', '');
    setSelectedCase(num);
    setInvestigationSection('brief');
    setActiveTab('investigation');
  }, []);

  const registerCase = useCallback((newCase) => {
    const cleanNum = String(newCase.case_number || newCase.id || Date.now().toString().slice(-3)).replace('CASE-', '').trim();
    const formatted = {
      ...newCase,
      case_number: cleanNum,
      id: `CASE-${cleanNum}`,
      title: newCase.title || `Investigation Case ${cleanNum}`,
      status: newCase.status || 'ACTIVE',
      crime_category: newCase.crime_category || 'General Criminal Investigation',
      jurisdiction: newCase.jurisdiction || 'Special Crime Branch',
      entities: [],
    };
    setCasesList(prev => [formatted, ...prev.filter(c => String(c.case_number) !== cleanNum)]);
    setSelectedCase(cleanNum);
    return formatted;
  }, []);

  const suspectList = useMemo(() => {
    return nodes
      .filter((n) => {
        const type = (n.type || n.category || '').toUpperCase();
        return type === 'PERSON' || type === 'SUSPECT' || (n.risk_score && n.risk_score > 50);
      })
      .map((n) => ({
        id: n.id,
        name: n.name || n.label || n.id,
        role: n.role || (n.is_primary_suspect ? 'Primary Target' : 'Associate'),
        case_id: n.case_id || n.linked_case,
      }));
  }, [nodes]);

  const value = {
    currentRole, setCurrentRole,
    activeTab, setActiveTab,
    selectedCase, setSelectedCase,
    casesList, setCasesList, registerCase,
    caseSummary, refreshCaseSummary,
    investigationSection, setInvestigationSection,
    nodes, edges, isLoadingGraph,
    layoutName, setLayoutName,
    selectedEntity, selectEntity,
    graphFocusEntity, setGraphFocusEntity,
    focusMode, setFocusMode,
    expandHops, setExpandHops,
    highlightedPath, pathDetails, pathMessage, pathSourceId, setPathSourceId,
    handleFindPath, clearPath,
    focusEntityById,
    patterns,
    leads, dispatchLeads, verifyLead,
    continueInvestigation, openCase,
    fetchSubgraph,
    suspectList,
    demoMode: true,
  };

  return (
    <InvestigationContext.Provider value={value}>
      {children}
    </InvestigationContext.Provider>
  );
}

export function useInvestigation() {
  const context = useContext(InvestigationContext);
  if (!context) {
    throw new Error('useInvestigation must be used within an InvestigationProvider');
  }
  return context;
}
