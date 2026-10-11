import React from 'react';

/**
 * MiniLoader - A versatile, lightweight, beautifully animated loading indicator
 * designed for seamless integration inside buttons, inputs, textboxes, badges, and cards.
 *
 * @param {string|number} size - 'xs' (12px), 'sm' (16px), 'md' (20px), 'lg' (24px) or numeric px
 * @param {string} color - 'current' | 'amber' | 'emerald' | 'white' | 'slate' or custom text color class
 * @param {string} variant - 'spinner' (circular arc) | 'dots' (bouncing dots) | 'ring' (spinning ring)
 * @param {string} text - Optional accompanying label (e.g., 'جاري التحميل...')
 * @param {string} textClassName - Custom classes for the text label
 * @param {string} className - Additional CSS classes for the loader
 */
export default function MiniLoader({
  size = 'sm',
  color = 'current',
  variant = 'spinner',
  text = '',
  textClassName = '',
  className = ''
}) {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const colorMap = {
    current: 'text-current',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    white: 'text-white',
    slate: 'text-slate-400'
  };

  const resolvedSize = typeof size === 'number' ? `w-[${size}px] h-[${size}px]` : (sizeMap[size] || sizeMap.sm);
  const resolvedColor = colorMap[color] || color;

  const renderIcon = () => {
    if (variant === 'dots') {
      const dotSizes = {
        xs: 'w-1 h-1',
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-2.5 h-2.5'
      };
      const dotSize = dotSizes[size] || dotSizes.sm;
      return (
        <span
          className={`inline-flex items-center gap-1 shrink-0 ${resolvedColor} ${className}`}
          role="status"
          aria-label="جاري التحميل"
        >
          <span className={`${dotSize} rounded-full bg-current animate-bounce [animation-delay:-0.3s]`}></span>
          <span className={`${dotSize} rounded-full bg-current animate-bounce [animation-delay:-0.15s]`}></span>
          <span className={`${dotSize} rounded-full bg-current animate-bounce`}></span>
        </span>
      );
    }

    if (variant === 'ring') {
      return (
        <span
          className={`inline-block shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin ${resolvedSize} ${resolvedColor} ${className}`}
          role="status"
          aria-label="جاري التحميل"
        />
      );
    }

    // Default 'spinner': Crisp, pixel-perfect SVG circular spinner
    return (
      <svg
        className={`animate-spin shrink-0 ${resolvedSize} ${resolvedColor} ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        aria-label="جاري التحميل"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <path
          className="opacity-95"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
  };

  if (!text) {
    return renderIcon();
  }

  return (
    <span className="inline-flex items-center gap-1.5 align-middle select-none">
      {renderIcon()}
      <span className={textClassName}>{text}</span>
    </span>
  );
}

export { MiniLoader };
