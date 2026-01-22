import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { HeroOverlay } from './components/UI/HeroOverlay';
import { GameOverlay } from './components/UI/GameOverlay';
import { SceneContainer } from './components/3D/SceneContainer';
import { Loader } from '@react-three/drei';

// Loading Screen
const CustomLoader = () => (
    <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
        <div className="font-tech text-orange-500 animate-pulse text-xl tracking-[0.5em]">
            SYSTEM_BOOT...
        </div>
    </div>
);

function App() {
  return (
    <div className="relative w-full min-h-screen bg-stone-950 overflow-x-hidden selection:bg-orange-500 selection:text-white">
      {/* 3D Scene - Fixed Background */}
      <div className="fixed inset-0 z-0">
        <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMappingExposure: 1.0 }}>
            <Suspense fallback={null}>
                <SceneContainer />
            </Suspense>
        </Canvas>
        <Loader dataInterpolation={(p) => `LOADING ${p.toFixed(0)}%`} containerStyles={{background: 'black'}} innerStyles={{width: '200px'}} barStyles={{height: '4px', background: '#ea580c'}} dataStyles={{fontFamily: 'Share Tech Mono', color: '#ea580c'}} />
      </div>

      {/* UI Layers - Scrollable Container */}
      {/* Apply scanlines only to UI layer if needed, or keeping it clean for now to match high-fidelity requirement */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-start pointer-events-none">
         <HeroOverlay />
      </div>

      <GameOverlay />
    </div>
  );
}

export default App;