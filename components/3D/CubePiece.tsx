import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../../store';
import { generateDevTexture, generateAnimeTexture, generateClassicSticker, generateSketchTexture, generateNeonTunnelTexture, generateNeonCoreTexture } from '../../utils/textureGen';

interface CubePieceProps {
  initialColors: { [key: string]: string };
  id?: number;
}

const CubePiece: React.FC<CubePieceProps> = ({ initialColors, id = 0 }) => {
  const theme = useStore((state) => state.theme);
  
  // Create materials array only when theme changes
  const materials = useMemo(() => {
     // Order MUST match BoxGeometry face order: Right(x+), Left(x-), Top(y+), Bottom(y-), Front(z+), Back(z-)
     const faces = ['right', 'left', 'up', 'down', 'front', 'back'];
     
     return faces.map((face, index) => {
         const color = initialColors[face];
         const isCore = color === '#000000'; 
         
         // --- NEON / HOLO THEME (TUNNEL EFFECT) ---
         if (theme === 'NEON') {
             if (isCore) {
                const coreTex = generateNeonCoreTexture();
                return new THREE.MeshStandardMaterial({
                    map: coreTex,
                    color: '#000000',
                    roughness: 0.1,
                    metalness: 0.8,
                });
             }
             
             // Use the new Tunnel Texture
             const texture = generateNeonTunnelTexture(color);
             const threeColor = new THREE.Color(color);
             
             // HIGH EMISSIVE for intense Neon Look
             const mat = new THREE.MeshStandardMaterial({
                 map: texture,
                 color: '#000000', 
                 emissive: threeColor, 
                 emissiveMap: texture,
                 emissiveIntensity: 4.0, // High intensity for true glow
                 roughness: 0.2,
                 metalness: 0.8,
             });
             mat.userData = { isNeon: true }; 
             return mat;
         }

         // --- ANIME THEME ---
         if (theme === 'ANIME') {
             if (isCore) return new THREE.MeshStandardMaterial({ color: '#000', roughness: 0.1, metalness: 0.8 });
             const texture = generateAnimeTexture(color, id, index);
             return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.4, metalness: 0.1, emissive: color, emissiveIntensity: 0.2 });
         }

         // --- DEV THEME ---
         if (theme === 'DEV') {
             if (isCore) return new THREE.MeshPhysicalMaterial({ color: '#050505', roughness: 0.2, metalness: 0.1, clearcoat: 1.0 });
             const texture = generateDevTexture(color, id, index);
             return new THREE.MeshPhysicalMaterial({ map: texture, color: '#ffffff', roughness: 0.3, metalness: 0.0, clearcoat: 0.5, envMapIntensity: 1.2 });
        }

        // --- SKETCH THEME (Hand-Drawn / Paper) ---
        if (theme === 'SKETCH') {
            if (isCore) {
                const texture = generateSketchTexture('#111111'); 
                return new THREE.MeshStandardMaterial({
                    map: texture,
                    color: '#ffffff',
                    roughness: 1.0,
                    metalness: 0.0,
                });
            }

            const texture = generateSketchTexture(color); 
            // Removed emissive properties to allow directional lights to create contrast and shadows
            return new THREE.MeshStandardMaterial({
                map: texture,
                color: '#ffffff',
                roughness: 0.9,   
                metalness: 0.0,
            });
        }

        // --- TECH / CLASSIC (Standard Rubik's) ---
        if (isCore) {
             return new THREE.MeshStandardMaterial({
                 color: '#000000',
                 roughness: 0.5, 
                 metalness: 0.0,
             });
        }
        
        const texture = generateClassicSticker(color);
        return new THREE.MeshStandardMaterial({
            map: texture,
            color: '#ffffff',
            roughness: 0.2, // Reduced from 0.3 for more vibrant specular highlights
            metalness: 0.1, // Added slight metalness for plastic sheen
        });
     });
  }, [theme, initialColors, id]);

  // Pulse animation for NEON theme
  useFrame((state) => {
    if (theme === 'NEON') {
        const time = state.clock.elapsedTime;
        // Pulse between 3 and 5 intensity
        const pulse = 3.5 + Math.sin(time * 2.0) * 1.5; 
        materials.forEach(m => {
            if (m.userData.isNeon) {
                // @ts-ignore
                m.emissiveIntensity = pulse;
            }
        });
    }
  });

  return (
    <mesh material={materials}>
        <boxGeometry args={[0.96, 0.96, 0.96]} />
    </mesh>
  );
};

export default React.memo(CubePiece);