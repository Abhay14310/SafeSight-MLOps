// src/types/index.ts
export type PatientStatus = 'stable'|'warning'|'critical'|'discharged';
export type AlertSeverity = 'info'|'warning'|'critical';
export type TaskUrgency   = 'routine'|'urgent'|'stat';
export type Posture       = 'SLEEPING'|'RESTLESS'|'SITTING_UP'|'STANDING'|'FALL_DETECTED'|'UNKNOWN';
export type FallRisk      = 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
export type UserRole      = 'admin'|'nurse'|'doctor'|'supervisor';

export interface User { id:string; name:string; email:string; role:UserRole; ward:string; preferences?:{alerts:boolean;sound:boolean}; }

export interface Patient {
  _id:string; bedId:string; name:string; age:number; gender:string;
  diagnosis:string; admittedAt:string; ward:string; status:PatientStatus;
  nurseAssigned?:string; morseScore:number; allergies?:string[];
  bloodType?:string; weight?:number; height?:number;
  baseline:{ hr:number; spo2:number; resp:number; sbp:number; dbp:number; temp:number; };
}

export interface VitalSnapshot {
  patientId:string; bedId:string; name?:string; status?:PatientStatus;
  hr:number; spo2:number; resp:number; sbp:number; dbp:number;
  temp:number; etco2?:number; ts:string;
}

export interface ECGPoint { patientId:string; bedId:string; ecg:number; resp:number; t:number; }

export interface PoseFrame {
  patientId:string; bedId:string;
  keypoints:Array<{name:string;x:number;y:number;score:number}>;
  posture:Posture; morseScore:number; hipDeviation:number;
  fallRisk:FallRisk; jointScores:Record<string,number>; timestamp:string;
}

export interface Alert {
  _id:string; patientId?:string; bedId?:string; type:string;
  severity:AlertSeverity; message:string; value?:number; threshold?:number;
  acknowledged:boolean; resolved:boolean; createdAt:string;
}

export interface Task {
  _id:string; bedId?:string; patientId?:string; type:string;
  description:string; urgency:TaskUrgency; assignedTo?:string;
  dueAt?:string; status:string; notes?:string; createdAt:string;
}

export interface DockerService {
  name:string; container:string; status:'running'|'stopped'|'error';
  image:string; cpu:number; mem:string; uptime:string; port?:string; gpu?:boolean;
}
