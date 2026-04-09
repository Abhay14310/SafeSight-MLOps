try:
    import cv2
except ImportError:
    print("Error: cv2 (OpenCV) is not installed. Install it using: pip install opencv-python")
    exit(1)

try:
    from ultralytics import YOLO
except ImportError:
    print("Error: ultralytics is not installed. Install it using: pip install ultralytics")
    exit(1)

import requests
import base64
import threading
import time

import os

def get_base_url():
    alert_url = os.environ.get('DASHBOARD_URL', 'http://localhost:3000/api/alert')
    return alert_url.replace('/api/alert', '')

def send_to_dashboard(frame, is_alert, confidence):
    try:
        # Resize to save bandwidth
        frame_resized = cv2.resize(frame, (640, 480))
        _, buffer = cv2.imencode('.jpg', frame_resized, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
        base64_frame = base64.b64encode(buffer).decode('utf-8')
        
        base_url = get_base_url()
        # Send Video Frame
        requests.post(f"{base_url}/api/video", json={'frame': base64_frame}, timeout=1)
        
        # Send Alert
        if is_alert:
            alert_data = {"label": "Person Detected", "confidence": confidence}
            requests.post(f"{base_url}/api/alert", json=alert_data, timeout=1)
    except Exception as e:
        # Ignore connection errors if dashboard is not running
        pass

def heartbeat_loop():
    while True:
        try:
            base_url = get_base_url()
            requests.post(f"{base_url}/api/heartbeat", timeout=1)
        except Exception:
            pass
        time.sleep(5)

# Start heartbeat thread
threading.Thread(target=heartbeat_loop, daemon=True).start()

is_camera_active = False

def status_loop():
    global is_camera_active
    while True:
        try:
            base_url = get_base_url()
            res = requests.get(f"{base_url}/api/camera-status", timeout=1)
            if res.status_code == 200:
                is_camera_active = res.json().get("active", False)
        except Exception:
            pass
        time.sleep(1)

threading.Thread(target=status_loop, daemon=True).start()

model = YOLO('yolov8n.pt') 
cap = None

print("AI Engine Ready... Waiting for dashboard to START UPLINK.")

try:
    frame_count = 0
    last_alert_time = 0
    
    while True:
        if is_camera_active:
            if cap is None or not cap.isOpened():
                print("[INFO] Starting Camera Uplink...")
                cap = cv2.VideoCapture(0)
                
            success, frame = cap.read()
            if not success:
                time.sleep(0.1)
                continue

            results = model(frame, conf=0.5, verbose=False) # verbose=False cleans up terminal
            annotated_frame = results[0].plot()

            # cv2.imshow("SafeSight AI Test", annotated_frame) # Removed to prevent external popup

            # Basic alert logic (Person = class 0 in COCO)
            is_alert = False
            max_conf = 0.0
            current_time = time.time()
            
            # Cooldown of 5 seconds for alerts
            if current_time - last_alert_time > 5:
                for box in results[0].boxes:
                    if int(box.cls) == 0: # Person detected
                        is_alert = True
                        max_conf = float(box.conf[0])
                        break
            
            if is_alert:
                last_alert_time = current_time

            # Send frame to dashboard asynchronously (every 3rd frame to reduce network load)
            if frame_count % 3 == 0 or is_alert:
                threading.Thread(target=send_to_dashboard, args=(annotated_frame, is_alert, max_conf), daemon=True).start()

            frame_count += 1
            
        else:
            if cap is not None and cap.isOpened():
                print("[INFO] Pausing Camera Uplink...")
                cap.release()
                cap = None
            time.sleep(0.5)

except KeyboardInterrupt:
    print("\n[INFO] Stopping AI Engine... (Ctrl+C pressed)")

finally:
    # This part ALWAYS runs, even if there is an error
    cap.release()
    cv2.destroyAllWindows()
    print("[INFO] Webcam released and windows closed. Clean exit.")