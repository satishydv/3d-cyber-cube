import React, { useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { PerspectiveCamera, Environment, OrbitControls, ContactShadows, SoftShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useFrame, useThree } from '@react-three/fiber';
import { useStore } from '../../store';
import * as THREE from 'three';
import { RubiksCube } from './RubiksCube';
import { Confetti } from './Confetti';
import gsap from 'gsap';

export const SceneContainer = () => {
  const mode = useStore((state) => state.mode);
  const theme = useStore((state) => state.theme);
  const orbitEnabled = useStore((state) => state.orbitEnabled);
  const isSolved = useStore((state) => state.isSolved);
  const setSolvedSnapshot = useStore((state) => state.setSolvedSnapshot);
  const setCameraQuaternion = useStore((state) => state.setCameraQuaternion);
  
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const cubeGroupRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<any>(null);
  const { width, gl, scene, camera } = useThree((state) => ({ 
      width: state.size.width,
      gl: state.gl,
      scene: state.scene,
      camera: state.camera
  }));
  const isFirstRender = useRef(true);
  
  const isMobile = width < 768;

  // Snapshot Logic
  useEffect(() => {
    if (isSolved) {
        // Force a render to capture the exact frame
        gl.render(scene, camera);
        const dataUrl = gl.domElement.toDataURL('image/png');
        setSolvedSnapshot(dataUrl);
    }
  }, [isSolved, gl, scene, camera, setSolvedSnapshot]);

  // Sync orbit controls state
  useEffect(() => {
    if (orbitRef.current) {
        orbitRef.current.enabled = mode === 'GAME' && orbitEnabled;
    }
  }, [mode, orbitEnabled]);

  // Handle camera sync on interaction end
  const handleOrbitEnd = () => {
      if (cameraRef.current) {
          setCameraQuaternion(cameraRef.current.quaternion.toArray());
      }
  };

  // Initial Sync when entering Game Mode
  useEffect(() => {
      if (mode === 'GAME' && cameraRef.current) {
           setCameraQuaternion(cameraRef.current.quaternion.toArray());
      }
  }, [mode, setCameraQuaternion]);

  // Memoize target to prevent unnecessary updates/glitches
  const orbitTarget = useMemo(() => {
    if (mode === 'HERO') {
        if (isMobile) return [0, 3.5, 0];
        return [-6, 0, 0]; // Laptop Hero Target
    }
    return [0, 0, 0]; // Game Mode Target
  }, [mode, isMobile]);
  
  useLayoutEffect(() => {
      if (!cameraRef.current) return;
      const cam = cameraRef.current;
      
      gsap.killTweensOf(cam.position);
      if (cubeGroupRef.current) {
          gsap.killTweensOf(cubeGroupRef.current.position);
          gsap.killTweensOf(cubeGroupRef.current.rotation);
          gsap.killTweensOf(cubeGroupRef.current.scale);
      }
      
      // CAM_POS: Standard Isometric view
      const CAM_POS = new THREE.Vector3(6, 4.5, 9);
      
      // Calculate Targets
      let targetLookAt;
      const WORLD_CENTER = new THREE.Vector3(0, 0, 0);

      // Cube Targets (Pos, Rot, Scale)
      const targetCubePos = new THREE.Vector3(0, 0, 0);
      let targetCubeRot = { x: 0, y: 0, z: 0 };
      let targetCubeScale = 1;

      if (mode === 'HERO') {
          if (isMobile) {
              targetLookAt = new THREE.Vector3(0, 3.5, 0); 
              targetCubeRot = { x: 0.2, y: -0.5, z: 0 }; // Slight tilt for mobile
              targetCubeScale = 0.85;
          } else {
              targetLookAt = new THREE.Vector3(-6.0, 0, 0);
              // Showcase Position: Right side
              targetCubePos.set(-1, 1.25, 0);
              // Showcase Rotation: Tilted to show 3 faces clearly
              targetCubeRot = { x: 0.15, y: -0.4, z: 0.05 }; 
              // Showcase Scale: Slightly smaller to fit UI composition
              targetCubeScale = 0.9;
          }

          // INITIAL ENTRY: Look WAY LEFT (-30) so object appears OFF SCREEN RIGHT
          if (isFirstRender.current && !isMobile) {
               cam.lookAt(-30, 0, 0);
               isFirstRender.current = false;
          }
      } else {
          // GAME MODE
          targetLookAt = WORLD_CENTER;
          targetCubePos.set(0, 0, 0);
          targetCubeRot = { x: 0, y: 0, z: 0 }; // Reset rotation for solving
          targetCubeScale = 1.0;
      }

      // Calculate current LookAt vector for smoother tweening
      const currentLookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).add(cam.position);
      const lookAtProxy = { x: currentLookAt.x, y: currentLookAt.y, z: currentLookAt.z };

      // --- ANIMATION TIMELINE ---

      // 1. Camera Move
      gsap.to(cam.position, {
          x: CAM_POS.x,
          y: CAM_POS.y,
          z: CAM_POS.z,
          duration: 1.5,
          ease: "power3.inOut"
      });

      // 2. Camera LookAt Tween
      gsap.to(lookAtProxy, {
          x: targetLookAt.x,
          y: targetLookAt.y,
          z: targetLookAt.z,
          duration: 1.5,
          ease: "power3.inOut",
          onUpdate: () => {
              cam.lookAt(lookAtProxy.x, lookAtProxy.y, lookAtProxy.z);
              if (mode === 'GAME' && orbitRef.current) {
                  orbitRef.current.target.set(lookAtProxy.x, lookAtProxy.y, lookAtProxy.z);
                  orbitRef.current.update();
              }
          },
          onComplete: () => {
              cam.lookAt(targetLookAt.x, targetLookAt.y, targetLookAt.z);
              if (mode === 'GAME' && orbitRef.current) {
                   orbitRef.current.target.set(targetLookAt.x, targetLookAt.y, targetLookAt.z);
                   orbitRef.current.update();
                   // Sync initial rotation after animation
                   if (cameraRef.current) setCameraQuaternion(cameraRef.current.quaternion.toArray());
              }
          }
      });

      // 3. Cube Animation (Position + Rotation Spin + Scale Pop)
      if (cubeGroupRef.current) {
          // Position
          gsap.to(cubeGroupRef.current.position, {
              x: targetCubePos.x,
              y: targetCubePos.y,
              z: targetCubePos.z,
              duration: 1.6,
              ease: "power3.inOut"
          });

          // Rotation with "Spin" effect
          const spinOffset = mode === 'GAME' ? Math.PI * 2 : 0;
          
          gsap.to(cubeGroupRef.current.rotation, {
              x: targetCubeRot.x,
              y: targetCubeRot.y + spinOffset,
              z: targetCubeRot.z,
              duration: 1.8,
              ease: mode === 'GAME' ? "back.out(0.8)" : "power2.inOut"
          });

          // Scale
          gsap.to(cubeGroupRef.current.scale, {
              x: targetCubeScale,
              y: targetCubeScale,
              z: targetCubeScale,
              duration: 1.5,
              ease: "power2.inOut"
          });
      }

  }, [mode, isMobile]);

  // Idle Float Animation (Only in Hero)
  useFrame((state) => {
    if (mode === 'HERO' && cameraRef.current) {
      const time = state.clock.elapsedTime;
      cameraRef.current.position.y = 4.5 + Math.sin(time * 0.5) * 0.1;
    }
  });

  const getEnvPreset = () => {
      if (theme === 'NEON') return 'night';
      if (theme === 'ANIME') return 'city';
      if (theme === 'DEV') return 'warehouse';
      if (theme === 'TECH') return 'city'; 
      if (theme === 'SKETCH') return 'studio'; 
      return 'lobby'; 
  };

  return (
    <>
      <PerspectiveCamera makeDefault ref={cameraRef} position={[6, 4.5, 9]} fov={35} />
      
      {mode === 'GAME' && (
        <OrbitControls 
            ref={orbitRef}
            enabled={orbitEnabled} 
            enablePan={false}
            enableZoom={true}
            enableDamping={false} 
            minDistance={5}
            maxDistance={20}
            target={orbitTarget as any}
            onEnd={handleOrbitEnd}
            makeDefault
        />
      )}

      {/* --- REALISTIC STUDIO LIGHTING SETUP --- */}

      {/* 1. Ambient: Reduced for SKETCH to allow shadows. Low for TECH for contrast. */}
      <ambientLight intensity={theme === 'SKETCH' ? 0.5 : (theme === 'NEON' ? 0.05 : 0.1)} />
      
      {/* 2. Key Light: Main Directional Light (Sun) - Boosted for SKETCH and TECH */}
      <directionalLight 
          position={[5, 10, 5]} 
          intensity={theme === 'NEON' ? 0.2 : (theme === 'SKETCH' ? 3.5 : 4.5)}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
          color={theme === 'DEV' ? '#d8b4fe' : '#ffffff'} 
      >
         <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10]} />
      </directionalLight>

      {/* 3. Fill Light: Kept moderate to ensure shaded sides are visible but darker */}
      <pointLight 
        position={[-10, 2, -2]} 
        intensity={theme === 'TECH' ? 0.3 : (theme === 'NEON' ? 0.5 : 0.4)} 
        color={theme === 'NEON' ? '#0044ff' : (theme === 'ANIME' ? '#ff99aa' : '#ffffff')}
        decay={2}
      />
      
      {/* 4. Rim Light: Back light to separate object from background and highlight edges */}
      <spotLight 
        position={[0, 5, -8]} 
        angle={0.6} 
        penumbra={0.5} 
        intensity={theme === 'NEON' ? 4.0 : 2.5} 
        color={theme === 'NEON' ? '#00ffff' : '#ffffff'}
        castShadow={false}
      />

      {/* Environment Map for PBR Reflections */}
      <Environment preset={getEnvPreset() as any} background={false} blur={0.6} />
      
      {/* Shadows */}
      <ContactShadows 
        opacity={theme === 'NEON' ? 0.2 : 0.5} 
        scale={20} 
        blur={2.5} 
        far={4.5} 
        color="#000000"
      />
      
      {theme !== 'NEON' && <SoftShadows size={15} samples={16} focus={0.4} />}

      {/* Post Processing Effects */}
      {theme === 'NEON' && (
          <EffectComposer enableNormalPass={false}>
             <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.5} radius={0.4} />
          </EffectComposer>
      )}

      {/* CUBE CONTAINER */}
      <group ref={cubeGroupRef}>
        <RubiksCube />
      </group>

      {/* CONFETTI */}
      <Confetti />
    </>
  );
};