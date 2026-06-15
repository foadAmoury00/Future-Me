import React, { useEffect, useRef } from 'react';

interface Fireworks3DProps {
  intensity?: 'subtle' | 'medium' | 'full';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  decay: number;
  gravity: number;
  drag: number;
  type: 'rocket' | 'confetti';
}

export const Fireworks3D: React.FC<Fireworks3DProps> = ({ intensity = 'medium' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas sizes dynamically to cover full screen with High-DPI support
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Confetti palette matching the button gradient (Teal, Cyan, Blue, Purple, Magenta)
    const colorOptions = [
      '#00F5D4', // Teal/Cyan
      '#00D2E5', // Bright Turquoise
      '#00A8FF', // Sky Blue
      '#3F51B5', // Royal Blue
      '#9C27B0', // Purple/Violet
      '#E040FB', // Magenta/Pink
    ];

    const particles: Particle[] = [];
    const maxParticles = 6000; // Increased to support massive confetti counts

    const spawnParticle = (p: Particle) => {
      if (particles.length < maxParticles) {
        particles.push(p);
      }
    };

    const launchFirework = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Cluster launch logic for rich density (massively increased for confetti explosion)
      // Unified cluster launch logic for rich but balanced density across all screens
      let clusterCount = 2;
      if (Math.random() < 0.4) clusterCount = 3;

      for (let c = 0; c < clusterCount; c++) {
        // Wide scatter offset for clusters
        const xOffset = clusterCount > 1 ? (c - (clusterCount - 1) / 2) * (50 + Math.random() * 80) : 0;
        // Launch anywhere across 90% of the screen width
        const x = width * 0.05 + Math.random() * width * 0.9 + xOffset;
        const y = height + 15;

        // Explode high up in the top half of the screen (10% to 40% from top)
        const targetY = height * 0.1 + Math.random() * height * 0.3; 
        
        const gravity = 0.035;
        const climbHeight = y - targetY;
        // Perfect physics launch velocity to reach targetY apex
        const vy = -Math.sqrt(2 * gravity * climbHeight);
        
        // Random horizontal drift to scatter them, completely removing the old centering gravity
        const vx = (Math.random() - 0.5) * 3.5;

        spawnParticle({
          x, y,
          vx, vy,
          color: '#FFFFFF',
          size: 4.0, // Crisp rocket head
          rotation: 0,
          rotationSpeed: 0,
          life: 1.0,
          decay: 0.003, 
          gravity,
          drag: 1.0, // No drag on rockets ensures they perfectly reach their calculated climb height
          type: 'rocket'
        });
      }
    };

    const explodeFirework = (x: number, y: number) => {
      const sparkCount = 80; // Unified elegant spark count
      
      for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.0 + Math.random() * 4.5; // Fast initial burst
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];

        spawnParticle({
          x, y,
          vx, vy,
          color,
          size: 7 + Math.random() * 7, // Crisp, large confetti pieces
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 15, // Fast spinning
          life: 1.0,
          decay: 0.003 + Math.random() * 0.004, // 3-4 seconds life
          gravity: 0.03 + Math.random() * 0.02, // Gentle fall
          drag: 0.96, // Rapid deceleration after burst
          type: 'confetti'
        });
      }
    };

    let nextLaunchTime = Date.now() + 200;
    const getLaunchInterval = () => {
      return 600 + Math.random() * 400;
    };

    let time = 0;
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.016;

      const now = Date.now();
      if (now >= nextLaunchTime) {
        launchFirework();
        nextLaunchTime = now + getLaunchInterval();
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= p.decay;

        if (p.life <= 0) {
          if (p.type === 'rocket') {
            explodeFirework(p.x, p.y);
          }
          particles.splice(i, 1);
          continue;
        }

        p.vy += p.gravity;
        p.vx *= p.drag;
        p.vy *= p.drag;

        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'rocket') {
          if (p.vy >= -0.5) {
            explodeFirework(p.x, p.y);
            particles.splice(i, 1);
            continue;
          }

          // Draw solid rocket line (velocity streak)
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.stroke();
        } 
        else {
          // Draw solid, crisp confetti piece
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation + time * p.rotationSpeed);
          
          // 3D flutter illusion
          const flutter = Math.sin(time * p.rotationSpeed * 0.5);
          ctx.scale(flutter, 1);
          
          // Solid opacity until the very end, then quick fade out
          ctx.globalAlpha = p.life > 0.15 ? 1.0 : p.life / 0.15;
          
          ctx.fillStyle = p.color;
          // Render a crisp rectangle (confetti)
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6); // slight rectangle aspect ratio
          
          ctx.restore();
        }
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [intensity]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden" 
      style={{ zIndex: 1 }}
    />
  );
};
