import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import CubePiece from './CubePiece';
import { INITIAL_POSITIONS, getFaceColors, rotateVector } from '../../utils/cubeMath';

export const MiniCube = () => {
    const moveHistory = useStore(state => state.moveHistory);
    const groupRef = useRef<THREE.Group>(null);
    const pivotRef = useRef<THREE.Group>(null);

    // Calculate the current state of the pieces based on history
    const pieces = useMemo(() => {
        // Clone initial positions
        const currentPieces = INITIAL_POSITIONS.map((pos, i) => ({
            id: i,
            pos: pos.clone(),
            colors: getFaceColors(pos.x, pos.y, pos.z),
            rotation: new THREE.Quaternion()
        }));

        // Apply all history moves to get current static state
        moveHistory.forEach(move => {
            const axisVec = new THREE.Vector3(
                move.axis === 'x' ? 1 : 0,
                move.axis === 'y' ? 1 : 0,
                move.axis === 'z' ? 1 : 0
            );
            
            // Apply to pieces
            currentPieces.forEach(p => {
                if (Math.abs(p.pos[move.axis as 'x' | 'y' | 'z'] - move.slice) < 0.1) {
                    // Update Position
                    rotateVector(p.pos, move.axis, move.dir);
                    
                    // Update Rotation
                    const q = new THREE.Quaternion();
                    q.setFromAxisAngle(axisVec, (Math.PI / 2) * move.dir);
                    p.rotation.premultiply(q);
                }
            });
        });

        return currentPieces;
    }, [moveHistory]);

    // Determine the "Next Move" (Inverse of last move in history)
    const nextMove = useMemo(() => {
        if (moveHistory.length === 0) return null;
        const last = moveHistory[moveHistory.length - 1];
        return { ...last, dir: -last.dir }; // Inverse direction
    }, [moveHistory]);

    useFrame((state) => {
        if (!pivotRef.current || !nextMove || !groupRef.current) {
            if(pivotRef.current) pivotRef.current.rotation.set(0,0,0);
            return;
        }

        const time = state.clock.elapsedTime;
        // Animation loop: 0 -> 90 deg -> Pause -> Reset
        const cycle = time % 2; 
        let angle = 0;
        
        if (cycle < 1) {
            // Animate
            const t = -Math.cos(cycle * Math.PI) * 0.5 + 0.5; // Ease in-out
            angle = t * (Math.PI / 2) * nextMove.dir;
        } else {
            // Hold at end position briefly before snapping back? 
            // Or just loop smoothly. Let's loop smoothly with a pause at solved state.
             angle = (Math.PI / 2) * nextMove.dir;
             if (cycle > 1.5) angle = 0; // Snap back for next loop
        }

        // Apply rotation to pivot
        pivotRef.current.rotation.set(0,0,0);
        // @ts-ignore
        pivotRef.current.rotation[nextMove.axis] = angle;
    });

    return (
        <group ref={groupRef} scale={1}>
             {/* Pivot Group for animating pieces */}
             <group ref={pivotRef}>
                {pieces.map(p => {
                    // Check if piece belongs to next move slice
                    const isActive = nextMove && Math.abs(p.pos[nextMove.axis as 'x'|'y'|'z'] - nextMove.slice) < 0.1;
                    if (!isActive) return null;
                    
                    return (
                        <group key={p.id} position={p.pos} quaternion={p.rotation}>
                            <CubePiece id={p.id} initialColors={p.colors} />
                        </group>
                    )
                })}
             </group>

             {/* Static Group for non-animating pieces */}
             <group>
                {pieces.map(p => {
                     const isActive = nextMove && Math.abs(p.pos[nextMove.axis as 'x'|'y'|'z'] - nextMove.slice) < 0.1;
                     if (isActive) return null;

                     return (
                        <group key={p.id} position={p.pos} quaternion={p.rotation}>
                            <CubePiece id={p.id} initialColors={p.colors} />
                        </group>
                     )
                })}
             </group>
        </group>
    );
};