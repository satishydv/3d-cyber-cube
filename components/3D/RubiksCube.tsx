import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import CubePiece from './CubePiece';
import { getFaceColors, getRotationData, INITIAL_POSITIONS } from '../../utils/cubeMath';
import { audio } from '../../utils/audio';

const MOVES = [
  { axis: 'x', slice: 1, dir: 1 },  // R
  { axis: 'x', slice: -1, dir: -1 }, // L
  { axis: 'y', slice: 1, dir: 1 },  // U
  { axis: 'y', slice: -1, dir: -1 }, // D
  { axis: 'z', slice: 1, dir: 1 },  // F
  { axis: 'z', slice: -1, dir: -1 }, // B
];

interface AnimationState {
    axis: string;
    direction: number;
    targetRotation: number;
    currentRotation: number;
    speed: number; // radians per second
    activePieces: any[];
    resolve: () => void;
}

export const RubiksCube = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  const animationRef = useRef<AnimationState | null>(null);
  
  // Use Global History
  const moveHistory = useStore(state => state.moveHistory);
  const pushMove = useStore(state => state.pushMove);
  const popMove = useStore(state => state.popMove);

  const mode = useStore(state => state.mode);
  const isSolved = useStore(state => state.isSolved);
  const setOrbitEnabled = useStore(state => state.setOrbitEnabled);
  const startGame = useStore(state => state.startGame);
  const stopGame = useStore(state => state.stopGame);
  const resetGame = useStore(state => state.resetGame);
  const setCurrentHint = useStore(state => state.setCurrentHint);
  
  const { controls, camera, size } = useThree();

  const piecesRef = useRef(INITIAL_POSITIONS.map((pos, i) => ({
    id: i,
    initialPos: pos.clone(),
    currentPos: pos.clone(),
    object: null as THREE.Group | null, 
    colors: getFaceColors(pos.x, pos.y, pos.z)
  })));

  const pivot = useRef(new THREE.Object3D());

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.add(pivot.current);
    }
    resetGame();
  }, []);

  // --- SOLVED CHECK LOGIC ---
  const checkIsSolved = useCallback(() => {
      // STRICT PHYSICAL CHECK ONLY
      // Do not rely on moveHistory.length === 0, as stack logic might desync from physical reality
      // or transient empty states could trigger false wins.

      let allCorrect = true;
      let checkedCount = 0;

      for (const p of piecesRef.current) {
          if (!p.object) {
              // If a piece is missing from the scene, we cannot confirm solved.
              return false;
          }
          
          // 1. Position Check
          // Ensure piece is physically at its initial coordinate
          if (p.object.position.distanceTo(p.initialPos) > 0.1) {
              allCorrect = false;
              break;
          }

          // 2. Rotation Check
          // Quaternion w should be close to 1 or -1 (Identity / 360 deg)
          // Any other value implies rotation (e.g. 90 deg is ~0.707)
          const q = p.object.quaternion;
          if (Math.abs(q.w) < 0.95) {
              allCorrect = false;
              break;
          }
          checkedCount++;
      }
      
      // Double safety: ensure we checked all pieces
      if (checkedCount !== 27) return false;

      return allCorrect;
  }, []); // No dependencies needed
  
  // --- HINT GENERATION ---
  useEffect(() => {
      if (moveHistory.length === 0) {
          setCurrentHint("SOLVED");
          return;
      }
      
      const lastMove = moveHistory[moveHistory.length - 1];
      
      let faceName = "";
      if (lastMove.axis === 'x') faceName = lastMove.slice === 1 ? "RIGHT" : (lastMove.slice === -1 ? "LEFT" : "MIDDLE");
      if (lastMove.axis === 'y') faceName = lastMove.slice === 1 ? "TOP" : (lastMove.slice === -1 ? "BOTTOM" : "MIDDLE");
      if (lastMove.axis === 'z') faceName = lastMove.slice === 1 ? "FRONT" : (lastMove.slice === -1 ? "BACK" : "MIDDLE");
      
      const directionStr = lastMove.dir === 1 ? "COUNTER-CLOCKWISE" : "CLOCKWISE";
      
      setCurrentHint(`${faceName} ${directionStr}`);
  }, [moveHistory, setCurrentHint]);


  // --- ROTATION LOGIC ---
  const rotateSlice = useCallback((axis: string, sliceVal: number, direction: number, durationMs: number = 300, recordMove: boolean = true) => {
    if (animationRef.current) return Promise.resolve(); 

    // Sound: Servo Start
    if (mode === 'GAME') audio.moveStart();

    // TIMER LOGIC: Start timer on first MANUAL move
    if (recordMove && mode === 'GAME') {
        startGame();
    }

    // HISTORY LOGIC: Smart Stack
    if (recordMove) {
        const lastMove = moveHistory[moveHistory.length - 1];
        if (lastMove && lastMove.axis === axis && lastMove.slice === sliceVal && lastMove.dir === -direction) {
             popMove();
        } else {
             pushMove({ axis, slice: sliceVal, dir: direction });
        }
    }

    const activePieces = piecesRef.current.filter(p => {
      return Math.abs(p.currentPos[axis as 'x'|'y'|'z'] - sliceVal) < 0.1;
    });

    if (activePieces.length === 0) {
        return Promise.resolve();
    }

    pivot.current.rotation.set(0, 0, 0);
    pivot.current.position.set(0, 0, 0);
    
    activePieces.forEach(p => {
      if (p.object) {
        pivot.current.attach(p.object);
      }
    });

    return new Promise<void>((resolve) => {
        const totalRotation = (Math.PI / 2) * direction;
        const speed = totalRotation / (durationMs / 1000);

        animationRef.current = {
            axis,
            direction,
            targetRotation: totalRotation,
            currentRotation: 0,
            speed,
            activePieces,
            resolve
        };
    });
  }, [mode, startGame, moveHistory, pushMove, popMove]);

  // --- KEYBOARD CONTROLS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (mode !== 'GAME' || animationRef.current) return;
        
        const key = e.key.toUpperCase();
        const dir = e.shiftKey ? -1 : 1;
        
        let moved = false;
        switch(key) {
            case 'R': rotateSlice('x', 1, -1 * dir); moved = true; break;
            case 'L': rotateSlice('x', -1, 1 * dir); moved = true; break;
            case 'U': rotateSlice('y', 1, -1 * dir); moved = true; break;
            case 'D': rotateSlice('y', -1, 1 * dir); moved = true; break;
            case 'F': rotateSlice('z', 1, -1 * dir); moved = true; break;
            case 'B': rotateSlice('z', -1, 1 * dir); moved = true; break;
            case 'ARROWLEFT': rotateSlice('y', 0, 1); rotateSlice('y', 1, 1); rotateSlice('y', -1, 1); moved = true; break;
            case 'ARROWRIGHT': rotateSlice('y', 0, -1); rotateSlice('y', 1, -1); rotateSlice('y', -1, -1); moved = true; break;
        }
        
        if (moved) {
            audio.click();
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, rotateSlice]);


  // --- AUTO LOOP & ANIMATION LOOP ---
  const lastAutoMoveTime = useRef(0);
  const isResetting = useRef(false);

  // Initial scramble on load
  useEffect(() => {
      const initScramble = async () => {
          if (moveHistory.length === 0 && mode === 'HERO') {
              const moves = [];
              for(let i=0; i<12; i++) moves.push(MOVES[Math.floor(Math.random() * MOVES.length)]);
              for (const m of moves) {
                  await rotateSlice(m.axis, m.slice, m.dir, 50, true);
              }
          }
      };
      initScramble();
  }, []);

  useFrame((state, delta) => {
    // 1. HANDLE ROTATION ANIMATION
    if (animationRef.current) {
        const anim = animationRef.current;
        const dt = Math.min(delta, 0.05);

        const step = anim.speed * dt;
        
        let newRotation = anim.currentRotation + step;
        let finished = false;

        if (anim.direction > 0) {
            if (newRotation >= anim.targetRotation) {
                newRotation = anim.targetRotation;
                finished = true;
            }
        } else {
             if (newRotation <= anim.targetRotation) {
                newRotation = anim.targetRotation;
                finished = true;
            }
        }
        
        anim.currentRotation = newRotation;
        // @ts-ignore
        pivot.current.rotation[anim.axis] = newRotation;
        
        if (finished) {
            pivot.current.updateMatrixWorld();
            anim.activePieces.forEach(p => {
                if (p.object) {
                  groupRef.current?.attach(p.object);
                  p.currentPos.copy(p.object.position).round();
                }
            });
            
            // Sound: Snap End
            if (mode === 'GAME') audio.moveEnd();

            const resolve = anim.resolve;
            animationRef.current = null;
            resolve();
            
            // CHECK SOLVE STATE AFTER MOVE COMPLETE
            if (mode === 'GAME') {
                 const solved = checkIsSolved();
                 if (solved) {
                     stopGame();
                     audio.solve();
                     setCurrentHint("COMPLETED");
                 }
            }
        }
        return;
    }


    // 2. HERO MODE AUTO-PLAY LOGIC (Unscramble)
    if (mode !== 'HERO' || isResetting.current) return;
    
    const time = state.clock.elapsedTime * 1000;
    
    if (moveHistory.length > 0) {
        // Unwind the stack
        if (time - lastAutoMoveTime.current > 600) { 
            const lastMove = moveHistory[moveHistory.length - 1]; // Use last move from store
            if (lastMove) {
                // Perform inverse move, recordMove=true will pop it automatically
                rotateSlice(lastMove.axis, lastMove.slice, -lastMove.dir, 400, true);
                lastAutoMoveTime.current = time;
            }
        }
    } 
    else if (!isSolved && !isResetting.current) {
        // Solved in Hero Mode (Reset loop)
        isResetting.current = true;
        setTimeout(async () => {
            const movesCount = 10;
            for(let i=0; i<movesCount; i++) {
                if (mode !== 'HERO') break;
                const m = MOVES[Math.floor(Math.random() * MOVES.length)];
                await rotateSlice(m.axis, m.slice, m.dir, 150, true);
            }
            isResetting.current = false;
        }, 3000); 
    }
  });

  // --- MOUSE INTERACTION (MANUAL) ---
  const [dragStart, setDragStart] = useState<{
      pos: THREE.Vector2, 
      normal: THREE.Vector3, 
      object: THREE.Group, 
      point: THREE.Vector3 
  } | null>(null);

  const handlePointerDown = (e: any) => {
    if (mode !== 'GAME' || animationRef.current) return;
    e.stopPropagation();
    if (controls) {
        // @ts-ignore
        controls.enabled = false;
    }
    setOrbitEnabled(false); 

    const mesh = e.object;
    const pieceGroup = mesh.parent;
    const isPiece = piecesRef.current.some(p => p.object === pieceGroup);
    if (!pieceGroup || !isPiece) return;

    if (e.face) {
        const n = e.face.normal.clone().transformDirection(mesh.matrixWorld).round();
        setDragStart({
            pos: new THREE.Vector2(e.clientX, e.clientY),
            normal: n,
            object: pieceGroup as THREE.Group,
            point: e.point.clone()
        });
    }
  };

  const enableOrbit = () => {
      if (controls) {
          // @ts-ignore
          controls.enabled = true;
      }
      setOrbitEnabled(true);
  };

  const handlePointerUp = (e: any) => {
    if (dragStart) {
        setDragStart(null);
        enableOrbit();
    }
  };

  useEffect(() => {
    const handleGlobalUp = () => {
        if (dragStart) {
            setDragStart(null);
            enableOrbit();
        }
        if (!dragStart && mode === 'GAME' && controls) {
             // @ts-ignore
            if (!controls.enabled) controls.enabled = true;
        }
    };
    window.addEventListener('pointerup', handleGlobalUp);
    return () => window.removeEventListener('pointerup', handleGlobalUp);
  }, [dragStart, mode, controls]);

  const handlePointerMove = (e: any) => {
    if (!dragStart || mode !== 'GAME' || animationRef.current) return;
    e.stopPropagation();
    const currentPos = new THREE.Vector2(e.clientX, e.clientY);
    const delta = new THREE.Vector2().subVectors(currentPos, dragStart.pos);

    if (delta.length() > 10) { 
        const { axis, direction } = getRotationData(dragStart.normal, delta, dragStart.point, camera, size);
        
        const pos = dragStart.object.position;
        let sliceVal = 0;
        if (axis.x !== 0) sliceVal = Math.round(pos.x);
        if (axis.y !== 0) sliceVal = Math.round(pos.y);
        if (axis.z !== 0) sliceVal = Math.round(pos.z);

        rotateSlice(axis.x !== 0 ? 'x' : axis.y !== 0 ? 'y' : 'z', sliceVal, direction, 250, true);
        
        setDragStart(null);
        enableOrbit();
    }
  };

  return (
    <group ref={groupRef}>
      {piecesRef.current.map((p) => (
        <group 
            key={p.id} 
            ref={(el) => { 
                if(el) {
                    p.object = el;
                    el.position.copy(p.currentPos);
                    el.updateMatrix();
                }
            }}
            onPointerDown={handlePointerDown} 
            onPointerMove={handlePointerMove} 
            onPointerUp={handlePointerUp}
        >
            <CubePiece id={p.id} initialColors={p.colors} />
        </group>
      ))}
    </group>
  );
};