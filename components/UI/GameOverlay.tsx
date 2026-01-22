import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useThree } from '@react-three/fiber';
import { useStore } from '../../store';
import { audio } from '../../utils/audio';
import { MiniCube } from '../3D/MiniCube';
import { generateTicketImage } from '../../utils/ticketGen';
import * as THREE from 'three';

// Helper component for high-performance timer rendering
const GameTimer = () => {
    const startTime = useStore(state => state.gameStartTime);
    const endTime = useStore(state => state.gameEndTime);
    const isRunning = useStore(state => state.isTimerRunning);
    
    const [displayTime, setDisplayTime] = useState("00:00.00");
    const reqRef = useRef<number>(0);

    useEffect(() => {
        const update = () => {
            const now = endTime || Date.now();
            if (startTime) {
                const diff = now - startTime;
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                const ms = Math.floor((diff % 1000) / 10);
                setDisplayTime(
                    `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
                );
            } else {
                setDisplayTime("00:00.00");
            }
            if (isRunning) {
                reqRef.current = requestAnimationFrame(update);
            }
        };
        
        update();

        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
        }
    }, [isRunning, startTime, endTime]);

    return (
        <div className={`font-mono-tech text-4xl tracking-widest ${isRunning ? 'text-white' : 'text-orange-500'}`}>
            {displayTime}
        </div>
    )
}

// Sync Camera Component for MiniCube
const CameraSync = () => {
    const { camera } = useThree();
    const cameraQuaternion = useStore(state => state.cameraQuaternion);

    useEffect(() => {
        if (cameraQuaternion) {
            const q = new THREE.Quaternion().fromArray(cameraQuaternion);
            // 1. Set Rotation
            camera.quaternion.copy(q);
            
            // 2. Set Position relative to (0,0,0) to maintain distance
            // Default perspective camera looks down -Z, so we position it at +Z rotated.
            // Distance of 10 ensures the mini cube stays in frame.
            const distance = 10;
            camera.position.set(0, 0, 1).applyQuaternion(q).multiplyScalar(distance);
        }
    }, [cameraQuaternion, camera]);

    return null;
}

export const GameOverlay = () => {
  const { mode, setMode, resetGame, isSolved, gameStartTime, gameEndTime, solvedSnapshot, currentHint } = useStore();
  const [showInfo, setShowInfo] = useState(false);
  const [ticketId] = useState(() => Math.random().toString(36).substring(7).toUpperCase());

  const handleExit = () => {
      audio.click();
      resetGame();
      setMode('HERO');
  }
  
  const getFinalTime = () => {
      if (!gameStartTime || !gameEndTime) return "00:00.00";
      const diff = gameEndTime - gameStartTime;
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const ms = Math.floor((diff % 1000) / 10);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleDownload = async (e: React.MouseEvent) => {
      e.preventDefault();
      audio.click();
      if (!solvedSnapshot) return;
      
      const fullTicketDataUrl = await generateTicketImage(
          solvedSnapshot,
          getFinalTime(),
          ticketId,
          new Date().toLocaleDateString()
      );

      const link = document.createElement('a');
      link.href = fullTicketDataUrl;
      link.download = `CYBERCUBE_TICKET_${ticketId}.png`;
      link.click();
  };

  return (
    <AnimatePresence>
      {mode === 'GAME' && (
        <div className="absolute inset-0 pointer-events-none z-20">
          
          {/* Top Bar */}
          <motion.div 
            className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center border-b border-stone-800/50 bg-gradient-to-b from-stone-950/80 to-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
             <div className="font-mono-tech text-stone-500 text-xs">
                MODE: MANUAL_OVERRIDE <br />
                INPUT: ACTIVE
             </div>

             {/* Timer Display */}
             <div className="absolute left-1/2 -translate-x-1/2 top-4">
                 <GameTimer />
             </div>
             
             <button
                onClick={handleExit}
                onMouseEnter={() => audio.hover()}
                className="pointer-events-auto bg-stone-900/90 hover:bg-red-900/80 text-stone-300 hover:text-white border border-stone-700 hover:border-red-500 px-6 py-2 rounded font-tech font-bold transition-all flex items-center gap-2 group"
             >
                <span className="w-2 h-2 bg-red-500 rounded-full group-hover:animate-ping"></span>
                EXIT
             </button>
          </motion.div>

          {/* HINT MODULE (Bottom Left) - With MiniCube Visualization */}
          <motion.div 
            className="absolute bottom-8 left-8 pointer-events-auto"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
             <div className="bg-stone-950/90 backdrop-blur-md border border-stone-800 rounded-lg shadow-xl w-[220px] overflow-hidden">
                 <div className="p-3 border-b border-stone-800 flex justify-between items-center">
                     <span className="font-mono-tech text-[10px] text-orange-500 tracking-widest">PRECOGNITION_MODULE</span>
                     <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                 </div>
                 
                 {/* Mini Cube Canvas */}
                 <div className="h-[180px] w-full bg-gradient-to-b from-stone-900 to-stone-950 relative">
                     <Canvas camera={{ position: [6, 4.5, 9], fov: 40 }}>
                         <CameraSync />
                         <ambientLight intensity={1.5} />
                         <pointLight position={[10, 10, 10]} intensity={1} />
                         <MiniCube />
                     </Canvas>
                     
                     {/* Overlay Grid lines */}
                     <div className="absolute inset-0 pointer-events-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-10"></div>
                 </div>

                 <div className="p-3 border-t border-stone-800">
                     {currentHint ? (
                         <>
                            <div className="text-[10px] text-stone-500 mb-1">SUGGESTED MOVE:</div>
                            <div className="font-tech text-base font-bold text-white leading-tight">
                                {currentHint}
                            </div>
                         </>
                     ) : (
                         <div className="font-mono-tech text-[10px] text-stone-600">
                             AWAITING_INPUT...
                         </div>
                     )}
                 </div>
             </div>
          </motion.div>

          {/* Info Icon & Controls Popup - Bottom Right */}
          <div className="absolute bottom-8 right-8 flex flex-col items-end gap-4 pointer-events-auto">
             <AnimatePresence>
                {showInfo && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        className="bg-stone-900/90 backdrop-blur-md p-6 rounded-lg border border-stone-700 shadow-2xl w-64 origin-bottom-right"
                    >
                        <p className="font-mono-tech text-xs text-stone-300 tracking-widest border-b border-stone-700 pb-2 mb-3">
                            CONTROL_SCHEME
                        </p>
                        <div className="flex flex-col gap-2 text-[10px] font-mono-tech text-stone-500">
                            <div className="flex justify-between">
                                <span>ORBIT CAMERA</span>
                                <span className="text-stone-300">DRAG BG</span>
                            </div>
                            <div className="flex justify-between">
                                <span>ROTATE SLICE</span>
                                <span className="text-stone-300">DRAG FACE</span>
                            </div>
                            <div className="flex justify-between mt-2 pt-2 border-t border-stone-800">
                                <span>KEYBOARD</span>
                                <span className="text-stone-300">[R L U D F B]</span>
                            </div>
                            <div className="flex justify-between">
                                <span>INVERSE</span>
                                <span className="text-stone-300">SHIFT + KEY</span>
                            </div>
                        </div>
                    </motion.div>
                )}
             </AnimatePresence>

             <motion.button
                onMouseEnter={() => { setShowInfo(true); audio.hover(); }}
                onMouseLeave={() => setShowInfo(false)}
                onClick={() => { setShowInfo(!showInfo); audio.click(); }}
                className="w-12 h-12 rounded-full bg-stone-800 hover:bg-orange-600 text-stone-400 hover:text-white border border-stone-600 hover:border-orange-400 flex items-center justify-center transition-all shadow-lg hover:shadow-orange-500/20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
             >
                <span className="font-mono-tech font-bold text-lg">i</span>
             </motion.button>
          </div>
          
          {/* SOLVED MODAL (TICKET) */}
          <AnimatePresence>
            {isSolved && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto"
                >
                    <motion.div 
                        initial={{ scale: 0.8, y: 50, rotateX: 20 }}
                        animate={{ scale: 1, y: 0, rotateX: 0 }}
                        transition={{ type: "spring", bounce: 0.4 }}
                        className="bg-neutral-900 border border-neutral-700 max-w-sm w-full overflow-hidden relative shadow-2xl rounded-sm"
                    >
                        {/* Improved Header - Holographic Ticket Style */}
                        <div className="bg-orange-600 h-24 relative overflow-hidden flex flex-col items-center justify-center p-4">
                            {/* Tech Background Pattern */}
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent scale-150"></div>
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/50"></div>
                            
                            <h2 className="font-tech font-black text-4xl text-black tracking-tighter relative z-10 mix-blend-multiply">CYBER CUBE</h2>
                            <div className="flex items-center gap-2 mt-1 relative z-10">
                                <span className="w-2 h-2 bg-black rounded-full"></span>
                                <span className="font-mono-tech text-xs font-bold text-black tracking-widest">MISSION_COMPLETE</span>
                                <span className="w-2 h-2 bg-black rounded-full"></span>
                            </div>

                            {/* Corner Cuts */}
                            <div className="absolute bottom-[-10px] left-[-10px] w-5 h-5 bg-neutral-900 rotate-45"></div>
                            <div className="absolute bottom-[-10px] right-[-10px] w-5 h-5 bg-neutral-900 rotate-45"></div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex flex-col items-center gap-6 relative bg-neutral-900">
                            {/* Decorative scanline */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>

                            {/* Photo */}
                            <div className="w-full aspect-square bg-black rounded border border-neutral-800 p-1 shadow-inner relative group">
                                <div className="w-full h-full relative overflow-hidden rounded-sm">
                                    {solvedSnapshot ? (
                                        <img src={solvedSnapshot} alt="Solved Cube" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-600 font-mono-tech text-xs animate-pulse">PROCESSING_IMAGE...</div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
                                    <div className="absolute bottom-2 left-3 font-mono-tech text-[10px] text-orange-400/80">CAPTURE_REC_001</div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="w-full grid grid-cols-2 gap-4">
                                <div className="bg-neutral-800/50 p-2 rounded border border-neutral-800">
                                    <div className="font-mono-tech text-[10px] text-neutral-500 mb-1">CLEAR_TIME</div>
                                    <div className="font-tech text-xl font-bold text-white">{getFinalTime()}</div>
                                </div>
                                <div className="bg-neutral-800/50 p-2 rounded border border-neutral-800">
                                    <div className="font-mono-tech text-[10px] text-neutral-500 mb-1">DATE</div>
                                    <div className="font-tech text-lg font-bold text-stone-300">{new Date().toLocaleDateString()}</div>
                                </div>
                            </div>
                            
                            <div className="w-full flex justify-between items-center border-t border-neutral-800 pt-2">
                                <span className="font-mono-tech text-[10px] text-neutral-600">ID: {ticketId}</span>
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_,i) => <div key={i} className="w-1 h-3 bg-neutral-700"></div>)}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 w-full mt-2">
                                <button 
                                   onClick={handleDownload}
                                   className="flex-1 bg-white text-black font-mono-tech font-bold text-sm py-3 text-center hover:bg-orange-500 hover:text-white transition-colors uppercase tracking-wider clip-path-slant"
                                >
                                    DOWNLOAD TICKET
                                </button>
                                <button 
                                    onClick={handleExit}
                                    className="px-4 border border-neutral-700 text-neutral-400 font-mono-tech font-bold text-sm py-3 hover:border-red-500 hover:text-white transition-colors uppercase"
                                >
                                    CLOSE
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}
    </AnimatePresence>
  );
};