import { useStore } from '../store';

export const generateTicketImage = async (
    cubeSnapshotUrl: string, 
    time: string, 
    id: string, 
    date: string
): Promise<string> => {
    const width = 400;
    const height = 650;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    // --- 1. Background (Dark Tech Card) ---
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1a1a1a');
    grad.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width-20, height-20);

    // --- 2. Header (Orange Ticket Stub) ---
    ctx.fillStyle = '#ea580c'; // Orange-600
    ctx.fillRect(0, 0, width, 80);
    
    // Header Text
    ctx.fillStyle = '#000';
    ctx.font = '900 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CYBER//CUBE', width / 2, 40);

    // Dashed Line
    ctx.beginPath();
    ctx.setLineDash([10, 10]);
    ctx.moveTo(0, 80);
    ctx.lineTo(width, 80);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]);

    // Cutout Circles
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(0, 80, 15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(width, 80, 15, 0, Math.PI * 2); ctx.fill();

    // --- 3. Cube Snapshot ---
    if (cubeSnapshotUrl) {
        const img = new Image();
        img.src = cubeSnapshotUrl;
        await new Promise(resolve => img.onload = resolve);
        
        // Draw Image container border
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(50, 110, 300, 300);
        
        // Draw Image
        ctx.drawImage(img, 50, 110, 300, 300);
        
        // Overlay gradient on image bottom
        const iGrad = ctx.createLinearGradient(0, 350, 0, 410);
        iGrad.addColorStop(0, 'transparent');
        iGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = iGrad;
        ctx.fillRect(50, 350, 300, 60);

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('IMG_CAPTURE_001.PNG', 60, 400);
    }

    // --- 4. Stats Section ---
    const startY = 440;
    
    // Time
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText('CLEAR_TIME', 50, startY);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px monospace';
    ctx.fillText(time, 50, startY + 35);
    
    // ID & Date
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.fillText(`ID: ${id}`, 50, startY + 70);
    ctx.textAlign = 'right';
    ctx.fillText(date, 350, startY + 70);

    // --- 5. Footer Barcode ---
    const barY = 560;
    const barH = 40;
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.3;
    let cx = 50;
    while(cx < 350) {
        const w = Math.random() > 0.5 ? 2 : 5;
        ctx.fillRect(cx, barY, w, barH);
        cx += w + 2;
    }
    ctx.globalAlpha = 1.0;

    // Footer Text
    ctx.fillStyle = '#ea580c';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VERIFIED BY CYBER_CUBE_SYSTEM', width/2, height - 20);

    return canvas.toDataURL('image/png');
};