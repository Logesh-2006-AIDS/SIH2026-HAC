"""
Phase 4: Knowledge Graph Builder
Seeds the Neo4j database using ground_truth JSON files from the synthetic dataset.
"""
import json
import logging
import os
from app.db.neo4j_client import Neo4jClient

logger = logging.getLogger(__name__)


def load_json_file(filepath: str) -> dict:
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def clear_graph():
    """Wipe the entire Neo4j database for a fresh seed."""
    logger.info("Clearing existing Neo4j graph...")
    query = "MATCH (n) DETACH DELETE n"
    Neo4jClient.run_query(query)


def seed_nodes(entities: dict):
    """Create nodes from the ground_truth_entities.json structure."""
    
    # 1. Persons
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
    Neo4jClient.run_query(person_query, {"persons": entities.get("persons", [])})
    logger.info(f"Seeded {len(entities.get('persons', []))} Person nodes.")

    # 2. Organizations
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
    Neo4jClient.run_query(org_query, {"orgs": entities.get("organizations", [])})
    logger.info(f"Seeded {len(entities.get('organizations', []))} Organization nodes.")

    # 3. Vehicles
    veh_query = """
    UNWIND $vehicles AS v
    MERGE (n:Vehicle:Entity {id: v.id})
    SET n.reg_number = v.plate,
        n.type = v.type,
        n.model = v.model,
        n.color = v.color,
        n.cases = v.cases
    """
    Neo4jClient.run_query(veh_query, {"vehicles": entities.get("vehicles", [])})

    # 4. Locations
    loc_query = """
    UNWIND $locations AS l
    MERGE (n:Location:Entity {id: l.id})
    SET n.name = l.name,
        n.lat = l.lat,
        n.lon = l.lon,
        n.cases = l.cases
    """
    Neo4jClient.run_query(loc_query, {"locations": entities.get("locations", [])})

    # 5. Financial Accounts
    acc_query = """
    UNWIND $accounts AS a
    MERGE (n:FinancialAccount:Entity {id: a.id})
    SET n.account_number = a.number,
        n.ifsc = a.ifsc,
        n.bank = a.bank,
        n.cases = a.cases
    """
    Neo4jClient.run_query(acc_query, {"accounts": entities.get("financial_accounts", [])})

    # 6. Phones
    phone_query = """
    UNWIND $phones AS ph
    MERGE (n:Phone:Entity {number: ph.number})
    SET n.registered = ph.registered,
        n.note = ph.note,
        n.id = "PH_" + ph.number
    """
    Neo4jClient.run_query(phone_query, {"phones": entities.get("phone_numbers", [])})
    
    # Optionally, link phones to persons if they are registered
    link_phone_query = """
    UNWIND $phones AS ph
    MATCH (n:Phone {number: ph.number})
    MATCH (p:Person {id: ph.person_id})
    MERGE (p)-[:OWNS_PHONE]->(n)
    """
    Neo4jClient.run_query(link_phone_query, {"phones": [ph for ph in entities.get("phone_numbers", []) if ph.get("person_id")]})


def seed_edges(graph: dict):
    """Create relationships from the ground_truth_graph.json structure."""
    edges = graph.get("edges", [])
    
    query = """
    UNWIND $edges AS e
    MATCH (source:Entity {id: e.from_id})
    MATCH (target:Entity {id: e.to_id})
    CALL apoc.create.relationship(source, e.relation, {
        source_case: e.source_case,
        confidence: e.confidence
    }, target) YIELD rel
    RETURN count(rel)
    """
    Neo4jClient.run_query(query, {"edges": edges})
    logger.info(f"Seeded {len(edges)} Relationships.")


def build_graph_from_synthetic_data(data_dir: str = None):
    """Main orchestrator for wiping and seeding the graph."""
    if not data_dir or not os.path.exists(data_dir):
        # Auto-discover data dir
        candidates = [
            os.path.join(os.getcwd(), "data"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data"),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data")),
            "d:/sih-2026/House-targaryen--2026/data",
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

    entities = load_json_file(entities_path)
    graph = load_json_file(graph_path)

    clear_graph()
    seed_nodes(entities)
    seed_edges(graph)
    
    # Return some basic stats
    return {
        "status": "success",
        "nodes": len(entities.get("persons", [])) + len(entities.get("organizations", [])) + 
                 len(entities.get("vehicles", [])) + len(entities.get("locations", [])) + 
                 len(entities.get("financial_accounts", [])) + len(entities.get("phone_numbers", [])),
        "edges": len(graph.get("edges", []))
    }
