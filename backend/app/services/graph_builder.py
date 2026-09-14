"""
Memgraph Knowledge Graph Builder
Seeds entities/relationships from ground_truth JSON using Memgraph-compatible Cypher.
No APOC — dynamic relationship types are applied via safe typed CREATE batches.
"""
import json
import logging
import os
import re
from collections import defaultdict

from app.db.neo4j_client import MemgraphClient

logger = logging.getLogger(__name__)

_SAFE_REL = re.compile(r"^[A-Z][A-Z0-9_]*$")


def load_json_file(filepath: str) -> dict:
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def clear_graph():
    logger.info("Clearing existing Memgraph graph...")
    MemgraphClient.run_query("MATCH (n) DETACH DELETE n")


def seed_nodes(entities: dict):
    person_query = """
    UNWIND $persons AS p
    MERGE (n:Person:Entity {id: p.id})
    SET n.name = p.name,
        n.aliases = p.aliases,
        n.phone = p.phone,
        n.phone2 = p.phone2,
        n.address = p.address,
        n.role = p.role,
        n.cases = p.cases
    """
    MemgraphClient.run_query(person_query, {"persons": entities.get("persons", [])})
    logger.info("Seeded %s Person nodes.", len(entities.get("persons", [])))

    org_query = """
    UNWIND $orgs AS o
    MERGE (n:Organization:Entity {id: o.id})
    SET n.name = o.name,
        n.alias = o.alias,
        n.reg = o.reg,
        n.address = o.address,
        n.type = o.type,
        n.cases = o.cases
    """
    MemgraphClient.run_query(org_query, {"orgs": entities.get("organizations", [])})

    veh_query = """
    UNWIND $vehicles AS v
    MERGE (n:Vehicle:Entity {id: v.id})
    SET n.reg_number = coalesce(v.plate, v.reg_number),
        n.type = v.type,
        n.model = v.model,
        n.color = v.color,
        n.cases = v.cases
    """
    MemgraphClient.run_query(veh_query, {"vehicles": entities.get("vehicles", [])})

    loc_query = """
    UNWIND $locations AS l
    MERGE (n:Location:Entity {id: l.id})
    SET n.name = l.name,
        n.lat = l.lat,
        n.lon = l.lon,
        n.cases = l.cases
    """
    MemgraphClient.run_query(loc_query, {"locations": entities.get("locations", [])})

    acc_query = """
    UNWIND $accounts AS a
    MERGE (n:FinancialAccount:Entity {id: a.id})
    SET n.account_number = coalesce(a.number, a.account_number),
        n.ifsc = a.ifsc,
        n.bank = a.bank,
        n.cases = a.cases
    """
    MemgraphClient.run_query(acc_query, {"accounts": entities.get("financial_accounts", [])})

    phone_query = """
    UNWIND $phones AS ph
    MERGE (n:Phone:Entity {id: ph.id})
    SET n.number = ph.number,
        n.registered = ph.registered,
        n.note = ph.note,
        n.cases = coalesce(ph.cases, [])
    """
    phones = []
    for ph in entities.get("phone_numbers", []):
        phones.append({
            **ph,
            "id": ph.get("id") or f"PH_{ph.get('number')}",
        })
    MemgraphClient.run_query(phone_query, {"phones": phones})

    # Case nodes
    case_ids = set()
    for group in entities.values():
        if isinstance(group, list):
            for item in group:
                for c in (item.get("cases") or []):
                    case_ids.add(str(c))
    if case_ids:
        MemgraphClient.run_query(
            """
            UNWIND $cases AS c
            MERGE (n:Case:Entity {id: c})
            SET n.case_number = c, n.name = 'Case ' + toString(c)
            """,
            {"cases": list(case_ids)},
        )
        # Link persons to cases
        MemgraphClient.run_query(
            """
            UNWIND $persons AS p
            MATCH (person:Person {id: p.id})
            UNWIND p.cases AS cid
            MATCH (c:Case {id: cid})
            MERGE (person)-[r:INVOLVED_IN]->(c)
            SET r.verification_status = 'VERIFIED', r.confidence = 1.0, r.source_case = cid
            """,
            {"persons": entities.get("persons", [])},
        )

    link_phone_query = """
    UNWIND $phones AS ph
    MATCH (n:Phone {id: ph.id})
    MATCH (p:Person {id: ph.person_id})
    MERGE (p)-[r:USES]->(n)
    SET r.verification_status = 'VERIFIED', r.confidence = 1.0
    """
    linked = [ph for ph in phones if ph.get("person_id")]
    if linked:
        MemgraphClient.run_query(link_phone_query, {"phones": linked})


def seed_edges(graph: dict):
    """Create relationships without APOC (Memgraph-compatible)."""
    edges = graph.get("edges", [])
    by_type = defaultdict(list)
    for e in edges:
        rel = (e.get("relation") or e.get("type") or "ASSOCIATED_WITH").upper().replace(" ", "_")
        if not _SAFE_REL.match(rel):
            rel = "ASSOCIATED_WITH"
        by_type[rel].append({
            "from_id": e.get("from_id") or e.get("source"),
            "to_id": e.get("to_id") or e.get("target"),
            "source_case": e.get("source_case"),
            "confidence": e.get("confidence", 0.9),
            "source_document": e.get("source_document") or f"FIR-{e.get('source_case', '')}",
            "verification_status": e.get("verification_status") or "AI_SUGGESTED",
        })

    for rel, batch in by_type.items():
        query = f"""
        UNWIND $edges AS e
        MATCH (source:Entity {{id: e.from_id}})
        MATCH (target:Entity {{id: e.to_id}})
        MERGE (source)-[r:{rel}]->(target)
        SET r.source_case = e.source_case,
            r.confidence = e.confidence,
            r.source_document = e.source_document,
            r.verification_status = e.verification_status
        """
        MemgraphClient.run_query(query, {"edges": batch})
        logger.info("Seeded %s %s relationships.", len(batch), rel)


def build_graph_from_synthetic_data(data_dir: str = None):
    if not data_dir or not os.path.exists(data_dir):
        candidates = [
            os.path.join(os.getcwd(), "data"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data"),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data")),
        ]
        for c in candidates:
            if os.path.exists(os.path.join(c, "metadata", "ground_truth_entities.json")):
                data_dir = c
                break

    if not data_dir:
        raise FileNotFoundError("Could not locate data directory containing synthetic datasets.")

    metadata_dir = os.path.join(data_dir, "metadata")
    entities_path = os.path.join(metadata_dir, "ground_truth_entities.json")
    graph_path = os.path.join(metadata_dir, "ground_truth_graph.json")

    if not os.path.exists(entities_path) or not os.path.exists(graph_path):
        raise FileNotFoundError(f"Synthetic data JSON files not found in {metadata_dir}")

    if not MemgraphClient.verify_connectivity():
        logger.warning("Memgraph unreachable — seed skipped; JSON fallback remains active.")
        entities = load_json_file(entities_path)
        graph = load_json_file(graph_path)
        return {
            "status": "fallback",
            "message": "Memgraph not running. Serving ground_truth JSON via FastAPI.",
            "nodes": len(entities.get("persons", [])) + len(entities.get("organizations", []))
                     + len(entities.get("vehicles", [])) + len(entities.get("locations", []))
                     + len(entities.get("financial_accounts", [])) + len(entities.get("phone_numbers", [])),
            "edges": len(graph.get("edges", [])),
        }

    entities = load_json_file(entities_path)
    graph = load_json_file(graph_path)

    clear_graph()
    seed_nodes(entities)
    seed_edges(graph)

    return {
        "status": "success",
        "nodes": len(entities.get("persons", [])) + len(entities.get("organizations", []))
                 + len(entities.get("vehicles", [])) + len(entities.get("locations", []))
                 + len(entities.get("financial_accounts", [])) + len(entities.get("phone_numbers", [])),
        "edges": len(graph.get("edges", [])),
    }
