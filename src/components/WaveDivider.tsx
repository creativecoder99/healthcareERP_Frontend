"use client";

import React from "react";

interface WaveDividerProps {
  /** fill color for the wave — matches the NEXT section's background */
  fill: string;
  /** flip: if true, wave faces upward (used at the bottom of a section) */
  flip?: boolean;
  height?: number;
}

export default function WaveDivider({ fill, flip = false, height = 60 }: WaveDividerProps) {
  return (
    <div
      className="wave-divider"
      style={{ marginBottom: "-2px", transform: flip ? "scaleY(-1)" : undefined }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 60"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        height={height}
      >
        <path
          d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
