'use client';

import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
}

export default function AudioVisualizer({ status }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      if (status === 'idle') {
        // Subtle pulsing ring
        angle += 0.03;
        const radius = 30 + Math.sin(angle) * 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (status === 'listening') {
        // Reactive waveform circle
        angle += 0.1;
        for (let i = 0; i < 5; i++) {
          const radius = 20 + i * 10 + Math.sin(angle + i) * 8;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.8 - i * 0.15})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else if (status === 'thinking') {
        // Gradient shimmer loader rotation
        angle += 0.08;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 1.5);
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      } else if (status === 'speaking') {
        // Frequency bars animation
        angle += 0.15;
        const barCount = 12;
        const radius = 32;
        for (let i = 0; i < barCount; i++) {
          const rad = (i * 2 * Math.PI) / barCount;
          const barHeight = 8 + Math.abs(Math.sin(angle + i)) * 18;
          const x1 = centerX + Math.cos(rad) * radius;
          const y1 = centerY + Math.sin(rad) * radius;
          const x2 = centerX + Math.cos(rad) * (radius + barHeight);
          const y2 = centerY + Math.sin(rad) * (radius + barHeight);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [status]);

  return (
    <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-slate-900/80 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md">
      <canvas ref={canvasRef} width={96} height={96} className="absolute inset-0" />
      <div className="z-10 text-xs font-mono text-cyan-400 uppercase tracking-widest">
        {status}
      </div>
    </div>
  );
}
