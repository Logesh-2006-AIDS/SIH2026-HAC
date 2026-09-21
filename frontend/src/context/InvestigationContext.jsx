import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import * as mockService from '../data/mockService.js';
import { INVESTIGATION_LEADS } from '../data/mockData.js';

const InvestigationContext = createContext(null);

// Lead state reducer for local verification
function leadsReducer(state, action) {
  switch (action.type) {
    case 'SET_LEADS': return action.leads;
    case 'VERIFY_LEAD':
      return state.map(l => l.id === action.id
        ? { ...l, status: action.status, verified_at: new Date().toLocaleTimeString(), verified_by: 'Investigator (Demo)' }
        : l
      );
    case 'RESET': return INVESTIGATION_LEADS.map(l => ({ ...l }));
    default: return state;
  }
}

export function InvestigationProvider({ children }) {
  // ── Core navigation state ──────────────────────────────────────────────────
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

  // ── Cross-case state ───────────────────────────────────────────────────────
  const [crossCaseSelection, setCrossCaseSelection] = useState(null);

  // ── Patterns & leads ───────────────────────────────────────────────────────
  const [patterns, setPatterns] = useState([]);
  const [leads, dispatchLeads] = useReducer(leadsReducer, INVESTIGATION_LEADS.map(l => ({ ...l })));

  // ── Demo state ─────────────────────────────────────────────────────────────
  const [demoMode] = useState(true);
  const [ingestionDone, setIngestionDone] = useState(false);

  // ── Sync with browser history back/forward ──────────────────────────────────
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

  // ── Load cases on mount ────────────────────────────────────────────────────
  useEffect(() => {
    mockService.getCases().then(res => {
      if (res.success) setCasesList(res.data);
    });
  }, []);

  // ── Load patterns when case changes ───────────────────────────────────────
  useEffect(() => {
    mockService.getPatterns(`CASE-${selectedCase}`).then(res => {
      if (res.success) setPatterns(res.data.patterns || []);
    });
  }, [selectedCase]);

  // ── Case summary refresh ──────────────────────────────────────────────────
  const refreshCaseSummary = useCallback(async (caseId) => {
    if (!caseId) return;
    const res = await mockService.getCaseSummary(caseId);
    if (res.success) {
      const d = res.data;
      setCaseSummary({
        caseId,
        dossier: d.dossier,
        entityCount: d.entity_count,
        connectionCount: d.connection_count,
        crossCaseCount: d.cross_case_count,
        leadCount: d.lead_count,
      });
    }
  }, []);

  useEffect(() => { refreshCaseSummary(selectedCase); }, [selectedCase, refreshCaseSummary]);

  // ── Graph fetch ─────────────────────────────────────────────────────────────
  const fetchSubgraph = useCallback(async (caseId = '', entityId = null, hops = 1) => {
    setIsLoadingGraph(true);
    try {
      const res = await mockService.getSubgraph(caseId ? `CASE-${caseId.replace('CASE-', '')}` : '', entityId, hops);
      if (res.success) {
        setNodes(res.data.nodes || []);
        setEdges(res.data.edges || []);
      }
    } catch (err) {
      console.error('fetchSubgraph error:', err);
    } finally {
      setIsLoadingGraph(false);
    }
  }, []);

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

  // ── Focus entity by ID (cross-component navigation) ───────────────────────
  const focusEntityById = useCallback(async (entityId, openNetwork = true) => {
    if (!entityId) return;
    const res = await mockService.getEntityProfile(entityId);
    if (res.success) {
      selectEntity(res.data.entity, { focusGraph: true });
      if (openNetwork) setActiveTab('network');
    } else {
      const match = nodes.find(n => n.id === entityId);
      if (match) { selectEntity(match, { focusGraph: true }); if (openNetwork) setActiveTab('network'); }
    }
  }, [nodes, selectEntity]);

  // ── Path finder ─────────────────────────────────────────────────────────────
  const handleFindPath = useCallback(async (sourceId, targetId) => {
    setIsLoadingGraph(true);
    try {
      const res = await mockService.findShortestPath(sourceId, targetId);
      const data = res.data;
      if (res.success && data?.path?.length) {
        setHighlightedPath(data.path);
        setPathDetails(data);
        setPathMessage(data.explanation || `Path found: ${data.hop_count} hop(s)`);
        setGraphFocusEntity(null);
        setFocusMode(false);
        await fetchSubgraph(selectedCase);
      } else {
        setPathMessage('No path found between the selected entities.');
        setPathDetails(null);
      }
    } catch (err) {
      console.error('Path trace failed:', err);
      setPathMessage('Path trace failed.');
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

  // ── Lead verification (local state only) ───────────────────────────────────
  const verifyLead = useCallback((leadId, status) => {
    dispatchLeads({ type: 'VERIFY_LEAD', id: leadId, status });
  }, []);

  // ── Case navigation ─────────────────────────────────────────────────────────
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

  // ── Demo reset ──────────────────────────────────────────────────────────────
  const resetDemo = useCallback(() => {
    setSelectedCase('101');
    setSelectedEntity(null);
    setGraphFocusEntity(null);
    setFocusMode(false);
    setExpandHops(1);
    setHighlightedPath([]);
    setPathDetails(null);
    setPathMessage('');
    setActiveTab('dashboard');
    setIngestionDone(false);
    setInvestigationSection('brief');
    dispatchLeads({ type: 'RESET' });
  }, []);

  // ── Suspect list for GraphControls ─────────────────────────────────────────
  const suspectList = useMemo(() =>
    nodes
      .filter(n => n.type === 'Person' && n.id)
      .map(n => ({ id: n.id, name: n.name || n.id })),
    [nodes]
  );

  const value = {
    // Navigation
    activeTab, setActiveTab,
    currentRole, setCurrentRole,
    selectedCase, setSelectedCase,
    casesList, caseSummary, refreshCaseSummary,
    investigationSection, setInvestigationSection,
    // Graph
    nodes, edges, isLoadingGraph,
    layoutName, setLayoutName,
    selectedEntity, selectEntity,
    graphFocusEntity, setGraphFocusEntity,
    focusMode, setFocusMode,
    expandHops, setExpandHops,
    // Path
    highlightedPath, pathDetails, pathMessage, pathSourceId, setPathSourceId,
    // Cross-case
    crossCaseSelection, setCrossCaseSelection,
    // Patterns & leads
    patterns, leads,
    // Demo
    demoMode, ingestionDone, setIngestionDone,
    // Actions
    fetchSubgraph, handleFindPath, clearPath,
    focusEntityById, continueInvestigation, openCase,
    verifyLead, resetDemo,
    suspectList,
  };

  return (
    <InvestigationContext.Provider value={value}>
      {children}
    </InvestigationContext.Provider>
  );
}

export function useInvestigation() {
  const ctx = useContext(InvestigationContext);
  if (!ctx) throw new Error('useInvestigation must be used within InvestigationProvider');
  return ctx;
}
