import React from "react";

export const Logo = ({ size = 22, style = {} }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      {/* Premium modern interlocked brackets logo representing real-time collaboration */}
      {/* Left bracket path */}
      <path
        d="M8 6L3 12L8 18"
        stroke="var(--accent-cyan)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: "stroke 0.3s ease" }}
      />
      {/* Right bracket path */}
      <path
        d="M16 18L21 12L16 6"
        stroke="var(--accent-cyan)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: "stroke 0.3s ease" }}
      />
      {/* Center glowing connection dot */}
      <circle
        cx="12"
        cy="12"
        r="2"
        fill="var(--accent-green)"
        style={{ transition: "fill 0.3s ease" }}
      />
      {/* Accent synced orbit lines */}
      <path
        d="M12 4C14.21 4 16.21 4.9 17.66 6.34"
        stroke="var(--accent-cyan)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M12 20C9.79 20 7.79 19.1 6.34 17.66"
        stroke="var(--accent-cyan)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
};

export default Logo;
