// src/hooks/useVitals.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { vitalsApi } from '@/lib/api';
import { useSocket } from './useSocket';
import useStore from '@/store/useStore';
import type { VitalsHistoryPoint, Vitals } from '@/types';
import gsap from 'gsap';

export function useVitals(patientId: string | undefined) {
  const { subscribeToPatient, unsubscribeFromPatient } = useSocket();
  const vitalsMap  = useStore(s => s.vitalsMap);
  const setVitals  = useStore(s => s.setVitals);
  const [history,  setHistory]  = useState<VitalsHistoryPoint[]>([]);
  const [loading,  setLoading]  = useState(false);

  const latest: Vitals | undefined = patientId ? vitalsMap[patientId] : undefined;

  useEffect(() => {
    if (!patientId) return;
    subscribeToPatient(patientId);

    // Fetch last 60 readings for charts
    setLoading(true);
    vitalsApi.history(patientId, { limit: '60' })
      .then(res => setHistory(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => { unsubscribeFromPatient(patientId); };
  }, [patientId]);

  return { latest, history, loading };
}
export function useGSAPEntrance(deps: unknown[] = []) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      // Stagger all .gsap-slide-up children
      gsap.fromTo(
        containerRef.current!.querySelectorAll('.gsap-slide-up'),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, stagger: 0.07, duration: 0.55, ease: 'power3.out' }
      );
      // Stagger .gsap-slide-in (from right)
      gsap.fromTo(
        containerRef.current!.querySelectorAll('.gsap-slide-in'),
        { opacity: 0, x: 16 },
        { opacity: 1, x: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out', delay: 0.1 }
      );
      // Fade ins
      gsap.fromTo(
        containerRef.current!.querySelectorAll('.gsap-fade-in'),
        { opacity: 0 },
        { opacity: 1, stagger: 0.05, duration: 0.4, ease: 'power2.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}

export function useCountUp(target: number, duration = 1.2) {
  const ref     = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(0);

  useEffect(() => {
    if (!ref.current || isNaN(target)) return;
    const tweenState = { val: prevRef.current };
    gsap.fromTo(
      tweenState,
      { val: prevRef.current },
      { val: target, duration, ease: 'power2.out',
        onUpdate: () => {
          if (ref.current) ref.current.textContent = String(Math.round(tweenState.val));
        },
        onComplete: () => { prevRef.current = target; }
      }
    );
  }, [target, duration]);

  return ref;
}

export function useGSAPTimeline() {
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const play = useCallback(() => tlRef.current?.play(), []);
  const pause = useCallback(() => tlRef.current?.pause(), []);
  const restart = useCallback(() => tlRef.current?.restart(), []);

  useEffect(() => {
    tlRef.current = gsap.timeline({ paused: true });
    return () => { tlRef.current?.kill(); };
  }, []);

  return { tl: tlRef, play, pause, restart };
}
