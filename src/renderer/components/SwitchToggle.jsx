import React from 'react';
import { motion } from 'framer-motion';

/**
 * Modern Custom Switch Toggle Button
 * Smooth spring-animated switch with Islamic emerald & amber accents
 */
export default function SwitchToggle({
  checked = false,
  onChange,
  disabled = false,
  id,
  ariaLabel = 'تبديل'
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (!disabled && onChange) {
          onChange(!checked);
        }
      }}
      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
        checked
          ? 'bg-sky-500'
          : 'bg-slate-800 border border-slate-700/80 hover:bg-slate-750'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <motion.span
        layout
        transition={{
          type: 'spring',
          stiffness: 600,
          damping: 35
        }}
        style={{
          marginRight: checked ? 'auto' : '0',
          marginLeft: checked ? '0' : 'auto'
        }}
        className={`pointer-events-none inline-block h-5 w-5 rounded-full transition-colors duration-200 ${
          checked ? 'bg-white' : 'bg-slate-300'
        }`}
      />
    </button>
  );
}
