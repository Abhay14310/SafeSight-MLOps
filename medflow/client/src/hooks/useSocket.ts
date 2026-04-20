// src/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import useStore from '@/store/useStore';
import type { Vitals, Alert } from '@/types';

export function useSocket() {
  const socket = getSocket();
  const { setVitals, addAlert, updatePatient } = useStore();

  useEffect(() => {
    socket.emit('join_nurses');

    // Real-time vitals (full update for subscribed patient)
    socket.on('vitals_update', (data: Vitals) => {
      setVitals(data.patientId, data);
    });

    // Brief vitals for all patients (nurse overview)
    socket.on('vitals_brief', (data: { patientId:string; bpm:number; spo2:number; temp:number }) => {
      const store = useStore.getState();
      const current = store.vitalsMap[data.patientId];
      if (current) {
        setVitals(data.patientId, { ...current, ...data });
      }
    });

    // Incoming alerts
    socket.on('new_alert', (alert: Alert) => {
      addAlert(alert);
      const patientId = typeof alert.patientId === 'string'
        ? alert.patientId
        : (alert.patientId as any)?._id;
      if (alert.severity === 'critical') {
        updatePatient(patientId, { status: 'critical' });
      }
    });

    return () => {
      socket.off('vitals_update');
      socket.off('vitals_brief');
      socket.off('new_alert');
    };
  }, []);

  const subscribeToPatient = (patientId: string) => {
    socket.emit('subscribe_patient', { patientId });
  };

  const unsubscribeFromPatient = (patientId: string) => {
    socket.emit('unsubscribe_patient', { patientId });
  };

  const emitAiAlert = (payload: {
    patientId: string;
    type: string;
    severity: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) => {
    socket.emit('ai_alert', payload);
  };

  return { socket, subscribeToPatient, unsubscribeFromPatient, emitAiAlert };
}
