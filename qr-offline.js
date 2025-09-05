// Simple Offline QR Code Generator
class OfflineQR {
    constructor() {
        this.size = 21; // QR Version 1 size
        this.modules = [];
        this.isFunction = [];
    }

    generate(text) {
        this.setupModules();
        this.addFinderPatterns();
        this.addSeparators();
        this.addTimingPatterns();
        this.addDarkModule();
        this.addData(text);
        return this.createCanvas();
    }

    setupModules() {
        this.modules = Array(this.size).fill().map(() => Array(this.size).fill(false));
        this.isFunction = Array(this.size).fill().map(() => Array(this.size).fill(false));
    }

    addFinderPatterns() {
        const positions = [[0, 0], [0, this.size - 7], [this.size - 7, 0]];
        positions.forEach(([x, y]) => {
            for (let dy = 0; dy < 7; dy++) {
                for (let dx = 0; dx < 7; dx++) {
                    const xx = x + dx;
                    const yy = y + dy;
                    if (xx < this.size && yy < this.size) {
                        this.modules[yy][xx] = (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
                        this.isFunction[yy][xx] = true;
                    }
                }
            }
        });
    }

    addSeparators() {
        const positions = [[0, 0], [0, this.size - 8], [this.size - 8, 0]];
        positions.forEach(([x, y]) => {
            for (let dy = 0; dy < 8; dy++) {
                for (let dx = 0; dx < 8; dx++) {
                    const xx = x + dx;
                    const yy = y + dy;
                    if (xx < this.size && yy < this.size && !this.isFunction[yy][xx]) {
                        this.modules[yy][xx] = false;
                        this.isFunction[yy][xx] = true;
                    }
                }
            }
        });
    }

    addTimingPatterns() {
        for (let i = 8; i < this.size - 8; i++) {
            this.modules[6][i] = i % 2 === 0;
            this.modules[i][6] = i % 2 === 0;
            this.isFunction[6][i] = true;
            this.isFunction[i][6] = true;
        }
    }

    addDarkModule() {
        this.modules[4 * 1 + 9][8] = true;
        this.isFunction[4 * 1 + 9][8] = true;
    }

    addData(text) {
        const data = this.encodeText(text);
        let bitIndex = 0;
        
        // Simple data placement (zigzag pattern)
        for (let right = this.size - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5; // Skip timing column
            
            for (let vert = 0; vert < this.size; vert++) {
                for (let j = 0; j < 2; j++) {
                    const x = right - j;
                    const y = ((right + 1) & 2) === 0 ? this.size - 1 - vert : vert;
                    
                    if (!this.isFunction[y][x] && bitIndex < data.length) {
                        this.modules[y][x] = data[bitIndex] === '1';
                        bitIndex++;
                    }
                }
            }
        }
    }

    encodeText(text) {
        // Simple encoding - convert to binary
        let binary = '';
        
        // Mode indicator (0100 for byte mode)
        binary += '0100';
        
        // Character count (8 bits for byte mode)
        const length = Math.min(text.length, 255);
        binary += length.toString(2).padStart(8, '0');
        
        // Data
        for (let i = 0; i < length; i++) {
            binary += text.charCodeAt(i).toString(2).padStart(8, '0');
        }
        
        // Pad to required length
        while (binary.length < 152) { // QR Version 1 capacity
            binary += binary.length % 8 === 0 ? '11101100' : '0001';
        }
        
        return binary.substring(0, 152);
    }

    createCanvas() {
        const canvas = document.createElement('canvas');
        const size = 256;
        const moduleSize = size / this.size;
        
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        ctx.fillStyle = '#2d3748';
        
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (this.modules[y][x]) {
                    ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
                }
            }
        }
        
        return canvas;
    }
}

// Export for use
window.OfflineQR = OfflineQR;