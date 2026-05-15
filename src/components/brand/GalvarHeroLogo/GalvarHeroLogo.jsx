import React, { useEffect, useMemo, useRef } from 'react';
import './GalvarHeroLogo.css';

const SCENE_MS = 7600;
const NEON = '#39ff14';

function generateBolt(width, height) {
  const points = [];
  const startX = Math.random() * width;
  let x = startX;
  let y = -20;
  points.push({ x, y });
  const segments = 10 + Math.floor(Math.random() * 10);
  const stepY = (height * 0.6) / segments;
  for (let i = 0; i < segments; i += 1) {
    x += -34 + Math.random() * 68;
    y += stepY + Math.random() * 10;
    points.push({ x, y });
  }
  return { points, life: 10, alpha: 1 };
}

export default function GalvarHeroLogo() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (typeof window === 'undefined') return;
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    if (!canvas || !scene) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = {
      width: 1,
      height: 1,
      dpr: Math.max(1, Math.min(2, window.devicePixelRatio || 1)),
      bolts: [],
      rafId: 0,
      startTs: now(),
      lastFrameTs: 0,
    };

    const resize = () => {
      const rect = scene.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      state.width = width;
      state.height = height;
      state.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(width * state.dpr);
      canvas.height = Math.floor(height * state.dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    };

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => resize());
      ro.observe(scene);
    } else {
      window.addEventListener('resize', resize);
    }
    resize();

    const draw = () => {
      const tNow = now();
      if (tNow - state.lastFrameTs < 33) {
        state.rafId = window.requestAnimationFrame(draw);
        return;
      }
      state.lastFrameTs = tNow;

      const t = (tNow - state.startTs) % SCENE_MS;
      const p = t / SCENE_MS;
      const isImpactWindow = p > 0.28 && p < 0.38;
      const spawnChance = isImpactWindow ? 0.12 : 0.012;

      ctx.clearRect(0, 0, state.width, state.height);

      if (Math.random() < spawnChance) {
        state.bolts.push(generateBolt(state.width, state.height));
      }

      const nextBolts = [];
      for (const b of state.bolts) {
        b.life -= 1;
        b.alpha *= isImpactWindow ? 0.9 : 0.86;

        const a = Math.max(0, b.alpha);
        if (b.life <= 0 || a < 0.05) continue;

        const pts = b.points;
        ctx.lineCap = 'round';
        ctx.globalAlpha = isImpactWindow ? 1 : 0.9;

        // glow stroke
        ctx.strokeStyle = `rgba(57, 255, 20, ${a * 0.22})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();

        // core stroke
        ctx.strokeStyle = `rgba(57, 255, 20, ${a * 0.75})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();

        nextBolts.push(b);
      }
      state.bolts = nextBolts;
      ctx.globalAlpha = 1;

      state.rafId = window.requestAnimationFrame(draw);
    };

    state.rafId = window.requestAnimationFrame(draw);

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(state.rafId);
    };
  }, [prefersReducedMotion]);

  const showFx = !prefersReducedMotion;

  return (
    <div
      ref={sceneRef}
      className={`galvar-hero-scene ${prefersReducedMotion ? 'galvar-hero-scene--static' : ''}`}
      style={{
        '--neon-green': NEON,
        '--glitch-red': '#ff003c',
        '--glitch-cyan': '#00f2ff',
        '--scene-ms': `${SCENE_MS}ms`,
        '--intro-ms': '2200ms',
      }}
    >
      <div className="galvar-bg-glow" aria-hidden="true" />
      {showFx && <canvas ref={canvasRef} className="galvar-bolts-canvas" aria-hidden="true" />}

      <div className="galvar-hero-content">
        <div className="galvar-hero-mark">
          <span className="galvar-registered" aria-hidden="true">
            R
          </span>

          <div className="galvar-title" aria-label="Galvar">
            <div className="galvar-glitch-layer galvar-glitch-layer--red" aria-hidden="true">
              GALVAR
            </div>
            <div className="galvar-glitch-layer galvar-glitch-layer--cyan" aria-hidden="true">
              GALVAR
            </div>
            <span className="galvar-g">G</span>
            <span className="galvar-rest">ALVAR</span>
          </div>

          <div className="galvar-accent" aria-hidden="true" />

          <div className="galvar-subline" aria-label="Sport">
            <div className="galvar-arrows" aria-hidden="true">
              <svg className="galvar-arrow galvar-arrow--filled" viewBox="0 0 20 20">
                <path d="M5 2 L17 10 L5 18 Z" />
              </svg>
              <svg className="galvar-arrow galvar-arrow--outline" viewBox="0 0 20 20">
                <path d="M5 2 L17 10 L5 18 Z" />
              </svg>
              <svg className="galvar-arrow galvar-arrow--outline" viewBox="0 0 20 20">
                <path d="M5 2 L17 10 L5 18 Z" />
              </svg>
            </div>

            <div className="galvar-sport-wrap">
              <div className="galvar-impact-ring" aria-hidden="true" />
              <div className="galvar-sport">SPORT</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
