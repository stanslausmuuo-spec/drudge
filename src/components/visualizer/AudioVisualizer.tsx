"use client";

import React, { useEffect, useRef } from "react";
import { AgentStatus } from "@/types";

interface VisualizerProps {
  status: AgentStatus;
}

export default function AudioVisualizer({ status }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      if (status === "idle" || status === "disconnected" || status === "connecting") {
        angle += 0.02;
        const r = 28 + Math.sin(angle) * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle =
          status === "disconnected"
            ? "rgba(100, 116, 139, 0.3)"
            : status === "connecting"
            ? "rgba(251, 191, 36, 0.4)"
            : "rgba(59, 130, 246, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (status === "listening") {
        angle += 0.08;
        for (let i = 0; i < 3; i++) {
          const r = 22 + i * 8 + Math.sin(angle + i * 0.8) * 5;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.5 - i * 0.15})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      } else if (status === "thinking") {
        angle += 0.06;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 1.4);
        ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
      } else if (status === "speaking") {
        angle += 0.12;
        const barCount = 10;
        const radius = 30;
        for (let i = 0; i < barCount; i++) {
          const rad = (i * 2 * Math.PI) / barCount;
          const barH = 5 + Math.abs(Math.sin(angle + i * 0.6)) * 14;
          const x1 = cx + Math.cos(rad) * radius;
          const y1 = cy + Math.sin(rad) * radius;
          const x2 = cx + Math.cos(rad) * (radius + barH);
          const y2 = cy + Math.sin(rad) * (radius + barH);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = "rgba(6, 182, 212, 0.7)";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
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

  const borderColor =
    status === "speaking"
      ? "border-cyan-500/30"
      : status === "listening"
      ? "border-cyan-500/20"
      : status === "thinking"
      ? "border-blue-500/25"
      : status === "connecting"
      ? "border-amber-500/20"
      : "border-white/5";

  return (
    <div
      className={`relative flex items-center justify-center w-20 h-20 rounded-full glass border ${borderColor} transition-colors duration-500`}
    >
      <canvas ref={canvasRef} width={80} height={80} className="absolute inset-0" />
      <span className="z-10 text-[9px] font-mono text-slate-400 uppercase tracking-[0.15em] select-none">
        {status}
      </span>
    </div>
  );
}
