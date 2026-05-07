import React, { useState, useEffect, useRef } from 'react';

// ── Animated grid background ──────────────────────────────────────────────────
function GridBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0 }}>
                <defs>
                    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    </pattern>
                    <radialGradient id="fade" cx="50%" cy="50%" r="70%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="100%" stopColor="#080c14" />
                    </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <rect width="100%" height="100%" fill="url(#fade)" />
            </svg>
            {/* floating orbs */}
            <div style={{
                position: 'absolute', top: '15%', left: '10%',
                width: 380, height: 380, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                animation: 'orbFloat 8s ease-in-out infinite',
                filter: 'blur(1px)'
            }} />
            <div style={{
                position: 'absolute', bottom: '20%', right: '8%',
                width: 300, height: 300, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
                animation: 'orbFloat 11s ease-in-out infinite reverse',
                filter: 'blur(1px)'
            }} />
        </div>
    );
}

// ── Scroll reveal wrapper ─────────────────────────────────────────────────────
function ScrollReveal({ children, delay = 0, direction = 'up' }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.12 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    const from = direction === 'left' ? 'translateX(-36px)' : direction === 'right' ? 'translateX(36px)' : 'translateY(32px)';
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : from,
            transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`
        }}>
            {children}
        </div>
    );
}

// ── TL;DR showcase card ───────────────────────────────────────────────────────
function TLDRCard() {
    const messages = [
        { u: 'Priya', msg: 'The API is returning 503s again on the payment endpoint', clr: '#a5b4fc' },
        { u: 'Rahul', msg: '@ai what could cause 503 on a payment API?', clr: '#86efac' },
        { u: 'AI', msg: 'Common causes: rate limiting, downstream service failure, or connection pool exhaustion. Check your gateway logs first.', ai: true },
        { u: 'Priya', msg: 'Found it — connection pool was maxed out. Bumping the limit now', clr: '#a5b4fc' },
        { u: 'Dev', msg: 'Also worth adding a circuit breaker here for future', clr: '#fda4af' },
        { u: 'Rahul', msg: 'Good call. PR up in 10 mins', clr: '#86efac' },
        { u: 'Priya', msg: 'Merged ✅ Payments back to normal', clr: '#a5b4fc' },
        { u: 'Dev', msg: 'Nice work everyone 🔥', clr: '#fda4af' },
        { u: 'Rahul', msg: 'Adding this pattern to our runbook', clr: '#86efac' },
        { u: 'Priya', msg: 'Monitoring looks clean now. Closing the incident', clr: '#a5b4fc' },
    ];

    return (
        <section style={{ padding: 'clamp(40px,6vw,80px) clamp(20px,5vw,80px)', maxWidth: 1200, margin: '0 auto' }}>
            <ScrollReveal>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 40, alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 28, padding: 'clamp(28px,4vw,56px)', overflow: 'hidden', position: 'relative'
                }}>
                    {/* glow */}
                    <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

                    {/* left — copy */}
                    <ScrollReveal direction="left" delay={100}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 999, padding: '4px 14px', marginBottom: 20 }}>
                                <span style={{ fontSize: 14 }}>📋</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Auto TL;DR</span>
                            </div>
                            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 800, color: 'white', letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 16 }}>
                                Never lose track of a busy thread
                            </h2>
                            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, marginBottom: 24 }}>
                                Once a channel hits 10+ messages, BuildSpace automatically generates a smart summary pinned right at the top. Rejoin mid-conversation without scrolling through everything.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {['Triggers automatically after 10 messages', 'Updates live as conversation grows', 'Shown instantly when you open the room'].map((t, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#6ee7b7', flexShrink: 0 }}>✓</span>
                                        {t}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* right — mockup */}
                    <ScrollReveal direction="right" delay={200}>
                        <div style={{ background: 'rgba(10,13,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
                            {/* TL;DR banner */}
                            <div style={{ background: 'rgba(99,102,241,0.12)', borderBottom: '1px solid rgba(99,102,241,0.2)', padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <div style={{ marginTop: 2 }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#818cf8', animation: 'pulse 2s infinite' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#818cf8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>TL;DR · AI Summary</div>
                                    <div style={{ fontSize: 12, color: 'rgba(196,181,253,0.85)', lineHeight: 1.55 }}>
                                        Payment API was returning 503s due to connection pool exhaustion. Team diagnosed with @ai help, bumped the pool limit, added a circuit breaker pattern, and merged the fix. Payments restored ✅
                                    </div>
                                </div>
                            </div>
                            {/* messages */}
                            <div style={{ padding: '12px 14px', maxHeight: 220, overflowY: 'hidden' }}>
                                {messages.slice(0, 6).map((m, i) => (
                                    <div key={i} style={{ marginBottom: 8, animation: `heroFade 0.4s ease ${i * 80}ms both` }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: m.ai ? '#a78bfa' : m.clr, marginRight: 6 }}>{m.u}</span>
                                        <span style={{ fontSize: 12, color: m.ai ? 'rgba(196,181,253,0.8)' : 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{m.msg}</span>
                                    </div>
                                ))}
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', marginTop: 4, fontStyle: 'italic' }}>+ 4 more messages...</div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </ScrollReveal>
        </section>
    );
}

// ── ThinkSpace showcase card ──────────────────────────────────────────────────
function ThinkSpaceCard() {
    const convo = [
        { me: true, msg: 'Is the approach Rahul suggested in the main channel actually correct?' },
        { me: false, msg: "Rahul's suggestion to use a circuit breaker is solid engineering practice. However, for your specific case with connection pool exhaustion, you'd want to pair it with pool monitoring — the breaker alone won't prevent the root cause." },
        { me: true, msg: 'What should I actually say to not sound clueless in the thread?' },
        { me: false, msg: "Say: 'Good call on the circuit breaker — I'd also add pool metrics to Datadog so we catch this earlier next time.' That positions you well without overcomplicating it." },
    ];

    return (
        <section style={{ padding: 'clamp(20px,4vw,60px) clamp(20px,5vw,80px) clamp(40px,6vw,80px)', maxWidth: 1200, margin: '0 auto' }}>
            <ScrollReveal>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 40, alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 28, padding: 'clamp(28px,4vw,56px)', overflow: 'hidden', position: 'relative'
                }}>
                    {/* glow */}
                    <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

                    {/* left — mockup (reversed order on this card) */}
                    <ScrollReveal direction="left" delay={100}>
                        <div style={{ background: 'rgba(10,13,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
                            {/* header — matches real UI: sparkle icon, title, X button */}
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>✨</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1 }}>ThinkSpace</div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 3 }}>Ask AI • Only visible to you</div>
                                </div>
                                <div style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'default' }}>✕</div>
                            </div>

                            {/* chat area */}
                            <div style={{ padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200 }}>
                                {convo.map((m, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: m.me ? 'flex-end' : 'flex-start', animation: `heroFade 0.4s ease ${i * 100}ms both` }}>
                                        <div style={{
                                            maxWidth: '84%', padding: '9px 13px',
                                            borderRadius: m.me ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                            background: m.me ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.06)',
                                            border: m.me ? 'none' : '1px solid rgba(255,255,255,0.07)',
                                            fontSize: 11.5, color: m.me ? 'white' : 'rgba(255,255,255,0.65)', lineHeight: 1.55
                                        }}>{m.msg}</div>
                                    </div>
                                ))}
                            </div>

                            {/* bottom input + button — matches real UI exactly */}
                            <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 4 }}>
                                <div style={{
                                    padding: '10px 13px', borderRadius: 12, marginBottom: 10,
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                                }}>
                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>Ask privately about the chat...</span>
                                </div>
                                <div style={{
                                    width: '100%', padding: '11px 0', borderRadius: 12, textAlign: 'center',
                                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                    fontSize: 12, fontWeight: 700, color: 'white',
                                    boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                                }}>
                                    Ask Privately
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* right — copy */}
                    <ScrollReveal direction="right" delay={200}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 999, padding: '4px 14px', marginBottom: 20 }}>
                                <span style={{ fontSize: 14 }}>🔒</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#c084fc', letterSpacing: '0.08em', textTransform: 'uppercase' }}>ThinkSpace</span>
                            </div>
                            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 800, color: 'white', letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 16 }}>
                                Your private AI — invisible to the team
                            </h2>
                            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, marginBottom: 24 }}>
                                ThinkSpace is a personal AI sidebar only you can see. Ask anything about the conversation, get up to speed, draft replies, or just think out loud — without anyone else knowing.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {['Completely hidden from your teammates', 'Has full context of the group chat', 'Helps you think before you type'].map((t, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#c084fc', flexShrink: 0 }}>✓</span>
                                        {t}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </ScrollReveal>
        </section>
    );
}

// ── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay = 0 }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(28px)',
            transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20,
            padding: '28px 24px',
            backdropFilter: 'blur(8px)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* subtle top highlight */}
            <div style={{
                position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)'
            }} />
            <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16, fontSize: 22
            }}>
                {icon}
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.88)', marginBottom: 8, letterSpacing: '-0.01em' }}>
                {title}
            </div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65 }}>
                {desc}
            </div>
        </div>
    );
}

// ── Pill badge ────────────────────────────────────────────────────────────────
function Pill({ children }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.28)',
            borderRadius: 999, padding: '4px 14px', fontSize: 12,
            color: 'rgba(165,180,252,0.9)', fontWeight: 600, letterSpacing: '0.04em'
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            {children}
        </span>
    );
}

// ── Auth modal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, onLogin, defaultMode = 'login' }) {
    const [isRegister, setIsRegister] = useState(defaultMode === 'register');
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(null);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const endpoint = isRegister ? 'register' : 'login';
            const res = await fetch(`http://localhost:8081/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) {
                if (isRegister) {
                    alert("Registered! Please login.");
                    setIsRegister(false);
                } else {
                    onLogin(data);
                }
            } else {
                alert("Error: " + (data.error || "Action failed"));
            }
        } catch { alert("Connection failed."); }
        setLoading(false);
    };

    const inputStyle = (name) => ({
        width: '100%', padding: '13px 16px', borderRadius: 14,
        background: focused === name ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: focused === name ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.88)', fontSize: 14, outline: 'none',
        transition: 'border-color 0.2s, background 0.2s', boxSizing: 'border-box',
        fontFamily: 'inherit',
    });

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(4,6,14,0.82)', backdropFilter: 'blur(16px)',
            padding: 16, animation: 'fadeIn 0.2s ease'
        }} onClick={onClose}>
            <div style={{
                background: 'rgba(10,13,25,0.96)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 28, padding: '40px 36px', width: '100%', maxWidth: 420,
                position: 'relative', animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)'
            }} onClick={e => e.stopPropagation()}>

                {/* close */}
                <button onClick={onClose} style={{
                    position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.06)',
                    border: 'none', borderRadius: 10, width: 32, height: 32, color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s, color 0.2s'
                }}
                    onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = 'white'; }}
                    onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.color = 'rgba(255,255,255,0.4)'; }}>
                    ✕
                </button>

                {/* Logo mark */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 24px rgba(99,102,241,0.35)', fontSize: 18
                    }}>⚡</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'white', letterSpacing: '-0.02em' }}>BuildSpace</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                            {isRegister ? 'Create your account' : 'Sign in to your workspace'}
                        </div>
                    </div>
                </div>

                {/* Tab toggle */}
                <div style={{
                    display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 14,
                    padding: 4, marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)'
                }}>
                    {['login', 'register'].map(m => (
                        <button key={m} onClick={() => setIsRegister(m === 'register')} style={{
                            flex: 1, padding: '9px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                            transition: 'all 0.2s',
                            background: (m === 'register') === isRegister ? 'rgba(99,102,241,0.25)' : 'transparent',
                            color: (m === 'register') === isRegister ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                        }}>
                            {m === 'login' ? 'Sign In' : 'Register'}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {isRegister && (
                        <div style={{ animation: 'slideDown 0.2s ease' }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Username</label>
                            <input type="text" placeholder="your_username" style={inputStyle('username')}
                                onFocus={() => setFocused('username')} onBlur={() => setFocused(null)}
                                onChange={e => setForm({ ...form, username: e.target.value })} />
                        </div>
                    )}
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email</label>
                        <input type="email" placeholder="you@company.com" style={inputStyle('email')}
                            onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                            onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Password</label>
                        <input type="password" placeholder="••••••••" style={inputStyle('password')}
                            onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }} />
                    </div>

                    <button onClick={handleSubmit} disabled={loading} style={{
                        width: '100%', padding: '14px 0', marginTop: 8, borderRadius: 14, border: 'none',
                        background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', letterSpacing: '0.01em',
                        transition: 'opacity 0.2s, transform 0.1s',
                        boxShadow: loading ? 'none' : '0 4px 24px rgba(99,102,241,0.35)',
                    }}
                        onMouseEnter={e => { if (!loading) e.target.style.opacity = '0.88'; }}
                        onMouseLeave={e => { e.target.style.opacity = '1'; }}
                        onMouseDown={e => { e.target.style.transform = 'scale(0.98)'; }}
                        onMouseUp={e => { e.target.style.transform = 'scale(1)'; }}>
                        {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main landing page ─────────────────────────────────────────────────────────
export default function Auth({ onLogin }) {
    const [showAuth, setShowAuth] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [heroVisible, setHeroVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setHeroVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    const openAuth = (mode) => { setAuthMode(mode); setShowAuth(true); };

    const features = [
        { icon: '💬', title: 'Group Workspaces', desc: 'Password-protected rooms for your team. Share code snippets, links, files, and ideas all in one place.', delay: 0 },
        { icon: '🤖', title: 'AI on Demand', desc: 'Tag @ai anywhere in chat to get instant answers, code explanations, or brainstorming help — visible to the whole group.', delay: 80 },
        { icon: '🔒', title: 'ThinkSpace', desc: 'Your private AI sidebar. Ask sensitive questions or think out loud without the rest of the team seeing.', delay: 160 },
        { icon: '📋', title: 'Auto TL;DR', desc: 'Missed a busy thread? BuildSpace generates a smart summary after 10+ messages so you\'re never lost.', delay: 240 },
        { icon: '📁', title: 'File & Knowledge Sharing', desc: 'Upload files directly into the chat or feed facts to the AI to make it smarter about your project context.', delay: 320 },
        { icon: '🔑', title: 'Invite by Password', desc: 'No email invites or admin panels. Just share the room name and password — your team is in.', delay: 400 },
    ];

    return (
        <>
            <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
        body { background: #080c14; }
        ::placeholder { color: rgba(255,255,255,0.22) !important; }

        @keyframes orbFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(18px, -22px) scale(1.04); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.93) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.4; }
        }
        @keyframes heroFade {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .nav-btn {
          padding: 9px 22px; border-radius: 12px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: none; font-family: 'DM Sans', sans-serif;
          transition: all 0.18s ease; letter-spacing: 0.01em;
        }
        .nav-btn-ghost {
          background: transparent; color: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .nav-btn-ghost:hover { background: rgba(255,255,255,0.06); color: white; border-color: rgba(255,255,255,0.2); }
        .nav-btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white; box-shadow: 0 2px 16px rgba(99,102,241,0.3);
        }
        .nav-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 4px 24px rgba(99,102,241,0.4); }

        .hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(42px, 7vw, 78px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: white;
        }
        .gradient-text {
          background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #818cf8 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .cta-primary {
          padding: 15px 36px; border-radius: 16px; border: none;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white; font-size: 15px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 32px rgba(99,102,241,0.4);
          transition: all 0.2s ease; letter-spacing: 0.01em;
        }
        .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(99,102,241,0.5); opacity: 0.92; }
        .cta-secondary {
          padding: 15px 36px; border-radius: 16px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7); font-size: 15px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s ease;
        }
        .cta-secondary:hover { background: rgba(255,255,255,0.09); color: white; border-color: rgba(255,255,255,0.2); }

        .mockup-bar { height: 8px; border-radius: 4px; background: rgba(255,255,255,0.08); }
        .mockup-msg { border-radius: 10px; padding: 8px 12px; font-size: 12px; margin-bottom: 6px; }
      `}</style>

            <div style={{ minHeight: '100vh', background: '#080c14', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
                <GridBackground />

                {/* ── NAV ── */}
                <nav style={{
                    position: 'sticky', top: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 clamp(20px, 5vw, 80px)', height: 64,
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(8,12,20,0.75)', backdropFilter: 'blur(20px)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 10,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, boxShadow: '0 0 20px rgba(99,102,241,0.3)'
                        }}>⚡</div>
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 24, color: 'white', letterSpacing: '-0.02em' }}>
                            BuildSpace
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="nav-btn nav-btn-ghost" onClick={() => openAuth('login')}>Sign In</button>
                        <button className="nav-btn nav-btn-primary" onClick={() => openAuth('register')}>Get Started</button>
                    </div>
                </nav>

                {/* ── HERO ── */}
                <section style={{
                    padding: 'clamp(64px, 10vw, 120px) clamp(20px, 5vw, 80px) 80px',
                    maxWidth: 1200, margin: '0 auto', position: 'relative',
                    opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)',
                    transition: 'opacity 0.7s ease, transform 0.7s ease'
                }}>
                    <div style={{ maxWidth: 760 }}>
                        <div style={{ marginBottom: 24 }}>
                            <Pill>Built for engineers & students</Pill>
                        </div>
                        <h1 className="hero-title" style={{ marginBottom: 24 }}>
                            Your team's AI-powered<br />
                            <span className="gradient-text">collab workspace</span>
                        </h1>
                        <p style={{
                            fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.45)',
                            lineHeight: 1.75, maxWidth: 560, marginBottom: 40
                        }}>
                            Group chat with built-in AI, private ThinkSpace, auto TL;DR summaries, and file sharing — all in one password-protected room for your project team.
                        </p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <button className="cta-primary" onClick={() => openAuth('register')}>
                                Create Free Workspace →
                            </button>
                            <button className="cta-secondary" onClick={() => openAuth('login')}>
                                Sign In
                            </button>
                        </div>

                        {/* social proof strip */}
                        <div style={{
                            marginTop: 48, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap'
                        }}>
                            {['Groups', 'Private AI', 'File Sharing', 'TL;DR'].map((t, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 500 }}>
                                    <span style={{ color: '#6ee7b7', fontSize: 12 }}>✓</span> {t}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Floating chat mockup ── */}
                    <div style={{
                        position: 'absolute', right: 'clamp(-20px, 2vw, 40px)', top: '50%',
                        transform: 'translateY(-40%)',
                        width: 'min(340px, 32vw)',
                        display: 'window.innerWidth < 900 ? none : block',
                    }}>
                        <div style={{
                            background: 'rgba(14,18,32,0.9)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 20, padding: '16px', backdropFilter: 'blur(12px)',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
                            animation: 'orbFloat 7s ease-in-out infinite',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#818cf8', animation: 'pulse 2s infinite' }} />
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}># engineering-team</span>
                            </div>
                            {[
                                { u: 'Priya', msg: 'Anyone looked at the auth bug yet?', self: false, clr: '#a5b4fc' },
                                { u: 'Rahul', msg: '@ai what causes JWT expiry issues?', self: false, clr: '#86efac' },
                                { u: 'AI', msg: 'JWT tokens expire when the `exp` claim passes the current timestamp. Check your server clock sync...', self: false, ai: true },
                                { u: 'You', msg: 'Great, fixing it now 🙌', self: true },
                            ].map((m, i) => (
                                <div key={i} style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', alignItems: m.self ? 'flex-end' : 'flex-start', animation: `heroFade 0.5s ease ${i * 120 + 300}ms both` }}>
                                    {!m.self && <span style={{ fontSize: 10, color: m.ai ? '#a78bfa' : m.clr, fontWeight: 700, marginBottom: 3, marginLeft: 2 }}>{m.u}</span>}
                                    <div style={{
                                        background: m.self ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : m.ai ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.05)',
                                        border: m.ai ? '1px solid rgba(99,102,241,0.25)' : 'none',
                                        borderRadius: m.self ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                        padding: '8px 12px', maxWidth: '85%',
                                        color: m.self ? 'white' : m.ai ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.7)',
                                        fontSize: 12, lineHeight: 1.55,
                                    }}>
                                        {m.msg}
                                    </div>
                                </div>
                            ))}
                            <div style={{
                                marginTop: 12, padding: '10px 12px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex', alignItems: 'center', gap: 8
                            }}>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', flex: 1 }}>Message #engineering-team...</span>
                                <span style={{ fontSize: 14 }}>📎</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── FEATURES ── */}
                <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)', maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ marginBottom: 52, maxWidth: 540 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
                            Everything your team needs
                        </p>
                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'white', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                            Built for the way engineers actually work
                        </h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {features.map((f, i) => <FeatureCard key={i} {...f} />)}
                    </div>
                </section>

                {/* ── TLDR SHOWCASE ── */}
                <TLDRCard />

                {/* ── THINKSPACE SHOWCASE ── */}
                <ThinkSpaceCard />

                {/* ── HOW IT WORKS ── */}
                <section style={{
                    padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)',
                    maxWidth: 1200, margin: '0 auto'
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 28, padding: 'clamp(32px, 5vw, 64px)',
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32,
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)' }} />
                        {[
                            { n: '01', title: 'Create a room', desc: 'Name your workspace and set a password — done.' },
                            { n: '02', title: 'Invite your team', desc: 'Share the room name & password. No emails, no fuss.' },
                            { n: '03', title: 'Build together', desc: 'Chat, share files, tag @ai, and use ThinkSpace privately.' },
                        ].map((step, i) => (
                            <div key={i} style={{ position: 'relative' }}>
                                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 40, fontWeight: 800, color: 'rgba(99,102,241,0.15)', lineHeight: 1, marginBottom: 12 }}>
                                    {step.n}
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>{step.title}</div>
                                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.65 }}>{step.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── CTA BANNER ── */}
                <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,80px) clamp(80px,10vw,120px)', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
                        border: '1px solid rgba(99,102,241,0.2)', borderRadius: 28,
                        padding: 'clamp(40px, 6vw, 72px)', position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)' }} />
                        <div style={{ position: 'relative' }}>
                            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, color: 'white', letterSpacing: '-0.025em', marginBottom: 16 }}>
                                Ready to build something great?
                            </h2>
                            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 36 }}>
                                Create your workspace in 30 seconds.
                            </p>
                            <button className="cta-primary" onClick={() => openAuth('register')}>
                                Start for free →
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <footer style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    padding: '24px clamp(20px,5vw,80px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>⚡</span>
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>BuildSpace</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Built for engineers who ship.</span>
                </footer>
            </div>

            {/* Auth modal */}
            {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={onLogin} defaultMode={authMode} />}
        </>
    );
}
