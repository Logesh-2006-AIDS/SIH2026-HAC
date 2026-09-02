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
  Person: '#D9AA3D',          // Gold
  Organization: '#E8D9A8',    // Light Parchment
  Phone: '#5E9F68',           // Verified Green
  FinancialAccount: '#D8C58A',// Evidence Paper
  Vehicle: '#94A3B8',         // Slate Steel
  Location: '#C92A2A',        // Critical Red
  Default: '#A6B0AA',
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
          label: label.length > 22 ? label.substring(0, 20) + '...' : label,
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

    // Transform backend edges to Cytoscape elements (Red investigation strings)
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
          // Core Evidence Pin Node Style
          {
            selector: 'node',
            style: {
              'background-color': 'data(color)',
              'label': 'data(label)',
              'color': '#24251F',
              'font-size': '11px',
              'font-weight': '700',
              'font-family': 'Inter, system-ui, sans-serif',
              'text-valign': 'bottom',
              'text-margin-y': 7,
              'text-background-color': '#D8C58A',
              'text-background-opacity': 0.95,
              'text-background-padding': '4px 8px',
              'text-background-shape': 'roundrectangle',
              'border-width': 3,
              'border-color': 'rgba(8, 10, 9, 0.9)',
              'width': 40,
              'height': 40,
              'transition-property': 'background-color, border-color, border-width, width, height',
              'transition-duration': '0.2s',
            },
          },
          // Node hover / select states (Parchment & Red string pins)
          {
            selector: 'node.selected',
            style: {
              'border-color': '#D62828',
              'border-width': 5,
              'width': 50,
              'height': 50,
              'box-shadow': '0 0 24px #D62828',
            },
          },
          {
            selector: 'node.path-highlight',
            style: {
              'border-color': '#D9AA3D',
              'border-width': 6,
              'background-color': '#D62828',
              'color': '#ffffff',
              'width': 52,
              'height': 52,
              'z-index': 999,
            },
          },
          // Core Edge Style: Red Investigation Strings
          {
            selector: 'edge',
            style: {
              'width': 2.2,
              'line-color': 'rgba(214, 40, 40, 0.55)', // Red string
              'target-arrow-color': 'rgba(214, 40, 40, 0.85)',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'arrow-scale': 1.2,
              'label': 'data(label)',
              'font-size': '9.5px',
              'color': '#F1EBDD',
              'text-rotation': 'autorotate',
              'text-background-color': '#141715',
              'text-background-opacity': 0.92,
              'text-background-padding': '3px 6px',
              'transition-property': 'line-color, width',
              'transition-duration': '0.2s',
            },
          },
          // Path highlighted edge (Active Red Investigation String)
          {
            selector: 'edge.path-edge-highlight',
            style: {
              'line-color': '#D62828',
              'target-arrow-color': '#D62828',
              'width': 4.5,
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      {/* Cytoscape Canvas Container (Black / Charcoal Command Center) */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '520px',
          background: 'radial-gradient(circle at 50% 50%, rgba(20, 23, 21, 0.96) 0%, rgba(8, 10, 9, 0.98) 100%)',
        }}
      />

      {/* Floating Controls (Zoom, Fit) */}
      <div
        style={{
          position: 'absolute',
          bottom: '1.25rem',
          right: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          background: 'rgba(16, 19, 17, 0.92)',
          backdropFilter: 'blur(16px)',
          padding: '0.45rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          zIndex: 10,
        }}
      >
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'rgba(255,255,255,0.06)',
            color: '#F1EBDD',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1.1rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'rgba(255,255,255,0.06)',
            color: '#F1EBDD',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1.1rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >
          −
        </button>
        <button
          onClick={handleFit}
          title="Fit Network to Screen"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: '1px solid rgba(217, 170, 61, 0.4)',
            background: 'rgba(217, 170, 61, 0.15)',
            color: '#D9AA3D',
            cursor: 'pointer',
            fontSize: '0.72rem',
            fontWeight: 800,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(217, 170, 61, 0.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(217, 170, 61, 0.15)')}
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
          gap: '0.65rem',
          background: 'rgba(8, 10, 9, 0.9)',
          backdropFilter: 'blur(12px)',
          padding: '0.55rem 0.95rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          fontSize: '0.76rem',
          zIndex: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        {Object.entries(ENTITY_COLORS).map(([type, color]) => {
          if (type === 'Default') return null;
          return (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 8px ${color}` }} />
              <span style={{ color: '#F1EBDD', fontWeight: 600 }}>{type}</span>
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
            background: 'rgba(8, 10, 9, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: '#D9AA3D', fontWeight: 700, fontSize: '0.92rem' }}>
            <div className="animate-spin" style={{ width: 24, height: 24, border: '3px solid rgba(217,170,61,0.3)', borderTopColor: '#D9AA3D', borderRadius: '50%' }} />
            <span>Updating Digital Forensic Board...</span>
          </div>
        </div>
      )}
    </div>
  );
}
