import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';

try { cytoscape.use(coseBilkent); } catch (_) { /* already registered */ }

const ENTITY_COLORS = {
  Person: '#D9AA3D',
  Organization: '#E8D9A8',
  Phone: '#5E9F68',
  FinancialAccount: '#D8C58A',
  Vehicle: '#94A3B8',
  Location: '#C92A2A',
  Default: '#A6B0AA',
};

function inferType(n) {
  if (n.reg_number) return 'Vehicle';
  if (n.number && !n.name) return 'Phone';
  if (n.account_number) return 'FinancialAccount';
  if (n.lat != null && n.lon != null) return 'Location';
  if (n.type && /Company|Exchange|Syndicate|Front|Hawala|Services/.test(n.type)) return 'Organization';
  if (n.role || n.name) return 'Person';
  return 'Entity';
}

function buildElements(nodes, edges, selectedEntity, highlightedPath, focusEntityId) {
  const focusSet = new Set(highlightedPath.length ? highlightedPath : (focusEntityId ? [focusEntityId] : []));

  const cyNodes = nodes.map((n) => {
    const id = n.id || n.number || String(n.entity_id || '');
    const label = n.name || n.reg_number || n.number || n.account_number || n.alias || id;
    const type = inferType(n);
    const color = ENTITY_COLORS[type] || ENTITY_COLORS.Default;
    const isSelected = selectedEntity && (selectedEntity.id === id || selectedEntity.number === id);
    const isPathNode = highlightedPath.includes(id);
    const isFocusCore = focusEntityId === id;
    const dimmed = focusEntityId && !focusSet.has(id) && !isPathNode && highlightedPath.length === 0
      && !nodes.some((x) => {
        const xid = x.id;
        return xid !== id && focusSet.has(xid);
      });

    const classes = [
      isSelected ? 'selected' : '',
      isPathNode ? 'path-highlight' : '',
      isFocusCore ? 'focus-core' : '',
      dimmed ? 'dimmed' : '',
    ].filter(Boolean).join(' ');

    return {
      data: { id, label: label.length > 22 ? `${label.substring(0, 20)}...` : label, fullLabel: label, type, color, cases: n.cases || [], role: n.role || '', raw: n },
      classes,
    };
  });

  const cyEdges = edges.map((e, idx) => {
    const source = e.source || e.from_id;
    const target = e.target || e.to_id;
    const id = `edge_${source}_${target}_${idx}`;
    const type = e.type || e.relation || 'LINKED_TO';
    const isPathEdge = highlightedPath.length >= 2 && highlightedPath.some((nodeId, pIdx) => {
      if (pIdx >= highlightedPath.length - 1) return false;
      const nextId = highlightedPath[pIdx + 1];
      return (nodeId === source && nextId === target) || (nodeId === target && nextId === source);
    });
    return {
      data: { id, source, target, label: type.replace(/_/g, ' '), confidence: e.properties?.confidence || e.confidence || 1.0, case: e.properties?.source_case || e.source_case || '' },
      classes: isPathEdge ? 'path-edge-highlight' : '',
    };
  });

  return [...cyNodes, ...cyEdges];
}

const CY_STYLE = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(color)', label: 'data(label)', color: '#24251F', 'font-size': '11px', 'font-weight': '700',
      'text-valign': 'bottom', 'text-margin-y': 7, 'text-background-color': '#D8C58A', 'text-background-opacity': 0.95,
      'text-background-padding': '4px 8px', 'text-background-shape': 'roundrectangle',
      'border-width': 3, 'border-color': 'rgba(8, 10, 9, 0.9)', width: 40, height: 40,
    },
  },
  { selector: 'node.selected', style: { 'border-color': '#D62828', 'border-width': 5, width: 50, height: 50 } },
  { selector: 'node.focus-core', style: { 'border-color': '#D9AA3D', 'border-width': 6, width: 54, height: 54, 'z-index': 999 } },
  { selector: 'node.path-highlight', style: { 'border-color': '#D62828', 'background-color': '#D62828', color: '#fff', width: 52, height: 52, 'z-index': 998 } },
  { selector: 'node.dimmed', style: { opacity: 0.25 } },
  {
    selector: 'edge',
    style: {
      width: 2.2, 'line-color': 'rgba(214, 40, 40, 0.55)', 'target-arrow-color': 'rgba(214, 40, 40, 0.85)',
      'target-arrow-shape': 'triangle', 'curve-style': 'bezier', label: 'data(label)', 'font-size': '9.5px',
      color: '#F1EBDD', 'text-background-color': '#141715', 'text-background-opacity': 0.92, 'text-background-padding': '3px 6px',
    },
  },
  { selector: 'edge.path-edge-highlight', style: { 'line-color': '#D62828', width: 4.5, 'z-index': 998 } },
];

export default function GraphCanvas({
  nodes = [], edges = [], selectedEntity = null, onSelectEntity = () => {},
  selectedEdge = null, onSelectEdge = () => {},
  highlightedPath = [], layoutName = 'cose', isLoading = false, focusEntityId = null,
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const layoutDone = useRef(false);

  // Init cytoscape once
  useEffect(() => {
    if (!containerRef.current || cyRef.current) return;
    cyRef.current = cytoscape({ container: containerRef.current, style: CY_STYLE, elements: [] });
    cyRef.current.on('tap', 'node', (evt) => {
      onSelectEdge(null);
      onSelectEntity(evt.target.data('raw'));
    });
    cyRef.current.on('tap', 'edge', (evt) => {
      onSelectEntity(null);
      onSelectEdge(evt.target.data());
    });
    cyRef.current.on('tap', (evt) => {
      if (evt.target === cyRef.current) {
        onSelectEntity(null);
        onSelectEdge(null);
      }
    });
  }, [onSelectEntity, onSelectEdge]);

  // Update graph data
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const elements = buildElements(nodes, edges, selectedEntity, highlightedPath, focusEntityId);
    cy.batch(() => {
      cy.elements().remove();
      cy.add(elements);
    });
    const layout = cy.layout({
      name: layoutName === 'cose-bilkent' ? 'cose' : layoutName,
      animate: true, animationDuration: 500, fit: true, padding: 50,
      nodeDimensionsIncludeLabels: true, idealEdgeLength: 100, nodeRepulsion: 4500,
    });
    layout.on('layoutstop', () => { layoutDone.current = true; });
    layout.run();
  }, [nodes, edges, layoutName, highlightedPath, focusEntityId]);

  // Update selection classes + center without relayout
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().removeClass('selected focus-core path-highlight dimmed');
    cy.nodes().forEach((node) => {
      const id = node.id();
      if (selectedEntity && (selectedEntity.id === id || selectedEntity.number === id)) node.addClass('selected');
      if (focusEntityId === id) node.addClass('focus-core');
      if (highlightedPath.includes(id)) node.addClass('path-highlight');
    });
    const centerId = selectedEntity?.id || focusEntityId;
    if (centerId) {
      const n = cy.getElementById(centerId);
      if (n.length) {
        cy.animate({ center: { eles: n }, zoom: Math.min(cy.zoom() * 1.1, 2.2), duration: 350 });
      }
    }
  }, [selectedEntity, focusEntityId, highlightedPath]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(50);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 520, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 520, background: 'radial-gradient(circle at 50% 50%, rgba(20,23,21,0.96) 0%, rgba(8,10,9,0.98) 100%)' }} />
      {focusEntityId && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(214,40,40,0.2)', border: '1px solid rgba(214,40,40,0.5)', color: '#fca5a5', padding: '0.35rem 0.65rem', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, zIndex: 10 }}>
          FOCUS MODE
        </div>
      )}
      <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', display: 'flex', flexDirection: 'column', gap: 6, zIndex: 10 }}>
        <button type="button" onClick={handleZoomIn} style={zoomBtn}>+</button>
        <button type="button" onClick={handleZoomOut} style={zoomBtn}>−</button>
        <button type="button" onClick={handleFit} style={{ ...zoomBtn, color: '#D9AA3D', fontSize: '0.68rem' }}>FIT</button>
      </div>
      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,9,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
          <div style={{ color: '#D9AA3D', fontWeight: 700, fontSize: '0.88rem' }}>Loading network...</div>
        </div>
      )}
    </div>
  );
}

const zoomBtn = {
  width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-color)',
  background: 'rgba(16,19,17,0.92)', color: '#F1EBDD', cursor: 'pointer', fontWeight: 700,
};
