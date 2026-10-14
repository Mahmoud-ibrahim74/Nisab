import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Loader - Reusable loading indicator component
 * Displays an illuminated spinning sparkles icon with customizable text.
 *
 * @param {string} text - Message to display below the spinner (default: 'جاري تحميل الأحاديث...')
 * @param {string} className - Optional custom container classes
 * @param {string} iconClassName - Optional custom icon classes
 */
export default function Loader({
  text = 'جاري تحميل الأحاديث...',
  className = 'py-20 text-center text-emerald-400 select-none',
  iconClassName = 'w-8 h-8 animate-spin mx-auto mb-2 text-amber-400'
}) {
  return (
    <div className={className} role="status" aria-live="polite">
      <Sparkles className={iconClassName} />
      <span>{text}</span>
    </div>
  );
}
