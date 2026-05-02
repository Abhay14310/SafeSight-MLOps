// src/components/VitalsPanel.tsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import gsap from 'gsap';
import { Heart, Wind, Thermometer, Activity, Droplets, TrendingUp } from 'lucide-react';
import type { Vitals, VitalsHistoryPoint } from '@/types';

interface VitalCardProps {
  label:    string;
  value:    number | string | undefined;
  unit:     string;
  icon:     React.ReactNode;
  color:    string;   // tailwind/css color class or hex
  trend?:   'up'|'down'|'stable';
  alert?:   boolean;
  history?: number[];
  subtext?: string;
}

const VITAL_THRESHOLDS: Record<string, { warn:[number,number]; crit:[number,number] }> = {
  bpm:      { warn:[50,100],  crit:[40,120] },
  spo2:     { warn:[94,100],  crit:[90,100] },
  o2:       { warn:[93,100],  crit:[88,100] },
  systolic: { warn:[90,140],  crit:[70,160] },
  temp:     { warn:[36,37.5], crit:[35,39] },
  respRate: { warn:[12,20],   crit:[8,26]  },
};

function getStatus(key: string, value: number): 'normal'|'warn'|'critical' {
  const t = VITAL_THRESHOLDS[key];
  if (!t) return 'normal';
  const [wmin, wmax] = t.warn;
  const [cmin, cmax] = t.crit;
  if (value < cmin || value > cmax) return 'critical';
  if (value < wmin || value > wmax) return 'warn';
  return 'normal';
}

// Animated counter span
function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref     = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (!ref.current || isNaN(value)) return;
    const from = { v: prevRef.current };
    gsap.to(from, {
      v: value, duration: 0.8, ease: 'power2.out',
      onUpdate() { if (ref.current) ref.current.textContent = from.v.toFixed(decimals); },
      onComplete() { prevRef.current = value; },
    });
  }, [value, decimals]);

  return <span ref={ref}>{isNaN(value) ? '—' : value.toFixed(decimals)}</span>;
}

function VitalCard({
  label, value, unit, icon, color, alert, history, subtext, trend
}: VitalCardProps) {
  const numVal = typeof value === 'number' ? value : NaN;

  return (
    <motion.div
      layout
      className={`glass rounded-lg p-3 relative overflow-hidden group cursor-default
        ${alert ? 'alert-critical' : 'hover:border-white/10 transition-colors'}`}
      whileHover={alert ? {} : { scale: 1.015 }}
      transition={{ duration: 0.15 }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
           style={{ background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${color}08 0%, transparent 70%)` }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span style={{ color }}>{icon}</span>
          <span className="vital-label">{label}</span>
        </div>
        {alert && (
          <motion.span
            animate={{ opacity:[1,0.2,1] }}
            transition={{ duration:0.8, repeat:Infinity }}
            className="font-mono text-red"
            style={{ fontSize:8, letterSpacing:'0.12em' }}
          >
            ALERT
          </motion.span>
        )}
        {trend && !alert && (
          <TrendingUp size={11}
            style={{ color, transform: trend === 'down' ? 'scaleY(-1)' : 'none', opacity:0.6 }} />
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="vital-number" style={{ color: alert ? '#FF0000' : color }}>
          {typeof value === 'number'
            ? <CountUp value={numVal} decimals={unit === '°C' ? 1 : 0} />
            : value ?? '—'
          }
        </span>
        <span className="vital-unit">{unit}</span>
      </div>

      {subtext && (
        <div className="font-mono text-grey-400 mb-1" style={{ fontSize:10 }}>{subtext}</div>
      )}

      {/* Sparkline */}
      {history && history.length > 3 && (
        <div className="h-10 mt-1 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history.map((v,i) => ({ i, v }))}>
              <defs>
                <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#grad-${label})`}
                dot={false}
                isAnimationActive={false}
              />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0]
                    ? <div className="glass px-2 py-1 font-mono text-white" style={{fontSize:9}}>
                        {Number(payload[0].value).toFixed(unit==='°C'?1:0)} {unit}
                      </div>
                    : null
                }
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

// ─── MAIN VITALS PANEL ────────────────────────────────────────
interface VitalsPanelProps {
  vitals:  Vitals | undefined;
  history: VitalsHistoryPoint[];
}

export default function VitalsPanel({ vitals, history }: VitalsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP stagger entrance
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.vital-card-item',
        { opacity:0, y:14, scale:0.96 },
        { opacity:1, y:0,  scale:1, stagger:0.06, duration:0.5, ease:'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const bpmHistory  = history.map(h => h.bpm);
  const spo2History = history.map(h => h.spo2);
  const o2History   = history.map(h => h.o2);
  const tempHistory = history.map(h => h.temp);

  const cards = [
    {
      label:'Heart Rate', value:vitals?.bpm, unit:'BPM',
      icon:<Heart size={13}/>, color:'#FF4D6D',
      alert: vitals ? getStatus('bpm', vitals.bpm) === 'critical' : false,
      history:bpmHistory,
      subtext: vitals?.bpm ? (vitals.bpm > 100 ? 'Tachycardia' : vitals.bpm < 60 ? 'Bradycardia' : 'Normal Sinus') : undefined,
    },
    {
      label:'SpO₂', value:vitals?.spo2, unit:'%',
      icon:<Droplets size={13}/>, color:'#00d4ff',
      alert: vitals ? getStatus('spo2', vitals.spo2) === 'critical' : false,
      history:spo2History,
      subtext: vitals?.spo2 ? (vitals.spo2 >= 96 ? 'Normal' : vitals.spo2 >= 90 ? 'Low' : 'Critical') : undefined,
    },
    {
      label:'O₂ Flow', value:vitals?.o2, unit:'%',
      icon:<Wind size={13}/>, color:'#00ff88',
      alert: vitals ? getStatus('o2', vitals.o2) === 'critical' : false,
      history:o2History,
    },
    {
      label:'Blood Pressure', value: vitals ? `${vitals.systolic}/${vitals.diastolic}` : undefined, unit:'mmHg',
      icon:<Activity size={13}/>, color:'#a855f7',
      alert: vitals ? getStatus('systolic', vitals.systolic) === 'critical' : false,
      subtext: vitals?.systolic ? (vitals.systolic > 140 ? 'Hypertensive' : vitals.systolic < 90 ? 'Hypotensive' : 'Normal') : undefined,
    },
    {
      label:'Temperature', value:vitals?.temp, unit:'°C',
      icon:<Thermometer size={13}/>, color:'#ffaa00',
      alert: vitals ? getStatus('temp', vitals.temp) === 'critical' : false,
      history:tempHistory,
      subtext: vitals?.temp ? (vitals.temp > 38.5 ? 'Fever' : vitals.temp < 36 ? 'Hypothermia' : 'Afebrile') : undefined,
    },
    {
      label:'Resp. Rate', value:vitals?.respRate, unit:'/min',
      icon:<Wind size={13}/>, color:'#67e8f9',
      alert: vitals ? getStatus('respRate', vitals.respRate) === 'critical' : false,
      subtext: vitals?.respRate ? (vitals.respRate > 20 ? 'Tachypnoea' : vitals.respRate < 12 ? 'Bradypnoea' : 'Normal') : undefined,
    },
  ];

  return (
    <div ref={containerRef}>
      <div className="flex items-center justify-between mb-3">
        <span className="section-label">Live Vitals</span>
        {vitals && (
          <span className="font-mono text-grey-400" style={{fontSize:9}}>
            Updated {new Date(vitals.timestamp).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {cards.map(card => (
          <div key={card.label} className="vital-card-item opacity-0">
            <VitalCard {...card} />
          </div>
        ))}
      </div>
    </div>
  );
}
