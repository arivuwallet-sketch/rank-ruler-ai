import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const MINT = "#3ee0b0";
const VIOLET = "#a78bfa";
const SKY = "#5eb8ff";

/** Fibonacci sphere points — used for the crawl-node cloud on the globe. */
function spherePoints(count: number, radius: number) {
  const pts: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    pts.push(
      new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius),
    );
  }
  return pts;
}

function Globe() {
  const group = useRef<THREE.Group>(null);
  const nodes = useMemo(() => spherePoints(220, 2.1), []);

  const nodeGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(nodes.flatMap((p) => [p.x, p.y, p.z]), 3),
    );
    return g;
  }, [nodes]);

  // Great-circle arcs between distant nodes = the internal link graph.
  const arcs = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    for (let i = 0; i < 26; i++) {
      const a = nodes[(i * 17) % nodes.length]!;
      const b = nodes[(i * 53 + 11) % nodes.length]!;
      const pts: THREE.Vector3[] = [];
      for (let t = 0; t <= 24; t++) {
        const k = t / 24;
        const v = a.clone().lerp(b, k).normalize();
        const lift = 2.1 + Math.sin(k * Math.PI) * 0.55;
        pts.push(v.multiplyScalar(lift));
      }
      lines.push(pts);
    }
    return lines;
  }, [nodes]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    if (group.current) group.current.rotation.y += dt * 0.12;
  });

  return (
    <group ref={group} rotation-z={0.25}>
      <mesh>
        <icosahedronGeometry args={[2.05, 3]} />
        <meshStandardMaterial
          color="#123f4d"
          roughness={0.3}
          metalness={0.5}
          transparent
          opacity={0.7}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[2.08, 2]} />
        <meshBasicMaterial color={MINT} wireframe transparent opacity={0.4} />
      </mesh>

      <points geometry={nodeGeometry}>
        <pointsMaterial color={MINT} size={0.075} sizeAttenuation transparent opacity={1} />
      </points>

      {arcs.map((pts, i) => {
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        return (
          <primitive
            key={i}
            object={
              new THREE.Line(
                geo,
                new THREE.LineBasicMaterial({
                  color: i % 3 === 0 ? VIOLET : i % 3 === 1 ? SKY : MINT,
                  transparent: true,
                  opacity: 0.75,
                }),
              )
            }
          />
        );
      })}
    </group>
  );
}

/** Orbiting query satellites — each one reads the page like an answer engine. */
function Crawlers() {
  const group = useRef<THREE.Group>(null);
  const orbits = useMemo(
    () =>
      [
        { r: 3.0, tilt: 0.35, speed: 0.5, color: MINT },
        { r: 3.5, tilt: -0.6, speed: -0.36, color: VIOLET },
        { r: 4.0, tilt: 1.1, speed: 0.26, color: SKY },
      ] as const,
    [],
  );
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      const o = orbits[i % orbits.length]!;
      const a = t * o.speed + i * 2.1;
      child.position.set(Math.cos(a) * o.r, Math.sin(a) * o.r * Math.sin(o.tilt), Math.sin(a) * o.r);
    });
  });

  return (
    <>
      {orbits.map((o, i) => (
        <mesh key={`ring-${i}`} rotation-x={Math.PI / 2 + o.tilt * 0.5} rotation-z={o.tilt}>
          <torusGeometry args={[o.r, 0.006, 8, 160]} />
          <meshBasicMaterial color={o.color} transparent opacity={0.6} />
        </mesh>
      ))}
      <group ref={group}>
        {orbits.map((o, i) => (
          <mesh key={`sat-${i}`}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial
              color={o.color}
              emissive={o.color}
              emissiveIntensity={2.2}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

/** Slow drifting index dust for depth. */
function Dust() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(700 * 3);
    for (let i = 0; i < 700; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 26;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    if (ref.current) ref.current.rotation.y += dt * 0.015;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#9fd8f5" size={0.05} sizeAttenuation transparent opacity={0.65} />
    </points>
  );
}

function Rig() {
  useFrame((state) => {
    const { camera, pointer } = state;
    camera.position.x += (pointer.x * 1.4 - camera.position.x) * 0.03;
    camera.position.y += (1.2 + pointer.y * 0.9 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function SeoGlobeScene() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 1.2, 8.4], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 8, 6]} intensity={1.3} color="#dff7ff" />
      <pointLight position={[-6, -3, 4]} intensity={30} color={VIOLET} />
      <Environment>
        <Lightformer intensity={1.6} position={[0, 6, 2]} scale={[10, 10, 1]} />
        <Lightformer
          intensity={1}
          color={MINT}
          position={[-6, 1, -2]}
          rotation-y={Math.PI / 2}
          scale={[16, 2, 1]}
        />
      </Environment>
      <Globe />
      <Crawlers />
      <Dust />
      <Rig />
    </Canvas>
  );
}
