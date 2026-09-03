"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Explainable Semantic Relationship Extractor
"""
import re
from typing import List, Dict, Any, Tuple
from app.nlp.preprocessor import LegalTextPreprocessor

class RelationshipExtractor:
    """
    Extracts semantic relationships between extracted entities from sentence-level context.
    Every relationship includes:
    - Subject Entity
    - Predicate / Relation Type (e.g. CO_ACCUSED, OWNS_VEHICLE, CALLED, OPERATES_IN)
    - Object Entity
    - Exact Evidence Sentence (for judicial & police explainability)
    - Confidence Score
    """

    def __init__(self):
        self.preprocessor = LegalTextPreprocessor()

    def extract_relationships(self, text: str, entities: List[Dict[str, Any]], fir_id: str = "FIR-CURRENT") -> List[Dict[str, Any]]:
        relationships: List[Dict[str, Any]] = []
        sentences = self.preprocessor.split_sentences(text)

        # Categorize entities by type
        persons = [e for e in entities if e["label"] in ("SUSPECT_PERSON", "PERSON", "ALIAS")]
        phones = [e for e in entities if e["label"] == "PHONE_NUMBER"]
        vehicles = [e for e in entities if e["label"] == "VEHICLE_NUMBER"]
        locations = [e for e in entities if e["label"] == "LOCATION"]
        orgs = [e for e in entities if e["label"] in ("CRIMINAL_ORGANIZATION", "ORGANIZATION")]
        legal_sections = [e for e in entities if e["label"] == "LEGAL_SECTION"]
        financials = [e for e in entities if e["label"] in ("FINANCIAL_AMOUNT", "UPI_ID", "CRYPTO_WALLET")]

        # 1. FIR Mention Links (Connect every core entity to the FIR node)
        for ent in entities:
            if ent["label"] in ("SUSPECT_PERSON", "PERSON", "CRIMINAL_ORGANIZATION", "VEHICLE_NUMBER", "LEGAL_SECTION"):
                relationships.append({
                    "source": ent.get("normalized", ent["text"]),
                    "source_type": ent["label"],
                    "relation": "MENTIONED_IN" if ent["label"] != "SUSPECT_PERSON" else "ACCUSED_IN",
                    "target": fir_id,
                    "target_type": "FIR_RECORD",
                    "confidence": 0.98,
                    "evidence": f"Entity {ent['text']} identified in case document {fir_id}."
                })

        # 2. Extract Sentence-Level Relations
        for sent in sentences:
            sent_lower = sent.lower()

            # Find entities present in this sentence
            sent_persons = [p for p in persons if p["text"].lower() in sent_lower or p.get("normalized", "").lower() in sent_lower]
            sent_phones = [ph for ph in phones if ph["text"] in sent or ph.get("normalized", "") in sent]
            sent_vehicles = [v for v in vehicles if v["text"].replace("-", " ") in sent or v.get("normalized", "") in sent.replace("-", "")]
            sent_locs = [l for l in locations if l["text"].lower() in sent_lower]
            sent_orgs = [o for o in orgs if o["text"].lower() in sent_lower]
            sent_secs = [s for s in legal_sections if s["text"].lower() in sent_lower]
            sent_fin = [f for f in financials if f["text"].lower() in sent_lower]

            # 2A. Co-accused / Conspiracy / Association (Multiple persons in one sentence)
            if len(sent_persons) >= 2:
                for i in range(len(sent_persons)):
                    for j in range(i + 1, len(sent_persons)):
                        p1 = sent_persons[i]
                        p2 = sent_persons[j]
                        if p1.get("normalized") != p2.get("normalized"):
                            # Determine relation type based on sentence trigger words
                            rel_type = "ASSOCIATE_OF"
                            if any(w in sent_lower for w in ["conspired", "along with", "co-accused", "accomplice", "jointly", "partner"]):
                                rel_type = "CO_ACCUSED"
                            elif any(w in sent_lower for w in ["paid", "transferred", "sent money", "received"]):
                                rel_type = "FINANCIAL_TRANSACTION"
                            elif any(w in sent_lower for w in ["called", "contacted", "spoke to"]):
                                rel_type = "COMMUNICATED_WITH"

                            relationships.append({
                                "source": p1.get("normalized", p1["text"]),
                                "source_type": p1["label"],
                                "relation": rel_type,
                                "target": p2.get("normalized", p2["text"]),
                                "target_type": p2["label"],
                                "confidence": 0.92 if rel_type == "CO_ACCUSED" else 0.85,
                                "evidence": sent
                            })

            # 2B. Person <-> Vehicle (Ownership / Driving / Getaway)
            for p in sent_persons:
                for v in sent_vehicles:
                    rel_type = "OWNS_VEHICLE"
                    if any(w in sent_lower for w in ["drove", "fled in", "spotted in", "travelled in", "escaped in"]):
                        rel_type = "OPERATED_VEHICLE"
                    elif any(w in sent_lower for w in ["registered to", "owner of"]):
                        rel_type = "REGISTERED_OWNER_OF"

                    relationships.append({
                        "source": p.get("normalized", p["text"]),
                        "source_type": p["label"],
                        "relation": rel_type,
                        "target": v.get("normalized", v["text"]),
                        "target_type": "VEHICLE_NUMBER",
                        "confidence": 0.94,
                        "evidence": sent
                    })

            # 2C. Person <-> Phone Number
            for p in sent_persons:
                for ph in sent_phones:
                    relationships.append({
                        "source": p.get("normalized", p["text"]),
                        "source_type": p["label"],
                        "relation": "USES_PHONE",
                        "target": ph.get("normalized", ph["text"]),
                        "target_type": "PHONE_NUMBER",
                        "confidence": 0.95,
                        "evidence": sent
                    })

            # 2D. Person <-> Location (Spotted / Resides / Operates)
            for p in sent_persons:
                for loc in sent_locs:
                    rel_type = "SPOTTED_AT"
                    if any(w in sent_lower for w in ["resident of", "living in", "address", "house in"]):
                        rel_type = "RESIDES_AT"
                    elif any(w in sent_lower for w in ["operates in", "hideout in", "active in"]):
                        rel_type = "OPERATES_IN"

                    relationships.append({
                        "source": p.get("normalized", p["text"]),
                        "source_type": p["label"],
                        "relation": rel_type,
                        "target": loc.get("normalized", loc["text"]),
                        "target_type": "LOCATION",
                        "confidence": 0.89,
                        "evidence": sent
                    })

            # 2E. Person <-> Gang / Syndicate
            for p in sent_persons:
                for org in sent_orgs:
                    relationships.append({
                        "source": p.get("normalized", p["text"]),
                        "source_type": p["label"],
                        "relation": "MEMBER_OF" if "gang" in org["text"].lower() or "syndicate" in org["text"].lower() else "ASSOCIATED_WITH_ORG",
                        "target": org.get("normalized", org["text"]),
                        "target_type": org["label"],
                        "confidence": 0.91,
                        "evidence": sent
                    })

            # 2F. Person <-> Legal Section
            for p in sent_persons:
                for sec in sent_secs:
                    relationships.append({
                        "source": p.get("normalized", p["text"]),
                        "source_type": p["label"],
                        "relation": "BOOKED_UNDER",
                        "target": sec.get("normalized", sec["text"]),
                        "target_type": "LEGAL_SECTION",
                        "confidence": 0.93,
                        "evidence": sent
                    })

        # Deduplicate relationships
        deduped = []
        seen = set()
        for r in relationships:
            key = (r["source"].lower(), r["relation"], r["target"].lower())
            if key not in seen and r["source"].lower() != r["target"].lower():
                seen.add(key)
                deduped.append(r)

        return deduped
