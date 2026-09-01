import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';

// Register cose-bilkent layout if available
try {
  cytoscape.use(coseBilkent);
} catch (e) {
  // Already registered or fallback to built-in cose
}

const ENTITY_COLORS = {
  Person: '#3b82f6',          // Blue
  Organization: '#f59e0b',    // Amber / Orange
  Phone: '#06b6d4',           // Cyan
  FinancialAccount: '#8b5cf6',// Purple
  Vehicle: '#10b981',         // Emerald Green
  Location: '#ef4444',        // Crimson Red
  Default: '#9ca3af',
};

export default function GraphCanvas({
  nodes = [],
  edges = [],
  selectedEntity = null,
  onSelectEntity = () => {},
  highlightedPath = [],
  layoutName = 'cose',
  isLoading = false,
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  // Initialize and update Cytoscape instance
  useEffect(() => {
    if (!containerRef.current) return;

    // Transform backend nodes to Cytoscape elements
    const cyNodes = nodes.map((n) => {
      const id = n.id || n.number || String(n.entity_id || '');
      const label = n.name || n.reg_number || n.number || n.account_number || n.alias || id;
      
      // Determine entity type based on fields
      let type = 'Person';
      if (n.reg_number) type = 'Vehicle';
      else if (n.number && !n.name) type = 'Phone';
      else if (n.account_number) type = 'FinancialAccount';
      else if (n.type && (n.type.includes('Company') || n.type.includes('Exchange') || n.type.includes('Syndicate') || n.type.includes('Front') || n.type.includes('Hawala'))) type = 'Organization';
      else if (n.lat && n.lon) type = 'Location';
      else if (n.role) type = 'Person';

      const color = ENTITY_COLORS[type] || ENTITY_COLORS.Default;
      const isSelected = selectedEntity && (selectedEntity.id === id || selectedEntity.number === id);
      const isPathNode = highlightedPath.includes(id);

      return {
        data: {
          id: id,
          label: label.length > 20 ? label.substring(0, 18) + '...' : label,
          fullLabel: label,
          type: type,
          color: color,
          cases: n.cases || [],
          role: n.role || '',
          raw: n,
        },
        classes: `${isSelected ? 'selected' : ''} ${isPathNode ? 'path-highlight' : ''}`,
      };
    });

    // Transform backend edges to Cytoscape elements
    const cyEdges = edges.map((e, idx) => {
      const source = e.source;
      const target = e.target;
      const id = `edge_${source}_${target}_${idx}`;
      const type = e.type || 'LINKED_TO';
      const isPathEdge =
        highlightedPath.length >= 2 &&
        highlightedPath.some((nodeId, pIdx) => {
          if (pIdx >= highlightedPath.length - 1) return false;
          const nextId = highlightedPath[pIdx + 1];
          return (
            (nodeId === source && nextId === target) ||
            (nodeId === target && nextId === source)
          );
        });

      return {
        data: {
          id: id,
          source: source,
          target: target,
          label: type.replace(/_/g, ' '),
          confidence: e.properties?.confidence || 1.0,
          case: e.properties?.source_case || '',
        },
        classes: `${isPathEdge ? 'path-edge-highlight' : ''}`,
      };
    });

    // Create or re-initialize Cytoscape
    if (!cyRef.current) {
      cyRef.current = cytoscape({
        container: containerRef.current,
        elements: [...cyNodes, ...cyEdges],
        style: [
          // Core Node Style
          {
            selector: 'node',
            style: {
              'background-color': 'data(color)',
              'label': 'data(label)',
              'color': '#f3f4f6',
              'font-size': '11px',
              'font-weight': '600',
              'font-family': 'Inter, system-ui, sans-serif',
              'text-valign': 'bottom',
              'text-margin-y': 6,
              'text-background-color': 'rgba(11, 15, 25, 0.85)',
              'text-background-opacity': 0.9,
              'text-background-padding': '3px 6px',
              'text-background-shape': 'roundrectangle',
              'border-width': 2,
              'border-color': 'rgba(255, 255, 255, 0.25)',
              'width': 36,
              'height': 36,
              'transition-property': 'background-color, border-color, border-width, width, height',
              'transition-duration': '0.2s',
            },
          },
          // Node hover / select states
          {
            selector: 'node.selected',
            style: {
              'border-color': '#ffffff',
              'border-width': 4,
              'width': 46,
              'height': 46,
              'box-shadow': '0 0 20px #ffffff',
            },
          },
          {
            selector: 'node.path-highlight',
            style: {
              'border-color': '#fbbf24',
              'border-width': 5,
              'background-color': '#f59e0b',
              'width': 48,
              'height': 48,
              'z-index': 999,
            },
          },
          // Core Edge Style
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': 'rgba(255, 255, 255, 0.2)',
              'target-arrow-color': 'rgba(255, 255, 255, 0.4)',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'arrow-scale': 1.1,
              'label': 'data(label)',
              'font-size': '9px',
              'color': '#9ca3af',
              'text-rotation': 'autorotate',
              'text-background-color': 'rgba(17, 24, 39, 0.8)',
              'text-background-opacity': 0.8,
              'text-background-padding': '2px',
              'transition-property': 'line-color, width',
              'transition-duration': '0.2s',
            },
          },
          // Path highlighted edge
          {
            selector: 'edge.path-edge-highlight',
            style: {
              'line-color': '#fbbf24',
              'target-arrow-color': '#fbbf24',
              'width': 4,
              'z-index': 998,
            },
          },
        ],
        layout: {
          name: layoutName === 'cose-bilkent' ? 'cose' : layoutName,
          animate: true,
          animationDuration: 600,
          nodeDimensionsIncludeLabels: true,
          fit: true,
          padding: 50,
          randomize: false,
          idealEdgeLength: 100,
          nodeRepulsion: 4500,
        },
      });

      // Node selection event listener
      cyRef.current.on('tap', 'node', (evt) => {
        const nodeData = evt.target.data('raw');
        onSelectEntity(nodeData);
      });

      // Canvas background tap deselects
      cyRef.current.on('tap', (evt) => {
        if (evt.target === cyRef.current) {
          onSelectEntity(null);
        }
      });
    } else {
      // Smoothly update elements
      const cy = cyRef.current;
      cy.batch(() => {
        cy.elements().remove();
        cy.add([...cyNodes, ...cyEdges]);
      });

      // Rerun layout
      const layout = cy.layout({
        name: layoutName === 'cose-bilkent' ? 'cose' : layoutName,
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 50,
      });
      layout.run();
    }

    return () => {
      // Keep canvas instance alive for performance
    };
  }, [nodes, edges, selectedEntity, highlightedPath, layoutName]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(50);
  const handleReset = () => {
    cyRef.current?.reset();
    cyRef.current?.fit(50);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Cytoscape Canvas Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '520px',
          background: 'radial-gradient(circle at 50% 50%, rgba(17, 24, 39, 0.95) 0%, rgba(11, 15, 25, 0.98) 100%)',
        }}
      />

      {/* Floating Canvas Controls (Zoom, Fit, Reset) */}
      <div
        style={{
          position: 'absolute',
          bottom: '1.25rem',
          right: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          background: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(10px)',
          padding: '0.4rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          zIndex: 10,
        }}
      >
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: 'none',
            background: 'rgba(255,255,255,0.06)',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1.1rem',
          }}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: 'none',
            background: 'rgba(255,255,255,0.06)',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1.1rem',
          }}
        >
          −
        </button>
        <button
          onClick={handleFit}
          title="Fit Network to Screen"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: 'none',
            background: 'rgba(255,255,255,0.06)',
            color: '#818cf8',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          FIT
        </button>
      </div>

      {/* Color Taxonomy Legend */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.6rem',
          background: 'rgba(11, 15, 25, 0.8)',
          backdropFilter: 'blur(8px)',
          padding: '0.5rem 0.85rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          zIndex: 10,
        }}
      >
        {Object.entries(ENTITY_COLORS).map(([type, color]) => {
          if (type === 'Default') return null;
          return (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
              <span style={{ color: '#d1d5db', fontWeight: 500 }}>{type}</span>
            </div>
          );
        })}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(11, 15, 25, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#818cf8', fontWeight: 600 }}>
            <div className="spinner" style={{ width: 22, height: 22, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span>Processing Knowledge Graph...</span>
          </div>
        </div>
      )}
    </div>
  );
}
