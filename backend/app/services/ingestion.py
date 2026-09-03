"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Universal Dataset Ingestion & FIR Document Processing Service
"""
import os
import csv
import hashlib
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.neo4j_client import neo4j_client
from app.models.models import CaseFile, ExtractedEntityRecord, ExtractedRelationRecord, AuditLog
from app.nlp.pipeline import nlp_engine

class IngestionService:
    """
    Handles:
    1. Local storage of uploaded FIR files + SHA256 hashing
    2. End-to-end NLP extraction on uploaded files
    3. Population of Relational DB + Neo4j Knowledge Graph
    4. Universal CSV loader for the 9 SIH Investigation dataset files
    """

    def compute_sha256(self, file_bytes: bytes) -> str:
        return hashlib.sha256(file_bytes).hexdigest()

    def process_and_save_fir(
        self,
        db: Session,
        filename: str,
        file_bytes: bytes,
        uploaded_by: str = "Investigator",
        fir_number: str = "",
        title: str = ""
    ) -> Dict[str, Any]:
        file_hash = self.compute_sha256(file_bytes)
        timestamp_str = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        safe_filename = f"{timestamp_str}_{filename.replace(' ', '_')}"
        local_file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

        # 1. Store file locally
        with open(local_file_path, "wb") as f:
            f.write(file_bytes)

        # 2. Extract Raw Text (handles TXT, CSV, and PDF text)
        raw_text = ""
        ext = os.path.splitext(filename)[1].lower()
        if ext in [".txt", ".log", ".json", ".csv"]:
            try:
                raw_text = file_bytes.decode("utf-8", errors="ignore")
            except Exception:
                raw_text = str(file_bytes)
        elif ext == ".pdf":
            try:
                # Try pypdf or pdfplumber if available
                import io
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(file_bytes))
                pages_text = [page.extract_text() or "" for page in reader.pages]
                raw_text = "\n".join(pages_text)
            except Exception:
                raw_text = file_bytes.decode("latin-1", errors="ignore")
        else:
            raw_text = file_bytes.decode("utf-8", errors="ignore")

        # 3. Generate Case ID
        case_id = f"CASE-{datetime.utcnow().strftime('%Y')}-{timestamp_str[-6:]}"
        case_title = title or f"Investigation {fir_number or filename}"

        # 4. Run Core NLP Engine
        nlp_result = nlp_engine.process_text(raw_text, case_id=case_id)

        # 5. Persist Case in Relational Database
        case_file = CaseFile(
            case_id=case_id,
            title=case_title,
            fir_number=fir_number or nlp_result["summary"].get("fir_number", ""),
            police_station="Delhi Crime Branch",
            state="Delhi",
            original_filename=filename,
            file_path=local_file_path,
            file_hash_sha256=file_hash,
            file_size_bytes=len(file_bytes),
            raw_text=raw_text,
            summary_text=json.dumps(nlp_result["summary"]),
            status="PROCESSED",
            uploaded_by=uploaded_by
        )
        db.add(case_file)

        # Persist extracted entities in DB
        for ent in nlp_result["entities"]:
            db_ent = ExtractedEntityRecord(
                case_id=case_id,
                text=ent["text"],
                normalized=ent.get("normalized", ent["text"]),
                label=ent["label"],
                confidence=ent.get("confidence", 0.90),
                extractor=ent.get("extractor", "NLP_HYBRID")
            )
            db.add(db_ent)

        # Persist extracted relationships in DB
        for rel in nlp_result["relationships"]:
            db_rel = ExtractedRelationRecord(
                case_id=case_id,
                source=rel["source"],
                source_type=rel.get("source_type", "Entity"),
                relation=rel["relation"],
                target=rel["target"],
                target_type=rel.get("target_type", "Entity"),
                confidence=rel.get("confidence", 0.90),
                evidence_sentence=rel.get("evidence", "")
            )
            db.add(db_rel)

        # Audit Log
        audit = AuditLog(
            username=uploaded_by,
            role="investigator",
            action="UPLOAD_FIR",
            resource=f"Case ID: {case_id} | File: {filename}"
        )
        db.add(audit)
        db.commit()

        # 6. Commit to Neo4j Knowledge Graph
        # Add FIR Case Node
        neo4j_client.add_node(case_id, "FIR_RECORD", {
            "name": case_title,
            "fir_number": fir_number,
            "status": "ACTIVE",
            "file_hash": file_hash,
            "date": datetime.utcnow().strftime("%Y-%m-%d")
        })

        # Add Resolved Entity Nodes
        for cluster in nlp_result["resolved_clusters"]:
            c_name = cluster["canonical_name"]
            c_label = cluster["label"]
            neo4j_client.add_node(c_name, c_label, {
                "name": c_name,
                "aliases": cluster.get("aliases", []),
                "confidence": cluster.get("confidence", 0.90),
                "rationale": cluster.get("rationale", "")
            })

        # Add Relationships
        for rel in nlp_result["relationships"]:
            neo4j_client.add_relationship(
                source_id=rel["source"],
                source_label=rel.get("source_type", "Entity"),
                rel_type=rel["relation"],
                target_id=rel["target"],
                target_label=rel.get("target_type", "Entity"),
                properties={
                    "confidence": rel.get("confidence", 0.90),
                    "evidence": rel.get("evidence", ""),
                    "case_id": case_id
                }
            )

        return {
            "case_id": case_id,
            "title": case_title,
            "filename": filename,
            "file_hash_sha256": file_hash,
            "local_path": local_file_path,
            "nlp_result": nlp_result
        }

    def load_seed_datasets(self, db: Session, dataset_folder: Optional[str] = None) -> Dict[str, Any]:
        return self.seed_dataset_csvs(db, dataset_folder)

    def seed_dataset_csvs(self, db: Session, dataset_folder: Optional[str] = None) -> Dict[str, Any]:
        """
        Universal Loader for the 9 CSVs from SIH Investigation Database:
        - people.csv
        - phones.csv
        - vehicles.csv
        - relationships.csv
        - transactions.csv
        - locations.csv
        - court_cases.csv
        - cluster_summaries.csv
        - master_case_match.csv
        """
        folder = dataset_folder or settings.DATASET_DIR
        stats = {
            "people_loaded": 0,
            "phones_loaded": 0,
            "vehicles_loaded": 0,
            "locations_loaded": 0,
            "relationships_loaded": 0,
            "transactions_loaded": 0,
            "court_cases_loaded": 0,
            "clusters_loaded": 0,
            "matches_loaded": 0
        }

        # 1. People CSV
        people_file = os.path.join(folder, "people.csv")
        if os.path.exists(people_file):
            with open(people_file, mode="r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    p_id = row.get("person_id") or row.get("id") or row.get("name")
                    name = row.get("name") or row.get("full_name", p_id)
                    aliases = [a.strip() for a in row.get("aliases", "").split(";") if a.strip()]
                    neo4j_client.add_node(name, "SUSPECT_PERSON", {
                        "person_id": p_id,
                        "name": name,
                        "aliases": aliases,
                        "role": row.get("role", "Suspect"),
                        "age": row.get("age", ""),
                        "address": row.get("address", "")
                    })
                    stats["people_loaded"] += 1

        # 2. Phones CSV
        phones_file = os.path.join(folder, "phones.csv")
        if os.path.exists(phones_file):
            with open(phones_file, mode="r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    phone_num = row.get("phone_number") or row.get("number")
                    p_name = row.get("person_name") or row.get("person_id")
                    if phone_num:
                        neo4j_client.add_node(phone_num, "PHONE_NUMBER", {
                            "name": phone_num,
                            "imei": row.get("imei", ""),
                            "isp": row.get("isp", "Airtel/Jio")
                        })
                        if p_name:
                            neo4j_client.add_relationship(p_name, "SUSPECT_PERSON", "USES_PHONE", phone_num, "PHONE_NUMBER", {"confidence": 0.98})
                        stats["phones_loaded"] += 1

        # 3. Vehicles CSV
        vehicles_file = os.path.join(folder, "vehicles.csv")
        if os.path.exists(vehicles_file):
            with open(vehicles_file, mode="r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    reg = row.get("reg_number") or row.get("vehicle_number") or row.get("plate")
                    owner = row.get("owner") or row.get("person_name") or row.get("person_id")
                    if reg:
                        neo4j_client.add_node(reg, "VEHICLE_NUMBER", {
                            "name": reg,
                            "model": row.get("model", ""),
                            "color": row.get("color", "")
                        })
                        if owner:
                            neo4j_client.add_relationship(owner, "SUSPECT_PERSON", "OWNS_VEHICLE", reg, "VEHICLE_NUMBER", {"confidence": 0.95})
                        stats["vehicles_loaded"] += 1

        # 4. Locations CSV
        loc_file = os.path.join(folder, "locations.csv")
        if os.path.exists(loc_file):
            with open(loc_file, mode="r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    loc_name = row.get("location_name") or row.get("name") or row.get("city")
                    if loc_name:
                        neo4j_client.add_node(loc_name, "LOCATION", {
                            "name": loc_name,
                            "city": row.get("city", loc_name),
                            "state": row.get("state", "Delhi")
                        })
                        stats["locations_loaded"] += 1

        # 5. Relationships CSV
        rel_file = os.path.join(folder, "relationships.csv")
        if os.path.exists(rel_file):
            with open(rel_file, mode="r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    src = row.get("from") or row.get("source") or row.get("person_a") or row.get("source_id")
                    tgt = row.get("to") or row.get("target") or row.get("person_b") or row.get("target_id")
                    rel_type = (row.get("relationship") or row.get("relation_type") or "ASSOCIATED_WITH").upper().replace(" ", "_")
                    conf = float(row.get("confidence", 0.94))
                    if src and tgt:
                        # Infer node types
                        def infer_type(val):
                            s = str(val).strip()
                            if s.isdigit() and len(s) >= 8: return "PHONE_NUMBER"
                            if any(s.startswith(p) for p in ["DL", "HR", "UP", "MH", "KA", "TN", "PB", "GJ", "RJ"]) and len(s) >= 8: return "VEHICLE_NUMBER"
                            if s.startswith("FIR") or s.startswith("CASE"): return "FIR_RECORD"
                            if s.startswith("T00") or s.startswith("TXN"): return "FINANCIAL_AMOUNT"
                            if s.startswith("HC") or s.startswith("COURT"): return "LEGAL_SECTION"
                            if any(c in s for c in ["Delhi", "Gurugram", "Noida", "Mumbai", "Jaipur", "Lucknow", "Chandigarh", "Ahmedabad", "Ukkadam", "Coimbatore"]): return "LOCATION"
                            return "SUSPECT_PERSON"

                        src_type = infer_type(src)
                        tgt_type = infer_type(tgt)

                        neo4j_client.add_node(src, src_type, {"name": src})
                        neo4j_client.add_node(tgt, tgt_type, {"name": tgt})
                        neo4j_client.add_relationship(src, src_type, rel_type, tgt, tgt_type, {"confidence": conf})
                        stats["relationships_loaded"] += 1

        # 6. Transactions CSV
        tx_file = os.path.join(folder, "transactions.csv")
        if os.path.exists(tx_file):
            with open(tx_file, mode="r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sender = row.get("sender") or row.get("from_id")
                    receiver = row.get("receiver") or row.get("to_id")
                    amt = row.get("amount") or row.get("amount_inr", "50000")
                    if sender and receiver:
                        neo4j_client.add_relationship(sender, "SUSPECT_PERSON", "TRANSFERRED_MONEY", receiver, "SUSPECT_PERSON", {
                            "amount": amt,
                            "date": row.get("date", "2025-01-01")
                        })
                        stats["transactions_loaded"] += 1

        # 7. Cluster Summaries CSV
        clusters_file = os.path.join(folder, "cluster_summaries.csv")
        if os.path.exists(clusters_file):
            with open(clusters_file, mode="r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    gang_name = row.get("gang_name") or row.get("cluster_name") or row.get("syndicate")
                    if gang_name:
                        neo4j_client.add_node(gang_name, "CRIMINAL_ORGANIZATION", {
                            "name": gang_name,
                            "threat_level": row.get("threat_level", "HIGH"),
                            "summary": row.get("summary", "")
                        })
                        stats["clusters_loaded"] += 1

        # 8. cluster_summary.csv (network_cluster, total_cases, avg_confidence)
        cs2_file = os.path.join(folder, "cluster_summary.csv")
        if os.path.exists(cs2_file):
            with open(cs2_file, mode="r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    cluster_name = row.get("network_cluster")
                    if cluster_name:
                        neo4j_client.add_node(cluster_name, "CRIMINAL_ORGANIZATION", {
                            "name": f"Network {cluster_name}",
                            "total_cases": row.get("total_cases", "0"),
                            "avg_confidence": row.get("avg_confidence", "0"),
                            "threat_level": "HIGH"
                        })
                        stats["clusters_loaded"] += 1

        # 9. master_case_mapping_150.csv — Rich master file linking everything
        master_file = os.path.join(folder, "master_case_mapping_150.csv")
        if os.path.exists(master_file):
            with open(master_file, mode="r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    case_id = row.get("case_id", "")
                    person_name = row.get("person_name", "")
                    cluster = row.get("network_cluster", "")
                    phone = row.get("phone_number", "")
                    vehicle = row.get("vehicle_number", "")
                    city = row.get("city", "")
                    crime_type = row.get("crime_type", "")
                    role = row.get("role", "Suspect")
                    confidence = float(row.get("confidence_score", 50)) / 100.0
                    linked_case = row.get("linked_case", "")

                    # Create FIR node
                    if case_id:
                        neo4j_client.add_node(case_id, "FIR_RECORD", {
                            "name": f"{case_id} - {crime_type}",
                            "crime_type": crime_type,
                            "fir_date": row.get("fir_date", ""),
                            "cluster": cluster,
                            "risk_level": row.get("cluster_risk_level", "Medium"),
                            "status": "ACTIVE"
                        })

                    # Create Person node and link to FIR
                    if person_name:
                        neo4j_client.add_node(person_name, "SUSPECT_PERSON", {
                            "name": person_name,
                            "role": role,
                            "city": city,
                            "state": row.get("state", ""),
                        })
                        if case_id:
                            neo4j_client.add_relationship(
                                person_name, "SUSPECT_PERSON",
                                "INVOLVED_IN", case_id, "FIR_RECORD",
                                {"confidence": confidence, "role": role}
                            )

                    # Create Phone node and link to Person
                    if phone:
                        neo4j_client.add_node(phone, "PHONE_NUMBER", {
                            "name": phone,
                            "communication_count": row.get("communication_count", "0")
                        })
                        if person_name:
                            neo4j_client.add_relationship(
                                person_name, "SUSPECT_PERSON",
                                "USES_PHONE", phone, "PHONE_NUMBER",
                                {"confidence": 0.95}
                            )

                    # Create Vehicle node and link to Person
                    if vehicle:
                        neo4j_client.add_node(vehicle, "VEHICLE_NUMBER", {
                            "name": vehicle,
                            "registration_state": row.get("registration_state", "")
                        })
                        if person_name:
                            neo4j_client.add_relationship(
                                person_name, "SUSPECT_PERSON",
                                "USES_VEHICLE", vehicle, "VEHICLE_NUMBER",
                                {"confidence": 0.90}
                            )

                    # Create Location node and link Person
                    if city:
                        neo4j_client.add_node(city, "LOCATION", {
                            "name": city,
                            "state": row.get("state", "")
                        })
                        if person_name:
                            neo4j_client.add_relationship(
                                person_name, "SUSPECT_PERSON",
                                "OPERATES_IN", city, "LOCATION",
                                {"confidence": 0.85}
                            )

                    # Link Person to Cluster/Network
                    if cluster and person_name:
                        neo4j_client.add_relationship(
                            person_name, "SUSPECT_PERSON",
                            "MEMBER_OF", cluster, "CRIMINAL_ORGANIZATION",
                            {"confidence": confidence}
                        )

                    # Cross-case links
                    if linked_case and case_id:
                        neo4j_client.add_relationship(
                            case_id, "FIR_RECORD",
                            "LINKED_TO", linked_case, "FIR_RECORD",
                            {"confidence": confidence, "reason": row.get("confidence_reason", "")}
                        )

                    stats.setdefault("master_records_loaded", 0)
                    stats["master_records_loaded"] += 1

        return {
            "status": "SUCCESS",
            "stats": stats,
            "message": "Dataset CSVs successfully ingested into Knowledge Graph!"
        }

# Global singleton
ingestion_service = IngestionService()
