import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';

const COUNT = 300;

export const Confetti = () => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { theme, isSolved } = useStore();
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < COUNT; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 50;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!mesh.current || !isSolved) {
        if(mesh.current) mesh.current.visible = false;
        return;
    }
    
    mesh.current.visible = true;

    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const s = Math.cos(t);
      
      dummy.position.set(
        (particle.mx / 10) * s + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * s + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * s + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      
      const scale = Math.max(0, Math.cos(t));
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  const particleColor = useMemo(() => {
    if (theme === 'DEV') return new THREE.Color('#9333ea'); // Purple
    if (theme === 'ANIME') return new THREE.Color('#3b82f6'); // Blue
    if (theme === 'NEON') return new THREE.Color('#00ffcc'); // Cyan/Neon
    return new THREE.Color('#e69e47');
  }, [theme]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial color={particleColor} emissive={particleColor} emissiveIntensity={2} />
    </instancedMesh>
  );
};