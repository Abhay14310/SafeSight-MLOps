// src/pages/StoreMapPage.tsx
import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Map, RotateCcw } from 'lucide-react';
import useStore from '@/store/useStore';
import type { FootfallZone } from '@/types';

// ── Zone layout definitions ────────────────────────────────────
const ZONE_LAYOUTS = [
  { id:'Z1', name:'Entrance',       pos:[ 0,    0,  6] as [number,number,number], size:[4,0.2,3] as [number,number,number] },
  { id:'Z2', name:'Electronics',    pos:[-5,    0,  1] as [number,number,number], size:[5,0.2,6] as [number,number,number] },
  { id:'Z3', name:'Fashion',        pos:[ 4,    0,  1] as [number,number,number], size:[4,0.2,6] as [number,number,number] },
  { id:'Z4', name:'Grocery',        pos:[-4,    0, -5] as [number,number,number], size:[5,0.2,5] as [number,number,number] },
  { id:'Z5', name:'Home & Living',  pos:[ 4,    0, -5] as [number,number,number], size:[4,0.2,5] as [number,number,number] },
  { id:'Z6', name:'Checkout',       pos:[ 0,    0, -8] as [number,number,number], size:[6,0.2,2] as [number,number,number] },
];

// Shelf props
const SHELVES = [
  [-6,0.3,0],[-6,0.3,2],[-6,0.3,-2],  // Electronics
  [5,0.3,0],[5,0.3,2],[5,0.3,-2],      // Fashion
  [-5,0.3,-4],[-3,0.3,-4],[-5,0.3,-6],  // Grocery
  [3,0.3,-4],[3,0.3,-6],               // Home
];

// ── Helpers ────────────────────────────────────────────────────
function occupancyColor(pct: number): THREE.Color {
  if (pct > 85) return new THREE.Color('#dc2626');
  if (pct > 60) return new THREE.Color('#d97706');
  if (pct > 30) return new THREE.Color('#0145f2');
  return new THREE.Color('#16a34a');
}

// ── Zone floor tile ───────────────────────────────────────────
function ZoneTile({ layout, zone }: {
  layout: typeof ZONE_LAYOUTS[0];
  zone?: FootfallZone;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const pct     = zone?.occupancyPct ?? 0;
  const count   = zone?.count ?? 0;
  const color   = useMemo(() => occupancyColor(pct), [pct]);
  const isCrowd = pct > 80;

  useFrame((state) => {
    if (!meshRef.current || !isCrowd) return;
    const t = state.clock.elapsedTime;
    (meshRef.current.material as THREE.MeshStandardMaterial).opacity = 0.55 + Math.sin(t * 3) * 0.15;
  });

  return (
    <group position={layout.pos}>
      {/* Floor tile */}
      <mesh ref={meshRef} receiveShadow>
        <boxGeometry args={layout.size} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.45}
          roughness={0.8}
        />
      </mesh>

      {/* Border outline */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...layout.size)]} />
        <lineBasicMaterial color={color} opacity={0.8} transparent />
      </lineSegments>

      {/* Zone label */}
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.35}
        color="#0f172a"
        anchorX="center"
        anchorY="middle"
        maxWidth={3.5}
        textAlign="center"
      >
        {layout.name}
      </Text>

      {/* Count label */}
      {zone && (
        <Text position={[0, 0.7, 0]} fontSize={0.5} color={isCrowd ? '#dc2626' : '#0145f2'}
              anchorX="center" anchorY="middle" fontWeight="bold">
          {count}
        </Text>
      )}

      {/* Occupancy % */}
      {zone && (
        <Text position={[0, 0.15, layout.size[2]/2 + 0.05]} fontSize={0.25}
              color="#64748b" anchorX="center" rotation={[-Math.PI/2, 0, 0]}>
          {pct}% full
        </Text>
      )}

      {/* Crowding warning pillar */}
      {isCrowd && (
        <group position={[layout.size[0]/2 - 0.3, 0.5, layout.size[2]/2 - 0.3]}>
          <mesh>
            <cylinderGeometry args={[0.08,0.08,1,6]} />
            <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.5} />
          </mesh>
          <pointLight color="#dc2626" intensity={1} distance={2} position={[0,0.6,0]} />
        </group>
      )}
    </group>
  );
}

// ── Shelf ─────────────────────────────────────────────────────
function Shelf({ pos }: { pos: number[] }) {
  return (
    <group position={pos as [number,number,number]}>
      {[0, 0.3, 0.6].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <boxGeometry args={[1.4, 0.06, 0.5]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[-0.68, 0.35, 0]} castShadow>
        <boxGeometry args={[0.05, 0.8, 0.5]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <mesh position={[0.68, 0.35, 0]} castShadow>
        <boxGeometry args={[0.05, 0.8, 0.5]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Store floor ───────────────────────────────────────────────
function StoreFloor() {
  return (
    <mesh receiveShadow rotation={[-Math.PI/2, 0, 0]} position={[0,-0.1,0]}>
      <planeGeometry args={[22, 20]} />
      <meshStandardMaterial color="#f1f5f9" roughness={0.95} />
    </mesh>
  );
}

// ── Walls ─────────────────────────────────────────────────────
function Walls() {
  const mat = <meshStandardMaterial color="#e2e8f0" roughness={0.95} />;
  return (
    <group>
      {/* Back */}
      <mesh position={[0,1,-10]} castShadow><boxGeometry args={[22,2,0.2]}/>{mat}</mesh>
      {/* Front */}
      <mesh position={[0,1,8]}  castShadow><boxGeometry args={[22,2,0.2]}/>{mat}</mesh>
      {/* Left */}
      <mesh position={[-11,1,0]} castShadow><boxGeometry args={[0.2,2,20]}/>{mat}</mesh>
      {/* Right */}
      <mesh position={[11,1,0]} castShadow><boxGeometry args={[0.2,2,20]}/>{mat}</mesh>
    </group>
  );
}

// ── Person blob ───────────────────────────────────────────────
function PersonBlob({ pos, color='#0145f2' }: { pos:[number,number,number]; color?:string }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.position.y = 0.3 + Math.sin(s.clock.elapsedTime * 2 + pos[0]) * 0.05;
  });
  return (
    <group ref={ref} position={pos}>
      <mesh><sphereGeometry args={[0.15,8,8]}/><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0,-0.28,0]}><cylinderGeometry args={[0.12,0.14,0.4,8]}/><meshStandardMaterial color={color} /></mesh>
    </group>
  );
}

// ── Scene ─────────────────────────────────────────────────────
function Scene({ zones }: { zones: FootfallZone[] }) {
  const zoneMap = useMemo(() => {
    const m: Record<string, FootfallZone> = {};
    zones.forEach(z => { m[z.zoneId] = z; });
    return m;
  }, [zones]);

  // Generate person blobs per zone
  const persons = useMemo(() => {
    const blobs: { pos:[number,number,number]; color:string }[] = [];
    ZONE_LAYOUTS.forEach(layout => {
      const z = zones.find(z => z.zoneName === layout.name);
      const count = Math.min(z?.count ?? 0, 6);
      for (let i=0; i<count; i++) {
        blobs.push({
          pos: [
            layout.pos[0] + (Math.random()-.5)*(layout.size[0]*.7),
            0.3,
            layout.pos[2] + (Math.random()-.5)*(layout.size[2]*.7),
          ],
          color: occupancyColor((z?.occupancyPct ?? 0)).getStyle(),
        });
      }
    });
    return blobs;
  }, [zones]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5,10,5]} intensity={0.8} castShadow shadow-mapSize={[1024,1024]} />
      <directionalLight position={[-5,6,-3]} intensity={0.3} color="#e8f4ff" />

      <StoreFloor />
      <Walls />

      {ZONE_LAYOUTS.map(layout => (
        <ZoneTile
          key={layout.id}
          layout={layout}
          zone={zones.find(z => z.zoneName === layout.name)}
        />
      ))}

      {SHELVES.map((pos,i) => <Shelf key={i} pos={pos} />)}

      {persons.map((p,i) => <PersonBlob key={i} pos={p.pos} color={p.color} />)}

      {/* Entrance door */}
      <group position={[0, 0.5, 7.5]}>
        <mesh><boxGeometry args={[2, 1.5, 0.1]}/><meshStandardMaterial color="#bfdbfe" transparent opacity={0.5}/></mesh>
      </group>

      <gridHelper args={[20, 20, '#e2e8f0', '#f1f5f9']} position={[0,-0.09,0]} />

      <OrbitControls
        enablePan minDistance={5} maxDistance={28}
        maxPolarAngle={Math.PI/2.1}
        target={[0, 0, 0]}
      />
    </>
  );
}

// ── STORE MAP PAGE ─────────────────────────────────────────────
export default function StoreMapPage() {
  const zones = useStore(s => s.footfall);

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-mono font-bold text-slate-900" style={{ fontSize:18, letterSpacing:'0.05em' }}>3D Store Map</h1>
          <p className="font-mono text-slate-400 text-xs mt-0.5">Live occupancy · Drag to orbit · Scroll to zoom</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-3 card px-3 py-2">
            {[
              { color:'#16a34a', label:'Low' },
              { color:'#0145f2', label:'Moderate' },
              { color:'#d97706', label:'High' },
              { color:'#dc2626', label:'Crowded' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background:l.color }} />
                <span className="font-mono text-slate-500" style={{ fontSize:9 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone stats strip */}
      <div className="flex gap-3 overflow-x-auto flex-shrink-0 pb-1">
        {ZONE_LAYOUTS.map(layout => {
          const z = zones.find(z => z.zoneName === layout.name);
          const pct = z?.occupancyPct ?? 0;
          const color = pct>85?'#dc2626':pct>60?'#d97706':pct>30?'#0145f2':'#16a34a';
          return (
            <div key={layout.id} className="card px-3 py-2 flex-shrink-0">
              <div className="section-label mb-1" style={{ fontSize:8 }}>{layout.name}</div>
              <div className="font-mono font-bold text-lg" style={{ color, lineHeight:1 }}>{z?.count ?? 0}</div>
              <div className="font-mono text-slate-400" style={{ fontSize:9 }}>{pct}%</div>
            </div>
          );
        })}
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 card overflow-hidden three-canvas" style={{ minHeight:380 }}>
        <Canvas
          shadows
          camera={{ position:[0, 14, 14], fov:45 }}
          gl={{ antialias:true, alpha:false }}
          style={{ background:'#f8fafc', width:'100%', height:'100%' }}
        >
          <Suspense fallback={null}>
            <Scene zones={zones} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
