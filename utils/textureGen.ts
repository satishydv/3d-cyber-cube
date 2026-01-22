import * as THREE from 'three';
import { COLORS } from './cubeMath';

const textureCache: Record<string, THREE.CanvasTexture> = {};

// --- HELPER: Draw Rounded Rect manually for max compatibility ---
const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
};

const drawLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, wobble: number = 1) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 + (Math.random()-0.5)*wobble, y2 + (Math.random()-0.5)*wobble);
    ctx.stroke();
};

const drawWobblyRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, wobble: number = 2) => {
    ctx.beginPath();
    ctx.moveTo(x + Math.random() * wobble, y + Math.random() * wobble);
    ctx.lineTo(x + w - Math.random() * wobble, y + Math.random() * wobble);
    ctx.lineTo(x + w - Math.random() * wobble, y + h - Math.random() * wobble);
    ctx.lineTo(x + Math.random() * wobble, y + h - Math.random() * wobble);
    ctx.closePath();
};

export const generateClassicSticker = (baseColor: string): THREE.CanvasTexture => {
  const cacheKey = `CLASSIC-V6-${baseColor}`;
  if (textureCache[cacheKey]) return textureCache[cacheKey];

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#000000'; 
  ctx.fillRect(0, 0, size, size);

  const padding = 80; 
  const cornerRadius = 50; 
  const x = padding;
  const y = padding;
  const w = size - (padding * 2);
  const h = size - (padding * 2);

  ctx.fillStyle = baseColor;
  drawRoundedRect(ctx, x, y, w, h, cornerRadius);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16; 
  textureCache[cacheKey] = texture;
  return texture;
};

// --- SKETCH THEME GENERATOR ---
export const generateSketchTexture = (baseColor: string): THREE.CanvasTexture => {
  const cacheKey = `SKETCH-V4-${baseColor}`; 
  if (textureCache[cacheKey]) return textureCache[cacheKey];

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return new THREE.CanvasTexture(canvas);

  let markerColor = baseColor;
  if (baseColor === COLORS.R) markerColor = '#FF2A2A'; 
  else if (baseColor === COLORS.L) markerColor = '#FF8800'; 
  else if (baseColor === COLORS.U) markerColor = '#FFFFFF'; 
  else if (baseColor === COLORS.D) markerColor = '#FFDD00'; 
  else if (baseColor === COLORS.F) markerColor = '#00FF44'; 
  else if (baseColor === COLORS.B) markerColor = '#0099FF'; 
  else if (baseColor === '#111111') markerColor = '#1a1a1a'; 

  const isCore = baseColor === '#111111';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  if (isCore) {
      ctx.fillStyle = '#111';
      ctx.fillRect(0,0,size,size);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      for(let i=0; i<100; i++) {
          drawLine(ctx, Math.random()*size, Math.random()*size, Math.random()*size, Math.random()*size, 5);
      }
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      textureCache[cacheKey] = t;
      return t;
  }

  const padding = 35;
  const w = size - (padding * 2);
  const h = size - (padding * 2);
  const x = padding;
  const y = padding;
  
  ctx.fillStyle = markerColor;
  ctx.beginPath();
  ctx.moveTo(x + 5, y);
  ctx.lineTo(x + w - 5, y + 2);
  ctx.lineTo(x + w + 2, y + h - 5);
  ctx.lineTo(x + 5, y + h - 2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#000'; 
  ctx.lineWidth = 3; 
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.8; 

  ctx.beginPath();
  const spacing = 18; 

  if (baseColor === COLORS.D) {
      for (let i = x; i <= x+w; i+=spacing) drawLine(ctx, i, y + 5, i, y + h - 5, 3);
  } else if (baseColor === COLORS.B) {
      for (let i = y; i <= y+h; i+=spacing) drawLine(ctx, x + 5, i, x + w - 5, i, 3);
      for (let i = x; i <= x+w; i+=spacing) drawLine(ctx, i, y + 5, i, y + h - 5, 3);
  } else if (baseColor === COLORS.R || baseColor === COLORS.L) {
      for (let i = -size; i < size * 2; i+=spacing) {
          const sx = i; 
          if (sx > x && sx < x+w+h) {
             ctx.moveTo(sx, y); 
             ctx.lineTo(sx - h, y+h); 
          }
      }
  } else if (baseColor === COLORS.F) {
       for (let i = y; i <= y+h; i+=spacing) drawLine(ctx, x + 5, i, x + w - 5, i, 3);
  } else if (baseColor === COLORS.U) {
       ctx.fillStyle = '#000';
       for(let i=0; i<50; i++) {
           ctx.beginPath();
           ctx.arc(x+Math.random()*w, y+Math.random()*h, 2, 0, Math.PI*2);
           ctx.fill();
       }
  }

  ctx.stroke();
  ctx.globalAlpha = 1.0;

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  drawWobblyRect(ctx, x, y, w, h, 2);
  ctx.stroke();

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  const hx = x + 30;
  const hy = y + 40;
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx + 40, hy - 5);
  ctx.moveTo(hx + 5, hy + 15);
  ctx.lineTo(hx + 35, hy + 10);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache[cacheKey] = texture;
  return texture;
};

// --- NEON / HOLO THEME GENERATOR ---
export const generateNeonTunnelTexture = (baseColor: string): THREE.CanvasTexture => {
    const cacheKey = `NEON-TUNNEL-V3-${baseColor}`;
    if (textureCache[cacheKey]) return textureCache[cacheKey];

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // 1. Deep Black Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    // 2. Tunnel Parameters
    const rings = 5;
    const startPadding = 35;
    const strokeWidth = 26; 
    const gap = 24;

    let neonColor = baseColor;
    if (baseColor === COLORS.R) neonColor = '#ff0044'; 
    else if (baseColor === COLORS.L) neonColor = '#ff6600';
    else if (baseColor === COLORS.U) neonColor = '#00ffff'; 
    else if (baseColor === COLORS.D) neonColor = '#ffdd00';
    else if (baseColor === COLORS.F) neonColor = '#00ff33';
    else if (baseColor === COLORS.B) neonColor = '#0088ff';

    ctx.lineJoin = 'round';
    ctx.shadowBlur = 30;
    ctx.shadowColor = neonColor;

    for(let i=0; i<rings; i++) {
        const offset = startPadding + (i * (strokeWidth + gap));
        const w = size - (offset * 2);
        
        if (w <= 20) break;
        const radius = 40; 

        // Pass 1: The colored glow (Wide)
        ctx.strokeStyle = neonColor;
        ctx.lineWidth = strokeWidth;
        drawRoundedRect(ctx, offset, offset, w, w, radius);
        ctx.stroke();
        
        // Pass 2: The white hot core (Narrow)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = strokeWidth * 0.25; 
        ctx.shadowBlur = 0; 
        drawRoundedRect(ctx, offset, offset, w, w, radius);
        ctx.stroke();
        
        ctx.shadowBlur = 30;
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    textureCache[cacheKey] = texture;
    return texture;
}

export const generateNeonCoreTexture = (): THREE.CanvasTexture => {
    const cacheKey = `NEON-CORE-V3`;
    if (textureCache[cacheKey]) return textureCache[cacheKey];
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, size, size);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textureCache[cacheKey] = texture;
    return texture;
}

// --- ANIME THEME GENERATOR ---
export const generateAnimeTexture = (baseColor: string, id: number, faceIndex: number): THREE.CanvasTexture => {
    const cacheKey = `ANIME-V2-${baseColor}`;
    if (textureCache[cacheKey]) return textureCache[cacheKey];
  
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return new THREE.CanvasTexture(canvas);
  
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);
  
    const cx = size / 2;
    const cy = size / 2;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    
    const rays = 16;
    for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle - 0.1) * size * 1.5, cy + Math.sin(angle - 0.1) * size * 1.5);
        ctx.lineTo(cx + Math.cos(angle + 0.1) * size * 1.5, cy + Math.sin(angle + 0.1) * size * 1.5);
        ctx.closePath();
        ctx.fill();
    }
  
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    const hexSize = 100;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = cx + hexSize * Math.cos(angle);
        const y = cy + hexSize * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = cx + (hexSize - 20) * Math.cos(angle);
        const y = cy + (hexSize - 20) * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textureCache[cacheKey] = texture;
    return texture;
};

// --- DEV ICONS ---
const drawJS = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.fillStyle = '#F7DF1E'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000'; ctx.font = '600 240px sans-serif'; 
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('JS', size - 25, size - 20);
};

const drawReact = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.fillStyle = '#222222'; ctx.fillRect(0, 0, size, size);
    const cx = size/2; const cy = size/2;
    ctx.strokeStyle = '#61DAFB'; ctx.lineWidth = 16;
    ctx.fillStyle = '#61DAFB'; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy, 160, 55, 0, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, 160, 55, Math.PI/3, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, 160, 55, -Math.PI/3, 0, Math.PI*2); ctx.stroke();
};

const drawThree = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 12; ctx.lineJoin = 'miter';
    const pad = size * 0.2; const topY = size * 0.25; const botY = size * 0.8; const midX = size * 0.5;
    ctx.beginPath(); ctx.moveTo(midX, topY); ctx.lineTo(size - pad, botY); ctx.lineTo(pad, botY); ctx.closePath(); ctx.stroke();
    const midLeftX = (midX + pad) / 2; const midLeftY = (topY + botY) / 2;
    const midRightX = (midX + (size - pad)) / 2; const midRightY = (topY + botY) / 2;
    ctx.beginPath(); ctx.moveTo(midLeftX, midLeftY); ctx.lineTo(midRightX, midRightY); ctx.lineTo(midX, botY); ctx.closePath(); ctx.stroke();
};

const drawTS = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.fillStyle = '#3178C6'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#FFF'; ctx.font = '600 240px sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('TS', size - 25, size - 20);
};

const drawNode = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.fillStyle = '#333333'; ctx.fillRect(0, 0, size, size);
    const cx = size/2; const cy = size/2;
    ctx.fillStyle = '#339933'; const r = 140;
    ctx.beginPath();
    for(let i=0; i<6; i++) {
        const angle = (Math.PI/3) * i + (Math.PI/6);
        const x = cx + r * Math.cos(angle); const y = cy + r * Math.sin(angle);
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 110px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('JS', cx + 5, cy + 10);
};

const drawTailwind = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.fillStyle = '#0F172A'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#38BDF8';
    const drawWave = (sx: number, sy: number, scale: number) => {
        ctx.save(); ctx.translate(sx, sy); ctx.scale(scale, scale); ctx.beginPath();
        ctx.moveTo(0, 0); ctx.bezierCurveTo(20, -10, 40, -5, 50, 10); ctx.bezierCurveTo(60, 25, 80, 30, 100, 20);
        ctx.bezierCurveTo(90, 40, 70, 45, 50, 30); ctx.bezierCurveTo(40, 15, 20, 10, 0, 25);
        ctx.closePath(); ctx.fill(); ctx.restore();
    }
    drawWave(size * 0.15, size * 0.45, 2.8);
    drawWave(size * 0.45, size * 0.25, 1.8);
};

export const generateDevTexture = (baseColor: string, id: number, faceIndex: number): THREE.CanvasTexture => {
  const cacheKey = `DEV-ICON-V2-${baseColor}`;
  if (textureCache[cacheKey]) return textureCache[cacheKey];

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return new THREE.CanvasTexture(canvas);

  if (baseColor === COLORS.D) drawJS(ctx, size);
  else if (baseColor === COLORS.F) drawNode(ctx, size);
  else if (baseColor === COLORS.B) drawTS(ctx, size);
  else if (baseColor === COLORS.U) drawThree(ctx, size);
  else if (baseColor === COLORS.R) drawReact(ctx, size);
  else if (baseColor === COLORS.L) drawTailwind(ctx, size);
  else { ctx.fillStyle = '#111'; ctx.fillRect(0,0,size,size); }

  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 4; ctx.strokeRect(0,0,size,size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache[cacheKey] = texture;
  return texture;
};