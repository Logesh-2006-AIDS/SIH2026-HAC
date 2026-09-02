"""
================================================================================
SIH 2026 / INTERNAL HACKATHON NLP PIPELINE LIVE DEMO RUNNER
================================================================================
Target Event: Tomorrow's Internal Hackathon
Project: House-targaryen--2026 (SIH26189)
Description: Runs raw Indian Police FIR report through Phase 3 NLP Engine
             and displays extracted entities, relationships, aliases, and 
             explainable AI evidence rationales.
================================================================================
"""

import json
import sys
import os

# Ensure backend root is on Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.nlp.pipeline import nlp_pipeline

SAMPLE_FIR_TEXT = """
FIR No. 101/2026 PS Crime Branch Delhi.
On 12/05/2026, Inspector Sharma received intelligence regarding an illegal Hawala transaction network.
Accused Vikram Malhotra alias Viper, working as gang member of Shadow Syndicate, called associate Suresh Kumar 
on phone number +91-98765-43210. 

Suspect Vikram Malhotra transferred rupees 45,00,000 via Hawala transfer to bank account 9182736450.
Vehicle DL-01-AB-1234 was spotted at the hideout location. Suresh Kumar was arrested in FIR No. 101/2026.
"""

def main():
    print("=" * 80)
    print("  AURA-GRAPH // AI-POWERED CRIMINAL NETWORK ANALYSIS PLATFORM")
    print("  INTERNAL HACKATHON DEMO - PHASE 3 NLP PROCESSING ENGINE")
    print("=" * 80)

    print("\n[INPUT RAW POLICE FIR TEXT]:")
    print("-" * 60)
    print(SAMPLE_FIR_TEXT.strip())
    print("-" * 60)

    print("\n[RUNNING PHASE 3 NLP PIPELINE] (Cleaning -> NER -> Relationships -> Entity Resolution -> Explainability)...")
    result = nlp_pipeline.process_document(SAMPLE_FIR_TEXT, document_id="FIR-2026-101")

    print("\n[PIPELINE EXECUTION SUCCESSFUL]")
    print(f"Summary: {result['summary']['total_entities_extracted']} Entities | "
          f"{result['summary']['total_relationships_extracted']} Relationships | "
          f"{result['summary']['resolved_unique_entities']} Resolved Entity Clusters\n")

    print("--- [1. EXTRACTED ENTITIES & PATTERNS] ---")
    for ent in result["entities"]:
        alias_str = f" (Alias: {ent['alias']})" if ent.get("alias") else ""
        print(f"  * [{ent['label']}] {ent['text']}{alias_str} | Confidence: {int(ent['confidence']*100)}% | Extractor: {ent['extractor']}")

    print("\n--- [2. EXTRACTED SEMANTIC RELATIONSHIPS & EVIDENCE ANCHORING] ---")
    for rel in result["relationships"]:
        print(f"  * ({rel['subject']}) ---> [{rel['predicate']}] ---> ({rel['object']})")
        print(f"    |-- Evidence Rationale: {rel['explanation']}")

    print("\n--- [3. RESOLVED ENTITIES & ALIAS CLUSTERS] ---")
    for cluster in result["resolved_clusters"]:
        print(f"  * Primary Target: {cluster['primary_name']} (Type: {cluster['label']})")
        print(f"    |-- AI Rationale: {cluster['explainable_rationale']}")

    print("\n" + "=" * 80)
    print("  DEMO READY FOR TOMORROW'S HACKATHON JUDGES!")
    print("=" * 80)

if __name__ == "__main__":
    main()
