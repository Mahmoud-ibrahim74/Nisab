import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';

/**
 * IntroPillToast Component
 * Floating Islamic glassmorphism pill toast notification.
 *
 * @param {Object} props
 * @param {boolean} props.show - Controls visibility with smooth animation
 * @param {string} props.text - Primary text (defaults to intro Ayah)
 * @param {string} props.subtitle - Secondary chip / metadata text
 * @param {React.ComponentType} props.icon - Leading Lucide icon component
 * @param {string} props.className - Extra wrapper styling
 */
export default function IntroPillToast({
  show = false,
  text = '﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾',
  subtitle = 'سورة المزمل',
  icon: Icon = Volume2,
  className = ''
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-amber-500/60 text-amber-300 shadow-2xl flex items-center gap-3 backdrop-blur-xl pointer-events-none select-none ${className}`}
          dir="rtl"
        >
          {Icon && <Icon className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />}
          {text && (
            <span className="font-serif font-bold text-sm sm:text-base text-amber-200">
              {text}
            </span>
          )}
          {subtitle && (
            <span className="text-[10px] text-emerald-400 font-sans border-r border-emerald-800 pr-2.5">
              {subtitle}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
