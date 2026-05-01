// src/pages/PoseAnalysis.tsx
import React,{ useRef,useEffect,useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { AreaChart,Area,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid } from 'recharts';
import { Scan,AlertTriangle,Activity,Cpu } from 'lucide-react';
import useStore from '../store/useStore';
import type { Store } from '../store/useStore';

// Skeleton connections (joint pairs)
const CONNECTIONS=[
  ['left_shoulder','right_shoulder'],['left_shoulder','left_elbow'],['right_shoulder','right_elbow'],
  ['left_elbow','left_wrist'],['right_elbow','right_wrist'],
  ['left_shoulder','left_hip'],['right_shoulder','right_hip'],
  ['left_hip','right_hip'],['left_hip','left_knee'],['right_hip','right_knee'],
  ['left_knee','left_ankle'],['right_knee','right_ankle'],
  ['nose','left_eye'],['nose','right_eye'],['left_eye','left_ear'],['right_eye','right_ear'],
];

const JOINT_GROUPS={
  head:    ['nose','left_eye','right_eye','left_ear','right_ear'],
  torso:   ['left_shoulder','right_shoulder','left_hip','right_hip'],
  arms:    ['left_elbow','right_elbow','left_wrist','right_wrist'],
  legs:    ['left_knee','right_knee','left_ankle','right_ankle'],
};

const POSTURE_COLOR={ SLEEPING:'#71E07E',RESTLESS:'#F59E0B',SITTING_UP:'#BA5FFF',STANDING:'#3B82F6',FALL_DETECTED:'#EF4444',UNKNOWN:'rgba(255,255,255,0.3)' };

// ── Skeleton canvas ──────────────────────────────────────────
function SkeletonCanvas({ frame,width=520,height=340 }:{frame:Store['poseFrame'];width?:number;height?:number}){
  const ref=useRef<HTMLCanvasElement>(null);

  useEffect(()=>{
    const canvas=ref.current; if(!canvas||!frame)return;
    const ctx=canvas.getContext('2d')!;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Dark bg
    ctx.fillStyle='rgba(5,12,28,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height);

    // Grid
    ctx.strokeStyle='rgba(255,255,255,0.03)'; ctx.lineWidth=1;
    for(let i=0;i<canvas.width;i+=32){ ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,canvas.height);ctx.stroke(); }
    for(let j=0;j<canvas.height;j+=32){ ctx.beginPath();ctx.moveTo(0,j);ctx.lineTo(canvas.width,j);ctx.stroke(); }

    // Bed outline
    ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=2; ctx.setLineDash([6,4]);
    ctx.strokeRect(40,40,canvas.width-80,canvas.height-80);
    ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(40,40,canvas.width-80,canvas.height-80);

    if(!frame.keypoints?.length)return;

    const kpMap:Record<string,{x:number;y:number;score:number}>={}
    frame.keypoints.forEach((kp:{name:string;x:number;y:number;score:number})=>{ kpMap[kp.name]={ x:kp.x*canvas.width, y:kp.y*canvas.height, score:kp.score }; });

    // Connections
    CONNECTIONS.forEach(([a,b])=>{
      const pa=kpMap[a]; const pb=kpMap[b];
      if(!pa||!pb)return;
      const minScore=Math.min(pa.score,pb.score);
      const color=frame.posture==='FALL_DETECTED'?'#EF4444':frame.posture==='RESTLESS'?'#F59E0B':'#71E07E';
      ctx.beginPath();
      ctx.strokeStyle=`${color}${Math.round(minScore*180).toString(16).padStart(2,'0')}`;
      ctx.lineWidth=2.5; ctx.shadowColor=color; ctx.shadowBlur=8;
      ctx.moveTo(pa.x,pa.y); ctx.lineTo(pb.x,pb.y); ctx.stroke();
      ctx.shadowBlur=0;
    });

    // Joints
    frame.keypoints.forEach((kp:{name:string;x:number;y:number;score:number})=>{
      const x=kp.x*canvas.width; const y=kp.y*canvas.height;
      const isHip=kp.name.includes('hip');
      const isCrit=frame.fallRisk==='HIGH'&&isHip;
      const r=isHip?6:kp.name.includes('ankle')||kp.name.includes('knee')?5:4;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle=isCrit?'#EF4444':'#71E07E';
      ctx.shadowColor=isCrit?'#EF4444':'#71E07E'; ctx.shadowBlur=isCrit?16:8;
      ctx.fill(); ctx.shadowBlur=0;
      // Label critical joints
      if(isCrit){
        ctx.font='bold 10px Space Mono,monospace'; ctx.fillStyle='#EF4444';
        ctx.fillText('HIP',x+8,y-8);
      }
    });

    // Posture label
    ctx.font='bold 13px Space Mono,monospace';
    ctx.fillStyle=POSTURE_COLOR[frame.posture]??'#fff';
    ctx.fillText(`▸ ${frame.posture.replace('_',' ')}`,16,canvas.height-16);
    ctx.font='11px Space Mono,monospace'; ctx.fillStyle='rgba(255,255,255,0.4)';
    ctx.fillText(`MEDPOSE-v2 · conf ${(frame.keypoints.reduce((s:number,k:{name:string;x:number;y:number;score:number})=>s+k.score,0)/frame.keypoints.length*100).toFixed(0)}%`,16,canvas.height-32);

    // Scan line
  },[frame]);

  return(
    <div className="relative rounded-xl overflow-hidden" style={{width:'100%'}}>
      <canvas ref={ref} width={width} height={height} style={{width:'100%',height,display:'block'}}/>
      <div className="cam-scan"/>
      {/* AI active badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{background:'rgba(98,0,217,0.7)',backdropFilter:'blur(8px)'}}>
        <Cpu size={10} color="#BA5FFF"/>
        <span className="font-mono text-xs font-bold" style={{color:'#BA5FFF',letterSpacing:'0.08em'}}>MEDPOSE-v2</span>
      </div>
      {/* Fall risk badge */}
      {frame?.fallRisk==='HIGH'&&(
        <motion.div animate={{opacity:[1,.4,1]}} transition={{duration:.8,repeat:Infinity}}
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg"
          style={{background:'rgba(239,68,68,0.8)'}}>
          <AlertTriangle size={11} color="#fff"/>
          <span className="font-mono text-xs font-bold text-white">HIGH FALL RISK</span>
        </motion.div>
      )}
    </div>
  );
}

// ── Joint score table ────────────────────────────────────────
function JointScoreGrid({ scores }:{ scores:Record<string,number> }){
  const joints=Object.entries(scores).slice(0,12);
  return(
    <div className="grid grid-cols-2 gap-1.5">
      {joints.map(([j,s])=>{
        const pct=Math.round(s*100);
        const color=pct>=85?'#71E07E':pct>=70?'#F59E0B':'#EF4444';
        return(
          <div key={j} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{background:'rgba(255,255,255,0.04)'}}>
            <div className="w-1 h-4 rounded-full flex-shrink-0" style={{background:color}}/>
            <div className="flex-1 min-w-0">
              <div className="font-sans text-white/50 truncate" style={{fontSize:'0.65rem'}}>{j.replace(/_/g,' ')}</div>
            </div>
            <div className="font-mono font-bold text-xs" style={{color}}>{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Morse Scale ──────────────────────────────────────────────
const MORSE_FACTORS=[
  {label:'Fall history',key:'history',max:25},
  {label:'Secondary diagnosis',key:'diag',max:15},
  {label:'Ambulatory aid',key:'aid',max:30},
  {label:'IV attached',key:'iv',max:20},
  {label:'Gait',key:'gait',max:20},
  {label:'Mental status',key:'mental',max:15},
];

function MorseScale({ score }:{ score:number }){
  const risk=score>=45?'HIGH RISK':score>=25?'MEDIUM RISK':'LOW RISK';
  const col=score>=45?'#EF4444':score>=25?'#F59E0B':'#71E07E';
  return(
    <div className="glass p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="section-label">Morse Fall Scale</div>
        <span className="font-mono font-bold text-lg" style={{color:col}}>{score}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.08)'}}>
          <motion.div className="h-full rounded-full" style={{background:col}} initial={{width:0}} animate={{width:`${Math.min(100,score/125*100)}%`}} transition={{duration:.8}}/>
        </div>
        <span className="font-mono font-bold text-xs" style={{color:col}}>{risk}</span>
      </div>
      <div className="space-y-1.5">
        {MORSE_FACTORS.map(f=>{
          const contrib=Math.round(score*(f.max/125));
          return(
            <div key={f.key} className="flex items-center gap-2">
              <div className="font-sans text-white/45 flex-1" style={{fontSize:'0.7rem'}}>{f.label}</div>
              <div className="w-24 h-1 rounded-full" style={{background:'rgba(255,255,255,0.06)'}}>
                <div className="h-full rounded-full" style={{background:col,width:`${(contrib/f.max)*100}%`}}/>
              </div>
              <div className="font-mono text-white/40 text-xs w-6 text-right">{contrib}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PoseAnalysis(){
  const ref=useRef<HTMLDivElement>(null);
  const{poseFrame,poseHistory,patients,selectedPatient,selectPatient}=useStore();
  const selId=selectedPatient??patients[0]?._id;
  const selPatient=patients.find(p=>p._id===selId);
  const frame=poseHistory.find(f=>f.patientId===selId)??poseFrame;

  // 6h movement history chart
  const movementData=poseHistory.filter(f=>f.patientId===selId).slice(0,72).reverse().map((f,i)=>({
    i, posture:f.posture, morse:f.morseScore, hip:f.hipDeviation,
  }));

  useEffect(()=>{
    const ctx=gsap.context(()=>{ gsap.fromTo('.pose-block',{opacity:0,y:14},{opacity:1,y:0,stagger:.07,duration:.45,ease:'power3.out'}); },ref);
    return()=>ctx.revert();
  },[selId]);

  return(
    <div ref={ref} className="p-5 space-y-4">
      {/* Header */}
      <div className="pose-block flex items-center justify-between">
        <div>
          <h1 className="font-sans font-bold text-white" style={{fontSize:'1.25rem'}}>AI Pose Analysis</h1>
          <p className="font-sans text-white/40 text-sm mt-0.5">MEDPOSE-v2 · MediaPipe skeleton · ICU-4A</p>
        </div>
        <div className="flex gap-2">
          {patients.map(p=>(
            <button key={p._id} onClick={()=>selectPatient(p._id)}
              className="font-sans text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                background:(selectedPatient??patients[0]?._id)===p._id?'rgba(113,224,126,0.15)':'rgba(255,255,255,0.04)',
                border:`1px solid ${(selectedPatient??patients[0]?._id)===p._id?'rgba(113,224,126,0.35)':'rgba(255,255,255,0.08)'}`,
                color:(selectedPatient??patients[0]?._id)===p._id?'#71E07E':'rgba(255,255,255,0.45)',
              }}>
              {p.bedId}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-5 gap-4">
        {/* Skeleton canvas 3/5 */}
        <div className="col-span-3 space-y-4">
          <div className="pose-block glass p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="live-pulse w-2 h-2 rounded-full" style={{background:'#BA5FFF'}}/>
                <span className="section-label">Live Skeleton Feed — {selPatient?.name}</span>
              </div>
              {frame&&(
                <div className="flex items-center gap-2">
                  <span className="badge badge-violet">{frame.posture.replace('_',' ')}</span>
                  <span className="badge" style={{background:'rgba(113,224,126,0.1)',color:'#71E07E',border:'1px solid rgba(113,224,126,0.25)'}}>
                    Hip Δ {frame.hipDeviation.toFixed(1)}°
                  </span>
                </div>
              )}
            </div>
            <SkeletonCanvas frame={frame} height={320}/>
          </div>

          {/* 6h movement chart */}
          <div className="pose-block glass p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="section-label">6-Hour Movement History</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{background:'#BA5FFF'}}/><span className="font-sans text-white/40 text-xs">Morse Score</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{background:'#71E07E'}}/><span className="font-sans text-white/40 text-xs">Hip Deviation°</span></div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={movementData} margin={{top:4,right:4,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BA5FFF" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#BA5FFF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gH" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71E07E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#71E07E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="i" hide/>
                <YAxis tick={{fontSize:9,fontFamily:'Space Mono',fill:'rgba(255,255,255,0.3)'}} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{background:'rgba(10,28,64,0.95)',border:'1px solid rgba(113,224,126,0.2)',borderRadius:10,fontFamily:'Outfit'}}/>
                <Area type="monotone" dataKey="morse" stroke="#BA5FFF" strokeWidth={2} fill="url(#gM)" dot={false} isAnimationActive={false}/>
                <Area type="monotone" dataKey="hip"   stroke="#71E07E" strokeWidth={2} fill="url(#gH)" dot={false} isAnimationActive={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right panel 2/5 */}
        <div className="col-span-2 space-y-4">
          {/* Morse Scale */}
          <div className="pose-block">
            <MorseScale score={frame?.morseScore??selPatient?.morseScore??0}/>
          </div>

          {/* Joint scores */}
          <div className="pose-block glass p-4">
            <div className="section-label mb-3">Joint-by-Joint Confidence</div>
            {frame?.jointScores
              ? <JointScoreGrid scores={frame.jointScores}/>
              : <div className="text-center py-6 font-sans text-white/25 text-xs">Awaiting pose frame…</div>
            }
          </div>

          {/* Hip deviation alert */}
          {frame&&frame.hipDeviation>8&&(
            <motion.div animate={{borderColor:['rgba(239,68,68,0.3)','rgba(239,68,68,0.7)','rgba(239,68,68,0.3)']}} transition={{duration:1.2,repeat:Infinity}}
              className="pose-block glass p-4" style={{border:'1px solid rgba(239,68,68,0.4)'}}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} color="#EF4444"/>
                <div className="font-mono font-bold text-xs text-red-400">HIP DEVIATION ALERT</div>
              </div>
              <div className="font-sans text-white/60 text-sm">Hip deviation {frame.hipDeviation.toFixed(1)}° exceeds threshold (8°). Repositioning recommended.</div>
            </motion.div>
          )}

          {/* Model info */}
          <div className="pose-block glass-dark p-4">
            <div className="section-label mb-3">Model Information</div>
            {[
              {k:'Model',v:'MEDPOSE-v2'},
              {k:'Framework',v:'MediaPipe v0.10'},
              {k:'Joints',v:'17 keypoints'},
              {k:'Inference',v:'GPU · 24ms/frame'},
              {k:'Last frame',v:frame?new Date(frame.timestamp).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}):'—'},
            ].map(r=>(
              <div key={r.k} className="flex justify-between py-1.5 border-b border-white/5">
                <span className="font-sans text-white/35 text-xs">{r.k}</span>
                <span className="font-mono font-bold text-xs" style={{color:'#BA5FFF'}}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
