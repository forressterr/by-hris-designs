import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

/*
  LabsCover — Home-page cover for the Labs section.
  The real constellation runs as a NON-INTERACTIVE background (idle drift,
  flowing wires, travelling spark dots — no pan/zoom/drag). Over it sits an
  Apple-style "liquid glass" panel locked at its lightest setting: light
  backdrop blur + saturation, an SVG displacement filter for refraction, a
  specular rim + a slow drifting sheen. The constellation reads as a soft,
  living rumour. The whole tile is one link to /labs. Theme-reactive via the
  site tokens; reduced-motion freezes the scene.

  GLASS is locked (was the slider's left-most / lightest position):
    blur 11px (9px on hover), displacement 26, tint 0.107.
*/

const GLASS = { blur: 11, hoverBlur: 9, disp: 26, tint: 0.107 };

const BG_W = 520,
  BG_H = 440,
  BC = { x: 260, y: 220 };
const BN = [
  { id: 'wip', x: 104, y: 157, ph: 0.0 },
  { id: 'side', x: 408, y: 145, ph: 1.4 },
  { id: 'principles', x: 88, y: 291, ph: 2.7 },
  { id: 'ai', x: 441, y: 275, ph: 4.0 },
  { id: 'skills', x: 287, y: 333, ph: 5.3 },
];
const BB = Object.fromEntries(BN.map((n) => [n.id, n]));
const BE = [
  ['c', 'wip', 1],
  ['c', 'side', 1],
  ['c', 'principles', 1],
  ['c', 'ai', 1],
  ['c', 'skills', 1],
  ['side', 'ai', 0],
  ['principles', 'skills', 0],
];
const base = (id) =>
  id === 'c' ? { x: BC.x, y: BC.y } : { x: BB[id].x, y: BB[id].y };

function curve(a, b) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    len = Math.hypot(dx, dy) || 1;
  const off = Math.min(40, len * 0.12);
  const cx = (a.x + b.x) / 2 + (-dy / len) * off;
  const cy = (a.y + b.y) / 2 + (dx / len) * off;
  return { d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`, cx, cy };
}
const bez = (p0, c, p1, t) => ({
  x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x,
  y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y,
});

function useReduced() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setR(mq.matches);
    f();
    mq.addEventListener?.('change', f);
    return () => mq.removeEventListener?.('change', f);
  }, []);
  return r;
}

function ConstellationBG({ reduced }) {
  const nodeEls = useRef({});
  const edgeEls = useRef([]);
  const dotEls = useRef([]);
  const live = useRef(
    Object.fromEntries(BN.map((n) => [n.id, { x: n.x, y: n.y }])),
  );

  useEffect(() => {
    const posOf = (id) =>
      id === 'c' ? { x: BC.x, y: BC.y } : live.current[id];
    const draw = (now) => {
      const t = now * 0.001,
        m = reduced ? 0 : 1;
      for (const n of BN) {
        const x = n.x + Math.sin(t * 0.55 + n.ph) * 7 * m;
        const y = n.y + Math.cos(t * 0.47 + n.ph * 1.3) * 6 * m;
        live.current[n.id] = { x, y };
        const el = nodeEls.current[n.id];
        if (el) el.style.transform = `translate(${x - n.x}px, ${y - n.y}px)`;
      }
      BE.forEach(([a, b], i) => {
        const p = edgeEls.current[i];
        if (p) p.setAttribute('d', curve(posOf(a), posOf(b)).d);
      });
      BE.filter((e) => e[2]).forEach((e, j) => {
        const dot = dotEls.current[j];
        if (!dot) return;
        const a = posOf(e[0]),
          b = posOf(e[1]),
          g = curve(a, b);
        const tt = reduced ? 0.5 : (((now * 0.00016 + j * 0.21) % 1) + 1) % 1;
        const p = bez(a, { x: g.cx, y: g.cy }, b, tt);
        dot.setAttribute('cx', p.x);
        dot.setAttribute('cy', p.y);
      });
    };
    let raf = 0;
    const loop = (now) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    draw(performance.now());
    if (!reduced) raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  let hub = -1;
  return (
    <svg
      className="lc-bg"
      viewBox={`0 0 ${BG_W} ${BG_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {BE.map(([a, b], i) => (
        <path
          key={i}
          ref={(el) => (edgeEls.current[i] = el)}
          d={curve(base(a), base(b)).d}
          className="lc-wire"
        />
      ))}
      {BE.map((e, i) => {
        if (!e[2]) return null;
        hub++;
        const g = curve(base(e[0]), base(e[1]));
        const p = bez(base(e[0]), { x: g.cx, y: g.cy }, base(e[1]), 0.5);
        const j = hub;
        return (
          <circle
            key={'d' + i}
            ref={(el) => (dotEls.current[j] = el)}
            cx={p.x}
            cy={p.y}
            r="4.5"
            className="lc-dot"
          />
        );
      })}
      {BN.map((n) => (
        <g key={n.id} ref={(el) => (nodeEls.current[n.id] = el)}>
          <circle cx={n.x} cy={n.y} r="11" className="lc-node" />
        </g>
      ))}
      <circle cx={BC.x} cy={BC.y} r="16" className="lc-heartRing" />
      <circle cx={BC.x} cy={BC.y} r="8" className="lc-heart" />
    </svg>
  );
}

export default function LabsCover() {
  const [hover, setHover] = useState(false);
  const reduced = useReduced();
  const blur = hover ? GLASS.hoverBlur : GLASS.blur;

  return (
    <Link
      href="/labs"
      className="lc-cover"
      aria-label="Labs — step inside the work in progress"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <style>{CSS}</style>

      {/* refraction filter for the backdrop (Chromium); Safari falls back to blur */}
      <svg className="lc-defs" aria-hidden="true">
        <filter id="lc-liquid" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.009 0.013"
            numOctaves="2"
            seed="7"
            result="n"
          >
            {!reduced && (
              <animate
                attributeName="baseFrequency"
                dur="22s"
                values="0.009 0.013;0.012 0.010;0.009 0.013"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={GLASS.disp}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <span className="lc-grid" />
      <span className="lc-washTR" />
      <span className="lc-washBL" />
      <ConstellationBG reduced={reduced} />

      <span
        className="lc-glass"
        style={{
          backdropFilter: `url(#lc-liquid) blur(${blur}px) saturate(170%) brightness(1.06)`,
          background: `linear-gradient(135deg, rgba(255,255,255,${GLASS.tint + 0.06}), rgba(255,255,255,${GLASS.tint * 0.4}) 42%, rgba(255,255,255,${GLASS.tint}))`,
        }}
      >
        <span className="lc-gloss" />
        <span className={'lc-sheen' + (reduced ? ' lc-still' : '')} />
        <span className="lc-rim" />
      </span>

      <span className="lc-eyebrow">
        <i className="lc-eyeDot" /> LABS
      </span>
      <span className={'lc-cta' + (hover ? ' lc-on' : '')}>
        Still cooking — peek in <b>→</b>
      </span>
    </Link>
  );
}

const CSS = `
.lc-cover{
  --lc-spark:#e8763a;
  position:relative; display:block; width:100%; aspect-ratio:16/9; max-height:520px;
  border-radius:var(--radius-lg, 24px); overflow:hidden; isolation:isolate;
  border:1px solid var(--line); background:var(--bg); text-decoration:none; color:var(--ink); cursor:pointer; outline:none;
}
.lc-cover:focus-visible{ box-shadow:0 0 0 2px var(--bg), 0 0 0 4px var(--lc-spark); }
.lc-defs{ position:absolute; width:0; height:0; }

.lc-grid{ position:absolute; inset:0; background-image:radial-gradient(circle, var(--line) 1px, transparent 1px); background-size:24px 24px; }
.lc-washTR{ position:absolute; inset:0; background:radial-gradient(540px 420px at 88% -12%, rgba(240,160,96,.40), transparent 60%); }
.lc-washBL{ position:absolute; inset:0; background:radial-gradient(620px 480px at 8% 114%, rgba(150,160,232,.42), transparent 58%); }

.lc-bg{ position:absolute; inset:0; width:100%; height:100%; }
.lc-wire{ fill:none; stroke:var(--lc-spark); stroke-width:2; opacity:.5; stroke-dasharray:6 7; animation:lc-flow 2.4s linear infinite; }
@keyframes lc-flow{ to{ stroke-dashoffset:-26; } }
.lc-node{ fill:var(--bg); stroke:var(--lc-spark); stroke-width:2.4; opacity:.8; }
.lc-heartRing{ fill:none; stroke:var(--lc-spark); stroke-width:2.4; opacity:.6; }
.lc-heart{ fill:var(--lc-spark); }
.lc-dot{ fill:var(--lc-spark); filter:drop-shadow(0 0 5px rgba(232,118,58,.8)); }

/* liquid glass — CSS rule is the Safari-safe fallback (blur only, no url refraction);
   the inline backdropFilter adds the SVG displacement on Chromium */
.lc-glass{
  position:absolute; inset:0; pointer-events:none;
  backdrop-filter:blur(11px) saturate(170%) brightness(1.06);
  -webkit-backdrop-filter:blur(11px) saturate(170%) brightness(1.06);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);
}
[data-theme='dark'] .lc-glass{ box-shadow:inset 0 0 0 1px rgba(255,255,255,.08); }
.lc-gloss{ position:absolute; inset:0; mix-blend-mode:screen; background:
  linear-gradient(135deg, rgba(255,255,255,.34) 0%, rgba(255,255,255,0) 30%),
  radial-gradient(120% 80% at 50% -20%, rgba(255,255,255,.28), transparent 55%); }
[data-theme='dark'] .lc-gloss{ opacity:.5; }
.lc-sheen{ position:absolute; top:0; bottom:0; width:38%; left:-40%;
  background:linear-gradient(105deg, transparent, rgba(255,255,255,.5), transparent);
  filter:blur(8px); transform:skewX(-12deg); animation:lc-sheen 9s ease-in-out infinite; }
.lc-sheen.lc-still{ animation:none; left:30%; opacity:.4; }
@keyframes lc-sheen{ 0%,100%{ left:-40%; } 50%{ left:120%; } }
.lc-rim{ position:absolute; inset:0; border-radius:inherit; box-shadow:
  inset 1px 1px 1px rgba(255,255,255,.55), inset -1px -1px 2px rgba(255,255,255,.18), inset 0 -20px 40px -24px rgba(0,0,0,.18); }

.lc-eyebrow{ position:absolute; top:20px; left:22px; font-family:var(--font-mono); font-size:11px; letter-spacing:.12em; color:var(--ink); opacity:.7; display:flex; align-items:center; gap:7px; }
.lc-eyeDot{ width:7px; height:7px; border-radius:7px; background:var(--lc-spark); box-shadow:0 0 8px rgba(232,118,58,.7); }
.lc-cta{ position:absolute; right:22px; bottom:20px; font-family:var(--font-mono); font-size:13px; color:var(--ink); opacity:.62; transform:translateY(4px); transition:opacity .35s, transform .35s; }
.lc-cta.lc-on{ opacity:1; transform:translateY(0); }
.lc-cta b{ color:var(--lc-spark); }

@media (prefers-reduced-motion: reduce){ .lc-wire, .lc-sheen{ animation:none !important; } }
`;
