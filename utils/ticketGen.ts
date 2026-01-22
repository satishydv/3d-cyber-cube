/**
 * ACHIEVEMENT TICKET GENERATOR
 * 
 * Creates a shareable achievement certificate when the user solves the cube.
 * The ticket is designed to look like a concert/event ticket with a tear-off stub.
 * 
 * DESIGN ELEMENTS:
 * 1. Header - Orange ticket stub with "CYBER//CUBE" branding
 * 2. Perforation - Dashed line with circular cutouts (like a real ticket)
 * 3. Cube Snapshot - Embedded image of the solved cube state
 * 4. Stats Section - Displays completion time in large text
 * 5. Metadata - Unique ticket ID and completion date
 * 6. Barcode - Procedural barcode-style footer for authenticity
 * 7. Verification - Security footer text
 * 
 * CANVAS TECHNIQUES USED:
 * - Linear gradients for depth
 * - Image composition (cube snapshot)
 * - Typography hierarchy (multiple font sizes/weights)
 * - Dashed lines (setLineDash)
 * - Alpha compositing (transparency effects)
 * - Data URL export (toDataURL)
 * 
 * OUTPUT:
 * Returns a base64-encoded PNG image that can be:
 * - Displayed in the UI
 * - Downloaded by the user
 * - Shared on social media
 * 
 * @param cubeSnapshotUrl - Base64 data URL of the solved cube (from renderer)
 * @param time - Formatted solve time string (e.g., "00:32.450")
 * @param id - Unique ticket identifier
 * @param date - Completion date string (e.g., "2024-01-22")
 * @returns Promise<string> - Base64 PNG data URL of the ticket
 */

import { useStore } from '../store';

export const generateTicketImage = async (
    cubeSnapshotUrl: string, 
    time: string, 
    id: string, 
    date: string
): Promise<string> => {
    // Ticket dimensions - designed for mobile sharing
    const width = 400;
    const height = 650;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    // --- 1. BACKGROUND: Dark tech card gradient ---
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1a1a1a'); // Dark gray top
    grad.addColorStop(1, '#0a0a0a'); // Darker gray bottom (depth)
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Border frame
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width-20, height-20);

    // --- 2. HEADER: Orange ticket stub ---
    ctx.fillStyle = '#ea580c'; // Orange-600 (brand color)
    ctx.fillRect(0, 0, width, 80);
    
    // Header text with strong contrast
    ctx.fillStyle = '#000';
    ctx.font = '900 32px "Courier New", monospace'; // Heavy weight for impact
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CYBER//CUBE', width / 2, 40);

    // --- 3. PERFORATION: Dashed line separator ---
    ctx.beginPath();
    ctx.setLineDash([10, 10]); // 10px dash, 10px gap
    ctx.moveTo(0, 80);
    ctx.lineTo(width, 80);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]); // Reset to solid lines

    // Cutout circles at perforation (tear-off effect)
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(0, 80, 15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(width, 80, 15, 0, Math.PI * 2); ctx.fill();

    // --- 4. CUBE SNAPSHOT: Embedded solve state image ---
    if (cubeSnapshotUrl) {
        const img = new Image();
        img.src = cubeSnapshotUrl;
        await new Promise(resolve => img.onload = resolve);
        
        // Image container border
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(50, 110, 300, 300);
        
        // Draw cube image
        ctx.drawImage(img, 50, 110, 300, 300);
        
        // Overlay gradient at bottom (caption area)
        const iGrad = ctx.createLinearGradient(0, 350, 0, 410);
        iGrad.addColorStop(0, 'transparent');
        iGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = iGrad;
        ctx.fillRect(50, 350, 300, 60);

        // Image caption
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('IMG_CAPTURE_001.PNG', 60, 400);
    }

    // --- 5. STATS SECTION: Solve time display ---
    const startY = 440;
    
    // Label
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText('CLEAR_TIME', 50, startY);
    
    // Large time display (hero element)
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px monospace';
    ctx.fillText(time, 50, startY + 35);
    
    // --- 6. METADATA: ID and date ---
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.fillText(`ID: ${id}`, 50, startY + 70);
    ctx.textAlign = 'right';
    ctx.fillText(date, 350, startY + 70);

    // --- 7. FOOTER: Procedural barcode ---
    const barY = 560;
    const barH = 40;
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.3; // Semi-transparent for subtlety
    let cx = 50;
    // Generate random-width bars (simulates barcode)
    while(cx < 350) {
        const w = Math.random() > 0.5 ? 2 : 5; // Varying widths
        ctx.fillRect(cx, barY, w, barH);
        cx += w + 2;
    }
    ctx.globalAlpha = 1.0; // Reset opacity

    // Verification footer
    ctx.fillStyle = '#ea580c';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VERIFIED BY CYBER_CUBE_SYSTEM', width/2, height - 20);

    // Export as PNG data URL
    return canvas.toDataURL('image/png');
};