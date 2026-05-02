// src/pages/WasteCameraPage.tsx
// AI waste detection camera page — enhanced version
// Features: confidence slider, camera flip, CSV export, detection bar chart

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  Camera, CameraOff, Save, RefreshCw,
  CheckCircle, Info, Download, FlipHorizontal, SlidersHorizontal, Leaf
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import WasteCamera, { CAT_CONFIG } from '@/components/WasteCamera';
import type { WasteCameraHandle, Detection } from '@/components/WasteCamera';
import { wasteApi } from '@/lib/api';
import useStore from '@/store/useStore';

// Category → WasteLog wasteType mapping
const CAT_TO_TYPE: Record<string, string> = {
  plastic:    'recyclable',
  paper:      'recyclable',
  organic:    'organic',
  'e-waste':  'e-waste',
  recyclable: 'recyclable',
  general:    'general',
};

// Eco score: recyclable/organic categories = good, general/e-waste = lower score
const ECO_WEIGHT: Record<string, number> = {
  recyclable: 1.0, organic: 0.9, paper: 1.0,
  plastic: 0.7, 'e-waste': 0.5, general: 0.2,
};

interface CaptureLog {
  id:       string;
  category: string;
  label:    string;
  score:    number;
  ts:       Date;
}

interface SessionStat { count: number; totalScore: number; }

export default function WasteCameraPage() {
  const ref       = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<WasteCameraHandle>(null);

  const { addToast } = useStore();
  const [active,     setActive]     = useState(false);
  const [captures,   setCaptures]   = useState<CaptureLog[]>([]);
  const [session,    setSession]    = useState<Record<string, SessionStat>>({});
  const [zone,       setZone]       = useState('Zone A - North');
  const [vehicle,    setVehicle]    = useState('VH-001');
  const [saving,     setSaving]     = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [minScore,   setMinScore]   = useState(0.45);
  const [facingMode, setFacingMode] = useState<'environment'|'user'>('environment');
  const [showSlider, setShowSlider] = useState(false);
  const cooldownRef = useRef<Record<string,number>>({});

  // GSAP entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.cam-block',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out' }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  // Called by WasteCamera on each detection batch
  const handleDetection = useCallback((dets: Detection[]) => {
    setFrameCount(c => c + 1);
    const now = Date.now();

    dets.forEach(d => {
      const last = cooldownRef.current[d.category] ?? 0;
      if (now - last < 3000) return;
      cooldownRef.current[d.category] = now;

      const log: CaptureLog = {
        id:       `${d.category}-${now}`,
        category: d.category,
        label:    d.label,
        score:    d.score,
        ts:       new Date(),
      };

      setCaptures(prev => [log, ...prev].slice(0, 50));
      setSession(prev => ({
        ...prev,
        [d.category]: {
          count:      (prev[d.category]?.count ?? 0) + 1,
          totalScore: (prev[d.category]?.totalScore ?? 0) + d.score,
        },
      }));
    });
  }, []);

  // Save session to MongoDB
  async function saveSession() {
    if (captures.length === 0) { addToast('warning', 'No detections to save'); return; }
    setSaving(true);
    try {
      const grouped: Record<string, CaptureLog[]> = {};
      captures.forEach(c => { (grouped[c.category] ??= []).push(c); });

      let saved = 0;
      for (const [cat, logs] of Object.entries(grouped)) {
        await wasteApi.create({
          vehicleId:  vehicle,
          zone,
          wasteType:  CAT_TO_TYPE[cat] ?? 'general',
          weightKg:   logs.length * 0.5,
          notes:      `AI-detected: ${logs.map(l=>l.label).join(', ')} · avg confidence ${Math.round(logs.reduce((s,l)=>s+l.score,0)/logs.length*100)}%`,
          status:     'collected',
          source:     'ai_camera',
        });
        saved++;
      }
      setSavedCount(v => v + saved);
      addToast('success', `${saved} waste log${saved>1?'s':''} saved to MongoDB`);
      setCaptures([]);
      setSession({});
    } catch { addToast('error', 'Failed to save logs'); }
    finally { setSaving(false); }
  }

  // Export CSV
  function exportCsv() {
    if (captures.length === 0) { addToast('warning', 'No detections to export'); return; }
    const header = 'Category,Label,Confidence (%),Timestamp,Zone,Vehicle\n';
    const rows = captures.map(c =>
      `${c.category},${c.label},${Math.round(c.score*100)},${c.ts.toISOString()},${zone},${vehicle}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `ecotrack-camera-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    addToast('success', `${captures.length} detections exported as CSV`);
  }

  function clearSession() {
    setCaptures([]);
    setSession({});
    setFrameCount(0);
    cooldownRef.current = {};
  }

  function flipCamera() {
    if (active) {
      setActive(false);
      setTimeout(() => {
        setFacingMode(m => m === 'environment' ? 'user' : 'environment');
        setActive(true);
      }, 400);
    } else {
      setFacingMode(m => m === 'environment' ? 'user' : 'environment');
    }
  }

  const totalDetections = Object.values(session).reduce((s,v) => s+v.count, 0);
  const dominantCat     = Object.entries(session).sort((a,b) => b[1].count-a[1].count)[0]?.[0];

  // Eco score (0–100)
  const ecoScore = totalDetections > 0
    ? Math.round(
        Object.entries(session).reduce((sum,[cat,stat]) => sum + (ECO_WEIGHT[cat]??0.3) * stat.count, 0)
        / totalDetections * 100
      )
    : 0;

  // Chart data
  const chartData = Object.entries(session).map(([cat,stat]) => ({
    name: CAT_CONFIG[cat]?.label ?? cat,
    count: stat.count,
    fill: CAT_CONFIG[cat]?.colour ?? '#22c55e',
  }));

  const circumference = 2 * Math.PI * 36;
  const ringOffset    = circumference - (ecoScore / 100) * circumference;
  const ringColor     = ecoScore >= 70 ? '#22c55e' : ecoScore >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div ref={ref} className="p-6 space-y-5">

      {/* Page header */}
      <div className="cam-block flex items-center justify-between">
        <div>
          <h1 className="page-title text-green-900">Waste Detection Camera</h1>
          <p className="text-small text-slate-500 mt-0.5">
            AI object detection · TensorFlow.js COCO-SSD · Browser-only · No data uploaded
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalDetections > 0 && (
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }} className="badge-green">
              {totalDetections} detected
            </motion.div>
          )}
          {savedCount > 0 && <div className="badge-teal">{savedCount} saved</div>}
        </div>
      </div>

      {/* Info banner */}
      <div className="cam-block flex items-start gap-3 px-4 py-3 rounded-2xl"
           style={{ background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.25)', padding:'0.75rem 1rem' }}>
        <Info size={16} color="#22c55e" className="flex-shrink-0 mt-0.5"/>
        <div className="text-small text-green-800">
          Point your camera at waste items — plastic bottles, paper, food, phones, etc.
          Detections auto-log every 3 seconds. Use the <strong>confidence slider</strong> to tune sensitivity.
          Press <strong>Save Session</strong> to write results to the database, or <strong>Export CSV</strong> for raw data.
        </div>
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-3 gap-5">

        {/* Camera viewport — 2/3 */}
        <div className="col-span-2 space-y-4">
          <div className="cam-block" style={{ height:420, padding:0, overflow:'hidden' }}>
            <WasteCamera
              key={facingMode}
              ref={cameraRef}
              active={active}
              onDetection={handleDetection}
              minScore={minScore}
              facingMode={facingMode}
            />
          </div>

          {/* Controls */}
          <div className="cam-block flex flex-wrap items-center gap-3">
            {/* Start/Stop */}
            <button onClick={() => setActive(v => !v)} className={active ? 'btn-outline' : 'btn-green'}>
              {active ? <><CameraOff size={14}/> Stop Camera</> : <><Camera size={14}/> Start Detection</>}
            </button>

            {/* Flip camera */}
            <div className="tooltip-wrap">
              <button onClick={flipCamera} className="btn-ghost py-2 px-2.5" title="Flip camera">
                <FlipHorizontal size={14}/>
              </button>
              <span className="tooltip">{facingMode === 'environment' ? 'Switch to front cam' : 'Switch to rear cam'}</span>
            </div>

            {/* Confidence slider toggle */}
            <div className="tooltip-wrap">
              <button onClick={() => setShowSlider(v => !v)}
                      className={`btn-ghost py-2 px-2.5 ${showSlider ? 'border-green-400 text-green-700' : ''}`}>
                <SlidersHorizontal size={14}/>
              </button>
              <span className="tooltip">Confidence threshold</span>
            </div>

            {/* Zone select */}
            <div className="flex-1 min-w-32">
              <label className="section-heading block mb-1">Zone</label>
              <select className="select py-1.5 text-small" value={zone} onChange={e=>setZone(e.target.value)}>
                {['Zone A - North','Zone B - South','Zone C - East','Zone D - West','Zone E - Central'].map(z=>(
                  <option key={z}>{z}</option>
                ))}
              </select>
            </div>

            {/* Vehicle select */}
            <div className="flex-1 min-w-28">
              <label className="section-heading block mb-1">Vehicle</label>
              <select className="select py-1.5 text-small" value={vehicle} onChange={e=>setVehicle(e.target.value)}>
                {['VH-001','VH-002','VH-003','VH-004'].map(v=>(
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 self-end flex-wrap">
              <button onClick={clearSession} className="btn-ghost py-2" title="Clear session">
                <RefreshCw size={13}/>
              </button>
              <button onClick={exportCsv} disabled={captures.length===0} className="btn-outline py-2">
                <Download size={13}/> CSV
              </button>
              <button onClick={saveSession} disabled={saving || captures.length===0} className="btn-green py-2">
                {saving
                  ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving…</>
                  : <><Save size={14}/> Save ({captures.length})</>
                }
              </button>
            </div>
          </div>

          {/* Confidence slider (collapsible) */}
          <AnimatePresence>
            {showSlider && (
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                          className="cam-block" style={{padding:'1rem 1.25rem'}}>
                <div className="flex items-center justify-between mb-2">
                  <label className="section-heading">Detection Confidence Threshold</label>
                  <span className="font-mono font-bold text-green-700" style={{fontSize:'0.875rem'}}>
                    {Math.round(minScore*100)}%
                  </span>
                </div>
                <input type="range" min="0.2" max="0.9" step="0.05"
                       value={minScore} onChange={e=>setMinScore(parseFloat(e.target.value))}
                       className="eco-slider"/>
                <div className="flex justify-between mt-1">
                  <span className="font-mono text-slate-400" style={{fontSize:'0.65rem'}}>20% (sensitive)</span>
                  <span className="font-mono text-slate-400" style={{fontSize:'0.65rem'}}>90% (strict)</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category stats row */}
          {Object.keys(session).length > 0 && (
            <div className="cam-block grid grid-cols-3 gap-3" style={{padding:'1rem'}}>
              {Object.entries(session).map(([cat, stat]) => {
                const cfg = CAT_CONFIG[cat];
                const avgConf = Math.round((stat.totalScore / stat.count) * 100);
                return (
                  <motion.div key={cat} initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }}
                              className="card px-4 py-3" style={{ borderColor:`${cfg?.colour}45` }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span style={{ fontSize:'1.1rem' }}>{cfg?.icon}</span>
                      <span className="font-mono font-bold" style={{ color:cfg?.colour, fontSize:'0.75rem' }}>
                        {cfg?.label ?? cat}
                      </span>
                    </div>
                    <div className="font-mono font-bold" style={{ fontSize:'1.5rem', color:cfg?.colour, lineHeight:1 }}>{stat.count}</div>
                    <div className="font-mono text-slate-400 mt-0.5" style={{ fontSize:'0.65rem' }}>
                      detections · {avgConf}% avg conf
                    </div>
                    <div className="fill-bar mt-2">
                      <div className="fill-bar-inner" style={{ background:cfg?.colour, width:`${avgConf}%` }}/>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Mini detection bar chart */}
          {chartData.length > 0 && (
            <div className="cam-block" style={{padding:'1rem 1.25rem'}}>
              <div className="section-heading mb-3">Session Detection Chart</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData} margin={{top:4,right:4,left:-20,bottom:0}}>
                  <XAxis dataKey="name" tick={{fontSize:9,fontFamily:'Space Mono',fill:'#94a3b8'}} tickLine={false} axisLine={false}/>
                  <YAxis tick={{fontSize:9,fontFamily:'Space Mono',fill:'#94a3b8'}} tickLine={false} axisLine={false}/>
                  <Tooltip contentStyle={{fontFamily:'Space Mono',fontSize:11,borderRadius:12,border:'1px solid #bbf7d0'}}/>
                  {chartData.map((d,i) => (
                    <Bar key={i} dataKey="count" fill={d.fill} radius={[5,5,0,0]}/>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right panel — 1/3 */}
        <div className="space-y-4">

          {/* Eco Score Ring */}
          <div className="cam-block card p-4 flex flex-col items-center" style={{padding:'1.25rem'}}>
            <div className="section-heading mb-3 self-start">Session Eco Score</div>
            <div className="relative" style={{width:96,height:96}}>
              <svg width="96" height="96" className="progress-ring" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="36" fill="none" stroke="#dcfce7" strokeWidth="8"/>
                <circle cx="48" cy="48" r="36" fill="none"
                        stroke={ringColor} strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={totalDetections > 0 ? ringOffset : circumference}
                        className="progress-ring-circle"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono font-bold" style={{fontSize:'1.4rem',color:ringColor,lineHeight:1}}>{ecoScore}</span>
                <span className="font-mono text-slate-400" style={{fontSize:'0.6rem'}}>/ 100</span>
              </div>
            </div>
            <div className="font-mono text-slate-500 text-center mt-2" style={{fontSize:'0.7rem'}}>
              {ecoScore >= 70 ? '🌿 Excellent sorting!' : ecoScore >= 40 ? '⚡ Good effort' : totalDetections > 0 ? '⚠️ High e-waste ratio' : 'Start camera to score'}
            </div>
          </div>

          {/* Session summary card */}
          <div className="cam-block card p-4" style={{padding:'1.25rem'}}>
            <div className="section-heading mb-3">Session Summary</div>
            <div className="space-y-2">
              <div className="flex justify-between text-small">
                <span className="text-slate-500">Frames analysed</span>
                <span className="font-mono font-bold text-green-700">{frameCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-small">
                <span className="text-slate-500">Items detected</span>
                <span className="font-mono font-bold text-green-700">{totalDetections}</span>
              </div>
              <div className="flex justify-between text-small">
                <span className="text-slate-500">Categories found</span>
                <span className="font-mono font-bold text-green-700">{Object.keys(session).length}</span>
              </div>
              {dominantCat && (
                <div className="flex justify-between text-small">
                  <span className="text-slate-500">Most detected</span>
                  <span className="font-mono font-bold capitalize" style={{ color:CAT_CONFIG[dominantCat]?.colour }}>
                    {CAT_CONFIG[dominantCat]?.icon} {dominantCat}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-small">
                <span className="text-slate-500">Confidence threshold</span>
                <span className="font-mono font-bold text-green-700">{Math.round(minScore*100)}%</span>
              </div>
              <div className="flex justify-between text-small">
                <span className="text-slate-500">Est. weight</span>
                <span className="font-mono font-bold text-green-700">{(totalDetections * 0.5).toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between text-small">
                <span className="text-slate-500">Camera mode</span>
                <span className="font-mono font-bold text-green-700 capitalize">{facingMode === 'environment' ? 'Rear' : 'Front'}</span>
              </div>
            </div>
          </div>

          {/* Live detection feed */}
          <div className="cam-block card p-4 flex flex-col" style={{ maxHeight:320, padding:'1.25rem' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="section-heading">Detection Feed</div>
              {active && <div className="live-pulse w-2 h-2 rounded-full" style={{ background:'#22c55e' }}/>}
            </div>

            <div className="flex-1 overflow-y-auto scroll-thin space-y-1.5 pr-1">
              <AnimatePresence initial={false}>
                {captures.slice(0,25).map(cap => {
                  const cfg = CAT_CONFIG[cap.category];
                  return (
                    <motion.div key={cap.id}
                      initial={{ opacity:0, x:12, scale:.95 }}
                      animate={{ opacity:1, x:0,  scale:1  }}
                      exit={{ opacity:0 }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                      style={{ background:cfg?.bg??'rgba(0,0,0,0.03)', border:`1px solid ${cfg?.colour??'#e2e8f0'}30` }}
                    >
                      <span style={{ fontSize:'1rem', flexShrink:0 }}>{cfg?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono font-bold capitalize text-slate-800" style={{ fontSize:'0.75rem' }}>
                          {cap.category}
                        </div>
                        <div className="font-mono text-slate-400" style={{ fontSize:'0.6rem' }}>
                          {cap.label}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono font-bold" style={{ color:cfg?.colour, fontSize:'0.75rem' }}>
                          {Math.round(cap.score * 100)}%
                        </div>
                        <div className="font-mono text-slate-400" style={{ fontSize:'0.6rem' }}>
                          {cap.ts.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {captures.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{ background:'rgba(34,197,94,0.1)' }}>
                    <Camera size={18} color="#22c55e"/>
                  </div>
                  <p className="font-mono text-slate-400 text-center" style={{ fontSize:'0.7rem' }}>
                    {active ? 'Point camera at waste items' : 'Start camera to detect waste'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Detectable categories legend */}
          <div className="cam-block card p-4" style={{padding:'1.25rem'}}>
            <div className="section-heading mb-3">Detectable Categories</div>
            <div className="space-y-2">
              {Object.entries(CAT_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2.5">
                  <span style={{ fontSize:'0.9rem' }}>{cfg.icon}</span>
                  <div className="flex-1">
                    <div className="font-mono font-bold" style={{ color:cfg.colour, fontSize:'0.7rem' }}>{cfg.label}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-slate-400" style={{ fontSize:'0.6rem' }}>
                      {key === 'plastic'    ? 'bottle, cup, glass' :
                       key === 'paper'      ? 'book, bag' :
                       key === 'organic'    ? 'food, fruit, veg' :
                       key === 'e-waste'    ? 'phone, laptop, TV' :
                       key === 'recyclable' ? 'scissors, metal' :
                       'backpack, ball…'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
