"use client";

import React, { useEffect, useRef } from "react";
import { AgentStatus } from "@/types";

interface JarvisHologramProps {
  status: AgentStatus;
  className?: string;
}

// ============================================
// JARVIS HOLOGRAM — animated reactive orb
// Inspired by the classic Iron Man JARVIS interface.
// Rows of arcs/rings respond to the agent's state.
// ============================================

const PHI = Math.PI * 2;

export default function JarvisHologram({ status, className = "" }: JarvisHologramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const render = (timestamp: number) => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      timeRef.current += 0.016;
      const t = timeRef.current;

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.34;

      const listening = status === "listening";
      const speaking = status === "speaking";
      const thinking = status === "thinking";
      const connecting = status === "connecting";
      const active = listening || speaking || thinking;
      const pulse = connecting ? 1 : active ? 1 : 0.55;

      const color = [94, 190, 255];
      const [r, g, b] = color;

      // ============ Core glow orb ============
      const glow = speaking ? 0.55 : active ? 0.35 : 0.18;
      const coreR =
        R * 0.28 *
        (speaking ? 1 + Math.sin(t * 28) * 0.12 + Math.sin(t * 13) * 0.08 : active ? 1 + Math.sin(t * 9) * 0.06 : 1);

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.2);
      grad.addColorStop(0, `rgba(${r},${g},${b},${glow})`);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},${glow * 0.5})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 2.2, 0, PHI);
      ctx.fill();

      // Core disc
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.5 * pulse})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, PHI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 0.5, 0, PHI);
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.25 * pulse})`;
      ctx.stroke();

      // ============ Rings ============
      const ringCount = speaking ? 4 : 3;
      for (let i = 0; i < ringCount; i++) {
        const ringR = R * (0.7 - i * 0.14);
        const speed = speaking ? 1.6 + i * 0.6 : thinking ? 1.1 + i * 0.4 : 0.7 + i * 0.3;
        const dir = i % 2 === 0 ? 1 : -1;
        const frac = (t * speed + i * 0.7) % 1;
        const arcSpan = speaking ? 0.5 : 0.38;
        const start = frac * PHI;
        const end = start + arcSpan * PHI;

        // Orbit dot
        const ox = cx + Math.cos(start) * ringR;
        const oy = cy + Math.sin(start) * ringR;
        ctx.beginPath();
        ctx.arc(ox, oy, 2.4, 0, PHI);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.95 * pulse})`;
        ctx.fill();

        // Trailing arc
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.5 * pulse})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, dir > 0 ? start : end, dir > 0 ? end : start);
        ctx.stroke();

        // Faint full ring
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.12 * pulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, PHI);
        ctx.stroke();
      }

      // ============ Vertical meridian arcs (sphere feel) ============
      for (let v = -1; v <= 1; v++) {
        const ecc = R * 0.34 * Math.sqrt(1 - v * v);
        const shrink = 0.35 + Math.abs(v) * 0.65;
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.22 * pulse * shrink})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, ecc, R * 0.8, 0, 0, PHI);
        ctx.stroke();
      }
      // Horizontal equator
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.2 * pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 0.62, R * 0.2, 0, 0, PHI);
      ctx.stroke();

      // ============ Sweeping scan beam ============
      const scan = (t * 1.8) % 1;
      const sy = cy - R * 0.7 + scan * R * 1.4;
      const beamGrad = ctx.createLinearGradient(0, sy - 8, 0, sy + 8);
      beamGrad.addColorStop(0, "rgba(0,0,0,0)");
      beamGrad.addColorStop(0.5, `rgba(${r},${g},${b},${0.16 * pulse})`);
      beamGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = beamGrad;
      ctx.fillRect(cx - R, sy - 8, R * 2, 16);

      // ============ Data particles ============
      const particleCount = thinking ? 40 : speaking ? 30 : 16;
      for (let i = 0; i < particleCount; i++) {
        const seed = i * 137.508;
        const ang = seed + t * (0.4 + (i % 3) * 0.12);
        const rad = R * (0.4 + 0.55 * ((Math.sin(seed * 1.7 + t * 1.2) + 1) / 2));
        const px = cx + Math.cos(ang) * rad;
        const py = cy + Math.sin(ang) * rad * 0.4;
        const size = 0.6 + Math.sin(t * 3 + seed) * 0.5;
        const pAlpha = (0.12 + Math.sin(t * 2 + seed) * 0.08) * pulse;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, PHI);
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.max(0, pAlpha)})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
