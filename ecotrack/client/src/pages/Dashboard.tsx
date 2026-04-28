// src/pages/Dashboard.tsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Leaf, Truck, Trash2, MapPin, AlertTriangle, Recycle, Wind, Camera, Zap } from 'lucide-react';
import useStore from '@/store/useStore';
import HeroScene from '@/components/HeroScene';

gsap.registerPlugin(ScrollTrigger);

// ── Eco Score animated SVG ring ────────────────────────────────────────────
function EcoScoreRing({ score }: { score: number }) {
  const clamp = Math.max(0, Math.min(100, Math.round(score)));
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (clamp / 100) * circ;
  const color = clamp >= 70 ? '#22c55e' : clamp >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#d1fae5" strokeWidth="9"/>
      <motion.circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={circ} strokeLinecap="round"
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.1, ease: 'easeOut' }}/>
      <text x="55" y="58" textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Mono', fill: color, transform: 'rotate(90deg)', transformOrigin: '55px 55px' }}>
        {clamp}
      </text>
      <text x="55" y="72" textAnchor="middle"
        style={{ fontSize: 8, fontFamily: 'Space Mono', fill: '#94a3b8', transform: 'rotate(90deg)', transformOrigin: '55px 55px' }}>
        /100
      </text>
    </svg>
  );
}

// Animated counter
function Counter({ val, prefix='', suffix='' }:{val:number;prefix?:string;suffix?:string}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev= useRef(0);
  useEffect(() => {
    if (!ref.current || isNaN(val)) return;
    const obj = { v: prev.current };
    const t = gsap.to(obj, {
      v: val, duration: 0.9, ease: 'power2.out',
      onUpdate() { if (ref.current) ref.current.textContent = `${prefix}${Math.round(obj.v).toLocaleString('en-IN')}${suffix}`; },
      onComplete() { prev.current = val; }
    });
    return () => { t.kill(); };
  }, [val, prefix, suffix]);
  return <span ref={ref}>{prefix}{Math.round(val).toLocaleString('en-IN')}{suffix}</span>;
}

export default function Dashboard() {
  const mainRef      = useRef<HTMLDivElement>(null);
  const scrollY      = useRef(0);
  const { summary, collections, bins } = useStore();
  const s = summary;

  // Eco score: blended from recycle rate + CO₂ saved ratio (capped at 1000 kg/day)
  const totalWt   = s?.todayWeight ?? 0;
  const recycled  = s?.recycledToday ?? 0;
  const co2       = s?.co2Saved ?? 0;
  const recycleScore = totalWt > 0 ? (recycled / totalWt) * 60 : 0;
  const co2Score     = Math.min(40, (co2 / 1000) * 40);
  const ecoScore     = Math.round(recycleScore + co2Score);

  // Scroll tracker for 3D parallax
  useEffect(()=>{
    const el = mainRef.current?.closest('main');
    if(!el) return;
    const handler = ()=>{ scrollY.current = el.scrollTop; };
    el.addEventListener('scroll',handler,{passive:true});
    return()=>el.removeEventListener('scroll',handler);
  },[]);

  // GSAP ScrollTrigger animations
  useEffect(() => {
    if (!mainRef.current) return;
    const scrollerEl = mainRef.current.closest('main');
    if (!scrollerEl) return;

    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.fromTo('.hero-text', { y: 32, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, duration: 0.7, ease: 'power3.out' });
      gsap.fromTo('.hero-stat', { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.09, duration: 0.6, ease: 'power3.out', delay: 0.3 });

      // Scroll-triggered KPIs
      gsap.fromTo('.kpi-item', { y: 24, opacity: 0 }, {
        y: 0, opacity: 1, stagger: 0.08, duration: 0.55, ease: 'power3.out',
        scrollTrigger: { trigger: '.kpi-section', start: 'top 85%', scroller: scrollerEl }
      });

      // Charts
      gsap.fromTo('.chart-item', { y: 20, opacity: 0, scale: 0.97 }, {
        y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 0.5, ease: 'power3.out',
        scrollTrigger: { trigger: '.charts-section', start: 'top 85%', scroller: scrollerEl }
      });
    }, mainRef.current);

    return () => { ctx.revert(); };
  }, []);

  // Live collection chart data
  const collChart = collections.slice(0,20).reverse().map((c,i)=>({
    i,kg:c.weightKg,type:c.wasteType
  }));

  // Bin fill distribution
  const binDist = bins.reduce<Record<string,number>>((acc,b)=>{
    const bucket = b.fillLevel>=80?'Critical':b.fillLevel>=50?'Moderate':'Low';
    acc[bucket]=(acc[bucket]??0)+1; return acc;
  },{});
  const binChart = Object.entries(binDist).map(([name,count])=>({name,count}));

  const WASTE_COLORS:Record<string,string>={organic:'#22c55e',recyclable:'#4ade80',hazardous:'#ef4444','e-waste':'#f59e0b',general:'#94a3b8'};

  return (
    <div ref={mainRef}>

      {/* ── HERO SECTION with 3D globe ── */}
      <section className="hero-section relative" style={{minHeight:520}}>
        <div className="absolute inset-0 z-10">
          <HeroScene scrollY={scrollY} height="100%"/>
        </div>

        <div className="relative z-20 flex flex-col items-center justify-center" style={{minHeight:520,paddingTop:60}}>
          <div className="hero-text font-mono text-green-300 text-center mb-2" style={{fontSize:'0.75rem',letterSpacing:'0.22em'}}>
            WASTE LOGISTICS INTELLIGENCE
          </div>
          <h1 className="hero-text font-sans font-bold text-white text-center mb-4" style={{fontSize:'2.8rem',lineHeight:1.15,maxWidth:600}}>
            Track Every Kilogram,<br/>Save Every Tree
          </h1>
          <p className="hero-text text-green-300 text-center text-body mb-10" style={{maxWidth:440,opacity:0.8}}>
            Real-time waste collection tracking, fleet management and route optimisation for sustainable cities.
          </p>

          {/* Hero stats strip */}
          <div className="flex gap-6 flex-wrap justify-center">
            {[
              {label:'Kg Collected Today', val:s?.todayWeight??0,   icon:<Leaf size={16}/> },
              {label:'Active Vehicles',    val:s?.activeVehicles??0, icon:<Truck size={16}/> },
              {label:'Recycled Today',     val:s?.recycledToday??0,  icon:<Recycle size={16}/> },
              {label:'CO₂ Saved (kg)',     val:s?.co2Saved??0,       icon:<Wind size={16}/> },
            ].map(stat=>(
              <div key={stat.label} className="hero-stat text-center px-5 py-3 rounded-2xl"
                   style={{background:'rgba(255,255,255,0.1)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.2)'}}>
                <div className="flex items-center justify-center gap-1.5 mb-1 text-green-300">{stat.icon}
                  <span className="font-mono" style={{fontSize:'0.65rem',letterSpacing:'0.12em',textTransform:'uppercase'}}>{stat.label}</span>
                </div>
                <div className="font-mono font-bold text-white" style={{fontSize:'1.5rem',lineHeight:1}}>
                  <Counter val={stat.val}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-indicator z-20 flex flex-col items-center gap-1">
          <div className="w-px h-10" style={{background:'linear-gradient(to bottom,rgba(255,255,255,0),rgba(255,255,255,0.5))'}}/>
          <span className="font-mono text-white/50" style={{fontSize:'0.6rem',letterSpacing:'0.15em'}}>SCROLL</span>
        </div>
      </section>

      {/* ── KPI SECTION ── */}
      <section className="kpi-section px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="page-title text-green-900">Operations Overview</h2>
            <p className="text-small text-slate-500 mt-0.5">Real-time logistics metrics</p>
          </div>
          <div className="flex items-center gap-3">
            {/* AI Camera quick-link */}
            <Link to="/camera"
              className="btn-green flex items-center gap-1.5"
              style={{padding:'6px 14px',fontSize:'0.78rem'}}>
              <Camera size={13}/> AI Camera
            </Link>
            <div className="flex items-center gap-1.5 badge-green">
              <div className="live-pulse w-1.5 h-1.5 rounded-full" style={{background:'#22c55e'}}/>
              Live Data
            </div>
          </div>
        </div>

        {/* KPI cards + Eco Score ring */}
        <div className="grid gap-4" style={{gridTemplateColumns:'repeat(4,1fr) 180px'}}>
          {[
            {label:'Total Collections', val:s?.totalLogs??0,     icon:<Trash2 size={17}/>,       color:'#22c55e',  suffix:'' },
            {label:'Fleet Active',      val:s?.activeVehicles??0, icon:<Truck size={17}/>,         color:'#0d9488',  suffix:`/${s?.totalVehicles??0}` },
            {label:'Bins Full/Overflow',val:s?.fullBins??0,       icon:<MapPin size={17}/>,        color:'#f59e0b',  suffix:`/${s?.totalBins??0}` },
            {label:'Active Alerts',     val:s?.alerts??0,         icon:<AlertTriangle size={17}/>, color:'#ef4444',  suffix:'' },
          ].map(k=>(
            <div key={k.label} className="kpi-card kpi-item">
              <div className="flex items-center justify-between">
                <span className="kpi-label">{k.label}</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                     style={{background:`${k.color}18`}}>
                  <span style={{color:k.color}}>{k.icon}</span>
                </div>
              </div>
              <div className="kpi-value" style={{color:k.color}}>
                <Counter val={k.val} suffix={k.suffix}/>
              </div>
            </div>
          ))}

          {/* Eco Score ring card */}
          <div className="kpi-card kpi-item flex flex-col items-center justify-center gap-1" style={{background:'linear-gradient(135deg,rgba(34,197,94,0.06),rgba(13,148,136,0.06))'}}>
            <EcoScoreRing score={ecoScore}/>
            <div className="font-mono font-bold text-green-800" style={{fontSize:'0.7rem',letterSpacing:'0.12em',textAlign:'center'}}>
              ECO SCORE
            </div>
            <div className="flex items-center gap-1 text-green-600" style={{fontSize:'0.65rem'}}>
              <Zap size={9}/> Sustainability index
            </div>
          </div>
        </div>
      </section>

      {/* ── CHARTS SECTION ── */}
      <section className="charts-section px-6 pb-8 space-y-5">

        {/* Live collections + bin distribution */}
        <div className="grid grid-cols-3 gap-5">
          {/* Live chart */}
          <div className="card p-5 col-span-2 chart-item">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="section-heading">Live Collections</div>
                <p className="text-small text-slate-400 mt-0.5">Weight collected per pickup</p>
              </div>
              <div className="live-pulse w-2 h-2 rounded-full" style={{background:'#22c55e'}}/>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={collChart} margin={{top:4,right:4,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#d1fae5" vertical={false}/>
                <XAxis dataKey="i" tick={{fontSize:9,fontFamily:'Space Mono',fill:'#94a3b8'}} tickLine={false} axisLine={false}/>
                <YAxis tick={{fontSize:9,fontFamily:'Space Mono',fill:'#94a3b8'}} tickLine={false} axisLine={false}/>
                <Tooltip formatter={(v:number)=>[`${v}kg`,'Weight']}
                         contentStyle={{fontFamily:'Space Mono',fontSize:11,borderRadius:12,border:'1px solid #bbf7d0'}}/>
                <Area type="monotone" dataKey="kg" stroke="#22c55e" strokeWidth={2} fill="url(#cg)" dot={false} isAnimationActive={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bin fill distribution */}
          <div className="card p-5 chart-item">
            <div className="section-heading mb-1">Bin Status</div>
            <p className="text-small text-slate-400 mb-4">Fill level distribution</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={binChart} margin={{top:4,right:4,left:-20,bottom:0}}>
                <CartesianGrid stroke="#d1fae5" vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:9,fontFamily:'Space Mono',fill:'#94a3b8'}} tickLine={false} axisLine={false}/>
                <YAxis tick={{fontSize:9,fontFamily:'Space Mono',fill:'#94a3b8'}} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{fontFamily:'Space Mono',fontSize:11,borderRadius:12,border:'1px solid #bbf7d0'}}/>
                <Bar dataKey="count" fill="#22c55e" radius={[5,5,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waste type breakdown + live feed */}
        <div className="grid grid-cols-2 gap-5">
          {/* Waste type bars */}
          <div className="card p-5 chart-item">
            <div className="section-heading mb-4">Waste by Type</div>
            <div className="space-y-3">
              {(s?.byType??[]).map(t=>{
                const maxVal = Math.max(...(s?.byType??[]).map(x=>x.total),1);
                const pct    = Math.round((t.total/maxVal)*100);
                const color  = WASTE_COLORS[t._id]??'#22c55e';
                return (
                  <div key={t._id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-small font-medium text-slate-700 capitalize">{t._id}</span>
                      <span className="font-mono text-slate-500" style={{fontSize:'0.75rem'}}>{Math.round(t.total).toLocaleString()}kg</span>
                    </div>
                    <div className="fill-bar">
                      <motion.div className="fill-bar-inner"
                        style={{background:color,width:`${pct}%`}}
                        initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.7}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live collection feed */}
          <div className="card p-5 chart-item flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="section-heading">Live Collections</div>
              <div className="live-pulse w-2 h-2 rounded-full" style={{background:'#22c55e'}}/>
            </div>
            <div className="flex-1 space-y-2 overflow-hidden">
              <AnimatePresence initial={false}>
                {collections.slice(0,7).map((c,i)=>(
                  <motion.div key={`${c.timestamp}-${i}`}
                    initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} exit={{opacity:0}}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{background:i===0?'rgba(34,197,94,0.08)':'rgba(0,0,0,0.02)',border:`1px solid ${i===0?'rgba(34,197,94,0.25)':'transparent'}`}}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                         style={{background:WASTE_COLORS[c.wasteType]??'#22c55e'}}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-small font-medium text-slate-700 truncate">{c.zone}</div>
                      <div className="font-mono text-slate-400 capitalize" style={{fontSize:'0.7rem'}}>{c.wasteType}</div>
                    </div>
                    <div className="font-mono font-bold text-green-700" style={{fontSize:'0.875rem'}}>{c.weightKg}kg</div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {collections.length===0&&<div className="text-center py-8 text-small text-slate-400">Waiting for collections…</div>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
