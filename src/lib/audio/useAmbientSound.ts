"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Generates ambient sound using Web Audio API.
 * - Paper rustle: filtered white noise burst (plays on mount)
 * - Ink stroke: low-frequency noise sweep (plays on response)
 *
 * All generated procedurally — no external audio files needed.
 */
export function useAmbientSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Paper rustle — subtle noise burst on page load
  const playPaperRustle = useCallback(() => {
    try {
      const ctx = getCtx();
      const duration = 0.8;
      const sampleRate = ctx.sampleRate;
      const length = sampleRate * duration;
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      // Brown noise (more natural than white noise)
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }

      // Envelope — soft fade in/out
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const env = Math.sin(t * Math.PI); // triangle envelope
        data[i] *= env * 0.06; // very quiet
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Bandpass filter — paper frequencies (1-4kHz)
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 2500;
      filter.Q.value = 0.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(ctx.currentTime);
      source.stop(ctx.currentTime + duration);
    } catch {
      // Audio not available
    }
  }, [getCtx]);

  // Ink stroke — low frequency whoosh for response
  const playInkStroke = useCallback(() => {
    try {
      const ctx = getCtx();
      const duration = 1.2;
      const sampleRate = ctx.sampleRate;
      const length = sampleRate * duration;
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      // Pink noise — warmer, more natural
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      // Envelope — smooth sweep
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const attack = Math.min(t * 5, 1);
        const release = 1 - Math.pow(t, 3);
        data[i] *= attack * release * 0.04;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Lowpass — muffled ink sound
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(ctx.currentTime);
      source.stop(ctx.currentTime + duration);
    } catch {
      // Audio not available
    }
  }, [getCtx]);

  // Soft key click — for interactions
  const playKeyClick = useCallback(() => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(2200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio not available
    }
  }, [getCtx]);

  // Play paper rustle on first interaction (unlock AudioContext)
  useEffect(() => {
    const unlock = () => {
      playPaperRustle();
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };

    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });

    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, [playPaperRustle]);

  return { playPaperRustle, playInkStroke, playKeyClick };
}
