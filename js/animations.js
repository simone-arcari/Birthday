/* =====================================================
   ANIMATIONS.JS - Particle System and Visual Effects
   For Serena's Birthday Magical Experience
   ===================================================== */

class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isRunning = false;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticle(x, y, type = 'sparkle', options = {}) {
        const defaults = {
            sparkle: {
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 4 + 2,
                color: Math.random() > 0.5 ? '#EAB308' : '#FCD34D',
                life: 1.0,
                decay: 0.02,
                gravity: 0
            },
            confetti: {
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * -5 - 2,
                size: Math.random() * 8 + 4,
                color: ['#EAB308', '#7C2D12', '#FCD34D', '#9A3412'][Math.floor(Math.random() * 4)],
                life: 1.0,
                decay: 0.005,
                gravity: 0.1,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10
            },
            heart: {
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2 - 1,
                size: Math.random() * 15 + 10,
                color: ['#FF6B6B', '#EE5A5A', '#FF8E8E', '#FFB3B3'][Math.floor(Math.random() * 4)],
                life: 1.0,
                decay: 0.008,
                gravity: -0.02
            },
            star: {
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 6 + 4,
                color: '#FFFFFF',
                life: 1.0,
                decay: 0.015,
                gravity: 0,
                glow: true
            },
            dust: {
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                color: 'rgba(234, 179, 8, 0.8)',
                life: 1.0,
                decay: 0.025,
                gravity: 0
            }
        };
        
        const preset = defaults[type] || defaults.sparkle;
        
        return {
            x,
            y,
            type,
            ...preset,
            ...options
        };
    }
    
    emit(x, y, type, count = 10, options = {}) {
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(x, y, type, options));
        }
        
        if (!this.isRunning) {
            this.start();
        }
    }
    
    emitBurst(x, y, type, count = 30) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 5 + 3;
            const particle = this.createParticle(x, y, type, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed
            });
            this.particles.push(particle);
        }
        
        if (!this.isRunning) {
            this.start();
        }
    }
    
    emitCelebration() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Multiple bursts
        this.emitBurst(centerX, centerY, 'confetti', 50);
        this.emitBurst(centerX, centerY, 'star', 20);
        
        // Hearts floating up
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const x = Math.random() * this.canvas.width;
                const y = this.canvas.height + 20;
                this.emit(x, y, 'heart', 1);
            }, i * 100);
        }
        
        // Confetti from top
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const x = Math.random() * this.canvas.width;
                this.emit(x, -10, 'confetti', 3);
            }, i * 50);
        }
    }
    
    emitMagicTrail(x, y) {
        this.emit(x, y, 'dust', 3);
        this.emit(x, y, 'sparkle', 2);
    }
    
    update() {
        this.particles = this.particles.filter(p => {
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Apply gravity
            if (p.gravity) {
                p.vy += p.gravity;
            }
            
            // Apply rotation for confetti
            if (p.rotation !== undefined) {
                p.rotation += p.rotationSpeed;
            }
            
            // Update life
            p.life -= p.decay;
            
            return p.life > 0;
        });
        
        // Stop animation if no particles
        if (this.particles.length === 0) {
            this.stop();
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            
            switch (p.type) {
                case 'sparkle':
                case 'star':
                    this.drawStar(p);
                    break;
                case 'confetti':
                    this.drawConfetti(p);
                    break;
                case 'heart':
                    this.drawHeart(p);
                    break;
                case 'dust':
                    this.drawDust(p);
                    break;
                default:
                    this.drawCircle(p);
            }
            
            this.ctx.restore();
        });
    }
    
    drawStar(p) {
        const spikes = 4;
        const outerRadius = p.size;
        const innerRadius = p.size / 2;
        
        if (p.glow) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color;
        }
        
        this.ctx.beginPath();
        this.ctx.fillStyle = p.color;
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / spikes - Math.PI / 2;
            const x = p.x + Math.cos(angle) * radius;
            const y = p.y + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    drawConfetti(p) {
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    }
    
    drawHeart(p) {
        const size = p.size;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        
        // Heart shape
        const x = p.x;
        const y = p.y;
        
        this.ctx.moveTo(x, y + size / 4);
        this.ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
        this.ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 0.75, x, y + size);
        this.ctx.bezierCurveTo(x, y + size * 0.75, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
        this.ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
        
        this.ctx.fill();
    }
    
    drawDust(p) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = p.color;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    drawCircle(p) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    animate() {
        if (!this.isRunning) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.animate());
    }
    
    clear() {
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Stars Background Generator
class StarsBackground {
    constructor(container) {
        this.container = container;
        this.stars = [];
    }
    
    generate(count = 50) {
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.cssText = `
                position: absolute;
                width: ${Math.random() * 3 + 1}px;
                height: ${Math.random() * 3 + 1}px;
                background: ${Math.random() > 0.7 ? '#EAB308' : '#FFFFFF'};
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                opacity: ${Math.random() * 0.5 + 0.3};
                animation: twinkle ${Math.random() * 3 + 2}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
            this.container.appendChild(star);
            this.stars.push(star);
        }
    }
    
    clear() {
        this.stars.forEach(star => star.remove());
        this.stars = [];
    }
}

// Export
window.ParticleSystem = ParticleSystem;
window.StarsBackground = StarsBackground;
