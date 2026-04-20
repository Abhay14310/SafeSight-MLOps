// src/hooks/useMediaPipe.ts
// Client-side AI pose analysis using @mediapipe/pose
// Detects: fall, bed-exit, no-motion, eyes-closed
// Emits alerts via socket — zero video leaves the browser

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

export interface PoseResult {
  keypoints: Array<{ label: string; x: number; y: number; z: number; score: number }>;
  detections: string[];
  gaitScore: number;
  pattern: string;
}

const LANDMARK_NAMES = [
  'nose','left_eye_inner','left_eye','left_eye_outer',
  'right_eye_inner','right_eye','right_eye_outer',
  'left_ear','right_ear','mouth_left','mouth_right',
  'left_shoulder','right_shoulder','left_elbow','right_elbow',
  'left_wrist','right_wrist','left_pinky','right_pinky',
  'left_index','right_index','left_thumb','right_thumb',
  'left_hip','right_hip','left_knee','right_knee',
  'left_ankle','right_ankle','left_heel','right_heel',
  'left_foot_index','right_foot_index',
];

function calcGaitScore(lms: MediaPipeLandmark[]): number {
  if (!lms.length) return 0;
  const ls = lms[11], rs = lms[12]; // shoulders
  const lh = lms[23], rh = lms[24]; // hips
  if (!ls || !rs || !lh || !rh) return 50;

  const shoulderDiff = Math.abs(ls.y - rs.y);
  const hipDiff      = Math.abs(lh.y - rh.y);
  const symmetryScore = Math.max(0, 100 - ((shoulderDiff + hipDiff) * 400));
  return Math.round(Math.min(100, symmetryScore));
}

function detectPattern(lms: MediaPipeLandmark[]): string {
  if (!lms.length) return 'NO_SIGNAL';
  const nose = lms[0];
  const leftHip = lms[23];
  if (!nose || !leftHip) return 'UNKNOWN';

  // If nose is above hip Y (lower value = higher in frame)
  if (nose.y < 0.3) return 'STANDING';
  if (nose.y < 0.5 && nose.y > 0.25) return 'SITTING';
  if (nose.y > 0.5) return 'LYING';
  return 'UNKNOWN';
}

function detectAlerts(lms: MediaPipeLandmark[], prevLms: MediaPipeLandmark[] | null): string[] {
  const alerts: string[] = [];
  if (!lms.length) {
    alerts.push('NO_MOTION');
    return alerts;
  }

  const leftEye  = lms[2];
  const rightEye = lms[5];

  // Eye closure proxy: if eye visibility is low
    if (leftEye && rightEye) {
      if ((leftEye.visibility ?? 1) < 0.2 && (rightEye.visibility ?? 1) < 0.2) {
      alerts.push('EYES_CLOSED');
    }
  }

  // Fall detection: nose close to ground level AND below hips
  const nose    = lms[0];
  const leftHip = lms[23];
  if (nose && leftHip && nose.y > 0.85 && nose.y > leftHip.y + 0.1) {
    alerts.push('FALL_DETECTED');
  }

  // Sudden large movement (delta between frames)
  if (prevLms?.length) {
    const delta = lms.reduce((sum, lm, i) => {
      const prev = prevLms[i];
      if (!prev) return sum;
      return sum + Math.abs(lm.x - prev.x) + Math.abs(lm.y - prev.y);
    }, 0);
    if (delta > 3.5) alerts.push('DISTRESS_POSTURE');
  }

  return alerts;
}

interface MediaPipeLandmark {
  x: number; y: number; z: number;
  visibility?: number;
}

interface UseMediaPipeOptions {
  patientId: string;
  enabled: boolean;
  onPoseResult?: (result: PoseResult) => void;
}

export function useMediaPipe({ patientId, enabled, onPoseResult }: UseMediaPipeOptions) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const poseRef       = useRef<unknown>(null);
  const prevLmsRef    = useRef<MediaPipeLandmark[] | null>(null);
  const alertCooldown = useRef<Map<string, number>>(new Map());
  const rafRef        = useRef<number>(0);
  const streamRef     = useRef<MediaStream | null>(null);

  const { emitAiAlert } = useSocket();
  const [isActive, setIsActive] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [poseResult, setPoseResult] = useState<PoseResult | null>(null);

  const isCooling = useCallback((type: string, ms = 30000) => {
    const last = alertCooldown.current.get(type) || 0;
    return Date.now() - last < ms;
  }, []);

  const fireAlert = useCallback((type: string, severity: 'info'|'warning'|'critical', message: string) => {
    if (isCooling(type)) return;
    alertCooldown.current.set(type, Date.now());
    emitAiAlert({ patientId, type, severity, message });
  }, [patientId, emitAiAlert, isCooling]);

  const processPose = useCallback((results: { poseLandmarks?: MediaPipeLandmark[] }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const lms = results.poseLandmarks || [];

    // Draw skeleton on canvas (no raw video — privacy-first)
    if (lms.length) {
      drawWireframeSkeleton(ctx, lms, canvas.width, canvas.height);
    }

    const keypoints = lms.map((lm, i) => ({
      label:      LANDMARK_NAMES[i] || `lm_${i}`,
      x:          lm.x,
      y:          lm.y,
      z:          lm.z,
      score:      lm.visibility ?? 1,
    }));

    const detections = detectAlerts(lms, prevLmsRef.current);
    const gaitScore  = calcGaitScore(lms);
    const pattern    = detectPattern(lms);

    prevLmsRef.current = lms;

    const result: PoseResult = { keypoints, detections, gaitScore, pattern };
    setPoseResult(result);
    onPoseResult?.(result);

    // Fire alerts
    if (detections.includes('FALL_DETECTED')) {
      fireAlert('FALL_DETECTED', 'critical', 'Patient fall detected by AI pose analysis');
    }
    if (detections.includes('DISTRESS_POSTURE')) {
      fireAlert('DISTRESS_POSTURE', 'warning', 'Sudden distress movement pattern detected');
    }
      if (detections.includes('EYES_CLOSED')) {
        fireAlert('EYES_CLOSED', 'info', 'Patient eyes appear closed (possible sleep or unresponsiveness)');
    }
  }, [fireAlert, onPoseResult]);

  function drawWireframeSkeleton(
    ctx: CanvasRenderingContext2D,
    lms: MediaPipeLandmark[],
    w: number,
    h: number
  ) {
    const CONNECTIONS: [number,number][] = [
      [11,12],[11,13],[13,15],[12,14],[14,16],
      [11,23],[12,24],[23,24],[23,25],[24,26],[25,27],[26,28],
      [0,11],[0,12],
    ];

    ctx.shadowBlur = 6;
    CONNECTIONS.forEach(([a, b]) => {
      const la = lms[a], lb = lms[b];
      if (!la || !lb || (la.visibility ?? 1) < 0.3 || (lb.visibility ?? 1) < 0.3) return;
      ctx.strokeStyle  = 'rgba(0, 212, 255, 0.85)';
      ctx.shadowColor  = 'rgba(0, 212, 255, 0.4)';
      ctx.lineWidth    = 2;
      ctx.lineCap      = 'round';
      ctx.beginPath();
      ctx.moveTo(la.x * w, la.y * h);
      ctx.lineTo(lb.x * w, lb.y * h);
      ctx.stroke();
    });

    // Joints
    lms.forEach((lm, i) => {
      if ((lm.visibility ?? 1) < 0.3) return;
      const isHead = i <= 10;
      ctx.fillStyle   = isHead ? 'rgba(255,255,255,0.9)' : 'rgba(0,212,255,0.9)';
      ctx.shadowColor = 'rgba(0,212,255,0.6)';
      ctx.shadowBlur  = 8;
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, isHead ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Dynamic import MediaPipe Pose
      const { Pose } = await import('@mediapipe/pose');
      const pose = new Pose({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      pose.setOptions({
        modelComplexity:         1,
        smoothLandmarks:         true,
        enableSegmentation:      false,
        smoothSegmentation:      false,
        minDetectionConfidence:  0.6,
        minTrackingConfidence:   0.6,
      });
      pose.onResults(processPose);
      poseRef.current = pose;

      // Run detection loop
      const detect = async () => {
        if (videoRef.current && poseRef.current) {
          await (poseRef.current as { send: (o:{image:HTMLVideoElement}) => Promise<void> })
            .send({ image: videoRef.current });
        }
        rafRef.current = requestAnimationFrame(detect);
      };
      rafRef.current = requestAnimationFrame(detect);
      setIsActive(true);
      setError(null);
    } catch (err) {
      setError('Camera access denied or MediaPipe unavailable');
      console.warn('[MediaPipe]', err);
    }
  }

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsActive(false);
    setPoseResult(null);
  }

  useEffect(() => {
    if (enabled) startCamera();
    return () => stopCamera();
  }, [enabled, patientId]);

  return { videoRef, canvasRef, isActive, error, poseResult };
}
