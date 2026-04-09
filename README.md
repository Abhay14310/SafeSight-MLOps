# SafeSight-MLOps
# SafeSight: AI-Powered Anomaly Detection with MLOps Pipeline

## 📌 Project Overview
SafeSight is a professional-grade computer vision system designed to detect human anomalies (like falls or unauthorized entries) in real-time. Unlike standard AI projects, SafeSight utilizes a full **MLOps pipeline** including Docker containerization, CI/CD via GitHub Actions, and real-time monitoring.

## 🚀 Key Features
* **AI Engine:** Real-time human action recognition using YOLOv8 and MediaPipe.
* **DevOps Ready:** Fully containerized using Docker for "Plug & Play" deployment.
* **Live Dashboard:** Real-time alerts using Node.js and Socket.io.
* **Database:** Permanent logging of security incidents in MongoDB.

## 🏗️ Technical Architecture


1. **AI Layer:** Python 3.10, OpenCV, Ultralytics (YOLOv8).
2. **Web Layer:** Node.js, Express, Socket.io, EJS.
3. **Infrastructure:** Docker, Docker-Compose, GitHub Actions.

## 🛠️ Setup Instructions

### Prerequisites
* Docker Desktop installed
* Python 3.10+ installed
* Webcam connected to your computer

### 🏁 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Abhay14310/SafeSight-MLOps.git
   cd SafeSight-MLOps
   ```

2. **Start the Web Dashboard & Database:**
   We use Docker Compose to instantly launch the Node.js Server and MongoDB database.
   ```bash
   docker-compose up --build -d
   ```
   *The dashboard will be available at http://localhost:3000.*

3. **Start the Edge AI Engine:**
   Open a new terminal. The AI Engine runs natively on your machine to access your local webcam and utilize maximum hardware performance.
   ```bash
   cd ai-engine
   pip install -r requirements.txt # (Ensure dependencies like opencv-python, ultralytics are installed)
   python src/detection.py
   ```

4. **Activate Uplink:**
   Visit `http://localhost:3000` in your browser. Authenticate, and click the **START UPLINK** button. The Python Engine will receive the signal, turn on your webcam, and begin streaming real-time YOLOv8 annotations directly to your browser!

---

### 💡 Pro-Tips for your GitHub:
1.  **Images:** In the `## Project Architecture` section, once you draw your diagram, upload the image to a folder called `assets/` and link it like this: `![Architecture](./assets/diagram.png)`.
2.  **The "Live" Link:** If you eventually deploy this to a free service like Render or Railway, put the "Live Demo" link at the very top. It impresses professors instantly.
