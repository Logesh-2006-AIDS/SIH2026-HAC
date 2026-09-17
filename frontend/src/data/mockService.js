/**
 * SIH26189 — Mock Service Layer
 * Replaces all axios/API calls with local mock data.
 * Functions return promises with realistic async delays.
 */

import {
  PERSONS, PHONES, ORGANIZATIONS, ACCOUNTS, VEHICLES, LOCATIONS,
  RELATIONSHIPS, CASES, TIMELINE_EVENTS, SUSPICIOUS_PATTERNS,
  INVESTIGATION_LEADS, NLP_ENTITIES, ENTITY_RESOLUTIONS,
  CDR_DATA, FINANCIAL_TRANSACTIONS, COPILOT_QA, KEY_ENTITIES_ANALYTICS,
  PREDEFINED_PATHS, FIR_TEXT, ADMIN_DATA, ANALYST_DATA,
} from './mockData.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Build a lookup map for all entities
const ALL_ENTITIES = [
  ...PERSONS.map(p => ({ ...p, entityType: 'Person', label: p.name })),
  ...PHONES.map(p => ({ ...p, entityType: 'Phone', label: p.number })),
  ...ORGANIZATIONS.map(o => ({ ...o, entityType: 'Organization', label: o.name })),
  ...ACCOUNTS.map(a => ({ ...a, entityType: 'FinancialAccount', label: a.account_number })),
  ...VEHICLES.map(v => ({ ...v, entityType: 'Vehicle', label: v.reg_number })),
  ...LOCATIONS.map(l => ({ ...l, entityType: 'Location', label: l.name })),
];

const ENTITY_MAP = Object.fromEntries(ALL_ENTITIES.map(e => [e.id, e]));

// Convert entities to graph nodes
function entityToNode(entity) {
  const typeMap = {
    Person: 'Person', Phone: 'Phone', Organization: 'Organization',
    FinancialAccount: 'FinancialAccount', Vehicle: 'Vehicle', Location: 'Location',
  };
  const type = entity.entityType || typeMap[entity.type] || 'Entity';
  return {
    id: entity.id,
    name: entity.name || entity.number || entity.account_number || entity.reg_number || entity.id,
    type,
    label: entity.label || entity.name || entity.id,
    role: entity.role || '',
    cases: entity.cases || [],
    confidence: entity.confidence || 0.9,
    raw: entity,
    // For Cytoscape compatibility
    number: entity.number,
    account_number: entity.account_number,
    reg_number: entity.reg_number,
    lat: entity.lat,
    lon: entity.lon,
  };
}

// Get nodes for a case
function getNodesForCase(caseId) {
  const caseNum = caseId?.replace('CASE-', '') || '';
  const caseObj = CASES.find(c => c.case_number === caseNum || c.case_number === caseId);
  if (!caseObj) return ALL_ENTITIES.map(entityToNode);
  return caseObj.entities
    .map(id => ENTITY_MAP[id])
    .filter(Boolean)
    .map(entityToNode);
}

// Get edges for a case
function getEdgesForCase(caseId) {
  const caseLabel = `CASE-${caseId?.replace('CASE-', '')}`;
  return RELATIONSHIPS
    .filter(r => r.case_refs?.some(c => c === caseLabel || c === caseId))
    .map(r => ({
      id: r.id,
      source: r.source,
      target: r.target,
      type: r.type,
      relation: r.type,
      properties: {
        confidence: r.confidence,
        source_case: r.case_refs?.[0] || caseId,
        evidence: r.evidence,
      },
      confidence: r.confidence,
      source_case: r.case_refs?.[0] || caseId,
    }));
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

export async function getCases() {
  await delay(300);
  return {
    success: true,
    data: CASES.map(c => ({
      case_number: c.case_number,
      title: c.title,
      crime_category: c.crime_category,
      status: c.status,
      jurisdiction: c.jurisdiction,
      incident_date: c.incident_date,
    })),
  };
}

export async function getCaseSummary(caseId) {
  await delay(200);
  const caseNum = caseId?.replace('CASE-', '') || '';
  const caseObj = CASES.find(c => c.case_number === caseNum || c.case_number === caseId);
  if (!caseObj) return { success: false, data: null };

  const nodes = getNodesForCase(caseId);
  const edges = getEdgesForCase(caseId);
  const crossLinks = getCrossLinksSync(caseId);

  return {
    success: true,
    data: {
      dossier: {
        title: caseObj.title,
        crime_category: caseObj.crime_category,
        status: caseObj.status,
        jurisdiction: caseObj.jurisdiction,
        incident_date: caseObj.incident_date,
        summary: caseObj.summary,
        accused: caseObj.accused,
      },
      graph_entities: nodes,
      graph_relations: edges,
      entity_count: nodes.length,
      connection_count: edges.length,
      cross_case_count: crossLinks.length,
      lead_count: INVESTIGATION_LEADS.filter(l => l.cases.some(c => c === `CASE-${caseNum}`)).length,
    },
  };
}

export async function getSubgraph(caseId, entityId, hops = 1) {
  await delay(400);
  let nodes = getNodesForCase(caseId);
  let edges = getEdgesForCase(caseId);

  if (entityId) {
    // Focus mode: find connected entities
    const directEdges = RELATIONSHIPS.filter(
      r => r.source === entityId || r.target === entityId
    );
    const directIds = new Set([entityId]);
    directEdges.forEach(r => { directIds.add(r.source); directIds.add(r.target); });

    if (hops >= 2) {
      // Second hop
      const secondEdges = RELATIONSHIPS.filter(
        r => directIds.has(r.source) || directIds.has(r.target)
      );
      secondEdges.forEach(r => { directIds.add(r.source); directIds.add(r.target); });
    }

    nodes = ALL_ENTITIES
      .filter(e => directIds.has(e.id))
      .map(entityToNode);

    edges = RELATIONSHIPS
      .filter(r => directIds.has(r.source) && directIds.has(r.target))
      .map(r => ({
        id: r.id, source: r.source, target: r.target,
        type: r.type, relation: r.type,
        properties: { confidence: r.confidence, source_case: r.case_refs?.[0] || caseId, evidence: r.evidence },
        confidence: r.confidence,
      }));
  }

  return { success: true, data: { nodes, edges } };
}

export async function getEntityProfile(entityId) {
  await delay(200);
  const entity = ENTITY_MAP[entityId];
  if (!entity) return { success: false, data: null };

  const rels = RELATIONSHIPS.filter(r => r.source === entityId || r.target === entityId);
  const connectedIds = new Set(rels.flatMap(r => [r.source, r.target]).filter(id => id !== entityId));
  const connections = Array.from(connectedIds).map(id => {
    const e = ENTITY_MAP[id];
    const rel = rels.find(r => r.source === id || r.target === id);
    return { entity_id: id, name: e?.name || e?.number || e?.account_number || id, type: e?.entityType || 'Entity', relationship: rel?.type };
  });

  return {
    success: true,
    data: {
      entity: {
        ...entity,
        id: entity.id,
        name: entity.name || entity.number || entity.account_number || entity.id,
        type: entity.entityType,
        connections,
        relationships: rels,
        evidence_count: rels.length,
      },
    },
  };
}

export async function getTimeline(caseId) {
  await delay(250);
  const caseNum = caseId?.replace('CASE-', '') || caseId;
  const events = TIMELINE_EVENTS[caseNum] || [];
  return { success: true, data: { events } };
}

export const getCaseTimeline = getTimeline;
export const getCaseDetail = getCaseSummary;

function getCrossLinksSync(caseId) {
  const caseLabel = `CASE-${caseId?.replace('CASE-', '')}`;
  const caseNum = caseId?.replace('CASE-', '') || caseId;
  const caseObj = CASES.find(c => c.case_number === caseNum);
  if (!caseObj) return [];

  const sharedEntities = [];
  ALL_ENTITIES.forEach(entity => {
    if (!entity.cases || entity.cases.length < 2) return;
    if (!entity.cases.includes(caseLabel)) return;
    const otherCases = entity.cases.filter(c => c !== caseLabel);
    if (otherCases.length === 0) return;
    sharedEntities.push({
      entity_id: entity.id,
      name: entity.name || entity.number || entity.account_number || entity.id,
      type: entity.entityType,
      shared_cases: otherCases,
      total_cases: entity.cases.length,
      evidence: `Appears in ${entity.cases.join(', ')} based on CDR/FIR/financial records.`,
      why_matters: `${entity.name || entity.id} is a confirmed cross-case entity appearing in ${entity.cases.length} active investigations, indicating a shared criminal network.`,
    });
  });
  return sharedEntities;
}

export async function getCrossLinks(caseId) {
  await delay(300);
  const links = getCrossLinksSync(caseId);
  return { success: true, data: { links } };
}

export async function getCaseBrief(caseId) {
  await delay(350);
  const caseNum = caseId?.replace('CASE-', '') || caseId;
  const caseObj = CASES.find(c => c.case_number === caseNum);
  if (!caseObj) return { success: false, data: null };

  const nodes = getNodesForCase(caseId);
  const edges = getEdgesForCase(caseId);
  const crossLinks = getCrossLinksSync(caseId);
  const leads = INVESTIGATION_LEADS.filter(l => l.cases.some(c => c === `CASE-${caseNum}`));

  return {
    success: true,
    data: {
      key_entities: {
        persons: nodes.filter(n => n.type === 'Person').map(n => ({ name: n.name, entity_id: n.id, role: n.role })),
      },
      network_overview: { total_entities: nodes.length, total_relationships: edges.length },
      cross_case_connections: {
        shared_entities: crossLinks.map(l => ({ name: l.name, cases: [caseId, ...l.shared_cases] })),
      },
      ai_suggested_leads: leads.map(l => ({
        entity: l.entity_a,
        reason: l.reason,
        status: l.status,
        confidence: l.confidence,
      })),
    },
  };
}

export async function findShortestPath(sourceId, targetId) {
  await delay(500);
  const key1 = `${sourceId}__${targetId}`;
  const key2 = `${targetId}__${sourceId}`;
  const pathData = PREDEFINED_PATHS[key1] || PREDEFINED_PATHS[key2];

  if (pathData) {
    return {
      success: true,
      data: {
        path: pathData.path,
        hops: pathData.hops,
        explanation: pathData.explanation,
        hop_count: pathData.hops.length,
      },
    };
  }

  // Generic BFS fallback
  const adjMap = {};
  RELATIONSHIPS.forEach(r => {
    if (!adjMap[r.source]) adjMap[r.source] = [];
    if (!adjMap[r.target]) adjMap[r.target] = [];
    adjMap[r.source].push({ id: r.target, rel: r });
    adjMap[r.target].push({ id: r.source, rel: r });
  });

  const visited = new Set();
  const queue = [[sourceId, [sourceId], []]];
  while (queue.length) {
    const [curr, path, rels] = queue.shift();
    if (curr === targetId) {
      const hops = rels.map((r, i) => {
        const src = ENTITY_MAP[path[i]];
        const tgt = ENTITY_MAP[path[i + 1]];
        return {
          from_id: path[i], to_id: path[i + 1],
          from_name: src?.name || src?.number || path[i],
          to_name: tgt?.name || tgt?.number || path[i + 1],
          relationship: r.type, evidence: r.evidence,
          case_ref: r.case_refs?.[0] || 'CASE-101', timestamp: '2026-03-16', confidence: r.confidence,
        };
      });
      const srcName = ENTITY_MAP[sourceId]?.name || sourceId;
      const tgtName = ENTITY_MAP[targetId]?.name || targetId;
      return {
        success: true,
        data: {
          path, hops,
          explanation: `${srcName} connects to ${tgtName} through a ${hops.length}-hop network path, confirmed by investigation evidence across ${[...new Set(rels.flatMap(r => r.case_refs || []))].join(', ')}.`,
          hop_count: hops.length,
        },
      };
    }
    if (visited.has(curr)) continue;
    visited.add(curr);
    for (const neighbor of (adjMap[curr] || [])) {
      if (!visited.has(neighbor.id)) {
        queue.push([neighbor.id, [...path, neighbor.id], [...rels, neighbor.rel]]);
      }
    }
  }
  return { success: false, data: { path: [], hops: [], explanation: 'No connection found between these entities.' } };
}

export async function getPendingLeads() {
  await delay(300);
  return { success: true, data: { leads: INVESTIGATION_LEADS } };
}

export async function getPatterns(caseId) {
  await delay(350);
  const filtered = caseId
    ? SUSPICIOUS_PATTERNS.filter(p => p.cases.some(c => c === caseId || c === `CASE-${caseId?.replace('CASE-', '')}`))
    : SUSPICIOUS_PATTERNS;
  return { success: true, data: { patterns: filtered.length ? filtered : SUSPICIOUS_PATTERNS } };
}

export async function getCentrality() {
  await delay(300);
  return { success: true, data: KEY_ENTITIES_ANALYTICS };
}

export async function getCopilotAnswer(question, caseId, entityId) {
  await delay(600 + Math.random() * 400);
  const q = question.toLowerCase();

  const match = COPILOT_QA.find(qa => qa.keywords.some(kw => q.includes(kw)));
  if (match) {
    return {
      success: true,
      data: {
        answer: match.answer,
        entities: match.entities.map(id => ({
          entity_id: id, name: ENTITY_MAP[id]?.name || ENTITY_MAP[id]?.number || id,
          type: ENTITY_MAP[id]?.entityType || 'Entity', relationship: '',
        })),
        cases: match.cases,
        confidence: match.confidence,
        sources: match.sources,
      },
    };
  }

  // Fallback
  return {
    success: true,
    data: {
      answer: `Based on the investigation dataset for ${caseId || 'the active cases'}, the query relates to the criminal network centered around Ravi Kumar (PERSON-001) and his associates. The network spans CASE-101 (Drug Trafficking), CASE-102 (Hawala Money Laundering), and CASE-103 (Arms Smuggling). Please try a more specific query such as: "How is Ravi Kumar connected to CASE-103?" or "Show suspicious financial activity."`,
      entities: [{ entity_id: 'PERSON-001', name: 'Ravi Kumar', type: 'Person', relationship: '' }],
      cases: ['CASE-101', 'CASE-102', 'CASE-103'],
      confidence: '72%',
      sources: ['AI-ANALYSIS'],
    },
  };
}

export async function getCopilotSuggestions(caseId, entityId) {
  await delay(100);
  const suggestions = [
    'How is Ravi Kumar connected to Case-103?',
    'Show suspicious financial activity.',
    'Find entities shared across cases.',
    'Why is Ravi Kumar a key entity?',
    'What evidence connects Ravi Kumar and Arun Selvam?',
    'Show the shortest connection between Ravi Kumar and Organization ABC.',
  ];
  return { success: true, data: suggestions };
}

export async function getIngestionResult(sourceType) {
  await delay(200);
  const results = {
    fir: { filename: 'FIR_Operation_Coastal_Wind.txt', source_type: 'FIR Report', rows_processed: 1, entities_extracted: 14, relationships_discovered: 8 },
    cdr: { filename: 'CDR_Records_March2026.csv', source_type: 'CDR / Call Detail Records', rows_processed: 847, entities_extracted: 6, relationships_discovered: 6 },
    financial: { filename: 'Financial_Transactions_Q1_2026.csv', source_type: 'Financial Transactions', rows_processed: 234, entities_extracted: 5, relationships_discovered: 4 },
    intelligence: { filename: 'Intelligence_Brief_CASE101.json', source_type: 'Intelligence Report', rows_processed: 1, entities_extracted: 9, relationships_discovered: 11 },
  };
  return { success: true, data: results[sourceType] || results.fir };
}

export async function getNLPData() {
  await delay(200);
  return {
    success: true,
    data: {
      fir_text: FIR_TEXT,
      entities: NLP_ENTITIES,
      entity_resolutions: ENTITY_RESOLUTIONS,
    },
  };
}

export async function getCrossCaseMatrix() {
  await delay(150);
  return {
    success: true,
    data: [
      {
        case_a: 'CASE-101',
        case_b: 'CASE-102',
        shared_persons: ['Ravi Kumar', 'Arun Selvam'],
        shared_phones: ['+91-9876543210 (PHONE-001)'],
        shared_accounts: ['Account-204', 'Account-319'],
        strength: 'CRITICAL',
        score: '98%',
      },
      {
        case_a: 'CASE-101',
        case_b: 'CASE-103',
        shared_persons: ['Ravi Kumar', 'Vikram Nair'],
        shared_phones: ['+91-9876543210 (PHONE-001)'],
        shared_accounts: ['Account-204'],
        strength: 'STRONG',
        score: '91%',
      },
      {
        case_a: 'CASE-102',
        case_b: 'CASE-103',
        shared_persons: ['Ravi Kumar', 'Meena Krishnan'],
        shared_phones: ['+91-9876543210 (PHONE-001)', '+91-9345678901 (PHONE-003)'],
        shared_accounts: ['Account-204'],
        strength: 'STRONG',
        score: '93%',
      },
    ],
  };
}

export async function getIngestionStats() {
  await delay(100);
  return {
    success: true,
    data: {
      sources_count: 4,
      entities_resolved: 24,
      edges_created: 38,
      cross_case_links: 3,
      patterns_detected: 6,
    },
  };
}

export async function getAdminData() {
  await delay(120);
  return { success: true, data: ADMIN_DATA };
}

export async function getAnalystData() {
  await delay(150);
  return { success: true, data: ANALYST_DATA };
}

export function getAllEntities() {
  return ALL_ENTITIES;
}

export function getEntityById(id) {
  return ENTITY_MAP[id] || null;
}

export function getAllCases() {
  return CASES;
}

export function getEntityMapForGraph() {
  return ENTITY_MAP;
}

export default {
  getCases, getCaseSummary, getSubgraph, getEntityProfile,
  getTimeline, getCrossLinks, getCaseBrief, findShortestPath,
  getPendingLeads, getPatterns, getCentrality,
  getCopilotAnswer, getCopilotSuggestions,
  getIngestionResult, getIngestionStats, getNLPData, getCrossCaseMatrix,
  getAdminData, getAnalystData,
  getAllEntities, getEntityById, getAllCases, getEntityMapForGraph,
};
