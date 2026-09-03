import sys
import os
import json

# Ensure the backend directory is in the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

try:
    from app.nlp.pipeline import nlp_engine
except ImportError as e:
    print(f"Error importing NLP pipeline: {e}")
    sys.exit(1)

sample_fir_text = """
FIRST INFORMATION REPORT
State Police - New Delhi District
Police Station: Okhla Phase 1
Date: 03-09-2026

Brief Facts of the Case:
On 02-09-2026 at approximately 14:30 hrs, a complaint was received regarding an illegal arms deal taking place near the Okhla industrial area. 
The primary suspect, Vikram Singh alias Vicky, was seen operating a black SUV bearing vehicle number DL-8C-AA-1122.
Vikram Singh was spotted at a warehouse along with his associate, Rahul Yadav. They are believed to be members of the notorious Lawrence Syndicate.
During the operation, Constable Ramesh intercepted a phone call from mobile number +91-9876543210 which was traced back to Vikram Singh.
A cash amount of Rs 500,000 was transferred between the parties.
Case registered under Sections 302 and 120B of the IPC. 
Investigation is ongoing.
"""

def run_demo():
    print("=" * 60)
    print("CRIMENEXUS AI - NLP ENGINE DEMO (MVP)")
    print("=" * 60)
    print("\n[INPUT] Raw Indian Police FIR Text:")
    print("-" * 60)
    print(sample_fir_text.strip())
    print("-" * 60)
    
    print("\n[PROCESSING] Running Hybrid NLP Extraction Pipeline...")
    results = nlp_engine.process_text(sample_fir_text, case_id="FIR-2026-DL-001")
    
    print("\n[SUCCESS] Extraction Complete!")
    print("\n=== EXTRACTED ENTITIES ===")
    
    # Group entities by label for clean display
    entities_by_label = {}
    for ent in results['entities']:
        label = ent['label']
        if label not in entities_by_label:
            entities_by_label[label] = []
        entities_by_label[label].append(ent['text'])
        
    for label, items in entities_by_label.items():
        print(f" {label}:")
        for item in set(items):
            print(f"   - {item}")
            
    print("\n=== EXTRACTED RELATIONSHIPS ===")
    if results['relationships']:
        for rel in results['relationships']:
            source = rel.get('source_entity') or rel.get('subject') or list(rel.values())[0] if rel else "Unknown"
            relation = rel.get('relationship') or rel.get('predicate') or "RELATED_TO"
            target = rel.get('target_entity') or rel.get('object') or list(rel.values())[1] if len(rel) > 1 else "Unknown"
            print(f" * {source} --[{relation}]--> {target}")
    else:
        print(" * (Extracted via NLP Rules - no explicit rules matched for this text, LLM enhancement recommended)")

    print("\n=== MVP SUMMARY METRICS ===")
    print(json.dumps(results['summary'], indent=2))
    print("\n" + "=" * 60)

if __name__ == "__main__":
    run_demo()
