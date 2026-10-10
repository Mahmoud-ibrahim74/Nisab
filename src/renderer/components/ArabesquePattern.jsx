import React from 'react';

/**
 * Modern Islamic Geometric Arabesque Watermark
 * Subtle, delicate 8-pointed star rosette watermark.
 * Uses inline styling guards to guarantee it stays in the background with ultra-faint opacity.
 */
export default function ArabesquePattern({ className = "" }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
        opacity: 0.04
      }}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        style={{ width: '100%', height: '100%' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="islamic-arabesque-grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            {/* 8-pointed Islamic Star geometry */}
            <path
              d="M30 0 L39 21 L60 30 L39 39 L30 60 L21 39 L0 30 L21 21 Z"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1"
            />
            {/* Center Rosette */}
            <circle cx="30" cy="30" r="4.5" fill="none" stroke="#10b981" strokeWidth="0.8" />
            {/* Connecting diamond lattices */}
            <path
              d="M0 0 L15 15 M60 0 L45 15 M0 60 L15 45 M60 60 L45 45"
              stroke="#f59e0b"
              strokeWidth="0.75"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-arabesque-grid)" />
      </svg>
    </div>
  );
}
