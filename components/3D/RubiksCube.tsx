import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import CubePiece from './CubePiece';
import { getFaceColors, getRotationData, INITIAL_POSITIONS } from '../../utils/cubeMath';
import { audio } from '../../utils/audio';

/**
 * RUBIKS CUBE - CORE GAME LOGIC COMPONENT
 * 
 * This is the main component that manages the 3D Rubik's Cube, handling:
 * - Piece positioning and tracking
 * - Rotation animations
 * - User input (mouse drag and keyboard)
 * - Solved state detection
 * - Move history for undo/redo
 * - Auto-solve animations in HERO mode
 * 
 * ARCHITECTURE:
 * 
 * 1. Piece Management:
 *    - 27 cube pieces stored in piecesRef
 *    - Each piece tracks its initial position, current position, and 3D object reference
 *    - Colors are assigned based on which faces are visible
 * 
 * 2. Rotation System:
 *    - Uses a "pivot" object to rotate entire slices together
 *    - Pieces are temporarily attached to the pivot during rotation
 *    - After rotation completes, pieces are detached and positions/rotations are updated
 * 
 * 3. Animation Loop:
 *    - useFrame hook runs every frame (60fps)
 *    - Incrementally rotates the pivot until target rotation is reached
 *    - Updates logical positions using rotateVector after physical rotation completes
 */

/**
 * MOVES: Standard Rubik's Cube notation mapped to axis/slice/direction
 * 
 * This array defines the 6 basic moves for scrambling:
 * - R (Right): Rotate right face clockwise
 * - L (Left): Rotate left face counter-clockwise
 * - U (Up): Rotate top face clockwise
 * - D (Down): Rotate bottom face counter-clockwise
 * - F (Front): Rotate front face clockwise
 * - B (Back): Rotate back face counter-clockwise
 */
const MOVES = [
  { axis: 'x', slice: 1, dir: 1 },  // R
  { axis: 'x', slice: -1, dir: -1 }, // L
  { axis: 'y', slice: 1, dir: 1 },  // U
  { axis: 'y', slice: -1, dir: -1 }, // D
  { axis: 'z', slice: 1, dir: 1 },  // F
  { axis: 'z', slice: -1, dir: -1 }, // B
];

/**
 * AnimationState: Tracks the current rotation animation
 * 
 * Only one animation can be active at a time to prevent conflicts.
 * The animation runs in the useFrame loop until currentRotation reaches targetRotation.
 */
interface AnimationState {
    axis: string;              // Which axis to rotate around ('x', 'y', or 'z')
    direction: number;         // Rotation direction (1 or -1)
    targetRotation: number;    // Final rotation angle in radians (typically ±π/2 for 90°)
    currentRotation: number;   // Current rotation progress in radians
    speed: number;             // Rotation speed in radians per second
    activePieces: any[];       // Array of pieces being rotated
    resolve: () => void;       // Promise resolver to signal animation completion
}

export const RubiksCube = () => {
  // ===== REFS AND STATE =====
  
  /** Reference to the main group containing all cube pieces */
  const groupRef = useRef<THREE.Group>(null);
  
  /** Current animation state (null when no animation is running) */
  const animationRef = useRef<AnimationState | null>(null);
  
  // ===== ZUSTAND STORE SUBSCRIPTIONS =====
  
  // Move history management
  const moveHistory = useStore(state => state.moveHistory);
  const pushMove = useStore(state => state.pushMove);
  const popMove = useStore(state => state.popMove);

  // Game state
  const mode = useStore(state => state.mode);
  const isSolved = useStore(state => state.isSolved);
  const setOrbitEnabled = useStore(state => state.setOrbitEnabled);
  const startGame = useStore(state => state.startGame);
  const stopGame = useStore(state => state.stopGame);
  const resetGame = useStore(state => state.resetGame);
  const setCurrentHint = useStore(state => state.setCurrentHint);
  
  // Three.js context (camera, controls, screen size)
  const { controls, camera, size } = useThree();

  /**
   * piecesRef: The 27 cube pieces with their state
   * 
   * Each piece stores:
   * - id: Unique identifier (0-26)
   * - initialPos: Original position in solved state (never changes)
   * - currentPos: Logical position after rotations (updated after each move)
   * - object: Reference to the Three.js Group object (set by CubePiece component)
   * - colors: Face colors based on initial position
   * 
   * The separation of initialPos and currentPos allows us to:
   * 1. Always know where a piece should be in solved state
   * 2. Track where it currently is after scrambling
   * 3. Detect when the cube is solved (currentPos === initialPos for all pieces)
   */
  const piecesRef = useRef(INITIAL_POSITIONS.map((pos, i) => ({
    id: i,
    initialPos: pos.clone(),
    currentPos: pos.clone(),
    object: null as THREE.Group | null, 
    colors: getFaceColors(pos.x, pos.y, pos.z)
  })));

  /**
   * pivot: Temporary parent for rotating pieces
   * 
   * During a rotation:
   * 1. All pieces in the rotating slice are attached to the pivot
   * 2. The pivot rotates (carrying all attached pieces)
   * 3. After rotation, pieces are detached back to the main group
   * 4. Pieces' world positions/rotations are preserved automatically by Three.js
   * 
   * This technique allows smooth slice rotations without complex matrix math.
   */
  const pivot = useRef(new THREE.Object3D());

  // Add pivot to scene and reset game on mount
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.add(pivot.current);
    }
    resetGame();
  }, []);

  /**
   * checkIsSolved: Determines if the cube is in a solved state
   * 
   * WHY NOT USE moveHistory.length === 0?
   * The move history can temporarily be empty during transitions or due to
   * smart move cancellation (when opposite moves cancel out). This would cause
   * false positives for solved detection.
   * 
   * STRICT PHYSICAL VERIFICATION:
   * Instead, we verify two physical properties for each piece:
   * 
   * 1. POSITION CHECK:
   *    Each piece must be at its initial position (where it was when solved).
   *    We allow 0.1 units of tolerance for floating-point imprecision.
   * 
   * 2. ROTATION CHECK:
   *    Each piece must have identity rotation (no twist).
   *    We check quaternion.w which should be ±1 for unrotated pieces.
   *    - w ≈ 1 means no rotation
   *    - w ≈ 0.707 means 90° rotation
   *    - w ≈ 0 means 180° rotation
   *    We require |w| > 0.95 to account for animation precision.
   * 
   * 3. COMPLETENESS CHECK:
   *    All 27 pieces must be present and checked.
   * 
   * This approach is bulletproof - the cube is solved if and only if all pieces
   * are physically in their correct positions with correct orientations.
   */
  const checkIsSolved = useCallback(() => {
      let allCorrect = true;
      let checkedCount = 0;

      for (const p of piecesRef.current) {
          if (!p.object) {
              // Piece not yet rendered or missing from scene
              return false;
          }
          
          // Position check: piece at its initial coordinate?
          if (p.object.position.distanceTo(p.initialPos) > 0.1) {
              allCorrect = false;
              break;
          }

          // Rotation check: piece has identity rotation?
          // Quaternion w component indicates rotation amount
          const q = p.object.quaternion;
          if (Math.abs(q.w) < 0.95) {
              allCorrect = false;
              break;
          }
          checkedCount++;
      }
      
      // Safety check: ensure we examined all 27 pieces
      if (checkedCount !== 27) return false;

      return allCorrect;
  }, []); // No dependencies - uses only refs
  
  /**
   * HINT GENERATION SYSTEM
   * 
   * Provides intelligent move suggestions by analyzing the move history.
   * The hint tells the user which move would undo their last action.
   * 
   * LOGIC:
   * - If moveHistory is empty → cube is solved → hint is "SOLVED"
   * - Otherwise, suggest the inverse of the last move
   * 
   * The inverse of a move is the same slice rotated in the opposite direction.
   * For example:
   * - Last move: Rotate RIGHT face clockwise → Hint: "RIGHT COUNTER-CLOCKWISE"
   * - Last move: Rotate TOP face CCW → Hint: "TOP CLOCKWISE"
   * 
   * This provides a simple "undo hint" feature without requiring a full
   * solving algorithm (which would be much more complex).
   */
  useEffect(() => {
      if (moveHistory.length === 0) {
          setCurrentHint("SOLVED");
          return;
      }
      
      const lastMove = moveHistory[moveHistory.length - 1];
      
      // Determine face name from axis and slice
      let faceName = "";
      if (lastMove.axis === 'x') faceName = lastMove.slice === 1 ? "RIGHT" : (lastMove.slice === -1 ? "LEFT" : "MIDDLE");
      if (lastMove.axis === 'y') faceName = lastMove.slice === 1 ? "TOP" : (lastMove.slice === -1 ? "BOTTOM" : "MIDDLE");
      if (lastMove.axis === 'z') faceName = lastMove.slice === 1 ? "FRONT" : (lastMove.slice === -1 ? "BACK" : "MIDDLE");
      
      // Inverse direction (1 becomes -1, -1 becomes 1)
      const directionStr = lastMove.dir === 1 ? "COUNTER-CLOCKWISE" : "CLOCKWISE";
      
      setCurrentHint(`${faceName} ${directionStr}`);
  }, [moveHistory, setCurrentHint]);


  /**
   * rotateSlice: Core rotation function - animates a 90° rotation of a cube slice
   * 
   * This is the heart of the Rubik's Cube mechanics. It handles:
   * 1. Animation setup and queueing
   * 2. Piece selection (which pieces are in this slice?)
   * 3. Pivot attachment (group pieces together for rotation)
   * 4. Move history management (smart cancellation)
   * 5. Timer triggering (start on first move)
   * 6. Audio feedback
   * 
   * PARAMETERS:
   * @param axis - Rotation axis: 'x' (left-right), 'y' (up-down), or 'z' (front-back)
   * @param sliceVal - Which slice: -1 (left/bottom/back), 0 (middle), 1 (right/top/front)
   * @param direction - Rotation direction: 1 (clockwise), -1 (counter-clockwise)
   * @param durationMs - Animation duration in milliseconds (default: 300ms)
   * @param recordMove - Whether to add this move to history (false for auto-solve moves)
   * 
   * SMART MOVE CANCELLATION:
   * If the new move is the exact opposite of the last move, we cancel them both:
   * - Last move: R (right clockwise)
   * - New move: R' (right counter-clockwise)
   * - Result: Remove R from history, don't add R' (they cancel out)
   * 
   * This keeps move history clean and makes undo/redo more intuitive.
   * 
   * RETURNS: Promise that resolves when animation completes
   */
  const rotateSlice = useCallback((axis: string, sliceVal: number, direction: number, durationMs: number = 300, recordMove: boolean = true) => {
    // Guard: Don't start new animation if one is already running
    if (animationRef.current) return Promise.resolve(); 

    // Audio feedback: mechanical servo sound
    if (mode === 'GAME') audio.moveStart();

    // Timer: Start timing on first manual move in GAME mode
    if (recordMove && mode === 'GAME') {
        startGame();
    }

    // Move history: Smart cancellation logic
    if (recordMove) {
        const lastMove = moveHistory[moveHistory.length - 1];
        
        // Check if new move cancels the last move
        if (lastMove && lastMove.axis === axis && lastMove.slice === sliceVal && lastMove.dir === -direction) {
             // Opposite move detected - remove last move instead of adding new one
             popMove();
        } else {
             // Normal move - add to history
             pushMove({ axis, slice: sliceVal, dir: direction });
        }
    }

    // Select pieces to rotate: all pieces where currentPos[axis] ≈ sliceVal
    // Example: For right face (axis='x', sliceVal=1), select pieces where x ≈ 1
    const activePieces = piecesRef.current.filter(p => {
      return Math.abs(p.currentPos[axis as 'x'|'y'|'z'] - sliceVal) < 0.1;
    });

    if (activePieces.length === 0) {
        // No pieces to rotate (shouldn't happen in normal usage)
        return Promise.resolve();
    }

    // Reset pivot to origin with no rotation
    pivot.current.rotation.set(0, 0, 0);
    pivot.current.position.set(0, 0, 0);
    
    // Attach all pieces in this slice to the pivot
    // The .attach() method preserves world position/rotation while changing parent
    activePieces.forEach(p => {
      if (p.object) {
        pivot.current.attach(p.object);
      }
    });

    // Return a promise that resolves when animation completes
    return new Promise<void>((resolve) => {
        // Calculate rotation speed to achieve target rotation in given duration
        const totalRotation = (Math.PI / 2) * direction;  // 90° in radians, signed
        const speed = totalRotation / (durationMs / 1000); // radians per second

        // Set up animation state (will be processed in useFrame loop)
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