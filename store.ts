import { create } from 'zustand';

/**
 * GLOBAL STATE MANAGEMENT WITH ZUSTAND
 * 
 * This file defines the application's global state using Zustand, a lightweight
 * state management library. Unlike Redux, Zustand requires no boilerplate and
 * uses hooks for a more React-friendly API.
 * 
 * The state is organized into several logical sections:
 * 1. Game Mode & Display Settings
 * 2. Timer & Performance Tracking
 * 3. Cube Solving & History
 * 4. Camera & View Synchronization
 */

/**
 * GameMode: The two main application states
 * 
 * HERO - Demonstration/Attract Mode:
 * - Auto-solve animations play continuously
 * - Shows off visual themes and effects
 * - Timer is disabled
 * - User can explore themes and watch the cube solve itself
 * 
 * GAME - Interactive Play Mode:
 * - User can manipulate the cube
 * - Timer tracks solve time
 * - Hints and undo/redo are available
 * - Achievement certificates can be earned
 */
export type GameMode = 'HERO' | 'GAME';

/**
 * ThemeType: Visual appearance presets for the cube
 * 
 * Each theme provides a unique aesthetic:
 * - TECH: Standard plastic Rubik's Cube (classic WCA colors)
 * - DEV: Developer-themed with programming language/tool logos
 * - NEON: Holographic grid with futuristic glow effects
 * - ANIME: Domain Expansion inspired visual style
 * - SKETCH: Hand-drawn, sketchbook appearance
 */
export type ThemeType = 'TECH' | 'DEV' | 'NEON' | 'ANIME' | 'SKETCH';

/**
 * Move: Represents a single rotation of a cube slice
 * 
 * In Rubik's Cube notation, moves are defined by:
 * - axis: Which axis to rotate around ('x', 'y', or 'z')
 * - slice: Which layer to rotate (-1, 0, or 1)
 *   - -1: Left/Bottom/Back slice
 *   -  0: Middle slice
 *   -  1: Right/Top/Front slice
 * - dir: Direction of rotation
 *   -  1: Clockwise (90° CW)
 *   - -1: Counter-clockwise (90° CCW)
 * 
 * Example: { axis: 'y', slice: 1, dir: 1 } means "rotate top layer clockwise"
 * This corresponds to the standard notation "U" (Up face clockwise)
 */
export interface Move {
    axis: string;
    slice: number;
    dir: number;
}

/**
 * AppState: Complete application state interface
 * 
 * This interface defines all the state and actions available globally.
 * Components can subscribe to specific pieces of state using Zustand hooks.
 */
interface AppState {
  // ===== GAME MODE & DISPLAY =====
  
  /** Current application mode (HERO or GAME) */
  mode: GameMode;
  
  /** Current visual theme applied to the cube */
  theme: ThemeType;
  
  /** Whether the cube is in a solved state */
  isSolved: boolean;
  
  /** Whether camera orbit controls are enabled (disabled during rotations) */
  orbitEnabled: boolean;
  
  // ===== TIMER STATE =====
  
  /** Timestamp when the game started (first move made), null if not started */
  gameStartTime: number | null;
  
  /** Timestamp when the cube was solved, null if not completed */
  gameEndTime: number | null;
  
  /** Whether the timer is actively running */
  isTimerRunning: boolean;

  // ===== ACHIEVEMENT SYSTEM =====
  
  /** Base64 image of the solved cube (for achievement certificate) */
  solvedSnapshot: string | null;

  // ===== HINT SYSTEM =====
  
  /** Current move suggestion (e.g., "R", "U'", "L2") or null if no hint */
  currentHint: string | null;
  
  /** Complete history of all moves made (used for undo and auto-solve) */
  moveHistory: Move[];

  // ===== VIEW SYNCHRONIZATION =====
  
  /** Camera orientation for mini-cube hint visualization */
  cameraQuaternion: number[] | null;

  // ===== STATE SETTERS =====
  
  setMode: (mode: GameMode) => void;
  setTheme: (theme: ThemeType) => void;
  setIsSolved: (solved: boolean) => void;
  setOrbitEnabled: (enabled: boolean) => void;
  setSolvedSnapshot: (url: string | null) => void;
  setCurrentHint: (hint: string | null) => void;
  setCameraQuaternion: (quat: number[]) => void;
  
  // ===== MOVE HISTORY ACTIONS =====
  
  /** Add a move to the history stack */
  pushMove: (move: Move) => void;
  
  /** Remove the most recent move from history (for undo) */
  popMove: () => void;
  
  /** Clear all move history (for new game) */
  resetMoves: () => void;

  // ===== GAME LIFECYCLE =====
  
  /** Start the game timer (called on first move) */
  startGame: () => void;
  
  /** Stop the timer and mark cube as solved */
  stopGame: () => void;
  
  /** Reset all game state to initial values */
  resetGame: () => void;
}

/**
 * ZUSTAND STORE IMPLEMENTATION
 * 
 * The `create` function from Zustand sets up the global store with:
 * - Initial state values
 * - State update functions
 * 
 * The `set` function is provided by Zustand to update state. It can:
 * - Accept an object to merge with current state: set({ mode: 'GAME' })
 * - Accept a function to derive new state: set((state) => ({ count: state.count + 1 }))
 * 
 * State updates are immutable - they create new state objects rather than mutating.
 * Components that subscribe to changed values will automatically re-render.
 */
export const useStore = create<AppState>((set) => ({
  // ===== INITIAL STATE VALUES =====
  
  mode: 'HERO',                // Start in demonstration mode
  theme: 'TECH',               // Default to classic Rubik's Cube appearance
  isSolved: false,             // Cube starts scrambled
  orbitEnabled: true,          // Camera controls enabled by default
  
  gameStartTime: null,         // No game in progress
  gameEndTime: null,
  isTimerRunning: false,
  solvedSnapshot: null,
  currentHint: null,
  moveHistory: [],             // Empty move stack
  cameraQuaternion: null,

  // ===== SIMPLE STATE SETTERS =====
  // These directly update a single state value
  
  setMode: (mode) => set({ mode }),
  setTheme: (theme) => set({ theme }),
  setIsSolved: (isSolved) => set({ isSolved }),
  setOrbitEnabled: (orbitEnabled) => set({ orbitEnabled }),
  setSolvedSnapshot: (solvedSnapshot) => set({ solvedSnapshot }),
  setCurrentHint: (currentHint) => set({ currentHint }),
  setCameraQuaternion: (cameraQuaternion) => set({ cameraQuaternion }),
  
  // ===== MOVE HISTORY MANAGEMENT =====
  
  /**
   * pushMove: Add a move to the history stack
   * 
   * The move history serves two purposes:
   * 1. Undo functionality - reverse the last move
   * 2. Auto-solve - replay all moves in reverse to return to solved state
   * 
   * Implementation uses spread operator to create a new array (immutable update)
   */
  pushMove: (move) => set((state) => ({ moveHistory: [...state.moveHistory, move] })),
  
  /**
   * popMove: Remove the most recent move
   * 
   * Used when:
   * - User clicks undo button
   * - Auto-solve animation plays a move in reverse
   * 
   * Creates a shallow copy before popping to maintain immutability
   */
  popMove: () => set((state) => {
      const newHistory = [...state.moveHistory];
      newHistory.pop();
      return { moveHistory: newHistory };
  }),
  
  /**
   * resetMoves: Clear the entire move history
   * 
   * Called when starting a new game or scrambling the cube
   */
  resetMoves: () => set({ moveHistory: [] }),

  // ===== GAME LIFECYCLE MANAGEMENT =====
  
  /**
   * startGame: Begin timing a solve attempt
   * 
   * Called automatically on the first move after entering GAME mode.
   * Uses Date.now() for millisecond-accurate timing.
   * 
   * Guard: Prevents restarting if already running
   */
  startGame: () => set((state) => {
    if (state.isTimerRunning) return {}; // Already started, no change
    return { 
      isTimerRunning: true, 
      gameStartTime: Date.now(), 
      gameEndTime: null, 
      isSolved: false, 
      solvedSnapshot: null, 
      currentHint: null 
    };
  }),
  
  /**
   * stopGame: Complete the solve and stop the timer
   * 
   * Called when solved state is detected.
   * Records end time and marks cube as solved.
   * 
   * Guard: Only stops if timer is running
   */
  stopGame: () => set((state) => {
      if (!state.isTimerRunning) return {}; // Not running, no change
      return { 
        isTimerRunning: false, 
        gameEndTime: Date.now(), 
        isSolved: true 
      };
  }),
  
  /**
   * resetGame: Return to initial game state
   * 
   * Clears all game progress:
   * - Timer reset
   * - Move history cleared
   * - Hints and snapshots removed
   * - Camera state reset
   * 
   * Does NOT change mode or theme - those are user preferences
   */
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