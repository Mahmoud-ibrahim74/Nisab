import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Clock,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { notificationManager } from '../services/NotificationManager';
import ArabesquePattern from './ArabesquePattern';

export default function ModernNotification() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Subscribe to NotificationManager updates
    const unsubscribe = notificationManager.subscribe((items) => {
      setNotifications(items);
    });
    return unsubscribe;
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div
      dir="rtl"
      className="fixed bottom-6 left-6 z-50 flex flex-col-reverse gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((item) => (
          <NotificationCard key={item.id} notification={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function NotificationCard({ notification }) {
  const { id, title, message, type, isPlayingAudio, duration } = notification;

  const handleDismiss = () => {
    notificationManager.dismiss(id);
  };

  const handleStopAudio = () => {
    notificationManager.stopAudio();
  };

  // Determine icon & gradient styling based on notification type
  const getBadgeConfig = () => {
    switch (type) {
      case 'adhan':
        return {
          icon: Bell,
          badgeBg: 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950',
          borderCol: 'border-amber-500/50',
          glowCol: 'shadow-amber-500/20'
        };
      case 'reminder':
        return {
          icon: Clock,
          badgeBg: 'bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950',
          borderCol: 'border-emerald-500/50',
          glowCol: 'shadow-emerald-500/20'
        };
      case 'success':
        return {
          icon: CheckCircle,
          badgeBg: 'bg-emerald-600 text-white',
          borderCol: 'border-emerald-500/40',
          glowCol: 'shadow-emerald-500/20'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          badgeBg: 'bg-amber-600 text-white',
          borderCol: 'border-amber-500/40',
          glowCol: 'shadow-amber-500/20'
        };
      case 'preview':
      default:
        return {
          icon: Sparkles,
          badgeBg: 'bg-gradient-to-br from-amber-400 to-emerald-500 text-slate-950',
          borderCol: 'border-amber-500/40',
          glowCol: 'shadow-amber-500/20'
        };
    }
  };

  const badge = getBadgeConfig();
  const IconComponent = badge.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-slate-950/95 backdrop-blur-2xl border ${badge.borderCol} p-4 shadow-2xl ${badge.glowCol} text-slate-100 select-none group`}
    >
      {/* Decorative Arabesque Pattern Accent */}
      <ArabesquePattern className="opacity-15 text-emerald-400 pointer-events-none" />

      {/* Top Banner Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-500 to-amber-500 opacity-80" />

      <div className="relative z-10 flex items-start gap-3.5">
        {/* Glowing Badge Icon */}
        <div
          className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${badge.badgeBg} ${
            isPlayingAudio ? 'animate-pulse' : ''
          }`}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-0.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-bold text-amber-300 font-serif tracking-wide truncate">
              {title}
            </h4>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition"
              title="إغلاق الإشعار"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed break-words">
            {message}
          </p>

          {/* Audio Player Strip (if sound is playing) */}
          {isPlayingAudio && (
            <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-emerald-900/50">
              <div className="flex items-center gap-2 text-[11px] text-amber-400">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                <span>جاري تشغيل الصوت...</span>
              </div>

              <button
                onClick={handleStopAudio}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-medium transition"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>إيقاف الصوت</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Countdown progress bar (if duration > 0) */}
      {duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400/60"
        />
      )}
    </motion.div>
  );
}
