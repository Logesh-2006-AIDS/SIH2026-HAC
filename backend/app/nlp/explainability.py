from typing import List, Dict, Any

class ExplainableAIScorer:
    """
    Generates transparent, evidence-backed confidence scores and human-readable 
    rationales for law enforcement investigators.
    """

    def __init__(self):
        pass

    def explain_relationship(self, rel: Dict[str, Any]) -> Dict[str, Any]:
        """Adds human-readable explanation to extracted relationship edge."""
        evidence_text = rel.get("evidence", {}).get("sentence", "")
        predicate = rel.get("predicate", "ASSOCIATED_WITH")
        subject = rel.get("subject")
        obj = rel.get("object")

        explanation = (
            f"Extracted relation [{predicate}] between '{subject}' and '{obj}' "
            f"with {int(rel['confidence']*100)}% confidence. Source Evidence: \"{evidence_text}\""
        )

        rel["explanation"] = explanation
        return rel

    def explain_entity_match(self, cluster: Dict[str, Any]) -> Dict[str, Any]:
        """Adds human-readable explanation for fuzzy entity matching."""
        primary = cluster.get("primary_name")
        aliases = cluster.get("aliases", [])
        conf = int(cluster.get("match_confidence", 1.0) * 100)

        if aliases:
            rationale = f"Entity '{primary}' linked to known alias(es): {', '.join(aliases)} with {conf}% AI match confidence."
        else:
            rationale = f"Entity '{primary}' established as unique target node with {conf}% confidence."

        cluster["explainable_rationale"] = rationale
        return cluster
