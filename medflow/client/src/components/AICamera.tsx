// src/components/AICamera.tsx
// Privacy-first AI camera viewport
// Shows ONLY wireframe skeleton (no raw video) unless emergency toggle
// Integrates useMediaPipe hook

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Eye, EyeOff, AlertTriangle, Wifi } from 'lucide-react';
import { useMediaPipe } from '@/hooks/useMediaPipe';
import type { PoseResult } from '@/hooks/useMediaPipe';

interface AICameraProps {
  patientId: string;
  isAlert?:  boolean;
  onPose?:   (result: PoseResult) => void;
}

export default function AICamera({ patientId, isAlert = false, onPose }: AICameraProps) {
  const [enabled,    setEnabled]    = useState(false);
  const [showVideo,  setShowVideo]  = useState(false); // emergency grayscale overlay

  const { videoRef, canvasRef, isActive, error, poseResult } = useMediaPipe({
    patientId,
    enabled,
    onPoseResult: onPose,
  });

  const alertCounts = poseResult?.detections.length ?? 0;

  return (
    <div className="flex flex-col h-full">

      {/* ── VIEWPORT ── */}
      <div
        className={`relative flex-1 overflow-hidden rounded-lg
          ${isAlert || alertCounts > 0 ? 'alert-critical' : 'glass'}
        `}
        style={{ minHeight: 200, background: '#020202' }}
      >
        {/* Corner brackets */}
        <div className="brackets absolute inset-0 z-10 pointer-events-none"><span /></div>

        {/* Camera disabled state */}
        {!enabled && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20">
            <CameraOff size={28} className="text-grey-400" />
            <p className="font-mono text-grey-400 text-xs text-center px-4">
              AI Pose Engine Offline<br/>
              <span className="text-grey-400" style={{fontSize:9}}>Enable camera for privacy-first monitoring</span>
            </p>
            <button
              onClick={() => setEnabled(true)}
              className="btn-cyan text-xs px-4 py-2"
            >
              <Camera size={12} /> START AI MONITOR
            </button>
          </div>
        )}

        {/* Error state */}
        {enabled && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20">
            <AlertTriangle size={22} className="text-amber" />
            <p className="font-mono text-amber text-xs text-center px-4">{error}</p>
            <button onClick={() => setEnabled(false)} className="btn-ghost text-xs px-3 py-1">
              DISMISS
            </button>
          </div>
        )}

        {/* Hidden video element (MediaPipe source — never shown by default) */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter:  'grayscale(100%) contrast(1.05) brightness(0.7)',
            opacity: showVideo && isActive ? 0.4 : 0,
            transition: 'opacity 0.4s',
          }}
          playsInline muted autoPlay
        />

        {/* Wireframe skeleton canvas (always on top) */}
        <canvas
          ref={canvasRef}
          className="pose-canvas z-10"
          style={{ background: 'transparent' }}
        />

        {/* Scan line */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-15">
            <div style={{
              position:'absolute', left:0, right:0, height:'1.5px',
              background:`linear-gradient(90deg,transparent,${isAlert?'rgba(255,0,0,0.18)':'rgba(0,212,255,0.1)'},transparent)`,
              animation:'scanLine 3s linear infinite',
            }} />
          </div>
        )}

        {/* Alert vignette flash */}
        <AnimatePresence>
          {(isAlert || alertCounts > 0) && isActive && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-8"
              animate={{ opacity:[0,0.15,0] }}
              transition={{ duration:1.5, repeat:Infinity }}
              style={{ background:'radial-gradient(ellipse at center,rgba(255,0,0,0.3) 0%,transparent 70%)' }}
            />
          )}
        </AnimatePresence>

        {/* ── HUD TOP ── */}
        {isActive && (
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2"
               style={{ background:'linear-gradient(180deg,rgba(2,2,2,0.85) 0%,transparent 100%)' }}>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ opacity:[1,0.2,1] }}
                transition={{ duration: isAlert ? 0.8 : 1.8, repeat:Infinity }}
                className="flex items-center gap-1.5"
              >
                <div className="w-1.5 h-1.5 rounded-full"
                     style={{ background: isAlert ? '#FF0000' : '#00d4ff',
                              boxShadow: `0 0 5px ${isAlert ? '#FF0000' : '#00d4ff'}` }} />
                <span className="font-mono" style={{ fontSize:8, letterSpacing:'0.14em',
                                                    color: isAlert ? '#FF0000' : '#00d4ff' }}>
                  AI ACTIVE
                </span>
              </motion.div>
              <div className="divider-v h-3" />
              <span className="font-mono text-grey-400" style={{fontSize:8}}>WIREFRAME MODE</span>
            </div>
            <span className="font-mono text-grey-400" style={{fontSize:8}}>{patientId}</span>
          </div>
        )}

        {/* ── HUD BOTTOM ── */}
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 z-20 px-3 py-2"
               style={{ background:'linear-gradient(0deg,rgba(2,2,2,0.9) 0%,transparent 100%)' }}>
            <div className="flex items-end justify-between">
              <div>
                <div className="vital-label mb-1">GAIT STABILITY</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-bold" style={{fontSize:18, color:'#f0f0f0'}}>
                    {poseResult?.gaitScore ?? '—'}
                    <span style={{fontSize:10, color:'rgba(255,255,255,0.4)', marginLeft:1}}>%</span>
                  </span>
                  <div style={{width:50,height:2,background:'rgba(50,50,50,0.8)',borderRadius:1}}>
                    <div style={{
                      height:'100%', borderRadius:1, background:'#a0a0a0',
                      width:`${poseResult?.gaitScore ?? 0}%`,
                      transition:'width 0.6s',
                    }} />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="vital-label mb-1">PATTERN</div>
                <div className="font-mono font-bold"
                     style={{ fontSize:11, letterSpacing:'0.1em',
                              color: (isAlert || alertCounts > 0) ? '#FF0000' : '#d0d0d0' }}>
                  {poseResult?.pattern ?? 'NO_SIGNAL'}
                </div>
              </div>
            </div>

            {/* Detection pills */}
            {poseResult && poseResult.detections.length > 0 && (
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {poseResult.detections.map(d => (
                  <motion.span
                    key={d}
                    initial={{ opacity:0, scale:0.85 }}
                    animate={{ opacity:1, scale:1 }}
                    className="badge-red"
                    style={{ fontSize:7 }}
                  >
                    {d.replace(/_/g,' ')}
                  </motion.span>
                ))}
              </div>
            )}

            {/* Telemetry row */}
            <div className="flex gap-3 mt-1.5">
              {[
                { k:'CONF', v:'96.2%' },
                { k:'FPS',  v:'24' },
                { k:'MODEL', v:'MP-POSE' },
              ].map(i => (
                <div key={i.k} className="flex items-center gap-1">
                  <span className="vital-label" style={{fontSize:7}}>{i.k}</span>
                  <span className="font-mono text-grey-300" style={{fontSize:8}}>{i.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CONTROLS ── */}
      <div className="flex items-center gap-2 mt-2.5 flex-shrink-0">
        {isActive ? (
          <>
            <button
              onClick={() => setEnabled(false)}
              className="btn-ghost flex-1 text-xs py-1.5 justify-center"
            >
              <CameraOff size={12} /> STOP AI
            </button>
            <button
              onClick={() => setShowVideo(v => !v)}
              className={`btn-ghost px-3 py-1.5 text-xs ${showVideo ? 'border-amber/40 text-amber' : ''}`}
              title="Toggle grayscale video"
            >
              {showVideo ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </>
        ) : (
          !error && (
            <button
              onClick={() => setEnabled(true)}
              className="btn-cyan flex-1 text-xs py-1.5 justify-center"
            >
              <Camera size={12} /> START AI MONITOR
            </button>
          )
        )}
      </div>

      {/* ── STATUS BAR ── */}
      <div className="flex items-center gap-2 mt-2">
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          isActive ? 'bg-green' : error ? 'bg-red' : 'bg-grey-400'
        }`} style={{ boxShadow: isActive ? '0 0 5px rgba(0,255,136,0.6)' : 'none' }} />
        <span className="font-mono text-grey-400" style={{fontSize:9}}>
          {isActive ? 'MediaPipe Pose Engine Active' : error ? error : 'AI Engine Standby'}
        </span>
      </div>
    </div>
  );
}
