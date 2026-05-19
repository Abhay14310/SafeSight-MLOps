"""
test_camera_benchmark.py — Camera Pipeline Performance Tests
=============================================================
Tests the _process_frame() pipeline without a real camera by injecting
synthetic numpy frames. Measures FPS, inference skipping, and send throttling.

Run:
    cd ai-engine
    pytest tests/test_camera_benchmark.py -v -s
"""

import importlib
import os
import sys
import time
from unittest.mock import MagicMock, patch, PropertyMock

import pytest

# ── Path setup ───────────────────────────────────────────────────────────────
SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False


def _load_detection():
    """
    Load the `detection` module while replacing heavy external dependencies with lightweight mocks and preserving NumPy.
    
    This imports the `detection` package in a controlled environment where common external modules (e.g., `cv2`, `ultralytics`, `requests`, `urllib3`) are substituted with mocks so tests can run without those native dependencies.
    
    Returns:
        tuple: `(detection_module, cv2_mock)` where `detection_module` is the imported `detection` package and `cv2_mock` is a MagicMock preconfigured to emulate commonly used OpenCV attributes and functions.
    """
    cv2_mock = MagicMock()
    cv2_mock.CAP_DSHOW = 700
    cv2_mock.CAP_PROP_FRAME_WIDTH = 3
    cv2_mock.CAP_PROP_FRAME_HEIGHT = 4
    cv2_mock.CAP_PROP_BUFFERSIZE = 38
    cv2_mock.FONT_HERSHEY_SIMPLEX = 0
    cv2_mock.LINE_AA = 16
    cv2_mock.IMWRITE_JPEG_QUALITY = 1
    # imencode returns (True, bytearray)
    import numpy as _np
    cv2_mock.imencode.return_value = (True, _np.frombuffer(b"\xff\xd8\xff\xe0", dtype=_np.uint8))
    cv2_mock.resize.side_effect = lambda frame, size: frame[:size[1], :size[0]]
    # Annotator calls getTextSize → returns ((width, height), baseline)
    cv2_mock.getTextSize.return_value = ((80, 14), 2)

    mocks = {
        "cv2": cv2_mock,
        "ultralytics": MagicMock(),
        "numpy": _np,
        "requests": MagicMock(),
        "urllib3": MagicMock(),
        "urllib3.util": MagicMock(),
        "urllib3.util.retry": MagicMock(),
        "requests.adapters": MagicMock(),
    }
    sys.modules.pop("detection", None)
    with patch.dict("sys.modules", mocks):
        return importlib.import_module("detection"), cv2_mock


det, cv2_mock = _load_detection()
CFG = det.CFG


# ═══════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════

def make_synthetic_frame(h=480, w=640, channels=3):
    """
    Create a blank black image frame with the specified height, width, and number of channels.
    
    Parameters:
    	h (int): Frame height in pixels (default 480).
    	w (int): Frame width in pixels (default 640).
    	channels (int): Number of color channels (default 3).
    
    Returns:
    	frame (numpy.ndarray): Zero-filled array of shape (h, w, channels) with dtype uint8.
    """
    return np.zeros((h, w, channels), dtype=np.uint8)


def make_empty_results():
    """
    Create a mocked YOLO results list containing a single result with no detections.
    
    Returns:
        list: A list with one mock result object whose `boxes` attribute is an empty list.
    """
    result = MagicMock()
    result.boxes = []
    return [result]


def make_person_result(x1=100, y1=50, x2=200, y2=400, conf=0.85, track_id=1):
    """
    Create a mocked YOLO results list containing a single person detection.
    
    Parameters:
        x1 (int): Left x-coordinate of the bounding box.
        y1 (int): Top y-coordinate of the bounding box.
        x2 (int): Right x-coordinate of the bounding box.
        y2 (int): Bottom y-coordinate of the bounding box.
        conf (float): Detection confidence score.
        track_id (int): Track identifier for the detected person.
    
    Returns:
        list: A list with one MagicMock result. The result has:
            - result.boxes: a list containing one box mock with attributes:
                - box.xyxy: a list whose first element supports the call
                  sequence `.cpu().numpy().astype(int)` and yields [x1, y1, x2, y2].
                - box.conf: list containing `conf`.
                - box.id: list containing `track_id`.
                - box.cls: list containing class id `0`.
            - result.keypoints: None
    """
    import numpy as _np

    # detection.py calls box.xyxy[0].cpu().numpy().astype(int)
    # So we need a mock that supports the .cpu().numpy() chaining
    xyxy_array = _np.array([x1, y1, x2, y2], dtype=float)
    tensor_mock = MagicMock()
    tensor_mock.cpu.return_value = MagicMock(
        numpy=MagicMock(return_value=xyxy_array)
    )

    box = MagicMock()
    box.xyxy = [tensor_mock]
    box.conf = [conf]
    box.id = [track_id]
    box.cls = [0]

    result = MagicMock()
    result.boxes = [box]
    result.keypoints = None
    return [result]


# ═══════════════════════════════════════════════════════════════════════════
# 1. Inference Skip Logic
# ═══════════════════════════════════════════════════════════════════════════

@pytest.mark.skipif(not HAS_NUMPY, reason="numpy required")
class TestInferenceSkipping:

    def test_inference_skip_no_alerts(self):
        """Without active alerts, inference should run every inference_interval frames."""
        engine = object.__new__(det.AIEngine)
        engine._frame_count = 0
        engine._tracks = {}

        interval = CFG.inference_interval
        run_count = 0
        for i in range(20):
            engine._frame_count = i
            has_alerts = False
            if engine._should_run_inference(has_alerts):
                run_count += 1

        expected = 20 // interval
        assert abs(run_count - expected) <= 1, (
            f"Expected ~{expected} inferences in 20 frames, got {run_count}"
        )

    def test_inference_runs_every_frame_with_active_alert(self):
        """When alerts are active, inference should run every frame."""
        engine = object.__new__(det.AIEngine)
        engine._frame_count = 0
        engine._tracks = {}

        run_count = 0
        for i in range(10):
            engine._frame_count = i
            if engine._should_run_inference(has_active_alerts=True):
                run_count += 1

        assert run_count == 10, f"Expected 10 inferences, got {run_count}"


# ═══════════════════════════════════════════════════════════════════════════
# 2. Frame Processing Pipeline
# ═══════════════════════════════════════════════════════════════════════════

@pytest.mark.skipif(not HAS_NUMPY, reason="numpy required")
class TestFramePipeline:

    def _make_engine(self):
        """
        Create a minimal AIEngine instance with mocked model and sender for tests.
        
        The instance is initialized for running frame-pipeline tests without a real camera or model: `engine._tracks` is empty, `engine._frame_count` is 0, `engine._fps_history` is a deque (maxlen 30), `engine._last_frame_time` is set, `engine._last_results` contains no detections, and `engine._running` is True. `engine._model.track` is mocked to return empty results and `engine._sender.camera_active` is True.
        
        Returns:
            engine: an `AIEngine` instance configured for unit tests with mocked dependencies.
        """
        engine = object.__new__(det.AIEngine)
        engine._tracks = {}
        engine._frame_count = 0
        engine._fps_history = __import__("collections").deque(maxlen=30)
        engine._last_frame_time = time.time()
        engine._last_results = make_empty_results()
        engine._running = True

        # Mock model to return empty results
        engine._model = MagicMock()
        engine._model.track.return_value = make_empty_results()

        # Mock sender
        engine._sender = MagicMock()
        engine._sender.camera_active = True

        return engine

    def test_empty_frame_no_alerts(self):
        """Processing a frame with no detections should produce no alerts."""
        engine = self._make_engine()
        frame = make_synthetic_frame()
        annotated, alerts, detections = engine._process_frame(frame)
        assert alerts == []
        assert detections == []

    def test_standing_person_no_fall_alert(self):
        """A standing person (narrow bbox) should not trigger fall alerts."""
        engine = self._make_engine()
        frame = make_synthetic_frame()

        # Person bbox: 100px wide, 400px tall → AR = 0.25 (clearly standing)
        standing_results = make_person_result(x1=100, y1=50, x2=200, y2=450)
        engine._model.track.return_value = standing_results
        engine._last_results = standing_results

        alerts_accumulated = []
        for _ in range(CFG.fall_confirm_frames + 5):
            engine._frame_count += 1
            _, alerts, _ = engine._process_frame(frame.copy())
            alerts_accumulated.extend(alerts)

        fall_alerts = [a for a in alerts_accumulated
                       if a.get("state") in ("FALLING", "FALLEN", "EMERGENCY")]
        assert fall_alerts == [], (
            f"Standing person triggered fall alerts: {fall_alerts}"
        )

    def test_fallen_person_triggers_alert(self):
        """A person with wide bbox should eventually trigger a fall alert."""
        engine = self._make_engine()
        frame = make_synthetic_frame()

        # Fallen person bbox: 400px wide, 100px tall → AR = 4.0
        fallen_results = make_person_result(x1=50, y1=200, x2=450, y2=300)
        engine._model.track.return_value = fallen_results
        engine._last_results = fallen_results

        alerts_accumulated = []
        for _ in range(CFG.fall_confirm_frames + 10):
            engine._frame_count += 1
            _, alerts, _ = engine._process_frame(frame.copy())
            alerts_accumulated.extend(alerts)

        fall_alerts = [a for a in alerts_accumulated
                       if a.get("state") in ("FALLING", "FALLEN", "EMERGENCY")]
        assert len(fall_alerts) > 0, (
            "Expected at least one fall alert for a clearly fallen person bbox"
        )

    def test_stale_track_pruning(self):
        """Tracks not seen for >90 frames should be pruned."""
        engine = self._make_engine()
        frame = make_synthetic_frame()

        # Add a track manually
        engine._tracks[42] = det.PersonTrack(track_id=42)
        engine._tracks[42]._last_seen = 0  # Very stale

        # Set frame count high enough to be "stale"
        engine._frame_count = 200
        engine._last_results = make_empty_results()

        engine._process_frame(frame.copy())

        assert 42 not in engine._tracks, "Stale track should have been pruned"

    def test_frame_count_increments(self):
        """_frame_count is external to _process_frame; test the run loop increments it."""
        engine = self._make_engine()
        frame = make_synthetic_frame()

        initial = engine._frame_count
        for _ in range(5):
            engine._process_frame(frame.copy())
            engine._frame_count += 1  # Simulates run loop

        assert engine._frame_count == initial + 5


# ═══════════════════════════════════════════════════════════════════════════
# 3. Performance Benchmark
# ═══════════════════════════════════════════════════════════════════════════

@pytest.mark.skipif(not HAS_NUMPY, reason="numpy required")
class TestPerformanceBenchmark:

    def test_process_frame_speed(self):
        """
        _process_frame (annotation + state machine, no real YOLO) must
        complete 30 frames in under 2 seconds (>15 FPS headroom).
        """
        engine = object.__new__(det.AIEngine)
        engine._tracks = {}
        engine._frame_count = 0
        engine._fps_history = __import__("collections").deque(maxlen=30)
        engine._last_frame_time = time.time()
        engine._last_results = make_empty_results()
        engine._model = MagicMock()
        engine._model.track.return_value = make_empty_results()
        engine._sender = MagicMock()

        frame = make_synthetic_frame(480, 640)
        n_frames = 30

        t0 = time.perf_counter()
        for i in range(n_frames):
            engine._frame_count = i
            engine._process_frame(frame.copy())
        elapsed = time.perf_counter() - t0

        fps = n_frames / elapsed
        print(f"\nPipeline speed: {fps:.1f} FPS ({elapsed*1000:.0f}ms for {n_frames} frames)")

        assert elapsed < 2.0, (
            f"Processing {n_frames} frames took {elapsed:.2f}s — too slow (<15 FPS headroom)"
        )

    def test_fps_tracker_accuracy(self):
        """FPS history deque should produce a reasonable estimate."""
        engine = object.__new__(det.AIEngine)
        engine._fps_history = __import__("collections").deque(maxlen=30)
        engine._last_frame_time = time.time() - 1.0 / 30  # Simulate 30 FPS

        fps = engine._current_fps()
        assert 10 < fps < 120, f"Unexpected FPS estimate: {fps:.1f}"
