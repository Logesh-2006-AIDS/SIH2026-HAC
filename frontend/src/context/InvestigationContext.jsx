import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const InvestigationContext = createContext(null);

export function InvestigationProvider({ children }) {
  const [currentRole, setCurrentRole] = useState('INVESTIGATOR');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCase, setSelectedCase] = useState('103');
  const [casesList, setCasesList] = useState([]);
  const [caseSummary, setCaseSummary] = useState(null);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [layoutName, setLayoutName] = useState('cose');

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [graphFocusEntity, setGraphFocusEntity] = useState(null);
  const [focusMode, setFocusMode] = useState(true);
  const [expandHops, setExpandHops] = useState(1);

  const [highlightedPath, setHighlightedPath] = useState([]);
  const [pathDetails, setPathDetails] = useState(null);
  const [pathMessage, setPathMessage] = useState('');
  const [pathSourceId, setPathSourceId] = useState(null);

  const [crossCaseSelection, setCrossCaseSelection] = useState(null);
  const [investigationSection, setInvestigationSection] = useState('brief');

  useEffect(() => {
    if (currentRole === 'INVESTIGATOR') setActiveTab('dashboard');
    else if (currentRole === 'ANALYST') setActiveTab('map');
    else if (currentRole === 'ADMIN') setActiveTab('ingest');
  }, [currentRole]);

  useEffect(() => {
    axios.get('/api/v1/cases/')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setCasesList(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const refreshCaseSummary = useCallback(async (caseId) => {
    if (!caseId) return;
    try {
      const [caseRes, crossRes, briefRes] = await Promise.all([
        axios.get(`/api/v1/cases/${caseId}`),
        axios.get(`/api/v1/cases/${caseId}/cross-links`),
        axios.get(`/api/v1/cases/${caseId}/brief`),
      ]);
      const dossier = caseRes.data?.data?.dossier;
      const graphEntities = caseRes.data?.data?.graph_entities || [];
      const graphRelations = caseRes.data?.data?.graph_relations || [];
      const crossLinks = crossRes.data?.data?.links || [];
      const brief = briefRes.data?.data;
      const leads = brief?.ai_suggested_leads?.length || 0;
      setCaseSummary({
        caseId,
        dossier,
        entityCount: graphEntities.length,
        connectionCount: graphRelations.length,
        crossCaseCount: crossLinks.length,
        leadCount: leads,
      });
    } catch {
      setCaseSummary(null);
    }
  }, []);

  useEffect(() => {
    refreshCaseSummary(selectedCase);
  }, [selectedCase, refreshCaseSummary]);

  const fetchSubgraph = useCallback(async (caseId = '', entityId = null, hops = 1) => {
    setIsLoadingGraph(true);
    try {
      let url;
      if (entityId && focusMode) {
        url = `/api/v1/graph/focus-subgraph?entity_id=${entityId}&hops=${hops}`;
        if (caseId) url += `&case_id=${caseId}`;
      } else {
        url = caseId ? `/api/v1/graph/subgraph?case_id=${caseId}` : '/api/v1/graph/subgraph';
      }
      const res = await axios.get(url);
      if (res.data?.success) {
        setNodes(res.data.data.nodes || []);
        setEdges(res.data.data.edges || []);
      }
    } catch (err) {
      console.error('Failed to fetch subgraph:', err);
    } finally {
      setIsLoadingGraph(false);
    }
  }, [focusMode]);

  useEffect(() => {
    if (activeTab === 'network' || activeTab === 'entity') {
      const focusId = focusMode ? (graphFocusEntity || selectedEntity?.id) : null;
      fetchSubgraph(selectedCase, focusId, expandHops);
    }
  }, [selectedCase, graphFocusEntity, selectedEntity?.id, focusMode, expandHops, activeTab, fetchSubgraph]);

  const selectEntity = useCallback((entity, options = {}) => {
    if (!entity) {
      setSelectedEntity(null);
      return;
    }
    setSelectedEntity(entity);
    if (options.focusGraph !== false) {
      setGraphFocusEntity(entity.id || entity.number);
      setFocusMode(true);
    }
  }, []);

  const focusEntityById = useCallback(async (entityId, openNetwork = true) => {
    if (!entityId) return;
    try {
      const res = await axios.get(`/api/v1/graph/entity/${entityId}/profile`);
      if (res.data?.success) {
        const ent = res.data.data.entity;
        selectEntity(ent, { focusGraph: true });
        if (openNetwork) setActiveTab('network');
      } else {
        const match = nodes.find((n) => n.id === entityId);
        if (match) {
          selectEntity(match, { focusGraph: true });
          if (openNetwork) setActiveTab('network');
        }
      }
    } catch {
      const match = nodes.find((n) => n.id === entityId);
      if (match) {
        selectEntity(match, { focusGraph: true });
        if (openNetwork) setActiveTab('network');
      }
    }
  }, [nodes, selectEntity]);

  const handleFindPath = useCallback(async (sourceId, targetId) => {
    setIsLoadingGraph(true);
    try {
      const res = await axios.get(`/api/v1/graph/shortest-path?source_id=${sourceId}&target_id=${targetId}`);
      const data = res.data?.data;
      if (res.data?.success && data?.path?.length) {
        setHighlightedPath(data.path);
        setPathDetails(data);
        setPathMessage(data.explanation || `Path: ${data.path.join(' → ')}`);
        setGraphFocusEntity(null);
        setFocusMode(false);
        await fetchSubgraph(selectedCase);
      } else {
        setPathMessage('No direct path found between the selected entities.');
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
    if (graphFocusEntity) {
      fetchSubgraph(selectedCase, graphFocusEntity, expandHops);
    }
  }, [graphFocusEntity, selectedCase, expandHops, fetchSubgraph]);

  const continueInvestigation = useCallback(() => {
    setInvestigationSection('brief');
    setActiveTab('investigation');
  }, []);

  const openCase = useCallback((caseId) => {
    setSelectedCase(caseId);
    setInvestigationSection('brief');
    setActiveTab('investigation');
  }, []);

  const suspectList = useMemo(() => (
    nodes
      .filter((n) => n.id && (n.name || n.role || String(n.id).startsWith('P')))
      .map((n) => ({ id: n.id, name: n.name || n.id }))
  ), [nodes]);

  const value = {
    activeTab, setActiveTab,
    currentRole, setCurrentRole,
    selectedCase, setSelectedCase,
    casesList, caseSummary, refreshCaseSummary,
    nodes, edges, isLoadingGraph,
    layoutName, setLayoutName,
    selectedEntity, selectEntity,
    graphFocusEntity, setGraphFocusEntity,
    focusMode, setFocusMode,
    expandHops, setExpandHops,
    highlightedPath, pathDetails, pathMessage, pathSourceId, setPathSourceId,
    crossCaseSelection, setCrossCaseSelection,
    investigationSection, setInvestigationSection,
    fetchSubgraph, handleFindPath, clearPath,
    focusEntityById, continueInvestigation, openCase,
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
