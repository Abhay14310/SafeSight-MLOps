// src/pages/CameraPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Camera, AlertTriangle, Users, Wifi, WifiOff, Maximize2 } from 'lucide-react';
import useStore from '@/store/useStore';
import type { CameraFrame } from '@/types';

// ── Simulated "video" skeleton canvas ─────────────────────────
function CamCanvas({ frame }: { frame: CameraFrame }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf       = useRef(0);
  const tick      = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function draw() {
      tick.current++;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Dark background
      ctx.fillStyle = frame.status === 'offline' ? '#1e293b' : '#0f172a';
      ctx.fillRect(0, 0, w, h);

      if (frame.status === 'offline') {
        ctx.fillStyle = 'rgba(100,116,139,0.6)';
        ctx.font = '11px Space Mono';
        ctx.textAlign = 'center';
        ctx.fillText('OFFLINE', w/2, h/2);
        raf.current = requestAnimationFrame(draw);
        return;
      }

      // Grid overlay
      ctx.strokeStyle = 'rgba(1,69,242,0.06)';
      ctx.lineWidth = 0.5;
      for (let x=0; x<w; x+=20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      for (let y=0; y<h; y+=20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

      // Person blobs (animated)
      const persons = Math.max(0, frame.persons + Math.round((Math.random()-.5)*1));
      for (let i=0; i<Math.min(persons,8); i++) {
        const bx = 20 + (i % 4) * (w/4.5) + Math.sin(tick.current*0.02 + i) * 4;
        const by = 25 + Math.floor(i/4) * (h/2.2) + Math.cos(tick.current*0.018 + i*1.3) * 3;
        const r  = 8 + Math.random() * 3;

        // Body ellipse
        ctx.beginPath();
        ctx.ellipse(bx, by + r*1.5, r*0.65, r*1.4, 0, 0, Math.PI*2);
        ctx.fillStyle = frame.anomaly ? 'rgba(220,38,38,0.35)' : 'rgba(1,69,242,0.22)';
        ctx.fill();
        ctx.strokeStyle = frame.anomaly ? 'rgba(220,38,38,0.7)' : 'rgba(1,69,242,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(bx, by, r*0.55, 0, Math.PI*2);
        ctx.fillStyle = frame.anomaly ? 'rgba(220,38,38,0.5)' : 'rgba(1,69,242,0.4)';
        ctx.fill();
        ctx.strokeStyle = frame.anomaly ? '#dc2626' : '#0145f2';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Bounding box
        if (frame.type === 'security' || frame.anomaly) {
          ctx.strokeStyle = frame.anomaly ? 'rgba(220,38,38,0.8)' : 'rgba(1,69,242,0.5)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3,2]);
          ctx.strokeRect(bx - r, by - r, r*2, r*3.5);
          ctx.setLineDash([]);
        }
      }

      // Anomaly flash overlay
      if (frame.anomaly && Math.sin(tick.current * 0.1) > 0.5) {
        ctx.fillStyle = 'rgba(220,38,38,0.06)';
        ctx.fillRect(0, 0, w, h);
      }

      // Timestamp overlay
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '9px Space Mono';
      ctx.textAlign = 'left';
      const ts = new Date().toLocaleTimeString('en-IN',{hour12:false});
      ctx.fillText(ts, 6, h-6);

      // FPS counter
      ctx.textAlign = 'right';
      ctx.fillText(`${frame.fps} FPS`, w-6, h-6);

      raf.current = requestAnimationFrame(draw);
    }

    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [frame.status, frame.persons, frame.anomaly, frame.fps, frame.type]);

  return (
    <canvas
      ref={canvasRef}
      width={280} height={160}
      style={{ width:'100%', height:'100%', display:'block', background:'#0f172a' }}
    />
  );
}

// ── Camera Tile ───────────────────────────────────────────────
function CamTile({ frame, expanded, onExpand }: {
  frame: CameraFrame;
  expanded: boolean;
  onExpand: () => void;
}) {
  const isOnline  = frame.status === 'online';
  const isAlert   = frame.status === 'alert' || frame.anomaly;

  return (
    <motion.div
      layout
      className="cam-tile flex flex-col"
      style={{
        borderColor: isAlert ? 'rgba(220,38,38,0.45)' : isOnline ? '#e2e8f0' : '#cbd5e1',
        background: isAlert ? 'rgba(220,38,38,0.02)' : '#fff',
      }}
      animate={isAlert ? { borderColor:['rgba(220,38,38,0.3)','rgba(220,38,38,0.6)','rgba(220,38,38,0.3)'] } : {}}
      transition={{ duration:1.5, repeat:Infinity }}
    >
      {/* Cam header */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0"
           style={{ borderBottom:'1px solid #f1f5f9' }}>
        <div className="flex items-center gap-2 min-w-0">
          {isOnline
            ? <Wifi size={11} color={isAlert ? '#dc2626' : '#16a34a'} />
            : <WifiOff size={11} color="#94a3b8" />
          }
          <span className="font-mono text-xs text-slate-700 font-bold truncate">{frame.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-slate-400" style={{ fontSize:8, letterSpacing:'0.1em', textTransform:'uppercase' }}>
            {frame.type}
          </span>
          <button onClick={onExpand} className="text-slate-400 hover:text-navy transition-colors">
            <Maximize2 size={11} />
          </button>
        </div>
      </div>

      {/* Feed area */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight:140 }}>
        <CamCanvas frame={frame} />
        {/* Scan line */}
        <div className={`cam-scanline ${isAlert ? 'cam-scanline-alert' : ''}`} />

        {/* Status badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {isAlert && frame.anomaly && (
            <motion.div
              animate={{ opacity:[1,0.3,1] }} transition={{ duration:0.8, repeat:Infinity }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded font-mono font-bold"
              style={{ background:'rgba(220,38,38,0.9)', color:'#fff', fontSize:8 }}>
              <AlertTriangle size={9} /> ANOMALY
            </motion.div>
          )}
          {frame.crowding && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded font-mono font-bold"
                 style={{ background:'rgba(217,119,6,0.9)', color:'#fff', fontSize:8 }}>
              CROWDED
            </div>
          )}
        </div>

        {/* AI ACTIVE tag */}
        <div className="absolute top-2 right-2 z-20">
          <motion.div
            animate={{ opacity:[1,0.4,1] }} transition={{ duration:2, repeat:Infinity }}
            className="font-mono px-1.5 py-0.5 rounded"
            style={{ background:'rgba(1,69,242,0.85)', color:'#fff', fontSize:7.5, letterSpacing:'0.1em' }}>
            AI ACTIVE
          </motion.div>
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-3 px-3 py-2 flex-shrink-0"
           style={{ borderTop:'1px solid #f1f5f9', background:'#fafafa' }}>
        <div className="flex items-center gap-1">
          <Users size={10} color="#64748b" />
          <span className="font-mono text-xs font-bold text-slate-700">{frame.persons}</span>
          <span className="font-mono text-slate-400" style={{ fontSize:9 }}>persons</span>
        </div>
        <div className="flex-1" />
        <div className="font-mono text-slate-400" style={{ fontSize:9 }}>{frame.zone}</div>
        <div className="font-mono font-bold" style={{ fontSize:9, color: isOnline ? '#16a34a' : '#94a3b8' }}>
          {frame.confidence ?? 0}%
        </div>
      </div>
    </motion.div>
  );
}

// ── CAMERA PAGE ───────────────────────────────────────────────
export default function CameraPage() {
  const cameraMap = useStore(s => s.cameras);
  const frames    = Object.values(cameraMap);
  const [expanded, setExpanded] = useState<string|null>(null);
  const ref       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.cam-tile', { opacity:0, y:14, scale:0.97 },
        { opacity:1, y:0, scale:1, stagger:0.06, duration:0.45, ease:'power3.out' });
    }, ref);
    return () => ctx.revert();
  }, []);

  const online  = frames.filter(f => f.status==='online').length;
  const alerts  = frames.filter(f => f.anomaly || f.status==='alert').length;

  // Expanded modal
  const expandedFrame = frames.find(f => f.camId === expanded);

  return (
    <div ref={ref} className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono font-bold text-slate-900" style={{ fontSize:18, letterSpacing:'0.05em' }}>
            Camera Intelligence
          </h1>
          <p className="font-mono text-slate-400 text-xs mt-0.5">Privacy-first AI detection · Wireframe mode</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="badge-success">{online} Online</div>
          {alerts > 0 && <div className="badge-danger">{alerts} Alert{alerts>1?'s':''}</div>}
          <div className="badge-muted">{frames.length} Cameras</div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:'Total Persons Detected',  val:frames.reduce((s,f)=>s+f.persons,0), color:'#0145f2' },
          { label:'Active Anomalies',         val:frames.filter(f=>f.anomaly).length,   color:'#dc2626' },
          { label:'Crowding Zones',           val:frames.filter(f=>f.crowding).length,  color:'#d97706' },
          { label:'Avg Confidence',           val:Math.round(frames.reduce((s,f)=>s+(f.confidence??0),0)/(frames.length||1)), color:'#16a34a' },
        ].map(s => (
          <div key={s.label} className="card px-4 py-3">
            <div className="section-label mb-1" style={{ fontSize:8 }}>{s.label}</div>
            <div className="font-mono font-bold text-2xl" style={{ color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Camera grid */}
      {frames.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Camera size={32} color="#cbd5e1" />
          <p className="font-mono text-slate-400 text-xs">Connecting to camera stream…</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {frames.map(frame => (
            <CamTile
              key={frame.camId}
              frame={frame}
              expanded={expanded === frame.camId}
              onExpand={() => setExpanded(frame.camId)}
            />
          ))}
        </div>
      )}

      {/* Expanded modal */}
      <AnimatePresence>
        {expandedFrame && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            onClick={() => setExpanded(null)}
            style={{
              position:'fixed', inset:0, zIndex:1000,
              background:'rgba(15,23,42,0.75)',
              backdropFilter:'blur(8px)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            <motion.div
              initial={{ scale:0.9, opacity:0 }}
              animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.9, opacity:0 }}
              onClick={e => e.stopPropagation()}
              className="card rounded-2xl overflow-hidden"
              style={{ width:640, height:400 }}
            >
              <div className="flex items-center justify-between px-4 py-3"
                   style={{ borderBottom:'1px solid #e2e8f0' }}>
                <div className="flex items-center gap-2">
                  <Camera size={14} color="#0145f2" />
                  <span className="font-mono font-bold text-slate-900">{expandedFrame.label}</span>
                  <span className="badge-navy">{expandedFrame.zone}</span>
                </div>
                <button onClick={() => setExpanded(null)} className="text-slate-400 hover:text-slate-700 font-mono text-sm">✕</button>
              </div>
              <div className="relative" style={{ height:340 }}>
                <CamCanvas frame={expandedFrame} />
                <div className={`cam-scanline ${expandedFrame.anomaly ? 'cam-scanline-alert':''}`} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
