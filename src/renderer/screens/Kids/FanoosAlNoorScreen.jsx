import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Languages,
  RotateCcw,
  BookOpen,
  Award,
  CheckCircle2,
  Star,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  Heart,
  Droplets,
  Gift,
  Smile,
  ShieldCheck,
  Trophy
} from 'lucide-react';
import { soundFx } from './audio';
import { I18N } from './i18n';

// 4 Village Stations definition
const STATIONS = [
  {
    id: 'garden',
    titleKey: 'station1Title',
    subtitleKey: 'station1Subtitle',
    npcKey: 'station1NPC',
    x: 180,
    y: 190,
    color: '#10b981', // Emerald
    iconColor: 'bg-emerald-500',
    starIndex: 0
  },
  {
    id: 'fountain',
    titleKey: 'station2Title',
    subtitleKey: 'station2Subtitle',
    npcKey: 'station2NPC',
    x: 220,
    y: 440,
    color: '#06b6d4', // Sapphire/Cyan
    iconColor: 'bg-cyan-500',
    starIndex: 1
  },
  {
    id: 'grandma',
    titleKey: 'station3Title',
    subtitleKey: 'station3Subtitle',
    npcKey: 'station3NPC',
    x: 680,
    y: 190,
    color: '#f43f5e', // Ruby
    iconColor: 'bg-rose-500',
    starIndex: 2
  },
  {
    id: 'minaret',
    titleKey: 'station4Title',
    subtitleKey: 'station4Subtitle',
    npcKey: 'station4NPC',
    x: 640,
    y: 440,
    color: '#f59e0b', // Golden
    iconColor: 'bg-amber-500',
    starIndex: 3
  }
];

export default function FanoosAlNoorScreen() {
  const [lang, setLang] = useState('ar');
  const t = I18N[lang];
  const isRTL = lang === 'ar';

  const [hero, setHero] = useState('zayd'); // 'zayd' or 'noor'
  const [isMuted, setIsMuted] = useState(false);
  const [unlockedStars, setUnlockedStars] = useState(() => {
    try {
      const saved = localStorage.getItem('fanoos_alnoor_stars');
      return saved ? JSON.parse(saved) : [false, false, false, false];
    } catch {
      return [false, false, false, false];
    }
  });

  const [activeModal, setActiveModal] = useState(null); // 'garden' | 'fountain' | 'grandma' | 'minaret' | 'passport' | 'celebration'
  const [nearStation, setNearStation] = useState(null);

  // Quest 1 State (Greeting Garden)
  const [q1Index, setQ1Index] = useState(0);
  const [q1SelectedOption, setQ1SelectedOption] = useState(null);
  const [q1Feedback, setQ1Feedback] = useState(null);

  // Quest 2 State (Kindness Fountain)
  const [q2Litter, setQ2Litter] = useState([
    { id: 1, x: 28, y: 35, collected: false, icon: '🍂' },
    { id: 2, x: 62, y: 55, collected: false, icon: '🧃' },
    { id: 3, x: 45, y: 72, collected: false, icon: '📄' }
  ]);
  const [q2WaterPoured, setQ2WaterPoured] = useState(false);

  // Quest 3 State (Grandma Salma)
  const [q3Baskets, setQ3Baskets] = useState([
    { id: 0, dates: 0, sweets: 0 },
    { id: 1, dates: 0, sweets: 0 },
    { id: 2, dates: 0, sweets: 0 }
  ]);
  const [q3DatesPool, setQ3DatesPool] = useState(6);
  const [q3SweetsPool, setQ3SweetsPool] = useState(3);
  const [q3Success, setQ3Success] = useState(false);

  // Quest 4 State (Starry Minaret)
  const [q4Rotations, setQ4Rotations] = useState([90, 180, 270, 90]);
  const [q4Completed, setQ4Completed] = useState(false);

  // Canvas & Game Loop
  const canvasRef = useRef(null);
  const playerRef = useRef({
    x: 430,
    y: 310,
    targetX: 430,
    targetY: 310,
    speed: 3.8,
    vx: 0,
    vy: 0,
    facing: 'down',
    walkingFrame: 0,
    isMoving: false
  });

  const keysPressed = useRef({});
  const particlesRef = useRef([]);
  const fireworksRef = useRef([]);

  // Save progress
  const saveStars = (newStars) => {
    setUnlockedStars(newStars);
    try {
      localStorage.setItem('fanoos_alnoor_stars', JSON.stringify(newStars));
    } catch {}
  };

  const unlockStar = (index) => {
    const updated = [...unlockedStars];
    if (!updated[index]) {
      updated[index] = true;
      saveStars(updated);
      soundFx.playFanfare();

      // Check if all 4 are unlocked
      if (updated.every(Boolean)) {
        setTimeout(() => {
          soundFx.playCelebration();
          setActiveModal('celebration');
        }, 800);
      }
    }
  };

  const resetGame = () => {
    soundFx.playPop();
    const empty = [false, false, false, false];
    saveStars(empty);
    setQ1Index(0);
    setQ1SelectedOption(null);
    setQ1Feedback(null);
    setQ2Litter([
      { id: 1, x: 28, y: 35, collected: false, icon: '🍂' },
      { id: 2, x: 62, y: 55, collected: false, icon: '🧃' },
      { id: 3, x: 45, y: 72, collected: false, icon: '📄' }
    ]);
    setQ2WaterPoured(false);
    setQ3Baskets([
      { id: 0, dates: 0, sweets: 0 },
      { id: 1, dates: 0, sweets: 0 },
      { id: 2, dates: 0, sweets: 0 }
    ]);
    setQ3DatesPool(6);
    setQ3SweetsPool(3);
    setQ3Success(false);
    setQ4Rotations([90, 180, 270, 90]);
    setQ4Completed(false);
    playerRef.current.x = 430;
    playerRef.current.y = 310;
    setActiveModal(null);
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      keysPressed.current[e.key.toLowerCase()] = true;

      // Interaction Key
      if (['e', 'enter', ' '].includes(e.key.toLowerCase())) {
        if (nearStation && !activeModal) {
          e.preventDefault();
          soundFx.playPop();
          setActiveModal(nearStation.id);
        }
      }
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nearStation, activeModal]);

  // Touch / D-Pad Movement simulation
  const handleDPadPress = (dir) => {
    soundFx.playPop();
    const p = playerRef.current;
    p.targetX = undefined;
    p.targetY = undefined;
    const step = 45;
    if (dir === 'up') p.y = Math.max(90, p.y - step);
    if (dir === 'down') p.y = Math.min(540, p.y + step);
    if (dir === 'left') p.x = Math.max(90, p.x - step);
    if (dir === 'right') p.x = Math.min(770, p.x + step);
  };

  const handleActionPress = () => {
    soundFx.playPop();
    if (nearStation && !activeModal) {
      setActiveModal(nearStation.id);
    }
  };

  // Click on Canvas: interact with station or move player to clicked spot
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check if clicked directly on or near any station
    for (const st of STATIONS) {
      const dist = Math.hypot(clickX - st.x, clickY - st.y);
      if (dist < 65) {
        soundFx.playPop();
        setActiveModal(st.id);
        return;
      }
    }

    // Direct click-to-move for kids!
    playerRef.current.targetX = clickX;
    playerRef.current.targetY = clickY;

    // If near station, also trigger interact
    if (nearStation && !activeModal) {
      soundFx.playPop();
      setActiveModal(nearStation.id);
    }
  };

  // Canvas Game Engine & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let tick = 0;

    // Initialize floating ambient particles
    particlesRef.current = Array.from({ length: 45 }, () => ({
      x: Math.random() * 860,
      y: Math.random() * 600,
      radius: Math.random() * 2 + 0.8,
      speedY: Math.random() * 0.4 + 0.1,
      speedX: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2
    }));

    const render = () => {
      tick++;
      const width = canvas.width;
      const height = canvas.height;
      const p = playerRef.current;

      // Handle keyboard movement if no modal is open
      if (!activeModal) {
        let vx = 0;
        let vy = 0;
        const keys = keysPressed.current;

        if (keys['arrowup'] || keys['w']) vy -= p.speed;
        if (keys['arrowdown'] || keys['s']) vy += p.speed;
        if (keys['arrowleft'] || keys['a']) vx -= p.speed;
        if (keys['arrowright'] || keys['d']) vx += p.speed;

        // Diagonal normalization
        if (vx !== 0 && vy !== 0) {
          vx *= 0.7071;
          vy *= 0.7071;
        }

        if (vx !== 0 || vy !== 0) {
          p.targetX = undefined;
          p.targetY = undefined;
          p.x = Math.max(70, Math.min(width - 70, p.x + vx));
          p.y = Math.max(80, Math.min(height - 80, p.y + vy));
          p.isMoving = true;
          p.walkingFrame += 0.2;
          if (Math.abs(vx) > Math.abs(vy)) {
            p.facing = vx > 0 ? 'right' : 'left';
          } else {
            p.facing = vy > 0 ? 'down' : 'up';
          }
        } else if (p.targetX !== undefined && p.targetY !== undefined) {
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 6) {
            const moveX = (dx / dist) * p.speed;
            const moveY = (dy / dist) * p.speed;
            p.x = Math.max(70, Math.min(width - 70, p.x + moveX));
            p.y = Math.max(80, Math.min(height - 80, p.y + moveY));
            p.isMoving = true;
            p.walkingFrame += 0.2;
            p.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
          } else {
            p.targetX = undefined;
            p.targetY = undefined;
            p.isMoving = false;
          }
        } else {
          p.isMoving = false;
        }
      }

      // Check proximity to stations
      let currentNear = null;
      for (const st of STATIONS) {
        const dist = Math.hypot(p.x - st.x, p.y - st.y);
        if (dist < 80) {
          currentNear = st;
          break;
        }
      }
      setNearStation(currentNear);

      // --- 1. DRAW BACKGROUND: Twilight Courtyard & Sky ---
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0a1128'); // Deep midnight indigo
      skyGrad.addColorStop(0.45, '#1c194a'); // Twilight purple
      skyGrad.addColorStop(0.8, '#064e3b'); // Courtyard emerald night
      skyGrad.addColorStop(1, '#022c22');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Twinkling stars in sky
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 35; i++) {
        const starX = (i * 27) % width;
        const starY = (i * 17) % 200;
        const starTwinkle = 0.4 + 0.6 * Math.sin(tick * 0.04 + i);
        ctx.globalAlpha = starTwinkle;
        ctx.beginPath();
        ctx.arc(starX, starY, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Golden Crescent Moon
      ctx.save();
      ctx.fillStyle = '#fde68a';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(110, 80, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(120, 72, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Mosque Silhouette Architecture in Background
      ctx.fillStyle = 'rgba(6, 78, 59, 0.45)';
      // Central Dome
      ctx.beginPath();
      ctx.arc(width / 2, 170, 95, Math.PI, 0);
      ctx.fill();
      // Minaret behind
      ctx.fillRect(width / 2 - 25, 30, 50, 140);
      // Minaret Crescent
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(width / 2, 25, 7, 0, Math.PI * 2);
      ctx.fill();

      // Courtyard Cobblestone Floor Pattern
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.lineWidth = 1;
      for (let cy = 180; cy < height; cy += 45) {
        ctx.beginPath();
        ctx.moveTo(30, cy);
        ctx.lineTo(width - 30, cy);
        ctx.stroke();
      }
      for (let cx = 40; cx < width; cx += 55) {
        ctx.beginPath();
        ctx.moveTo(cx, 180);
        ctx.lineTo(cx, height - 30);
        ctx.stroke();
      }

      // Central Courtyard Islamic Star Carpet Motif
      ctx.save();
      ctx.translate(width / 2, 330);
      ctx.rotate(tick * 0.002);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-50, -50, 100, 100);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.strokeRect(-50, -50, 100, 100);
      ctx.restore();

      // --- 2. DRAW 4 STATIONS ---
      STATIONS.forEach((st) => {
        const isDone = unlockedStars[st.starIndex];
        const isHighlight = currentNear && currentNear.id === st.id;

        // Glowing base circle
        ctx.save();
        ctx.fillStyle = isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)';
        ctx.strokeStyle = st.color;
        ctx.lineWidth = isHighlight ? 3.5 : 2;
        if (isHighlight) {
          ctx.shadowColor = st.color;
          ctx.shadowBlur = 18;
        }

        ctx.beginPath();
        ctx.arc(st.x, st.y, 44, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Station-specific illustration
        if (st.id === 'garden') {
          // Lush Flower Garden & Uncle Kareem
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(st.x - 14, st.y + 12, 10, 0, Math.PI * 2);
          ctx.arc(st.x + 14, st.y + 12, 10, 0, Math.PI * 2);
          ctx.arc(st.x, st.y + 8, 12, 0, Math.PI * 2);
          ctx.fill();
          // Flowers
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(st.x - 10, st.y + 10, 4, 0, Math.PI * 2);
          ctx.arc(st.x + 10, st.y + 10, 4, 0, Math.PI * 2);
          ctx.fill();
          // Uncle Kareem cartoon bust
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(st.x, st.y - 12, 12, 0, Math.PI * 2);
          ctx.fill();
          // Kareem Turban
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(st.x, st.y - 18, 9, 0, Math.PI * 2);
          ctx.fill();
        } else if (st.id === 'fountain') {
          // Water Fountain Sabil
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(st.x, st.y, 24, 0, Math.PI * 2);
          ctx.fill();
          // Water Ripple Animation
          const waveRadius = 14 + (tick % 40) * 0.4;
          ctx.strokeStyle = 'rgba(224, 242, 254, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(st.x, st.y, waveRadius, 0, Math.PI * 2);
          ctx.stroke();
          // Kitten icon near fountain
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(st.x + 22, st.y + 16, 7, 0, Math.PI * 2);
          ctx.fill();
        } else if (st.id === 'grandma') {
          // Grandma Salma's Basket Porch
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(st.x, st.y, 22, 0, Math.PI * 2);
          ctx.fill();
          // Dates in basket
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.ellipse(st.x - 6, st.y, 5, 8, Math.PI / 4, 0, Math.PI * 2);
          ctx.ellipse(st.x + 6, st.y, 5, 8, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
          // Grandma head scarf
          ctx.fillStyle = '#f1f5f9';
          ctx.beginPath();
          ctx.arc(st.x, st.y - 14, 11, 0, Math.PI * 2);
          ctx.fill();
        } else if (st.id === 'minaret') {
          // 8-Pointed Star Tile Minaret
          ctx.save();
          ctx.translate(st.x, st.y);
          ctx.rotate(tick * 0.01);
          ctx.fillStyle = isDone ? '#fbbf24' : '#64748b';
          ctx.fillRect(-12, -12, 24, 24);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-12, -12, 24, 24);
          ctx.restore();
        }

        // Star Badge (if completed)
        if (isDone) {
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(st.x + 28, st.y - 28, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', st.x + 28, st.y - 27);
        }

        // Station Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t[st.titleKey], st.x, st.y + 58);

        ctx.restore();
      });

      // --- 3. DRAW PARTICLES & SPARKLES ---
      ctx.fillStyle = '#fde047';
      particlesRef.current.forEach((pt) => {
        pt.y -= pt.speedY;
        pt.x += pt.speedX;
        pt.pulse += 0.05;
        if (pt.y < 40) pt.y = height - 40;
        if (pt.x < 30) pt.x = width - 30;
        if (pt.x > width - 30) pt.x = 30;

        const currentAlpha = pt.alpha * (0.6 + 0.4 * Math.sin(pt.pulse));
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // --- 4. DRAW PLAYER & THE LANTERN OF GOOD DEEDS ---
      ctx.save();
      const bounce = p.isMoving ? Math.sin(p.walkingFrame) * 3 : 0;
      const px = p.x;
      const py = p.y + bounce;

      // Dynamic Fanoos Glow (Grows larger with more stars unlocked)
      const starsCount = unlockedStars.filter(Boolean).length;
      const glowBaseRadius = 55 + starsCount * 28;
      const glowPulse = Math.sin(tick * 0.06) * 5;
      const glowRadius = glowBaseRadius + glowPulse;

      const lanternGlow = ctx.createRadialGradient(px, py, 10, px, py, glowRadius);
      lanternGlow.addColorStop(0, 'rgba(253, 230, 138, 0.45)');
      if (starsCount >= 1) lanternGlow.addColorStop(0.3, 'rgba(52, 211, 153, 0.25)'); // Emerald
      if (starsCount >= 2) lanternGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.2)');  // Sapphire
      if (starsCount >= 3) lanternGlow.addColorStop(0.7, 'rgba(251, 113, 133, 0.18)');// Ruby
      if (starsCount >= 4) lanternGlow.addColorStop(0.85, 'rgba(245, 158, 11, 0.22)');// Gold
      lanternGlow.addColorStop(1, 'rgba(253, 230, 138, 0)');

      ctx.fillStyle = lanternGlow;
      ctx.beginPath();
      ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Player Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(px, py + 22, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Player Body / Robe
      ctx.fillStyle = hero === 'zayd' ? '#047857' : '#9333ea';
      ctx.beginPath();
      ctx.roundRect(px - 10, py - 6, 20, 24, [6, 6, 4, 4]);
      ctx.fill();

      // Belt
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px - 10, py + 4, 20, 3);

      // Player Head
      ctx.fillStyle = '#fcd34d'; // Warm skin tone
      ctx.beginPath();
      ctx.arc(px, py - 14, 12, 0, Math.PI * 2);
      ctx.fill();

      // Hair / Hat (Kufi for Zayd, Scarf for Noor)
      if (hero === 'zayd') {
        ctx.fillStyle = '#ffffff'; // White Kufi cap
        ctx.beginPath();
        ctx.arc(px, py - 19, 10, Math.PI, 0);
        ctx.fill();
      } else {
        ctx.fillStyle = '#f472b6'; // Pink hijab scarf
        ctx.beginPath();
        ctx.arc(px, py - 16, 13, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(px - 13, py - 16, 26, 10);
      }

      // Friendly Eyes
      ctx.fillStyle = '#1e293b';
      const eyeOffset = p.facing === 'left' ? -3 : p.facing === 'right' ? 3 : 0;
      ctx.beginPath();
      ctx.arc(px - 4 + eyeOffset, py - 14, 1.8, 0, Math.PI * 2);
      ctx.arc(px + 4 + eyeOffset, py - 14, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Cheerful Smile
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(px + eyeOffset, py - 11, 3.5, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // --- THE LANTERN (Fanoos) in Hand ---
      const lanternSide = p.facing === 'left' ? -18 : 18;
      const lx = px + lanternSide;
      const ly = py + 2;

      // Lantern Cord
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px + (lanternSide > 0 ? 8 : -8), py - 2);
      ctx.lineTo(lx, ly - 8);
      ctx.stroke();

      // Brass Top & Bottom of Fanoos
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(lx - 6, ly - 6);
      ctx.lineTo(lx + 6, ly - 6);
      ctx.lineTo(lx, ly - 10);
      ctx.closePath();
      ctx.fill();

      // Glass Center with internal flame
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(lx - 5, ly - 6, 10, 11);

      // Flickering Flame
      const flameColor =
        starsCount === 4 ? '#fbbf24' : starsCount === 3 ? '#f43f5e' : starsCount === 2 ? '#38bdf8' : '#34d399';
      ctx.fillStyle = flameColor;
      ctx.beginPath();
      ctx.arc(lx, ly, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // --- 5. INTERACTION PROMPT POPUP (When near station) ---
      if (currentNear && !activeModal) {
        ctx.save();
        const popupX = currentNear.x;
        const popupY = currentNear.y - 60;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.roundRect(popupX - 70, popupY - 16, 140, 32, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`✨ ${t.interactHint.split(' ')[0]} [E] ✨`, popupX, popupY);
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [unlockedStars, activeModal, hero, lang]);

  // Handler for Quest 1 answer
  const handleQ1Answer = (optionIdx) => {
    soundFx.playPop();
    setQ1SelectedOption(optionIdx);
    const curr = t.q1Matches[q1Index];
    if (optionIdx === curr.correctIndex) {
      soundFx.playChime();
      setQ1Feedback({ success: true, text: curr.explanation });
    } else {
      soundFx.playGentleTryAgain();
      setQ1Feedback({ success: false, text: isRTL ? 'حاول مجدداً يا بطل!' : 'Try again, young hero!' });
    }
  };

  const handleQ1Next = () => {
    soundFx.playPop();
    if (q1Index < t.q1Matches.length - 1) {
      setQ1Index((prev) => prev + 1);
      setQ1SelectedOption(null);
      setQ1Feedback(null);
    } else {
      unlockStar(0);
      setActiveModal(null);
    }
  };

  // Handler for Quest 2 Litter Cleanup
  const handleCollectLitter = (id) => {
    soundFx.playPop();
    setQ2Litter((prev) =>
      prev.map((item) => (item.id === id ? { ...item, collected: true } : item))
    );
  };

  const handlePourWater = () => {
    soundFx.playSplash();
    setTimeout(() => soundFx.playPurr(), 300);
    setQ2WaterPoured(true);
    setTimeout(() => {
      unlockStar(1);
    }, 1200);
  };

  // Handler for Quest 3 Grandma's Baskets
  const handleAddDateToBasket = (basketIdx) => {
    if (q3DatesPool <= 0) return;
    soundFx.playPop();
    setQ3DatesPool((prev) => prev - 1);
    setQ3Baskets((prev) =>
      prev.map((b, i) => (i === basketIdx ? { ...b, dates: b.dates + 1 } : b))
    );
  };

  const handleAddSweetToBasket = (basketIdx) => {
    if (q3SweetsPool <= 0) return;
    soundFx.playPop();
    setQ3SweetsPool((prev) => prev - 1);
    setQ3Baskets((prev) =>
      prev.map((b, i) => (i === basketIdx ? { ...b, sweets: b.sweets + 1 } : b))
    );
  };

  const handleResetBaskets = () => {
    soundFx.playPop();
    setQ3DatesPool(6);
    setQ3SweetsPool(3);
    setQ3Baskets([
      { id: 0, dates: 0, sweets: 0 },
      { id: 1, dates: 0, sweets: 0 },
      { id: 2, dates: 0, sweets: 0 }
    ]);
  };

  // Check Quest 3 equality (each basket has 2 dates and 1 sweet)
  useEffect(() => {
    const allValid = q3Baskets.every((b) => b.dates === 2 && b.sweets === 1);
    if (allValid && !q3Success) {
      setQ3Success(true);
      soundFx.playChime();
      unlockStar(2);
    }
  }, [q3Baskets]);

  // Handler for Quest 4 Minaret Star rotation
  const handleRotateQuadrant = (index) => {
    soundFx.playRotate();
    const newRot = [...q4Rotations];
    newRot[index] = (newRot[index] + 90) % 360;
    setQ4Rotations(newRot);

    if (newRot.every((r) => r === 0)) {
      setQ4Completed(true);
      soundFx.playChime();
      unlockStar(3);
    }
  };

  const starsEarned = unlockedStars.filter(Boolean).length;

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="w-full h-full min-h-[calc(100vh-4rem)] min-w-0 p-3 sm:p-5 flex flex-col items-center justify-start bg-slate-950 text-slate-100 select-none overflow-y-auto"
    >
      {/* 1. TOP HEADER & HUD */}
      <header className="w-full min-w-0 max-w-[1700px] rounded-3xl p-3 sm:p-4 bg-gradient-to-r from-emerald-950/90 via-slate-900/90 to-amber-950/90 border border-emerald-500/40 shadow-xl mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 text-2xl shrink-0">
            🏮
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold font-serif text-amber-300">
              {t.gameTitle}
            </h1>
            <p className="text-xs text-slate-300 hidden sm:block">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Noor Stars & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Stars Counter with Glowing Badges */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-amber-500/40 shadow-inner">
            <span className="text-xs font-bold text-amber-300">{t.starsCount}</span>
            <div className="flex items-center gap-1">
              {unlockedStars.map((isUnlocked, idx) => {
                const colors = ['#10b981', '#06b6d4', '#f43f5e', '#f59e0b'];
                return (
                  <span
                    key={idx}
                    style={{
                      color: isUnlocked ? colors[idx] : '#475569',
                      filter: isUnlocked ? `drop-shadow(0 0 6px ${colors[idx]})` : 'none'
                    }}
                    className="text-base transition-all duration-300"
                  >
                    ★
                  </span>
                );
              })}
            </div>
            <span className="text-xs font-mono font-bold text-slate-200">
              {starsEarned}/4
            </span>
          </div>

          {/* Character Selector */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-2xl border border-emerald-900/60">
            <button
              onClick={() => {
                soundFx.playPop();
                setHero('zayd');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                hero === 'zayd'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👦 {t.heroZayd}
            </button>
            <button
              onClick={() => {
                soundFx.playPop();
                setHero('noor');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                hero === 'noor'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👧 {t.heroNoor}
            </button>
          </div>

          {/* Passport Button */}
          <button
            onClick={() => {
              soundFx.playPop();
              setActiveModal('passport');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>{t.passportBtn}</span>
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={() => {
              const muted = soundFx.toggleMute();
              setIsMuted(muted);
              if (!muted) soundFx.playPop();
            }}
            title={isMuted ? t.soundOn : t.soundMuted}
            className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Language Switch */}
          <button
            onClick={() => {
              soundFx.playPop();
              setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 text-xs font-bold transition cursor-pointer"
          >
            <Languages className="w-4 h-4" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={resetGame}
            title={t.resetBtn}
            className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-rose-400 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. GAME CANVAS STAGE & CONTROLS CONTAINER */}
      <div className="relative w-full min-w-0 max-w-[1700px] rounded-3xl overflow-hidden border-2 border-emerald-600/40 shadow-2xl bg-slate-950 flex flex-col items-center">
        {/* Responsive Canvas Wrapper */}
        <div className="relative w-full min-w-0 flex items-center justify-center bg-slate-950 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={860}
            height={580}
            className="w-full h-auto aspect-[860/580] max-h-[72vh] object-contain block bg-slate-950 cursor-pointer"
            onClick={handleCanvasClick}
          />
        </div>

        {/* On-Screen D-Pad & Controls Bar for Touch/Click */}
        <div className="w-full p-3 bg-slate-950/90 border-t border-emerald-900/50 flex flex-wrap items-center justify-between gap-3 px-6">
          {/* Instruction hint */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Compass className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{t.controlsHelp}</span>
          </div>

          {/* On-Screen D-Pad Navigation Buttons */}
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-3 gap-1">
              <div />
              <button
                onClick={() => handleDPadPress('up')}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow cursor-pointer"
              >
                ▲
              </button>
              <div />
              <button
                onClick={() => handleDPadPress('left')}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow cursor-pointer"
              >
                ◀
              </button>
              <button
                onClick={() => handleDPadPress('down')}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow cursor-pointer"
              >
                ▼
              </button>
              <button
                onClick={() => handleDPadPress('right')}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow cursor-pointer"
              >
                ▶
              </button>
            </div>

            {/* Action [E] Button */}
            <button
              onClick={handleActionPress}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer ${
                nearStation
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <span>🏮</span>
              <span>{isRTL ? 'تفاعل [E]' : 'Action [E]'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MODAL OVERLAYS FOR THE 4 MINI-GAMES & REWARDS */}
      <AnimatePresence>
        {/* QUEST 1: The Greeting Garden (آداب السلام والكلمة الطيبة) */}
        {activeModal === 'garden' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-xl rounded-3xl bg-slate-900 border-2 border-emerald-500/60 p-6 shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 left-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🌿</span>
                <div>
                  <h2 className="text-xl font-bold text-emerald-400 font-serif">
                    {t.station1Title}
                  </h2>
                  <p className="text-xs text-slate-300">{t.station1NPC}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 mb-5 text-sm leading-relaxed text-slate-200">
                {t.q1Intro}
              </div>

              {/* Progress & Current Question */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>{isRTL ? `الموقف ${q1Index + 1} من ${t.q1Matches.length}` : `Situation ${q1Index + 1} of ${t.q1Matches.length}`}</span>
                  <span className="text-emerald-400 font-bold">★ {t.station1Subtitle}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${((q1Index + 1) / t.q1Matches.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 mb-4">
                <p className="font-semibold text-amber-300 text-sm">
                  {t.q1Matches[q1Index].situation}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2.5 mb-5">
                {t.q1Matches[q1Index].options.map((opt, idx) => {
                  const isSelected = q1SelectedOption === idx;
                  const isCorrect = idx === t.q1Matches[q1Index].correctIndex;

                  let btnStyle = 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700';
                  if (isSelected) {
                    btnStyle = isCorrect
                      ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300'
                      : 'bg-rose-900/80 text-rose-200 border-rose-500';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleQ1Answer(idx)}
                      className={`w-full p-3.5 rounded-2xl border text-sm font-bold text-start transition flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {isSelected && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Message */}
              {q1Feedback && (
                <div
                  className={`p-3.5 rounded-2xl mb-4 text-xs font-bold flex items-center gap-2 ${
                    q1Feedback.success
                      ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                      : 'bg-rose-950 border border-rose-500 text-rose-300'
                  }`}
                >
                  <span>{q1Feedback.success ? '✨' : '⚠️'}</span>
                  <span>{q1Feedback.text}</span>
                </div>
              )}

              {q1Feedback && q1Feedback.success && (
                <button
                  onClick={handleQ1Next}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg transition cursor-pointer"
                >
                  {q1Index < t.q1Matches.length - 1
                    ? (isRTL ? 'الموقف التالي ◀' : 'Next Situation ▶')
                    : (isRTL ? 'إكمال المهمة والفوز بالنجمة الزمردية! ★' : 'Complete Quest & Claim Emerald Star! ★')}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* QUEST 2: The Kindness Fountain (الرفق بالحيوان والنظافة) */}
        {activeModal === 'fountain' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-xl rounded-3xl bg-slate-900 border-2 border-cyan-500/60 p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 left-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">⛲</span>
                <div>
                  <h2 className="text-xl font-bold text-cyan-400 font-serif">
                    {t.station2Title}
                  </h2>
                  <p className="text-xs text-slate-300">{t.station2Subtitle}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 mb-4 text-xs text-slate-200">
                {t.q2Intro}
              </div>

              {/* Step 1: Clean Litter */}
              <div className="mb-4">
                <div className="flex justify-between items-center text-xs font-bold text-amber-300 mb-2">
                  <span>{t.q2Step1Title}</span>
                  <span className="text-cyan-400">
                    {t.q2Step1Remain} {q2Litter.filter((l) => !l.collected).length}
                  </span>
                </div>

                <div className="relative w-full h-36 rounded-2xl bg-slate-950 border border-cyan-900/60 overflow-hidden flex items-center justify-center">
                  <div className="text-xs text-slate-500">{t.q2Step1Hint}</div>
                  {q2Litter.map((item) =>
                    !item.collected ? (
                      <button
                        key={item.id}
                        onClick={() => handleCollectLitter(item.id)}
                        style={{ left: `${item.x}%`, top: `${item.y}%` }}
                        className="absolute p-2 text-xl hover:scale-125 transition transform bg-slate-800/80 rounded-xl border border-amber-400/50 shadow-md cursor-pointer animate-bounce"
                        title={isRTL ? 'اضغط لإزالة القمامة' : 'Click to clean'}
                      >
                        {item.icon}
                      </button>
                    ) : null
                  )}
                </div>
              </div>

              {/* Step 2: Pour Water for Kitten */}
              {q2Litter.every((l) => l.collected) && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/50 text-center space-y-3">
                  <p className="text-xs font-bold text-cyan-300">
                    {t.q2Step2Title}
                  </p>

                  <div className="flex items-center justify-center gap-6 py-2">
                    <span className="text-4xl">🐱</span>
                    <span className="text-2xl">➡️</span>
                    <span className="text-4xl">{q2WaterPoured ? '🥣💧' : '🥣'}</span>
                  </div>

                  {!q2WaterPoured ? (
                    <button
                      onClick={handlePourWater}
                      className="px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
                    >
                      {t.q2PourWaterBtn}
                    </button>
                  ) : (
                    <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-500 text-xs font-bold text-cyan-200 animate-pulse">
                      {t.q2KittenPurr}
                    </div>
                  )}
                </div>
              )}

              {q2WaterPoured && (
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full mt-4 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg transition cursor-pointer"
                >
                  {isRTL ? 'إغلاق والاحتفاظ بالنجمة الياقوتية الزرقاء ★' : 'Close & Keep Sapphire Star ★'}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* QUEST 3: Grandma Salma's Basket (الصدقة والمشاركة) */}
        {activeModal === 'grandma' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-xl rounded-3xl bg-slate-900 border-2 border-rose-500/60 p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 left-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🧺</span>
                <div>
                  <h2 className="text-xl font-bold text-rose-400 font-serif">
                    {t.station3Title}
                  </h2>
                  <p className="text-xs text-slate-300">{t.station3Subtitle}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/40 mb-4 text-xs text-slate-200">
                <p>{t.q3Intro}</p>
                <p className="font-bold text-amber-300 mt-1">{t.q3Instructions}</p>
              </div>

              {/* Pool Counter */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 mb-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-amber-300 font-bold">{t.q3DatesLeft}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-950 text-amber-400 font-mono font-bold">
                    🌴 {q3DatesPool}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-300 font-bold">{t.q3SweetsLeft}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-rose-950 text-rose-400 font-mono font-bold">
                    🍬 {q3SweetsPool}
                  </span>
                </div>
                <button
                  onClick={handleResetBaskets}
                  className="text-xs text-slate-400 hover:text-rose-300 underline cursor-pointer"
                >
                  {isRTL ? 'إعادة التوزيع' : 'Reset Baskets'}
                </button>
              </div>

              {/* 3 Neighbor Baskets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {q3Baskets.map((basket, idx) => {
                  const isPerfect = basket.dates === 2 && basket.sweets === 1;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border text-center transition ${
                        isPerfect
                          ? 'bg-emerald-950/60 border-emerald-500'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <h4 className="font-bold text-xs text-slate-200 mb-2">
                        {t.q3BasketNames[idx]}
                      </h4>

                      <div className="py-2 flex flex-col gap-1 items-center justify-center text-xs">
                        <span className="font-mono text-amber-300">
                          🌴 {isRTL ? 'تمور' : 'Dates'}: {basket.dates}/2
                        </span>
                        <span className="font-mono text-rose-300">
                          🍬 {isRTL ? 'حلوى' : 'Sweets'}: {basket.sweets}/1
                        </span>
                      </div>

                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => handleAddDateToBasket(idx)}
                          disabled={q3DatesPool <= 0}
                          className="flex-1 py-1 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-xs font-bold disabled:opacity-30 cursor-pointer"
                        >
                          + 🌴
                        </button>
                        <button
                          onClick={() => handleAddSweetToBasket(idx)}
                          disabled={q3SweetsPool <= 0}
                          className="flex-1 py-1 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-bold disabled:opacity-30 cursor-pointer"
                        >
                          + 🍬
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {q3Success && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-950 border border-emerald-500 text-xs font-bold text-emerald-300 text-center">
                    {t.q3EqualShareSuccess}
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-sm shadow-lg transition cursor-pointer"
                  >
                    {isRTL ? 'الفوز بنجمة الصدقة والمشاركة! ★' : 'Claim Star of Generosity! ★'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* QUEST 4: The Starry Minaret (التفكر والنجوم الإسلامية) */}
        {activeModal === 'minaret' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-xl rounded-3xl bg-slate-900 border-2 border-amber-500/60 p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 left-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">✨</span>
                <div>
                  <h2 className="text-xl font-bold text-amber-400 font-serif">
                    {t.station4Title}
                  </h2>
                  <p className="text-xs text-slate-300">{t.station4NPC}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/40 mb-4 text-xs text-slate-200">
                <p>{t.q4Intro}</p>
                <p className="font-bold text-amber-300 mt-1">{t.q4RotateHint}</p>
              </div>

              {/* 4 Quadrants Interactive Islamic Star Puzzle */}
              <div className="flex items-center justify-center my-6">
                <div className="grid grid-cols-2 gap-2 p-4 rounded-3xl bg-slate-950 border border-amber-500/40 shadow-inner">
                  {q4Rotations.map((rot, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRotateQuadrant(idx)}
                      style={{ transform: `rotate(${rot}deg)` }}
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold transition-transform duration-300 cursor-pointer ${
                        rot === 0
                          ? 'bg-amber-500/30 border-2 border-amber-400 text-amber-300 shadow-md'
                          : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                      title={isRTL ? 'اضغط لتدوير القطعة' : 'Click to rotate'}
                    >
                      <span>۞</span>
                    </button>
                  ))}
                </div>
              </div>

              {q4Completed && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-amber-950/80 border border-amber-400 text-xs font-bold text-amber-300 text-center leading-relaxed">
                    <p>{t.q4AlignedMsg}</p>
                    <p className="mt-1 text-emerald-300 font-serif">{t.q4SubhanAllah}</p>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg transition cursor-pointer"
                  >
                    {isRTL ? 'الحصول على النجمة الذهبية واكتمال الفانوس! ★' : 'Collect Golden Star & Light the Lantern! ★'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* GOOD DEEDS PASSPORT (جواز سفر الحسنات) */}
        {activeModal === 'passport' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl rounded-3xl bg-slate-900 border-2 border-amber-500/60 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 left-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-3xl mb-2">
                  📜
                </div>
                <h2 className="text-2xl font-bold text-amber-300 font-serif">
                  {t.passportTitle}
                </h2>
                <p className="text-xs text-slate-400">{t.passportSubtitle}</p>
                <p className="text-xs text-emerald-400 font-bold mt-1">
                  {isRTL ? `المستكشف الصغير: ${hero === 'zayd' ? 'زيد' : 'نور'}` : `Little Explorer: ${hero === 'zayd' ? 'Zayd' : 'Noor'}`}
                </p>
              </div>

              {/* 4 Deeds Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
                {[
                  {
                    id: 0,
                    icon: '🌿',
                    name: t.passportDeed1,
                    desc: t.passportDeed1Desc,
                    color: 'border-emerald-500 text-emerald-400'
                  },
                  {
                    id: 1,
                    icon: '⛲',
                    name: t.passportDeed2,
                    desc: t.passportDeed2Desc,
                    color: 'border-cyan-500 text-cyan-400'
                  },
                  {
                    id: 2,
                    icon: '🧺',
                    name: t.passportDeed3,
                    desc: t.passportDeed3Desc,
                    color: 'border-rose-500 text-rose-400'
                  },
                  {
                    id: 3,
                    icon: '✨',
                    name: t.passportDeed4,
                    desc: t.passportDeed4Desc,
                    color: 'border-amber-500 text-amber-400'
                  }
                ].map((badge) => {
                  const isEarned = unlockedStars[badge.id];
                  return (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-2xl border transition ${
                        isEarned
                          ? `bg-slate-950 ${badge.color} shadow-lg`
                          : 'bg-slate-950/40 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{badge.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-bold text-xs text-slate-200">
                            {badge.name}
                          </h4>
                          <span className="text-[10px] font-bold">
                            {isEarned ? (
                              <span className="text-emerald-400">✓ {t.earnedOn} ★</span>
                            ) : (
                              <span className="text-slate-500">{t.notEarnedYet}</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {badge.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Certificate of Completion (When all 4 are unlocked) */}
              {starsEarned === 4 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 to-emerald-950/60 border border-amber-400/80 text-center space-y-2 mb-4">
                  <span className="text-3xl">🏆</span>
                  <h3 className="text-base font-bold text-amber-300 font-serif">
                    {t.certificateTitle}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-serif">
                    « {t.certificateDesc} »
                  </p>
                </div>
              )}

              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                {t.closeBtn}
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* GRAND CELEBRATION FINALE MODAL */}
        {activeModal === 'celebration' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 border-2 border-amber-400 p-6 sm:p-8 shadow-2xl text-center space-y-4"
            >
              <div className="text-6xl animate-bounce">🏮✨🎉</div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-amber-300">
                {t.celebrationTitle}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed font-serif">
                {t.celebrationMsg}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  onClick={() => {
                    soundFx.playPop();
                    setActiveModal('passport');
                  }}
                  className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
                >
                  📜 {t.passportBtn}
                </button>
                <button
                  onClick={() => {
                    soundFx.playPop();
                    setActiveModal(null);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg transition cursor-pointer"
                >
                  ✨ {t.playAgainBtn}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
