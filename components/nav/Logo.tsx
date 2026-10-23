import React, { useId } from "react";

// Wordmark drawn in SVG so the red MOVIES can carry the ribbon treatment from
// the N icon: a bright-to-deep red gradient, a soft fold shadow, and a bottom
// edge that arches up toward the middle. Metrics are Inter Black at 100 units
// with tracking-tight (-0.025em); cap height ≈ 73.
const N_WIDTH = 74.5;
const WIDTH = 462;
const BASELINE = 73;
const ARCH = 18; // how far the arch's control point rises above the baseline

function Logo({ className = "" }: { className?: string }) {
  // React 18's ids contain colons, which don't survive url(#...) references
  const id = useId().replace(/:/g, "");

  return (
    <svg
      viewBox={`-4 -4 ${WIDTH + 8} ${BASELINE + 8}`}
      className={`w-auto overflow-visible ${className}`}
      aria-hidden="true"
      style={{ fontFamily: "inherit", fontWeight: 900, letterSpacing: "-2.5px" }}
    >
      <defs>
        <clipPath id={`${id}-arch`}>
          <path d={`M${N_WIDTH - 2} -4H${WIDTH + 4}V${BASELINE}Q${(N_WIDTH + WIDTH) / 2} ${BASELINE - ARCH} ${N_WIDTH - 2} ${BASELINE}Z`} />
        </clipPath>
        <linearGradient id={`${id}-red`} x1={N_WIDTH} y1="0" x2={WIDTH} y2={BASELINE} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#eb0d18" />
          <stop offset="0.55" stopColor="#d50914" />
          <stop offset="1" stopColor="#b1060f" />
        </linearGradient>
        <linearGradient id={`${id}-depth`} x1="0" y1="0" x2="0" y2={BASELINE} gradientUnits="userSpaceOnUse">
          <stop offset="0.35" stopColor="#650307" stopOpacity="0" />
          <stop offset="1" stopColor="#650307" stopOpacity="0.75" />
        </linearGradient>
        <filter id={`${id}-soft`} x="-5%" y="-20%" width="110%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>
      <text x="0" y={BASELINE} fontSize="100" fill="#fff">
        N
      </text>
      {/* Clip inside the filter, so the shadow follows the arched edge */}
      <g filter={`url(#${id}-soft)`}>
        <g clipPath={`url(#${id}-arch)`}>
          <text x={N_WIDTH} y={BASELINE} fontSize="100" fill={`url(#${id}-red)`}>
            MOVIES
          </text>
          <text x={N_WIDTH} y={BASELINE} fontSize="100" fill={`url(#${id}-depth)`}>
            MOVIES
          </text>
        </g>
      </g>
    </svg>
  );
}

export default Logo;
