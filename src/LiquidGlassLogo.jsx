import { useEffect, useRef } from "react";

/*
 * ============================================
 *  POPFEED — INTERACTIVE LIQUID GLASS LOGO
 * ============================================
 *  Recreated from the Claude Design handoff
 *  ("PopFeed Liquid Glass Logo").
 *
 *  The "Pop / feed" wordmark + tagline sit UNDER a
 *  frosted-glass panel that:
 *    - breathes slowly (CSS keyframes)
 *    - shimmers via an animated SVG turbulence/displacement filter
 *    - drifts its specular highlight toward the cursor
 *    - distorts a touch more when hovered
 *
 *  Note: the original mock was on a white background; the "Pop"
 *  outline was switched from a dark stroke to a light one so it
 *  reads on PopFeed's dark hero.
 * ============================================
 */
export default function LiquidGlassLogo() {
  const glassRef = useRef(null);
  const specRef = useRef(null);
  const turbRef = useRef(null);
  const dispRef = useRef(null);

  useEffect(() => {
    // mx/my: normalized pointer offset from glass centre (-1..1), eased toward.
    const state = { mx: 0, my: 0, tmx: 0, tmy: 0, hov: 0, thov: 0, t: 0 };
    let raf;

    const onMove = (e) => {
      const glass = glassRef.current;
      if (!glass) return;
      const r = glass.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // clamp influence to a soft field around the logo
      state.tmx = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width * 0.7)));
      state.tmy = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height * 0.7)));
      const inside =
        e.clientX > r.left - 80 &&
        e.clientX < r.right + 80 &&
        e.clientY > r.top - 80 &&
        e.clientY < r.bottom + 80;
      state.thov = inside ? 1 : 0;
    };
    document.addEventListener("pointermove", onMove, { passive: true });

    const loop = () => {
      state.t += 0.016;
      state.mx += (state.tmx - state.mx) * 0.08;
      state.my += (state.tmy - state.my) * 0.08;
      state.hov += (state.thov - state.hov) * 0.06;

      // The specular highlight drifts slightly toward the cursor — gentle.
      if (specRef.current) {
        specRef.current.style.transform =
          `translate(${(state.mx * 22).toFixed(2)}px, ${(state.my * 18).toFixed(2)}px)`;
      }

      // Constant slow liquid shimmer, intensifying a touch on hover.
      if (turbRef.current) {
        const fx = (0.01 + Math.sin(state.t * 0.55) * 0.0014).toFixed(5);
        const fy = (0.013 + Math.cos(state.t * 0.43) * 0.0014).toFixed(5);
        turbRef.current.setAttribute("baseFrequency", `${fx} ${fy}`);
      }
      if (dispRef.current) {
        dispRef.current.setAttribute("scale", (16 + state.hov * 7).toFixed(2));
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="liquid-logo" style={{ position: "relative" }}>
      {/* Hidden SVG holding the liquid-glass displacement filter */}
      <svg
        width="0"
        height="0"
        style={{ position: "absolute" }}
        aria-hidden="true"
      >
        <defs>
          <filter
            id="pf-liquid-glass"
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0.010 0.013"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="1.4" result="snoise" />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="snoise"
              scale="16"
              xChannelSelector="R"
              yChannelSelector="G"
              result="disp"
            />
          </filter>
        </defs>
      </svg>

      {/* Wordmark + tagline (sits behind the glass) */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0 6vw",
        }}
      >
        <div
          style={{
            position: "relative",
            lineHeight: 0.9,
            fontFamily: "'Outfit', sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontSize: "var(--pf-logo-size)",
              fontWeight: 600,
              letterSpacing: "0.005em",
              color: "transparent",
              WebkitTextStroke: "2px rgba(255,255,255,0.55)",
              WebkitTextFillColor: "rgba(255,255,255,0.04)",
            }}
          >
            Pop
          </span>
          <span
            style={{
              fontSize: "var(--pf-logo-size)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              background:
                "linear-gradient(100deg,#ff2d76 0%,#e23a93 22%,#9a52d6 50%,#5a5fe0 74%,#1f6fe5 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            feed
          </span>
        </div>
        <div
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 300,
            fontSize: "var(--pf-tag-size)",
            letterSpacing: "0.42em",
            color: "#c9c9d3",
            paddingLeft: "0.42em",
            whiteSpace: "nowrap",
          }}
        >
          SOCIAL ON AUTOPILOT
        </div>
      </div>

      {/* Liquid-glass panel (sits on top of the wordmark) */}
      <div
        ref={glassRef}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          width: "calc(100% + var(--pf-glass-w))",
          height: "calc(100% + var(--pf-glass-h))",
          borderRadius: 48,
          zIndex: 2,
          pointerEvents: "none",
          animation: "pf-glass-breathe 7s ease-in-out infinite",
          backdropFilter: "url(#pf-liquid-glass) blur(2.4px) saturate(1.08) brightness(1.05)",
          WebkitBackdropFilter: "url(#pf-liquid-glass) blur(2.4px) saturate(1.08) brightness(1.05)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.10) 46%, rgba(255,255,255,0.17) 100%)",
          boxShadow:
            "0 28px 64px -20px rgba(40,40,90,0.26), 0 6px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 0 0 1px rgba(255,255,255,0.45), inset 9px 11px 32px -12px rgba(255,255,255,0.75), inset -9px -13px 34px -14px rgba(150,160,200,0.28)",
          overflow: "hidden",
        }}
      >
        <div
          ref={specRef}
          style={{
            position: "absolute",
            left: "8%",
            top: "-12%",
            width: "64%",
            height: "78%",
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(255,255,255,0.34), rgba(255,255,255,0.08) 55%, rgba(255,255,255,0) 75%)",
            filter: "blur(8px)",
            willChange: "transform",
            transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 48,
            background:
              "linear-gradient(160deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 78%, rgba(255,255,255,0.22) 100%)",
            mixBlendMode: "screen",
          }}
        />
      </div>
    </div>
  );
}
