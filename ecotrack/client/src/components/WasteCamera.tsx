// src/components/WasteCamera.tsx
// TensorFlow.js COCO-SSD object detection → waste category classification
// Runs entirely in browser — no video sent to server
// Emits: detected waste type + confidence + count per frame

import React, {
  useRef, useEffect, useState, useCallback, forwardRef,
  useImperativeHandle,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Loader, AlertTriangle } from 'lucide-react';

// ── COCO-SSD label → waste category mapping ─────────────────
const WASTE_MAP: Record<string, { category: string; colour: string; confidence_boost: number }> = {
  // Plastic
  bottle:          { category:'plastic',    colour:'#06b6d4', confidence_boost:0 },
  cup:             { category:'plastic',    colour:'#06b6d4', confidence_boost:0 },
  'wine glass':    { category:'plastic',    colour:'#06b6d4', confidence_boost:0 },
  vase:            { category:'plastic',    colour:'#06b6d4', confidence_boost:0 },

  // Paper / Cardboard
  book:            { category:'paper',      colour:'#f59e0b', confidence_boost:0 },
  'teddy bear':    { category:'paper',      colour:'#f59e0b', confidence_boost:0 },
  // handbag maps loosely to paper bags
  handbag:         { category:'paper',      colour:'#f59e0b', confidence_boost:0 },

  // Organic / Food
  banana:          { category:'organic',    colour:'#22c55e', confidence_boost:0 },
  apple:           { category:'organic',    colour:'#22c55e', confidence_boost:0 },
  orange:          { category:'organic',    colour:'#22c55e', confidence_boost:0 },
  broccoli:        { category:'organic',    colour:'#22c55e', confidence_boost:0 },
  carrot:          { category:'organic',    colour:'#22c55e', confidence_boost:0 },
  'hot dog':       { category:'organic',    colour:'#22c55e', confidence_boost:0 },
  pizza:           { category:'organic',    colour:'#22c55e', confidence_boost:0 },
  donut:           { category:'organic',    colour:'#22c55e', confidence_boost:0 },
  cake:            { category:'organic',    colour:'#22c55e', confidence_boost:0 },
  sandwich:        { category:'organic',    colour:'#22c55e', confidence_boost:0 },
  'dining table':  { category:'organic',    colour:'#22c55e', confidence_boost:0 },
  bowl:            { category:'organic',    colour:'#22c55e', confidence_boost:0 },
  fork:            { category:'organic',    colour:'#22c55e', confidence_boost:0 },
  knife:           { category:'organic',    colour:'#22c55e', confidence_boost:0 },
  spoon:           { category:'organic',    colour:'#22c55e', confidence_boost:0 },

  // E-waste
  'cell phone':    { category:'e-waste',    colour:'#8b5cf6', confidence_boost:0 },
  laptop:          { category:'e-waste',    colour:'#8b5cf6', confidence_boost:0 },
  tv:              { category:'e-waste',    colour:'#8b5cf6', confidence_boost:0 },
  'remote':        { category:'e-waste',    colour:'#8b5cf6', confidence_boost:0 },
  keyboard:        { category:'e-waste',    colour:'#8b5cf6', confidence_boost:0 },
  mouse:           { category:'e-waste',    colour:'#8b5cf6', confidence_boost:0 },
  microwave:       { category:'e-waste',    colour:'#8b5cf6', confidence_boost:0 },
  oven:            { category:'e-waste',    colour:'#8b5cf6', confidence_boost:0 },
  toaster:         { category:'e-waste',    colour:'#8b5cf6', confidence_boost:0 },
  refrigerator:    { category:'e-waste',    colour:'#8b5cf6', confidence_boost:0 },

  // Metal / Recyclable
  scissors:        { category:'recyclable', colour:'#10b981', confidence_boost:0 },
  'fire hydrant':  { category:'recyclable', colour:'#10b981', confidence_boost:0 },
  chair:           { category:'recyclable', colour:'#10b981', confidence_boost:0 },
  bench:           { category:'recyclable', colour:'#10b981', confidence_boost:0 },

  // General
  backpack:        { category:'general',    colour:'#94a3b8', confidence_boost:0 },
  umbrella:        { category:'general',    colour:'#94a3b8', confidence_boost:0 },
  suitcase:        { category:'general',    colour:'#94a3b8', confidence_boost:0 },
  'sports ball':   { category:'general',    colour:'#94a3b8', confidence_boost:0 },
};

// Category display config
const CAT_CONFIG: Record<string, { label:string; colour:string; bg:string; icon:string }> = {
  plastic:    { label:'Plastic',    colour:'#06b6d4', bg:'rgba(6,182,212,0.12)',   icon:'🧴' },
  paper:      { label:'Paper',      colour:'#f59e0b', bg:'rgba(245,158,11,0.12)',  icon:'📄' },
  organic:    { label:'Organic',    colour:'#22c55e', bg:'rgba(34,197,94,0.12)',   icon:'🥗' },
  'e-waste':  { label:'E-Waste',    colour:'#8b5cf6', bg:'rgba(139,92,246,0.12)',  icon:'📱' },
  recyclable: { label:'Recyclable', colour:'#10b981', bg:'rgba(16,185,129,0.12)',  icon:'♻️' },
  general:    { label:'General',    colour:'#94a3b8', bg:'rgba(148,163,184,0.12)', icon:'🗑️' },
};

export interface Detection {
  label:      string;
  category:   string;
  score:      number;
  bbox:       [number, number, number, number]; // x, y, w, h  — normalised 0–1
  colour:     string;
}

export interface WasteCameraHandle {
  getDetections: () => Detection[];
  getCategoryCounts: () => Record<string, number>;
}

interface Props {
  onDetection?: (detections: Detection[]) => void;
  minScore?:    number;
  active:       boolean;
  facingMode?:  'environment' | 'user';
}

const WasteCamera = forwardRef<WasteCameraHandle, Props>(
  ({ onDetection, minScore = 0.45, active, facingMode = 'environment' }, ref) => {
    const videoRef   = useRef<HTMLVideoElement>(null);
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const rafRef     = useRef<number>(0);
    const modelRef   = useRef<unknown>(null);
    const streamRef  = useRef<MediaStream | null>(null);

    const [status,  setStatus]  = useState<'idle'|'loading'|'ready'|'error'>('idle');
    const [errMsg,  setErrMsg]  = useState('');
    const [dets,    setDets]    = useState<Detection[]>([]);
    const [fps,     setFps]     = useState(0);
    const fpsRef = useRef({ frames:0, last:Date.now() });
    const detsRef = useRef<Detection[]>([]);

    // Expose handle for parent
    useImperativeHandle(ref, () => ({
      getDetections:    () => detsRef.current,
      getCategoryCounts:() => {
        const counts: Record<string,number> = {};
        detsRef.current.forEach(d => { counts[d.category] = (counts[d.category]??0) + 1; });
        return counts;
      },
    }));

    // Draw bounding boxes on canvas
    const drawBoxes = useCallback((
      ctx: CanvasRenderingContext2D,
      detections: Detection[],
      w: number, h: number
    ) => {
      ctx.clearRect(0, 0, w, h);
      detections.forEach(d => {
        const [nx, ny, nw, nh] = d.bbox;
        const x = nx * w, y = ny * h, bw = nw * w, bh = nh * h;

        // Box
        ctx.strokeStyle = d.colour;
        ctx.lineWidth   = 2;
        ctx.shadowColor = d.colour;
        ctx.shadowBlur  = 6;
        ctx.strokeRect(x, y, bw, bh);
        ctx.shadowBlur = 0;

        // Corner accents
        const cs = 12;
        ctx.lineWidth = 3;
        [[x,y,1,1],[x+bw,y,-1,1],[x,y+bh,1,-1],[x+bw,y+bh,-1,-1]].forEach(([cx,cy,dx,dy])=>{
          ctx.beginPath(); ctx.moveTo(cx as number,cy as number+(dy as number)*cs);
          ctx.lineTo(cx as number,cy as number); ctx.lineTo(cx as number+(dx as number)*cs,cy as number);
          ctx.stroke();
        });

        // Label pill background
        const labelText = `${CAT_CONFIG[d.category]?.icon ?? ''} ${d.category.toUpperCase()} ${Math.round(d.score*100)}%`;
        ctx.font = 'bold 11px Space Mono, monospace';
        const tw  = ctx.measureText(labelText).width;
        const ph  = 20, pw = tw + 12;
        const lx  = Math.max(0, Math.min(x, w - pw));
        const ly  = y > ph + 4 ? y - ph - 4 : y + bh + 4;

        ctx.fillStyle = d.colour;
        ctx.beginPath();
        ctx.roundRect(lx, ly, pw, ph, 4);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillText(labelText, lx + 6, ly + 14);
      });
    }, []);

    // Main detection loop
    const detect = useCallback(async () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      const model  = modelRef.current as { detect: (v:HTMLVideoElement)=>Promise<Array<{class:string;score:number;bbox:[number,number,number,number]}>> } | null;
      if (!video || !canvas || !model || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }
      const ctx = canvas.getContext('2d')!;
      const w = canvas.width, h = canvas.height;

      try {
        const predictions = await model.detect(video);

        const mapped: Detection[] = predictions
          .filter(p => WASTE_MAP[p.class] && p.score >= minScore)
          .map(p => {
            const [bx, by, bw, bh] = p.bbox;
            return {
              label:    p.class,
              category: WASTE_MAP[p.class].category,
              score:    p.score,
              bbox:     [bx/w, by/h, bw/w, bh/h] as [number,number,number,number],
              colour:   WASTE_MAP[p.class].colour,
            };
          });

        drawBoxes(ctx, mapped, w, h);
        setDets(mapped);
        detsRef.current = mapped;
        if (mapped.length > 0) onDetection?.(mapped);

        // FPS counter
        fpsRef.current.frames++;
        const now = Date.now();
        if (now - fpsRef.current.last >= 1000) {
          setFps(fpsRef.current.frames);
          fpsRef.current = { frames:0, last:now };
        }
      } catch {}

      rafRef.current = requestAnimationFrame(detect);
    }, [drawBoxes, minScore, onDetection]);

    // Start camera + model
    const start = useCallback(async () => {
      setStatus('loading');
      try {
        // Camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width:{ ideal:640 }, height:{ ideal:480 }, facingMode },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // TF.js + COCO-SSD via CDN
        if (!modelRef.current) {
          // Load tf and cocoSsd from window (loaded via script tags)
          const tf = (window as unknown as {tf: unknown}).tf;
          const cocoSsd = (window as unknown as {cocoSsd: {load:(opts:{base:string})=>Promise<unknown>}}).cocoSsd;
          if (!tf || !cocoSsd) throw new Error('TensorFlow.js not loaded');

          const m = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
          modelRef.current = m;
        }

        setStatus('ready');
        rafRef.current = requestAnimationFrame(detect);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Camera error';
        setErrMsg(msg.includes('TensorFlow') ? 'TF.js loading… reload in 5s' : msg);
        setStatus('error');
        console.warn('[WasteCamera]', err);
      }
    }, [detect]);

    // Stop — keep model cached so restart is instant
    const stop = useCallback(() => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      // Do NOT null modelRef — cached weights save ~5s on next start
      setStatus('idle');
      setDets([]);
      detsRef.current = [];
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
    }, []);

    useEffect(() => {
      if (active) start(); else stop();
      return () => stop();
    }, [active]);

    // Sync canvas size to video
    useEffect(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      const sync = () => { canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480; };
      video.addEventListener('loadedmetadata', sync);
      return () => video.removeEventListener('loadedmetadata', sync);
    }, []);

    return (
      <div className="relative w-full h-full rounded-2xl overflow-hidden"
           style={{ background:'#0f172a', minHeight:320 }}>

        {/* Video (always rendered, hidden in idle) */}
        <video ref={videoRef} autoPlay muted playsInline
               className="absolute inset-0 w-full h-full object-cover"
               style={{ opacity: status==='ready' ? 1 : 0, transition:'opacity .4s' }}/>

        {/* Detection canvas overlay */}
        <canvas ref={canvasRef} width={640} height={480}
                className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"/>

        {/* Scan line */}
        {status === 'ready' && (
          <div className="absolute inset-0 overflow-hidden z-5 pointer-events-none">
            <div style={{ position:'absolute',left:0,right:0,height:2,
                          background:'linear-gradient(90deg,transparent,rgba(34,197,94,0.35),transparent)',
                          animation:'scanline 3s linear infinite' }}/>
          </div>
        )}

        {/* Idle state */}
        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                 style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)' }}>
              <CameraOff size={24} color="#22c55e"/>
            </div>
            <p className="font-mono text-slate-400 text-center px-6" style={{ fontSize:'0.8rem' }}>
              Camera inactive<br/>
              <span style={{ fontSize:'0.7rem', color:'#64748b' }}>Press Start to begin waste detection</span>
            </p>
          </div>
        )}

        {/* Loading state */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-green-500 border-t-transparent animate-spin"/>
              <div className="absolute inset-2 rounded-full border-2 border-green-300 border-b-transparent animate-spin" style={{ animationDirection:'reverse', animationDuration:'0.8s' }}/>
            </div>
            <div className="text-center">
              <p className="font-mono text-green-400" style={{ fontSize:'0.8rem' }}>Loading AI Model…</p>
              <p className="font-mono text-slate-500 mt-0.5" style={{ fontSize:'0.7rem' }}>TensorFlow.js COCO-SSD</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-500/10">
              <AlertTriangle size={22} color="#ef4444"/>
            </div>
            <p className="font-mono text-red-400 text-center px-6" style={{ fontSize:'0.75rem' }}>{errMsg}</p>
          </div>
        )}

        {/* HUD — top bar */}
        {status === 'ready' && (
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2"
               style={{ background:'linear-gradient(180deg,rgba(0,0,0,0.65) 0%,transparent 100%)' }}>
            <div className="flex items-center gap-2">
              <div className="live-pulse w-2 h-2 rounded-full" style={{ background:'#22c55e' }}/>
              <span className="font-mono text-green-400" style={{ fontSize:'0.65rem', letterSpacing:'0.14em' }}>AI DETECTION ACTIVE</span>
            </div>
            <span className="font-mono text-slate-400" style={{ fontSize:'0.65rem' }}>{fps} FPS · COCO-SSD</span>
          </div>
        )}

        {/* HUD — bottom detections count */}
        {status === 'ready' && dets.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-20 px-3 py-2"
               style={{ background:'linear-gradient(0deg,rgba(0,0,0,0.7) 0%,transparent 100%)' }}>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(
                dets.reduce<Record<string,number>>((acc,d)=>({...acc,[d.category]:(acc[d.category]??0)+1}),{})
              ).map(([cat,cnt]) => (
                <span key={cat} className="font-mono font-bold px-2 py-0.5 rounded-lg"
                      style={{ background:CAT_CONFIG[cat]?.bg??'rgba(0,0,0,0.4)', color:CAT_CONFIG[cat]?.colour??'#fff', fontSize:'0.65rem', border:`1px solid ${CAT_CONFIG[cat]?.colour??'#fff'}40` }}>
                  {CAT_CONFIG[cat]?.icon} {cat} ×{cnt}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* No detection indicator */}
        {status === 'ready' && dets.length === 0 && (
          <div className="absolute bottom-3 left-3 z-20">
            <span className="font-mono text-slate-500" style={{ fontSize:'0.65rem', letterSpacing:'0.1em' }}>
              Point camera at waste items…
            </span>
          </div>
        )}
      </div>
    );
  }
);

WasteCamera.displayName = 'WasteCamera';

export { CAT_CONFIG };
export default WasteCamera;
