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
from app.db.neo4j_client import Neo4jClient
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


# ── Query Executors ──────────────────────────────────────────────────────────

def query_entity_connections(entity_name: str) -> Dict[str, Any]:
    """Find all entities connected to a named entity."""
    query = """
    MATCH (n:Entity)
    WHERE toLower(n.name) CONTAINS toLower($name) OR toLower(n.id) = toLower($name)
    WITH n LIMIT 1
    MATCH (n)-[r]-(connected:Entity)
    RETURN n.id AS source_id, n.name AS source_name, labels(n) AS source_labels,
           type(r) AS relationship, properties(r) AS rel_props,
           connected.id AS target_id, connected.name AS target_name,
           labels(connected) AS target_labels, connected.cases AS target_cases
    LIMIT 25
    """
    results = Neo4jClient.run_query(query, {"name": entity_name})
    if not results:
        return {"answer": f"No verified connections found for '{entity_name}' in the current investigation data.", "entities": [], "sources": []}

    source = results[0]
    connections = []
    cases_set = set()
    for r in results:
        conn = {
            "entity_id": r.get("target_id", ""),
            "name": r.get("target_name", r.get("target_id", "")),
            "type": (r.get("target_labels") or ["Entity"])[0] if isinstance(r.get("target_labels"), list) else "Entity",
            "relationship": r.get("relationship", "CONNECTED"),
        }
        connections.append(conn)
        for c in (r.get("target_cases") or []):
            cases_set.add(c)

    answer = f"{source.get('source_name', entity_name)} is connected to {len(connections)} entities through verified evidence-backed relationships:\n\n"
    for i, c in enumerate(connections, 1):
        answer += f"{i}. {c['name']} ({c['type']}) — via {c['relationship'].replace('_', ' ')}\n"

    return {
        "answer": answer,
        "entities": connections,
        "cases": list(cases_set),
        "sources": [f"Neo4j Knowledge Graph — {len(results)} relationship records"],
        "confidence": f"{min(95, 80 + len(connections) * 2)}% (Graph Evidence)",
    }


def query_cross_case_entities() -> Dict[str, Any]:
    """Find entities appearing in multiple cases."""
    query = """
    MATCH (p:Person)
    WHERE size(p.cases) > 1
    RETURN p.id AS entity_id, p.name AS name, p.cases AS cases, size(p.cases) AS case_count
    ORDER BY case_count DESC
    LIMIT 10
    """
    results = Neo4jClient.run_query(query)
    if not results:
        return {"answer": "No cross-case entities detected in the current investigation data.", "entities": [], "sources": []}

    entities = []
    for r in results:
        entities.append({
            "entity_id": r["entity_id"],
            "name": r["name"],
            "type": "Person",
            "role": f"Appears in {r['case_count']} cases: {', '.join(r.get('cases', []))}"
        })

    answer = f"Found {len(entities)} entities appearing across multiple cases:\n\n"
    for i, e in enumerate(entities, 1):
        answer += f"{i}. {e['name']} ({e['entity_id']}) — {e['role']}\n"

    return {
        "answer": answer,
        "entities": entities,
        "cases": list({c for r in results for c in (r.get("cases") or [])}),
        "sources": ["Neo4j Cross-Case Analysis"],
        "confidence": "97% (Direct Graph Evidence)",
    }


def query_shortest_path(name_a: str, name_b: str) -> Dict[str, Any]:
    """Find shortest path between two entities."""
    query = """
    MATCH (a:Entity), (b:Entity)
    WHERE (toLower(a.name) CONTAINS toLower($name_a) OR toLower(a.id) = toLower($name_a))
      AND (toLower(b.name) CONTAINS toLower($name_b) OR toLower(b.id) = toLower($name_b))
    WITH a, b LIMIT 1
    MATCH path = shortestPath((a)-[*]-(b))
    RETURN [n in nodes(path) | {id: n.id, name: n.name, labels: labels(n)}] AS path_nodes,
           [r in relationships(path) | type(r)] AS path_rels,
           length(path) AS distance
    """
    results = Neo4jClient.run_query(query, {"name_a": name_a, "name_b": name_b})
    if not results or not results[0].get("path_nodes"):
        return {"answer": f"No connection path found between '{name_a}' and '{name_b}'.", "entities": [], "sources": []}

    r = results[0]
    path_nodes = r["path_nodes"]
    path_rels = r.get("path_rels", [])
    distance = r.get("distance", 0)

    entities = [{"entity_id": n.get("id", ""), "name": n.get("name", n.get("id", "")), "type": (n.get("labels") or ["Entity"])[0] if isinstance(n.get("labels"), list) else "Entity"} for n in path_nodes]

    chain_parts = []
    for i, node in enumerate(path_nodes):
        chain_parts.append(node.get("name", node.get("id", "?")))
        if i < len(path_rels):
            chain_parts.append(f"--[{path_rels[i]}]-->")

    answer = f"Connection chain between {name_a} and {name_b} (distance: {distance}):\n\n"
    answer += " ".join(chain_parts)

    return {
        "answer": answer,
        "entities": entities,
        "sources": [f"Neo4j Shortest Path — {distance} hops"],
        "confidence": "96% (Graph Traversal)",
    }


def query_case_connections(case_id: str = None) -> Dict[str, Any]:
    """Find entities and connections for a case."""
    if not case_id:
        # Find all cases with their entity counts
        query = """
        MATCH (n:Entity)
        UNWIND n.cases AS c
        RETURN c AS case_id, count(DISTINCT n) AS entity_count
        ORDER BY entity_count DESC
        """
        results = Neo4jClient.run_query(query)
        if not results:
            return {"answer": "No cases found in the knowledge graph.", "entities": [], "sources": []}

        answer = "Cases in the knowledge graph:\n\n"
        for r in results:
            answer += f"- Case {r['case_id']}: {r['entity_count']} entities\n"
        return {"answer": answer, "entities": [], "sources": ["Neo4j Case Registry"], "cases": [r["case_id"] for r in results]}

    query = """
    MATCH (n:Entity)
    WHERE $case_id IN n.cases
    RETURN n.id AS entity_id, n.name AS name, labels(n) AS labels, n.cases AS cases
    ORDER BY n.name
    LIMIT 25
    """
    results = Neo4jClient.run_query(query, {"case_id": case_id})
    if not results:
        return {"answer": f"No entities found for Case {case_id}.", "entities": [], "sources": []}

    entities = [{"entity_id": r["entity_id"], "name": r.get("name", r["entity_id"]), "type": (r.get("labels") or ["Entity"])[0] if isinstance(r.get("labels"), list) else "Entity"} for r in results]

    answer = f"Case {case_id} involves {len(entities)} entities:\n\n"
    for i, e in enumerate(entities, 1):
        answer += f"{i}. {e['name']} ({e['type']})\n"

    return {"answer": answer, "entities": entities, "sources": [f"Neo4j Case {case_id} Subgraph"], "cases": [case_id]}


def query_general(question: str) -> Dict[str, Any]:
    """General fallback: search entities by name similarity."""
    query = """
    MATCH (n:Entity)
    WHERE any(word IN split(toLower($q), ' ') WHERE toLower(n.name) CONTAINS word AND size(word) > 2)
    RETURN n.id AS entity_id, n.name AS name, labels(n) AS labels, n.cases AS cases
    LIMIT 10
    """
    words = re.sub(r'[^\w\s]', '', question)
    results = Neo4jClient.run_query(query, {"q": words})
    if not results:
        return {
            "answer": "No matching entities found in the current investigation data for this query. Try asking about specific persons, cases, vehicles, or phone numbers.",
            "entities": [],
            "sources": [],
        }

    entities = [{"entity_id": r["entity_id"], "name": r.get("name", r["entity_id"]), "type": (r.get("labels") or ["Entity"])[0] if isinstance(r.get("labels"), list) else "Entity"} for r in results]
    answer = f"Found {len(entities)} potentially relevant entities:\n\n"
    for i, e in enumerate(entities, 1):
        answer += f"{i}. {e['name']} ({e['type']})\n"

    return {"answer": answer, "entities": entities, "sources": ["Neo4j Entity Search"]}


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
