import { create } from 'zustand';

export type GameMode = 'HERO' | 'GAME';
export type ThemeType = 'TECH' | 'DEV' | 'NEON' | 'ANIME' | 'SKETCH';

export interface Move {
    axis: string;
    slice: number;
    dir: number;
}

interface AppState {
  mode: GameMode;
  theme: ThemeType;
  isSolved: boolean;
  orbitEnabled: boolean;
  
  // Timer State
  gameStartTime: number | null;
  gameEndTime: number | null;
  isTimerRunning: boolean;

  // Snapshot
  solvedSnapshot: string | null;

  // Solver State
  currentHint: string | null;
  moveHistory: Move[];

  // View Sync
  cameraQuaternion: number[] | null;

  setMode: (mode: GameMode) => void;
  setTheme: (theme: ThemeType) => void;
  setIsSolved: (solved: boolean) => void;
  setOrbitEnabled: (enabled: boolean) => void;
  setSolvedSnapshot: (url: string | null) => void;
  setCurrentHint: (hint: string | null) => void;
  setCameraQuaternion: (quat: number[]) => void;
  
  // History Actions
  pushMove: (move: Move) => void;
  popMove: () => void;
  resetMoves: () => void;

  startGame: () => void;
  stopGame: () => void;
  resetGame: () => void;
}

export const useStore = create<AppState>((set) => ({
  mode: 'HERO',
  theme: 'TECH',
  isSolved: false,
  orbitEnabled: true,
  
  gameStartTime: null,
  gameEndTime: null,
  isTimerRunning: false,
  solvedSnapshot: null,
  currentHint: null,
  moveHistory: [],
  cameraQuaternion: null,

  setMode: (mode) => set({ mode }),
  setTheme: (theme) => set({ theme }),
  setIsSolved: (isSolved) => set({ isSolved }),
  setOrbitEnabled: (orbitEnabled) => set({ orbitEnabled }),
  setSolvedSnapshot: (solvedSnapshot) => set({ solvedSnapshot }),
  setCurrentHint: (currentHint) => set({ currentHint }),
  setCameraQuaternion: (cameraQuaternion) => set({ cameraQuaternion }),
  
  pushMove: (move) => set((state) => ({ moveHistory: [...state.moveHistory, move] })),
  popMove: () => set((state) => {
      const newHistory = [...state.moveHistory];
      newHistory.pop();
      return { moveHistory: newHistory };
  }),
  resetMoves: () => set({ moveHistory: [] }),

  startGame: () => set((state) => {
    if (state.isTimerRunning) return {}; 
    return { isTimerRunning: true, gameStartTime: Date.now(), gameEndTime: null, isSolved: false, solvedSnapshot: null, currentHint: null };
  }),
  stopGame: () => set((state) => {
      if (!state.isTimerRunning) return {};
      return { isTimerRunning: false, gameEndTime: Date.now(), isSolved: true };
  }),
  resetGame: () => set({ 
      isTimerRunning: false, 
      gameStartTime: null, 
      gameEndTime: null, 
      isSolved: false, 
      solvedSnapshot: null, 
      currentHint: null,
      moveHistory: [],
      cameraQuaternion: null
  }),
}));