# import cv2
# from ultralytics import YOLO

# # Load the smallest/fastest YOLOv8 model
# model = YOLO('yolov8n.pt') 

# cap = cv2.VideoCapture(0) # Open Webcam

# while cap.isOpened():
#     success, frame = cap.read()
#     if success:
#         # Run YOLOv8 inference on the frame
#         results = model(frame, conf=0.5) # Only show high confidence detections

#         # Visualize the results on the frame
#         annotated_frame = results[0].plot()

#         cv2.imshow("SafeSight AI Test", annotated_frame)

#         if cv2.waitKey(1) & 0xFF == ord("q"):
#             break
#     else:
#         break

# cap.release()
# cv2.destroyAllWindows()



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

model = YOLO('yolov8n.pt') 
cap = cv2.VideoCapture(0)

print("AI Engine Running... Press 'q' or Ctrl+C to stop.")

try:
    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break

        results = model(frame, conf=0.5, verbose=False) # verbose=False cleans up terminal
        annotated_frame = results[0].plot()

        cv2.imshow("SafeSight AI Test", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

except KeyboardInterrupt:
    print("\n[INFO] Stopping AI Engine... (Ctrl+C pressed)")

finally:
    # This part ALWAYS runs, even if there is an error
    cap.release()
    cv2.destroyAllWindows()
    print("[INFO] Webcam released and windows closed. Clean exit.")