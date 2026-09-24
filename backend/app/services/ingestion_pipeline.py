"""
Phase 1 Ingestion Pipeline Orchestrator
=======================================
Implements all 8 discrete, testable pipeline steps:
1. Upload (File validation, metadata tracking, secure storage path)
2. Validate (Source schema & safety validation)
3. Clean (Text normalization and sanitization)
4. NLP Extraction (Hybrid spaCy/regex for unstructured text; SKIPPED for structured sources)
5. Entity Resolution (Multi-signal candidate matching, no auto-merging)
6. Relationship Extraction (NLP semantic relations or structured row mappings)
7. Graph Insertion (Insert through unified BaseGraphStore interface)
8. Completed (Final status, metrics, and step-level audit)
"""

import csv
import hashlib
import io
import json
import logging
import os
import re
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.ingestion import DataSource, DataSourceType, IngestStatus, PipelineStep, RawEntity, PendingResolution
from app.services.source_validators import validate_source_payload, sanitize_filename
from app.services.graph_store import get_graph_store
from app.nlp.pipeline import nlp_pipeline
from app.nlp.staging import stage_extraction
from app.nlp.entity_resolution import entity_resolver

logger = logging.getLogger(__name__)


class PipelineContext:
    """Carries execution state, extracted entities, and timing across pipeline steps."""

    def __init__(
        self,
        filename: str,
        content: str,
        source_type: DataSourceType,
        case_id: Optional[str] = None,
        file_size: Optional[int] = None,
        user_id: Optional[int] = None,
        file_storage_path: Optional[str] = None,
    ):
        self.filename = sanitize_filename(filename)
        self.content = content
        self.source_type = source_type
        self.case_id = case_id
        self.file_size = file_size or len(content.encode("utf-8"))
        self.user_id = user_id
        self.file_storage_path = file_storage_path or f"data/uploads/{self.filename}"
        self.content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        self.is_duplicate = False
        
        self.data_source_id: Optional[int] = None
        self.cleaned_content: str = content
        self.raw_entities: List[Dict[str, Any]] = []
        self.graph_nodes: List[Dict[str, Any]] = []
        self.graph_edges: List[Dict[str, Any]] = []
        self.pending_resolutions: List[Dict[str, Any]] = []
        
        self.step_progress: Dict[str, Dict[str, Any]] = {
            step.value: {"status": "PENDING", "latency_ms": 0, "details": ""}
            for step in PipelineStep
        }


class IngestionPipelineOrchestrator:
    """Executes the 8-step pipeline with isolation and error recording."""

    @staticmethod
    def step_upload(ctx: PipelineContext, db: Session) -> DataSource:
        """Step 1: Upload, duplicate check, and initialize tracking record."""
        t0 = time.perf_counter()
        
        # Check for duplicate content in already completed ingestions
        existing = db.query(DataSource).filter(
            DataSource.content_hash == ctx.content_hash,
            DataSource.status == IngestStatus.COMPLETED,
        ).first()

        if existing:
            ctx.is_duplicate = True
            for step in PipelineStep:
                ctx.step_progress[step.value] = {
                    "status": "SKIPPED",
                    "latency_ms": 0,
                    "details": f"Skipped — matches previously ingested data source #{existing.id} ({existing.filename})",
                }
            ctx.step_progress[PipelineStep.UPLOAD.value] = {
                "status": "COMPLETED",
                "latency_ms": int((time.perf_counter() - t0) * 1000),
                "details": f"Duplicate file detected (identical content to #{existing.id} - {existing.filename}). Ingestion skipped to prevent duplicate entities.",
            }
            ctx.step_progress[PipelineStep.COMPLETED.value] = {
                "status": "COMPLETED",
                "latency_ms": 1,
                "details": f"Duplicate upload detected: identical content to existing data source #{existing.id}. Zero duplicate nodes/edges created.",
            }
            ds = DataSource(
                filename=ctx.filename,
                source_type=ctx.source_type,
                file_path=ctx.file_storage_path,
                file_storage_path=ctx.file_storage_path,
                file_size_bytes=ctx.file_size,
                content_hash=ctx.content_hash,
                case_id_ref=ctx.case_id,
                status=IngestStatus.COMPLETED,
                current_step=PipelineStep.COMPLETED.value,
                ingested_by=ctx.user_id,
                step_progress=ctx.step_progress,
                entities_count=0,
                relationships_count=0,
            )
            db.add(ds)
            db.flush()
            ctx.data_source_id = ds.id
            db.commit()
            return ds

        ds = DataSource(
            filename=ctx.filename,
            source_type=ctx.source_type,
            file_path=ctx.file_storage_path,
            file_storage_path=ctx.file_storage_path,
            file_size_bytes=ctx.file_size,
            content_hash=ctx.content_hash,
            case_id_ref=ctx.case_id,
            status=IngestStatus.PROCESSING,
            current_step=PipelineStep.UPLOAD.value,
            ingested_by=ctx.user_id,
            step_progress=ctx.step_progress,
        )
        db.add(ds)
        db.flush()
        
        ctx.data_source_id = ds.id
        latency = int((time.perf_counter() - t0) * 1000)
        ctx.step_progress[PipelineStep.UPLOAD.value] = {
            "status": "COMPLETED",
            "latency_ms": latency,
            "details": f"File tracking initialized (ID: {ds.id}, size: {ctx.file_size} bytes)",
        }
        ds.step_progress = ctx.step_progress
        db.commit()
        return ds

    @staticmethod
    def step_validate(ctx: PipelineContext, db: Session, ds: DataSource) -> None:
        """Step 2: Source validation against schema and safety rules."""
        t0 = time.perf_counter()
        ds.current_step = PipelineStep.VALIDATE.value
        
        is_valid, err_msg, meta = validate_source_payload(
            filename=ctx.filename,
            content=ctx.content,
            source_type=ctx.source_type,
            file_size=ctx.file_size,
        )
        
        latency = int((time.perf_counter() - t0) * 1000)
        if not is_valid:
            ctx.step_progress[PipelineStep.VALIDATE.value] = {
                "status": "FAILED",
                "latency_ms": latency,
                "details": err_msg or "Validation error",
            }
            ds.failed_step = PipelineStep.VALIDATE.value
            ds.status = IngestStatus.FAILED
            ds.error_log = err_msg
            ds.step_progress = ctx.step_progress
            db.commit()
            raise ValueError(f"Validation failed at Step 2 (VALIDATE): {err_msg}")
        
        ctx.step_progress[PipelineStep.VALIDATE.value] = {
            "status": "COMPLETED",
            "latency_ms": latency,
            "details": f"Validation passed ({meta.get('format', ctx.source_type.value)})",
        }
        ds.step_progress = ctx.step_progress
        db.commit()

    @staticmethod
    def step_clean(ctx: PipelineContext, db: Session, ds: DataSource) -> None:
        """Step 3: Text cleaning and normalization."""
        t0 = time.perf_counter()
        ds.current_step = PipelineStep.CLEAN.value
        
        # Unicode normalization and whitespace trimming
        cleaned = ctx.content.replace("\r\n", "\n").replace("\r", "\n")
        # Remove null bytes or non-printable ASCII noise
        cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", "", cleaned)
        ctx.cleaned_content = cleaned
        
        latency = int((time.perf_counter() - t0) * 1000)
        ctx.step_progress[PipelineStep.CLEAN.value] = {
            "status": "COMPLETED",
            "latency_ms": latency,
            "details": f"Cleaned {len(cleaned)} characters",
        }
        ds.step_progress = ctx.step_progress
        db.commit()

    @staticmethod
    def step_nlp_extraction(ctx: PipelineContext, db: Session, ds: DataSource) -> None:
        """Step 4: NLP extraction on unstructured FIR text, or SKIPPED for structured sources."""
        t0 = time.perf_counter()
        ds.current_step = PipelineStep.NLP_EXTRACTION.value
        
        # Structured sources skip NLP in favor of structured mapping
        if ctx.source_type in (DataSourceType.CDR, DataSourceType.FINANCIAL, DataSourceType.SOCIAL_MEDIA, DataSourceType.CRIMINAL_HISTORY, DataSourceType.SURVEILLANCE, DataSourceType.JSON_IMPORT, DataSourceType.CSV_IMPORT):
            latency = int((time.perf_counter() - t0) * 1000)
            ctx.step_progress[PipelineStep.NLP_EXTRACTION.value] = {
                "status": "SKIPPED",
                "latency_ms": latency,
                "details": f"Structured source ({ctx.source_type.value}) skips NLP extraction in favor of structured mapping",
            }
            ds.step_progress = ctx.step_progress
            db.commit()
            return

        # Unstructured text (FIR / Police reports)
        doc_id = f"DOC-{ctx.data_source_id}"
        nlp_res = nlp_pipeline.process_document(ctx.cleaned_content, document_id=doc_id)
        staged = stage_extraction(nlp_res)
        
        staged_entities = staged.get("staged_entities", [])
        staged_relationships = staged.get("staged_relationships", [])
        
        # Prepare graph nodes with complete provenance
        now_iso = datetime.now(timezone.utc).isoformat()
        for e in staged_entities:
            text = e.get("text", "").strip()
            etype = e.get("type", "UNKNOWN")
            if not text:
                continue
            
            node_id = e.get("id") or text
            node_dict = {
                "id": node_id,
                "name": text,
                "type": etype,
                "normalized": e.get("normalized_value", text),
                "role": e.get("role"),
                "cases": [ctx.case_id] if ctx.case_id else [],
                "confidence": e.get("confidence", 0.85),
                "verification_status": "AI_SUGGESTED",
                "source_document_id": doc_id,
                "created_at": now_iso,
            }
            ctx.graph_nodes.append(node_dict)
            
            # Record RawEntity in DB
            raw_e = RawEntity(
                data_source_id=ctx.data_source_id,
                entity_type=etype,
                raw_text=text,
                normalized=node_dict["normalized"],
                confidence=node_dict["confidence"],
                source_case_id=ctx.case_id,
                resolved_entity_id=node_id,
                meta={
                    "nlp_extracted": True,
                    "extraction_method": e.get("provenance", {}).get("extraction_method", "SPACY_NER"),
                    "verification_status": "AI_SUGGESTED",
                    "sentence": e.get("provenance", {}).get("sentence", ""),
                },
            )
            db.add(raw_e)

        # Prepare graph edges from NLP staging
        for rel in staged_relationships:
            src = rel.get("source_entity_id") or rel.get("subject", "")
            tgt = rel.get("target_entity_id") or rel.get("object", "")
            rel_type = (rel.get("relationship_type") or rel.get("predicate", "ASSOCIATED_WITH")).upper().replace(" ", "_")
            if src and tgt:
                sentence = ""
                if isinstance(rel.get("evidence"), dict):
                    sentence = rel["evidence"].get("sentence", "")
                elif isinstance(rel.get("evidence"), str):
                    sentence = rel["evidence"]
                
                ctx.graph_edges.append({
                    "source": src,
                    "target": tgt,
                    "type": rel_type,
                    "source_case": ctx.case_id or "",
                    "source_document_id": doc_id,
                    "evidence_snippet": sentence or f"Extracted from {ctx.filename}",
                    "extraction_method": rel.get("extraction_method", "DEPENDENCY_PARSER"),
                    "confidence": rel.get("confidence", 0.85),
                    "verification_status": "AI_SUGGESTED",
                    "created_at": now_iso,
                })

        latency = int((time.perf_counter() - t0) * 1000)
        ctx.step_progress[PipelineStep.NLP_EXTRACTION.value] = {
            "status": "COMPLETED",
            "latency_ms": latency,
            "details": f"Extracted {len(ctx.graph_nodes)} entities, {len(ctx.graph_edges)} relationships",
        }
        ds.step_progress = ctx.step_progress
        db.commit()

    @staticmethod
    def step_structured_mapping(ctx: PipelineContext, db: Session, ds: DataSource) -> None:
        """Helper step for mapping structured formats to graph nodes and edges with provenance."""
        if ctx.source_type == DataSourceType.FIR_REPORT:
            return  # Already handled in NLP step

        now_iso = datetime.now(timezone.utc).isoformat()
        doc_id = f"DOC-{ctx.data_source_id}"

        if ctx.source_type == DataSourceType.CDR:
            reader = csv.DictReader(io.StringIO(ctx.cleaned_content))
            seen_nodes = set()
            for row_idx, row in enumerate(reader, start=1):
                caller = (row.get("caller_number") or row.get("caller") or "").strip()
                receiver = (row.get("receiver_number") or row.get("receiver") or "").strip()
                cid = row.get("source_case_id") or ctx.case_id
                
                for phone in (caller, receiver):
                    if phone and phone not in seen_nodes:
                        seen_nodes.add(phone)
                        node = {
                            "id": phone,
                            "name": phone,
                            "type": "Phone",
                            "number": phone,
                            "cases": [cid] if cid else [],
                            "confidence": 1.0,
                            "verification_status": "AI_SUGGESTED",
                            "source_document_id": doc_id,
                            "created_at": now_iso,
                        }
                        ctx.graph_nodes.append(node)
                        db.add(RawEntity(
                            data_source_id=ctx.data_source_id,
                            entity_type="PHONE",
                            raw_text=phone,
                            normalized=phone,
                            confidence=1.0,
                            source_case_id=cid,
                            resolved_entity_id=phone,
                            meta={"extraction_method": "STRUCTURED_RECORD", "row": row_idx},
                        ))

                if caller and receiver:
                    ctx.graph_edges.append({
                        "source": caller,
                        "target": receiver,
                        "type": "CALLED",
                        "source_case": cid or "",
                        "source_document_id": doc_id,
                        "evidence_snippet": f"Row {row_idx} of {ctx.filename} (duration: {row.get('duration_sec', 'N/A')}s, tower: {row.get('cell_tower_id', 'N/A')})",
                        "extraction_method": "STRUCTURED_RECORD",
                        "confidence": 0.95,
                        "verification_status": "AI_SUGGESTED",
                        "created_at": now_iso,
                    })

        elif ctx.source_type == DataSourceType.FINANCIAL:
            reader = csv.DictReader(io.StringIO(ctx.cleaned_content))
            seen_nodes = set()
            for row_idx, row in enumerate(reader, start=1):
                s_acc = (row.get("sender_account") or "").strip()
                s_name = (row.get("sender_name") or "").strip()
                r_acc = (row.get("receiver_account") or "").strip()
                r_name = (row.get("receiver_name") or "").strip()
                amt = (row.get("amount") or "0").strip()
                cid = row.get("source_case_id") or ctx.case_id

                for acc, name in [(s_acc, s_name), (r_acc, r_name)]:
                    if acc and acc not in seen_nodes:
                        seen_nodes.add(acc)
                        node = {
                            "id": acc,
                            "name": f"Account {acc}" + (f" ({name})" if name else ""),
                            "type": "FinancialAccount",
                            "account_number": acc,
                            "holder_name": name,
                            "cases": [cid] if cid else [],
                            "confidence": 1.0,
                            "verification_status": "AI_SUGGESTED",
                            "source_document_id": doc_id,
                            "created_at": now_iso,
                        }
                        ctx.graph_nodes.append(node)
                        db.add(RawEntity(
                            data_source_id=ctx.data_source_id,
                            entity_type="FINANCIAL_ACCOUNT",
                            raw_text=acc,
                            normalized=acc,
                            confidence=1.0,
                            source_case_id=cid,
                            resolved_entity_id=acc,
                            meta={"holder_name": name, "extraction_method": "STRUCTURED_RECORD", "row": row_idx},
                        ))

                if s_acc and r_acc:
                    ctx.graph_edges.append({
                        "source": s_acc,
                        "target": r_acc,
                        "type": "TRANSFERRED_MONEY",
                        "source_case": cid or "",
                        "source_document_id": doc_id,
                        "evidence_snippet": f"Row {row_idx} of {ctx.filename} (Amount: Rs. {amt})",
                        "extraction_method": "STRUCTURED_RECORD",
                        "confidence": 1.0,
                        "verification_status": "AI_SUGGESTED",
                        "created_at": now_iso,
                    })

        elif ctx.source_type in (DataSourceType.SOCIAL_MEDIA, DataSourceType.CRIMINAL_HISTORY, DataSourceType.SURVEILLANCE, DataSourceType.INTELLIGENCE, DataSourceType.JSON_IMPORT):
            try:
                data = json.loads(ctx.cleaned_content)
                if isinstance(data, dict):
                    data = [data]
                seen_nodes = set()
                for idx, item in enumerate(data, start=1):
                    # Extract entities mentioned in JSON item
                    cid = (item.get("case_ids") or [ctx.case_id])[0] if item.get("case_ids") else ctx.case_id
                    
                    # Full name / primary entity
                    name = item.get("full_name") or item.get("profile_handle") or item.get("report_id") or item.get("record_id")
                    if name and name not in seen_nodes:
                        seen_nodes.add(name)
                        etype = "Person" if "full_name" in item or "aliases" in item else "Organization" if "platform" in item else "Location"
                        ctx.graph_nodes.append({
                            "id": str(name),
                            "name": str(name),
                            "type": etype,
                            "aliases": item.get("aliases", []),
                            "phone": item.get("primary_phone"),
                            "cases": [cid] if cid else [],
                            "confidence": 0.95,
                            "verification_status": "AI_SUGGESTED",
                            "source_document_id": doc_id,
                            "created_at": now_iso,
                        })
                        db.add(RawEntity(
                            data_source_id=ctx.data_source_id,
                            entity_type=etype.upper(),
                            raw_text=str(name),
                            normalized=str(name),
                            confidence=0.95,
                            source_case_id=cid,
                            resolved_entity_id=str(name),
                            meta={"extraction_method": "STRUCTURED_RECORD", "item_index": idx},
                        ))

                    # Known associates or observed connections
                    associates = item.get("known_associates") or item.get("associated_handles") or item.get("entities_spotted") or []
                    for assoc in associates:
                        if assoc and assoc not in seen_nodes:
                            seen_nodes.add(assoc)
                            ctx.graph_nodes.append({
                                "id": str(assoc),
                                "name": str(assoc),
                                "type": "Person",
                                "cases": [cid] if cid else [],
                                "confidence": 0.9,
                                "verification_status": "AI_SUGGESTED",
                                "source_document_id": doc_id,
                                "created_at": now_iso,
                            })
                        if name and assoc:
                            ctx.graph_edges.append({
                                "source": str(name),
                                "target": str(assoc),
                                "type": "ASSOCIATED_WITH",
                                "source_case": cid or "",
                                "source_document_id": doc_id,
                                "evidence_snippet": f"Item {idx} of {ctx.filename} ({item.get('platform') or item.get('gang_affiliation') or 'Intelligence Report'})",
                                "extraction_method": "STRUCTURED_RECORD",
                                "confidence": 0.9,
                                "verification_status": "AI_SUGGESTED",
                                "created_at": now_iso,
                            })
            except Exception as e:
                logger.warning("Structured JSON mapping notice: %s", e)

    @staticmethod
    def step_entity_resolution(ctx: PipelineContext, db: Session, ds: DataSource) -> None:
        """Step 5: Entity Resolution candidate generation against existing graph nodes."""
        t0 = time.perf_counter()
        ds.current_step = PipelineStep.ENTITY_RESOLUTION.value
        
        store = get_graph_store()
        existing_subgraph = store.get_subgraph()
        existing_nodes = existing_subgraph.get("nodes", [])

        # Run candidate evaluation between new entities and existing graph nodes
        candidates = entity_resolver.find_cross_document_candidates(
            existing_nodes=existing_nodes,
            new_entities=ctx.graph_nodes,
        )

        for match in candidates:
            e1 = match["entity_1"]
            e2 = match["entity_2"]
            n1_id = str(e1.get("id") or e1.get("name") or "")
            n2_id = str(e2.get("id") or e2.get("name") or "")
            
            # Avoid self-suggestions
            if n1_id == n2_id:
                continue

            pr = PendingResolution(
                node_a_id=n1_id,
                node_b_id=n2_id,
                node_a_name=str(e1.get("name") or n1_id),
                node_b_name=str(e2.get("name") or n2_id),
                entity_type=e1.get("type", "Person"),
                similarity_score=match.get("similarity_score", 0.9),
                match_reason=match.get("match_reason", "Multi-signal candidate match"),
                signals=match.get("corroborating_signals", []),
                status="PENDING",
            )
            db.add(pr)
            ctx.pending_resolutions.append(match)

        latency = int((time.perf_counter() - t0) * 1000)
        ctx.step_progress[PipelineStep.ENTITY_RESOLUTION.value] = {
            "status": "COMPLETED",
            "latency_ms": latency,
            "details": f"Generated {len(ctx.pending_resolutions)} candidate merge suggestion(s) without auto-merging",
        }
        ds.step_progress = ctx.step_progress
        db.commit()

    @staticmethod
    def step_relationship_extraction(ctx: PipelineContext, db: Session, ds: DataSource) -> None:
        """Step 6: Relationship Extraction validation and enrichment."""
        t0 = time.perf_counter()
        ds.current_step = PipelineStep.RELATIONSHIP_EXTRACTION.value

        # Ensure all edges have provenance fields
        now_iso = datetime.now(timezone.utc).isoformat()
        doc_id = f"DOC-{ctx.data_source_id}"

        for edge in ctx.graph_edges:
            if "source_document_id" not in edge:
                edge["source_document_id"] = doc_id
            if "evidence_snippet" not in edge:
                edge["evidence_snippet"] = f"Extracted from {ctx.filename}"
            if "extraction_method" not in edge:
                edge["extraction_method"] = "SPACY_NER" if ctx.source_type == DataSourceType.FIR_REPORT else "STRUCTURED_RECORD"
            if "confidence" not in edge:
                edge["confidence"] = 0.9
            if "verification_status" not in edge:
                edge["verification_status"] = "AI_SUGGESTED"
            if "created_at" not in edge:
                edge["created_at"] = now_iso

        latency = int((time.perf_counter() - t0) * 1000)
        ctx.step_progress[PipelineStep.RELATIONSHIP_EXTRACTION.value] = {
            "status": "COMPLETED",
            "latency_ms": latency,
            "details": f"Validated {len(ctx.graph_edges)} relationship(s) with full provenance",
        }
        ds.step_progress = ctx.step_progress
        db.commit()

    @staticmethod
    def step_graph_insertion(ctx: PipelineContext, db: Session, ds: DataSource) -> None:
        """Step 7: Graph insertion into active GraphStore."""
        t0 = time.perf_counter()
        ds.current_step = PipelineStep.GRAPH_INSERTION.value
        
        store = get_graph_store()
        nodes_added = 0
        edges_added = 0
        
        if ctx.graph_nodes:
            nodes_added = store.add_nodes(ctx.graph_nodes)
        if ctx.graph_edges:
            edges_added = store.add_edges(ctx.graph_edges)

        latency = int((time.perf_counter() - t0) * 1000)
        ctx.step_progress[PipelineStep.GRAPH_INSERTION.value] = {
            "status": "COMPLETED",
            "latency_ms": latency,
            "details": f"Inserted {nodes_added} node(s) and {edges_added} edge(s) into {type(store).__name__}",
        }
        ds.entities_count = len(ctx.graph_nodes)
        ds.relationships_count = len(ctx.graph_edges)
        ds.step_progress = ctx.step_progress
        db.commit()

    @staticmethod
    def step_completed(ctx: PipelineContext, db: Session, ds: DataSource) -> Dict[str, Any]:
        """Step 8: Finalize pipeline execution and record completion status."""
        t0 = time.perf_counter()
        ds.current_step = PipelineStep.COMPLETED.value
        ds.status = IngestStatus.COMPLETED
        ds.row_count = len(ctx.graph_nodes)
        
        latency = int((time.perf_counter() - t0) * 1000)
        ctx.step_progress[PipelineStep.COMPLETED.value] = {
            "status": "COMPLETED",
            "latency_ms": latency,
            "details": "Pipeline successfully executed across all steps.",
        }
        ds.step_progress = ctx.step_progress
        db.commit()
        db.refresh(ds)

        return {
            "data_source_id": ds.id,
            "filename": ctx.filename,
            "source_type": ctx.source_type.value,
            "status": "COMPLETED",
            "entities_extracted": len(ctx.graph_nodes),
            "relationships_created": len(ctx.graph_edges),
            "pending_resolutions": len(ctx.pending_resolutions),
            "step_progress": ctx.step_progress,
        }

    @classmethod
    def execute(
        cls,
        db: Session,
        filename: str,
        content: str,
        source_type: DataSourceType,
        case_id: Optional[str] = None,
        file_size: Optional[int] = None,
        user_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Execute full 8-step pipeline with fault isolation.
        """
        ctx = PipelineContext(
            filename=filename,
            content=content,
            source_type=source_type,
            case_id=case_id,
            file_size=file_size,
            user_id=user_id,
        )

        ds = cls.step_upload(ctx, db)
        if ctx.is_duplicate:
            return cls.step_completed(ctx, db, ds)

        try:
            cls.step_validate(ctx, db, ds)
            cls.step_clean(ctx, db, ds)
            
            # Step 4: NLP or skip
            cls.step_nlp_extraction(ctx, db, ds)
            
            # If structured source, map records
            cls.step_structured_mapping(ctx, db, ds)
            
            # Step 5: Entity resolution
            cls.step_entity_resolution(ctx, db, ds)
            
            # Step 6: Relationship extraction
            cls.step_relationship_extraction(ctx, db, ds)
            
            # Step 7: Graph insertion
            cls.step_graph_insertion(ctx, db, ds)
            
            # Step 8: Completed
            return cls.step_completed(ctx, db, ds)

        except Exception as exc:
            db.rollback()
            # If ds was committed, record failure step and error
            try:
                ds.status = IngestStatus.FAILED
                if not ds.failed_step:
                    ds.failed_step = ds.current_step or PipelineStep.UPLOAD.value
                ds.error_log = str(exc)
                if ds.failed_step in ctx.step_progress:
                    ctx.step_progress[ds.failed_step]["status"] = "FAILED"
                    ctx.step_progress[ds.failed_step]["details"] = str(exc)
                ds.step_progress = ctx.step_progress
                db.commit()
            except Exception:
                pass
            logger.error("Ingestion pipeline failed at %s for '%s': %s", ds.failed_step, filename, exc)
            raise
