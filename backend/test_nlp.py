import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))
from app.nlp.pipeline import nlp_engine

sample_fir = """
FIRST INFORMATION REPORT
FIR No. 104/2025
Police Station: Rohini Sector 7, New Delhi
Acts and Sections: Section 302, 307, 120B IPC and Arms Act 25/54/59

BRIEF FACTS OF THE CASE:
On 12/03/2025 at 23:45 hours, complainant reported armed robbery.
Accused Ravi Kumar @ Ravan along with his associate Vikram Singh alias Vicky conspired to commit robbery.
Suspect Ravi Kumar was driving vehicle DL 01 AB 1234 registered in his name.
Vikram Singh used mobile phone +91-98765-32100 to contact gang members of Viper Syndicate in Gurgaon.
Cash of Rs. 45,00,000 was transferred to UPI suspect@okhdfcbank.
Suspects fled towards Karol Bagh.
"""

res = nlp_engine.process_text(sample_fir, case_id="FIR-104-2025")
print("=== SUMMARY ===")
print(res["summary"])
print("\n=== EXTRACTED ENTITIES ===")
for e in res["entities"]:
    print(f"[{e['label']}] -> {e['text']} (Confidence: {e.get('confidence', 0)})")

print("\n=== EXTRACTED RELATIONSHIPS ===")
for r in res["relationships"]:
    print(f"{r['source']}  --[{r['relation']}]-->  {r['target']}  (Type: {r.get('source_type')} -> {r.get('target_type')})")

print("\n=== RESOLVED CLUSTERS ===")
for c in res["resolved_clusters"]:
    print(f"Canonical: {c['canonical_name']} | Aliases: {c['aliases']} | Rationale: {c['rationale']}")
