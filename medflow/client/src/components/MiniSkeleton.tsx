// src/components/MiniSkeleton.tsx
import React, { useRef, useEffect } from 'react';

type Pattern = 'SLEEPING'|'RESTLESS'|'STANDING'|'SITTING'|'WALKING'|'STILL'|'NO_SIGNAL';

const BONES: Record<Pattern, [number,number][][]> = {
  SLEEPING:  [[[.12,.35],[.88,.35]],[[.5,.35],[.5,.52]],[[.5,.52],[.38,.78]],[[.5,.52],[.62,.78]]],
  RESTLESS:  [[[.5,.13],[.5,.44]],[[.28,.27],[.72,.27]],[[.28,.27],[.18,.54]],[[.72,.27],[.82,.5]],[[.5,.44],[.38,.74]],[[.5,.44],[.62,.7]]],
  STANDING:  [[[.5,.08],[.5,.42]],[[.28,.22],[.72,.22]],[[.28,.22],[.22,.5]],[[.72,.22],[.78,.5]],[[.5,.42],[.42,.72]],[[.5,.42],[.58,.72]],[[.42,.72],[.42,.95]],[[.58,.72],[.58,.95]]],
  SITTING:   [[[.5,.1],[.5,.4]],[[.27,.22],[.73,.22]],[[.27,.22],[.2,.45]],[[.73,.22],[.8,.45]],[[.5,.4],[.35,.56]],[[.5,.4],[.65,.56]],[[.35,.56],[.3,.82]],[[.65,.56],[.7,.82]]],
  WALKING:   [[[.5,.1],[.5,.42]],[[.28,.24],[.72,.24]],[[.28,.24],[.2,.5]],[[.72,.24],[.8,.48]],[[.5,.42],[.4,.7]],[[.5,.42],[.62,.68]],[[.4,.7],[.35,.95]],[[.62,.68],[.68,.9]]],
  STILL:     [[[.5,.12],[.5,.44]],[[.3,.24],[.7,.24]],[[.3,.24],[.3,.5]],[[.7,.24],[.7,.5]],[[.5,.44],[.44,.72]],[[.5,.44],[.56,.72]],[[.44,.72],[.44,.93]],[[.56,.72],[.56,.93]]],
  NO_SIGNAL: [],
};

interface MiniSkeletonProps {
  pattern: Pattern | string;
  isAlert: boolean;
  size?:   number;
}

export default function MiniSkeleton({ pattern, isAlert, size = 56 }: MiniSkeletonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const tickRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const bones = BONES[(pattern as Pattern)] ?? BONES.STILL;

    function draw() {
      tickRef.current++;
      ctx.clearRect(0, 0, size, size);

      if (bones.length === 0) {
        ctx.fillStyle = 'rgba(60,60,60,0.5)';
        ctx.font = `${Math.round(size*0.15)}px Space Mono`;
        ctx.textAlign = 'center';
        ctx.fillText('—', size/2, size/2 + 4);
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const jitter = pattern === 'RESTLESS' ? Math.sin(tickRef.current * 0.12) * 2.5 : 0;
      const color  = isAlert ? '#FF0000' : 'rgba(200,200,200,0.88)';

      ctx.strokeStyle  = color;
      ctx.lineWidth    = 1.1;
      ctx.lineCap      = 'round';
      ctx.shadowColor  = isAlert ? 'rgba(255,0,0,0.5)' : 'rgba(255,255,255,0.2)';
      ctx.shadowBlur   = 2.5;

      bones.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(a[0]*size, a[1]*size + jitter);
        ctx.lineTo(b[0]*size, b[1]*size + jitter);
        ctx.stroke();
      });

      // Joint dots
      const pts = new Set<string>();
      bones.forEach(([a,b]) => { pts.add(a.toString()); pts.add(b.toString()); });
      bones.forEach(([a,b]) => {
        [a,b].forEach(p => {
          ctx.beginPath();
          ctx.arc(p[0]*size, p[1]*size + jitter, 1.9, 0, Math.PI*2);
          ctx.fillStyle = isAlert ? '#FF0000' : 'rgba(230,230,230,0.9)';
          ctx.shadowBlur = 3;
          ctx.fill();
        });
      });

      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pattern, isAlert, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display:'block', width:size, height:size }}
    />
  );
}


// ─────────────────────────────────────────────────────────────
// src/components/ToastStack.tsx
// (appended in same file for brevity — split into own file)
// ─────────────────────────────────────────────────────────────
