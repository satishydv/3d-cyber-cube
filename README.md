# 🎮 CYBER CUBE

A high-fidelity, design-driven interactive 3D Rubik's Cube experience featuring industrial cyberpunk aesthetics, custom shaders, and intelligent gameplay mechanics.

![Version](https://img.shields.io/badge/version-2.5.0-orange)
![React](https://img.shields.io/badge/React-18.3.1-61dafb?logo=react)
![Three.js](https://img.shields.io/badge/Three.js-0.167.1-000000?logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178c6?logo=typescript)

## ✨ Features

### 🎨 Visual Themes
Choose from 5 unique visual styles:
- **STANDARD_PLASTIC** - Classic Rubik's Cube appearance
- **DEV_STACK_ICONS** - Developer-themed with tech stack logos
- **HOLO_GRID** - Futuristic holographic grid aesthetic
- **DOMAIN_EXPANSION** - Anime-inspired visual style
- **SKETCH_BOOK** - Hand-drawn sketch appearance

### 🎯 Core Gameplay
- **Interactive 3D Controls** - Click and drag faces to rotate, or use keyboard shortcuts
- **Precision Timer** - Millisecond-accurate speedcube timer
- **Smart Hint System** - AI precognition module suggests optimal moves
- **Move History** - Intelligent undo/redo stack with smart move cancellation
- **Auto-Solve Visualization** - Watch the cube solve itself in hero mode
- **Achievement Ticket** - Generate and download completion certificates with cube snapshots

### 🎧 Audio Experience
- Dynamic sound effects for all interactions
- Servo motor-inspired rotation sounds
- Victory celebration audio
- Ambient UI feedback

### 🔧 Technical Features
- **60 FPS Performance** - Optimized WebGL rendering
- **Responsive Design** - Works on desktop and mobile devices
- **Physical Accuracy** - Mathematically correct rotation matrices
- **State Persistence** - Zustand-powered state management
- **Smooth Animations** - GSAP and Framer Motion integration

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cyber-cube.git
cd cyber-cube
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview
```

## 🎮 How to Play

### Controls

#### Mouse Controls
- **Orbit Camera** - Click and drag on the background
- **Rotate Slice** - Click and drag on any cube face

#### Keyboard Controls
- `R` - Rotate right face clockwise
- `L` - Rotate left face clockwise
- `U` - Rotate top face clockwise
- `D` - Rotate bottom face clockwise
- `F` - Rotate front face clockwise
- `B` - Rotate back face clockwise
- `Shift + [Key]` - Perform counter-clockwise rotation

#### Game Modes

**HERO Mode** (Default)
- Watch the cube automatically solve and scramble itself
- Select your preferred visual theme
- Press "INITIALIZE" to start playing

**GAME Mode**
- Timer starts on your first move
- Use the precognition module to see suggested moves
- Solve the cube to unlock your achievement ticket
- Download your completion certificate with time and cube snapshot

## 📁 Project Structure

```
cyber-cube/
├── components/
│   ├── 3D/
│   │   ├── Confetti.tsx          # Victory celebration effects
│   │   ├── CubePiece.tsx         # Individual cube piece component
│   │   ├── Materials.tsx         # Custom shaders and materials
│   │   ├── MiniCube.tsx          # Hint visualization mini-cube
│   │   ├── RubiksCube.tsx        # Main cube logic and state
│   │   └── SceneContainer.tsx    # Three.js scene setup
│   └── UI/
│       ├── GameOverlay.tsx       # In-game HUD and controls
│       └── HeroOverlay.tsx       # Landing page UI
├── utils/
│   ├── audio.ts                  # Audio engine and sound effects
│   ├── cubeMath.ts               # Rotation matrix calculations
│   ├── textureGen.ts             # Procedural texture generation
│   └── ticketGen.ts              # Achievement ticket renderer
├── App.tsx                       # Main application component
├── store.ts                      # Zustand state management
└── index.tsx                     # Application entry point
```

## 🛠️ Tech Stack

### Core Framework
- **React 18.3.1** - UI framework
- **TypeScript 5.8.2** - Type safety
- **Vite 6.2.0** - Build tool and dev server

### 3D Graphics
- **Three.js 0.167.1** - WebGL 3D engine
- **@react-three/fiber 8.17.6** - React renderer for Three.js
- **@react-three/drei 9.112.0** - Three.js helpers and abstractions
- **@react-three/postprocessing 2.16.2** - Post-processing effects

### Animation & State
- **Framer Motion 11.3.28** - UI animations
- **GSAP 3.12.5** - Advanced animations
- **Zustand 4.5.4** - Lightweight state management

## 🎨 Theme System

The application features a dynamic theming system with 5 distinct visual styles. Themes can be switched in real-time without reloading the scene.

Each theme includes:
- Custom face materials
- Unique color palettes
- Procedurally generated textures
- Theme-specific shader effects

## 🔧 Development

### Architecture Highlights

**State Management**
- Centralized Zustand store for global state
- Optimized re-renders with selective subscriptions
- Move history stack with smart undo/redo

**Animation System**
- Frame-perfect rotation animations using useFrame
- Pivot-based slice rotation for physical accuracy
- Quaternion-based rotation to avoid gimbal lock

**Solved Detection**
- Physical position and rotation checking
- Quaternion-based orientation verification
- Double-safety piece count validation

**Performance Optimizations**
- Instanced rendering where possible
- Lazy loading of heavy components
- RequestAnimationFrame-based timer
- Memoized calculations

### Key Files

- `store.ts` - Global state management and game logic
- `RubiksCube.tsx` - Core cube mechanics and physics
- `cubeMath.ts` - Mathematical utilities for 3D transformations
- `Materials.tsx` - WebGL shaders and material definitions

## 🌟 Features in Detail

### Precognition Module
The hint system provides intelligent move suggestions by tracking your move history and suggesting the inverse operation to help you unwind mistakes.

### Achievement System
When you solve the cube:
1. A snapshot is automatically captured
2. Your completion time is recorded
3. A unique ticket ID is generated
4. Download a shareable achievement certificate

### Auto-Solve Algorithm
In HERO mode, the cube performs an automated solve by:
1. Maintaining a complete move history stack
2. Executing inverse moves in LIFO order
3. Creating smooth, automated unwinding animations
4. Re-scrambling after each complete solve

## 📝 License

This project is available for educational and personal use.

## 🙏 Credits

Created with ❤️ using React, Three.js, and modern web technologies.

---

**Built by developers, for puzzle enthusiasts.**

*SPATIAL ORIENTATION REQUIRED. SECURE CONNECTION ESTABLISHED.*
