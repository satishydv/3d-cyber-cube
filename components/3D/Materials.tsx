import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

// --- SKETCH / HAND DRAWN SHADER (Pop-Art / Comic Style) ---
// Note: uTime is kept in definition but no longer used for vertex displacement to ensure stability
const SketchMaterial = shaderMaterial(
  { uColor: new THREE.Color(), uTime: 0 },
  // Vertex - STABLE (No wobble)
  `
    varying vec2 vUv;
    varying vec3 vPos;
    uniform float uTime;
    
    void main() {
      vUv = uv;
      vPos = position;
      
      // Standard position logic - NO BREATHING/WOBBLE
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment - POP ART STYLE
  `
    varying vec2 vUv;
    varying vec3 vPos;
    uniform vec3 uColor;
    
    // Pseudo-random
    float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    void main() {
      // 1. Vibrant Base Color
      vec3 color = uColor;

      // 2. Comic Ink Border
      // Calculate signed distance to edge of UV space (0..1)
      vec2 d = abs(vUv - 0.5) * 2.0; // 0 center, 1 at edge
      float dist = max(d.x, d.y);
      
      // Static organic wobble for border (based on UV, not Time)
      float wobble = sin(vUv.x * 20.0) * 0.01 + cos(vUv.y * 25.0) * 0.01;
      
      // Thick border threshold (e.g. 0.85 to 1.0 is border)
      float borderThresh = 0.82 + wobble; 
      
      if (dist > borderThresh) {
          gl_FragColor = vec4(0.05, 0.05, 0.05, 1.0); // Deep Ink Black
          return;
      }

      // 3. Inner "Cushion" Shadow (Subtle ambient occlusion near border)
      float innerEdge = smoothstep(0.7, 0.9, dist);
      color = mix(color, color * 0.8, innerEdge);

      // 4. Highlight Arc (Top-Left)
      vec2 centerTL = vec2(0.1, 0.9);
      float distTL = distance(vUv, centerTL);
      
      if (distTL > 0.15 && distTL < 0.28) {
          if (vUv.y > 0.6 && vUv.x < 0.4) {
              float alpha = smoothstep(0.0, 0.1, min(abs(distTL - 0.15), abs(distTL - 0.28)));
              color = mix(color, vec3(1.0, 1.0, 1.0), 0.9);
          }
      }
      
      // Small "dot" highlight
      if (distance(vUv, vec2(0.18, 0.82)) < 0.04) {
           color = vec3(1.0);
      }

      // 5. Shadow Hatching (Bottom-Right)
      if (vUv.x > 0.6 && vUv.y < 0.4) {
           float distBR = distance(vUv, vec2(1.0, 0.0));
           if (distBR < 0.6) {
               float stripes = sin((vUv.x - vUv.y) * 80.0);
               if (stripes > 0.2) {
                   color = mix(color, vec3(0.0), 0.15); // Darken strips
               }
           }
      }

      // 6. Paper Grain
      float noise = rand(vUv * 99.0);
      color += (noise - 0.5) * 0.04;

      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ SketchMaterial });

export { SketchMaterial };