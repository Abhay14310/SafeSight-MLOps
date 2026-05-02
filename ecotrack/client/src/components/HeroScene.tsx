// src/components/HeroScene.tsx
// Three.js 3D globe with waste collection points, GSAP ScrollTrigger 3D parallax
import React, { useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ── Rotating Earth Globe ─────────────────────────────────────
function Globe() {
  const meshRef  = useRef<THREE.Mesh>(null!);
  const wireRef  = useRef<THREE.Mesh>(null!);
  const glowRef  = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    meshRef.current.rotation.y  += delta * 0.18;
    wireRef.current.rotation.y  += delta * 0.18;
    if (glowRef.current) {
      glowRef.current.rotation.y -= delta * 0.05;
      (glowRef.current.material as any).opacity = 0.12 + Math.sin(Date.now() * 0.001) * 0.04;
    }
  });

  return (
    <group>
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2.2, 48, 48]} />
        <meshStandardMaterial
          color="#14532d"
          roughness={0.7}
          metalness={0.1}
          emissive="#052e16"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[2.22, 24, 24]} />
        <meshStandardMaterial
          color="#22c55e"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.5, 16, 16]} />
        <meshStandardMaterial
          color="#4ade80"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// ── Waste Collection Points (animated dots on globe) ────────
function CollectionPoints() {
  const groupRef = useRef<THREE.Group>(null!);
  const points   = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 18; i++) {
      const phi   = Math.acos(-1 + (2 * i) / 18);
      const theta = Math.sqrt(18 * Math.PI) * phi;
      const r = 2.28;
      pts.push({
        pos: new THREE.Vector3(
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(phi)
        ),
        scale: 0.04 + Math.random() * 0.06,
        speed: 0.5 + Math.random() * 1.5,
      });
    }
    return pts;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.003;
    groupRef.current.children.forEach((child, i) => {
      const t = state.clock.elapsedTime * points[i].speed;
      child.scale.setScalar(points[i].scale * (0.8 + Math.sin(t) * 0.4));
      ((child as THREE.Mesh).material as any).opacity = 0.5 + Math.sin(t * 1.3) * 0.4;
    });
  });

  return (
    <group ref={groupRef}>
      {points.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[p.scale, 8, 8]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#86efac' : '#22c55e'}
            emissive={i % 3 === 0 ? '#22c55e' : '#16a34a'}
            emissiveIntensity={1.2}
            transparent opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Orbit Rings ──────────────────────────────────────────────
function OrbitRings() {
  const r1 = useRef<THREE.Group>(null!);
  const r2 = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    r1.current.rotation.z += delta * 0.12;
    r2.current.rotation.x += delta * 0.08;
  });

  const ringMat = (opacity: number) => (
    <meshStandardMaterial color="#4ade80" transparent opacity={opacity} side={THREE.DoubleSide} />
  );

  return (
    <>
      <group ref={r1} rotation={[Math.PI / 3, 0, 0]}>
        <mesh>
          <torusGeometry args={[3.2, 0.015, 8, 80]} />
          {ringMat(0.25)}
        </mesh>
      </group>
      <group ref={r2} rotation={[0, Math.PI / 4, Math.PI / 5]}>
        <mesh>
          <torusGeometry args={[3.8, 0.01, 8, 80]} />
          {ringMat(0.15)}
        </mesh>
      </group>
    </>
  );
}

// ── Particle Field ───────────────────────────────────────────
function Particles() {
  const ref   = useRef<THREE.Points>(null!);
  const count = 800;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i=0; i<count; i++) {
      arr[i*3]   = (Math.random()-0.5)*20;
      arr[i*3+1] = (Math.random()-0.5)*20;
      arr[i*3+2] = (Math.random()-0.5)*20;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y  = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x  = state.clock.elapsedTime * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#4ade80" transparent opacity={0.45} sizeAttenuation />
    </points>
  );
}

// ── Camera scroll handler ────────────────────────────────────
function CameraRig({ scrollY }: { scrollY: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  useFrame(() => {
    const y = scrollY.current;
    camera.position.z = 7 - y * 0.005;
    camera.position.y = y * 0.003;
    camera.rotation.x = -y * 0.0003;
  });
  return null;
}

// ── Exported Hero Scene ──────────────────────────────────────
interface HeroSceneProps {
  scrollY?: React.MutableRefObject<number>;
  height?: number | string;
}

export default function HeroScene({ scrollY, height = 480 }: HeroSceneProps) {
  const scrollRef = scrollY ?? useRef(0);

  return (
    <div className="three-canvas" style={{ width:'100%', height }}>
      <Canvas
        camera={{ position:[0,0,7], fov:42 }}
        gl={{ antialias:true, alpha:true }}
        style={{ background:'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[8,8,4]} intensity={1.2} color="#86efac" />
        <pointLight position={[-6,-4,3]} intensity={0.5} color="#22c55e" />
        <directionalLight position={[4,6,2]} intensity={0.6} color="#fff" />

        <Suspense fallback={null}>
          <Globe />
          <CollectionPoints />
          <OrbitRings />
          <Particles />
          <CameraRig scrollY={scrollRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
