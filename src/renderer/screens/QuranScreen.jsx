import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Search,
  X,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Bookmark,
  Share2,
  Sun,
  Moon,
  Info,
  Layers,
  Compass
} from 'lucide-react';
import ArabesquePattern from '../components/ArabesquePattern';
import MiniLoader from '../components/MiniLoader';
import BookView, { playRealPageFlipSound } from '../components/BookView';
import { normalizeArabic, findArabicMatches } from '../../utils/arabicNormalizer';

// Convert number to Eastern Arabic numerals (١، ٢، ٣...)
function toEasternArabic(num) {
  if (num === null || num === undefined) return '';
  return String(num).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// 30 Juz names in Arabic
const JUZ_NAMES = [
  'الجزء الأول', 'الجزء الثاني', 'الجزء الثالث', 'الجزء الرابع', 'الجزء الخامس',
  'الجزء السادس', 'الجزء السابع', 'الجزء الثامن', 'الجزء التاسع', 'الجزء العاشر',
  'الجزء الحادي عشر', 'الجزء الثاني عشر', 'الجزء الثالث عشر', 'الجزء الرابع عشر', 'الجزء الخامس عشر',
  'الجزء السادس عشر', 'الجزء السابع عشر', 'الجزء الثامن عشر', 'الجزء التاسع عشر', 'الجزء العشرون',
  'الجزء الحادي والعشرون', 'الجزء الثاني والعشرون', 'الجزء الثالث والعشرون', 'الجزء الرابع والعشرون', 'الجزء الخامس والعشرون',
  'الجزء السادس والعشرون', 'الجزء السابع والعشرون', 'الجزء الثامن والعشرون', 'الجزء التاسع والعشرون (تبارك)', 'الجزء الثلاثون (عمّ)'
];

// EveryAyah CDN subfolders mapping for canonical reciters
const RECITER_SUBFOLDERS = {
  '1': 'Alafasy_128kbps',
  '2': 'Abu_Bakr_Ash-Shaatree_128kbps',
  '3': 'Nasser_Alqatami_128kbps',
  '4': 'Yasser_Ad-Dussary_128kbps',
  '5': 'Hani_Rifai_192kbps'
};

// Session-scoped flag ensuring intro recitation only plays once per application session/lifetime
const INTRO_AUDIO_SESSION_KEY = 'nisab_quran_intro_played_session';
let hasPlayedIntroThisSession = false;

export default function QuranScreen({ initialTarget, onClearTarget }) {
  // Raw Quran and Surahs Data
  const [surahs, setSurahs] = useState([]);
  const [pagesMap, setPagesMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Active Navigation: page 1 to 604
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const saved = localStorage.getItem('nisab_mushaf_last_page');
      const p = Number(saved);
      return p >= 1 && p <= 604 ? p : 1;
    } catch (e) {
      return 1;
    }
  });

  // Page Turn Direction for Realistic 3D Paper Flip ('next' | 'prev')
  const [turnDirection, setTurnDirection] = useState('next');

  // React to incoming navigation target (from Khatmah Tracker)
  useEffect(() => {
    if (initialTarget?.page) {
      const targetP = Math.max(1, Math.min(604, Number(initialTarget.page)));
      setCurrentPage(targetP);
      try {
        localStorage.setItem('nisab_mushaf_last_page', String(targetP));
      } catch (e) {}
      if (onClearTarget) onClearTarget();
    }
  }, [initialTarget, onClearTarget]);

  // Container ref & dimensions for real-time dynamic font scaling on screen resize
  const mainContainerRef = useRef(null);
  const [containerSize, setContainerSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth - (window.innerWidth < 1024 ? 80 : 260) : 1000,
    height: typeof window !== 'undefined' ? window.innerHeight - 90 : 700
  }));

  // Theme: 'parchment' (classic ivory Mushaf) | 'night' (royal dark emerald)
  const [mushafTheme, setMushafTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('nisab_mushaf_theme');
      return saved === 'night' ? 'night' : 'parchment';
    } catch (e) {
      return 'parchment';
    }
  });

  // Bookmark Page (saved to disk / localStorage)
  const [bookmarkPage, setBookmarkPage] = useState(() => {
    try {
      const saved = localStorage.getItem('nisab_mushaf_bookmark');
      return saved ? Number(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Selected Ayah Interaction State
  const [activeAya, setActiveAya] = useState(null);
  const [copiedAya, setCopiedAya] = useState(false);
  const [copiedPageNum, setCopiedPageNum] = useState(null);

  // Tafseer Modal State
  const [tafseerOpen, setTafseerOpen] = useState(false);
  const [tafseerContent, setTafseerContent] = useState('');
  const [tafseerLoading, setTafseerLoading] = useState(false);

  // Global Quran Search State
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allAyahsFlat, setAllAyahsFlat] = useState([]);

  // Audio Playback State
  const [selectedReciterId, setSelectedReciterId] = useState(() => {
    try {
      const s = localStorage.getItem('nisab_user_settings');
      if (s) {
        const p = JSON.parse(s);
        if (p.reciterId) return String(p.reciterId);
      }
    } catch (e) {}
    return '1';
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [playingAyaGlobalNum, setPlayingAyaGlobalNum] = useState(null);
  const audioRef = useRef(new Audio());

  // Intro Ayah Recitation State ("وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا")
  const [showIntroPill, setShowIntroPill] = useState(false);
  const introAudioRef = useRef(null);

  // Dropdown menus state
  const [surahDropdownOpen, setSurahDropdownOpen] = useState(false);
  const [surahSearchQuery, setSurahSearchQuery] = useState('');
  const [juzDropdownOpen, setJuzDropdownOpen] = useState(false);
  const surahDropdownRef = useRef(null);
  const juzDropdownRef = useRef(null);

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (surahDropdownRef.current && !surahDropdownRef.current.contains(e.target)) {
        setSurahDropdownOpen(false);
        setSurahSearchQuery('');
      }
      if (juzDropdownRef.current && !juzDropdownRef.current.contains(e.target)) {
        setJuzDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Load Quran Raw Data and Index all 604 Standard Pages
  useEffect(() => {
    async function loadQuran() {
      try {
        setLoading(true);
        // Load Surahs metadata
        const suraMeta = await window.nisabAPI.readJson('Quran/sura.json');
        if (suraMeta?.data) {
          setSurahs(suraMeta.data);
        }

        // Load Arabic Quran Text and map to 604 pages
        const quranData = await window.nisabAPI.readJson('Quran/quran_Arabic.json');
        if (quranData?.data?.surahs) {
          const pMap = {};
          for (let i = 1; i <= 604; i++) {
            pMap[i] = {
              page: i,
              ayahs: [],
              juz: 1,
              hizb: 1,
              surahs: []
            };
          }

          const flatList = [];

          quranData.data.surahs.forEach((surah) => {
            surah.ayahs.forEach((ayah) => {
              const p = ayah.page;
              if (pMap[p]) {
                const ayahObj = {
                  ...ayah,
                  surahNumber: surah.number,
                  surahName: surah.name,
                  surahEnglish: surah.englishName,
                  revelationType: surah.revelationType
                };
                pMap[p].ayahs.push(ayahObj);
                pMap[p].juz = ayah.juz;
                pMap[p].hizb = ayah.hizbQuarter;
                if (!pMap[p].surahs.some((s) => s.number === surah.number)) {
                  pMap[p].surahs.push({
                    number: surah.number,
                    name: surah.name,
                    numberOfAyahs: surah.numberOfAyahs,
                    revelationType: surah.revelationType
                  });
                }
              }
              flatList.push({
                ...ayah,
                surahNumber: surah.number,
                surahName: surah.name
              });
            });
          });

          setPagesMap(pMap);
          setAllAyahsFlat(flatList);
        }
      } catch (err) {
        console.error('Failed to load Quran resources:', err);
      } finally {
        setLoading(false);
      }
    }

    if (window.nisabAPI) {
      loadQuran();
    }
  }, []);

  // Listen for user settings change (reciter updates)
  useEffect(() => {
    const handleSettingsChanged = () => {
      try {
        const s = localStorage.getItem('nisab_user_settings');
        if (s) {
          const p = JSON.parse(s);
          if (p.reciterId) setSelectedReciterId(String(p.reciterId));
        }
      } catch (e) {}
    };
    window.addEventListener('nisab-settings-changed', handleSettingsChanged);
    return () => window.removeEventListener('nisab-settings-changed', handleSettingsChanged);
  }, []);

  // Play "وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا" once only on the first visit to QuranScreen during app lifetime
  useEffect(() => {
    let isAlreadyPlayed = hasPlayedIntroThisSession;
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(INTRO_AUDIO_SESSION_KEY) === 'true') {
        isAlreadyPlayed = true;
      }
    } catch (e) {}

    if (isAlreadyPlayed) return;

    hasPlayedIntroThisSession = true;
    try {
      sessionStorage.setItem(INTRO_AUDIO_SESSION_KEY, 'true');
    } catch (e) {}

    let isCancelled = false;
    const audio = new Audio();
    introAudioRef.current = audio;

    async function startIntroRecitation() {
      try {
        let audioSrc = null;
        if (window.nisabAPI?.getOfflineAudio) {
          try {
            audioSrc = await window.nisabAPI.getOfflineAudio('rattil.mp3');
          } catch (e) {}
        }

        if (!audioSrc) {
          audioSrc = 'https://everyayah.com/data/Alafasy_128kbps/073004.mp3';
        }

        if (isCancelled) return;

        audio.src = audioSrc;
        audio.volume = 0.85;

        setShowIntroPill(true);

        audio.onended = () => {
          setShowIntroPill(false);
          introAudioRef.current = null;
        };

        audio.onerror = () => {
          setShowIntroPill(false);
          introAudioRef.current = null;
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.log('Intro audio autoplay notice:', err);
            setShowIntroPill(false);
          });
        }

        setTimeout(() => {
          if (!isCancelled) {
            setShowIntroPill(false);
          }
        }, 6500);
      } catch (err) {
        console.warn('Failed to play intro Ayah recitation:', err);
      }
    }

    const timer = setTimeout(startIntroRecitation, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      if (audio) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (e) {}
      }
      introAudioRef.current = null;
    };
  }, []);

  // Handle responsive dynamic font scaling on window / container resize
  useEffect(() => {
    const updateSize = () => {
      if (mainContainerRef.current) {
        const rect = mainContainerRef.current.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 50) {
          setContainerSize({ width: rect.width, height: rect.height });
          return;
        }
      }
      setContainerSize({
        width: window.innerWidth - (window.innerWidth < 1024 ? 80 : 260),
        height: window.innerHeight - 90
      });
    };

    updateSize();

    let observer = null;
    if (typeof ResizeObserver !== 'undefined' && mainContainerRef.current) {
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 50 && height > 50) {
            setContainerSize({ width, height });
          }
        }
      });
      observer.observe(mainContainerRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      if (observer) observer.disconnect();
    };
  }, []);

  // Calculate dynamic responsive font size based on page container dimensions (both width & height)
  const { ayahFontSize, ayahLineHeight, basmalahFontSize, surahTitleFontSize } = useMemo(() => {
    const { width, height } = containerSize;

    // The open book is strictly constrained by authentic Madani Mushaf aspect ratio: 1.41 / 1
    const maxBookWidth = width;
    const heightFromWidth = maxBookWidth / 1.41;
    const actualBookHeight = Math.min(height, heightFromWidth);

    // Each page height inside book borders
    const pageHeight = Math.max(320, actualBookHeight - 16);

    // Available text height inside page (after subtracting margins, frames, header, footer)
    const availableTextHeight = Math.max(200, pageHeight - 96);

    // Standard Madani Mushaf has exactly 15 lines per page.
    // Allocate line space with safe buffer (15.4) so 15 lines ALWAYS strictly fit without scrolling
    const lineSpacePx = availableTextHeight / 15.4;

    // Line-height multiplier for comfortable Arabic typography
    const lineMultiplier = 2.12;
    const calculatedFontSize = lineSpacePx / lineMultiplier;

    // Smooth clamping between readable minimum (11px) and expansive maximum (26px)
    const clampedSize = Math.max(11, Math.min(26, calculatedFontSize));
    const roundedSize = Math.round(clampedSize * 10) / 10;

    return {
      ayahFontSize: `${roundedSize}px`,
      ayahLineHeight: `${lineMultiplier}`,
      basmalahFontSize: `${Math.max(11, Math.round(roundedSize * 0.88))}px`,
      surahTitleFontSize: `${Math.max(12, Math.round(roundedSize * 0.95))}px`
    };
  }, [containerSize]);

  // Sync last visited page to localStorage with realistic paper flip motion
  const jumpToPage = useCallback(
    (pageNum, direction = null, playSound = true) => {
      const valid = Math.max(1, Math.min(604, pageNum));
      if (valid !== currentPage) {
        setTurnDirection(direction || (valid > currentPage ? 'next' : 'prev'));
        if (playSound) playRealPageFlipSound();
        setCurrentPage(valid);
        try {
          localStorage.setItem('nisab_mushaf_last_page', String(valid));
        } catch (e) {}
      }
    },
    [currentPage]
  );

  // Calculate Starting Pages for each of 114 Surahs
  const surahStartPages = useMemo(() => {
    const map = {};
    if (!pagesMap || Object.keys(pagesMap).length === 0) return map;
    for (let p = 1; p <= 604; p++) {
      const pageInfo = pagesMap[p];
      if (pageInfo?.ayahs) {
        pageInfo.ayahs.forEach((a) => {
          if (!map[a.surahNumber]) {
            map[a.surahNumber] = p;
          }
        });
      }
    }
    return map;
  }, [pagesMap]);

  // Calculate Starting Pages for each of 30 Juz
  const juzStartPages = useMemo(() => {
    const map = {};
    if (!pagesMap || Object.keys(pagesMap).length === 0) return map;
    for (let p = 1; p <= 604; p++) {
      const pageInfo = pagesMap[p];
      if (pageInfo?.juz && !map[pageInfo.juz]) {
        map[pageInfo.juz] = p;
      }
    }
    return map;
  }, [pagesMap]);

  // Filtered Surahs based on search query in the Surah dropdown
  const filteredSurahs = useMemo(() => {
    if (!surahSearchQuery.trim()) return surahs;
    const rawQ = surahSearchQuery.trim().toLowerCase();
    const q = normalizeArabic(rawQ).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    return surahs.filter((s) => {
      const normName = normalizeArabic(s.name || '');
      const cleanName = normName.replace(/^سورة\s+/, '');
      const numStr = String(s.number);
      const engName = (s.englishName || '').toLowerCase();
      return (
        normName.includes(q) ||
        cleanName.includes(q) ||
        numStr === q ||
        engName.includes(rawQ)
      );
    });
  }, [surahs, surahSearchQuery]);
  const handleToggleBookmark = () => {
    if (bookmarkPage === currentPage) {
      setBookmarkPage(null);
      try {
        localStorage.removeItem('nisab_mushaf_bookmark');
      } catch (e) {}
    } else {
      setBookmarkPage(currentPage);
      try {
        localStorage.setItem('nisab_mushaf_bookmark', String(currentPage));
      } catch (e) {}
    }
  };

  // Stable refs for audio lifecycle events
  const playingAyaGlobalNumRef = useRef(playingAyaGlobalNum);
  playingAyaGlobalNumRef.current = playingAyaGlobalNum;

  const allAyahsFlatRef = useRef(allAyahsFlat);
  allAyahsFlatRef.current = allAyahsFlat;

  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  const jumpToPageRef = useRef(jumpToPage);
  jumpToPageRef.current = jumpToPage;

  const playAyaAudioRef = useRef(null);

  // 3. Audio Playback Engine
  const playAyaAudio = useCallback(
    (ayah) => {
      if (!ayah) return;
      const sPad = String(ayah.surahNumber).padStart(3, '0');
      const aPad = String(ayah.numberInSurah).padStart(3, '0');
      const reciterFolder = RECITER_SUBFOLDERS[selectedReciterId] || 'Alafasy_128kbps';
      const audioUrl = `https://everyayah.com/data/${reciterFolder}/${sPad}${aPad}.mp3`;

      // Stop intro recitation if active
      if (introAudioRef.current) {
        try {
          introAudioRef.current.pause();
          introAudioRef.current.currentTime = 0;
          introAudioRef.current = null;
        } catch (e) {}
        setShowIntroPill(false);
      }

      const audio = audioRef.current;
      if (playingAyaGlobalNum === ayah.number && isPlaying) {
        audio.pause();
        setIsPlaying(false);
        setIsAudioLoading(false);
      } else {
        setIsAudioLoading(true);
        setPlayingAyaGlobalNum(ayah.number);
        setActiveAya(ayah);
        audio.src = audioUrl;
        audio.load();
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsAudioLoading(false);
            })
            .catch((err) => {
              console.warn('Audio playback error:', err);
              setIsPlaying(false);
              setIsAudioLoading(false);
            });
        }
      }
    },
    [playingAyaGlobalNum, isPlaying, selectedReciterId]
  );
  playAyaAudioRef.current = playAyaAudio;

  // Single Audio Lifecycle & Auto-advance Listener (Mounted once)
  useEffect(() => {
    const audio = audioRef.current;

    const handlePlaying = () => {
      setIsAudioLoading(false);
      setIsPlaying(true);
    };

    const handleWaiting = () => {
      setIsAudioLoading(true);
    };

    const handleCanPlay = () => {
      setIsAudioLoading(false);
    };

    const handleError = (e) => {
      console.warn('HTMLAudioElement error:', e);
      setIsAudioLoading(false);
      setIsPlaying(false);
    };

    const handleEnded = () => {
      const currentGlobalNum = playingAyaGlobalNumRef.current;
      const flatList = allAyahsFlatRef.current;
      if (currentGlobalNum && flatList.length > 0) {
        const currentIdx = flatList.findIndex((a) => a.number === currentGlobalNum);
        if (currentIdx >= 0 && currentIdx < flatList.length - 1) {
          const nextAyah = flatList[currentIdx + 1];
          if (nextAyah.page !== currentPageRef.current) {
            jumpToPageRef.current?.(nextAyah.page);
          }
          playAyaAudioRef.current?.(nextAyah);
          return;
        }
      }
      setIsPlaying(false);
      setIsAudioLoading(false);
      setPlayingAyaGlobalNum(null);
    };

    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.removeAttribute('src');
    };
  }, []);

  // Tafseer Handler
  const handleOpenTafseer = async (ayah) => {
    if (!ayah) return;
    setTafseerOpen(true);
    setTafseerLoading(true);
    try {
      const text = await window.nisabAPI.getTafseer(ayah.surahNumber, ayah.numberInSurah);
      setTafseerContent(text || 'لم يتم العثور على تفسير متاح لهذه الآية.');
    } catch (e) {
      setTafseerContent('تعذر استرجاع التفسير في الوقت الحالي.');
    } finally {
      setTafseerLoading(false);
    }
  };

  // Copy Ayah
  const handleCopyAya = (ayah) => {
    if (!ayah) return;
    navigator.clipboard.writeText(`﴿ ${ayah.text} ﴾ [${ayah.surahName} : ${ayah.numberInSurah}]`);
    setCopiedAya(true);
    setTimeout(() => setCopiedAya(false), 2000);
  };

  // Copy Entire Page to Clipboard
  const handleCopyPage = useCallback(
    (pageNum) => {
      const pageData = pagesMap[pageNum];
      if (!pageData || !pageData.ayahs || pageData.ayahs.length === 0) return;

      const surahGroups = [];
      let currentGroup = null;
      pageData.ayahs.forEach((ayah) => {
        if (!currentGroup || currentGroup.surahNumber !== ayah.surahNumber) {
          currentGroup = {
            surahNumber: ayah.surahNumber,
            surahName: ayah.surahName,
            isStartOfSurah: ayah.numberInSurah === 1,
            ayahs: []
          };
          surahGroups.push(currentGroup);
        }
        currentGroup.ayahs.push(ayah);
      });

      const lines = [];
      const surahsHeader = pageData.surahs.map((s) => s.name).join(' / ');
      lines.push(`﴿ سورة ${surahsHeader} - صفحة ${toEasternArabic(pageNum)} ﴾\n`);

      surahGroups.forEach((group) => {
        if (group.isStartOfSurah) {
          lines.push(`[ سورة ${group.surahName} ]`);
          if (group.surahNumber !== 1 && group.surahNumber !== 9) {
            lines.push('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');
          }
        }
        const groupText = group.ayahs
          .map((a) => {
            let cleanText = a.text;
            if (a.numberInSurah === 1 && a.surahNumber !== 1 && a.surahNumber !== 9) {
              cleanText = cleanText.replace(/^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\s*/, '');
            }
            return `${cleanText} ﴿${toEasternArabic(a.numberInSurah)}﴾`;
          })
          .join(' ');
        lines.push(groupText);
      });

      const fullText = lines.join('\n\n');
      navigator.clipboard.writeText(fullText);
      setCopiedPageNum(pageNum);
      setTimeout(() => setCopiedPageNum(null), 2000);
    },
    [pagesMap]
  );

  // Search in Quran
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || allAyahsFlat.length === 0) return [];
    const q = normalizeArabic(searchQuery.trim().toLowerCase());
    return allAyahsFlat
      .filter((a) => normalizeArabic(a.text).includes(q))
      .slice(0, 50); // Top 50 results
  }, [searchQuery, allAyahsFlat]);

  // Theme Palette Config
  const themeClasses = useMemo(() => {
    if (mushafTheme === 'night') {
      return {
        colorScheme: 'dark',
        bookBorder: 'border-[#0a2f26] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(16,185,129,0.15)]',
        pageBg: 'bg-gradient-to-b from-[#021a14] via-[#032019] to-[#01140e]',
        pageBgColor: '#021a14',
        ornamentBorder: 'border-amber-600/50',
        innerBorder: 'border-amber-500/30',
        headerText: 'text-amber-400',
        headerTextColor: '#fbbf24',
        pageNumberText: 'text-amber-300',
        pageNumberTextColor: '#fcd34d',
        surahBannerBg: 'bg-gradient-to-r from-amber-600/20 via-amber-500/30 to-amber-600/20 border-amber-500/50',
        surahBannerText: 'text-amber-300',
        surahBannerTextColor: '#fcd34d',
        basmalahText: 'text-amber-200',
        basmalahTextColor: '#fde68a',
        ayahText: 'text-[#fef3c7]',
        ayahTextColor: '#fef3c7',
        ayahActiveBg: 'bg-amber-400/25 ring-1 ring-amber-400',
        ayahEndMark: 'text-amber-400 font-bold',
        ayahEndMarkColor: '#fbbf24',
        spineGradient: 'from-black/50 via-black/20 to-black/50'
      };
    }
    // Default: Parchment / Ivory Classic King Fahd Mushaf
    return {
      colorScheme: 'light',
      bookBorder: 'border-[#1b3d33] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(217,119,6,0.2)]',
      pageBg: 'bg-gradient-to-b from-[#fefcf8] via-[#fbf7ee] to-[#f7f2e4]',
      pageBgColor: '#fefcf8',
      ornamentBorder: 'border-[#c59b27]/60',
      innerBorder: 'border-[#c59b27]/30',
      headerText: 'text-[#8a6514]',
      headerTextColor: '#8a6514',
      pageNumberText: 'text-[#8a6514]',
      pageNumberTextColor: '#8a6514',
      surahBannerBg: 'bg-gradient-to-r from-[#d4af37]/15 via-[#d4af37]/25 to-[#d4af37]/15 border-[#b8860b]/60',
      surahBannerText: 'text-[#7a570f]',
      surahBannerTextColor: '#7a570f',
      basmalahText: 'text-[#7a570f]',
      basmalahTextColor: '#7a570f',
      ayahText: 'text-[#1c2e28]',
      ayahTextColor: '#1c2e28',
      ayahActiveBg: 'bg-amber-300/40 ring-1 ring-amber-500',
      ayahEndMark: 'text-[#a2781a] font-bold',
      ayahEndMarkColor: '#a2781a',
      spineGradient: 'from-black/35 via-black/10 to-black/35'
    };
  }, [mushafTheme]);

  // Helper component to render a single standard Mushaf Page (1 to 604)
  const renderMushafPage = (pageNum, side) => {
    const pageData = pagesMap[pageNum];
    if (!pageData) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 text-amber-500">
          <MiniLoader size="md" color="amber" />
        </div>
      );
    }

    const isBookmarkOnThisPage = bookmarkPage === pageNum;
    const isFirstTwoPages = pageNum === 1 || pageNum === 2;

    // Group ayahs on this page by Surah sequence
    const surahGroups = [];
    let currentGroup = null;

    pageData.ayahs.forEach((ayah) => {
      if (!currentGroup || currentGroup.surahNumber !== ayah.surahNumber) {
        currentGroup = {
          surahNumber: ayah.surahNumber,
          surahName: ayah.surahName,
          isStartOfSurah: ayah.numberInSurah === 1,
          ayahs: []
        };
        surahGroups.push(currentGroup);
      }
      currentGroup.ayahs.push(ayah);
    });

    const firstSurahName = pageData.surahs[0]?.name || '';
    const lastSurahName = pageData.surahs[pageData.surahs.length - 1]?.name || firstSurahName;

    return (
      <div
        style={{
          colorScheme: themeClasses.colorScheme,
          backgroundColor: themeClasses.pageBgColor,
          color: themeClasses.ayahTextColor
        }}
        className={`relative flex-1 h-full flex flex-col justify-between overflow-hidden select-none ${themeClasses.pageBg} ${
          side === 'right' ? 'rounded-r-2xl border-l border-amber-900/10' : 'rounded-l-2xl border-r border-amber-900/10'
        }`}
      >
        {/* Outer Ornamental Golden Border */}
        <div
          className={`relative m-1.5 sm:m-2.5 flex-1 flex flex-col justify-between border-2 ${
            isFirstTwoPages ? 'border-4 border-amber-500 shadow-inner' : themeClasses.ornamentBorder
          } rounded-2xl p-1.5 sm:p-2.5 overflow-hidden`}
        >
          {/* Inner Golden Line */}
          <div
            className={`flex-1 flex flex-col justify-between border ${themeClasses.innerBorder} rounded-xl p-2 sm:p-3 overflow-hidden relative`}
          >
            {/* Corner Decorative Dots */}
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500/60" />
            <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-500/60" />
            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500/60" />
            <span className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-500/60" />

            {/* Page Header (Surah name & Juz / Hizb) */}
            <div
              style={{ color: themeClasses.headerTextColor }}
              className={`flex items-center justify-between pb-1 mb-1.5 border-b ${themeClasses.innerBorder} select-none text-[11px] sm:text-xs font-quran-hafs font-bold`}
            >
              {side === 'right' ? (
                <>
                  <span className="tracking-wide">{firstSurahName}</span>
                  <span className="font-mono">{JUZ_NAMES[pageData.juz - 1] || `الجزء ${toEasternArabic(pageData.juz)}`}</span>
                </>
              ) : (
                <>
                  <span className="font-mono">الحزب {toEasternArabic(Math.ceil(pageData.hizb / 4))}</span>
                  <span className="tracking-wide">{lastSurahName}</span>
                </>
              )}
            </div>

            {/* Middle: Standard 15-line Uthmani Text Body (Strictly fits without vertical scrolling) */}
            <div
              className={`flex-1 flex flex-col ${
                isFirstTwoPages ? 'justify-center' : 'justify-between'
              } overflow-hidden px-1 text-justify select-none`}
            >
              {surahGroups.map((group, gIdx) => (
                <div key={`group-${group.surahNumber}-${gIdx}`} className="w-full">
                  {/* Surah Header Banner if a Surah begins on this page */}
                  {group.isStartOfSurah && (
                    <div className="my-1.5 select-none">
                      <div
                        className={`py-1 sm:py-1.5 px-3 rounded-xl border ${themeClasses.surahBannerBg} text-center shadow-sm flex items-center justify-center gap-2`}
                      >
                        <span className="text-amber-500 font-quran-hafs text-xs">۞</span>
                        <h3
                          style={{ fontSize: surahTitleFontSize, color: themeClasses.surahBannerTextColor }}
                          className="font-quran-hafs font-bold"
                        >
                          {group.surahName}
                        </h3>
                        <span className="text-amber-500 font-quran-hafs text-xs">۞</span>
                      </div>

                      {/* Basmalah (omitted for Surah 1 & Surah 9 At-Tawbah) */}
                      {group.surahNumber !== 1 && group.surahNumber !== 9 && (
                        <div
                          style={{ fontSize: basmalahFontSize, color: themeClasses.basmalahTextColor }}
                          className="text-center font-quran-hafs font-bold my-1 tracking-wider select-none"
                        >
                          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </div>
                      )}
                    </div>
                  )}

                  {/* Flowing Ayahs of this Surah with dynamic responsive font size */}
                  <div
                    style={{
                      fontSize: ayahFontSize,
                      lineHeight: ayahLineHeight,
                      textAlign: 'justify',
                      textJustify: 'inter-word',
                      color: themeClasses.ayahTextColor
                    }}
                    className="font-quran-hafs text-justify tracking-normal select-none"
                  >
                    {group.ayahs.map((ayah) => {
                      const isSelected = activeAya?.number === ayah.number;
                      const isPlayingThis = playingAyaGlobalNum === ayah.number;

                      // Strip leading Basmalah from Ayah 1 of any surah other than Fatihah and Tawbah
                      let cleanText = ayah.text;
                      if (ayah.numberInSurah === 1 && ayah.surahNumber !== 1 && ayah.surahNumber !== 9) {
                        cleanText = cleanText.replace(/^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\s*/, '');
                      }

                      return (
                        <span
                          key={`aya-${ayah.number}`}
                          onClick={() => setActiveAya(ayah)}
                          className={`inline transition-all cursor-pointer select-none rounded px-0.5 py-0.5 ${
                            isPlayingThis
                              ? themeClasses.ayahActiveBg
                              : isSelected
                              ? 'bg-amber-400/20 ring-1 ring-amber-400/60'
                              : 'hover:bg-amber-500/10'
                          }`}
                          title={`انقر لاختيار الآية [${ayah.surahName}: ${ayah.numberInSurah}]`}
                        >
                          <span style={{ color: themeClasses.ayahTextColor }}>{cleanText}</span>
                          <span
                            style={{ color: themeClasses.ayahEndMarkColor }}
                            className="inline-block mx-1 font-quran-hafs font-bold select-none"
                          >
                            ﴿{toEasternArabic(ayah.numberInSurah)}﴾
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Page Footer (Authentic Eastern Arabic Page Number inside Medallion & Copy Page Button) */}
            <div
              className={`pt-1.5 mt-2 border-t ${themeClasses.innerBorder} flex items-center justify-between px-1 select-none relative`}
            >
              {side === 'right' ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPage(pageNum);
                    }}
                    style={{ color: copiedPageNum === pageNum ? undefined : themeClasses.headerTextColor }}
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] sm:text-[11px] font-sans font-medium transition-all shadow-sm ${
                      copiedPageNum === pageNum
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                        : `${themeClasses.innerBorder} hover:bg-amber-500/15 hover:border-amber-500/50 hover:text-amber-600`
                    }`}
                    title="نسخ نص هذه الصفحة بالكامل إلى الحافظة"
                  >
                    {copiedPageNum === pageNum ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500 stroke-[2.5]" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>نسخ الصفحة</span>
                      </>
                    )}
                  </button>
                  <div
                    style={{ color: themeClasses.pageNumberTextColor }}
                    className={`flex items-center justify-center px-3 py-0.5 rounded-full border ${themeClasses.innerBorder} font-quran-hafs font-bold text-xs sm:text-sm shadow-sm`}
                  >
                    <span>{toEasternArabic(pageNum)}</span>
                  </div>
                  <div className="w-16 sm:w-20" />
                </>
              ) : (
                <>
                  <div className="w-16 sm:w-20" />
                  <div
                    style={{ color: themeClasses.pageNumberTextColor }}
                    className={`flex items-center justify-center px-3 py-0.5 rounded-full border ${themeClasses.innerBorder} font-quran-hafs font-bold text-xs sm:text-sm shadow-sm`}
                  >
                    <span>{toEasternArabic(pageNum)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPage(pageNum);
                    }}
                    style={{ color: copiedPageNum === pageNum ? undefined : themeClasses.headerTextColor }}
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] sm:text-[11px] font-sans font-medium transition-all shadow-sm ${
                      copiedPageNum === pageNum
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                        : `${themeClasses.innerBorder} hover:bg-amber-500/15 hover:border-amber-500/50 hover:text-amber-600`
                    }`}
                    title="نسخ نص هذه الصفحة بالكامل إلى الحافظة"
                  >
                    {copiedPageNum === pageNum ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500 stroke-[2.5]" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>نسخ الصفحة</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{ height: '100%', width: '100%', overflow: 'hidden' }}
      className="relative h-full w-full bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden"
      dir="rtl"
    >
      <ArabesquePattern className="opacity-10 text-emerald-500 pointer-events-none" />

      {/* Visual notification badge when playing the intro Ayah */}
      <AnimatePresence>
        {showIntroPill && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-amber-500/60 text-amber-300 shadow-2xl flex items-center gap-3 backdrop-blur-xl pointer-events-none"
          >
            <Volume2 className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="font-serif font-bold text-sm sm:text-base text-amber-200">
              ﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾
            </span>
            <span className="text-[10px] text-emerald-400 font-sans border-r border-emerald-800 pr-2.5">
              سورة المزمل
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Quran Bar: Navigation, Surah/Juz Pickers, Search, Audio & Themes */}
      <header className="relative z-20 border-b border-emerald-900/50 bg-slate-950/90 backdrop-blur-md px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shadow-xl shrink-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Surah Selector Dropdown */}
          <div className="relative" ref={surahDropdownRef}>
            <button
              onClick={() => {
                const nextOpen = !surahDropdownOpen;
                setSurahDropdownOpen(nextOpen);
                setJuzDropdownOpen(false);
                if (!nextOpen) setSurahSearchQuery('');
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-950/70 border border-emerald-700/50 hover:border-amber-400 text-amber-300 font-bold text-xs sm:text-sm shadow transition"
              title="الانتقال إلى سورة محددة"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>
                {pagesMap[currentPage]?.surahs?.[0]?.name || 'السورة'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${surahDropdownOpen ? 'rotate-180 text-amber-300' : ''}`} />
            </button>

            {surahDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-72 max-h-96 flex flex-col bg-slate-900/98 backdrop-blur-xl border border-emerald-700/60 rounded-2xl shadow-2xl z-50 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Search Bar Header */}
                <div className="p-2 border-b border-emerald-900/60 bg-slate-950/70 sticky top-0 z-10">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-emerald-400 absolute right-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={surahSearchQuery}
                      onChange={(e) => setSurahSearchQuery(e.target.value)}
                      placeholder="ابحث عن اسم السورة أو رقمها..."
                      autoFocus
                      className="w-full bg-slate-900 border border-emerald-800/80 rounded-xl pr-8 pl-7 py-1.5 text-xs text-amber-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                    />
                    {surahSearchQuery && (
                      <button
                        onClick={() => setSurahSearchQuery('')}
                        className="absolute left-2 text-slate-400 hover:text-slate-200 p-0.5 rounded transition"
                        title="مسح البحث"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Surahs Scrollable List */}
                <div className="p-1.5 overflow-y-auto max-h-72 divide-y divide-emerald-900/30 scrollbar-thin scrollbar-thumb-emerald-700">
                  {filteredSurahs.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      لا توجد سورة تطابق "{surahSearchQuery}"
                    </div>
                  ) : (
                    filteredSurahs.map((s) => {
                      const startP = surahStartPages[s.number] || 1;
                      return (
                        <button
                          key={s.number}
                          onClick={() => {
                            jumpToPage(startP);
                            setSurahDropdownOpen(false);
                            setSurahSearchQuery('');
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-right hover:bg-emerald-950/80 text-xs sm:text-sm transition text-slate-200 hover:text-amber-300 group"
                        >
                          <span className="font-semibold group-hover:text-amber-300">
                            {s.number}. {s.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 group-hover:text-emerald-400">
                            ص {toEasternArabic(startP)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Juz Selector Dropdown */}
          <div className="relative" ref={juzDropdownRef}>
            <button
              onClick={() => {
                setJuzDropdownOpen(!juzDropdownOpen);
                setSurahDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900 border border-emerald-900/60 hover:border-amber-400 text-slate-200 hover:text-amber-300 font-semibold text-xs sm:text-sm shadow transition"
              title="الانتقال إلى جزء محدد"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>الجزء {toEasternArabic(pagesMap[currentPage]?.juz || 1)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {juzDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-slate-900 border border-emerald-800 rounded-2xl shadow-2xl p-2 z-50 divide-y divide-emerald-900/30 scrollbar-thin scrollbar-thumb-emerald-700">
                {JUZ_NAMES.map((name, idx) => {
                  const jNum = idx + 1;
                  const startP = juzStartPages[jNum] || 1;
                  return (
                    <button
                      key={jNum}
                      onClick={() => {
                        jumpToPage(startP);
                        setJuzDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-right hover:bg-emerald-950/80 text-xs sm:text-sm transition text-slate-200 hover:text-amber-300"
                    >
                      <span>{name}</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        ص {toEasternArabic(startP)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Direct Page Input Box */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-emerald-900/60 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-400">الصفحة:</span>
            <input
              type="number"
              min="1"
              max="604"
              value={currentPage}
              onChange={(e) => jumpToPage(Number(e.target.value))}
              className="w-12 bg-slate-950 border border-emerald-800/80 rounded-lg px-1.5 py-0.5 text-center font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-400"
            />
            <span className="text-slate-500 font-mono">/ ٦٠٤</span>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            style={
              bookmarkPage === currentPage
                ? {
                    backgroundColor: 'rgba(153, 27, 27, 0.4)',
                    borderColor: '#ef4444',
                    color: '#fca5a5'
                  }
                : undefined
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl border text-xs sm:text-sm font-semibold transition ${
              bookmarkPage === currentPage
                ? 'shadow shadow-red-950/40'
                : 'bg-slate-900 border-emerald-900/60 text-slate-300 hover:text-amber-300'
            }`}
            title={bookmarkPage === currentPage ? 'إزالة الفاصل المرجعي' : 'حفظ فاصل القراءة في هذه الصفحة'}
          >
            <Bookmark
              style={bookmarkPage === currentPage ? { fill: '#ef4444', color: '#ef4444' } : undefined}
              className="w-3.5 h-3.5"
            />
            <span>{bookmarkPage === currentPage ? 'محفوظة' : 'فاصل'}</span>
          </button>

          {bookmarkPage && bookmarkPage !== currentPage && (
            <button
              onClick={() => jumpToPage(bookmarkPage)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition"
              title="الانتقال إلى العلامة المحفوظة"
            >
              الذهاب للعلامة (ص {toEasternArabic(bookmarkPage)})
            </button>
          )}
        </div>

        {/* Right Tools: Search in Quran, Dual/Single mode, Theme switcher */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900 border border-emerald-900/60 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-xs sm:text-sm transition shadow"
            title="البحث في آيات القرآن الكريم"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">بحث في القرآن</span>
          </button>

          {/* Theme Mode Toggle (Parchment vs Night Emerald) */}
          <button
            onClick={() => {
              const nextTheme = mushafTheme === 'parchment' ? 'night' : 'parchment';
              setMushafTheme(nextTheme);
              try {
                localStorage.setItem('nisab_mushaf_theme', nextTheme);
              } catch (e) {}
            }}
            className="p-2 rounded-xl bg-slate-900 border border-emerald-900/60 hover:border-amber-400 text-slate-300 hover:text-amber-300 transition shadow"
            title={mushafTheme === 'parchment' ? 'تفعيل الوضع الليلي للمصحف' : 'تفعيل لون الورق العاجي للمصحف'}
          >
            {mushafTheme === 'parchment' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* BookView Reader (Dual-Page Open Book with 3D Page Flip Animation) */}
      <BookView
        totalPages={604}
        currentPage={currentPage}
        onPageChange={(newPage, dir) => jumpToPage(newPage, dir, false)}
        renderPage={(pageNum, side) => renderMushafPage(pageNum, side)}
        loading={loading}
        loadingMessage="جاري فتح المصحف الشريف..."
        theme={themeClasses}
        bookmarkPage={bookmarkPage}
        onToggleBookmark={handleToggleBookmark}
        containerRef={mainContainerRef}
      />

      {/* Floating Selected Ayah Action Pill */}
      <AnimatePresence>
        {activeAya && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 w-auto min-w-[480px] sm:min-w-[540px] max-w-[94vw] px-5 sm:px-6 py-3 rounded-2xl bg-slate-900/95 border border-amber-500/60 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm select-none"
          >
            <div className="font-serif text-amber-300 font-bold border-l border-emerald-800/80 pl-3.5 sm:pl-4 text-sm sm:text-base shrink-0">
              {activeAya.surahName} : {activeAya.numberInSurah}
            </div>

            {/* الاستماع للآية Button */}
            <button
              onClick={() => playAyaAudio(activeAya)}
              className={`flex items-center justify-center gap-2 px-4 py-2 min-w-[130px] rounded-xl font-bold transition shadow-lg text-white ${
                isAudioLoading && playingAyaGlobalNum === activeAya.number
                  ? 'bg-amber-600'
                  : playingAyaGlobalNum === activeAya.number && isPlaying
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-900/30'
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-900/30'
              }`}
              title={
                isAudioLoading && playingAyaGlobalNum === activeAya.number
                  ? 'جاري التحميل...'
                  : playingAyaGlobalNum === activeAya.number && isPlaying
                  ? 'إيقاف التلاوة'
                  : 'الاستماع للآية'
              }
            >
              {isAudioLoading && playingAyaGlobalNum === activeAya.number ? (
                <MiniLoader size="sm" color="white" />
              ) : playingAyaGlobalNum === activeAya.number && isPlaying ? (
                <>
                  <Pause className="w-4 h-4 text-white" />
                  <span>إيقاف</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-white" />
                  <span>الاستماع للآية</span>
                </>
              )}
            </button>

            {/* Tafseer Button */}
            <button
              type="button"
              onClick={() => handleOpenTafseer(activeAya)}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-semibold transition"
            >
              <Info className="w-4 h-4" />
              <span>التفسير</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={() => handleCopyAya(activeAya)}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition font-medium"
            >
              {copiedAya ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedAya ? 'تم النسخ' : 'نسخ'}</span>
            </button>

            {/* Dismiss */}
            <button
              type="button"
              onClick={() => setActiveAya(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tafseer Modal */}
      <AnimatePresence>
        {tafseerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-3xl bg-slate-900 border border-amber-500/40 p-5 sm:p-7 shadow-2xl text-slate-100 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
                <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-lg">
                  <Info className="w-5 h-5 text-amber-400" />
                  <span>
                    تفسير الآية [{activeAya?.surahName} : {activeAya?.numberInSurah}]
                  </span>
                </div>
                <button
                  onClick={() => setTafseerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Ayah Snippet */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-amber-200 font-quran-hafs text-base sm:text-lg leading-relaxed text-center">
                « {activeAya?.text} »
              </div>

              {/* Tafseer Body */}
              <div className="flex-1 overflow-y-auto text-sm sm:text-base text-slate-200 leading-loose scrollbar-thin scrollbar-thumb-emerald-800 pr-2 text-justify">
                {tafseerLoading ? (
                  <div className="py-12 text-center text-emerald-400 flex flex-col items-center justify-center gap-3">
                    <MiniLoader size="md" color="amber" />
                    <span className="text-amber-200/90 text-sm">جاري تحميل التفسير الميسر...</span>
                  </div>
                ) : (
                  tafseerContent
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Quran Search Modal */}
      <AnimatePresence>
        {searchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-slate-900 border border-emerald-700/60 p-5 sm:p-7 shadow-2xl text-slate-100 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
                <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-lg">
                  <Search className="w-5 h-5 text-emerald-400" />
                  <span>البحث الشامل في المصحف الشريف</span>
                </div>
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute right-3.5 top-3 w-4 h-4 text-emerald-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="اكتب كلمة أو آية للبحث (مثال: إن مع العسر يسرا، الله نور السماوات)..."
                  className="w-full bg-slate-950 border border-emerald-800/80 rounded-2xl pr-10 pl-10 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 scrollbar-thin scrollbar-thumb-emerald-800 pr-1">
                {searchResults.map((a) => (
                  <div
                    key={`search-${a.number}`}
                    onClick={() => {
                      jumpToPage(a.page);
                      setActiveAya(a);
                      setSearchModalOpen(false);
                    }}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-emerald-900/50 hover:border-amber-400/80 cursor-pointer transition flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="text-amber-400 font-bold font-serif">{a.surahName}</span>
                      <span className="font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-800/60">
                        صفحة {toEasternArabic(a.page)}
                      </span>
                    </div>
                    <div className="font-quran-hafs text-sm sm:text-base text-slate-200 leading-relaxed text-justify">
                      « {a.text} »
                    </div>
                  </div>
                ))}

                {searchQuery && searchResults.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    لم يتم العثور على آيات مطابقة لكلمة البحث.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
