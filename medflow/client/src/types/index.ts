// src/types/index.ts

export type PatientStatus = 'critical' | 'warning' | 'stable' | 'discharged';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type LabReportType = 'blood'|'urine'|'ecg'|'xray'|'mri'|'ct'|'ultrasound'|'pathology'|'other';
export type UserRole = 'nurse'|'doctor'|'admin'|'home_user';

export interface Patient {
  _id: string;
  mrn: string;
  name: string;
  age: number;
  gender: 'male'|'female'|'other';
  bloodType: string;
  ward: string;
  bed: string;
  condition: string;
  status: PatientStatus;
  admittedAt: string;
  attendingDoctor?: string;
  emergencyContact?: { name:string; phone:string; relation:string };
  tags: string[];
  notes?: string;
  isHomeUser: boolean;
  shortId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vitals {
  patientId: string;
  bpm: number;
  spo2: number;
  o2: number;
  systolic: number;
  diastolic: number;
  temp: number;
  respRate: number;
  timestamp: string;
}

export interface VitalsHistoryPoint {
  _id: string;
  patientId: string;
  bpm: number;
  spo2: number;
  o2: number;
  systolic: number;
  diastolic: number;
  temp: number;
  respRate: number;
  timestamp: string;
}

export interface LabReportValue {
  label: string;
  value: number | string;
  unit: string;
  normalMin?: number;
  normalMax?: number;
  flag: 'normal'|'low'|'high'|'critical';
}

export interface LabReport {
  _id: string;
  patientId: string;
  title: string;
  type: LabReportType;
  status: 'pending'|'processing'|'completed'|'flagged';
  reportedBy?: string;
  reportedAt: string;
  summary?: string;
  findings?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  values: LabReportValue[];
  tags: string[];
  createdAt: string;
}

export interface Alert {
  _id: string;
  patientId: string | Patient;
  type: string;
  severity: AlertSeverity;
  message: string;
  source: 'ai_client'|'vitals_engine'|'manual'|'system';
  metadata?: Record<string, unknown>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ward?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Keypoint from MediaPipe / WebSocket
export interface Keypoint {
  label: string;
  x: number;  // 0–1 normalized
  y: number;  // 0–1 normalized
  z?: number;
  score?: number;
}

export interface PoseFrame {
  keypoints: Keypoint[];
  patientId: string;
  timestamp: number;
}

// Three.js alert zone
export interface AlertZone {
  id: string;
  label: string;
  position: [number, number, number];
  severity: AlertSeverity;
}
