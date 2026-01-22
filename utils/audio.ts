/**
 * AUDIO ENGINE - PROCEDURAL SOUND SYNTHESIS
 * 
 * This module provides real-time audio feedback using the Web Audio API.
 * All sounds are synthesized on-the-fly - no external audio files required.
 * 
 * ARCHITECTURE:
 * - Uses oscillators (tone generators) and noise buffers
 * - Master gain node controls overall volume
 * - Envelope shaping (ADSR) for natural sound decay
 * - Sound effects designed to match cyberpunk/industrial aesthetic
 * 
 * SOUND DESIGN PHILOSOPHY:
 * - hover() - High-frequency blip (UI feedback)
 * - click() - Noise burst (mechanical tactile feel)
 * - moveStart() - Rising sawtooth (servo motor engaging)
 * - moveEnd() - Falling square wave (mechanical latch)
 * - solve() - Ascending arpeggio (victory celebration)
 * 
 * WHY WEB AUDIO API?
 * - No dependencies or external files
 * - Real-time synthesis
 * - Low latency (instant response)
 * - Small bundle size
 * - Works offline
 */

class AudioEngine {
  /** Web Audio context - the audio processing graph */
  private ctx: AudioContext | null = null;
  
  /** Master volume control - all sounds connect through this */
  private masterGain: GainNode | null = null;
  
  /** Mute state - when true, no sounds will play */
  private isMuted: boolean = false;

  constructor() {
    this.init();
  }

  /**
   * Initialize the audio context
   * 
   * Must be called during or after a user interaction (browser requirement).
   * The context starts in 'suspended' state until resume() is called.
   */
  init() {
    if (typeof window !== 'undefined' && !this.ctx) {
      try {
        // Handle webkit prefixed version for older Safari
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Default volume (30%)
        this.masterGain.connect(this.ctx.destination);
      } catch (e) {
        console.warn('AudioContext not supported');
      }
    }
  }

  /**
   * Resume audio context if suspended
   * 
   * Modern browsers suspend audio contexts automatically to prevent
   * unwanted sounds. This must be called during user interaction.
   */
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * hover() - High-pitch sci-fi UI hover sound
   * 
   * SOUND CHARACTERISTICS:
   * - Sine wave (pure tone, smooth)
   * - Frequency: 800Hz → 1200Hz (rising pitch)
   * - Duration: 50ms (very brief)
   * - Volume: 0.1 (quiet, non-intrusive)
   * 
   * TECHNIQUE:
   * - Exponential frequency ramp creates "sweep" effect
   * - Exponential gain ramp creates natural decay
   */
  hover() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  /**
   * click() - Mechanical click for UI interactions
   * 
   * SOUND CHARACTERISTICS:
   * - White noise burst (all frequencies)
   * - Duration: 10ms (very short)
   * - Volume: 0.5 (medium, percussive)
   * 
   * TECHNIQUE:
   * - Create buffer filled with random values (-1 to 1)
   * - Apply exponential decay for crisp attack
   * - Simulates mechanical switch or button press
   */
  click() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    // Generate white noise burst
    const bufferSize = this.ctx.sampleRate * 0.01; // 10ms of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // Random value between -1 and 1
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.01);
    
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();
  }

  /**
   * moveStart() - Servo motor engagement sound
   * 
   * SOUND CHARACTERISTICS:
   * - Sawtooth wave (buzzy, mechanical)
   * - Frequency: 100Hz → 300Hz (rising pitch)
   * - Duration: 200ms (noticeable but brief)
   * - Volume: 0.1 (background ambience)
   * 
   * TECHNIQUE:
   * - Linear frequency ramp simulates motor spin-up
   * - Linear gain ramp creates fade-out
   * - Sawtooth waveform gives industrial character
   */
  moveStart() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /**
   * moveEnd() - Heavy mechanical latch sound
   * 
   * SOUND CHARACTERISTICS:
   * - Square wave (harsh, robotic)
   * - Frequency: 150Hz → 40Hz (falling pitch)
   * - Duration: 100ms (quick thud)
   * - Volume: 0.15 (slightly louder for emphasis)
   * 
   * TECHNIQUE:
   * - Exponential frequency drop creates "thunk" effect
   * - Square wave adds mechanical harshness
   * - Simulates cube face clicking into place
   */
  moveEnd() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }
  
  /**
   * solve() - Victory celebration arpeggio
   * 
   * SOUND CHARACTERISTICS:
   * - Six-note ascending pattern (A major scale)
   * - Frequencies: A4 (440Hz) to E6 (1318Hz)
   * - Duration: 480ms total (80ms spacing between notes)
   * - Volume: 0.1 per note (layered for harmonious effect)
   * 
   * TECHNIQUE:
   * - Creates 6 separate oscillators (one per note)
   * - Each note starts 80ms after the previous
   * - Fast attack (20ms) for clarity
   * - Long decay (400ms) for musical resonance
   * - A major chord: A-C#-E-A-C#-E (uplifting, heroic)
   */
  solve() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    // A Major scale frequencies (in Hz)
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51]; // A4, C#5, E5, A5, C#6, E6
    const now = this.ctx.currentTime;
    
    notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain!);
        
        osc.type = 'sine'; // Pure tone for musical clarity
        osc.frequency.value = freq;
        
        // Stagger note timing: each note starts 80ms after previous
        const time = now + (i * 0.08);
        
        // Envelope: quick attack, long sustain/release
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        
        osc.start(time);
        osc.stop(time + 0.5);
    });
  }
}

// Export singleton instance
export const audio = new AudioEngine();
