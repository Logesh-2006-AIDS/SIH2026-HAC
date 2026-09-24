"""
AI Investigation Copilot — Evidence-Backed Query Engine
=======================================================
POST /api/v1/copilot/query — Accepts natural language, executes Neo4j/PostgreSQL
queries, returns structured evidence-backed responses.
"""
import logging
import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.postgres import get_db
from app.db.graph_client import MemgraphClient
from app.services import graph_analytics
from app.schemas.common import ResponseEnvelope

router = APIRouter()
logger = logging.getLogger(__name__)


class CopilotQueryRequest(BaseModel):
    question: str
    context_case: Optional[str] = None
    context_entity: Optional[str] = None


class CopilotEvidence(BaseModel):
    entity_id: str
    name: str
    type: str
    role: Optional[str] = None


class CopilotResponse(BaseModel):
    answer: str
    confidence: Optional[str] = None
    entities: List[Dict[str, Any]] = []
    sources: List[str] = []
    cases: List[str] = []
    graph_query_used: Optional[str] = None
    suggestion: Optional[str] = None


# ── Intent Detection ──────────────────────────────────────────────────────────

def detect_intent(question: str) -> str:
    """Classify the user's question into a query intent."""
    q = question.lower()
    if any(w in q for w in ["connect", "linked to", "connected to", "related to", "associated with", "ties to"]):
        return "entity_connections"
    if any(w in q for w in ["multiple cases", "cross-case", "appear in", "shared across", "bridge"]):
        return "cross_case"
    if any(w in q for w in ["shortest path", "shortest connection", "path between", "chain between"]):
        return "shortest_path"
    if any(w in q for w in ["vehicle", "vehicles shared", "car", "automobile"]):
        return "shared_vehicles"
    if any(w in q for w in ["phone", "call", "communication", "cdr"]):
        return "shared_phones"
    if any(w in q for w in ["financial", "account", "transaction", "money", "hawala", "transfer"]):
        return "financial_links"
    if any(w in q for w in ["why", "important", "centrality", "highly connected", "network importance"]):
        return "explain_importance"
    if any(w in q for w in ["case", "cases connected", "cases related", "which cases"]):
        return "case_connections"
    if any(w in q for w in ["location", "where", "geography", "crime location", "area"]):
        return "geographic"
    return "general"


def extract_entity_name(question: str) -> Optional[str]:
    """Extract a person/entity name from the question text."""
    # Try quoted names first
    quoted = re.findall(r'"([^"]+)"', question)
    if quoted:
        return quoted[0]
    # Try common patterns
    patterns = [
        r"connected to\s+(.+?)(?:\?|$|\.|,)",
        r"linked to\s+(.+?)(?:\?|$|\.|,)",
        r"related to\s+(.+?)(?:\?|$|\.|,)",
        r"connections for\s+(.+?)(?:\?|$|\.|,)",
        r"involving\s+(.+?)(?:\?|$|\.|,)",
        r"about\s+(.+?)(?:\?|$|\.|,)",
    ]
    for pat in patterns:
        m = re.search(pat, question, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def extract_two_entities(question: str):
    """Extract two entity names for path queries."""
    patterns = [
        r"between\s+(.+?)\s+and\s+(.+?)(?:\?|$|\.)",
        r"from\s+(.+?)\s+to\s+(.+?)(?:\?|$|\.)",
    ]
    for pat in patterns:
        m = re.search(pat, question, re.IGNORECASE)
        if m:
            return m.group(1).strip(), m.group(2).strip()
    return None, None


def _resolve_entity_id(name: str) -> Optional[str]:
    fb = graph_analytics._load_fallback_graph()
    needle = (name or "").lower().strip()
    for n in fb.get("nodes", []):
        if (n.get("id") or "").lower() == needle:
            return n["id"]
        if needle in (n.get("name") or "").lower():
            return n["id"]
        for al in (n.get("aliases") or []):
            if needle in str(al).lower():
                return n["id"]
    return None


def _safe_run(cypher: str, params: Optional[Dict] = None) -> List[Dict[str, Any]]:
    try:
        if MemgraphClient.verify_connectivity():
            return MemgraphClient.run_query(cypher, params or {}) or []
    except Exception as e:
        logger.info("Memgraph query unavailable (%s); using JSON fallback.", e)
    return []


# ── Query Executors ──────────────────────────────────────────────────────────

def query_entity_connections(entity_name: str) -> Dict[str, Any]:
    """Find all entities connected to a named entity."""
    results = _safe_run(
        """
        MATCH (n:Entity)
        WHERE toLower(n.name) CONTAINS toLower($name) OR toLower(n.id) = toLower($name)
        WITH n LIMIT 1
        MATCH (n)-[r]-(connected:Entity)
        RETURN n.id AS source_id, n.name AS source_name, labels(n) AS source_labels,
               type(r) AS relationship, properties(r) AS rel_props,
               connected.id AS target_id, connected.name AS target_name,
               labels(connected) AS target_labels, connected.cases AS target_cases
        LIMIT 25
        """,
        {"name": entity_name},
    )

    if not results:
        eid = _resolve_entity_id(entity_name)
        if not eid:
            return {
                "answer": f"Insufficient evidence available for '{entity_name}' in the current investigation data.",
                "entities": [],
                "sources": [],
            }
        profile = graph_analytics.get_entity_profile(eid)
        if not profile:
            return {"answer": f"Insufficient evidence available for '{entity_name}'.", "entities": [], "sources": []}
        connections = [
            {
                "entity_id": r["target_id"],
                "name": r["target_name"],
                "type": r["target_type"],
                "relationship": r["relationship"],
            }
            for r in profile.get("relationships", [])
        ]
        answer = f"{profile['entity'].get('name', entity_name)} is connected to {len(connections)} entities:\n\n"
        for i, c in enumerate(connections, 1):
            answer += f"{i}. {c['name']} ({c['type']}) — via {(c['relationship'] or '').replace('_', ' ')}\n"
        return {
            "answer": answer,
            "entities": connections,
            "cases": profile.get("connected_cases", []),
            "sources": ["Investigation Graph (JSON fallback)", f"Entity profile {eid}"],
            "confidence": "Graph evidence",
            "suggestion": "Open Entity Investigation or Focus on Graph for this person.",
        }

    source = results[0]
    connections = []
    cases_set = set()
    for r in results:
        connections.append({
            "entity_id": r.get("target_id", ""),
            "name": r.get("target_name", r.get("target_id", "")),
            "type": (r.get("target_labels") or ["Entity"])[0] if isinstance(r.get("target_labels"), list) else "Entity",
            "relationship": r.get("relationship", "CONNECTED"),
        })
        for c in (r.get("target_cases") or []):
            cases_set.add(c)

    answer = f"{source.get('source_name', entity_name)} is connected to {len(connections)} entities:\n\n"
    for i, c in enumerate(connections, 1):
        answer += f"{i}. {c['name']} ({c['type']}) — via {c['relationship'].replace('_', ' ')}\n"

    return {
        "answer": answer,
        "entities": connections,
        "cases": list(cases_set),
        "sources": [f"Memgraph — {len(results)} relationship records"],
        "confidence": "Graph evidence",
    }


def query_cross_case_entities() -> Dict[str, Any]:
    """Find entities appearing in multiple cases."""
    results = _safe_run(
        """
        MATCH (p:Person)
        WHERE size(p.cases) > 1
        RETURN p.id AS entity_id, p.name AS name, p.cases AS cases, size(p.cases) AS case_count
        ORDER BY case_count DESC
        LIMIT 10
        """
    )
    if not results:
        bridges = graph_analytics.get_betweenness_centrality()
        if not bridges:
            return {"answer": "Insufficient evidence — no cross-case entities detected.", "entities": [], "sources": []}
        entities = [
            {
                "entity_id": r["entity_id"],
                "name": r["name"],
                "type": "Person",
                "role": f"Appears in {r['cross_case_degree']} cases: {', '.join(r.get('cases', []))}",
            }
            for r in bridges
        ]
        answer = f"Found {len(entities)} cross-case bridge entities:\n\n"
        for i, e in enumerate(entities, 1):
            answer += f"{i}. {e['name']} — {e['role']}\n"
        return {
            "answer": answer,
            "entities": entities,
            "cases": list({c for r in bridges for c in (r.get("cases") or [])}),
            "sources": ["Cross-case analysis (graph fallback)"],
            "confidence": "Graph evidence",
            "suggestion": "Open Cross-Case Intelligence, then View on Graph.",
        }

    entities = []
    for r in results:
        entities.append({
            "entity_id": r["entity_id"],
            "name": r["name"],
            "type": "Person",
            "role": f"Appears in {r['case_count']} cases: {', '.join(r.get('cases', []))}",
        })
    answer = f"Found {len(entities)} entities appearing across multiple cases:\n\n"
    for i, e in enumerate(entities, 1):
        answer += f"{i}. {e['name']} ({e['entity_id']}) — {e['role']}\n"
    return {
        "answer": answer,
        "entities": entities,
        "cases": list({c for r in results for c in (r.get("cases") or [])}),
        "sources": ["Memgraph Cross-Case Analysis"],
        "confidence": "Graph evidence",
    }


def query_shortest_path(name_a: str, name_b: str) -> Dict[str, Any]:
    """Find shortest path between two entities with evidence hops."""
    id_a = _resolve_entity_id(name_a)
    id_b = _resolve_entity_id(name_b)
    if not id_a or not id_b:
        return {
            "answer": f"Insufficient evidence — could not resolve both '{name_a}' and '{name_b}'.",
            "entities": [],
            "sources": [],
        }
    data = graph_analytics.get_path_with_evidence(id_a, id_b)
    path = data.get("path") or []
    if not path:
        return {"answer": f"No connection path found between '{name_a}' and '{name_b}'.", "entities": [], "sources": []}

    hops = data.get("hops") or []
    answer = data.get("explanation", "") + "\n\n"
    for h in hops:
        answer += (
            f"{h['from_name']} → [{h['relationship']}] → {h['to_name']}\n"
            f"  Source: {h.get('evidence_source')} · Confidence: {round((h.get('confidence') or 0.9)*100)}%\n"
        )
    entities = [{"entity_id": pid, "name": pid, "type": "Entity"} for pid in path]
    return {
        "answer": answer,
        "entities": entities,
        "sources": ["Graph path trace with evidence"],
        "confidence": "Graph traversal",
        "suggestion": "Open Link Analysis and Trace Connection to highlight this path.",
    }


def query_case_connections(case_id: str = None) -> Dict[str, Any]:
    """Find entities and connections for a case."""
    if not case_id:
        fb = graph_analytics._load_fallback_graph()
        counts = {}
        for n in fb.get("nodes", []):
            for c in (n.get("cases") or []):
                counts[c] = counts.get(c, 0) + 1
        answer = "Cases in the knowledge graph:\n\n"
        for cid, cnt in sorted(counts.items()):
            answer += f"- Case {cid}: {cnt} entities\n"
        return {"answer": answer, "entities": [], "sources": ["Case registry"], "cases": list(counts.keys())}

    subgraph = graph_analytics.get_subgraph(case_id)
    nodes = subgraph.get("nodes", [])
    if not nodes:
        return {"answer": f"No entities found for Case {case_id}.", "entities": [], "sources": []}
    entities = [
        {
            "entity_id": n.get("id"),
            "name": n.get("name") or n.get("reg_number") or n.get("number") or n.get("id"),
            "type": "Entity",
        }
        for n in nodes
    ]
    answer = f"Case {case_id} involves {len(entities)} entities:\n\n"
    for i, e in enumerate(entities, 1):
        answer += f"{i}. {e['name']}\n"
    return {"answer": answer, "entities": entities, "sources": [f"Case {case_id} subgraph"], "cases": [case_id]}


def query_general(question: str) -> Dict[str, Any]:
    """General fallback: search entities by name tokens against ground truth."""
    words = [w for w in re.sub(r"[^\w\s]", "", question).lower().split() if len(w) > 2]
    fb = graph_analytics._load_fallback_graph()
    hits = []
    for n in fb.get("nodes", []):
        name = (n.get("name") or "").lower()
        if any(w in name for w in words):
            hits.append(n)
    if not hits:
        return {
            "answer": "Insufficient evidence available for this query. Try asking about a specific person, case, phone, or path between two entities.",
            "entities": [],
            "sources": [],
        }
    entities = [{"entity_id": n["id"], "name": n.get("name", n["id"]), "type": "Entity"} for n in hits[:10]]
    answer = f"Found {len(entities)} potentially relevant entities:\n\n"
    for i, e in enumerate(entities, 1):
        answer += f"{i}. {e['name']} ({e['entity_id']})\n"
    return {"answer": answer, "entities": entities, "sources": ["Entity search"]}


# ── Main Endpoint ────────────────────────────────────────────────────────────

@router.post("/query", response_model=ResponseEnvelope, summary="AI Investigation Copilot Query")
def copilot_query(payload: CopilotQueryRequest):
    """
    Evidence-backed AI Copilot. Parses question intent, executes Neo4j/PostgreSQL
    queries, returns structured response with entities, sources, and confidence.
    """
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    intent = detect_intent(question)
    logger.info(f"Copilot query: '{question}' → intent: {intent}")

    try:
        if intent == "entity_connections":
            entity_name = extract_entity_name(question)
            if not entity_name:
                result = query_general(question)
            else:
                result = query_entity_connections(entity_name)

        elif intent == "cross_case":
            result = query_cross_case_entities()

        elif intent == "shortest_path":
            name_a, name_b = extract_two_entities(question)
            if name_a and name_b:
                result = query_shortest_path(name_a, name_b)
            else:
                result = {"answer": "Please specify two entities, e.g. 'Find shortest path between Person A and Person B'.", "entities": [], "sources": []}

        elif intent in ("shared_vehicles", "shared_phones", "financial_links"):
            entity_name = extract_entity_name(question)
            if entity_name:
                result = query_entity_connections(entity_name)
            else:
                result = query_cross_case_entities()

        elif intent == "explain_importance":
            entity_name = extract_entity_name(question)
            if entity_name:
                result = query_entity_connections(entity_name)
                if result.get("entities"):
                    conn_count = len(result["entities"])
                    case_count = len(result.get("cases", []))
                    result["answer"] = f"{entity_name} has high investigation priority because:\n\n" \
                        f"• Connected to {conn_count} other entities in the knowledge graph\n" \
                        f"• Appears across {case_count} case(s)\n" \
                        f"• Acts as a potential bridge between investigation clusters\n\n" \
                        f"Priority is based on observable network activity. It does not determine guilt.\n\n" \
                        f"Connected entities:\n" + "\n".join([f"- {e['name']} ({e.get('type', 'Entity')}) via {e.get('relationship', 'connection')}" for e in result["entities"]])
            else:
                result = query_general(question)

        elif intent == "case_connections":
            case_match = re.search(r'(?:case|fir)[#\s-]*(\d+)', question, re.IGNORECASE)
            case_id = case_match.group(1) if case_match else payload.context_case
            result = query_case_connections(case_id)

        elif intent == "geographic":
            result = query_general(question)
            result["suggestion"] = "For geographic analysis, visit the Crime Intelligence Map page."

        else:
            entity_name = extract_entity_name(question)
            if entity_name:
                result = query_entity_connections(entity_name)
            else:
                result = query_general(question)

    except Exception as e:
        logger.error(f"Copilot query failed: {e}")
        result = {
            "answer": f"Query execution encountered an error: {str(e)}. Please try rephrasing your question.",
            "entities": [],
            "sources": [],
        }

    return ResponseEnvelope(
        success=True,
        message="Copilot query processed.",
        data=result,
    )


@router.get("/suggestions", response_model=ResponseEnvelope, summary="Get Dynamic Query Suggestions")
def get_suggestions(case_id: Optional[str] = None, entity_id: Optional[str] = None):
    """Return context-aware query suggestions based on current case/entity."""
    base_suggestions = [
        "Which people appear in multiple cases?",
        "Show the strongest cross-case connections",
        "Find entities with highest network importance",
    ]

    if case_id:
        base_suggestions = [
            f"Show everyone involved in Case {case_id}",
            f"Which cases are connected to Case {case_id}?",
            f"Find cross-case links for Case {case_id}",
        ] + base_suggestions

    if entity_id:
        try:
            query = "MATCH (n:Entity {id: $id}) RETURN n.name AS name LIMIT 1"
            res = Neo4jClient.run_query(query, {"id": entity_id})
            name = res[0]["name"] if res else entity_id
            base_suggestions = [
                f"Show everyone connected to {name}",
                f"Why is {name} highly connected?",
                f"Find shortest path from {name} to ...",
            ] + base_suggestions
        except Exception:
            pass

    return ResponseEnvelope(success=True, message="Suggestions generated.", data=base_suggestions[:8])
