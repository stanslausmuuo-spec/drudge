"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { AgentStatus } from "@/types";

interface InkStrokeProps {
  status: AgentStatus;
  audioData?: Uint8Array;
  volume?: number;
  className?: string;
}

// ============================================
// ORGANIC NOISE — for realistic ink behavior
// ============================================

function hash(x: number): number {
  let h = x * 127.1 + 311.7;
  h = Math.sin(h) * 43758.5453;
  return h - Math.floor(h);
}

function noise1D(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f); // smoothstep
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

function fbm(x: number, octaves: number = 5): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += amp * noise1D(x * freq);
    amp *= 0.5;
    freq *= 2.1;
  }
  return value;
}

// Warped noise — ink flows through itself
function warpedNoise(x: number, time: number, warp: number = 0.3): number {
  const offset = fbm(x * 0.5 + time * 0.1, 3) * warp;
  return fbm(x + offset, 4);
}

// ============================================
// INK STROKE RENDERER
// ============================================

export default function InkStroke({ status, audioData, volume = 0, className = "" }: InkStrokeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const prevStatusRef = useRef<AgentStatus>(status);
  const transitionRef = useRef(1);
  const fpsRef = useRef(15);
  const lastFrameRef = useRef(0);

  const isIdle = status === "idle" || status === "disconnected";
  const isTransitioning = prevStatusRef.current !== status;

  const getConfig = useCallback(() => {
    switch (status) {
      case "idle":
        return {
          amplitude: 1.5,
          frequency: 0.8,
          speed: 0.002,
          baseWidth: 2.0,
          opacity: 0.1,
          bleed: 0,
          particles: 0,
          irregularity: 0.3,
          color: [26, 26, 26],
        };
      case "connecting":
        return {
          amplitude: 2,
          frequency: 1.2,
          speed: 0.008,
          baseWidth: 1.8,
          opacity: 0.15,
          bleed: 1,
          particles: 0,
          irregularity: 0.5,
          color: [106, 90, 58],
        };
      case "listening":
        return {
          amplitude: 5,
          frequency: 1.0,
          speed: 0.015,
          baseWidth: 2.5,
          opacity: 0.4,
          bleed: 2,
          particles: 4,
          irregularity: 0.7,
          color: [26, 26, 26],
        };
      case "thinking":
        return {
          amplitude: 3,
          frequency: 1.8,
          speed: 0.02,
          baseWidth: 2.2,
          opacity: 0.3,
          bleed: 1.5,
          particles: 10,
          irregularity: 0.6,
          color: [26, 26, 26],
        };
      case "speaking":
        return {
          amplitude: 7,
          frequency: 1.2,
          speed: 0.018,
          baseWidth: 3.0,
          opacity: 0.55,
          bleed: 3,
          particles: 3,
          irregularity: 0.8,
          color: [26, 26, 26],
        };
      default:
        return {
          amplitude: 1.5,
          frequency: 0.8,
          speed: 0.002,
          baseWidth: 2.0,
          opacity: 0.1,
          bleed: 0,
          particles: 0,
          irregularity: 0.3,
          color: [26, 26, 26],
        };
    }
  }, [status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Track transitions
    if (isTransitioning) {
      transitionRef.current = 0;
      prevStatusRef.current = status;
    }

    const render = (timestamp: number) => {
      // FPS throttling — 15fps idle, 60fps active
      const targetFps = isIdle ? 15 : 60;
      const frameInterval = 1000 / targetFps;
      const elapsed = timestamp - lastFrameRef.current;

      if (elapsed < frameInterval) {
        animRef.current = requestAnimationFrame(render);
        return;
      }
      lastFrameRef.current = timestamp - (elapsed % frameInterval);

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      const config = getConfig();
      const [r, g, b] = config.color;

      // Audio-reactive boost
      let audioBoost = 0;
      if (audioData && status === "listening") {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) sum += audioData[i];
        audioBoost = (sum / audioData.length / 255) * 10;
      }
      if ((status === "speaking" || status === "listening") && volume > 0) {
        audioBoost = Math.max(audioBoost, volume * 15);
      }

      // Transition easing
      transitionRef.current = Math.min(transitionRef.current + 0.015, 1);
      const t = transitionRef.current;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      timeRef.current += config.speed;
      const time = timeRef.current;

      ctx.clearRect(0, 0, w, h);

      const midY = h / 2;
      const segments = 150;
      const totalAmplitude = config.amplitude + audioBoost;

      // ============================================
      // LAYER 1: WET BLEED — ink soaking into paper
      // ============================================
      if (config.bleed > 0) {
        for (let bl = 0; bl < 4; bl++) {
          const spread = config.bleed * (bl + 1) * 2.5;
          const layerOpacity = config.opacity * 0.06 * eased / (bl + 1);

          ctx.beginPath();
          for (let i = 0; i <= segments; i++) {
            const x = (i / segments) * w;
            const nx = i / segments;

            // Very slow, wide noise for bleed
            const n = fbm(nx * 0.3 + time * 0.15 + bl * 10, 3);
            const taper = Math.pow(Math.sin(nx * Math.PI), 3);

            const y = midY + (n - 0.5) * totalAmplitude * 2.5 * taper + (bl - 1.5) * spread * 0.2;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${layerOpacity})`;
          ctx.lineWidth = config.baseWidth + spread * 1.5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.filter = `blur(${spread}px)`;
          ctx.stroke();
          ctx.filter = "none";
        }
      }

      // ============================================
      // LAYER 2: MAIN STROKE — variable width ink
      // ============================================
      // We draw the stroke as a filled shape with variable width
      ctx.beginPath();

      const topPoints: [number, number][] = [];
      const bottomPoints: [number, number][] = [];

      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * w;
        const nx = i / segments;

        // Organic path displacement
        const warp1 = warpedNoise(nx * 2 + time, time, config.irregularity * 0.5);
        const warp2 = warpedNoise(nx * 4 + time * 0.7, time * 0.8, config.irregularity * 0.3);

        // Edge irregularity — real ink has rough edges
        const edgeNoise1 = fbm(nx * 8 + time * 0.3, 3) * config.irregularity;
        const edgeNoise2 = fbm(nx * 12 + time * 0.2 + 50, 3) * config.irregularity * 0.7;

        // Taper — realistic brush lift at start and end
        const taper = Math.pow(Math.sin(nx * Math.PI), 1.5);

        // Thickness varies along stroke — thicker where brush slows
        const speedNoise = fbm(nx * 2 + time * 0.4, 2);
        const thickness = (0.6 + speedNoise * 0.8) * taper;

        // Width modulation
        const halfWidth = config.baseWidth * thickness * eased;

        // Y position
        const yOffset = ((warp1 - 0.5) * 0.6 + (warp2 - 0.5) * 0.4) * totalAmplitude * 2 * taper;
        const y = midY + yOffset;

        // Top and bottom edges with irregularity
        topPoints.push([x, y - halfWidth - edgeNoise1 * halfWidth * 0.5]);
        bottomPoints.push([x, y + halfWidth + edgeNoise2 * halfWidth * 0.5]);
      }

      // Draw top edge forward
      ctx.moveTo(topPoints[0][0], topPoints[0][1]);
      for (let i = 1; i < topPoints.length; i++) {
        const prev = topPoints[i - 1];
        const curr = topPoints[i];
        const cpx = (prev[0] + curr[0]) / 2;
        ctx.quadraticCurveTo(prev[0], prev[1], cpx, (prev[1] + curr[1]) / 2);
      }
      ctx.lineTo(topPoints[topPoints.length - 1][0], topPoints[topPoints.length - 1][1]);

      // Draw bottom edge backward
      ctx.lineTo(bottomPoints[bottomPoints.length - 1][0], bottomPoints[bottomPoints.length - 1][1]);
      for (let i = bottomPoints.length - 2; i >= 0; i--) {
        const next = bottomPoints[i + 1];
        const curr = bottomPoints[i];
        const cpx = (next[0] + curr[0]) / 2;
        ctx.quadraticCurveTo(next[0], next[1], cpx, (next[1] + curr[1]) / 2);
      }
      ctx.closePath();

      // Fill with gradient — darker in center, lighter at edges (ink pooling)
      const gradient = ctx.createLinearGradient(0, midY - config.baseWidth * 2, 0, midY + config.baseWidth * 2);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
      gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, ${config.opacity * eased * 0.3})`);
      gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${config.opacity * eased * 0.7})`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${config.opacity * eased})`);
      gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${config.opacity * eased * 0.7})`);
      gradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${config.opacity * eased * 0.3})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.fill();

      // ============================================
      // LAYER 3: INK POOLING — accumulation at low points
      // ============================================
      for (let i = 0; i < segments; i += 3) {
        const nx = i / segments;
        const warp = warpedNoise(nx * 2 + time, time, config.irregularity * 0.5);
        const taper = Math.pow(Math.sin(nx * Math.PI), 1.5);
        const yOffset = (warp - 0.5) * totalAmplitude * 2 * taper;

        // Pooling happens at valleys (where the stroke dips)
        const nextWarp = warpedNoise(((i + 3) / segments) * 2 + time, time, config.irregularity * 0.5);
        const prevWarp = warpedNoise(((i - 3) / segments) * 2 + time, time, config.irregularity * 0.5);
        const isValley = warp > nextWarp && warp > prevWarp;

        if (isValley && taper > 0.3) {
          const poolSize = config.baseWidth * (0.5 + taper * 0.5) * eased;
          const px = nx * w;
          const py = midY + yOffset;

          ctx.beginPath();
          ctx.ellipse(px, py, poolSize * 1.5, poolSize * 0.6, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${config.opacity * eased * 0.15})`;
          ctx.fill();
        }
      }

      // ============================================
      // LAYER 4: EDGE SPATTER — ink flick off brush
      // ============================================
      if (config.irregularity > 0.4) {
        const spatterCount = Math.floor(config.irregularity * 15);
        for (let i = 0; i < spatterCount; i++) {
          const seed = i * 73.97;
          const nx = fbm(seed, 2);
          const warp = warpedNoise(nx * 2 + time, time, config.irregularity * 0.5);
          const taper = Math.pow(Math.sin(nx * Math.PI), 1.5);
          const yCenter = midY + (warp - 0.5) * totalAmplitude * 2 * taper;

          const spreadX = (fbm(seed + 200, 2) - 0.5) * config.baseWidth * 4;
          const spreadY = (fbm(seed + 300, 2) - 0.5) * config.baseWidth * 3;

          const sx = nx * w + spreadX;
          const sy = yCenter + spreadY;
          const dotSize = 0.3 + fbm(seed + 400, 2) * 1.2;
          const dotOpacity = config.opacity * eased * (0.05 + fbm(seed + 500, 2) * 0.1);

          ctx.beginPath();
          ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dotOpacity})`;
          ctx.fill();
        }
      }

      // ============================================
      // LAYER 5: PARTICLES — floating ink fragments
      // ============================================
      if (config.particles > 0) {
        for (let i = 0; i < config.particles; i++) {
          const seed = i * 137.508;
          const px = (fbm(time * 0.6 + seed, 2) * 0.5 + 0.25) * w;
          const py = midY + (fbm(time * 0.9 + seed, 3) - 0.5) * totalAmplitude * 4;
          const size = 0.5 + fbm(time * 0.5 + seed, 2) * 2.5;
          const particleOpacity = (0.1 + fbm(time * 1.5 + seed, 2) * 0.2) * eased;

          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particleOpacity})`;
          ctx.fill();
        }
      }

      // ============================================
      // LAYER 6: DYNAMIC SPLATTER — speaking burst
      // ============================================
      if (status === "speaking" && audioBoost > 3) {
        const burstCount = Math.floor(audioBoost / 2);
        for (let i = 0; i < burstCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 3 + Math.random() * 20;
          const sx = w * 0.3 + Math.random() * w * 0.4 + Math.cos(angle) * dist;
          const sy = midY + Math.sin(angle) * dist * 0.4;
          const splatterSize = 0.3 + Math.random() * 2;

          ctx.beginPath();
          ctx.arc(sx, sy, splatterSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.06 + Math.random() * 0.1})`;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [status, audioData, volume, getConfig, isIdle, isTransitioning]);

  const statusLabel = (() => {
    switch (status) {
      case "idle": return "idle";
      case "connecting": return "connecting";
      case "listening": return "listening";
      case "thinking": return "thinking";
      case "speaking": return "speaking";
      default: return "";
    }
  })();

  return (
    <div className={`relative w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: "80px" }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className="font-mono text-[9px] uppercase tracking-[0.2em] select-none transition-all duration-1000"
          style={{
            color: status === "idle" ? "rgba(26,26,26,0.15)" : "rgba(26,26,26,0.3)",
            opacity: status === "idle" ? 0.5 : 1,
          }}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
