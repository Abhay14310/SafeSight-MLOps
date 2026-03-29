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

def send_to_dashboard(frame, is_alert, confidence):
    try:
        # Resize to save bandwidth
        frame_resized = cv2.resize(frame, (640, 480))
        _, buffer = cv2.imencode('.jpg', frame_resized, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
        base64_frame = base64.b64encode(buffer).decode('utf-8')
        
        # Send Video Frame
        requests.post('http://localhost:3000/api/video', json={'frame': base64_frame}, timeout=1)
        
        # Send Alert
        if is_alert:
            alert_data = {"label": "Person Detected", "confidence": confidence}
            requests.post('http://localhost:3000/api/alert', json=alert_data, timeout=1)
    except Exception as e:
        # Ignore connection errors if dashboard is not running
        pass

model = YOLO('yolov8n.pt') 
cap = cv2.VideoCapture(0)

print("AI Engine Running... Press 'q' or Ctrl+C to stop.")

try:
    frame_count = 0
    last_alert_time = 0
    
    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break

        results = model(frame, conf=0.5, verbose=False) # verbose=False cleans up terminal
        annotated_frame = results[0].plot()

        cv2.imshow("SafeSight AI Test", annotated_frame)

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

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

except KeyboardInterrupt:
    print("\n[INFO] Stopping AI Engine... (Ctrl+C pressed)")

finally:
    # This part ALWAYS runs, even if there is an error
    cap.release()
    cv2.destroyAllWindows()
    print("[INFO] Webcam released and windows closed. Clean exit.")