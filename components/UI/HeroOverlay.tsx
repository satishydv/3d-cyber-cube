import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, ThemeType } from "../../store";
import { audio } from "../../utils/audio";

const THEMES: { id: ThemeType; label: string }[] = [
  { id: "TECH", label: "01" },
  { id: "DEV", label: "02" },
  { id: "NEON", label: "03" },
  { id: "ANIME", label: "04" },
  { id: "SKETCH", label: "05" },
];

const THEME_NAMES: Record<ThemeType, string> = {
  TECH: "STANDARD_PLASTIC",
  DEV: "DEV_STACK_ICONS",
  NEON: "HOLO_GRID",
  ANIME: "DOMAIN_EXPANSION",
  SKETCH: "SKETCH_BOOK",
};

export const HeroOverlay = () => {
  const { mode, setMode, theme, setTheme } = useStore();

  const handleStart = () => {
    audio.click();
    // Initialize audio engine on first interaction if blocked by browser
    audio.resume();
    setMode("GAME");
  };

  const handleThemeChange = (id: ThemeType) => {
    audio.click();
    setTheme(id);
  };

  return (
    <AnimatePresence>
      {mode === "HERO" && (
        <motion.div
          className="absolute inset-0 z-10 flex flex-col justify-between p-6 md:p-12 lg:p-16 pointer-events-none select-none overflow-y-auto overflow-x-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
        >
          {/* --- DECORATIVE HUD CORNERS --- */}
          {/* Fixed position to stay on screen even during scroll inside this div */}
          <div className="fixed top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/20 pointer-events-none"></div>
          <div className="fixed top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/20 pointer-events-none"></div>
          <div className="fixed bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/20 pointer-events-none"></div>
          <div className="fixed bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/20 pointer-events-none"></div>

          {/* --- TOP HEADER --- */}
          <div className="flex justify-between items-start w-full relative md:pt-0 pt-10 z-20 shrink-0">
            <div className="font-mono-tech text-orange-500 text-[10px] md:text-xs tracking-[0.25em] flex flex-col gap-1 pl-2">
              <span>// SYSTEM_READY</span>
              <span className="text-white/50">BUILD_V.2.5.0</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="h-[1px] w-24 bg-white/20"></div>
              <div className="font-mono-tech text-[10px] text-white/50">
                SECURE_CONNECTION
              </div>
            </div>
          </div>

          {/* --- MAIN CONTENT --- */}
          {/* Mobile: Top Aligned. Desktop: Vertically Centered. Added Padding Left. */}
          <div className="flex-1 flex flex-col justify-start pt-16 md:justify-center w-full lg:w-[55%] pointer-events-auto relative z-10 pl-2 md:pl-10">
            {/* Title Group */}
            <div className="relative mb-8 md:mb-12">
              <h1 className="font-tech font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.85] text-white mix-blend-overlay opacity-90 tracking-tighter">
                CYBER
              </h1>
              <h1 className="font-tech font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.85] text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 tracking-tighter">
                CUBE
              </h1>

              {/* Decorative line next to text */}
              <div className="absolute -left-6 md:-left-10 top-2 bottom-2 w-[2px] bg-gradient-to-b from-transparent via-orange-500 to-transparent opacity-50"></div>
            </div>

            {/* Description */}
            <p className="font-mono-tech text-stone-400 text-xs sm:text-sm md:text-base leading-relaxed max-w-md mb-8 md:mb-10 pl-2 border-l border-white/10">
              Advanced spatial logic engine running on WebGL. Initiate the
              system to begin the simulation sequence.
            </p>

            {/* Actions Group - Constrained Width to match text */}
            <div className="flex flex-col gap-6 md:gap-8 max-w-md pb-12">
              {/* START BUTTON */}
              <button
                onClick={handleStart}
                onMouseEnter={() => audio.hover()}
                className="group relative overflow-hidden bg-white/5 hover:bg-orange-500 text-white w-full h-16 md:h-20 flex items-center justify-between px-6 md:px-8 transition-all duration-300 border-l-4 border-orange-500"
              >
                <div className="flex flex-col items-start z-10">
                  <span className="font-mono-tech text-[10px] text-white/60 group-hover:text-black/60 tracking-widest transition-colors">
                    COMMAND
                  </span>
                  <span className="font-tech font-bold text-2xl tracking-wider group-hover:text-black transition-colors">
                    INITIALIZE
                  </span>
                </div>

                {/* Arrow Icon */}
                <div className="w-8 h-8 rounded-full border border-white/20 group-hover:border-black/20 flex items-center justify-center z-10 transition-colors">
                  <svg
                    className="w-3 h-3 group-hover:text-black fill-current transition-colors"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                </div>

                {/* Hover Background Fill Effect */}
                <div className="absolute inset-0 bg-orange-500 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
              </button>

              {/* THEME SELECTOR */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="font-mono-tech text-[10px] tracking-widest text-white/40">
                    VISUAL_MODE
                  </span>
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                  <span className="font-mono-tech text-[10px] text-orange-400">
                    {THEME_NAMES[theme]}
                  </span>
                </div>

                {/* Horizontal scroll on very small screens for themes */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full pr-4 sm:pr-0">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      onMouseEnter={() => audio.hover()}
                      className={`
                                    flex-shrink-0 h-10 px-4 md:px-6 rounded-sm font-mono-tech text-xs font-bold transition-all border border-transparent whitespace-nowrap
                                    ${
                                      theme === t.id
                                        ? "bg-stone-800 text-orange-500 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                                        : "bg-white/5 text-stone-500 hover:bg-white/10 hover:text-stone-300"
                                    }
                                `}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* --- BOTTOM FOOTER --- */}
          <div className="flex justify-between items-end w-full pt-6 md:pb-0 pb-10 relative z-10 shrink-0">
            <div className="font-mono-tech text-[10px] text-stone-600 max-w-[150px] sm:max-w-[200px] leading-tight pl-2">
              WARNING: SPATIAL ORIENTATION REQUIRED.
            </div>
          </div>

          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
            .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
