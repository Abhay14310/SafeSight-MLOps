// src/pages/DockerDeploy.tsx
import React,{ useEffect,useRef,useState } from 'react';
import { motion,AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Container,Cpu,HardDrive,Wifi,WifiOff,RefreshCw,Terminal,Zap,ChevronDown,ChevronUp } from 'lucide-react';
import type { DockerService } from '../types';

const INITIAL_SERVICES:DockerService[]=[
  { name:'mf2-server',         container:'mf2-server',         status:'running', image:'node:20-alpine',    cpu:18,  mem:'148 MB', uptime:'2h 14m', port:'5060' },
  { name:'mf2-mongo',          container:'mf2-mongo',          status:'running', image:'mongo:7.0',         cpu:4,   mem:'312 MB', uptime:'2h 15m', port:'27020' },
  { name:'mf2-client',         container:'mf2-client',         status:'running', image:'nginx:1.27-alpine', cpu:1,   mem:'18 MB',  uptime:'2h 13m', port:'3010' },
  { name:'ai-pose-engine',     container:'mf2-pose-engine',    status:'running', image:'node:20-alpine',    cpu:62,  mem:'2.1 GB', uptime:'2h 14m', gpu:true },
  { name:'ecg-stream-processor',container:'mf2-ecg-stream',   status:'running', image:'node:20-alpine',    cpu:9,   mem:'96 MB',  uptime:'2h 14m' },
  { name:'vital-monitor-svc',  container:'mf2-vitals',         status:'running', image:'node:20-alpine',    cpu:11,  mem:'84 MB',  uptime:'2h 13m' },
  { name:'hl7-fhir-gateway',   container:'mf2-fhir',           status:'running', image:'node:20-alpine',    cpu:3,   mem:'72 MB',  uptime:'2h 14m' },
  { name:'alert-bus',          container:'mf2-alerts',         status:'running', image:'node:20-alpine',    cpu:5,   mem:'64 MB',  uptime:'2h 14m' },
  { name:'audit-logger',       container:'mf2-audit',          status:'stopped', image:'node:20-alpine',    cpu:0,   mem:'0 MB',   uptime:'stopped' },
];

const COMPOSE_SNIPPET=`# docker-compose.yml — MedFlow 2.0 GPU config
services:
  ai-pose-engine:
    image: medflow/pose-engine:2.0
    container_name: mf2-pose-engine
    environment:
      MODEL_VERSION: MEDPOSE-v2
      GPU_ENABLED: "true"
      CUDA_VERSION: "12.2"
      CONFIDENCE_THRESHOLD: "0.82"
    # GPU allocation
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - pose_models:/models
    networks: [mf2-net]

  mf2-server:
    build: ./server
    container_name: mf2-server
    ports: ["5060:5060"]
    depends_on:
      mongo:
        condition: service_healthy
    environment:
      NODE_ENV: production
      MONGO_URI: mongodb://mfuser:mfpass@mf2-mongo:27017/medflow2
      JWT_SECRET: \${JWT_SECRET}`;

export default function DockerDeploy(){
  const ref=useRef<HTMLDivElement>(null);
  const[services,setServices]=useState<DockerService[]>(INITIAL_SERVICES);
  const[showCompose,setShowCompose]=useState(false);
  const[copied,setCopied]=useState(false);

  // Live CPU randomisation every 2s
  useEffect(()=>{
    const id=setInterval(()=>{
      setServices(prev=>prev.map(s=>s.status==='running'?{
        ...s,
        cpu:Math.max(0,Math.min(100,s.cpu+(Math.random()-.45)*12)),
      }:s));
    },2000);
    return()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    const ctx=gsap.context(()=>{
      gsap.fromTo('.docker-row',{opacity:0,x:-16},{opacity:1,x:0,stagger:.06,duration:.4,ease:'power3.out'});
      gsap.fromTo('.docker-stat',{opacity:0,y:14},{opacity:1,y:0,stagger:.08,duration:.45,ease:'power3.out'});
    },ref);
    return()=>ctx.revert();
  },[]);

  const running=services.filter(s=>s.status==='running').length;
  const totalCpu=Math.round(services.reduce((s,v)=>s+(v.status==='running'?v.cpu:0),0)/running);
  const gpuService=services.find(s=>s.gpu);

  function copyCompose(){
    navigator.clipboard.writeText(COMPOSE_SNIPPET).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  }

  return(
    <div ref={ref} className="p-5 space-y-5">
      {/* Header */}
      <div className="docker-stat flex items-center justify-between">
        <div>
          <h1 className="font-sans font-bold text-white" style={{fontSize:'1.25rem'}}>Docker Deploy</h1>
          <p className="font-sans text-white/40 text-sm mt-0.5">Service registry · MedFlow 2.0 container cluster</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="badge badge-green">{running}/{services.length} running</div>
          {services.some(s=>s.status==='stopped')&&<div className="badge badge-red">{services.filter(s=>s.status==='stopped').length} stopped</div>}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {label:'Services Running', val:`${running}/${services.length}`, color:'#71E07E',  icon:<Container size={18}/>},
          {label:'Avg CPU Load',     val:`${totalCpu}%`,                  color:'#BA5FFF',  icon:<Cpu size={18}/>},
          {label:'GPU Services',     val:services.filter(s=>s.gpu).length, color:'#6200D9', icon:<Zap size={18}/>},
          {label:'Memory Total',     val:'2.9 GB',                         color:'#F59E0B',  icon:<HardDrive size={18}/>},
        ].map(k=>(
          <div key={k.label} className="docker-stat glass p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="section-label">{k.label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:`${k.color}18`}}>
                <span style={{color:k.color}}>{k.icon}</span>
              </div>
            </div>
            <div className="font-mono font-bold" style={{fontSize:'1.75rem',color:k.color,lineHeight:1}}>{String(k.val)}</div>
          </div>
        ))}
      </div>

      {/* Service registry table */}
      <div className="glass overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="section-label">Container Registry</div>
          <RefreshCw size={13} style={{color:'rgba(113,224,126,0.5)',cursor:'pointer'}}/>
        </div>

        {/* Table header */}
        <div className="grid px-5 py-2 text-xs font-sans font-semibold text-white/30 uppercase tracking-wider"
             style={{gridTemplateColumns:'2fr 2fr 1fr 1fr 80px 1fr 60px',gap:'1rem',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
          <span>Service</span><span>Container / Image</span><span>Status</span><span>CPU</span><span>Memory</span><span>Uptime</span><span>Port</span>
        </div>

        {/* Rows */}
        {services.map((s,i)=>{
          const isRunning=s.status==='running';
          const cpuColor=s.cpu>80?'#EF4444':s.cpu>50?'#F59E0B':'#71E07E';
          return(
            <motion.div key={s.name} layout
              className="docker-row grid px-5 py-3 items-center hover:bg-white/3 transition-colors"
              style={{gridTemplateColumns:'2fr 2fr 1fr 1fr 80px 1fr 60px',gap:'1rem',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>

              <div className="flex items-center gap-2.5">
                <div className={isRunning?'dot-green':'dot-red'}/>
                <div>
                  <div className="font-sans font-semibold text-white text-sm">{s.name}</div>
                  {s.gpu&&<span className="badge badge-purple" style={{fontSize:'0.55rem',marginTop:2}}>GPU</span>}
                </div>
              </div>

              <div>
                <div className="font-mono text-white/60 text-xs">{s.container}</div>
                <div className="font-sans text-white/30 text-xs">{s.image}</div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  {isRunning?<Wifi size={12} color="#71E07E"/>:<WifiOff size={12} color="#EF4444"/>}
                  <span className="font-mono text-xs font-bold" style={{color:isRunning?'#71E07E':'#EF4444'}}>
                    {isRunning?'running':'stopped'}
                  </span>
                </div>
              </div>

              <div>
                {isRunning?(
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold" style={{color:cpuColor}}>{s.cpu.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.08)',width:60}}>
                      <motion.div className="h-full rounded-full" style={{background:cpuColor}} animate={{width:`${s.cpu}%`}} transition={{duration:.8}}/>
                    </div>
                  </div>
                ):<span className="font-mono text-white/20 text-xs">—</span>}
              </div>

              <div className="font-mono text-white/50 text-xs">{s.mem}</div>

              <div className="flex items-center gap-1.5">
                {isRunning&&<div className="live-pulse w-1.5 h-1.5 rounded-full" style={{background:'#71E07E'}}/>}
                <span className="font-mono text-xs" style={{color:isRunning?'rgba(113,224,126,0.6)':'rgba(239,68,68,0.5)'}}>{s.uptime}</span>
              </div>

              <div className="font-mono text-xs" style={{color:'rgba(186,95,255,0.7)'}}>{s.port??'—'}</div>
            </motion.div>
          );
        })}
      </div>

      {/* GPU service detail */}
      {gpuService&&(
        <div className="glass p-5" style={{borderColor:'rgba(98,0,217,0.35)'}}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} color="#BA5FFF"/>
            <div className="section-label">GPU-Accelerated Service — {gpuService.name}</div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              {k:'Model',v:'MEDPOSE-v2'},
              {k:'CUDA',v:'12.2'},
              {k:'GPU Memory',v:'~2.1 GB VRAM'},
              {k:'Inference',v:'~24ms/frame'},
              {k:'GPU Util',v:`${Math.round(gpuService.cpu*0.8)}%`},
              {k:'Batch Size',v:'1 (realtime)'},
              {k:'Keypoints',v:'17 joints'},
              {k:'Confidence',v:'0.82 threshold'},
            ].map(r=>(
              <div key={r.k} className="rounded-xl px-3 py-2.5" style={{background:'rgba(98,0,217,0.12)',border:'1px solid rgba(186,95,255,0.2)'}}>
                <div className="font-sans text-white/35 text-xs mb-0.5">{r.k}</div>
                <div className="font-mono font-bold text-sm" style={{color:'#BA5FFF'}}>{r.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* docker-compose snippet */}
      <div className="glass overflow-hidden">
        <button onClick={()=>setShowCompose(v=>!v)}
          className="w-full flex items-center justify-between px-5 py-4 transition-all hover:bg-white/3"
          style={{borderBottom:showCompose?'1px solid rgba(255,255,255,0.06)':undefined}}>
          <div className="flex items-center gap-2.5">
            <Terminal size={15} style={{color:'#71E07E'}}/>
            <span className="font-sans font-semibold text-white text-sm">docker-compose.yml — GPU allocation snippet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-green">GPU · MEDPOSE-v2</span>
            {showCompose?<ChevronUp size={14} style={{color:'rgba(255,255,255,0.4)'}}/>:<ChevronDown size={14} style={{color:'rgba(255,255,255,0.4)'}}/> }
          </div>
        </button>
        <AnimatePresence>
          {showCompose&&(
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>
              <div className="relative p-5">
                <button onClick={copyCompose}
                  className="absolute top-4 right-4 btn-ghost text-xs">
                  {copied?'✓ Copied':'Copy'}
                </button>
                <pre className="font-mono text-xs overflow-x-auto scroll-thin" style={{color:'rgba(255,255,255,0.7)',lineHeight:1.7,maxHeight:320}}>
                  {COMPOSE_SNIPPET.split('\n').map((line,i)=>{
                    const isComment=line.trim().startsWith('#');
                    const isKey=line.includes(':')&&!line.trim().startsWith('-')&&!isComment;
                    const color=isComment?'rgba(113,224,126,0.5)':isKey?'#BA5FFF':'rgba(255,255,255,0.7)';
                    return <div key={i} style={{color}}>{line}</div>;
                  })}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
