"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

interface Doc {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
  rotate: number;
  duration: number;
  delay: number;
  driftY: number;
  opacity: number;
}

interface NodePoint {
  id: string;
  top: number;
  left: number;
  pulseDuration: number;
  pulseDelay: number;
}

interface Connection {
  from: NodePoint;
  to: NodePoint;
  glowDuration: number;
  glowDelay: number;
}

type Breakpoint = "desktop" | "tablet" | "mobile";

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("desktop");
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 768) setBp("mobile");
      else if (w < 1280) setBp("tablet");
      else setBp("desktop");
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return bp;
}

function makeDocs(count: number, sizeRange: [number, number], opacityRange: [number, number]): Doc[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `doc-${sizeRange[0]}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    top: rand(0, 95),
    left: rand(0, 95),
    width: rand(sizeRange[0], sizeRange[1]),
    height: rand(sizeRange[0] * 0.7, sizeRange[1] * 0.9),
    rotate: rand(-6, 6),
    duration: rand(20, 35),
    delay: rand(0, 10),
    driftY: rand(8, 14),
    opacity: rand(opacityRange[0], opacityRange[1]),
  }));
}

function makeNodes(count: number): NodePoint[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `node-${i}`,
    top: rand(5, 95),
    left: rand(5, 95),
    pulseDuration: rand(5, 10),
    pulseDelay: rand(0, 8),
  }));
}

function makeConnections(nodes: NodePoint[], count: number): Connection[] {
  const conns: Connection[] = [];
  for (let i = 0; i < count && nodes.length > 1; i++) {
    const a = nodes[Math.floor(rand(0, nodes.length))];
    const b = nodes[Math.floor(rand(0, nodes.length))];
    if (a.id === b.id) continue;
    conns.push({ from: a, to: b, glowDuration: rand(4, 8), glowDelay: rand(0, 12) });
  }
  return conns;
}

export function IntelligenceGridBackground() {
  const [mounted, setMounted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const breakpoint = useBreakpoint();
  const rafRef = useRef<number | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);
  const [glowingDocId, setGlowingDocId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const counts = useMemo(() => {
    if (breakpoint === "mobile") return { large: 0, small: 4, nodes: 6, connections: 3 };
    if (breakpoint === "tablet") return { large: 5, small: 9, nodes: 8, connections: 6 };
    return { large: 9, small: 16, nodes: 14, connections: 10 };
  }, [breakpoint]);

  const largeDocs = useMemo(() => makeDocs(counts.large, [140, 260], [0.04, 0.08]), [counts.large]);
  const smallDocs = useMemo(() => makeDocs(counts.small, [60, 120], [0.05, 0.1]), [counts.small]);
  const nodes = useMemo(() => makeNodes(counts.nodes), [counts.nodes]);
  const connections = useMemo(() => makeConnections(nodes, counts.connections), [nodes, counts.connections]);

  useEffect(() => {
    if (!mounted || reducedMotion) return;
    const allDocs = [...largeDocs, ...smallDocs];
    if (allDocs.length === 0) return;
    const interval = setInterval(() => {
      const doc = allDocs[Math.floor(rand(0, allDocs.length))];
      setGlowingDocId(doc.id);
      setTimeout(() => setGlowingDocId(null), 2000);
    }, rand(4000, 7000));
    return () => clearInterval(interval);
  }, [mounted, largeDocs, smallDocs, reducedMotion]);

  // Mouse parallax — scoped to movement over this container, not the whole window
  useEffect(() => {
    if (!mounted || reducedMotion) return;
    function handleMove(e: MouseEvent) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setParallax({
          x: (e.clientX / window.innerWidth - 0.5) * 12,
          y: (e.clientY / window.innerHeight - 0.5) * 12,
        });
      });
    }
    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mounted, reducedMotion]);

  // Scroll depth — tracks the nearest scrollable ancestor (e.g. <main>) instead of window,
  // since in this app the page content scrolls inside <main>, not the window itself.
  useEffect(() => {
    if (!mounted) return;
    const scrollParent = containerRef.current?.closest("main") ?? window;

    function handleScroll() {
      const scrollTop =
        scrollParent === window
          ? window.scrollY
          : (scrollParent as HTMLElement).scrollTop;
      setScrollOffset(scrollTop * 0.25);
    }

    scrollParent.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollParent.removeEventListener("scroll", handleScroll);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      style={{ background: "#05070D" }}
    >
      {/* Layer 1: gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.06), transparent 60%), linear-gradient(180deg, #05070D 0%, #070A12 100%)",
        }}
      />

      {/* Layer 2: large floating documents */}
      <div
        className="absolute inset-0"
        style={{ transform: `translate3d(${parallax.x * 0.4}px, ${parallax.y * 0.4 - scrollOffset}px, 0)`, transition: "transform 0.2s ease-out" }}
      >
        {largeDocs.map((doc) => (
          <div
            key={doc.id}
            className="ig-doc"
            style={
              {
                top: `${doc.top}%`,
                left: `${doc.left}%`,
                width: doc.width,
                height: doc.height,
                opacity: glowingDocId === doc.id ? Math.min(doc.opacity + 0.15, 0.3) : doc.opacity,
                filter: "blur(10px)",
                animationName: reducedMotion ? "none" : "ig-float",
                animationDuration: `${doc.duration}s`,
                animationDelay: `${doc.delay}s`,
                "--drift": `${doc.driftY}px`,
                "--r": `${doc.rotate}deg`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* Layer 3: connection lines */}
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ transform: `translate3d(${parallax.x * 0.6}px, ${parallax.y * 0.6 - scrollOffset * 1.2}px, 0)`, transition: "transform 0.2s ease-out" }}
      >
        {connections.map((c, i) => (
          <line
            key={i}
            x1={`${c.from.left}%`}
            y1={`${c.from.top}%`}
            x2={`${c.to.left}%`}
            y2={`${c.to.top}%`}
            stroke="rgba(80,140,255,0.12)"
            strokeWidth={1}
            className={reducedMotion ? "" : "ig-line"}
            style={{ animationDuration: `${c.glowDuration}s`, animationDelay: `${c.glowDelay}s` }}
          />
        ))}
      </svg>

      {/* Layer 4: nodes */}
      <div
        className="absolute inset-0"
        style={{ transform: `translate3d(${parallax.x * 0.8}px, ${parallax.y * 0.8 - scrollOffset * 1.4}px, 0)`, transition: "transform 0.2s ease-out" }}
      >
        {nodes.map((n) => (
          <div
            key={n.id}
            className={reducedMotion ? "ig-node" : "ig-node ig-pulse"}
            style={{ top: `${n.top}%`, left: `${n.left}%`, animationDuration: `${n.pulseDuration}s`, animationDelay: `${n.pulseDelay}s` }}
          />
        ))}
      </div>

      {/* Layer 5: small floating documents (front layer) */}
      <div
        className="absolute inset-0"
        style={{ transform: `translate3d(${parallax.x}px, ${parallax.y - scrollOffset * 1.6}px, 0)`, transition: "transform 0.2s ease-out" }}
      >
        {smallDocs.map((doc) => (
          <div
            key={doc.id}
            className="ig-doc"
            style={
              {
                top: `${doc.top}%`,
                left: `${doc.left}%`,
                width: doc.width,
                height: doc.height,
                opacity: glowingDocId === doc.id ? Math.min(doc.opacity + 0.15, 0.3) : doc.opacity,
                filter: "blur(2px)",
                animationName: reducedMotion ? "none" : "ig-float",
                animationDuration: `${doc.duration}s`,
                animationDelay: `${doc.delay}s`,
                "--drift": `${doc.driftY}px`,
                "--r": `${doc.rotate}deg`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <style jsx>{`
        .ig-doc {
          position: absolute;
          background: #101827;
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 6px;
          transform: rotate(var(--r, 0deg));
          will-change: transform, opacity;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          transition: opacity 0.4s ease-out;
        }
        @keyframes ig-float {
          from {
            transform: translateY(calc(var(--drift) * -1)) rotate(var(--r, 0deg));
          }
          to {
            transform: translateY(var(--drift)) rotate(var(--r, 0deg));
          }
        }
        .ig-node {
          position: absolute;
          width: 4px;
          height: 4px;
          margin-left: -2px;
          margin-top: -2px;
          border-radius: 9999px;
          background: #3b82f6;
          box-shadow: 0 0 6px 1px rgba(94, 163, 255, 0.35);
          opacity: 0.4;
          will-change: transform;
        }
        .ig-pulse {
          animation-name: ig-pulse;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes ig-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        :global(.ig-line) {
          animation-name: ig-line-glow;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes ig-line-glow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}