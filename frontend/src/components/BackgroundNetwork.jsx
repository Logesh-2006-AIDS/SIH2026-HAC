import React, { useEffect, useRef } from 'react';

export default function BackgroundNetwork() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Generate subtle investigation particles
    const particleCount = Math.min(Math.floor((width * height) / 24000), 40);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.8 + 1.2,
      // Gold, red connection pin colors, or parchment cream
      color: Math.random() > 0.65 ? '#D62828' : Math.random() > 0.35 ? '#D9AA3D' : '#E8D9A8',
      alpha: Math.random() * 0.28 + 0.15,
    }));

    let radarAngle = 0;

    // Draw loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Forest Green Investigation Board Texture Grid
      const gridSize = 52;
      ctx.strokeStyle = 'rgba(216, 197, 138, 0.035)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Subtle Radar Sweep Circle in Center Background
      const cx = width / 2;
      const cy = height / 2;
      const radarRadius = Math.min(width, height) * 0.38;

      ctx.beginPath();
      ctx.arc(cx, cy, radarRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(217, 170, 61, 0.04)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (!prefersReducedMotion) {
        radarAngle += 0.003;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radarRadius, radarAngle, radarAngle + 0.3);
        ctx.closePath();
        ctx.fillStyle = 'rgba(217, 170, 61, 0.025)';
        ctx.fill();
      }

      // 3. Draw Evidence Nodes & Red Investigation Strings
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }

        // Draw node pin dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Connect nearby evidence nodes with red investigation strings / gold ties
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 135) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const lineAlpha = (1 - dist / 135) * 0.12;
            // Red investigation string or gold wire
            ctx.strokeStyle = (i + j) % 3 === 0 ? '#D62828' : '#D9AA3D';
            ctx.globalAlpha = lineAlpha;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.9,
      }}
    />
  );
}
