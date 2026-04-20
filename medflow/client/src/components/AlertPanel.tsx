// src/components/AlertPanel.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, X } from 'lucide-react';
import useStore from '@/store/useStore';
import { alertApi } from '@/lib/api';
import type { Alert } from '@/types';

const SEVERITY_META = {
  critical: { color:'#FF0000', icon:'⚠', bg:'rgba(255,0,0,0.07)' },
  warning:  { color:'#ffaa00', icon:'△', bg:'rgba(255,170,0,0.06)' },
  info:     { color:'#00d4ff', icon:'ℹ', bg:'rgba(0,212,255,0.05)' },
};

const TYPE_LABELS: Record<string, string> = {
  FALL_DETECTED:    'Fall Detected',
  BED_EXIT:         'Bed Exit',
  NO_MOTION:        'No Motion',
  ABNORMAL_GAIT:    'Abnormal Gait',
  DISTRESS_POSTURE: 'Distress Posture',
  EYES_CLOSED:      'Eyes Closed',
  CARDIAC_ANOMALY:  'Cardiac Anomaly',
  SPO2_LOW:         'SpO₂ Low',
  BPM_HIGH:         'HR Elevated',
  BPM_LOW:          'HR Low',
  TEMP_HIGH:        'Temp High',
  SYSTEM:           'System',
};

function timeSince(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60)   return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  return `${Math.floor(diff/3600)}h`;
}

function AlertRow({ alert }: { alert: Alert }) {
  const { acknowledgeAlert } = useStore();
  const meta = SEVERITY_META[alert.severity] ?? SEVERITY_META.info;
  const isCrit = alert.severity === 'critical';

  async function handleAck() {
    try {
      await alertApi.acknowledge(alert._id);
      acknowledgeAlert(alert._id);
    } catch {}
  }

  const patientName = typeof alert.patientId === 'object'
    ? (alert.patientId as { name?: string }).name ?? 'Unknown'
    : 'Unknown';

  return (
    <motion.div
      layout
      initial={{ opacity:0, x:12 }}
      animate={{ opacity:1, x:0 }}
      exit={{ opacity:0, x:-12, height:0, marginBottom:0, padding:0 }}
      transition={{ duration:0.25, ease:[0.16,1,0.3,1] }}
      className={`rounded-md border relative overflow-hidden ${isCrit && !alert.acknowledged ? 'alert-critical' : ''}`}
      style={{
        background: alert.acknowledged ? 'rgba(14,14,14,0.5)' : meta.bg,
        borderColor: alert.acknowledged ? 'rgba(40,40,40,0.5)' : `${meta.color}44`,
        marginBottom: 6,
      }}
    >
      {/* Left severity bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5"
           style={{ background: alert.acknowledged ? '#2a2a2a' : meta.color,
                    boxShadow: isCrit && !alert.acknowledged ? `0 0 6px ${meta.color}` : 'none' }} />

      <div className="pl-3.5 pr-2.5 py-2">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-1">
          <motion.span
            style={{ fontSize:11, color: alert.acknowledged ? '#505050' : meta.color }}
            animate={isCrit && !alert.acknowledged ? { opacity:[1,0.3,1] } : {}}
            transition={{ duration:0.9, repeat:Infinity }}
          >
            {meta.icon}
          </motion.span>
          <span className="font-mono font-bold flex-1"
                style={{ fontSize:8.5, letterSpacing:'0.12em',
                         color: alert.acknowledged ? '#505050' : meta.color }}>
            {TYPE_LABELS[alert.type] ?? alert.type}
          </span>
          <span className="font-mono text-grey-400" style={{fontSize:8}}>
            {timeSince(alert.createdAt)}
          </span>
        </div>

        {/* Patient */}
        <p className="font-mono font-medium mb-0.5"
           style={{ fontSize:10, color: alert.acknowledged ? '#505050' : 'rgba(200,200,200,0.9)' }}>
          {patientName}
        </p>

        {/* Message */}
        <p style={{ fontSize:10, lineHeight:1.4,
                    color: alert.acknowledged ? '#3a3a3a' : 'rgba(150,150,150,0.9)' }}>
          {alert.message}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-1.5">
          <span className="font-mono" style={{fontSize:8, color:'rgba(60,60,60,0.8)'}}>
            {new Date(alert.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}
          </span>
          {!alert.acknowledged ? (
            <button
              onClick={handleAck}
              className="font-mono px-2 py-0.5 rounded transition-all"
              style={{
                fontSize:7.5, letterSpacing:'0.1em',
                color: meta.color,
                border:`1px solid ${meta.color}44`,
                background:'transparent', cursor:'pointer',
              }}
            >
              ACK
            </button>
          ) : (
            <span className="font-mono flex items-center gap-1"
                  style={{fontSize:8, color:'rgba(60,60,60,0.7)'}}>
              <CheckCheck size={9} /> ACK
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function AlertPanel() {
  const { alerts, clearUnread } = useStore();
  const active = alerts.filter(a => !a.resolved);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0"
           style={{ borderColor:'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <Bell size={12} className="text-grey-400" />
          <span className="font-mono text-grey-300" style={{fontSize:9,letterSpacing:'0.12em'}}>
            ACTIVE ALERTS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-grey-400" style={{fontSize:8}}>{active.length}</span>
          <button onClick={clearUnread} className="text-grey-400 hover:text-white transition-colors">
            <X size={11} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-dark p-3">
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2">
            <CheckCheck size={18} className="text-green opacity-60" />
            <span className="font-mono text-grey-400 text-center" style={{fontSize:9,letterSpacing:'0.1em'}}>
              NO ACTIVE ALERTS
            </span>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {active.map(a => <AlertRow key={a._id} alert={a} />)}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
