import React, { useId } from "react";

// The N is a folded ribbon (bright diagonal over darker stems, curved bottom)
// drawn in a 55x100 box and scaled to the wordmark's cap height of 70. MOVIES
// is Bebas Neue outlined with opentype.js (@fontsource/bebas-neue latin-400,
// 100 units, +1.5 tracking), so the logo doesn't depend on a web font.
const MOVIES_PATH =
  "M0 70L0 0L15.7 0L22.7 50.1L22.9 50.1L29.9 0L45.6 0L45.6 70L35.2 70L35.2 17L35 17L27 70L17.8 70L9.8 17L9.6 17L9.6 70L0 70ZM71.2 71Q63.1 71 58.8 66.4Q54.5 61.8 54.5 53.4L54.5 53.4L54.5 16.6Q54.5 8.2 58.8 3.6Q63.1 -1 71.2 -1L71.2 -1Q79.3 -1 83.6 3.6Q87.9 8.2 87.9 16.6L87.9 16.6L87.9 53.4Q87.9 61.8 83.6 66.4Q79.3 71 71.2 71L71.2 71ZM71.2 61Q76.9 61 76.9 54.1L76.9 54.1L76.9 15.9Q76.9 9 71.2 9L71.2 9Q65.5 9 65.5 15.9L65.5 15.9L65.5 54.1Q65.5 61 71.2 61L71.2 61ZM104.3 70L93.7 0L104.8 0L112 54.3L112.2 54.3L119.4 0L129.5 0L118.9 70L104.3 70ZM136.3 70L136.3 0L147.3 0L147.3 70L136.3 70ZM157 70L157 0L187 0L187 10L168 10L168 28.5L183.1 28.5L183.1 38.5L168 38.5L168 60L187 60L187 70L157 70ZM209.3 71Q201.3 71 197.2 66.5Q193.1 61.9 193.1 53.4L193.1 53.4L193.1 49.4L203.5 49.4L203.5 54.2Q203.5 61 209.2 61L209.2 61Q212 61 213.5 59.4Q214.9 57.7 214.9 54L214.9 54Q214.9 49.6 212.9 46.3Q210.9 42.9 205.5 38.2L205.5 38.2Q198.7 32.2 196 27.3Q193.3 22.5 193.3 16.4L193.3 16.4Q193.3 8.1 197.5 3.5Q201.7 -1 209.7 -1L209.7 -1Q217.6 -1 221.7 3.5Q225.7 8.1 225.7 16.6L225.7 16.6L225.7 19.5L215.3 19.5L215.3 15.9Q215.3 12.3 213.9 10.6Q212.5 9 209.8 9L209.8 9Q204.3 9 204.3 15.7L204.3 15.7Q204.3 19.5 206.3 22.8Q208.4 26.1 213.8 30.8L213.8 30.8Q220.7 36.8 223.3 41.7Q225.9 46.6 225.9 53.2L225.9 53.2Q225.9 61.8 221.7 66.4Q217.4 71 209.3 71L209.3 71Z";

function RibbonN({ id }: { id: string }) {
  return (
    <>
      <defs>
        <clipPath id={`${id}-arch`}>
          <path d="M0 0H55V100Q27.5 95.2 0 100Z" />
        </clipPath>
        <filter id={`${id}-fold`} x="-50%" y="-10%" width="200%" height="120%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#000" floodOpacity="0.55" />
        </filter>
      </defs>
      <g clipPath={`url(#${id}-arch)`}>
        <path fill="#b1060f" d="M0 0H19.7V100H0Z" />
        <path fill="#b1060f" d="M35.3 0H55V100H35.3Z" />
        <path fill="#e50914" filter={`url(#${id}-fold)`} d="M0 0H19.7L55 100H35.3Z" />
      </g>
    </>
  );
}

function Logo({ className = "" }: { className?: string }) {
  // React 18's ids contain colons, which don't survive url(#...) references
  const id = useId().replace(/:/g, "");

  return (
    <svg viewBox="-2 -3 272.4 76" className={`w-auto overflow-visible ${className}`} aria-hidden="true">
      <g transform="scale(0.7)">
        <RibbonN id={id} />
      </g>
      <path transform="translate(42.5 0)" d={MOVIES_PATH} fill="#fff" />
    </svg>
  );
}

export default Logo;
