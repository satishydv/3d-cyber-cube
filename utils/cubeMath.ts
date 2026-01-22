import * as THREE from 'three';

// Define the 27 positions
export const INITIAL_POSITIONS: THREE.Vector3[] = [];
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      INITIAL_POSITIONS.push(new THREE.Vector3(x, y, z));
    }
  }
}

// Official WCA (World Cube Association) Standard Colors
export const COLORS = {
  U: '#FFFFFF', // Up - White
  D: '#FFD500', // Down - Yellow
  F: '#009E60', // Front - Green
  B: '#0051BA', // Back - Blue
  R: '#C41E3A', // Right - Red
  L: '#FF5800', // Left - Orange
  CORE: '#000000' // Core - Pure Black Plastic
};

// Map position to initial colors
export const getFaceColors = (x: number, y: number, z: number) => {
  const faces = {
    right: x === 1 ? COLORS.R : COLORS.CORE,
    left: x === -1 ? COLORS.L : COLORS.CORE,
    up: y === 1 ? COLORS.U : COLORS.CORE,
    down: y === -1 ? COLORS.D : COLORS.CORE,
    front: z === 1 ? COLORS.F : COLORS.CORE,
    back: z === -1 ? COLORS.B : COLORS.CORE,
  };
  return faces;
};

// Rotate a vector 90 degrees around an axis (integer math helper)
export const rotateVector = (vec: THREE.Vector3, axis: string, dir: number) => {
    const x = vec.x;
    const y = vec.y;
    const z = vec.z;
    
    // Rotate 90 deg (PI/2) * dir
    // sin(90) = 1, cos(90) = 0
    // simplified rotation matrices for 90 degree increments
    
    if (axis === 'x') {
        // Rot X
        // y' = y*0 - z*dir
        // z' = y*dir + z*0
        vec.y = -z * dir;
        vec.z = y * dir;
    } else if (axis === 'y') {
        // Rot Y
        // x' = x*0 + z*dir
        // z' = -x*dir + z*0
        vec.x = z * dir;
        vec.z = -x * dir;
    } else if (axis === 'z') {
        // Rot Z
        // x' = x*0 - y*dir
        // y' = x*dir + y*0
        vec.x = -y * dir;
        vec.y = x * dir;
    }
    vec.round();
}

/**
 * Robust Axis Detection Logic
 */
export const getRotationData = (
  normal: THREE.Vector3, 
  delta: THREE.Vector2, 
  point: THREE.Vector3, 
  camera: THREE.Camera, 
  size: { width: number, height: number }
) => {
  
  const absX = Math.abs(normal.x);
  const absY = Math.abs(normal.y);
  
  let moveAxisA: THREE.Vector3, moveAxisB: THREE.Vector3;

  if (absX > 0.5) {
      moveAxisA = new THREE.Vector3(0, 1, 0); 
      moveAxisB = new THREE.Vector3(0, 0, 1);
  } else if (absY > 0.5) {
      moveAxisA = new THREE.Vector3(1, 0, 0); 
      moveAxisB = new THREE.Vector3(0, 0, 1);
  } else {
      moveAxisA = new THREE.Vector3(1, 0, 0); 
      moveAxisB = new THREE.Vector3(0, 1, 0);
  }

  const getScreenVector = (axis: THREE.Vector3) => {
      const pStart = point.clone();
      const pEnd = point.clone().add(axis.clone().multiplyScalar(0.5));
      pStart.project(camera);
      pEnd.project(camera);
      const dx = (pEnd.x - pStart.x) * (size.width / 2);
      const dy = -(pEnd.y - pStart.y) * (size.height / 2);
      return new THREE.Vector2(dx, dy).normalize();
  }

  const screenDirA = getScreenVector(moveAxisA);
  const screenDirB = getScreenVector(moveAxisB);
  
  const userDragDir = delta.clone().normalize();
  const alignmentA = Math.abs(userDragDir.dot(screenDirA));
  const alignmentB = Math.abs(userDragDir.dot(screenDirB));
  
  const bestMoveAxis = (alignmentA > alignmentB) ? moveAxisA : moveAxisB;
  const bestScreenDir = (alignmentA > alignmentB) ? screenDirA : screenDirB;
  
  const rotAxis = new THREE.Vector3().crossVectors(normal, bestMoveAxis).normalize();
  const moveSign = Math.sign(userDragDir.dot(bestScreenDir));
  
  let axisName = 'x';
  if (Math.abs(rotAxis.y) > 0.9) axisName = 'y';
  if (Math.abs(rotAxis.z) > 0.9) axisName = 'z';
  
  const basisVector = new THREE.Vector3();
  // @ts-ignore
  basisVector[axisName] = 1;
  const axisBasisSign = Math.sign(rotAxis.dot(basisVector));
  
  const finalDirection = moveSign * axisBasisSign;

  return { 
      axis: { 
          x: axisName === 'x' ? 1 : 0, 
          y: axisName === 'y' ? 1 : 0, 
          z: axisName === 'z' ? 1 : 0 
      }, 
      direction: finalDirection 
  };
};