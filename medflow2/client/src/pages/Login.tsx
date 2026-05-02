// src/pages/Login.tsx
import React,{ useEffect,useRef,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Heart,Mail,Lock,Eye,EyeOff,Activity } from 'lucide-react';
import { authApi } from '../lib/api';
import useStore from '../store/useStore';

export default function Login(){
  const navigate=useNavigate();
  const{login,isAuth}=useStore();
  const wrapRef=useRef<HTMLDivElement>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const[email,setEmail]=useState('nurse@medflow.io');
  const[password,setPassword]=useState('medflow123');
  const[showPw,setShowPw]=useState(false);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');

  useEffect(() => {
    if(isAuth) navigate('/', { replace: true });
  }, [isAuth, navigate]);

  // Animated topography canvas bg
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext('2d')!;
    let raf=0,t=0;
    function resize(){ const c=canvas as HTMLCanvasElement; c.width=c.offsetWidth; c.height=c.offsetHeight; }
    function draw(){
      t+=0.005;
      const c=canvas as HTMLCanvasElement;
      const{width:w,height:h}=c;
      ctx.clearRect(0,0,w,h);
      // Topography contour lines
      for(let i=0;i<12;i++){
        const y0=h*(i/12);
        ctx.beginPath();
        for(let x=0;x<=w;x+=4){
          const y=y0+Math.sin(x*0.008+t+i*0.5)*40+Math.cos(x*0.003+t*0.7)*20;
          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        const alpha=0.03+Math.abs(Math.sin(i*0.8+t*0.3))*0.05;
        ctx.strokeStyle=`rgba(113,224,126,${alpha})`;
        ctx.lineWidth=1;
        ctx.stroke();
      }
      // Purple blobs
      const grad1=ctx.createRadialGradient(w*0.2,h*0.4,0,w*0.2,h*0.4,w*0.4);
      grad1.addColorStop(0,'rgba(98,0,217,0.18)');
      grad1.addColorStop(1,'transparent');
      ctx.fillStyle=grad1; ctx.fillRect(0,0,w,h);
      const grad2=ctx.createRadialGradient(w*0.8,h*0.2,0,w*0.8,h*0.2,w*0.35);
      grad2.addColorStop(0,'rgba(186,95,255,0.12)');
      grad2.addColorStop(1,'transparent');
      ctx.fillStyle=grad2; ctx.fillRect(0,0,w,h);
      raf=requestAnimationFrame(draw);
    }
    resize(); window.addEventListener('resize',resize);
    draw();
    return()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize',resize); };
  },[]);

  useEffect(()=>{
    const ctx=gsap.context(()=>{
      gsap.fromTo('.login-card',{y:32,opacity:0},{y:0,opacity:1,duration:.7,ease:'power3.out',delay:.2});
      gsap.fromTo('.login-field',{y:14,opacity:0},{y:0,opacity:1,stagger:.09,duration:.45,ease:'power3.out',delay:.4});
    },wrapRef);
    return()=>ctx.revert();
  },[]);

  async function handleSubmit(e:React.FormEvent){
    e.preventDefault(); setLoading(true); setError('');
    try{
      const res=await authApi.login(email,password);
      login(res.data.user,res.data.token);
    }catch{ setError('Invalid credentials. Try nurse@medflow.io / medflow123'); gsap.fromTo('.login-card',{x:-8},{x:8,yoyo:true,repeat:3,duration:.07}); }
    finally{ setLoading(false); }
  }

  return(
    <div ref={wrapRef} className="min-h-screen flex overflow-hidden relative" style={{background:'#07112b'}}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{zIndex:0}}/>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col items-center justify-center w-2/5 relative z-10 p-12">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float"
               style={{background:'linear-gradient(135deg,#6200D9,#BA5FFF)',boxShadow:'0 0 40px rgba(98,0,217,0.5)'}}>
            <Heart size={36} color="#fff"/>
          </div>
          <h1 className="font-sans font-bold text-white mb-2" style={{fontSize:'2.5rem',letterSpacing:'-0.01em'}}>MedFlow 2.0</h1>
          <p className="font-sans text-white/50 mb-10" style={{fontSize:'1rem'}}>AI Clinical Intelligence Platform</p>
          {/* Live stats strip */}
          <div className="space-y-3">
            {[
              {icon:<Activity size={14}/>,label:'MEDPOSE-v2 Engine',val:'Online',color:'#71E07E'},
              {icon:<Heart size={14}/>,label:'ECG Stream Processor',val:'Active',color:'#71E07E'},
              {icon:<Activity size={14}/>,label:'HL7 FHIR Gateway',val:'R4 Ready',color:'#BA5FFF'},
            ].map(s=>(
              <div key={s.label} className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <span style={{color:s.color}}>{s.icon}</span>
                <span className="font-sans text-white/60 flex-1 text-sm">{s.label}</span>
                <span className="font-mono font-bold text-xs" style={{color:s.color}}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="login-card w-full max-w-md opacity-0">
          <div className="glass p-8">
            <div className="mb-7">
              <h2 className="font-sans font-bold text-white mb-1" style={{fontSize:'1.5rem'}}>Nurse Station Login</h2>
              <p className="font-sans text-white/45 text-sm">Access ICU-4A clinical dashboard</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="login-field opacity-0">
                <label className="section-label block mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'rgba(255,255,255,0.3)'}}/>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mf-input pl-10" placeholder="nurse@medflow.io" required/>
                </div>
              </div>
              <div className="login-field opacity-0">
                <label className="section-label block mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'rgba(255,255,255,0.3)'}}/>
                  <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} className="mf-input pl-10 pr-11" placeholder="••••••••" required/>
                  <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPw?<EyeOff size={14}/>:<Eye size={14}/>}
                  </button>
                </div>
              </div>
              {error&&<div className="login-field px-3.5 py-2.5 rounded-xl" style={{background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.3)'}}><p className="font-mono text-xs text-red-400">{error}</p></div>}
              <div className="login-field opacity-0 pt-1">
                <button type="submit" disabled={loading} className="btn-green w-full justify-center py-3 text-sm rounded-xl">
                  {loading?<><span className="w-3.5 h-3.5 border-2 border-navy border-t-transparent rounded-full animate-spin"/>Authenticating…</>:'Access Dashboard'}
                </button>
              </div>
            </form>
            <div className="topo-divider mt-6 mb-4"/>
            <p className="text-center font-mono text-white/30" style={{fontSize:'0.7rem'}}>nurse@medflow.io · medflow123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
