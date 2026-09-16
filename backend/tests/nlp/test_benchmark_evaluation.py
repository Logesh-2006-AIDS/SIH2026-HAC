"""
Pytest Suite for NLP Benchmark Evaluation
==========================================
Runs evaluation tests ensuring minimum performance thresholds:
  - Entity Micro F1 >= 0.70
  - Role Classification Accuracy >= 0.75
  - Guardrail Compliance Rate >= 0.95
"""

import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from tests.nlp.evaluate_nlp_system import run_full_evaluation


class TestNLPBenchmarkEvaluation:
    @classmethod
    def setup_class(cls):
        cls.results = run_full_evaluation()

    def test_entity_f1_threshold(self):
        micro_f1 = self.results["entity_micro"]["f1"]
        assert micro_f1 >= 0.70, f"Entity Micro F1 ({micro_f1:.2f}) below threshold 0.70"

    def test_role_accuracy_threshold(self):
        acc = self.results["role_accuracy"]
        assert acc >= 0.75, f"Role accuracy ({acc:.2f}) below threshold 0.75"

    def test_guardrail_safety_compliance(self):
        compliance = self.results["guardrail_compliance"]
        assert compliance >= 0.95, f"Guardrail compliance ({compliance:.2f}) below 0.95"

    def test_composite_score_threshold(self):
        score = self.results["composite_score"]
        assert score >= 75.0, f"Composite score ({score:.1f}) below 75.0"
