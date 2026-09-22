/**
 * Procedural Texture Generator
 * Generates realistic dirty/abandoned textures using HTML5 Canvas to eliminate external image dependencies.
 */
class TextureGenerator {
    static createWallTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Base plaster / concrete color
        ctx.fillStyle = '#2b2a28';
        ctx.fillRect(0, 0, 512, 512);

        // Noise and grit
        for (let i = 0; i < 40000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const shade = Math.floor(Math.random() * 40 - 20);
            ctx.fillStyle = `rgba(${43 + shade}, ${42 + shade}, ${40 + shade}, 0.3)`;
            ctx.fillRect(x, y, 2, 2);
        }

        // Grungy moisture drips and cracks
        ctx.strokeStyle = 'rgba(15, 14, 12, 0.4)';
        ctx.lineWidth = 1.5;
        for (let j = 0; j < 15; j++) {
            let startX = Math.random() * 512;
            let startY = Math.random() * 200;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            for (let k = 0; k < 6; k++) {
                startX += (Math.random() - 0.5) * 20;
                startY += Math.random() * 40;
                ctx.lineTo(startX, startY);
            }
            ctx.stroke();
        }

        // Dark bottom grime (water damage near floor)
        const gradient = ctx.createLinearGradient(0, 350, 0, 512);
        gradient.addColorStop(0, 'rgba(10, 10, 8, 0)');
        gradient.addColorStop(1, 'rgba(10, 10, 8, 0.7)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 350, 512, 162);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    static createFloorTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Dark dirty tile background
        ctx.fillStyle = '#1c1b19';
        ctx.fillRect(0, 0, 512, 512);

        // Tile grid lines
        const tileSize = 128;
        ctx.strokeStyle = '#0a0a09';
        ctx.lineWidth = 3;

        for (let x = 0; x <= 512; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 512);
            ctx.stroke();
        }

        for (let y = 0; y <= 512; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y);
            ctx.stroke();
        }

        // Dirt speckles and wear
        for (let i = 0; i < 30000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const val = Math.floor(Math.random() * 25);
            ctx.fillStyle = `rgba(${val}, ${val}, ${val}, 0.35)`;
            ctx.fillRect(x, y, 3, 3);
        }

        // Blood / rust stain
        const stainGrad = ctx.createRadialGradient(280, 240, 10, 280, 240, 80);
        stainGrad.addColorStop(0, 'rgba(50, 10, 10, 0.5)');
        stainGrad.addColorStop(0.7, 'rgba(30, 8, 8, 0.25)');
        stainGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = stainGrad;
        ctx.beginPath();
        ctx.arc(280, 240, 80, 0, Math.PI * 2);
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    static createCeilingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Grey acoustic ceiling tile
        ctx.fillStyle = '#1e1e20';
        ctx.fillRect(0, 0, 256, 256);

        // Tile grid
        ctx.strokeStyle = '#121214';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 256, 256);

        // Ceiling tile holes
        ctx.fillStyle = '#101012';
        for (let i = 0; i < 600; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            ctx.fillRect(x, y, 2, 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    static createWoodTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Dark decayed wood base
        ctx.fillStyle = '#3a2718';
        ctx.fillRect(0, 0, 256, 512);

        // Wood grain lines
        for (let i = 0; i < 256; i += 3) {
            const grainTone = Math.floor(Math.random() * 30 - 15);
            ctx.fillStyle = `rgba(${58 + grainTone}, ${39 + grainTone}, ${24 + grainTone}, 0.6)`;
            ctx.fillRect(i, 0, 2, 512);
        }

        // Stains
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 512;
            ctx.fillStyle = 'rgba(20, 12, 8, 0.3)';
            ctx.fillRect(x, y, 3, 3);
        }

        return new THREE.CanvasTexture(canvas);
    }

    static createMetalTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Rusted iron/steel base
        ctx.fillStyle = '#2d3032';
        ctx.fillRect(0, 0, 256, 256);

        // Rust patches
        for (let j = 0; j < 8; j++) {
            const rx = Math.random() * 256;
            const ry = Math.random() * 256;
            const rad = 20 + Math.random() * 40;
            const rustGrad = ctx.createRadialGradient(rx, ry, 5, rx, ry, rad);
            rustGrad.addColorStop(0, 'rgba(80, 45, 25, 0.6)');
            rustGrad.addColorStop(1, 'rgba(45, 48, 50, 0)');
            ctx.fillStyle = rustGrad;
            ctx.beginPath();
            ctx.arc(rx, ry, rad, 0, Math.PI * 2);
            ctx.fill();
        }

        // Scratches
        ctx.strokeStyle = 'rgba(180, 185, 190, 0.2)';
        ctx.lineWidth = 1;
        for (let k = 0; k < 20; k++) {
            ctx.beginPath();
            const sx = Math.random() * 256;
            const sy = Math.random() * 256;
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + (Math.random() - 0.5) * 40, sy + (Math.random() - 0.5) * 40);
            ctx.stroke();
        }

        return new THREE.CanvasTexture(canvas);
    }

    static createExitSignTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0a1a0f';
        ctx.fillRect(0, 0, 256, 128);

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 6;
        ctx.strokeRect(8, 8, 240, 112);

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 58px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 15;
        ctx.fillText('EXIT', 128, 64);

        return new THREE.CanvasTexture(canvas);
    }
}
