// src/components/ThreeBodyModel.tsx
// 3D interactive human body via React Three Fiber
// Shows alert zones as glowing spheres on anatomical positions
// Rotates slowly; user can orbit

import React, { useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Cylinder, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import type { AlertZone, Vitals } from '@/types';

// ─── BODY SEGMENTS ────────────────────────────────────────────
const BODY_PARTS = [
  // [id, position, scale, label]
  { id:'head',     pos:[0, 1.65, 0] as [number,number,number], r:0.18, label:'Head' },
  { id:'neck',     pos:[0, 1.40, 0] as [number,number,number], r:0.07, h:0.18, type:'cyl' },
  { id:'torso',    pos:[0, 0.90, 0] as [number,number,number], r:0.24, h:0.65, type:'cyl' },
  { id:'pelvis',   pos:[0, 0.50, 0] as [number,number,number], r:0.20, h:0.22, type:'cyl' },
  { id:'l-upper-arm', pos:[-0.35, 1.10, 0] as [number,number,number], r:0.07, h:0.32, type:'cyl', rot:[0,0,Math.PI/8] },
  { id:'r-upper-arm', pos:[ 0.35, 1.10, 0] as [number,number,number], r:0.07, h:0.32, type:'cyl', rot:[0,0,-Math.PI/8] },
  { id:'l-lower-arm', pos:[-0.40, 0.72, 0] as [number,number,number], r:0.055,h:0.28, type:'cyl', rot:[0,0,Math.PI/12] },
  { id:'r-lower-arm', pos:[ 0.40, 0.72, 0] as [number,number,number], r:0.055,h:0.28, type:'cyl', rot:[0,0,-Math.PI/12] },
  { id:'l-thigh',  pos:[-0.13, 0.14, 0] as [number,number,number], r:0.10, h:0.40, type:'cyl' },
  { id:'r-thigh',  pos:[ 0.13, 0.14, 0] as [number,number,number], r:0.10, h:0.40, type:'cyl' },
  { id:'l-shin',   pos:[-0.13,-0.40, 0] as [number,number,number], r:0.07, h:0.36, type:'cyl' },
  { id:'r-shin',   pos:[ 0.13,-0.40, 0] as [number,number,number], r:0.07, h:0.36, type:'cyl' },
];

// ─── ALERT ZONE POSITIONS (anatomical) ───────────────────────
const ZONE_POSITIONS: Record<string, [number,number,number]> = {
  head:      [0,  1.65, 0],
  chest:     [0,  1.05, 0.22],
  heart:     [-0.15, 1.05, 0.22],
  leftHip:   [-0.18, 0.52, 0.18],
  rightHip:  [ 0.18, 0.52, 0.18],
  leftKnee:  [-0.13,-0.24, 0.14],
  rightKnee: [ 0.13,-0.24, 0.14],
  leftAnkle: [-0.13,-0.68, 0.1],
  rightAnkle:[ 0.13,-0.68, 0.1],
  spine:     [0,  0.80, -0.2],
};

// ─── BODY MESH ────────────────────────────────────────────────
function BodyMesh({ wireframe = false }: { wireframe?: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.18;
    }
  });

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.2,
    roughness: 0.7,
    wireframe,
    emissive: new THREE.Color(0x001a20),
    emissiveIntensity: 0.3,
  }), [wireframe]);

  return (
    <group ref={groupRef}>
      {BODY_PARTS.map(part => (
        <mesh key={part.id} position={part.pos} rotation={part.rot as [number,number,number] | undefined} castShadow>
          {part.type === 'cyl'
            ? <cylinderGeometry args={[part.r, part.r * 1.05, part.h ?? 0.3, 12]} />
            : <sphereGeometry args={[part.r, 14, 14]} />
          }
          <primitive object={mat} attach="material" />
        </mesh>
      ))}

      {/* Wireframe overlay */}
      {!wireframe && BODY_PARTS.map(part => (
        <mesh key={`wf-${part.id}`} position={part.pos} rotation={part.rot as [number,number,number] | undefined}>
          {part.type === 'cyl'
            ? <cylinderGeometry args={[part.r + 0.002, part.r * 1.05 + 0.002, part.h ?? 0.3, 12]} />
            : <sphereGeometry args={[part.r + 0.002, 14, 14]} />
          }
          <meshStandardMaterial
            color={0x00d4ff} wireframe transparent opacity={0.08}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── ALERT ZONE SPHERE ────────────────────────────────────────
function AlertSphere({
  position, severity, label, groupRotation
}: {
  position: [number,number,number];
  severity: 'info'|'warning'|'critical';
  label: string;
  groupRotation: React.MutableRefObject<number>;
}) {
  const meshRef  = useRef<THREE.Mesh>(null!);
  const ringRef  = useRef<THREE.Mesh>(null!);
  const color    = severity === 'critical' ? '#FF0000' : severity === 'warning' ? '#ffaa00' : '#00d4ff';
  const intensity= severity === 'critical' ? 3 : severity === 'warning' ? 2 : 1;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(t * (severity === 'critical' ? 4 : 2)) * 0.12);
    }
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.2);
      ringRef.current.rotation.z = t * 0.5;
      // Counter-rotate so label stays upright while body spins
      ringRef.current.rotation.y = -groupRotation.current;
    }
  });

  return (
    <group position={position}>
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={intensity}
          transparent opacity={0.9}
        />
      </mesh>

      {/* Point light */}
      <pointLight color={color} intensity={severity === 'critical' ? 2 : 1} distance={0.6} />

      {/* Expanding ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.10, 0.008, 6, 20]} />
        <meshStandardMaterial
          color={color} emissive={color} emissiveIntensity={0.8}
          transparent opacity={0.5}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0.22, 0, 0]}
        fontSize={0.06}
        color={color}
        anchorX="left"
        font="/fonts/SpaceMono-Regular.ttf"
        maxWidth={0.5}
      >
        {label}
      </Text>
    </group>
  );
}

// ─── VITALS FLOATING TEXT ─────────────────────────────────────
function VitalsHUD({ vitals }: { vitals?: Vitals }) {
  if (!vitals) return null;
  return (
    <group position={[0.7, 1.2, 0]}>
      {[
        { label:'BPM',  val:vitals.bpm,       color:'#FF4D6D', y:0 },
        { label:'SpO₂', val:`${vitals.spo2}%`, color:'#00d4ff', y:-0.14 },
        { label:'T°',   val:`${vitals.temp}°`, color:'#ffaa00', y:-0.28 },
      ].map(item => (
        <group key={item.label} position={[0, item.y, 0]}>
          <Text fontSize={0.055} color={item.color} anchorX="left">
            {item.label}: {item.val}
          </Text>
        </group>
      ))}
    </group>
  );
}

// ─── SCENE ────────────────────────────────────────────────────
function Scene({
  alertZones,
  vitals,
  wireframe,
}: {
  alertZones: AlertZone[];
  vitals?: Vitals;
  wireframe: boolean;
}) {
  const groupRotation = useRef(0);

  useFrame((_, delta) => {
    groupRotation.current += delta * 0.18;
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 3, 2]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-2, 1, -1]} intensity={0.2} color="#00d4ff" />
      <pointLight position={[0, 2, 2]} intensity={0.5} color="#00d4ff" distance={5} />

      {/* Floor grid */}
      <gridHelper args={[4, 20, '#1a1a1a', '#111111']} position={[0, -0.85, 0]} />

      <BodyMesh wireframe={wireframe} />

      {alertZones.map(zone => {
        const pos = ZONE_POSITIONS[zone.id] ?? zone.position;
        return (
          <AlertSphere
            key={zone.id}
            position={pos}
            severity={zone.severity}
            label={zone.label}
            groupRotation={groupRotation}
          />
        );
      })}

      <VitalsHUD vitals={vitals} />

      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={5}
        target={[0, 0.6, 0]}
        autoRotate={false}
      />
    </>
  );
}

// ─── EXPORTED COMPONENT ───────────────────────────────────────
interface ThreeBodyModelProps {
  alertZones?: AlertZone[];
  vitals?: Vitals;
  wireframe?: boolean;
  className?: string;
}

export default function ThreeBodyModel({
  alertZones = [],
  vitals,
  wireframe = false,
  className = '',
}: ThreeBodyModelProps) {
  return (
    <div className={`relative three-canvas ${className}`} style={{ background:'#020202' }}>
      {/* Corner brackets overlay */}
      <div className="brackets absolute inset-0 z-10 pointer-events-none"><span /></div>

      {/* Mode badge */}
      <div className="absolute top-2 left-2 z-10">
        <div className="badge-cyan text-xs">
          {wireframe ? 'WIREFRAME' : '3D MODEL'}
        </div>
      </div>

      {/* Alert count */}
      {alertZones.length > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <motion.div
            animate={{ opacity:[1,0.4,1] }}
            transition={{ duration:1.2, repeat:Infinity }}
            className="badge-red"
          >
            {alertZones.length} ZONE{alertZones.length > 1 ? 'S' : ''}
          </motion.div>
        </div>
      )}

      <Canvas
        camera={{ position:[0, 0.6, 3.5], fov:45 }}
        gl={{ antialias:true, alpha:true }}
        shadows
        style={{ background:'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene alertZones={alertZones} vitals={vitals} wireframe={wireframe} />
        </Suspense>
      </Canvas>

      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-5">
        <div style={{
          position:'absolute', left:0, right:0, height:2,
          background:'linear-gradient(90deg,transparent,rgba(0,212,255,0.1),transparent)',
          animation:'scanLine 4s linear infinite',
        }} />
      </div>

      {/* Legend */}
      {alertZones.length > 0 && (
        <div className="absolute bottom-2 left-2 z-10 space-y-1">
          {[
            { sev:'critical', color:'#FF0000', label:'Critical' },
            { sev:'warning',  color:'#ffaa00', label:'Warning' },
            { sev:'info',     color:'#00d4ff', label:'Info' },
          ].filter(l => alertZones.some(z => z.severity === l.sev)).map(l => (
            <div key={l.sev} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background:l.color, boxShadow:`0 0 4px ${l.color}` }} />
              <span className="font-mono" style={{ fontSize:8, color:l.color }}>{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── UTIL: derive alert zones from current data ───────────────
export function buildAlertZones(vitals?: Vitals, alerts: { type:string; severity:string }[] = []): AlertZone[] {
  const zones: AlertZone[] = [];

  if (vitals) {
    if (vitals.bpm > 120 || vitals.bpm < 45) {
      zones.push({ id:'heart', label:`HR ${vitals.bpm}`, position:ZONE_POSITIONS.heart, severity:'critical' });
    } else if (vitals.bpm > 100) {
      zones.push({ id:'heart', label:`HR ${vitals.bpm}`, position:ZONE_POSITIONS.heart, severity:'warning' });
    }
    if (vitals.spo2 < 90) {
      zones.push({ id:'chest', label:`SpO₂ ${vitals.spo2}%`, position:ZONE_POSITIONS.chest, severity:'critical' });
    } else if (vitals.spo2 < 94) {
      zones.push({ id:'chest', label:`SpO₂ ${vitals.spo2}%`, position:ZONE_POSITIONS.chest, severity:'warning' });
    }
  }

  alerts.forEach(a => {
    if (a.type === 'FALL_DETECTED')
      zones.push({ id:'leftHip', label:'Fall Risk', position:ZONE_POSITIONS.leftHip, severity:a.severity as AlertZone['severity'] });
    if (a.type === 'ABNORMAL_GAIT')
      zones.push({ id:'leftKnee', label:'Gait Alert', position:ZONE_POSITIONS.leftKnee, severity:a.severity as AlertZone['severity'] });
  });

  return zones;
}
