import React, { useMemo } from 'react';

export default function BackgroundNetwork() {
  // Static radar blip coordinates (representing distant nodes waiting to be discovered)
  const blips = useMemo(() => [
    { top: '16%', left: '24%', size: 3.5, opacity: 0.25, color: '#d9aa3d' },
    { top: '26%', left: '76%', size: 4, opacity: 0.22, color: '#d62828' },
    { top: '64%', left: '16%', size: 3, opacity: 0.18, color: '#38bdf8' },
    { top: '74%', left: '84%', size: 4.5, opacity: 0.28, color: '#d9aa3d' },
    { top: '36%', left: '44%', size: 2.5, opacity: 0.2, color: '#5e9f68' },
    { top: '52%', left: '66%', size: 3.5, opacity: 0.24, color: '#d9aa3d' },
    { top: '82%', left: '48%', size: 3, opacity: 0.18, color: '#d62828' },
    { top: '12%', left: '60%', size: 3, opacity: 0.2, color: '#d9aa3d' },
    { top: '46%', left: '88%', size: 4, opacity: 0.22, color: '#38bdf8' },
    { top: '70%', left: '32%', size: 3, opacity: 0.19, color: '#5e9f68' },
  ], []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0"
      style={{
        background: 'transparent',
      }}
    >
      {/* 1. Tactical Grid Texture Overlay */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(217, 170, 61, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(217, 170, 61, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* 2. Centered Circular Radar Concentric Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] max-w-[95vw] max-h-[95vw] rounded-full pointer-events-none flex items-center justify-center">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border border-[rgba(217,170,61,0.08)] shadow-[0_0_50px_rgba(217,170,61,0.03)]" />

        {/* Mid Ring */}
        <div className="absolute inset-[18%] rounded-full border border-[rgba(217,170,61,0.06)] border-dashed" />

        {/* Inner Ring */}
        <div className="absolute inset-[38%] rounded-full border border-[rgba(217,170,61,0.06)]" />

        {/* Core Center Crosshair Dot */}
        <div className="w-2 h-2 rounded-full bg-[rgba(217,170,61,0.35)] shadow-[0_0_8px_rgba(217,170,61,0.5)]" />

        {/* Horizontal & Vertical Crosshairs */}
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-[rgba(217,170,61,0.06)] to-transparent" />
        <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-[rgba(217,170,61,0.06)] to-transparent" />

        {/* 3. Continuously Rotating Radar / Lighthouse Beam */}
        <div
          className="absolute inset-0 rounded-full animate-radar-lighthouse pointer-events-none"
          style={{
            background: `conic-gradient(
              from 0deg at 50% 50%,
              rgba(217, 170, 61, 0.09) 0deg,
              rgba(217, 170, 61, 0.04) 28deg,
              rgba(217, 170, 61, 0.01) 50deg,
              transparent 70deg,
              transparent 360deg
            )`,
            transformOrigin: '50% 50%',
          }}
        >
          {/* Thin leading bright edge of the rotating beam */}
          <div
            className="absolute top-0 left-1/2 w-[1px] h-1/2 origin-bottom bg-gradient-to-t from-transparent via-[rgba(217,170,61,0.3)] to-[rgba(217,170,61,0.55)]"
            style={{ transform: 'translateX(-50%)' }}
          />
        </div>
      </div>

      {/* 4. Static Radar Blip Nodes (Distant nodes waiting to be discovered) */}
      {blips.map((blip, idx) => (
        <div
          key={idx}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: blip.top,
            left: blip.left,
            width: `${blip.size}px`,
            height: `${blip.size}px`,
            backgroundColor: blip.color,
            opacity: blip.opacity,
            boxShadow: `0 0 6px ${blip.color}`,
          }}
        />
      ))}
    </div>
  );
}
