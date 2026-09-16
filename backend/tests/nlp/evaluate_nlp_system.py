"""
Comprehensive NLP System Evaluation & Benchmark Engine
======================================================
As an NLP Engineer, this script performs rigorous evaluation of:
  1. Named Entity Recognition (NER) — Precision, Recall, F1 per type + Micro/Macro
  2. Person Role Classification — Accuracy, Confusion Analysis, F1 per role
  3. Semantic Relationship Extraction — Precision, Recall, F1 per relation type
  4. Negation & Safety Guardrails — Negation Detection Accuracy & Forbidden Rel Violations
  5. Overall System Composite Score / 100 & Production Readiness Assessment

Outputs:
  - Formatted console scorecards & markdown report data
  - JSON artifact for automated quality gates
"""

import sys
import os
import json
from collections import defaultdict
from typing import Dict, List, Any, Tuple

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.nlp.pipeline import NLPProcessingPipeline
from tests.nlp.gold_standard_dataset import GOLD_STANDARD_DATASET


def calc_prf(tp: int, fp: int, fn: int) -> Dict[str, float]:
    """Calculate Precision, Recall, and F1 with safety against division by zero."""
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "tp": tp,
        "fp": fp,
        "fn": fn
    }


def entity_matches(extracted: Dict[str, Any], ground_truth: Dict[str, Any]) -> bool:
    """Check if an extracted entity matches ground truth entity."""
    if extracted.get("type") != ground_truth.get("type"):
        return False
    
    gt_text = ground_truth.get("text", "").lower().strip()
    ext_text = extracted.get("text", "").lower().strip()
    ext_norm = str(extracted.get("normalized_value", "")).lower().strip()
    
    # Substring / partial token match or normalized match
    if gt_text in ext_text or ext_text in gt_text:
        return True
    if gt_text in ext_norm or ext_norm in gt_text:
        return True
    
    return False


def rel_matches(extracted: Dict[str, Any], ground_truth: Dict[str, Any]) -> bool:
    """Check if an extracted relationship matches ground truth relationship."""
    if extracted.get("relationship_type") != ground_truth.get("rel_type"):
        return False
    
    gt_src = ground_truth.get("source", "").lower().strip()
    ext_src = str(extracted.get("source_entity_text", "")).lower().strip()
    if gt_src not in ext_src and ext_src not in gt_src:
        return False
        
    gt_tgt = ground_truth.get("target", "").lower().strip()
    if gt_tgt:
        ext_tgt = str(extracted.get("target_entity_text", "")).lower().strip()
        if gt_tgt not in ext_tgt and ext_tgt not in gt_tgt:
            return False
            
    return True


def run_full_evaluation():
    pipeline = NLPProcessingPipeline()
    print("\n" + "=" * 78)
    print("      CRIMINAL NETWORK INTELLIGENCE PLATFORM — NLP SYSTEM EVALUATION")
    print("=" * 78)
    print(f"Loaded Gold Standard Benchmark: {len(GOLD_STANDARD_DATASET)} Documents across 15 Crime Categories\n")

    # Metrics collectors
    ent_type_counts = defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0})
    role_confusion = defaultdict(lambda: defaultdict(int))
    role_counts = defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0})
    rel_counts = defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0})
    
    total_forbidden_checks = 0
    forbidden_violations = []
    negation_tp = 0
    negation_fn = 0
    
    per_doc_summary = []

    for doc in GOLD_STANDARD_DATASET:
        doc_id = doc["id"]
        text = doc["text"]
        gt = doc["ground_truth"]
        
        result = pipeline.process_document(text, document_id=doc_id)
        ext_entities = result.get("entities", [])
        ext_relationships = result.get("relationships", [])
        
        # 1. Evaluate Entities
        matched_gt_indices = set()
        matched_ext_indices = set()
        
        for gt_idx, gt_ent in enumerate(gt.get("entities", [])):
            for ext_idx, ext_ent in enumerate(ext_entities):
                if ext_idx in matched_ext_indices:
                    continue
                if entity_matches(ext_ent, gt_ent):
                    matched_gt_indices.add(gt_idx)
                    matched_ext_indices.add(ext_idx)
                    ent_type_counts[gt_ent["type"]]["tp"] += 1
                    
                    # Evaluate role classification if PERSON
                    if gt_ent.get("type") == "PERSON":
                        expected_role = gt_ent.get("role", "UNKNOWN")
                        predicted_role = ext_ent.get("role", "UNKNOWN")
                        role_confusion[expected_role][predicted_role] += 1
                        if expected_role == predicted_role:
                            role_counts[expected_role]["tp"] += 1
                        else:
                            role_counts[expected_role]["fn"] += 1
                            role_counts[predicted_role]["fp"] += 1
                    break
            else:
                # Ground truth entity missed
                ent_type_counts[gt_ent["type"]]["fn"] += 1
                if gt_ent.get("type") == "PERSON":
                    expected_role = gt_ent.get("role", "UNKNOWN")
                    role_counts[expected_role]["fn"] += 1
        
        # False positive entities: extracted entities that didn't match any ground truth
        for ext_idx, ext_ent in enumerate(ext_entities):
            if ext_idx not in matched_ext_indices:
                ent_type_counts[ext_ent.get("type", "UNKNOWN")]["fp"] += 1

        # 2. Evaluate Relationships
        matched_gt_rels = set()
        matched_ext_rels = set()
        
        for gt_r_idx, gt_rel in enumerate(gt.get("relationships", [])):
            for ext_r_idx, ext_rel in enumerate(ext_relationships):
                if ext_r_idx in matched_ext_rels:
                    continue
                if rel_matches(ext_rel, gt_rel):
                    matched_gt_rels.add(gt_r_idx)
                    matched_ext_rels.add(ext_r_idx)
                    rel_counts[gt_rel["rel_type"]]["tp"] += 1
                    break
            else:
                rel_counts[gt_rel["rel_type"]]["fn"] += 1
                
        for ext_r_idx, ext_rel in enumerate(ext_relationships):
            if ext_r_idx not in matched_ext_rels:
                r_type = ext_rel.get("relationship_type", "UNKNOWN")
                rel_counts[r_type]["fp"] += 1

        # 3. Evaluate Guardrails & Forbidden Relationships
        for f_rel in gt.get("forbidden_relationships", []):
            total_forbidden_checks += 1
            for ext_rel in ext_relationships:
                if ext_rel.get("relationship_type") == f_rel.get("rel_type"):
                    src = f_rel.get("source", "").lower()
                    ext_src = str(ext_rel.get("source_entity_text", "")).lower()
                    if src in ext_src or ext_src in src:
                        # Check status condition if specified
                        if f_rel.get("status"):
                            if ext_rel.get("status") == f_rel.get("status"):
                                forbidden_violations.append({
                                    "doc_id": doc_id,
                                    "violation": f_rel,
                                    "extracted": ext_rel
                                })
                        else:
                            forbidden_violations.append({
                                "doc_id": doc_id,
                                "violation": f_rel,
                                "extracted": ext_rel
                            })

        # 4. Evaluate Negation Detection
        for neg_spec in gt.get("negations", []):
            expected_neg = neg_spec.get("is_negated", True)
            # Check if any sentence with this snippet is detected as negated in pipeline
            snippet = neg_spec.get("sentence_contains", "").lower()
            neg_found = any(
                snippet in sent.get("text", "").lower() and sent.get("has_negation", False)
                for sent in result.get("sentences", [])
            )
            if neg_found == expected_neg:
                negation_tp += 1
            else:
                negation_fn += 1

        per_doc_summary.append({
            "doc_id": doc_id,
            "title": doc["title"],
            "entities_found": len(ext_entities),
            "relationships_found": len(ext_relationships),
            "gt_entities": len(gt.get("entities", [])),
            "gt_relationships": len(gt.get("relationships", [])),
        })

    # ── Summary Calculations ──────────────────────────────────────────────────
    
    # 1. Entity Metrics
    total_ent_tp = sum(c["tp"] for c in ent_type_counts.values())
    total_ent_fp = sum(c["fp"] for c in ent_type_counts.values())
    total_ent_fn = sum(c["fn"] for c in ent_type_counts.values())
    overall_ent_micro = calc_prf(total_ent_tp, total_ent_fp, total_ent_fn)
    
    macro_p = [calc_prf(c["tp"], c["fp"], c["fn"])["precision"] for c in ent_type_counts.values() if (c["tp"]+c["fn"]) > 0]
    macro_r = [calc_prf(c["tp"], c["fp"], c["fn"])["recall"] for c in ent_type_counts.values() if (c["tp"]+c["fn"]) > 0]
    macro_f1 = [calc_prf(c["tp"], c["fp"], c["fn"])["f1"] for c in ent_type_counts.values() if (c["tp"]+c["fn"]) > 0]
    
    overall_ent_macro = {
        "precision": round(sum(macro_p) / len(macro_p), 4) if macro_p else 0.0,
        "recall": round(sum(macro_r) / len(macro_r), 4) if macro_r else 0.0,
        "f1": round(sum(macro_f1) / len(macro_f1), 4) if macro_f1 else 0.0,
    }

    # 2. Role Classification Metrics
    total_role_tp = sum(c["tp"] for c in role_counts.values())
    total_role_fp = sum(c["fp"] for c in role_counts.values())
    total_role_fn = sum(c["fn"] for c in role_counts.values())
    role_accuracy = total_role_tp / (total_role_tp + total_role_fn) if (total_role_tp + total_role_fn) > 0 else 0.0
    overall_role_micro = calc_prf(total_role_tp, total_role_fp, total_role_fn)

    # 3. Relationship Metrics
    total_rel_tp = sum(c["tp"] for c in rel_counts.values())
    total_rel_fp = sum(c["fp"] for c in rel_counts.values())
    total_rel_fn = sum(c["fn"] for c in rel_counts.values())
    overall_rel_micro = calc_prf(total_rel_tp, total_rel_fp, total_rel_fn)

    # 4. Guardrails / Negation Metrics
    guardrail_compliance = (total_forbidden_checks - len(forbidden_violations)) / total_forbidden_checks if total_forbidden_checks > 0 else 1.0
    total_neg_samples = negation_tp + negation_fn
    negation_acc = negation_tp / total_neg_samples if total_neg_samples > 0 else 1.0

    # 5. Composite System Score (Weighted Index / 100)
    # Weights: Entity F1 (30%), Role Accuracy (25%), Relationship F1 (25%), Safety/Guardrail (20%)
    composite_score = (
        (overall_ent_micro["f1"] * 30.0) +
        (role_accuracy * 25.0) +
        (overall_rel_micro["f1"] * 25.0) +
        (guardrail_compliance * 20.0)
    )

    # ── Console Output Rendering ──────────────────────────────────────────────
    print("\n" + "=" * 78)
    print(" 1. NAMED ENTITY RECOGNITION (NER) PERFORMANCE")
    print("=" * 78)
    print(f"{'Entity Type':<20} | {'Precision':<10} | {'Recall':<10} | {'F1 Score':<10} | {'TP':<5} | {'FP':<5} | {'FN':<5}")
    print("-" * 78)
    for etype in sorted(ent_type_counts.keys()):
        c = ent_type_counts[etype]
        m = calc_prf(c["tp"], c["fp"], c["fn"])
        print(f"{etype:<20} | {m['precision']:<10.1%} | {m['recall']:<10.1%} | {m['f1']:<10.1%} | {c['tp']:<5} | {c['fp']:<5} | {c['fn']:<5}")
    print("-" * 78)
    print(f"{'OVERALL (MICRO)':<20} | {overall_ent_micro['precision']:<10.1%} | {overall_ent_micro['recall']:<10.1%} | {overall_ent_micro['f1']:<10.1%} | {total_ent_tp:<5} | {total_ent_fp:<5} | {total_ent_fn:<5}")
    print(f"{'OVERALL (MACRO)':<20} | {overall_ent_macro['precision']:<10.1%} | {overall_ent_macro['recall']:<10.1%} | {overall_ent_macro['f1']:<10.1%}")

    print("\n" + "=" * 78)
    print(" 2. PERSON ROLE CLASSIFICATION PERFORMANCE")
    print("=" * 78)
    print(f"Classification Accuracy: {role_accuracy:.1%} ({total_role_tp}/{total_role_tp + total_role_fn} correct roles)")
    print("-" * 78)
    print(f"{'Person Role':<20} | {'Precision':<10} | {'Recall':<10} | {'F1 Score':<10} | {'Support':<8}")
    print("-" * 78)
    for role in sorted(role_counts.keys()):
        c = role_counts[role]
        support = c["tp"] + c["fn"]
        if support == 0 and c["fp"] == 0:
            continue
        m = calc_prf(c["tp"], c["fp"], c["fn"])
        print(f"{role:<20} | {m['precision']:<10.1%} | {m['recall']:<10.1%} | {m['f1']:<10.1%} | {support:<8}")

    print("\n" + "=" * 78)
    print(" 3. SEMANTIC RELATIONSHIP EXTRACTION PERFORMANCE")
    print("=" * 78)
    print(f"{'Relationship Type':<20} | {'Precision':<10} | {'Recall':<10} | {'F1 Score':<10} | {'TP':<5} | {'FP':<5} | {'FN':<5}")
    print("-" * 78)
    for rtype in sorted(rel_counts.keys()):
        c = rel_counts[rtype]
        m = calc_prf(c["tp"], c["fp"], c["fn"])
        print(f"{rtype:<20} | {m['precision']:<10.1%} | {m['recall']:<10.1%} | {m['f1']:<10.1%} | {c['tp']:<5} | {c['fp']:<5} | {c['fn']:<5}")
    print("-" * 78)
    print(f"{'OVERALL (MICRO)':<20} | {overall_rel_micro['precision']:<10.1%} | {overall_rel_micro['recall']:<10.1%} | {overall_rel_micro['f1']:<10.1%} | {total_rel_tp:<5} | {total_rel_fp:<5} | {total_rel_fn:<5}")

    print("\n" + "=" * 78)
    print(" 4. GUARDRAILS & SAFETY METRICS")
    print("=" * 78)
    print(f"Total Negative Intent Checks:  {total_neg_samples}")
    print(f"Negation Detection Accuracy:   {negation_acc:.1%}")
    print(f"Forbidden Relation Checks:     {total_forbidden_checks}")
    print(f"Forbidden Violations Detected: {len(forbidden_violations)}")
    print(f"Safety Compliance Rate:        {guardrail_compliance:.1%}")
    if forbidden_violations:
        print("\n[!] Violations Details:")
        for v in forbidden_violations:
            print(f"    Doc {v['doc_id']}: Expected blocked {v['violation']}, but got {v['extracted']}")

    print("\n" + "=" * 78)
    print(f" 5. OVERALL NLP SYSTEM SCORE: {composite_score:.1f} / 100")
    print("=" * 78)
    grade = "A+" if composite_score >= 90 else "A" if composite_score >= 80 else "B+" if composite_score >= 70 else "B"
    print(f"Engineering Rating: GRADE {grade} (Benchmark: Police Document Intelligence)\n")

    return {
        "composite_score": round(composite_score, 2),
        "grade": grade,
        "entity_micro": overall_ent_micro,
        "entity_macro": overall_ent_macro,
        "entity_per_type": {k: calc_prf(v["tp"], v["fp"], v["fn"]) for k, v in ent_type_counts.items()},
        "role_accuracy": round(role_accuracy, 4),
        "role_per_class": {k: calc_prf(v["tp"], v["fp"], v["fn"]) for k, v in role_counts.items()},
        "relationship_micro": overall_rel_micro,
        "relationship_per_type": {k: calc_prf(v["tp"], v["fp"], v["fn"]) for k, v in rel_counts.items()},
        "negation_accuracy": round(negation_acc, 4),
        "guardrail_compliance": round(guardrail_compliance, 4),
        "forbidden_violations": forbidden_violations,
    }


if __name__ == "__main__":
    results = run_full_evaluation()
    # Save results as JSON
    out_path = os.path.join(os.path.dirname(__file__), "evaluation_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Saved machine-readable metrics to: {out_path}")
