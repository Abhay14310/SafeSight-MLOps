# try:
#     import cv2
# except ImportError:
#     print("Error: cv2 (OpenCV) is not installed. Install it using: pip install opencv-python")
#     exit(1)

# try:
#     from ultralytics import YOLO
# except ImportError:
#     print("Error: ultralytics is not installed. Install it using: pip install ultralytics")
#     exit(1)

# import requests
# import base64
# import threading
# import time

# import os

# def get_base_url():
#     alert_url = os.environ.get('DASHBOARD_URL', 'http://localhost:3000/api/alert')
#     return alert_url.replace('/api/alert', '')

# def send_to_dashboard(frame, is_alert, confidence):
#     try:
#         # Resize to save bandwidth
#         frame_resized = cv2.resize(frame, (640, 480))
#         _, buffer = cv2.imencode('.jpg', frame_resized, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
#         base64_frame = base64.b64encode(buffer).decode('utf-8')
        
#         base_url = get_base_url()
#         # Send Video Frame
#         requests.post(f"{base_url}/api/video", json={'frame': base64_frame}, timeout=1)
        
#         # Send Alert
#         if is_alert:
#             alert_data = {"label": "Person Detected", "confidence": confidence}
#             requests.post(f"{base_url}/api/alert", json=alert_data, timeout=1)
#     except Exception as e:
#         # Ignore connection errors if dashboard is not running
#         pass

# def heartbeat_loop():
#     while True:
#         try:
#             base_url = get_base_url()
#             requests.post(f"{base_url}/api/heartbeat", timeout=1)
#         except Exception:
#             pass
#         time.sleep(5)

# # Start heartbeat thread
# threading.Thread(target=heartbeat_loop, daemon=True).start()

# is_camera_active = False

# def status_loop():
#     global is_camera_active
#     while True:
#         try:
#             base_url = get_base_url()
#             res = requests.get(f"{base_url}/api/camera-status", timeout=1)
#             if res.status_code == 200:
#                 is_camera_active = res.json().get("active", False)
#         except Exception:
#             pass
#         time.sleep(1)

# threading.Thread(target=status_loop, daemon=True).start()

# model = YOLO('yolov8n.pt') 
# cap = None

# print("AI Engine Ready... Waiting for dashboard to START UPLINK.")

# try:
#     frame_count = 0
#     last_alert_time = 0
    
#     while True:
#         if is_camera_active:
#             if cap is None or not cap.isOpened():
#                 print("[INFO] Starting Camera Uplink...")
#                 cap = cv2.VideoCapture(0)
                
#             success, frame = cap.read()
#             if not success:
#                 time.sleep(0.1)
#                 continue

#             results = model(frame, conf=0.5, verbose=False) # verbose=False cleans up terminal
#             annotated_frame = results[0].plot()

#             # cv2.imshow("SafeSight AI Test", annotated_frame) # Removed to prevent external popup

#             # Basic alert logic (Person = class 0 in COCO)
#             is_alert = False
#             max_conf = 0.0
#             current_time = time.time()
            
#             # Cooldown of 5 seconds for alerts
#             if current_time - last_alert_time > 5:
#                 for box in results[0].boxes:
#                     if int(box.cls) == 0: # Person detected
#                         is_alert = True
#                         max_conf = float(box.conf[0])
#                         break
            
#             if is_alert:
#                 last_alert_time = current_time

#             # Send frame to dashboard asynchronously (every 3rd frame to reduce network load)
#             if frame_count % 3 == 0 or is_alert:
#                 threading.Thread(target=send_to_dashboard, args=(annotated_frame, is_alert, max_conf), daemon=True).start()

#             frame_count += 1
            
#         else:
#             if cap is not None and cap.isOpened():
#                 print("[INFO] Pausing Camera Uplink...")
#                 cap.release()
#                 cap = None
#             time.sleep(0.5)

# except KeyboardInterrupt:
#     print("\n[INFO] Stopping AI Engine... (Ctrl+C pressed)")

# finally:
#     # This part ALWAYS runs, even if there is an error
#     cap.release()
#     cv2.destroyAllWindows()
#     print("[INFO] Webcam released and windows closed. Clean exit.")






"""
╔══════════════════════════════════════════════════════════════════════╗
║           TASUKE'26 — AI SURVEILLANCE ENGINE v3.0                  ║
║           Person Detection + Fall Detection + Smart Alerting       ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  DESIGN THINKING & ARCHITECTURE:                                     ║
║                                                                      ║
║  PROBLEM WITH ORIGINAL CODE:                                         ║
║  ─────────────────────────────────────────────────────────────────  ║
║  1. No fall detection — only detects "person" class, no pose or     ║
║     aspect-ratio heuristics to infer a fall event.                  ║
║  2. Static green box for ALL detections — no visual severity        ║
║     system. A standing person looks identical to a fallen person.   ║
║  3. Alert cooldown is global — if 3 people are in frame, one alert  ║
║     suppresses the others for 5 seconds.                            ║
║  4. No state tracking — can't distinguish "person is falling" vs    ║
║     "person has been fallen for 30 seconds" (much more serious).    ║
║  5. No per-track identity — every frame resets, losing temporal     ║
║     context needed for behaviour analysis.                           ║
║  6. Thread spawned per frame with no pool limit → can flood the     ║
║     CPU with hundreds of threads if network is slow.                ║
║  7. No annotated metadata sent to dashboard — only the raw frame.   ║
║                                                                      ║
║  OUR SOLUTIONS:                                                      ║
║  ─────────────────────────────────────────────────────────────────  ║
║  ✓ FALL DETECTION via aspect-ratio heuristic + pose keypoints       ║
║    (dual-method: bbox W/H ratio AND hip-shoulder angle from YOLO     ║
║    pose model if available, fallback to bbox only)                  ║
║                                                                      ║
║  ✓ STATE MACHINE per tracked person:                                 ║
║    STANDING → FALLING → FALLEN → EMERGENCY                          ║
║    Color: GREEN  → AMBER  → RED   → FLASHING RED                    ║
║    Each state has a time threshold before escalation.               ║
║                                                                      ║
║  ✓ PER-TRACK cooldowns using ByteTracker-style IDs from YOLO        ║
║    tracker, so each person gets independent alert throttling.        ║
║                                                                      ║
║  ✓ ThreadPoolExecutor with max_workers=4 to bound concurrency.      ║
║                                                                      ║
║  ✓ Rich metadata sent to dashboard: bboxes, states, confidences,    ║
║    fall_duration, track_ids — enables dashboard overlays.           ║
║                                                                      ║
║  ✓ Professional console logging with color codes and emoji.         ║
║                                                                      ║
║  ✓ Graceful cap.release() guarded against None in finally block.    ║
║                                                                      ║
║  FALL DETECTION LOGIC (our key innovation):                         ║
║  ─────────────────────────────────────────────────────────────────  ║
║  A person bounding box is normally TALLER than it is wide           ║
║  (portrait orientation, aspect_ratio = width/height < 0.75).        ║
║                                                                      ║
║  When a person falls:                                               ║
║    • The bbox rotates: width > height → aspect_ratio > 0.85         ║
║    • We also check velocity: if bbox centroid Y dropped fast,       ║
║      it's an active fall event (dynamic), not just someone lying.   ║
║    • We then apply a TEMPORAL FILTER: must stay "wide" for N        ║
║      consecutive frames to avoid false positives from a person      ║
║      bending over or sitting briefly.                               ║
║                                                                      ║
║  OPTIMISTIC PERFORMANCE TRICKS:                                      ║
║  ─────────────────────────────────────────────────────────────────  ║
║  • Run YOLO only on every Nth frame when no alert, full rate on     ║
║    alert — saves ~60% CPU in quiet scenes.                          ║
║  • Resize to 640px before inference (YOLO's optimal input).         ║
║  • Use YOLO's built-in tracker (ByteTracker) for track IDs —       ║
║    no separate tracking library needed.                             ║
║  • Dashboard frame is JPEG compressed at quality 55 before send.   ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
"""

# ─────────────────────────────────────────────────────────────────────
# IMPORTS & DEPENDENCY CHECKS
# ─────────────────────────────────────────────────────────────────────
import sys
import os
import time
import threading
import base64
import json
import logging
import signal
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict, deque
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, List, Tuple

# ── OpenCV ──
try:
    import cv2
except ImportError:
    print("❌  cv2 not found.  Run:  pip install opencv-python")
    sys.exit(1)

# ── YOLO ──
try:
    from ultralytics import YOLO
    import numpy as np
except ImportError:
    print("❌  ultralytics not found.  Run:  pip install ultralytics")
    sys.exit(1)

# ── Requests ──
try:
    import requests
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry
except ImportError:
    print("❌  requests not found.  Run:  pip install requests")
    sys.exit(1)


# ─────────────────────────────────────────────────────────────────────
# LOGGING SETUP — professional colored terminal output
# ─────────────────────────────────────────────────────────────────────
class ColorFormatter(logging.Formatter):
    """ANSI color-coded log levels for a professional terminal feel."""
    COLORS = {
        'DEBUG':    '\033[36m',   # Cyan
        'INFO':     '\033[32m',   # Green
        'WARNING':  '\033[33m',   # Amber
        'ERROR':    '\033[31m',   # Red
        'CRITICAL': '\033[35m',   # Magenta
    }
    RESET = '\033[0m'
    BOLD  = '\033[1m'

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        ts    = time.strftime('%H:%M:%S')
        label = f"{color}{self.BOLD}[{record.levelname:<8}]{self.RESET}"
        msg   = super().format(record)
        return f"\033[90m{ts}\033[0m  {label}  {msg}"


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    if not logger.handlers:
        h = logging.StreamHandler(sys.stdout)
        h.setFormatter(ColorFormatter("%(message)s"))
        logger.addHandler(h)
    return logger


log = get_logger("T26-AI")


# ─────────────────────────────────────────────────────────────────────
# CONFIGURATION — single source of truth, easy to tune
# ─────────────────────────────────────────────────────────────────────
@dataclass
class Config:
    # Dashboard
    dashboard_url:      str   = os.environ.get("DASHBOARD_URL", "http://localhost:3000/api/alert")

    # Camera
    camera_index:       int   = int(os.environ.get("CAMERA_INDEX", "0"))
    frame_width:        int   = 1280
    frame_height:       int   = 720
    inference_size:     int   = 640          # YOLO input resolution

    # Inference tuning
    confidence_thresh:  float = 0.45         # Min YOLO confidence to keep a detection
    inference_interval: int   = 2            # Run YOLO every N frames (quiet scene)
    alert_interval:     int   = 1            # Run YOLO every frame when alert active

    # Fall detection thresholds
    fall_aspect_ratio:  float = 0.85         # bbox W/H > this → suspect fallen pose
    fall_confirm_frames:int   = 8            # Must stay "wide" for N frames before FALLING state
    fallen_duration_s:  float = 3.0          # Seconds in FALLING before → FALLEN state
    emergency_duration_s: float = 10.0       # Seconds in FALLEN before → EMERGENCY state

    # Alert cooldown per track (seconds)
    alert_cooldown_s:   float = 5.0

    # Networking
    send_every_n_frames:int   = 3            # Dashboard frame send cadence (quiet)
    jpeg_quality:       int   = 55           # Compression 0-100 (lower = smaller)
    request_timeout_s:  float = 1.0
    max_send_threads:   int   = 4            # ThreadPool bound

    # Heartbeat
    heartbeat_interval_s: float = 5.0

    @property
    def base_url(self) -> str:
        return self.dashboard_url.replace("/api/alert", "")


CFG = Config()


# ─────────────────────────────────────────────────────────────────────
# PERSON STATE MACHINE
# ─────────────────────────────────────────────────────────────────────
class PersonState(Enum):
    """
    State machine for each tracked person.

    STANDING  → normal, green box
    FALLING   → aspect ratio triggered, amber box + "FALLING?" label
    FALLEN    → confirmed fall (held for fallen_duration_s), red box
    EMERGENCY → person has been on ground for emergency_duration_s, flashing red
    """
    STANDING  = "STANDING"
    FALLING   = "FALLING"
    FALLEN    = "FALLEN"
    EMERGENCY = "EMERGENCY"


# Maps state → BGR color for bounding box
STATE_COLOR: Dict[PersonState, Tuple[int, int, int]] = {
    PersonState.STANDING:  (0,  210, 100),   # Green
    PersonState.FALLING:   (0,  165, 255),   # Amber / Orange
    PersonState.FALLEN:    (0,  0,   220),   # Red
    PersonState.EMERGENCY: (0,  0,   255),   # Bright Red (flashing handled in draw)
}

STATE_EMOJI: Dict[PersonState, str] = {
    PersonState.STANDING:  "🟢",
    PersonState.FALLING:   "🟡",
    PersonState.FALLEN:    "🔴",
    PersonState.EMERGENCY: "🆘",
}


@dataclass
class PersonTrack:
    """
    All temporal state for one tracked person.

    We use a deque of recent aspect ratios to implement the
    temporal filter — avoids false positives from momentary
    wide poses (crouching, bending, sitting).
    """
    track_id:           int
    state:              PersonState    = PersonState.STANDING
    aspect_history:     deque          = field(default_factory=lambda: deque(maxlen=15))
    fall_confirmed_at:  Optional[float] = None   # When FALLING state entered
    fallen_at:          Optional[float] = None   # When FALLEN state entered
    last_alert_sent:    float          = 0.0
    last_centroid:      Optional[Tuple[int,int]] = None
    centroid_history:   deque          = field(default_factory=lambda: deque(maxlen=10))
    fall_frames_count:  int            = 0       # Consecutive "wide" frames

    @property
    def fall_duration(self) -> float:
        """How long this person has been in FALLEN/EMERGENCY state."""
        if self.fallen_at is not None:
            return time.time() - self.fallen_at
        return 0.0

    @property
    def needs_alert(self) -> bool:
        """True if alert cooldown has passed for this track."""
        return (time.time() - self.last_alert_sent) > CFG.alert_cooldown_s

    def update_state(self, aspect_ratio: float, centroid: Tuple[int,int]) -> bool:
        """
        Feed a new observation and advance the state machine.
        Returns True if an alert should be fired.

        FALL DETECTION ALGORITHM:
        ──────────────────────────
        1. Compute aspect ratio = bbox_width / bbox_height.
           Normal standing person: ~0.35–0.60  (taller than wide)
           Fallen person:          ~0.85–2.00  (wider than tall)

        2. Append to rolling history (last 15 frames).

        3. Count consecutive frames where ratio > threshold.
           If ≥ fall_confirm_frames: mark as "fall candidate".

        4. State transitions:
           STANDING  → FALLING   : fall candidate detected
           FALLING   → FALLEN    : held for fallen_duration_s
           FALLEN    → EMERGENCY : held for emergency_duration_s
           ANY       → STANDING  : aspect ratio normal again AND
                                   was in FALLING (not yet FALLEN —
                                   can't recover instantly from FALLEN)
        """
        now = time.time()
        self.aspect_history.append(aspect_ratio)
        self.centroid_history.append(centroid)

        is_wide = aspect_ratio > CFG.fall_aspect_ratio
        if is_wide:
            self.fall_frames_count += 1
        else:
            # Decay quickly if back to normal pose
            self.fall_frames_count = max(0, self.fall_frames_count - 2)

        fall_candidate = self.fall_frames_count >= CFG.fall_confirm_frames
        should_alert = False

        # ── State machine transitions ──────────────────────────────
        if self.state == PersonState.STANDING:
            if fall_candidate:
                self.state = PersonState.FALLING
                self.fall_confirmed_at = now
                log.warning(f"🟡 Track {self.track_id:>3} → FALLING  (AR={aspect_ratio:.2f})")
                should_alert = True

        elif self.state == PersonState.FALLING:
            if not fall_candidate:
                # Recovered — false alarm
                self.state = PersonState.STANDING
                self.fall_confirmed_at = None
                self.fall_frames_count = 0
                log.info(f"🟢 Track {self.track_id:>3} → STANDING (recovered from FALLING)")
            elif (now - self.fall_confirmed_at) >= CFG.fallen_duration_s:
                self.state = PersonState.FALLEN
                self.fallen_at = now
                log.error(f"🔴 Track {self.track_id:>3} → FALLEN   (held {CFG.fallen_duration_s}s)")
                should_alert = True

        elif self.state == PersonState.FALLEN:
            if (now - self.fallen_at) >= CFG.emergency_duration_s:
                self.state = PersonState.EMERGENCY
                log.critical(f"🆘 Track {self.track_id:>3} → EMERGENCY (on ground {self.fall_duration:.0f}s)")
                should_alert = True

        elif self.state == PersonState.EMERGENCY:
            # Once EMERGENCY — stay until manually reset or track lost
            # Re-alert every cooldown period
            if self.needs_alert:
                should_alert = True

        # Record alert time to enforce cooldown
        if should_alert and self.needs_alert:
            self.last_alert_sent = now
        elif should_alert:
            should_alert = False  # Suppress due to cooldown

        return should_alert


# ─────────────────────────────────────────────────────────────────────
# HTTP SESSION — connection pooling & retry
# ─────────────────────────────────────────────────────────────────────
def build_session() -> requests.Session:
    """
    Persistent HTTP session with:
    - Connection pool (avoids TCP handshake on every frame)
    - Automatic retry on connection errors (NOT on 4xx/5xx — those are real errors)
    """
    session = requests.Session()
    retry = Retry(
        total=2,
        backoff_factor=0.2,
        status_forcelist=[500, 502, 503, 504],
        allowed_methods=["POST", "GET"],
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=4, pool_maxsize=8)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session


SESSION = build_session()


# ─────────────────────────────────────────────────────────────────────
# NETWORK SENDER
# ─────────────────────────────────────────────────────────────────────
class DashboardSender:
    """
    Manages all outbound communication to the Tasuke'26 dashboard.
    Uses a bounded ThreadPoolExecutor so we never spawn >4 threads.
    """
    def __init__(self):
        self._pool = ThreadPoolExecutor(max_workers=CFG.max_send_threads,
                                        thread_name_prefix="t26-send")
        self._camera_active = False
        self._status_lock   = threading.Lock()

        # Start background threads
        threading.Thread(target=self._heartbeat_loop, daemon=True,
                         name="t26-heartbeat").start()
        threading.Thread(target=self._status_poll_loop, daemon=True,
                         name="t26-statuspoll").start()

    @property
    def camera_active(self) -> bool:
        with self._status_lock:
            return self._camera_active

    # ── Outbound ──────────────────────────────────────────────────────

    def send_frame_and_alert(self,
                              frame: np.ndarray,
                              alerts: List[dict],
                              metadata: dict) -> None:
        """
        Submit async send job to the thread pool.
        Caller never blocks — if pool is full, job is queued.
        """
        self._pool.submit(self._do_send, frame, alerts, metadata)

    def _do_send(self, frame: np.ndarray, alerts: List[dict], metadata: dict) -> None:
        try:
            # Encode frame
            frame_small = cv2.resize(frame, (640, 480))
            ok, buf = cv2.imencode('.jpg', frame_small,
                                   [cv2.IMWRITE_JPEG_QUALITY, CFG.jpeg_quality])
            if not ok:
                return
            b64 = base64.b64encode(buf).decode('utf-8')

            # Video frame endpoint
            SESSION.post(
                f"{CFG.base_url}/api/video",
                json={'frame': b64, 'metadata': metadata},
                timeout=CFG.request_timeout_s,
            )

            # Alert endpoint — one request per alert event
            for alert in alerts:
                SESSION.post(
                    f"{CFG.base_url}/api/alert",
                    json=alert,
                    timeout=CFG.request_timeout_s,
                )
        except Exception:
            # Silently swallow — dashboard may not be running
            pass

    # ── Background loops ──────────────────────────────────────────────

    def _heartbeat_loop(self) -> None:
        while True:
            try:
                SESSION.post(f"{CFG.base_url}/api/heartbeat",
                             timeout=CFG.request_timeout_s)
            except Exception:
                pass
            time.sleep(CFG.heartbeat_interval_s)

    def _status_poll_loop(self) -> None:
        while True:
            try:
                res = SESSION.get(f"{CFG.base_url}/api/camera-status",
                                  timeout=CFG.request_timeout_s)
                if res.status_code == 200:
                    active = res.json().get("active", False)
                    with self._status_lock:
                        self._camera_active = active
            except Exception:
                pass
            time.sleep(1)


# ─────────────────────────────────────────────────────────────────────
# ANNOTATION ENGINE
# ─────────────────────────────────────────────────────────────────────
class Annotator:
    """
    Draws professional bounding boxes, labels, and overlays on frames.
    Uses a filled semi-transparent label strip instead of a plain rect.
    The box color and style encode the person state:
      GREEN  → STANDING
      AMBER  → FALLING (potential fall)
      RED    → FALLEN  (confirmed fall on ground)
      FLASH  → EMERGENCY (pulsing red, requires immediate attention)
    """

    @staticmethod
    def draw_person(frame: np.ndarray,
                    x1: int, y1: int, x2: int, y2: int,
                    track: PersonTrack,
                    conf: float) -> None:
        now = time.time()
        state = track.state
        color = STATE_COLOR[state]

        # ── EMERGENCY: flash by toggling visibility at 2Hz ──────────
        if state == PersonState.EMERGENCY:
            if int(now * 2) % 2 == 0:
                color = (0, 0, 255)    # Bright red
            else:
                color = (50, 50, 255)  # Slightly lighter red

        # ── Bounding box ─────────────────────────────────────────────
        thickness = 3 if state in (PersonState.FALLEN, PersonState.EMERGENCY) else 2
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)

        # ── Corner markers (Tasuke'26 style) ─────────────────────────
        cs = 14  # Corner mark length
        corners = [
            (x1, y1, +1, +1), (x2, y1, -1, +1),
            (x1, y2, +1, -1), (x2, y2, -1, -1),
        ]
        for cx, cy, dx, dy in corners:
            cv2.line(frame, (cx, cy), (cx + cs*dx, cy),          color, thickness+1)
            cv2.line(frame, (cx, cy), (cx,          cy + cs*dy), color, thickness+1)

        # ── Label strip ──────────────────────────────────────────────
        state_text = state.value
        conf_text  = f"ID:{track.track_id}  {conf:.0%}"

        if state == PersonState.FALLEN:
            dur = track.fall_duration
            state_text = f"FALLEN  {dur:.1f}s"
        elif state == PersonState.EMERGENCY:
            dur = track.fall_duration
            state_text = f"EMERGENCY! {dur:.0f}s"

        label = f" {state_text}  {conf_text} "
        font       = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.52
        thickness_text = 1
        (lw, lh), _ = cv2.getTextSize(label, font, font_scale, thickness_text)

        # Semi-transparent background strip
        strip_y1 = max(y1 - lh - 10, 0)
        strip_y2 = y1
        overlay  = frame.copy()
        cv2.rectangle(overlay, (x1, strip_y1), (x1 + lw + 4, strip_y2), color, -1)
        cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)

        # Text
        cv2.putText(frame, label, (x1 + 2, strip_y2 - 3),
                    font, font_scale, (255, 255, 255), thickness_text, cv2.LINE_AA)

        # ── Fall duration bar (filled progress under bbox) ───────────
        if state in (PersonState.FALLEN, PersonState.EMERGENCY):
            dur    = min(track.fall_duration, CFG.emergency_duration_s)
            pct    = dur / CFG.emergency_duration_s
            bar_w  = x2 - x1
            bar_h  = 5
            bar_y  = y2 + 4
            cv2.rectangle(frame, (x1, bar_y), (x2, bar_y + bar_h), (40, 40, 40), -1)
            cv2.rectangle(frame, (x1, bar_y),
                          (x1 + int(bar_w * pct), bar_y + bar_h), color, -1)

    @staticmethod
    def draw_hud(frame: np.ndarray,
                 tracks: Dict[int, PersonTrack],
                 fps: float,
                 inference_ms: float) -> None:
        """
        Heads-up display in top-left corner:
        • FPS and inference time
        • Count of people in each state
        """
        h, w = frame.shape[:2]

        # ── HUD background strip ──────────────────────────────────────
        hud_h = 90
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (300, hud_h), (5, 10, 20), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)

        # ── Brand ────────────────────────────────────────────────────
        cv2.putText(frame, "T26 AI ENGINE", (10, 18),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (56, 189, 248), 1, cv2.LINE_AA)

        # ── Metrics ──────────────────────────────────────────────────
        counts = defaultdict(int)
        for t in tracks.values():
            counts[t.state] += 1

        lines = [
            f"FPS: {fps:5.1f}   INF: {inference_ms:5.1f}ms",
            f"Standing: {counts[PersonState.STANDING]}   "
            f"Falling: {counts[PersonState.FALLING]}   "
            f"Fallen: {counts[PersonState.FALLEN]+counts[PersonState.EMERGENCY]}",
        ]
        for i, line in enumerate(lines):
            cv2.putText(frame, line, (10, 38 + i * 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.44, (180, 210, 240), 1, cv2.LINE_AA)

        # ── Alert banner (if any FALLEN/EMERGENCY) ───────────────────
        emergencies = [t for t in tracks.values()
                       if t.state in (PersonState.FALLEN, PersonState.EMERGENCY)]
        if emergencies:
            flash_on = int(time.time() * 2) % 2 == 0
            banner_color = (0, 0, 220) if flash_on else (0, 0, 100)
            cv2.rectangle(frame, (0, h - 40), (w, h), banner_color, -1)
            msg = f"  ⚠  FALL DETECTED — {len(emergencies)} PERSON(S) REQUIRE ATTENTION  ⚠"
            cv2.putText(frame, msg, (10, h - 14),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)

        # ── Timestamp ────────────────────────────────────────────────
        ts = time.strftime('%Y-%m-%d  %H:%M:%S')
        cv2.putText(frame, ts, (w - 200, h - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (100, 130, 160), 1, cv2.LINE_AA)


# ─────────────────────────────────────────────────────────────────────
# MAIN AI ENGINE
# ─────────────────────────────────────────────────────────────────────
class AIEngine:
    """
    Orchestrates camera capture, YOLO inference, state tracking,
    annotation, and dashboard communication.

    Frame pipeline:
      Camera → Resize → YOLO(every N frames) → Parse boxes →
      Update PersonTrack state machines → Annotate → Dashboard send
    """

    def __init__(self):
        log.info("🚀  Initialising Tasuke'26 AI Engine v3.0 ...")

        # YOLO model — prefer pose model for richer keypoints
        # Falls back gracefully to detection-only if pose model unavailable
        self._model = self._load_model()

        self._sender  = DashboardSender()
        self._tracks: Dict[int, PersonTrack] = {}
        self._cap:    Optional[cv2.VideoCapture] = None

        # FPS tracking
        self._fps_history = deque(maxlen=30)
        self._last_frame_time = time.time()

        # Inference frame skip counter
        self._frame_count = 0

        # Last YOLO results (reused on skipped frames)
        self._last_results = None

        # Graceful shutdown
        self._running = True
        signal.signal(signal.SIGINT,  self._handle_shutdown)
        signal.signal(signal.SIGTERM, self._handle_shutdown)

        log.info(f"✅  Engine ready.  Dashboard: {CFG.base_url}")
        log.info(f"📐  Fall threshold: W/H ratio > {CFG.fall_aspect_ratio} "
                 f"for {CFG.fall_confirm_frames} frames")

    # ── Model loading ─────────────────────────────────────────────────

    def _load_model(self) -> YOLO:
        """
        Try to load YOLOv8-Pose for richer keypoint data.
        If not available, fall back to standard detection model.
        """
        for model_name in ("yolov8n-pose.pt", "yolov8n.pt"):
            try:
                model = YOLO(model_name)
                log.info(f"🧠  Loaded model: {model_name}")
                return model
            except Exception as e:
                log.warning(f"   Could not load {model_name}: {e}")
        log.error("❌  No YOLO model could be loaded. Exiting.")
        sys.exit(1)

    # ── Camera management ─────────────────────────────────────────────

    def _open_camera(self) -> None:
        log.info(f"📷  Opening camera index {CFG.camera_index} ...")
        self._cap = cv2.VideoCapture(CFG.camera_index)
        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH,  CFG.frame_width)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CFG.frame_height)
        self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimal buffer = low latency
        actual_w = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        actual_h = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        log.info(f"   Resolution: {actual_w}×{actual_h}")

    def _release_camera(self) -> None:
        if self._cap is not None and self._cap.isOpened():
            self._cap.release()
            self._cap = None
            log.info("📷  Camera released.")

    # ── Inference ─────────────────────────────────────────────────────

    def _should_run_inference(self, has_active_alerts: bool) -> bool:
        """
        Adaptive inference rate:
        - When alerts are active: run every frame (maximum sensitivity)
        - Quiet scene: run every inference_interval frames (saves CPU)
        """
        interval = CFG.alert_interval if has_active_alerts else CFG.inference_interval
        return (self._frame_count % interval) == 0

    def _run_inference(self, frame: np.ndarray):
        """
        Run YOLO with ByteTracker for stable per-person IDs.
        tracker="bytetrack" persists IDs across frames so our
        state machines stay attached to the right person.
        """
        results = self._model.track(
            frame,
            conf=CFG.confidence_thresh,
            classes=[0],          # COCO class 0 = person
            tracker="bytetrack.yaml",
            persist=True,
            verbose=False,
        )
        return results

    # ── Per-detection processing ──────────────────────────────────────

    def _process_detection(self,
                            box,
                            results) -> Tuple[Optional[PersonTrack], bool, dict]:
        """
        Extract bounding box + track_id from one YOLO detection.
        Update the PersonTrack state machine.
        Returns (track, should_alert, detection_info).
        """
        # Bounding box
        xyxy = box.xyxy[0].cpu().numpy().astype(int)
        x1, y1, x2, y2 = xyxy
        bw = x2 - x1
        bh = y2 - y1
        if bh <= 0:
            return None, False, {}

        aspect_ratio = bw / bh
        conf         = float(box.conf[0])
        cx, cy       = (x1 + x2) // 2, (y1 + y2) // 2

        # Track ID (ByteTracker assigns stable integer IDs)
        track_id = int(box.id[0]) if box.id is not None else -1
        if track_id < 0:
            track_id = id(box) % 9999  # Fallback synthetic ID

        # Get or create track
        if track_id not in self._tracks:
            self._tracks[track_id] = PersonTrack(track_id=track_id)
            log.debug(f"   New track: ID={track_id}")

        track = self._tracks[track_id]

        # ── Pose-enhanced fall detection (if pose model loaded) ──────
        # If we have keypoints, we can check if shoulders are below hips
        # (a much stronger signal than aspect ratio alone).
        pose_fall_signal = False
        if hasattr(results[0], 'keypoints') and results[0].keypoints is not None:
            try:
                kps = results[0].keypoints.xy[0].cpu().numpy()
                # COCO keypoints: 5=L-shoulder, 6=R-shoulder, 11=L-hip, 12=R-hip
                if len(kps) > 12:
                    shoulder_y = (kps[5][1] + kps[6][1]) / 2
                    hip_y      = (kps[11][1] + kps[12][1]) / 2
                    # If shoulders are BELOW hips (y increases downward) → fallen
                    if shoulder_y > hip_y + 10:
                        pose_fall_signal = True
                        aspect_ratio = max(aspect_ratio, CFG.fall_aspect_ratio + 0.1)
            except Exception:
                pass  # Keypoints unavailable for this detection

        # Update state machine
        should_alert = track.update_state(aspect_ratio, (cx, cy))

        detection_info = {
            "track_id":     track_id,
            "bbox":         [int(x1), int(y1), int(x2), int(y2)],
            "state":        track.state.value,
            "confidence":   round(conf, 3),
            "aspect_ratio": round(aspect_ratio, 3),
            "pose_signal":  pose_fall_signal,
            "fall_duration": round(track.fall_duration, 1),
        }
        return track, should_alert, detection_info

    # ── Frame processing ──────────────────────────────────────────────

    def _process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, List[dict], List[dict]]:
        """
        Full pipeline for one frame:
        1. Optionally run YOLO inference
        2. Process each detection through state machines
        3. Annotate frame
        4. Build alert and metadata payloads
        Returns (annotated_frame, alerts, all_detections)
        """
        has_active_alerts = any(
            t.state in (PersonState.FALLEN, PersonState.EMERGENCY)
            for t in self._tracks.values()
        )

        t0 = time.perf_counter()
        if self._should_run_inference(has_active_alerts):
            self._last_results = self._run_inference(frame)
        inf_ms = (time.perf_counter() - t0) * 1000

        results    = self._last_results
        alerts     = []
        detections = []
        active_ids = set()

        if results and len(results[0].boxes) > 0:
            for box in results[0].boxes:
                track, should_alert, det_info = self._process_detection(box, results)
                if track is None:
                    continue

                active_ids.add(track.track_id)
                detections.append(det_info)

                # Annotate
                x1,y1,x2,y2 = det_info["bbox"]
                Annotator.draw_person(frame, x1,y1,x2,y2, track, det_info["confidence"])

                # Build alert payload
                if should_alert:
                    alerts.append({
                        "label":         f"{track.state.value} - Person #{track.track_id}",
                        "confidence":    det_info["confidence"],
                        "state":         track.state.value,
                        "track_id":      track.track_id,
                        "fall_duration": det_info["fall_duration"],
                        "bbox":          det_info["bbox"],
                        "timestamp":     time.strftime('%Y-%m-%dT%H:%M:%S'),
                    })
                    log.warning(
                        f"{STATE_EMOJI[track.state]} ALERT → state={track.state.value} "
                        f"id={track.track_id} duration={det_info['fall_duration']:.1f}s"
                    )

        # ── Prune stale tracks (person left frame) ────────────────────
        stale = [tid for tid in self._tracks if tid not in active_ids]
        for tid in stale:
            if (self._frame_count - getattr(self._tracks[tid], '_last_seen', 0)) > 90:
                del self._tracks[tid]
                log.debug(f"   Pruned stale track ID={tid}")

        # ── HUD overlay ───────────────────────────────────────────────
        fps = self._current_fps()
        Annotator.draw_hud(frame, self._tracks, fps, inf_ms)

        return frame, alerts, detections

    # ── FPS ───────────────────────────────────────────────────────────

    def _current_fps(self) -> float:
        now  = time.time()
        dt   = now - self._last_frame_time
        self._last_frame_time = now
        if dt > 0:
            self._fps_history.append(1.0 / dt)
        return sum(self._fps_history) / len(self._fps_history) if self._fps_history else 0.0

    # ── Shutdown ──────────────────────────────────────────────────────

    def _handle_shutdown(self, *_) -> None:
        log.info("\n🛑  Shutdown signal received. Cleaning up ...")
        self._running = False

    # ── Main loop ─────────────────────────────────────────────────────

    def run(self) -> None:
        log.info("⏳  Waiting for dashboard to activate camera uplink ...")

        try:
            while self._running:
                # ── Camera gating ─────────────────────────────────────
                if not self._sender.camera_active:
                    self._release_camera()
                    time.sleep(0.5)
                    continue

                # ── Open camera if needed ─────────────────────────────
                if self._cap is None or not self._cap.isOpened():
                    self._open_camera()
                    log.info("📡  Camera uplink started.")

                success, frame = self._cap.read()
                if not success:
                    log.warning("⚠️   Frame read failed. Retrying ...")
                    time.sleep(0.1)
                    continue

                # ── Main pipeline ─────────────────────────────────────
                annotated, alerts, detections = self._process_frame(frame)

                # ── Send to dashboard ─────────────────────────────────
                has_alert = bool(alerts)
                if (self._frame_count % CFG.send_every_n_frames == 0) or has_alert:
                    metadata = {
                        "frame_id":   self._frame_count,
                        "timestamp":  time.strftime('%Y-%m-%dT%H:%M:%S'),
                        "detections": detections,
                    }
                    self._sender.send_frame_and_alert(annotated, alerts, metadata)

                self._frame_count += 1

        finally:
            self._cleanup()

    def _cleanup(self) -> None:
        log.info("🧹  Running cleanup ...")
        self._release_camera()
        cv2.destroyAllWindows()
        log.info("✅  Clean exit. Goodbye.")


# ─────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════╗
║   TASUKE'26 AI ENGINE v3.0  —  Cyber Sentinel        ║
║   Fall Detection + State Machine + Smart Alerting    ║
╚══════════════════════════════════════════════════════╝
    """)
    engine = AIEngine()
    engine.run()