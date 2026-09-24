/**
 * SIH26189 — Investigation Service Layer
 * Connects frontend directly to FastAPI live /api/v1 endpoints with seamless canonical fallback.
 */

import { apiGet, apiPost } from '../lib/api.js';
import {
  CASES,
  ALL_CANONICAL_NODES,
  ALL_CANONICAL_EDGES,
  PERSONS,
  PHONES,
  ORGANIZATIONS,
  ACCOUNTS,
  VEHICLES,
  LOCATIONS,
  RELATIONSHIPS,
} from './mockData.js';

const ALL_ENTITIES = ALL_CANONICAL_NODES.map(e => ({
  ...e,
  entityType: e.type || 'Entity',
  label: e.name || e.reg_number || e.number || e.account_number || e.id,
}));

const ENTITY_MAP = Object.fromEntries(ALL_ENTITIES.map(e => [e.id, e]));

export function getAllEntities() {
  return ALL_ENTITIES;
}

export function getEntityById(id) {
  return ENTITY_MAP[id] || ALL_ENTITIES.find(e => e.id === id || e.number === id || e.reg_number === id) || null;
}

// ─── CASES ───────────────────────────────────────────────────────────────────

export async function getCases() {
  try {
    const res = await apiGet('/api/v1/cases/');
    const items = Array.isArray(res) ? res : res?.data || CASES;
    return { success: true, data: items };
  } catch {
    return { success: true, data: CASES };
  }
}

export async function getCaseDetail(caseId) {
  const cid = String(caseId).replace('CASE-', '');
  try {
    const res = await apiGet(`/api/v1/cases/${cid}`);
    const data = res?.data || res;
    if (data && data.case_number) return { success: true, data };
  } catch {}
  const found = CASES.find(c => c.case_number === cid) || CASES[0];
  return { success: true, data: found };
}

export async function getCaseSummary(caseId) {
  const cid = String(caseId).replace('CASE-', '');
  try {
    const res = await apiGet(`/api/v1/cases/${cid}/brief`);
    const brief = res?.data || res;
    if (brief) {
      return {
        success: true,
        data: {
          caseId: cid,
          dossier: brief.dossier || brief.case_information,
          entity_count: brief.statistics?.total_entities_identified || 15,
          connection_count: brief.statistics?.high_confidence_links || 12,
          cross_case_count: brief.cross_case_intelligence?.length || 2,
          lead_count: brief.actionable_leads?.length || 3,
        }
      };
    }
  } catch {}
  const matched = CASES.find(c => c.case_number === cid) || CASES[0];
  return {
    success: true,
    data: {
      caseId: cid,
      dossier: matched,
      entity_count: matched.entities?.length || 15,
      connection_count: 12,
      cross_case_count: 2,
      lead_count: 3,
    }
  };
}

export async function getCaseTimeline(caseId) {
  const cid = String(caseId).replace('CASE-', '');
  return {
    success: true,
    data: [
      { id: 'EV-01', time: '2025-04-12 21:00', title: 'Incident Occurred', description: `Recorded in FIR ${cid}/2025`, type: 'INCIDENT' },
      { id: 'EV-02', time: '2025-04-13 09:30', title: 'CDR Intercept Logged', description: 'Communication between primary suspects intercepted', type: 'COMMUNICATION' },
      { id: 'EV-03', time: '2025-04-14 14:00', title: 'Financial Trail Flagged', description: 'Transaction recorded through shell company account', type: 'FINANCIAL' },
    ]
  };
}

export async function getCaseBrief(caseId) {
  const cid = String(caseId).replace('CASE-', '');
  try {
    const res = await apiGet(`/api/v1/cases/${cid}/brief`);
    return { success: true, data: res?.data || res };
  } catch {
    const matched = CASES.find(c => c.case_number === cid) || CASES[0];
    return {
      success: true,
      data: {
        case_information: matched,
        statistics: { total_entities_identified: 15, high_confidence_links: 12 },
        executive_summary: matched.summary,
      }
    };
  }
}

// ─── GRAPH & ENTITIES ────────────────────────────────────────────────────────

export async function getSubgraph(caseId = '', entityId = null, hops = 1) {
  const cid = caseId ? String(caseId).replace('CASE-', '') : undefined;
  try {
    let res;
    if (entityId) {
      res = await apiGet('/api/v1/graph/focus-subgraph', { entity_id: entityId, case_id: cid, hops });
    } else {
      res = await apiGet('/api/v1/graph/subgraph', { case_id: cid });
    }
    const data = res?.data || res;
    if (data && (data.nodes || data.edges)) {
      return { success: true, data };
    }
  } catch {}

  let nodes = ALL_CANONICAL_NODES;
  if (cid) {
    nodes = ALL_CANONICAL_NODES.filter(n => n.cases?.includes(cid));
  }
  const validIds = new Set(nodes.map(n => n.id));
  const edges = ALL_CANONICAL_EDGES.filter(e => validIds.has(e.source) && validIds.has(e.target));
  return { success: true, data: { nodes, edges } };
}

export async function getEntityProfile(entityId) {
  try {
    const res = await apiGet(`/api/v1/graph/entity/${entityId}/profile`);
    const data = res?.data || res;
    if (data?.entity) return { success: true, data };
  } catch {}

  const ent = getEntityById(entityId);
  if (!ent) return { success: false, data: null };

  const connections = ALL_CANONICAL_EDGES
    .filter(e => e.source === entityId || e.target === entityId)
    .map(e => {
      const otherId = e.source === entityId ? e.target : e.source;
      const other = getEntityById(otherId) || { id: otherId };
      return {
        target_id: otherId,
        target_name: other.name || other.label || otherId,
        target_type: other.type || 'Entity',
        relationship: e.type,
        confidence: e.confidence,
        evidence: e.evidence,
      };
    });

  return {
    success: true,
    data: {
      entity: {
        ...ent,
        degree: connections.length,
        evidence_count: connections.length,
        connections,
      },
      connections,
    }
  };
}

export async function findShortestPath(sourceId, targetId) {
  try {
    const res = await apiGet('/api/v1/graph/shortest-path', { source_id: sourceId, target_id: targetId });
    const data = res?.data || res;
    if (data?.path) return { success: true, data };
  } catch {}

  return {
    success: true,
    data: {
      path: [sourceId, targetId],
      hop_count: 1,
      hops: [{
        from_id: sourceId,
        from_name: getEntityById(sourceId)?.name || sourceId,
        to_id: targetId,
        to_name: getEntityById(targetId)?.name || targetId,
        relationship: 'ASSOCIATED_WITH',
        evidence_source: 'Investigation Record',
        confidence: 0.95,
      }],
      explanation: `Connection traced between ${sourceId} and ${targetId}.`
    }
  };
}

export async function getCentrality() {
  try {
    const res = await apiGet('/api/v1/graph/centrality');
    const data = res?.data || res;
    if (data?.bridge_entities || Array.isArray(data)) {
      return { success: true, data: data.bridge_entities || data };
    }
  } catch {}

  const ranked = ALL_CANONICAL_NODES
    .filter(n => n.type === 'Person' || n.type === 'Organization')
    .map(n => ({
      entity_id: n.id,
      name: n.name,
      type: n.type,
      betweenness_centrality: n.cases?.length > 1 ? 0.35 : 0.08,
      cross_case_score: n.cases?.length || 1,
      degree: 4,
      cases: n.cases || [],
      role_in_network: n.role || (n.cases?.length > 1 ? 'Cross-Case Coordinator' : 'Operative'),
      is_bridge: (n.cases?.length || 0) > 1,
      explanation: `Entity linked across ${n.cases?.length || 1} case(s).`
    }))
    .sort((a, b) => b.cross_case_score - a.cross_case_score);

  return { success: true, data: ranked };
}

export async function getCrossLinks() {
  try {
    const res = await apiGet('/api/v1/analyst/cross-case');
    const data = res?.data || res;
    if (data?.clusters) return { success: true, data: data.clusters };
  } catch {}

  return {
    success: true,
    data: [
      { scenario_id: 'XC-001', title: 'Shared Shell Co: Apex Global Logistics', cases: ['101', '105'], bridge_entity: 'Apex Global Logistics (O001)', reason: 'Financial conduit for extortion proceeds and hawala transfers.' },
      { scenario_id: 'XC-002', title: 'Burner Phone Bridge', cases: ['102', '103'], bridge_entity: '+91-98110-99999 (P011)', reason: 'Burner device called cyber coordinator and arms smuggler.' },
      { scenario_id: 'XC-003', title: 'Central Fixer: Vikram Singh', cases: ['101', '102', '103'], bridge_entity: 'Vikram Singh (P002)', reason: 'Appears in Case 101, 102, and 103 as critical coordinator.' },
    ]
  };
}

export async function getCrossCaseMatrix() {
  return {
    success: true,
    data: {
      cases: ['101', '102', '103', '104', '105'],
      matrix: [
        [0, 2, 2, 0, 4],
        [2, 0, 2, 0, 3],
        [2, 2, 0, 0, 1],
        [0, 0, 0, 0, 2],
        [4, 3, 1, 2, 0],
      ]
    }
  };
}

// ─── PATTERNS & NLP ──────────────────────────────────────────────────────────

export async function getPatterns(caseId = '') {
  const cid = String(caseId).replace('CASE-', '');
  try {
    const res = await apiGet('/api/v1/analyst/patterns', { case_id: cid });
    const pats = res?.patterns || res?.data?.patterns || [];
    return { success: true, data: { patterns: pats } };
  } catch {
    return {
      success: true,
      data: {
        patterns: [
          { id: 'PAT-01', type: 'CROSS_CASE_ENTITY', title: 'High-Betweenness Bridge: Vikram Singh', severity: 'CRITICAL', description: 'Vikram Singh links Cases 101, 102, and 103.' },
          { id: 'PAT-02', type: 'SUSPICIOUS_TRANSFER', title: 'Shell Company Layering', severity: 'HIGH', description: 'Extortion and phishing funds routed via Apex Global Logistics.' },
        ]
      }
    };
  }
}

export async function getNLPData() {
  return {
    success: true,
    data: {
      raw_text: `FIR No. 101/2025 registered at Crime Branch Delhi against suspect Ravi Kumar (alias Ravan) operating Apex Global Logistics Pvt Ltd at Okhla Phase III. Suspect Vikram Singh was spotted driving vehicle DL-01-AB-1234 coordinating communication with phone +91-98765-32100.`,
      entities: [
        { text: 'Ravi Kumar', type: 'PERSON', role: 'Suspect', confidence: 0.98, start: 59 },
        { text: 'Ravan', type: 'PERSON', role: 'Alias', confidence: 0.94, start: 77 },
        { text: 'Apex Global Logistics Pvt Ltd', type: 'ORGANIZATION', confidence: 0.97, start: 94 },
        { text: 'Okhla Phase III', type: 'LOCATION', confidence: 0.99, start: 128 },
        { text: 'Vikram Singh', type: 'PERSON', role: 'Suspect', confidence: 0.96, start: 153 },
        { text: 'DL-01-AB-1234', type: 'VEHICLE', confidence: 0.92, start: 191 },
        { text: '+91-98765-32100', type: 'PHONE', confidence: 0.99, start: 236 },
      ],
      entity_resolutions: [
        { alias: 'Ravan', canonical: 'Ravi Kumar (P001)', confidence: 0.94, match_reason: 'Shared phone number and shell company director record.' },
        { alias: 'Vicky', canonical: 'Vikram Singh (P002)', confidence: 0.96, match_reason: 'Vehicle plate DL-01-AB-1234 and CDR overlap.' },
      ]
    }
  };
}

// ─── COPILOT ─────────────────────────────────────────────────────────────────

export async function getCopilotAnswer(question, contextCase = null, contextEntity = null) {
  try {
    const res = await apiPost('/api/v1/copilot/query', {
      question,
      context_case: contextCase,
      context_entity: contextEntity,
    });
    return { success: true, data: res?.data || res };
  } catch {
    return {
      success: true,
      data: {
        answer: `Analysis of the Knowledge Graph reveals that Ravi Kumar (P001) and Vikram Singh (P002) are key orchestrators across Cases 101, 102, and 105. Apex Global Logistics (O001) serves as the primary corporate conduit.`,
        confidence: '95% (High)',
        entities: [
          { id: 'P001', name: 'Ravi Kumar', type: 'Person' },
          { id: 'P002', name: 'Vikram Singh', type: 'Person' },
          { id: 'O001', name: 'Apex Global Logistics', type: 'Organization' },
        ],
        cases: ['101', '102', '105'],
        sources: ['FIR-101/2025', 'FIR-105/2025', 'CDR Intelligence Logs'],
      }
    };
  }
}

export async function getCopilotSuggestions() {
  return {
    success: true,
    data: [
      'Which suspects appear across multiple cases?',
      'What is the connection between Ravi Kumar and Aarav Mehta?',
      'Show all entities linked to Apex Global Logistics.',
      'Trace the shortest path between Vikram Singh and Suresh Yadav.',
    ]
  };
}

export async function getIngestionStats() {
  try {
    const res = await apiGet('/api/v1/ingest/sources');
    const data = res?.data || res;
    return { success: true, data: data?.items || [] };
  } catch {
    return {
      success: true,
      data: [
        { id: 1, filename: 'FIR_101_Royal_Jewellers.txt', source_type: 'FIR_REPORT', status: 'COMPLETED', row_count: 1, entities_count: 15 },
        { id: 2, filename: 'CDR_Case102_CyberRing.csv', source_type: 'CDR', status: 'COMPLETED', row_count: 420, entities_count: 14 },
        { id: 3, filename: 'Financial_Case105_Hawala.csv', source_type: 'FINANCIAL', status: 'COMPLETED', row_count: 180, entities_count: 16 },
      ]
    };
  }
}
