"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight interactive canvas: floating plot nodes + soft connections.
 * Coastal Trust palette. Respects prefers-reduced-motion.
 */
export function CoastalCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let w = 0;
    let h = 0;
    let mouseX = 0.5;
    let mouseY = 0.35;
    let time = 0;

    type Node = { x: number; y: number; vx: number; vy: number; r: number; pulse: number };
    let nodes: Node[] = [];

    const isDark = () => document.documentElement.classList.contains("dark");

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(48, Math.floor((w * h) / 18000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1.5 + Math.random() * 2.5,
        pulse: Math.random() * Math.PI * 2,
      }));
    }

    function draw() {
      time += 0.008;
      ctx!.clearRect(0, 0, w, h);

      const dark = isDark();
      const teal = dark ? "94, 200, 200" : "13, 115, 119";
      const sand = dark ? "201, 168, 76" : "232, 184, 109";

      // Soft horizon wash
      const grad = ctx!.createRadialGradient(
        w * (0.5 + (mouseX - 0.5) * 0.08),
        h * 0.15,
        0,
        w * 0.5,
        h * 0.2,
        Math.max(w, h) * 0.75
      );
      grad.addColorStop(0, `rgba(${teal}, ${dark ? 0.14 : 0.1})`);
      grad.addColorStop(0.45, `rgba(${sand}, ${dark ? 0.04 : 0.05})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w, h);

      // Plot grid (subtle)
      ctx!.strokeStyle = dark ? "rgba(255,255,255,0.03)" : "rgba(13,115,119,0.06)";
      ctx!.lineWidth = 1;
      const cell = 56;
      const ox = ((mouseX - 0.5) * 12) % cell;
      const oy = ((mouseY - 0.5) * 8) % cell;
      for (let x = ox; x < w; x += cell) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, h);
        ctx!.stroke();
      }
      for (let y = oy; y < h; y += cell) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(w, y);
        ctx!.stroke();
      }

      // Connections
      const maxDist = 130;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < maxDist) {
            const alpha = (1 - d / maxDist) * (dark ? 0.18 : 0.14);
            ctx!.strokeStyle = `rgba(${teal}, ${alpha})`;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      // Nodes
      for (const n of nodes) {
        if (!reduced) {
          n.x += n.vx;
          n.y += n.vy;
          // gentle mouse attraction
          n.x += (mouseX * w - n.x) * 0.0004;
          n.y += (mouseY * h - n.y) * 0.0004;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }

        const pulse = 0.65 + 0.35 * Math.sin(time * 2 + n.pulse);
        const r = n.r * pulse;

        ctx!.beginPath();
        ctx!.arc(n.x, n.y, r * 3.2, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${sand}, ${dark ? 0.08 : 0.1})`;
        ctx!.fill();

        ctx!.beginPath();
        ctx!.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${teal}, ${dark ? 0.75 : 0.55})`;
        ctx!.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width;
      mouseY = (e.clientY - rect.top) / rect.height;
    }

    function onTouch(e: TouchEvent) {
      if (!e.touches[0]) return;
      const rect = canvas!.getBoundingClientRect();
      mouseX = (e.touches[0].clientX - rect.left) / rect.width;
      mouseY = (e.touches[0].clientY - rect.top) / rect.height;
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onTouch, { passive: true });

    const mo = new MutationObserver(() => {
      /* theme class changes — next frame picks it up */
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchmove", onTouch);
      mo.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full pointer-events-auto"
      aria-hidden
    />
  );
}
