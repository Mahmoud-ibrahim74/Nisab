import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, RotateCcw, X } from 'lucide-react';
import ArabesquePattern from './ArabesquePattern';

/**
 * Reusable Warning & Confirmation Alert Modal Component
 * Extracted from SettingsScreen reset modal with rich Islamic/Glassmorphism styling.
 *
 * @param {boolean} isOpen - Whether modal is visible (or derived from state)
 * @param {'confirm' | 'success' | null} state - Current stage of alert: 'confirm' (warning prompt) or 'success'
 * @param {Function} onClose - Handler called when dismissed or closed
 * @param {Function} onConfirm - Handler called when confirm action is triggered
 * @param {string} title - Prompt title in confirm state
 * @param {string} message - Prompt description in confirm state
 * @param {string} confirmText - Label for confirm action button
 * @param {string} cancelText - Label for cancel action button
 * @param {React.ComponentType} confirmIcon - Icon component for confirm button
 * @param {string} successTitle - Title in success state
 * @param {string} successMessage - Description in success state
 * @param {string} successButtonText - Label for success action button
 */
export default function WarningAlert({
  isOpen,
  state = 'confirm',
  onClose,
  onConfirm,
  title = 'استعادة الإعدادات الافتراضية',
  message = 'هل أنت متأكد من استعادة كافة الإعدادات إلى وضعها الافتراضي ومسح الذاكرة المؤقتة بالكامل؟',
  confirmText = 'نعم، استعادة',
  cancelText = 'إلغاء',
  confirmIcon: ConfirmIcon = RotateCcw,
  successTitle = 'تمت الاستعادة بنجاح',
  successMessage = 'تمت استعادة كافة إعدادات التطبيق إلى حالتها الافتراضية ومسح الذاكرة المؤقتة بنجاح.',
  successButtonText = 'حسناً'
}) {
  // Determine if modal should be shown:
  // If `isOpen` is explicitly provided, use it; otherwise check if `state` is truthy.
  const showModal = isOpen !== undefined ? Boolean(isOpen) : Boolean(state);
  const currentState = state || 'confirm';

  return (
    <AnimatePresence>
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop click dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => currentState === 'confirm' && onClose && onClose()}
            className="absolute inset-0 cursor-pointer"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative z-10 w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl backdrop-blur-xl text-center overflow-hidden ${
              currentState === 'confirm'
                ? 'bg-slate-900/95 border-rose-500/40 shadow-rose-950/50'
                : 'bg-slate-900/95 border-emerald-500/40 shadow-emerald-950/50'
            }`}
          >
            <ArabesquePattern className="opacity-5 text-amber-400" />

            {/* Close X Button */}
            <button
              type="button"
              onClick={() => onClose && onClose()}
              className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            {currentState === 'confirm' ? (
              <div className="space-y-5">
                {/* Glowing Icon Badge */}
                <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-rose-500/20 animate-ping opacity-30" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
                    <AlertTriangle className="w-8 h-8 text-rose-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white font-serif">
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                    {message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onClose && onClose()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm transition border border-slate-700/60"
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    onClick={() => onConfirm && onConfirm()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-rose-900/40 border border-rose-400/30 flex items-center justify-center gap-2 active:scale-95"
                  >
                    {ConfirmIcon && <ConfirmIcon className="w-4 h-4" />}
                    <span>{confirmText}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Success Icon Badge */}
                <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white font-serif">
                    {successTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed max-w-xs mx-auto">
                    {successMessage}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onClose && onClose()}
                    className="w-full py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-900/40 border border-emerald-400/30 active:scale-95"
                  >
                    {successButtonText}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
