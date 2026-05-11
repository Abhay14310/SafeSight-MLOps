"""
test_accuracy.py — Fall Detection Accuracy Benchmark
=====================================================
Generates synthetic scenarios and measures:
  • Precision   = TP / (TP + FP)
  • Recall      = TP / (TP + FN)
  • F1 Score    = 2 * P*R / (P+R)
  • False Positive Rate

Scenarios tested:
  1. Normal standing (should never trigger alert)
  2. Clear fall sequence (should always trigger alert)
  3. Sitting/crouching (should NOT trigger fall alert)
  4. Brief stumble, quick recovery (should NOT escalate to FALLEN)
  5. Prolonged fall → EMERGENCY (should escalate correctly)

Run:
    cd ai-engine
    pytest tests/test_accuracy.py -v -s
"""

import importlib
import os
import sys
import time
from dataclasses import dataclass, field
from typing import List, Tuple
from unittest.mock import MagicMock, patch

import pytest

# ── Path setup ──────────────────────────────────────────────────────────────
SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)


def _load_detection():
    """
    Import and return the project's `detection` module with several heavy external dependencies replaced by mocks.
    
    The function ensures any previously loaded `detection` entry is removed from sys.modules, then patches import resolution so that modules like `cv2`, `ultralytics`, `requests`, and `urllib3` (and select submodules) resolve to MagicMock instances while the real `numpy` is preserved. It then imports and returns the freshly loaded `detection` module.
    
    Returns:
        module: The imported `detection` module.
    """
    mocks = {
        "cv2": MagicMock(),
        "ultralytics": MagicMock(),
        "numpy": __import__("numpy"),
        "requests": MagicMock(),
        "urllib3": MagicMock(),
        "urllib3.util": MagicMock(),
        "urllib3.util.retry": MagicMock(),
        "requests.adapters": MagicMock(),
    }
    sys.modules.pop("detection", None)
    with patch.dict("sys.modules", mocks):
        return importlib.import_module("detection")


det = _load_detection()
PersonTrack = det.PersonTrack
PersonState = det.PersonState
CFG = det.CFG


# ═══════════════════════════════════════════════════════════════════════════
# Scenario runner
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class ScenarioResult:
    name: str
    expected_fall: bool          # Did we EXPECT a fall alert?
    alert_fired: bool            # Did the state machine fire an alert?
    final_state: str = ""
    notes: str = ""

    @property
    def correct(self) -> bool:
        """
        Indicates whether the scenario's alert outcome matches the expected fall label.
        
        Returns:
            bool: `true` if `alert_fired` equals `expected_fall`, `false` otherwise.
        """
        return self.alert_fired == self.expected_fall


def run_scenario(
    name: str,
    aspect_ratios: List[float],
    expected_fall: bool,
    time_injections: List[Tuple[int, float]] = None,
    pose_sit_signals: List[bool] = None,
) -> ScenarioResult:
    """
    Run a sequence of aspect-ratio frames through a PersonTrack and record whether a fall alert occurred.
    
    Parameters:
        name (str): Scenario name for the returned result.
        aspect_ratios (List[float]): Per-frame aspect-ratio values fed to PersonTrack.update_state.
        expected_fall (bool): Whether the scenario is expected to produce a fall alert.
        time_injections (List[Tuple[int, float]], optional): List of (frame_index, seconds_backdate) pairs.
            For each pair, when the loop reaches frame_index the track's timestamps (if set) are moved
            backwards by seconds_backdate to simulate elapsed time.
        pose_sit_signals (List[bool], optional): Per-frame sitting signals; defaults to all False.
    
    Returns:
        ScenarioResult: Aggregated result containing the scenario name, expected outcome, whether an
        alert fired at any frame, and the track's final state string.
    """
    track = PersonTrack(track_id=1)
    alert_fired = False

    sit_signals = pose_sit_signals or [False] * len(aspect_ratios)

    for i, (ar, sit_sig) in enumerate(zip(aspect_ratios, sit_signals)):
        # Inject a future timestamp if needed to simulate time passing
        if time_injections:
            for frame_idx, ts_override in time_injections:
                if i == frame_idx:
                    if track.fall_confirmed_at is not None:
                        track.fall_confirmed_at = time.time() - ts_override
                    if track.fallen_at is not None:
                        track.fallen_at = time.time() - ts_override

        result = track.update_state(ar, (320, 240), sit_sig)
        if result:
            alert_fired = True

    return ScenarioResult(
        name=name,
        expected_fall=expected_fall,
        alert_fired=alert_fired,
        final_state=track.state.value,
    )


# ═══════════════════════════════════════════════════════════════════════════
# Test Scenarios
# ═══════════════════════════════════════════════════════════════════════════

SCENARIOS = [
    # ── True Negative: Normal walking/standing — should NOT alert ──────────
    {
        "name": "Normal standing (60 frames)",
        "aspect_ratios": [0.40] * 60,
        "expected_fall": False,
    },
    {
        "name": "Normal walking (varying 0.3–0.6)",
        "aspect_ratios": [0.3, 0.4, 0.5, 0.45, 0.38, 0.42] * 10,
        "expected_fall": False,
    },
    # ── True Positive: Clear fall — MUST alert ─────────────────────────────
    {
        "name": "Clear fall (wide AR for 30 frames)",
        "aspect_ratios": [0.4] * 5 + [2.0] * 30,
        "expected_fall": True,
    },
    {
        "name": "Slow progressive fall (AR increasing to 1.8)",
        "aspect_ratios": [0.4, 0.5, 0.7, 1.0, 1.3, 1.5, 1.8] + [1.8] * 25,
        "expected_fall": True,
    },
    {
        "name": "Extreme fall (AR=3.5 for 25 frames)",
        "aspect_ratios": [3.5] * 25,
        "expected_fall": True,
    },
    # ── True Negative: Sitting — should NOT alert ──────────────────────────
    {
        "name": "Sitting down (AR=0.9, pose sit signal)",
        "aspect_ratios": [0.9] * 40,
        "expected_fall": False,
        "pose_sit_signals": [True] * 40,
    },
    # ── True Negative: Brief stumble + recovery ────────────────────────────
    {
        "name": "Brief stumble then recovery (< confirm_frames wide)",
        "aspect_ratios": [0.4] * 10 + [1.5] * (CFG.fall_confirm_frames - 5) + [0.4] * 20,
        "expected_fall": False,
    },
    # ── True Positive: Borderline fall (just above threshold) ─────────────
    {
        "name": "Borderline fall (AR=1.25, confirm_frames + 3)",
        "aspect_ratios": [0.4] * 5 + [1.25] * (CFG.fall_confirm_frames + 3),
        "expected_fall": True,
    },
    # ── True Negative: Crouching briefly then standing ────────────────────
    {
        "name": "Crouch and stand (only 3 wide frames)",
        "aspect_ratios": [0.4] * 10 + [1.3] * 3 + [0.4] * 15,
        "expected_fall": False,
    },
]


class TestAccuracyScenarios:
    """Run all scenarios and report individual results."""

    @pytest.mark.parametrize("scenario", SCENARIOS, ids=[s["name"] for s in SCENARIOS])
    def test_scenario(self, scenario):
        """
        Execute a predefined scenario through the scenario runner and assert the observed alert outcome matches the scenario's expectation.
        
        Parameters:
        	scenario (dict): Scenario definition with keys:
        		- "name" (str): Human-readable scenario name.
        		- "aspect_ratios" (List[float]): Per-frame aspect-ratio sequence fed to the track.
        		- "expected_fall" (bool): Whether a fall alert is expected for this scenario.
        		- "pose_sit_signals" (Optional[List[bool]]): Optional per-frame sit signals.
        """
        result = run_scenario(
            name=scenario["name"],
            aspect_ratios=scenario["aspect_ratios"],
            expected_fall=scenario["expected_fall"],
            pose_sit_signals=scenario.get("pose_sit_signals"),
        )
        assert result.correct, (
            f"\n{'='*60}\n"
            f"SCENARIO: {result.name}\n"
            f"Expected fall alert: {result.expected_fall}\n"
            f"Alert actually fired: {result.alert_fired}\n"
            f"Final state: {result.final_state}\n"
            f"{'='*60}"
        )


class TestAccuracyMetrics:
    """
    Compute and assert aggregate accuracy metrics across all scenarios.
    Prints a full report.
    """

    def test_overall_accuracy_report(self, capsys):
        """
        Compute and print aggregated detection metrics across the predefined scenarios and assert minimum performance thresholds.
        
        For each scenario this test runs the scenario runner, tallies true/false positives/negatives, derives precision, recall, F1 score, false-positive rate, and overall accuracy, prints a formatted report with the confusion matrix and per-scenario results, and asserts that precision, recall, and F1 are at least 80% while the false-positive rate is at most 30%.
        """
        results = []
        for scenario in SCENARIOS:
            r = run_scenario(
                name=scenario["name"],
                aspect_ratios=scenario["aspect_ratios"],
                expected_fall=scenario["expected_fall"],
                pose_sit_signals=scenario.get("pose_sit_signals"),
            )
            results.append(r)

        # ── Compute metrics ──────────────────────────────────────────────
        tp = sum(1 for r in results if r.expected_fall and r.alert_fired)
        fp = sum(1 for r in results if not r.expected_fall and r.alert_fired)
        fn = sum(1 for r in results if r.expected_fall and not r.alert_fired)
        tn = sum(1 for r in results if not r.expected_fall and not r.alert_fired)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall / (precision + recall)
              if (precision + recall) > 0 else 0.0)
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        accuracy = (tp + tn) / len(results) if results else 0.0

        print(f"\n\n{'='*72}")
        print(f"  TASUKE'26 FALL DETECTION -- ACCURACY REPORT")
        print(f"  Thresholds: AR>{CFG.fall_aspect_ratio}  "
              f"confirm_frames={CFG.fall_confirm_frames}  "
              f"fallen_after={CFG.fallen_duration_s}s")
        print(f"{'='*72}")
        print(f"  {'SCENARIO':<50} {'EXPECTED':>8} {'GOT':>8} {'PASS':>6}")
        sep = "-" * 72
        print(sep)
        for r in results:
            exp = "FALL" if r.expected_fall else "SAFE"
            got = "FALL" if r.alert_fired else "SAFE"
            ok = "[OK]" if r.correct else "[FAIL]"
            print(f"  {r.name:<50} {exp:>8} {got:>8} {ok:>8}")
        print(sep)
        print(f"\n  Confusion Matrix:")
        print(f"    TP={tp}  FP={fp}  FN={fn}  TN={tn}")
        print(f"\n  Metrics:")
        print(f"    Precision           : {precision:.1%}")
        print(f"    Recall (sensitivity): {recall:.1%}")
        print(f"    F1 Score            : {f1:.1%}")
        print(f"    False Positive Rate : {fpr:.1%}")
        print(f"    Overall Accuracy    : {accuracy:.1%}")
        print(f"{'='*72}\n")

        # ── Assert minimum acceptable accuracy ───────────────────────────
        assert precision >= 0.80, f"Precision too low: {precision:.1%} (need ≥80%)"
        assert recall >= 0.80, f"Recall too low: {recall:.1%} (need ≥80%)"
        assert f1 >= 0.80, f"F1 too low: {f1:.1%} (need ≥80%)"
        assert fpr <= 0.30, f"False positive rate too high: {fpr:.1%} (need ≤30%)"


class TestStateEscalation:
    """Verify the full escalation chain with time injection."""

    def test_full_escalation_chain(self):
        """STANDING → FALLING → FALLEN → EMERGENCY — full chain test."""
        track = PersonTrack(track_id=99)

        # Phase 1: Feed wide frames → FALLING
        for _ in range(CFG.fall_confirm_frames + 2):
            track.update_state(2.0, (320, 400))
        assert track.state == PersonState.FALLING, "Should be FALLING"

        # Phase 2: Fast-forward time → FALLEN
        track.fall_confirmed_at = time.time() - (CFG.fallen_duration_s + 0.5)
        track.update_state(2.0, (320, 400))
        assert track.state == PersonState.FALLEN, "Should be FALLEN"

        # Phase 3: Fast-forward time → EMERGENCY
        track.fallen_at = time.time() - (CFG.emergency_duration_s + 0.5)
        track.update_state(2.0, (320, 400))
        assert track.state == PersonState.EMERGENCY, "Should be EMERGENCY"

        print(f"\n[PASS] Full escalation chain: STANDING->FALLING->FALLEN->EMERGENCY")

    def test_fall_duration_reported_correctly(self):
        """fall_duration must return seconds elapsed since FALLEN state."""
        track = PersonTrack(track_id=88)
        track.fallen_at = time.time() - 7.5
        dur = track.fall_duration
        assert 7.0 < dur < 8.0, f"Expected ~7.5s, got {dur:.2f}s"
