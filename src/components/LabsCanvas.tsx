import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { Plus, Minus, Maximize, Lock, Unlock, Hand } from 'lucide-react';

/*
  LabsCanvas — "work in progress" overview for personal / side / hobby projects.
  Five category nodes idle-float around a pinned centre and wire into a small
  organism (hub edges + a couple of inter-links). Pan, zoom, drag nodes, a hand
  tool to toggle node-handling, and a lock that freezes the perspective.

  EDGES ARE RENDER-PROOF (read CONNECTIONS.md before touching the SVG)
  -------------------------------------------------------------------
  Every <path> ships a STATIC `d` (BASE_D, from the nodes' base layout) and the
  rAF loop only *updates* `d` to follow drift/drag — so the connection lines are
  visible on first paint with zero dependency on the loop running. Colour/opacity
  stay DECLARATIVE (React, hover-driven) so a re-render can't blank them. Here the
  colours are written via `style` (not the `stroke`/`fill` attributes) so the
  `var(--token)` references resolve live per theme — render-proof AND theme-aware.
  Rules: keep `overflow: visible` on the <svg>; never remove the JSX `d`/colour;
  keep the edges first inside the transform layer, above grid/wash, pointer-events:none.

  Localised to the By_Hris design system: `C` maps to the site's CSS custom
  properties (light/dark theme), fonts use the global DM Sans / DM Mono, and the
  page chrome (breadcrumb, headline, lede, CTA) is supplied by the Labs route —
  this component renders the canvas only. `C.spark` is the lone accent.

  PERFORMANCE: one imperative requestAnimationFrame loop writes drift, parallax,
  edge geometry, dots, the camera transform and the grid to the DOM via refs and
  never calls setState. React state is discrete only (hover, lock, hand, zoom).
  Under prefers-reduced-motion the loop doesn't run; the scene draws once.

  DEPENDENCIES: react, lucide-react. No canvas library required.
*/

/* ----------------------------- config: edit me ---------------------------- */
// Mapped to the By_Hris tokens (src/styles/index.css). var() references resolve
// per-theme; `spark` is the single, theme-independent accent.
const C = {
  ink: 'var(--ink)',
  body: 'var(--muted)',
  faint: 'var(--muted-2)',
  hair: 'var(--line)',
  line: 'var(--muted)', // resting edges: a clearly visible mid-gray so the wiring reads, not just the dots
  card: 'var(--bg)',
  canvas: 'var(--bg)',
  grid: 'var(--line)',
  spark: '#e8763a', // warm "handful of spark" accent — the lone accent colour
};

const NODES = [
  {
    id: 'wip',
    n: '01',
    title: 'Work in progress',
    body: 'The half-built, the rough draft, the thing I’d usually keep off the portfolio until it was polished. Here it gets to exist anyway.',
    x: -372,
    y: -150,
    depth: 1.0,
    phase: 0.0,
  },
  {
    id: 'side',
    n: '02',
    title: 'Side quests',
    body: 'Personal explorations that don’t fit the day job — 3D, brand experiments, weekend builds, anything that lets the curiosity off the leash.',
    x: 352,
    y: -178,
    depth: 0.8,
    phase: 1.4,
  },
  {
    id: 'principles',
    n: '03',
    title: 'Principles I’m testing',
    body: 'New ways of thinking about a design problem — frameworks, instincts, and manners picked up recently and not yet fully formed.',
    x: -410,
    y: 168,
    depth: 0.62,
    phase: 2.7,
  },
  {
    id: 'ai',
    n: '04',
    title: 'AI × design',
    body: 'The ever-expanding horizon of what AI gives designers — what it changes, what it accelerates, and what it asks us to rethink.',
    x: 430,
    y: 132,
    depth: 0.92,
    phase: 4.0,
  },
  {
    id: 'skills',
    n: '05',
    title: 'Skills in flight',
    body: 'Tools, techniques, and disciplines I’m actively adding to the arsenal. Some land, some don’t — both end up in here.',
    x: 64,
    y: 268,
    depth: 0.5,
    phase: 5.3,
  },
];

// hub edges carry a travelling signal dot; the last three only tease interconnection
const EDGES = [
  { a: 'center', b: 'wip', hub: true },
  { a: 'center', b: 'side', hub: true },
  { a: 'center', b: 'principles', hub: true },
  { a: 'center', b: 'ai', hub: true },
  { a: 'center', b: 'skills', hub: true },
  { a: 'side', b: 'ai', hub: false },
  { a: 'principles', b: 'skills', hub: false },
  { a: 'wip', b: 'principles', hub: false },
];

/* --------------------------------- engine -------------------------------- */
// World coordinates are CENTRE-ORIGIN: (0,0) is the canvas centre = the heart.
// The <svg> sits at that origin with overflow:visible, so negative coords paint.

type Pt = { x: number; y: number };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));
const HUB = EDGES.map((e, i) => ({ ...e, i })).filter((e) => e.hub);

// The edge <svg> is a FIXED box (SVGW x SVGH) centred on the layer origin and
// carries maxWidth:'none' so the global `img,svg,video{max-width:100%}` reset
// can't clamp it (that reset shrank the old width:1 svg to ~0 and the lines
// vanished). `toSvg` shifts centre-origin coords into the box (all positive) so
// every endpoint lands INSIDE it — no reliance on overflow painting.
const SVGW = 2400,
  SVGH = 1700;
const OFF = { x: SVGW / 2, y: SVGH / 2 };
const toSvg = (p: Pt) => ({ x: p.x + OFF.x, y: p.y + OFF.y });

// curved connector between two centre-origin points
function geom(a: Pt, b: Pt) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const off = Math.min(46, len * 0.12);
  const cx = (a.x + b.x) / 2 + (-dy / len) * off;
  const cy = (a.y + b.y) / 2 + (dx / len) * off;
  return { d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`, cx, cy };
}
const bez = (p0: Pt, c: Pt, p1: Pt, t: number) => ({
  x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x,
  y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y,
});

// static fallback layout — guarantees lines are visible without the loop
const POS_INIT = (id: string) => {
  const node = id === 'center' ? undefined : NODE_BY_ID[id];
  return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
};
const BASE_D = EDGES.map(
  (e) => geom(toSvg(POS_INIT(e.a)), toSvg(POS_INIT(e.b))).d,
);
const BASE_DOT = HUB.map((e) => {
  const a = toSvg(POS_INIT(e.a)),
    b = toSvg(POS_INIT(e.b)),
    g = geom(a, b);
  return bez(a, { x: g.cx, y: g.cy }, b, 0.5);
});

export default function LabsCanvas() {
  const [hover, setHover] = useState<string | null>(null);
  const [pulse, setPulse] = useState<string | null>(null);
  const [locked, setLocked] = useState(false); // start unlocked: live camera (pan / zoom / drag / parallax) — per request, as it was before the lock-on-load change
  const [moveNodes, setMoveNodes] = useState(true);
  const [zoom, setZoom] = useState(75);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const nodeEls = useRef<Record<string, HTMLDivElement | null>>({});
  const edgeEls = useRef<(SVGPathElement | null)[]>([]);
  const dotEls = useRef<(SVGCircleElement | null)[]>([]);

  const view = useRef({ tx: 0, ty: 0, k: 0.75 });
  const base = useRef(
    Object.fromEntries(NODES.map((n) => [n.id, { x: n.x, y: n.y }])),
  );
  const live = useRef(
    Object.fromEntries(NODES.map((n) => [n.id, { x: n.x, y: n.y }])),
  );
  const calm = useRef(Object.fromEntries(NODES.map((n) => [n.id, 1])));
  const para = useRef({ x: 0, y: 0 });
  const paraTarget = useRef({ x: 0, y: 0 });
  const reduced = useRef(false);

  const pan = useRef<{ sx: number; sy: number; tx: number; ty: number } | null>(
    null,
  );
  const dragNode = useRef<{
    id: string;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);
  const hoverRef = useRef<string | null>(null);
  const lockedRef = useRef(false);
  const drawRef = useRef<(now: number) => void>(() => {});

  useEffect(() => {
    hoverRef.current = hover;
    if (reduced.current) drawRef.current(performance.now());
  }, [hover]);
  useEffect(() => {
    lockedRef.current = locked;
    if (reduced.current) drawRef.current(performance.now());
  }, [locked]);

  useLayoutEffect(() => {
    reduced.current =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    const posOf = (id: string) =>
      id === 'center' ? { x: 0, y: 0 } : (live.current[id] ?? POS_INIT(id));

    const draw = (now: number) => {
      const v = view.current;
      if (layerRef.current)
        layerRef.current.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.k})`;
      if (gridRef.current) {
        gridRef.current.style.backgroundSize = `${26 * v.k}px ${26 * v.k}px`;
        gridRef.current.style.backgroundPosition = `${v.tx}px ${v.ty}px`;
      }

      const pt = lockedRef.current ? { x: 0, y: 0 } : paraTarget.current;
      para.current.x = lerp(para.current.x, pt.x, 0.06);
      para.current.y = lerp(para.current.y, pt.y, 0.06);

      const t = now * 0.001;
      const m = reduced.current ? 0 : 1;

      // nodes
      for (const node of NODES) {
        const b = base.current[node.id] ?? { x: node.x, y: node.y };
        let x = b.x,
          y = b.y;
        const dragging = dragNode.current && dragNode.current.id === node.id;
        if (!dragging) {
          const target = hoverRef.current === node.id ? 0.2 : 1;
          const cf = lerp(calm.current[node.id] ?? 1, target, 0.08);
          calm.current[node.id] = cf;
          const amp = (4 + node.depth * 6) * m * cf;
          x += Math.sin(t * 0.6 + node.phase) * amp;
          y += Math.cos(t * 0.5 + node.phase * 1.3) * amp * 0.8;
          const pf = node.depth * 22 * m * (0.35 + 0.65 * cf);
          x += para.current.x * pf;
          y += para.current.y * pf;
        }
        live.current[node.id] = { x, y };
        const el = nodeEls.current[node.id];
        if (el) el.style.transform = `translate(${x}px, ${y}px)`;
      }

      // edges: loop updates geometry ONLY (stroke/colour/opacity are declarative in JSX)
      for (let i = 0; i < EDGES.length; i++) {
        const e = EDGES[i];
        const path = edgeEls.current[i];
        if (!e || !path) continue;
        const g = geom(toSvg(posOf(e.a)), toSvg(posOf(e.b)));
        path.setAttribute('d', g.d);
      }

      // travelling signal dots: loop updates position ONLY
      for (let j = 0; j < HUB.length; j++) {
        const e = HUB[j];
        const dot = dotEls.current[j];
        if (!e || !dot) continue;
        const a = toSvg(posOf(e.a)),
          b = toSvg(posOf(e.b)),
          g = geom(a, b);
        const tt = reduced.current
          ? 0.5
          : (((now * 0.00018 + j * 0.21) % 1) + 1) % 1;
        const p = bez(a, { x: g.cx, y: g.cy }, b, tt);
        dot.setAttribute('cx', String(p.x));
        dot.setAttribute('cy', String(p.y));
      }
    };

    drawRef.current = draw;
    let raf = 0;
    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    draw(performance.now());
    if (!reduced.current) raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* camera */
  const onBgDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (locked) return;
    pan.current = {
      sx: e.clientX,
      sy: e.clientY,
      tx: view.current.tx,
      ty: view.current.ty,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!locked) {
      const r = wrapRef.current?.getBoundingClientRect();
      if (r)
        paraTarget.current = {
          x: ((e.clientX - r.left) / r.width - 0.5) * 2,
          y: ((e.clientY - r.top) / r.height - 0.5) * 2,
        };
    }
    if (pan.current) {
      view.current.tx = pan.current.tx + (e.clientX - pan.current.sx);
      view.current.ty = pan.current.ty + (e.clientY - pan.current.sy);
      if (reduced.current) drawRef.current(performance.now());
    }
  };
  const endPan = () => {
    pan.current = null;
  };
  const onLeave = () => {
    paraTarget.current = { x: 0, y: 0 };
    endPan();
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      if (lockedRef.current) return;
      ev.preventDefault();
      view.current.k = clamp(
        view.current.k * (1 - ev.deltaY * 0.0012),
        0.55,
        1.6,
      );
      setZoom(Math.round(view.current.k * 100));
      if (reduced.current) drawRef.current(performance.now());
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomBy = (d: number) => {
    if (locked) return;
    view.current.k = clamp(view.current.k + d, 0.55, 1.6);
    setZoom(Math.round(view.current.k * 100));
    if (reduced.current) drawRef.current(performance.now());
  };
  const fit = () => {
    if (locked) return;
    view.current = { tx: 0, ty: 0, k: 0.75 };
    setZoom(75);
    if (reduced.current) drawRef.current(performance.now());
  };

  /* node drag */
  const onNodeDown = (e: ReactPointerEvent<HTMLDivElement>, id: string) => {
    if (locked || !moveNodes) return;
    e.stopPropagation();
    const l = live.current[id];
    if (!l) return;
    base.current[id] = { x: l.x, y: l.y };
    dragNode.current = { id, sx: e.clientX, sy: e.clientY, ox: l.x, oy: l.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.currentTarget.style.cursor = 'grabbing';
  };
  const onNodeMove = (e: ReactPointerEvent<HTMLDivElement>, id: string) => {
    const d = dragNode.current;
    if (!d || d.id !== id) return;
    const k = view.current.k;
    base.current[id] = {
      x: d.ox + (e.clientX - d.sx) / k,
      y: d.oy + (e.clientY - d.sy) / k,
    };
    if (reduced.current) drawRef.current(performance.now());
  };
  const onNodeUp = (e: ReactPointerEvent<HTMLDivElement>, id: string) => {
    if (dragNode.current?.id === id) {
      dragNode.current = null;
      e.currentTarget.style.cursor = '';
    }
  };

  const nodeCursor = locked ? 'default' : moveNodes ? 'grab' : 'pointer';

  return (
    <>
      <style>{CSS}</style>

      {/* ---------------- canvas ---------------- */}
      <div
        ref={wrapRef}
        className="labs-canvas"
        style={{ ...S.canvas, cursor: locked ? 'default' : 'grab' }}
        onPointerDown={onBgDown}
        onPointerMove={onMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onPointerLeave={onLeave}
      >
        <div
          ref={gridRef}
          style={{
            ...S.gridLayer,
            backgroundSize: '24px 24px',
            backgroundPosition: '0px 0px',
          }}
        />
        <div style={S.washTR} />
        <div style={S.washBL} />

        <div ref={layerRef} style={S.layer}>
          {/* EDGES — centre-origin svg, overflow visible, render-proof: static d + declarative colour (via style → theme-reactive) */}
          <svg
            style={S.svg}
            width={SVGW}
            height={SVGH}
            viewBox={`0 0 ${SVGW} ${SVGH}`}
            overflow="visible"
          >
            {EDGES.map((e, i) => {
              const lit = hover && (e.a === hover || e.b === hover);
              return (
                <path
                  key={i}
                  ref={(el) => {
                    edgeEls.current[i] = el;
                  }}
                  className="flow"
                  d={BASE_D[i]}
                  fill="none"
                  strokeWidth={lit ? 1.8 : 1.6}
                  strokeDasharray="5 6"
                  style={{
                    stroke: lit ? C.spark : C.line,
                    opacity: hover ? (lit ? 1 : 0.28) : 0.65,
                    animationDuration: lit ? '0.9s' : '1.6s',
                  }}
                />
              );
            })}
            {HUB.map((e, j) => {
              const lit = hover && (e.a === hover || e.b === hover);
              const dotBase = BASE_DOT[j] ?? { x: OFF.x, y: OFF.y };
              return (
                <circle
                  key={j}
                  ref={(el) => {
                    dotEls.current[j] = el;
                  }}
                  cx={dotBase.x}
                  cy={dotBase.y}
                  r={lit ? 3 : 2.2}
                  style={{
                    fill: lit ? C.spark : C.faint,
                    opacity: hover && !lit ? 0.25 : 0.9,
                  }}
                />
              );
            })}
          </svg>

          {/* centre heart */}
          <div style={S.nodeWrap}>
            <div style={S.heart} onPointerDown={(e) => e.stopPropagation()}>
              <div style={S.status}>
                <span style={S.dot} /> Work in progress
              </div>
              <div style={S.heartLine}>
                Where curiosity and imagination give a start to new horizons.
              </div>
              <div style={S.heartSub}>
                The lab&rsquo;s still being wired up &mdash; peek in anytime to
                see what&rsquo;s cooking.
              </div>
              <div style={S.heartMeta}>GRTSV &middot; Labs</div>
            </div>
          </div>

          {/* category nodes */}
          {NODES.map((node) => {
            const on = hover === node.id;
            const dim = hover && !on;
            return (
              <div
                key={node.id}
                ref={(el) => {
                  nodeEls.current[node.id] = el;
                }}
                style={{
                  ...S.nodeWrap,
                  zIndex: on ? 30 : Math.round(node.depth * 10),
                }}
              >
                <div
                  onPointerDown={(e) => onNodeDown(e, node.id)}
                  onPointerMove={(e) => onNodeMove(e, node.id)}
                  onPointerUp={(e) => onNodeUp(e, node.id)}
                  onPointerCancel={(e) => onNodeUp(e, node.id)}
                  onMouseEnter={() => setHover(node.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => {
                    if (!dragNode.current) {
                      setPulse(node.id);
                      setTimeout(
                        () => setPulse((p) => (p === node.id ? null : p)),
                        650,
                      );
                    }
                  }}
                  className={pulse === node.id ? 'ring' : ''}
                  style={{
                    ...S.node,
                    cursor: nodeCursor,
                    transform: `scale(${on ? 1.04 : 1 - (1 - node.depth) * 0.06}) translateY(${on ? -6 : 0}px)`,
                    opacity: dim ? 0.55 : 1,
                    filter: dim ? 'saturate(0.9)' : 'none',
                    boxShadow: on
                      ? '0 18px 40px -16px rgba(20,20,25,0.22)'
                      : '0 6px 20px -14px rgba(20,20,25,0.18)',
                    borderColor: on ? 'rgba(232,118,58,0.55)' : C.hair,
                  }}
                >
                  <div style={S.nodeTop}>
                    <span style={S.nodeNum}>{node.n}</span>
                    <span style={S.soon}>
                      <Lock size={9} strokeWidth={2} /> soon
                    </span>
                  </div>
                  <div style={S.nodeTitle}>{node.title}</div>
                  <div
                    style={{
                      ...S.nodeBody,
                      maxHeight: on ? 120 : 0,
                      opacity: on ? 1 : 0,
                      marginTop: on ? 8 : 0,
                    }}
                  >
                    {node.body}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* control island */}
        <div style={S.island} onPointerDown={(e) => e.stopPropagation()}>
          <button
            style={{
              ...S.isBtn,
              ...(moveNodes && !locked ? S.isOn : {}),
              ...(locked ? S.isOff : {}),
            }}
            onClick={() => !locked && setMoveNodes((v) => !v)}
            aria-label="Move nodes"
            title="Move nodes"
          >
            <Hand size={15} strokeWidth={1.7} />
          </button>
          <button
            style={{ ...S.isBtn, ...(locked ? S.isOn : {}) }}
            onClick={() => setLocked((v) => !v)}
            aria-label={locked ? 'Unlock canvas' : 'Lock canvas'}
            title={locked ? 'Unlock canvas' : 'Lock canvas'}
          >
            {locked ? (
              <Lock size={14} strokeWidth={1.8} />
            ) : (
              <Unlock size={14} strokeWidth={1.8} />
            )}
          </button>
          <span style={S.isDiv} />
          <button
            style={{ ...S.isBtn, ...(locked ? S.isOff : {}) }}
            onClick={() => zoomBy(-0.12)}
            aria-label="Zoom out"
          >
            <Minus size={15} strokeWidth={1.8} />
          </button>
          <span style={S.isPct}>{zoom}%</span>
          <button
            style={{ ...S.isBtn, ...(locked ? S.isOff : {}) }}
            onClick={() => zoomBy(0.12)}
            aria-label="Zoom in"
          >
            <Plus size={15} strokeWidth={1.8} />
          </button>
          <span style={S.isDiv} />
          <button
            style={{ ...S.isBtn, ...(locked ? S.isOff : {}) }}
            onClick={fit}
            aria-label="Fit view"
          >
            <Maximize size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </>
  );
}

const CSS = `
.flow { animation: flow linear infinite; }
@keyframes flow { to { stroke-dashoffset: -22; } }
.ring { animation: ring 0.65s ease-out; }
@keyframes ring { 0% { box-shadow: 0 0 0 0 rgba(232,118,58,0.40); } 100% { box-shadow: 0 0 0 16px rgba(232,118,58,0); } }
@media (prefers-reduced-motion: reduce) { .flow { animation: none; } }
`;

// Global site fonts (loaded in index.html); resolve per element via the tokens.
const mono = 'var(--font-mono)';
const sans = 'var(--font-sans)';

const S: Record<string, CSSProperties> = {
  // canvas frame — fills the Labs <section> width, follows the page theme
  canvas: {
    position: 'relative',
    height: 640,
    fontFamily: sans,
    color: C.ink,
    borderRadius: 'var(--radius-lg)',
    border: `1px solid ${C.hair}`,
    background: C.canvas,
    overflow: 'hidden',
    touchAction: 'none',
    userSelect: 'none',
    WebkitFontSmoothing: 'antialiased',
  },
  gridLayer: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `radial-gradient(circle, ${C.grid} 1px, transparent 1px)`,
  },
  washTR: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(640px 460px at 92% -8%, rgba(240,160,96,0.26), rgba(240,160,96,0) 62%)',
  },
  washBL: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(720px 560px at 6% 112%, rgba(150,160,232,0.30), rgba(150,160,232,0) 60%)',
  },
  layer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transformOrigin: '0 0',
    willChange: 'transform',
  },
  // fixed box centred on the layer origin; maxWidth:'none' beats the global `img,svg,video{max-width:100%}` reset
  svg: {
    position: 'absolute',
    left: -OFF.x,
    top: -OFF.y,
    width: SVGW,
    height: SVGH,
    maxWidth: 'none',
    overflow: 'visible',
    pointerEvents: 'none',
  },
  nodeWrap: { position: 'absolute', left: 0, top: 0, willChange: 'transform' },
  node: {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: 'center',
    marginLeft: -113,
    marginTop: -52,
    width: 226,
    padding: '14px 16px 16px',
    background: C.card,
    border: `1px solid ${C.hair}`,
    borderRadius: 16,
    transition:
      'transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s, opacity 0.3s, border-color 0.3s',
    willChange: 'transform',
  },
  nodeTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  nodeNum: {
    fontFamily: mono,
    fontSize: 11,
    color: C.faint,
    letterSpacing: '0.04em',
  },
  soon: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: mono,
    fontSize: 9.5,
    color: C.body,
    background: 'var(--placeholder-2)',
    border: `1px solid ${C.hair}`,
    borderRadius: 20,
    padding: '2px 7px 2px 6px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  nodeTitle: {
    fontSize: 16.5,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.15,
    color: C.ink,
  },
  nodeBody: {
    fontSize: 12.5,
    lineHeight: 1.5,
    color: C.body,
    overflow: 'hidden',
    transition:
      'max-height 0.34s ease, opacity 0.3s ease, margin-top 0.34s ease',
  },
  heart: {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: 'translate(-50%,-50%)',
    width: 296,
    padding: '20px 22px',
    textAlign: 'center',
    background: 'color-mix(in srgb, var(--bg) 86%, transparent)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: `1px solid ${C.hair}`,
    borderRadius: 20,
    boxShadow:
      '0 22px 60px -28px rgba(20,20,25,0.30), 0 0 0 6px rgba(232,118,58,0.05)',
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    fontFamily: mono,
    fontSize: 11,
    color: C.body,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 13,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 8,
    background: C.spark,
    animation: 'ring 1.8s ease-out infinite',
  },
  heartLine: {
    fontSize: 19,
    fontWeight: 600,
    lineHeight: 1.26,
    letterSpacing: '-0.015em',
    color: C.ink,
  },
  heartSub: { fontSize: 13, lineHeight: 1.5, color: C.body, marginTop: 10 },
  heartMeta: {
    fontFamily: mono,
    fontSize: 10.5,
    color: C.faint,
    letterSpacing: '0.1em',
    marginTop: 14,
    textTransform: 'uppercase',
  },
  island: {
    position: 'absolute',
    left: '50%',
    bottom: 20,
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 8px',
    background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${C.hair}`,
    borderRadius: 14,
    boxShadow: '0 10px 30px -16px rgba(20,20,25,0.30)',
  },
  isBtn: {
    display: 'grid',
    placeItems: 'center',
    width: 30,
    height: 30,
    border: 'none',
    background: 'transparent',
    borderRadius: 9,
    color: C.ink,
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s, opacity 0.2s',
  },
  isOn: { background: 'rgba(232,118,58,0.12)', color: C.spark },
  isOff: { opacity: 0.32, cursor: 'default' },
  isPct: {
    fontFamily: mono,
    fontSize: 11.5,
    color: C.body,
    minWidth: 40,
    textAlign: 'center',
  },
  isDiv: { width: 1, height: 18, background: C.hair, margin: '0 3px' },
};
