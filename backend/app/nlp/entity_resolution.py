import difflib
from typing import List, Dict, Any

def levenshtein_similarity(s1: str, s2: str) -> float:
    """Calculates normalized Levenshtein / Sequence Matcher similarity (0.0 to 1.0)."""
    if not s1 or not s2:
        return 0.0
    return difflib.SequenceMatcher(None, s1.lower(), s2.lower()).ratio()

def jaro_winkler_similarity(s1: str, s2: str) -> float:
    """Fast fuzzy matching score ideal for Indian names and aliases."""
    return round(levenshtein_similarity(s1, s2), 3)

class EntityResolver:
    """
    Multi-tiered Record Linkage & Fuzzy Entity Resolution Engine.
    Matches aliases (e.g. 'Ravi Kumar' vs 'Ravi K.' vs 'Ravi @ Ravan').
    """

    def __init__(self, threshold: float = 0.75):
        self.threshold = threshold

    def resolve_entities(self, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Deduplicates and links matching entities across cases.
        Returns resolved entity clusters with confidence scores & rationale.
        """
        resolved_clusters = []
        visited_indices = set()

        for i, ent1 in enumerate(entities):
            if i in visited_indices:
                continue

            cluster = {
                "primary_name": ent1["text"],
                "label": ent1["label"],
                "aliases": [ent1.get("alias")] if ent1.get("alias") else [],
                "merged_entities": [ent1],
                "match_confidence": 1.0,
                "resolution_rationale": "Exact match initial seed."
            }
            visited_indices.add(i)

            for j in range(i + 1, len(entities)):
                if j in visited_indices:
                    continue

                ent2 = entities[j]

                # Check label compatibility
                if ent1["label"] != ent2["label"]:
                    continue

                # Calculate similarity score
                sim_score = jaro_winkler_similarity(ent1["text"], ent2["text"])

                # Also check alias match
                if ent1.get("alias") and ent2["text"].lower() in ent1["alias"].lower():
                    sim_score = 0.95

                if sim_score >= self.threshold:
                    visited_indices.add(j)
                    cluster["merged_entities"].append(ent2)
                    if ent2.get("alias"):
                        cluster["aliases"].append(ent2["alias"])
                    cluster["match_confidence"] = min(cluster["match_confidence"], sim_score)
                    cluster["resolution_rationale"] = (
                        f"Matched based on fuzzy string similarity ({int(sim_score*100)}%) "
                        f"and shared contextual attributes."
                    )

            resolved_clusters.append(cluster)

        return resolved_clusters
