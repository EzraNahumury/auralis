"use client";

import { useEffect, useRef, useState } from "react";

const TARGET = 812;
const PERIOD_MS = 6500;

export function ReputationGauge() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let started = performance.now();
    let lastSetScore = -1;

    function sizeUp() {
      const r = wrap!.getBoundingClientRect();
      W = Math.max(240, r.width);
      H = Math.max(160, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame(t: number) {
      if (!running) return;
      ctx!.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H * 0.86;
      const radius = Math.min(W * 0.42, H * 0.78);

      // outer arc background
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, Math.PI, Math.PI * 2);
      ctx!.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      // tick marks every 50 score
      const totalTicks = 40;
      for (let i = 0; i <= totalTicks; i++) {
        const a = Math.PI + (i / totalTicks) * Math.PI;
        const r1 = radius;
        const r2 = i % 4 === 0 ? radius - 14 : radius - 7;
        ctx!.beginPath();
        ctx!.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx!.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        ctx!.strokeStyle =
          i % 4 === 0
            ? "rgba(220, 224, 240, 0.72)"
            : "rgba(255, 255, 255, 0.28)";
        ctx!.lineWidth = i % 4 === 0 ? 1.4 : 0.8;
        ctx!.stroke();
      }

      // tier labels
      const tiers = [
        { v: 0, label: "0" },
        { v: 250, label: "250" },
        { v: 500, label: "500" },
        { v: 750, label: "750" },
        { v: 1000, label: "1K" },
      ];
      ctx!.fillStyle = "rgba(201, 211, 207, 0.55)";
      ctx!.font =
        "500 9px var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace";
      ctx!.textBaseline = "middle";
      for (const tier of tiers) {
        const a = Math.PI + (tier.v / 1000) * Math.PI;
        const r = radius - 30;
        ctx!.textAlign = "center";
        ctx!.fillText(tier.label, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }

      // continuous oscillation: smoothly sweep 0 → TARGET → 0 forever
      const elapsed = t - started;
      const phase = (elapsed / PERIOD_MS) * Math.PI * 2;
      const progress = (1 - Math.cos(phase)) / 2;
      const liveScore = Math.floor(progress * TARGET);

      // filled arc
      const fillAngle = Math.PI + (liveScore / 1000) * Math.PI;
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, Math.PI, fillAngle);
      const grad = ctx!.createLinearGradient(cx - radius, cy, cx + radius, cy);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      grad.addColorStop(0.5, "rgba(255, 255, 255, 0.78)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0.95)");
      ctx!.strokeStyle = grad;
      ctx!.lineWidth = 2.6;
      ctx!.lineCap = "round";
      ctx!.stroke();

      // needle
      const ndlA = fillAngle;
      const ndlLen = radius - 10;
      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(cx + Math.cos(ndlA) * ndlLen, cy + Math.sin(ndlA) * ndlLen);
      ctx!.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx!.lineWidth = 1.4;
      ctx!.stroke();

      // hub
      ctx!.beginPath();
      ctx!.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx!.fillStyle = "#0f0f0f";
      ctx!.fill();
      ctx!.lineWidth = 1.2;
      ctx!.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx!.stroke();

      // sync state for the score pill (throttled by closure var, not React state)
      if (Math.abs(liveScore - lastSetScore) >= 6) {
        lastSetScore = liveScore;
        setScore(liveScore);
      }

      raf = requestAnimationFrame(frame);
    }

    sizeUp();
    const ro = new ResizeObserver(() => {
      sizeUp();
    });
    ro.observe(wrap);
    started = performance.now();
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const tier =
    score >= 750
      ? "Platinum"
      : score >= 500
        ? "Gold"
        : score >= 250
          ? "Silver"
          : "Bronze";

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full border border-border-strong bg-surface/85 px-3.5 py-1.5 backdrop-blur-md">
          <span
            className="text-base font-semibold tracking-tight text-fg"
            style={{
              fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
            }}
          >
            {score}
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.18em] text-fg-dim"
            style={{
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            }}
          >
            {tier}
          </span>
        </div>
      </div>
    </div>
  );
}
