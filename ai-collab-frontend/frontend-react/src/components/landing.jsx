import React, { useState, useEffect, useRef, useCallback } from 'react';
// Adjust this path to wherever Auth.jsx actually lives relative to Landing.jsx
// (e.g. if both are in /components, this is correct as './Auth')
import { AuthModal } from './Auth';

// ── Starfield Canvas ──────────────────────────────────────────────────────────
// FIX: this canvas is `position: fixed`, which means it only ever occupies the
// viewport — it does NOT grow with the page. The original code sized its
// internal resolution to `document.body.scrollHeight` (the full page height)
// while its CSS box stayed pinned to the viewport. That mismatch forced the
// browser to squash the whole starfield into the visible viewport area,
// which both looked wrong and doesn't affect scrolling — but is worth fixing
// while we're in here. Now it's simply sized to the viewport, which is all a
// `fixed` element ever needs.
function StarCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const starsRef = useRef([]);
  const shootingRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generate stars (slightly denser + a few more warm/cool tones for depth)
    starsRef.current = Array.from({ length: 320 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.2,
      alpha: Math.random() * 0.75 + 0.15,
      twinkleSpeed: Math.random() * 0.012 + 0.003,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: Math.random() > 0.88 ? '#c4b5fd' : Math.random() > 0.75 ? '#93c5fd' : Math.random() > 0.7 ? '#fbcfe8' : '#ffffff',
    }));

    let lastShoot = 0;
    let t = 0;

    const spawnShoot = () => {
      const startX = Math.random() * W * 0.6 + W * 0.1;
      const startY = Math.random() * H * 0.4;
      shootingRef.current.push({
        x: startX, y: startY,
        vx: 5 + Math.random() * 5,
        vy: 2 + Math.random() * 3,
        len: 120 + Math.random() * 80,
        alpha: 1, life: 1,
      });
    };

    const draw = (ts) => {
      ctx.clearRect(0, 0, W, H);
      t += 0.016;

      // Stars
      starsRef.current.forEach(s => {
        const a = s.alpha * (0.5 + 0.5 * Math.sin(t * s.twinkleSpeed * 60 + s.twinkleOffset));
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 0.9 && a > 0.6) {
          ctx.globalAlpha = a * 0.25;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Shooting stars
      if (ts - lastShoot > 18000 + Math.random() * 10000) {
        spawnShoot(); lastShoot = ts;
      }
      shootingRef.current = shootingRef.current.filter(s => s.life > 0);
      shootingRef.current.forEach(s => {
        s.x += s.vx; s.y += s.vy; s.life -= 0.022;
        ctx.save();
        ctx.globalAlpha = s.life * 0.85;
        const grad = ctx.createLinearGradient(s.x - s.vx * 8, s.y - s.vy * 8, s.x, s.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, '#e0d4ff');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x - s.vx * 8, s.y - s.vy * 8);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', width: '100%', height: '100%' }} />;
}

// ── Floating Planet ───────────────────────────────────────────────────────────
function Planet({ size, color, ringColor, top, left, right, bottom, delay = 0, duration = 18, zIndex = 1, opacity = 0.85, dotted = false }) {
  return (
    <div style={{
      position: 'absolute', top, left, right, bottom,
      width: size, height: size,
      animation: `planetFloat ${duration}s ease-in-out ${delay}s infinite`,
      zIndex,
      opacity,
      pointerEvents: 'none',
    }}>
      {/* Dotted orbit ring — decorative, sits behind the planet */}
      {dotted && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: size * 1.9, height: size * 1.9,
          border: '1.5px dashed rgba(167,139,250,0.25)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          animation: `orbitSpin ${duration * 2.5}s linear infinite`,
        }} />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        background: color,
        boxShadow: `inset -${size * 0.15}px -${size * 0.08}px 0 rgba(0,0,0,0.4), 0 0 ${size * 0.6}px ${size * 0.1}px ${ringColor}40`,
      }}>
        {ringColor && (
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: size * 2.2, height: size * 0.35,
            border: `2px solid ${ringColor}60`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%) rotateX(75deg)',
            boxShadow: `0 0 8px ${ringColor}30`,
          }} />
        )}
      </div>
    </div>
  );
}

// ── Small sparkle field (scattered ✦ accents, like starry confetti) ───────────
function SparkleField({ items }) {
  return (
    <>
      {items.map(([top, left, size, delay, dur], i) => (
        <div key={i} style={{
          position: 'absolute', top, left,
          fontSize: size, color: 'rgba(196,181,253,0.6)',
          animation: `sparkle ${dur}s ease-in-out ${delay}s infinite`,
          pointerEvents: 'none', zIndex: 2,
        }}>✦</div>
      ))}
    </>
  );
}

// ── Astronaut SVG ─────────────────────────────────────────────────────────────
function Astronaut({ size = 120, style, waving = false }) {
  return (
    <div style={{ width: size, height: size, animation: 'astroFloat 5s ease-in-out infinite', ...style }}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        {/* Body */}
        <ellipse cx="60" cy="78" rx="28" ry="32" fill="#2d1b69" stroke="#7c3aed" strokeWidth="1.5"/>
        {/* Suit texture */}
        <ellipse cx="60" cy="78" rx="22" ry="26" fill="#1e1248" opacity="0.6"/>
        {/* Helmet outer */}
        <circle cx="60" cy="46" r="26" fill="#1e1248" stroke="#7c3aed" strokeWidth="1.5"/>
        {/* Helmet visor */}
        <circle cx="60" cy="46" r="19" fill="#0d0829"/>
        <circle cx="60" cy="46" r="17" fill="url(#visorGrad)"/>
        {/* Visor shine */}
        <ellipse cx="55" cy="39" rx="6" ry="4" fill="white" opacity="0.12" transform="rotate(-15 55 39)"/>
        {/* Eyes */}
        <circle cx="54" cy="45" r="3.5" fill="#00d4ff" opacity="0.9"/>
        <circle cx="66" cy="45" r="3.5" fill="#00d4ff" opacity="0.9"/>
        <circle cx="55" cy="44" r="1" fill="white" opacity="0.7"/>
        <circle cx="67" cy="44" r="1" fill="white" opacity="0.7"/>
        {/* Smile */}
        <path d="M54 52 Q60 57 66 52" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7"/>
        {/* Arms — right arm raised in a wave when `waving` is set */}
        <ellipse cx="34" cy="75" rx="8" ry="14" fill="#2d1b69" stroke="#7c3aed" strokeWidth="1" transform="rotate(-15 34 75)"/>
        {waving ? (
          <ellipse cx="90" cy="52" rx="8" ry="15" fill="#2d1b69" stroke="#7c3aed" strokeWidth="1" transform="rotate(35 90 52)" style={{ animation: 'waveArm 1.8s ease-in-out infinite', transformOrigin: '82px 68px' }}/>
        ) : (
          <ellipse cx="86" cy="75" rx="8" ry="14" fill="#2d1b69" stroke="#7c3aed" strokeWidth="1" transform="rotate(15 86 75)"/>
        )}
        {/* Gloves */}
        <circle cx="30" cy="87" r="7" fill="#3d2b7a"/>
        <circle cx={waving ? "97" : "90"} cy={waving ? "42" : "87"} r="7" fill="#3d2b7a"/>
        {/* Legs */}
        <ellipse cx="50" cy="106" rx="9" ry="10" fill="#2d1b69" stroke="#7c3aed" strokeWidth="1"/>
        <ellipse cx="70" cy="106" rx="9" ry="10" fill="#2d1b69" stroke="#7c3aed" strokeWidth="1"/>
        {/* Chest logo */}
        <path d="M56 70 L60 63 L64 70 L60 68 Z" fill="#7c3aed" opacity="0.9"/>
        {/* Backpack */}
        <rect x="44" y="58" width="8" height="10" rx="2" fill="#3d2b7a" stroke="#5b3fa0" strokeWidth="1"/>
        {/* Antenna */}
        <line x1="60" y1="20" x2="60" y2="12" stroke="#7c3aed" strokeWidth="1.5"/>
        <circle cx="60" cy="10" r="2.5" fill="#a78bfa" style={{ animation: 'antennaBlink 2s ease-in-out infinite' }}/>
        <defs>
          <radialGradient id="visorGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1a0f4e"/>
            <stop offset="100%" stopColor="#0a0620"/>
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

// ── Rocket SVG ────────────────────────────────────────────────────────────────
function Rocket({ style, small = false }) {
  return (
    <div style={{ width: small ? 30 : 60, height: small ? 40 : 80, ...style }}>
      <svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M30 4 C30 4 44 20 44 46 L16 46 C16 20 30 4 30 4Z" fill="#3730a3" stroke="#818cf8" strokeWidth="1.5"/>
        <path d="M30 4 C30 4 37 20 37 46 L30 46 L30 4Z" fill="#4f46e5" opacity="0.6"/>
        <circle cx="30" cy="28" r="7" fill="#818cf8" stroke="#c7d2fe" strokeWidth="1"/>
        <circle cx="30" cy="28" r="4" fill="#06b6d4" opacity="0.8"/>
        <path d="M16 44 L8 56 L16 52 Z" fill="#7c3aed"/>
        <path d="M44 44 L52 56 L44 52 Z" fill="#7c3aed"/>
        {/* Flame */}
        <ellipse cx="30" cy="53" rx="6" ry="10" fill="url(#flameGrad)" opacity="0.9" style={{ animation: 'flameFlicker 0.3s ease-in-out infinite alternate' }}/>
        <ellipse cx="30" cy="55" rx="3" ry="6" fill="#fbbf24" opacity="0.8"/>
        <defs>
          <linearGradient id="flameGrad" x1="30" y1="43" x2="30" y2="63" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b5cf6"/>
            <stop offset="50%" stopColor="#ec4899"/>
            <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ── Satellite SVG ─────────────────────────────────────────────────────────────
function Satellite({ style }) {
  return (
    <div style={{ width: 70, height: 50, ...style, animation: 'satelliteDrift 30s linear infinite' }}>
      <svg viewBox="0 0 70 50" fill="none" style={{ width: '100%', height: '100%' }}>
        <rect x="28" y="18" width="14" height="14" rx="2" fill="#1e1248" stroke="#7c3aed" strokeWidth="1.2"/>
        <rect x="2" y="20" width="22" height="10" rx="2" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1"/>
        <rect x="46" y="20" width="22" height="10" rx="2" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1"/>
        <rect x="4" y="22" width="18" height="6" rx="1" fill="#2563eb" opacity="0.6"/>
        <rect x="48" y="22" width="18" height="6" rx="1" fill="#2563eb" opacity="0.6"/>
        <circle cx="35" cy="25" r="3" fill="#7c3aed"/>
        <line x1="24" y1="25" x2="28" y2="25" stroke="#6b7280" strokeWidth="1.5"/>
        <line x1="42" y1="25" x2="46" y2="25" stroke="#6b7280" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent, delay = 0, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(124,58,237,0.08)' : 'rgba(13,10,40,0.7)',
        border: `1px solid ${hovered ? 'rgba(124,58,237,0.4)' : 'rgba(124,58,237,0.15)'}`,
        borderRadius: 20,
        padding: '28px 24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered ? '0 20px 60px rgba(124,58,237,0.2), 0 0 0 1px rgba(124,58,237,0.15)' : '0 4px 24px rgba(0,0,0,0.3)',
        animation: `fadeSlideUp 0.6s ease ${delay}s both`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 100, height: 100, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}25, transparent 70%)`,
        opacity: hovered ? 1 : 0.4,
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
      }} />
      {/* Sparkle dot */}
      <div style={{
        position: 'absolute', top: 18, right: 18,
        color: 'rgba(167,139,250,0.5)', fontSize: 16,
        animation: 'sparkle 3s ease-in-out infinite',
      }}>✦</div>

      {/* Icon */}
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: `linear-gradient(135deg, ${accent}30, ${accent}15)`,
        border: `1px solid ${accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18, fontSize: 24,
        boxShadow: hovered ? `0 0 20px ${accent}40` : 'none',
        transition: 'box-shadow 0.3s',
        animation: `iconBob 3s ease-in-out ${delay * 0.5}s infinite`,
      }}>
        {icon}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', letterSpacing: '-0.02em', margin: 0 }}>{title}</h3>
        <span style={{ color: '#a78bfa', fontSize: 13 }}>✦</span>
      </div>
      <p style={{ fontSize: 14, color: 'rgba(200,190,255,0.55)', lineHeight: 1.7, margin: '0 0 20px' }}>{desc}</p>
      {children}

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`,
        opacity: hovered ? 1 : 0, transition: 'opacity 0.3s',
      }} />
    </div>
  );
}

// ── Main Landing ──────────────────────────────────────────────────────────────
// NOTE: Landing no longer takes a generic `onEnter` — it takes `onLogin`
// (same prop Auth.jsx already expects) and manages its own AuthModal,
// imported directly from Auth.jsx. This is the fix for "Sign In does
// nothing": previously every button called `onEnter`, which was never
// passed in from App.jsx, so it was calling `undefined`.
export default function Landing({ onLogin }) {
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [cursorOn, setCursorOn] = useState(true);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const heroRef = useRef(null);

  const openAuth = (mode) => { setAuthMode(mode); setShowAuth(true); };

  const fullText = '@ai what causes JWT expiry issues?';

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  useEffect(() => {
    if (!mounted) return;
    let i = 0;
    const t = setInterval(() => {
      if (i <= fullText.length) { setTypedText(fullText.slice(0, i)); i++; }
      else clearInterval(t);
    }, 55);
    const c = setInterval(() => setCursorOn(v => !v), 500);
    return () => { clearInterval(t); clearInterval(c); };
  }, [mounted]);

  useEffect(() => {
    const onMove = (e) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const parallaxX = (mouseX / window.innerWidth - 0.5) * 18;
  const parallaxY = (mouseY / window.innerHeight - 0.5) * 12;

  return (
    // FIX (scrolling): this root div now owns its own scrolling explicitly
    // (`height: 100vh` + `overflowY: auto`) instead of relying on the page
    // body to scroll. If a parent container elsewhere in your app sets
    // `overflow: hidden` on `html`/`body`/`#root` (common in chat apps, since
    // the post-login chat view manages its own internal scroll), the old code
    // had no fallback and the whole page became unscrollable. Making this
    // div itself the scroll container guarantees it scrolls no matter what
    // the parent does.
    <div style={{
      background: 'linear-gradient(160deg, #05030f 0%, #0a0420 28%, #0b0322 55%, #0a0420 78%, #0d0428 100%)',
      minHeight: '100vh',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      fontFamily: "'DM Sans', 'Inter', sans-serif",
      color: 'white',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes planetFloat {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(3deg); }
        }
        @keyframes orbitSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes astroFloat {
          0%,100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
        @keyframes waveArm {
          0%,100% { transform: rotate(35deg); }
          50% { transform: rotate(60deg); }
        }
        @keyframes rocketFloat {
          0%,100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-18px) rotate(5deg); }
        }
        @keyframes satelliteDrift {
          from { transform: translate(0, 0) rotate(0deg); }
          to { transform: translate(-120px, 60px) rotate(20deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(36px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes iconBob {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes sparkle {
          0%,100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(20deg); }
        }
        @keyframes antennaBlink {
          0%,100% { opacity: 1; } 50% { opacity: 0.2; }
        }
        @keyframes flameFlicker {
          from { transform: scaleY(0.85) scaleX(0.9); }
          to { transform: scaleY(1.1) scaleX(1.1); }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 20px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.2); }
          50% { box-shadow: 0 0 30px rgba(124,58,237,0.8), 0 0 60px rgba(124,58,237,0.35); }
        }
        @keyframes borderGlow {
          0%,100% { border-color: rgba(124,58,237,0.2); }
          50% { border-color: rgba(124,58,237,0.55); }
        }
        @keyframes shimmerText {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes nebulaMove {
          0%,100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          33% { transform: translate(3%, 2%) scale(1.06); opacity: 0.8; }
          66% { transform: translate(-2%, 4%) scale(0.95); opacity: 0.5; }
        }
        @keyframes nebulaMove2 {
          0%,100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate(-4%, -3%) scale(1.1); opacity: 0.7; }
        }

        .cta-primary {
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          border: none; border-radius: 14px;
          padding: 15px 30px; color: white;
          font-size: 15px; font-weight: 700;
          font-family: inherit;
          cursor: pointer; display: inline-flex;
          align-items: center; gap: 8px;
          transition: all 0.25s ease;
          animation: glowPulse 3s ease-in-out infinite;
          letter-spacing: 0.01em;
        }
        .cta-primary:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 16px 40px rgba(124,58,237,0.55);
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
        }
        .cta-secondary {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px; padding: 15px 30px;
          color: rgba(255,255,255,0.8);
          font-size: 15px; font-weight: 600;
          font-family: inherit; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.25s ease; backdrop-filter: blur(8px);
        }
        .cta-secondary:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.25);
          color: white; transform: translateY(-1px);
        }
        .nav-link {
          color: rgba(200,190,255,0.6); font-size: 14px;
          font-weight: 500; background: none; border: none;
          cursor: pointer; font-family: inherit;
          transition: color 0.2s; padding: 4px 0;
        }
        .nav-link:hover { color: white; }
        .nav-signin {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px; padding: 9px 20px;
          color: rgba(255,255,255,0.8); font-size: 13px;
          font-weight: 600; font-family: inherit;
          cursor: pointer; transition: all 0.2s;
        }
        .nav-signin:hover {
          background: rgba(255,255,255,0.1); color: white;
        }
        .nav-getstarted {
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          border: none; border-radius: 10px;
          padding: 9px 20px; color: white;
          font-size: 13px; font-weight: 700;
          font-family: inherit; cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(124,58,237,0.35);
        }
        .nav-getstarted:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(124,58,237,0.5);
        }
        .feature-mini-icon {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          color: rgba(200,190,255,0.7); font-size: 13px;
          font-weight: 500;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #04020f; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.35); border-radius: 99px; }
      `}</style>

      {/* Starfield */}
      <StarCanvas />

      {/* Nebula gradients — deeper indigo/violet + a touch more magenta glow */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '65vw', height: '65vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.22) 0%, transparent 60%)', animation: 'nebulaMove 18s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.16) 0%, transparent 60%)', animation: 'nebulaMove2 22s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '40%', left: '60%', width: '35vw', height: '35vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.09) 0%, transparent 60%)', animation: 'nebulaMove 14s ease-in-out 4s infinite' }} />
      </div>

      {/* NAV ---------------------------------------------------------------- */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid rgba(124,58,237,0.12)',
        backdropFilter: 'blur(24px)',
        background: 'rgba(4,2,15,0.8)',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease',
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(124,58,237,0.5)', animation: 'glowPulse 3s ease-in-out infinite' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em' }}>BuildSpace</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <button className="nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
            <button className="nav-link" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>How it works</button>
            <button className="nav-link" onClick={() => document.getElementById('thinkspace')?.scrollIntoView({ behavior: 'smooth' })}>ThinkSpace</button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="nav-signin" onClick={() => openAuth('login')}>Sign In</button>
            <button className="nav-getstarted" onClick={() => openAuth('register')}>Get Started 🚀</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ position: 'relative', zIndex: 2, padding: '90px 32px 80px', overflow: 'hidden' }}>
        {/* Small corner rocket, subtle atmosphere accent */}
        <div style={{ position: 'absolute', top: 130, left: '4%', opacity: 0.5, animation: 'rocketFloat 6s ease-in-out infinite' }}>
          <Rocket small style={{ transform: 'rotate(-20deg)' }} />
        </div>

        {/* Scattered sparkles for extra atmosphere near the headline */}
        <SparkleField items={[
          ['18%', '38%', 14, 0.2, 3.2],
          ['8%', '55%', 10, 1.1, 2.6],
          ['55%', '46%', 12, 0.6, 3.6],
          ['70%', '8%', 11, 1.6, 3],
        ]} />

        {/* Planets */}
        <Planet size={80} color="radial-gradient(circle at 35% 35%, #6d28d9, #1e0a4e)" ringColor="#7c3aed" top="60px" left="48%" delay={0} duration={20} dotted />
        <Planet size={50} color="radial-gradient(circle at 35% 35%, #0c4a6e, #0a2540)" top="30%" right="5%" delay={2} duration={16} opacity={0.7} />
        <Planet size={130} color="radial-gradient(circle at 35% 35%, #4c1d95, #1a0747)" ringColor="#8b5cf6" bottom="10%" left="2%" delay={1} duration={24} opacity={0.6} dotted />

        {/* Astronaut, waving, perched on a small moon */}
        <div style={{ position: 'absolute', bottom: 20, right: '3%', zIndex: 3, filter: 'drop-shadow(0 0 30px rgba(124,58,237,0.4))' }}>
          <div style={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
            width: 92, height: 92, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #4c1d95, #180a3a)',
            boxShadow: 'inset -14px -8px 0 rgba(0,0,0,0.4), 0 0 40px 6px rgba(124,58,237,0.25)',
            zIndex: -1,
          }} />
          <Astronaut size={140} waving />
        </div>
        {/* Rocket */}
        <div style={{ position: 'absolute', bottom: '28%', right: '18%', zIndex: 3, animation: 'rocketFloat 5s ease-in-out infinite', filter: 'drop-shadow(0 0 20px rgba(124,58,237,0.5))' }}>
          <Rocket />
        </div>
        {/* Satellite */}
        <div style={{ position: 'absolute', top: 120, right: '22%', zIndex: 2, opacity: 0.6 }}>
          <Satellite />
        </div>

        <div style={{ maxWidth: 640, position: 'relative', zIndex: 4 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 99, padding: '6px 16px', marginBottom: 28,
            fontSize: 13, fontWeight: 600, color: '#c4b5fd',
            opacity: mounted ? 1 : 0,
            animation: mounted ? 'fadeSlideUp 0.6s ease 0.1s both' : 'none',
          }}>
            <span style={{ fontSize: 14 }}>✨</span> Built for engineers & students
          </div>

          <h1 style={{
            fontSize: 'clamp(42px, 6vw, 72px)',
            fontWeight: 900, lineHeight: 1.04,
            letterSpacing: '-0.04em', marginBottom: 24,
            opacity: mounted ? 1 : 0,
            animation: mounted ? 'heroIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.18s both' : 'none',
          }}>
            Your team's<br />
            <span style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #38bdf8 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmerText 4s linear infinite',
            }}>AI-powered</span><br />
            collab workspace
          </h1>

          <p style={{
            fontSize: 18, color: 'rgba(200,190,255,0.55)',
            lineHeight: 1.7, maxWidth: 520, marginBottom: 40,
            opacity: mounted ? 1 : 0,
            animation: mounted ? 'fadeSlideUp 0.6s ease 0.3s both' : 'none',
          }}>
            Group chat with built-in AI, private ThinkSpace, auto TL;DR summaries, and file sharing — all in one password-protected room for your project team.
          </p>

          <div style={{
            display: 'flex', gap: 14, flexWrap: 'wrap',
            opacity: mounted ? 1 : 0,
            animation: mounted ? 'fadeSlideUp 0.6s ease 0.42s both' : 'none',
            marginBottom: 40,
          }}>
            <button className="cta-primary" onClick={() => openAuth('register')}>Create Free Workspace 🚀</button>
            <button className="cta-secondary" onClick={() => openAuth('login')}>Sign In →</button>
          </div>

          {/* Feature pills */}
          <div style={{
            display: 'flex', gap: 24, flexWrap: 'wrap',
            opacity: mounted ? 1 : 0,
            animation: mounted ? 'fadeSlideUp 0.6s ease 0.52s both' : 'none',
          }}>
            {[['👥','Groups'], ['✨','Private AI'], ['📁','File Sharing'], ['📋','TL;DR']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(167,139,250,0.7)', fontSize: 14, fontWeight: 500 }}>
                <span>{icon}</span>
                <span style={{ borderBottom: '1px solid rgba(124,58,237,0.4)', paddingBottom: 1 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HERO CHAT DEMO (below hero on full width) ─────────────────────── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '0 32px 80px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Chat card */}
          <div style={{
            background: 'rgba(13,10,40,0.85)', border: '1px solid rgba(124,58,237,0.22)',
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1)',
            backdropFilter: 'blur(16px)',
            animation: 'fadeSlideUp 0.7s ease 0.6s both, borderGlow 4s ease-in-out infinite',
          }}>
            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🚀</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}># engineering-team</div>
                <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'sparkle 2s ease-in-out infinite' }} />
                  5 online
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: -6 }}>
                {['#7c3aed','#0ea5e9','#10b981','#f59e0b'].map((c, i) => (
                  <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: '2px solid rgba(13,10,40,0.9)', marginLeft: i > 0 ? -6 : 0 }} />
                ))}
                <span style={{ fontSize: 11, color: 'rgba(200,190,255,0.5)', marginLeft: 6, alignSelf: 'center' }}>+3</span>
              </div>
            </div>
            {/* Messages */}
            <div style={{ padding: '18px 18px 8px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 280 }}>
              {[
                { name: 'Priya', color: '#7c3aed', msg: 'Anyone looked at the auth bug yet?', time: '10:32 AM', avatar: '🧑‍💻' },
                { name: 'Rahul', color: '#0ea5e9', msg: typedText + (cursorOn ? '|' : ' '), time: '10:33 AM', avatar: '👨‍💻', isTyping: true },
              ].map((m) => (
                <div key={m.name} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${m.color}30`, border: `1px solid ${m.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{m.avatar}</div>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.name}</span>
                      <span style={{ fontSize: 11, color: 'rgba(200,190,255,0.3)' }}>{m.time}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '9px 13px', borderRadius: '4px 13px 13px 13px', fontSize: 13, color: 'rgba(220,210,255,0.85)', maxWidth: 300, lineHeight: 1.55 }}>
                      {m.isTyping && <span style={{ color: '#a78bfa', fontWeight: 700 }}>@ai </span>}
                      {m.isTyping ? typedText.replace('@ai ', '') : m.msg}
                      {m.isTyping && <span style={{ color: '#a78bfa', opacity: cursorOn ? 1 : 0 }}>|</span>}
                    </div>
                  </div>
                </div>
              ))}
              {/* AI response */}
              {typedText.length > 15 && (
                <div style={{ display: 'flex', gap: 10, animation: 'fadeSlideUp 0.4s ease both' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, animation: 'glowPulse 2s ease-in-out infinite' }}>✨</div>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>AI</span>
                      <span style={{ fontSize: 11, color: 'rgba(200,190,255,0.3)' }}>10:33 AM</span>
                    </div>
                    <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', padding: '10px 14px', borderRadius: '4px 13px 13px 13px', fontSize: 13, color: 'rgba(220,210,255,0.85)', maxWidth: 340, lineHeight: 1.6 }}>
                      JWT tokens expire when the <span style={{ background: 'rgba(124,58,237,0.3)', color: '#c4b5fd', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>'exp'</span> claim passes the current timestamp. Check your server clock sync and refresh token logic.
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Reply */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.15)' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: 'rgba(200,190,255,0.35)' }}>
                Message #engineering-team...
              </div>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.4)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </div>
            </div>
          </div>

          {/* Right: TL;DR card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: 'rgba(13,10,40,0.85)', border: '1px solid rgba(124,58,237,0.22)',
              borderRadius: 20, padding: '22px 24px',
              backdropFilter: 'blur(16px)',
              animation: 'fadeSlideUp 0.7s ease 0.7s both',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✨</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.07em' }}>AUTO TL;DR</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(167,139,250,0.5)' }}>10+ messages</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(200,190,255,0.7)', lineHeight: 1.65 }}>
                Team discussed JWT expiry handling and token refresh logic. Priya flagged a server clock sync issue, Rahul confirmed the fix. Auth middleware updated.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 14px', background: 'rgba(124,58,237,0.08)', borderRadius: 10, border: '1px solid rgba(124,58,237,0.15)' }}>
                <span style={{ color: '#a78bfa', fontSize: 13 }}>✦</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>Stay in the loop. Save time.</span>
                <span style={{ marginLeft: 'auto', fontSize: 18 }}>🚀</span>
              </div>
            </div>

            <div style={{
              background: 'rgba(13,10,40,0.85)', border: '1px solid rgba(14,165,233,0.2)',
              borderRadius: 20, padding: '22px 24px',
              backdropFilter: 'blur(16px)',
              animation: 'fadeSlideUp 0.7s ease 0.85s both',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🔒</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 4 }}>Invite by password</div>
                <div style={{ fontSize: 13, color: 'rgba(200,190,255,0.5)', lineHeight: 1.5 }}>No email invites. Share the room name and password — your team is in.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────────────────── */}
      <section id="features" style={{ position: 'relative', zIndex: 2, padding: '60px 32px 80px' }}>
        <Planet size={60} color="radial-gradient(circle at 35% 35%, #7c3aed, #1e0a4e)" top="-20px" right="8%" delay={3} duration={15} opacity={0.5} />
        <Planet size={100} color="radial-gradient(circle at 35% 35%, #4c1d95, #1a0747)" ringColor="#a78bfa" bottom="5%" left="1%" delay={0} duration={20} opacity={0.45} dotted />

        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>EVERYTHING YOUR TEAM NEEDS ✦</div>
            <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 50px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.1 }}>
              Built for the way<br />
              <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>engineers actually work</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <FeatureCard icon="💬" title="Group Workspaces" accent="#7c3aed" delay={0.05}
              desc="Password-protected rooms for your team. Share code snippets, links, files, and ideas all in one place.">
              <div className="feature-mini-icon">
                <span>👥</span><span>Password protected • Persistent history</span>
              </div>
            </FeatureCard>

            <FeatureCard icon="🤖" title="AI on Demand" accent="#0ea5e9" delay={0.12}
              desc="Tag @ai anywhere in chat to get instant answers, code explanations, or brainstorming help — visible to the whole group.">
              <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 10, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: '#38bdf8' }}>
                @ai explain how useEffect cleanup works
              </div>
            </FeatureCard>

            <FeatureCard icon="🔒" title="ThinkSpace" accent="#8b5cf6" delay={0.19}
              desc="Your private AI sidebar. Ask sensitive questions or think out loud without the rest of the team seeing.">
              <div className="feature-mini-icon">
                <span>👁️</span><span>Hidden from your teammates</span>
              </div>
            </FeatureCard>

            <FeatureCard icon="📋" title="Auto TL;DR" accent="#f59e0b" delay={0.26}
              desc="Missed a busy thread? BuildSpace generates a smart summary after 10+ messages so you're never lost.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['⚡ Triggers automatically after 10 messages', '📊 Updates live as conversation grows', '👁️ Shown instantly when you open the room'].map(f => (
                  <div key={f} className="feature-mini-icon" style={{ fontSize: 12 }}>{f}</div>
                ))}
              </div>
            </FeatureCard>

            <FeatureCard icon="📁" title="File & Knowledge Sharing" accent="#10b981" delay={0.33}
              desc="Upload files directly into the chat or feed facts to the AI to make it smarter about your project context.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['api-docs.pdf','124 chunks'], ['schema.sql','89 chunks'], ['system-arch.md','56 chunks']].map(([name, chunks]) => (
                  <div key={name} className="feature-mini-icon" style={{ justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(200,190,255,0.7)', fontSize: 12 }}>📄 {name}</span>
                    <span style={{ color: 'rgba(167,139,250,0.5)', fontSize: 11 }}>{chunks}</span>
                  </div>
                ))}
              </div>
            </FeatureCard>

            <FeatureCard icon="🔑" title="Invite by Password" accent="#ec4899" delay={0.4}
              desc="No email invites or admin panels. Just share the room name and password — your team is in.">
              <div style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.15)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'rgba(200,190,255,0.6)', lineHeight: 1.6 }}>
                <span style={{ color: '#f9a8d4', fontWeight: 600 }}>Room:</span> ml-pipeline &nbsp;
                <span style={{ color: '#f9a8d4', fontWeight: 600 }}>Password:</span> ••••••••
              </div>
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* ── THINKSPACE SECTION ────────────────────────────────────────────── */}
      <section id="thinkspace" style={{ position: 'relative', zIndex: 2, padding: '60px 32px 80px', overflow: 'hidden' }}>
        <Planet size={90} color="radial-gradient(circle at 35% 35%, #4c1d95, #1a0747)" ringColor="#7c3aed" top="10%" left="3%" delay={2} duration={22} opacity={0.5} dotted />
        <div style={{ position: 'absolute', top: 60, right: '5%', animation: 'rocketFloat 5s ease-in-out infinite' }}>
          <Rocket style={{ transform: 'rotate(30deg)' }} />
        </div>

        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48, alignItems: 'center' }}>
          {/* ThinkSpace preview card */}
          <div style={{
            background: 'rgba(13,10,40,0.9)', border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: 22, overflow: 'hidden',
            boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)',
            animation: 'borderGlow 4s ease-in-out infinite',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✨</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>ThinkSpace</div>
                <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.5)' }}>🔒 Ask AI • Only visible to you</div>
              </div>
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { me: true, msg: "Is the approach Rahul suggested in the main channel actually correct?" },
                { me: false, msg: "Rahul's suggestion to use a circuit breaker is solid engineering practice. However, for your specific case with connection pool exhaustion, you'd want to pair it with pool monitoring." },
                { me: true, msg: "What should I actually say to not sound clueless?" },
                { me: false, msg: "Say: 'Good call on the circuit breaker — I'd also add pool metrics to Datadog so we catch this earlier next time.' That positions you well." },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.me ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    padding: '10px 14px', maxWidth: '78%', fontSize: 13, lineHeight: 1.6,
                    borderRadius: m.me ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                    background: m.me ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.05)',
                    border: m.me ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    color: m.me ? 'white' : 'rgba(220,210,255,0.8)',
                  }}>{m.msg}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(124,58,237,0.1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: 'rgba(200,190,255,0.3)' }}>
                Ask privately about the chat...
              </div>
              <button style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: 10, padding: '12px', color: 'white', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', animation: 'glowPulse 3s ease-in-out infinite' }}>
                ✨ Ask Privately
              </button>
            </div>
          </div>

          {/* ThinkSpace copy */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 99, padding: '5px 14px', marginBottom: 20, fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em' }}>
              🔒 THINKSPACE
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
              Your private AI —<br />
              <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>invisible to the team</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(200,190,255,0.55)', lineHeight: 1.7, marginBottom: 32 }}>
              ThinkSpace is a personal AI sidebar only you can see. Ask anything about the conversation, get up to speed, draft replies, or just think out loud — without anyone else knowing.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['👁️', 'Completely hidden from your teammates'],
                ['💬', 'Has full context of the group chat'],
                ['💡', 'Helps you think before you type'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)', borderRadius: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(124,58,237,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
                  <span style={{ fontSize: 14, color: 'rgba(220,210,255,0.8)', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TL;DR SECTION ─────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '60px 32px 80px', overflow: 'hidden' }}>
        <Planet size={110} color="radial-gradient(circle at 35% 35%, #1e40af, #0c1a4e)" top="5%" right="2%" delay={1} duration={20} opacity={0.4} />
        <div style={{ position: 'absolute', bottom: 40, left: '3%' }}>
          <Astronaut size={110} style={{ opacity: 0.8 }} />
        </div>

        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 48, alignItems: 'center' }}>
          {/* Copy */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 99, padding: '5px 14px', marginBottom: 20, fontSize: 12, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.06em' }}>
              📋 AUTO TL;DR
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
              Never lose track of<br />
              <span style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>a busy thread</span> ✦
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(200,190,255,0.55)', lineHeight: 1.7, marginBottom: 32 }}>
              Once a channel hits 10+ messages, BuildSpace automatically generates a smart summary pinned right at the top. Rejoin mid-conversation without scrolling through everything.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
              {[
                ['⚡', 'Triggers automatically after 10 messages'],
                ['📊', 'Updates live as conversation grows'],
                ['👁️', 'Shown instantly when you open the room'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{icon}</div>
                  <span style={{ fontSize: 14, color: 'rgba(220,210,255,0.8)', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 20px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#a78bfa', fontSize: 16 }}>✦</span>
              <div>
                <div style={{ fontWeight: 700, color: '#a78bfa', fontSize: 14 }}>Stay in the loop. Save time.</div>
                <div style={{ fontSize: 13, color: 'rgba(200,190,255,0.5)' }}>Focus on building, not scrolling.</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 24 }}>🚀</span>
            </div>
          </div>

          {/* TL;DR card preview */}
          <div style={{ background: 'rgba(13,10,40,0.9)', border: '1px solid rgba(124,58,237,0.22)', borderRadius: 22, overflow: 'hidden', backdropFilter: 'blur(16px)', boxShadow: '0 40px 100px rgba(0,0,0,0.4)' }}>
            {/* TL;DR summary */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(124,58,237,0.1)', background: 'rgba(124,58,237,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em' }}>✨ TL;DR · AI SUMMARY</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(220,210,255,0.8)', lineHeight: 1.65, margin: 0 }}>
                Payment API was returning 503s due to connection pool exhaustion. Team diagnosed with @ai help, bumped the pool limit, added a circuit breaker pattern, and merged the fix. Payments restored ✅
              </p>
            </div>
            {/* Messages */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { name: 'Priya', color: '#ec4899', msg: 'The API is returning 503s again on the payment endpoint', time: '10:21 AM' },
                { name: 'Rahul', color: '#0ea5e9', msg: '@ai what could cause 503 on a payment API?', time: '10:22 AM' },
                { name: 'AI', color: '#a78bfa', msg: 'Common causes: rate limiting, downstream service failure, or connection pool exhaustion. Check your gateway logs first.', time: '10:22 AM' },
                { name: 'Priya', color: '#ec4899', msg: 'Found it — connection pool was maxed out. Bumping the limit now', time: '10:25 AM' },
                { name: 'Dev', color: '#10b981', msg: 'Also worth adding a circuit breaker here for future', time: '10:27 AM' },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${m.color}25`, border: `1px solid ${m.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, fontWeight: 700, color: m.color }}>{m.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 7, alignItems: 'baseline', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.name}</span>
                      <span style={{ fontSize: 10, color: 'rgba(200,190,255,0.25)' }}>{m.time}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(200,190,255,0.65)', lineHeight: 1.5 }}>{m.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how" style={{ position: 'relative', zIndex: 2, padding: '60px 32px 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 56 }}>
            Up in{' '}
            <span style={{ background: 'linear-gradient(135deg, #818cf8, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              three steps
            </span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { step: '01', title: 'Create your workspace', desc: 'Set a room name and password. The room is private to you and your team.', color: '#7c3aed', icon: '🚀' },
              { step: '02', title: 'Invite your team', desc: "Share the room name and password. Anyone with it can join — no email invites.", color: '#0ea5e9', icon: '👥' },
              { step: '03', title: 'Tag @ai, get answers', desc: "Ask the AI in the group chat or use ThinkSpace privately. It reads the whole room.", color: '#10b981', icon: '✨' },
            ].map(({ step, title, desc, color, icon }) => (
              <div key={step} style={{
                padding: '28px 24px', textAlign: 'left',
                background: 'rgba(13,10,40,0.7)',
                border: '1px solid rgba(124,58,237,0.12)',
                borderRadius: 20, position: 'relative', overflow: 'hidden',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.3s ease',
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: '0.1em', marginBottom: 12, opacity: 0.6 }}>{step}</div>
                <div style={{ fontSize: 28, marginBottom: 14, animation: `iconBob 3s ease-in-out infinite` }}>{icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 10, letterSpacing: '-0.02em' }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(200,190,255,0.5)', lineHeight: 1.65 }}>{desc}</p>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, opacity: 0.5 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '20px 32px 120px' }}>
        <Planet size={70} color="radial-gradient(circle at 35% 35%, #7c3aed, #1e0a4e)" top="-20px" right="15%" delay={0} duration={16} opacity={0.45} />
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            background: 'rgba(13,10,40,0.85)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 28, padding: '64px 48px',
            backdropFilter: 'blur(16px)',
            position: 'relative', overflow: 'hidden',
            animation: 'borderGlow 4s ease-in-out infinite',
            boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(124,58,237,0.12), transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 20, right: 30 }}>
              <Astronaut size={90} style={{ opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: 36, marginBottom: 20 }}>🚀</div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16, position: 'relative' }}>
              Ready to build together?
            </h2>
            <p style={{ color: 'rgba(200,190,255,0.45)', fontSize: 16, marginBottom: 36, lineHeight: 1.65, position: 'relative' }}>
              Create a room, share the password, and start collaborating with AI context that actually understands your project.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
              <button className="cta-primary" onClick={() => openAuth('register')} style={{ fontSize: 16, padding: '16px 36px' }}>
                Create Free Workspace 🚀
              </button>
              <button className="cta-secondary" onClick={() => openAuth('login')}>
                Sign in →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(124,58,237,0.1)', padding: '32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.6)' }}>BuildSpace</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(200,190,255,0.2)' }}>AI-powered collaboration for engineers & students.</p>
      </footer>

      {/* Reused, unmodified auth logic from Auth.jsx — same fetch calls,
          same onLogin contract your App.jsx already expects. */}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onLogin={onLogin} defaultMode={authMode} />
      )}
    </div>
  );
}