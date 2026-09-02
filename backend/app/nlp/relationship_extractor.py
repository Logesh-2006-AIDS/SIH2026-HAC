import re
from typing import List, Dict, Any
from app.nlp.preprocessor import LegalTextPreprocessor

# Target Crime Predicates & Trigger Keywords
PREDICATE_TRIGGERS = {
    "COMMUNICATES_WITH": ["called", "contacted", "messaged", "spoke to", "dialed", "phoned", "chat"],
    "ASSOCIATED_WITH": ["associate of", "partner of", "member of", "working with", "gang member", "accomplice"],
    "INVOLVED_IN": ["accused in", "suspect in", "arrested in", "named in", "mastermind of"],
    "FINANCIAL_TRANSFER_TO": ["transferred", "paid", "sent rupees", "hawala transfer", "account transfer", "received payment"],
    "OWNS": ["registered owner of", "drives vehicle", "subscriber of", "holds account"]
}

class RelationshipExtractor:
    """
    Extracts semantic triples (Subject) -> [PREDICATE] -> (Object) 
    and attaches exact source sentence excerpts for law-enforcement evidence anchoring.
    """

    def __init__(self):
        self.preprocessor = LegalTextPreprocessor()

    def extract_relationships(self, text: str, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        relationships = []
        sentences = self.preprocessor.split_into_sentences(text)

        for sent_idx, sentence in enumerate(sentences):
            # Find which entities exist in this specific sentence
            sent_entities = []
            for ent in entities:
                if ent["text"] in sentence or (ent.get("alias") and ent["alias"] in sentence):
                    sent_entities.append(ent)

            # Need at least 2 entities in the same sentence to infer a relation
            if len(sent_entities) >= 2:
                for i in range(len(sent_entities)):
                    for j in range(i + 1, len(sent_entities)):
                        sub = sent_entities[i]
                        obj = sent_entities[j]

                        # Detect predicate trigger words between sub and obj
                        detected_predicate = "ASSOCIATED_WITH"  # Default relationship
                        for pred, triggers in PREDICATE_TRIGGERS.items():
                            if any(trig in sentence.lower() for trig in triggers):
                                detected_predicate = pred
                                break

                        relationships.append({
                            "subject": sub["text"],
                            "subject_label": sub["label"],
                            "predicate": detected_predicate,
                            "object": obj["text"],
                            "object_label": obj["label"],
                            "confidence": round((sub["confidence"] + obj["confidence"]) / 2, 2),
                            "evidence": {
                                "sentence": sentence,
                                "sentence_index": sent_idx,
                            }
                        })

        return relationships
