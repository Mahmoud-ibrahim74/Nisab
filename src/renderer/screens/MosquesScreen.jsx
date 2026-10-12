import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Navigation,
  Compass,
  Clock,
  Search,
  RefreshCw,
  ExternalLink,
  Check,
  ChevronDown,
  Info,
  Sun,
  Moon,
  Sunset,
  Sunrise,
  Footprints,
  Car,
  Wifi,
  WifiOff,
  Crosshair,
  SlidersHorizontal,
  Bookmark,
  Share2,
  X,
  AlertCircle
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import ArabesquePattern from '../components/ArabesquePattern';
import MiniLoader from '../components/MiniLoader';
import { CALCULATION_METHODS } from './SettingsScreen';

// Fallback Quick Traveler Cities
const TRAVELER_PRESET_CITIES = [
  { name: 'مكة المكرمة', country: 'السعودية', lat: 21.4225, lon: 39.8262, method: 'UmmAlQura' },
  { name: 'المدينة المنورة', country: 'السعودية', lat: 24.4672, lon: 39.6111, method: 'UmmAlQura' },
  { name: 'القدس الشريف', country: 'فلسطين', lat: 31.7767, lon: 35.2345, method: 'MuslimWorldLeague' },
  { name: 'القاهرة', country: 'مصر', lat: 30.0444, lon: 31.2357, method: 'Egyptian' },
  { name: 'الرياض', country: 'السعودية', lat: 24.7136, lon: 46.6753, method: 'UmmAlQura' },
  { name: 'دبي', country: 'الإمارات', lat: 25.2048, lon: 55.2708, method: 'Dubai' },
  { name: 'الدوحة', country: 'قطر', lat: 25.2854, lon: 51.5310, method: 'Qatar' },
  { name: 'الكويت', country: 'الكويت', lat: 29.3759, lon: 47.9774, method: 'Kuwait' },
  { name: 'إسطنبول', country: 'تركيا', lat: 41.0082, lon: 28.9784, method: 'MuslimWorldLeague' },
  { name: 'عَمّان', country: 'الأردن', lat: 31.9539, lon: 35.9106, method: 'MuslimWorldLeague' },
  { name: 'كوالالمبور', country: 'ماليزيا', lat: 3.1390, lon: 101.6869, method: 'MuslimWorldLeague' },
  { name: 'لندن', country: 'المملكة المتحدة', lat: 51.5074, lon: -0.1278, method: 'MuslimWorldLeague' },
  { name: 'باريس', country: 'فرنسا', lat: 48.8566, lon: 2.3522, method: 'MuslimWorldLeague' }
];

// Overpass API Endpoints for fallback redundancy
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

// Local storage cache keys
const CACHE_KEY_PREFIX = 'nisab_nearby_mosques_cache_';

// Prayer metadata for visual presentation
const PRAYER_NAMES = {
  fajr: { name: 'الفجر', icon: Sunrise, qasr: false },
  sunrise: { name: 'الشروق', icon: Sun, qasr: false },
  dhuhr: { name: 'الظهر', icon: Sun, qasr: true, normalRakats: 4, qasrRakats: 2 },
  asr: { name: 'العصر', icon: Sunset, qasr: true, normalRakats: 4, qasrRakats: 2 },
  maghrib: { name: 'المغرب', icon: Sunset, qasr: false, normalRakats: 3, qasrRakats: 3 },
  isha: { name: 'العشاء', icon: Moon, qasr: true, normalRakats: 4, qasrRakats: 2 }
};

/**
 * High-accuracy distance calculation using the Haversine formula (returns meters)
 */
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Format meters into Arabic distance string (e.g. 450 م or 2.3 كم)
 */
function formatDistanceArabic(meters) {
  if (meters === null || meters === undefined) return '';
  if (meters < 1000) {
    return `${meters} م`;
  }
  return `${(meters / 1000).toFixed(1)} كم`;
}

/**
 * Convert Date to Arabic 12-hour formatted time (e.g. 03:45 م)
 */
function formatPrayerTime(date) {
  if (!date) return '--:--';
  return date.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Execute Overpass query with automatic mirror failover
 */
async function fetchOverpassMosques(lat, lon, radiusMeters) {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lon});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lon});
      relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lon});
      node["amenity"="mosque"](around:${radiusMeters},${lat},${lon});
      way["amenity"="mosque"](around:${radiusMeters},${lat},${lon});
    );
    out center tags;
  `;

  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Overpass status ${response.status}`);
      }

      const json = await response.json();
      if (json && Array.isArray(json.elements)) {
        return json.elements;
      }
    } catch (err) {
      lastError = err;
      // Try next endpoint in loop
    }
  }

  throw lastError || new Error('فشل الاتصال بخوادم خريطة المساجد');
}

export default function MosquesScreen() {
  // Current coordinates
  const [coords, setCoords] = useState(() => {
    try {
      const saved = localStorage.getItem('nisab_user_settings');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.latitude && p.longitude) {
          return { lat: Number(p.latitude), lon: Number(p.longitude) };
        }
      }
    } catch (e) {}
    // Default fallback: Cairo (30.0444, 31.2357)
    return { lat: 30.0444, lon: 31.2357 };
  });

  const [locationName, setLocationName] = useState(() => {
    try {
      const saved = localStorage.getItem('nisab_user_settings');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.city) return `${p.city} (${p.country || ''})`;
      }
    } catch (e) {}
    return 'القاهرة (مصر)';
  });

  // GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Search Radius filter: 1000, 3000, 5000, 10000 meters
  const [radius, setRadius] = useState(3000);

  // Mosque discovery state
  const [mosques, setMosques] = useState([]);
  const [loadingMosques, setLoadingMosques] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [selectedMosqueId, setSelectedMosqueId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Prayer times method
  const [calculationMethod, setCalculationMethod] = useState(() => {
    try {
      const saved = localStorage.getItem('nisab_user_settings');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.calcMethod) return p.calcMethod;
      }
    } catch (e) {}
    return 'Egyptian';
  });

  // Traveler Qasr & Jam' Mode
  const [isTravelerMode, setIsTravelerMode] = useState(true);
  const [travelerInfoOpen, setTravelerInfoOpen] = useState(false);

  // City selection modal
  const [citySelectorOpen, setCitySelectorOpen] = useState(false);

  // Leaflet map refs & tile theme
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const mosqueMarkersMapRef = useRef(new Map());
  const [mapDarkMode, setMapDarkMode] = useState(true);

  // 1. Calculate offline local prayer times using @batoulapps/adhan
  const prayerData = useMemo(() => {
    if (!coords.lat || !coords.lon) return null;

    try {
      const coordinates = new Coordinates(coords.lat, coords.lon);
      let params;
      switch (calculationMethod) {
        case 'UmmAlQura':
          params = CalculationMethod.UmmAlQura();
          break;
        case 'MuslimWorldLeague':
          params = CalculationMethod.MuslimWorldLeague();
          break;
        case 'Dubai':
          params = CalculationMethod.Dubai();
          break;
        case 'Kuwait':
          params = CalculationMethod.Kuwait();
          break;
        case 'Qatar':
          params = CalculationMethod.Qatar();
          break;
        case 'Egyptian':
        default:
          params = CalculationMethod.Egyptian();
          break;
      }

      const now = new Date();
      const pt = new PrayerTimes(coordinates, now, params);

      const nextPName = pt.nextPrayer();
      const nextPTime = pt.timeForPrayer(nextPName);

      return {
        times: {
          fajr: pt.fajr,
          sunrise: pt.sunrise,
          dhuhr: pt.dhuhr,
          asr: pt.asr,
          maghrib: pt.maghrib,
          isha: pt.isha
        },
        next: {
          prayer: nextPName,
          time: nextPTime
        }
      };
    } catch (err) {
      console.error('Prayer calculation error:', err);
      return null;
    }
  }, [coords.lat, coords.lon, calculationMethod]);

  // Next prayer countdown string
  const [countdownText, setCountdownText] = useState('');
  useEffect(() => {
    if (!prayerData?.next?.time) {
      setCountdownText('');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diffMs = prayerData.next.time - now;
      if (diffMs <= 0) {
        setCountdownText('حان الآن موعد الصلاة');
        return;
      }

      const diffSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;

      if (hours > 0) {
        setCountdownText(`متبقي ${hours} ساعة و ${minutes} دقيقة`);
      } else {
        setCountdownText(`متبقي ${minutes} دقيقة و ${seconds} ثانية`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [prayerData]);

  // 2. Fetch Nearby Mosques with caching & offline fallback
  const loadNearbyMosques = useCallback(
    async (lat, lon, rad) => {
      setLoadingMosques(true);
      setFetchError(null);
      setIsOfflineData(false);

      const cacheKey = `${CACHE_KEY_PREFIX}${lat.toFixed(3)}_${lon.toFixed(3)}_${rad}`;

      // Check cache first
      let cachedData = null;
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          cachedData = JSON.parse(stored);
        }
      } catch (e) {}

      try {
        // Query live Overpass API
        const rawElements = await fetchOverpassMosques(lat, lon, rad);

        const parsedMosques = rawElements
          .map((el) => {
            const mLat = el.lat || el.center?.lat;
            const mLon = el.lon || el.center?.lon;
            if (!mLat || !mLon) return null;

            const dist = getHaversineDistance(lat, lon, mLat, mLon);
            const tags = el.tags || {};
            const name =
              tags['name:ar'] ||
              tags.name ||
              tags['name:en'] ||
              tags.description ||
              'مسجد / مصلى (بدون اسم مسجل)';

            return {
              id: `${el.type}_${el.id}`,
              name,
              lat: mLat,
              lon: mLon,
              distance: dist,
              hasWomenSection:
                tags.female === 'yes' ||
                tags.women === 'yes' ||
                tags['female:separated'] === 'yes' ||
                name.includes('نساء') ||
                name.includes('مصلى نساء'),
              hasWheelchair: tags.wheelchair === 'yes',
              street: tags['addr:street'] || tags['addr:full'] || '',
              tags
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.distance - b.distance);

        setMosques(parsedMosques);
        setLoadingMosques(false);

        // Update local cache
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              timestamp: Date.now(),
              mosques: parsedMosques
            })
          );
        } catch (e) {}
      } catch (err) {
        console.warn('Overpass fetch failed, checking offline cache:', err);
        if (cachedData && Array.isArray(cachedData.mosques) && cachedData.mosques.length > 0) {
          setMosques(cachedData.mosques);
          setIsOfflineData(true);
          setLoadingMosques(false);
        } else {
          setFetchError(err.message || 'تعذر تحميل المساجد من الخريطة، يرجى التحقق من الاتصال بالإنترنت.');
          setLoadingMosques(false);
        }
      }
    },
    []
  );

  // Trigger mosque fetch when coordinates or radius change
  useEffect(() => {
    loadNearbyMosques(coords.lat, coords.lon, radius);
  }, [coords.lat, coords.lon, radius, loadNearbyMosques]);

  // 3. User Geolocation Detection ("Locate Me")
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError('خاصية تحديد الموقع غير مدعومة في هذا الجهاز.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLon = position.coords.longitude;
        setCoords({ lat: newLat, lon: newLon });
        setLocationName('موقعي الحالي (GPS)');
        setIsLocating(false);

        // Center map smoothly
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([newLat, newLon], 15, { duration: 1.5 });
        }
      },
      (error) => {
        setIsLocating(false);
        let msg = 'تعذر الحصول على الإحداثيات الدقيقة.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'تم رفض إذن تحديد الموقع. يمكنك اختيار المدينة يدوياً.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'انتهت مهلة البحث عن الموقع الجغرافي.';
        }
        setLocationError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // 4. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lon],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // OpenStreetMap Tiles with Dark CSS Filter (100% Free, No API Key Required)
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        className: 'dark-map-tiles',
        subdomains: 'abc',
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      tileLayerRef.current = tiles;

      // Attribution control at bottom-right
      L.control.attribution({ position: 'bottomright' }).addTo(map);

      // Layer group for mosque pins
      markersLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Dark Mode filter class with tile layer container
  useEffect(() => {
    if (tileLayerRef.current) {
      const container = tileLayerRef.current.getContainer();
      if (container) {
        if (mapDarkMode) {
          container.classList.add('dark-map-tiles');
        } else {
          container.classList.remove('dark-map-tiles');
        }
      }
    }
  }, [mapDarkMode]);

  // 5. Update User Marker and Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Custom user position pulsing beacon
    const userIconHtml = `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: rgba(16, 185, 129, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 18px; height: 18px; border-radius: 9999px; background: #10b981; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.6);"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userIconHtml,
      className: 'user-pin-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([coords.lat, coords.lon]);
    } else {
      userMarkerRef.current = L.marker([coords.lat, coords.lon], {
        icon: userIcon,
        zIndexOffset: 1000
      })
        .bindTooltip('موقعك الحالي', {
          direction: 'top',
          offset: [0, -10],
          className: 'custom-leaflet-tooltip'
        })
        .addTo(map);
    }

    // Radius Circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng([coords.lat, coords.lon]);
      radiusCircleRef.current.setRadius(radius);
    } else {
      radiusCircleRef.current = L.circle([coords.lat, coords.lon], {
        radius,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.06,
        weight: 1.5,
        dashArray: '5, 5'
      }).addTo(map);
    }
  }, [coords.lat, coords.lon, radius]);

  // 6. Render Mosque Markers on Leaflet Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    mosqueMarkersMapRef.current.clear();

    mosques.forEach((m) => {
      const isSelected = selectedMosqueId === m.id;

      // Mosque custom SVG icon with minaret & dome
      const markerHtml = `
        <div style="
          width: ${isSelected ? '38px' : '30px'};
          height: ${isSelected ? '38px' : '30px'};
          border-radius: 9999px;
          background: ${isSelected ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #059669, #047857)'};
          border: 2px solid ${isSelected ? '#fef3c7' : '#34d399'};
          box-shadow: 0 4px 16px ${isSelected ? 'rgba(245, 158, 11, 0.6)' : 'rgba(0,0,0,0.7)'};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          cursor: pointer;
        ">
          <svg style="width: ${isSelected ? '20px' : '16px'}; height: ${isSelected ? '20px' : '16px'}; color: #ffffff;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8m-7 8h14a2 2 0 002-2v-7a2 2 0 00-2-2h-1V6a4 4 0 00-8 0v4H6a2 2 0 00-2 2v7a2 2 0 002 2zM12 6a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'mosque-pin-icon',
        iconSize: [isSelected ? 38 : 30, isSelected ? 38 : 30],
        iconAnchor: [isSelected ? 19 : 15, isSelected ? 19 : 15]
      });

      const marker = L.marker([m.lat, m.lon], {
        icon,
        zIndexOffset: isSelected ? 500 : 100
      });

      // Direction link
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}`;

      // Custom Dark Popup Content
      const popupContent = `
        <div style="font-family: Tajawal, system-ui, sans-serif; text-align: right; direction: rtl; min-width: 200px; padding: 4px;">
          <div style="font-weight: bold; font-size: 14px; color: #f59e0b; margin-bottom: 4px;">${m.name}</div>
          <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 6px;">
            المسافة: <span style="font-weight: bold; color: #34d399;">${formatDistanceArabic(m.distance)}</span>
          </div>
          ${m.hasWomenSection ? '<div style="font-size: 11px; color: #a7f3d0; margin-bottom: 4px;">✓ مصلى للنساء متوفر</div>' : ''}
          ${m.street ? `<div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">${m.street}</div>` : ''}
          <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="
            display: inline-block;
            width: 100%;
            text-align: center;
            background: #059669;
            color: #ffffff;
            font-size: 12px;
            font-weight: bold;
            padding: 6px 10px;
            border-radius: 8px;
            text-decoration: none;
            margin-top: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          ">
            فتح الاتجاهات والملاحة ↗
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'custom-dark-leaflet-popup',
        maxWidth: 280
      });

      marker.on('click', () => {
        setSelectedMosqueId(m.id);
        const cardElem = document.getElementById(`mosque-card-${m.id}`);
        if (cardElem) {
          cardElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      marker.addTo(markersLayer);
      mosqueMarkersMapRef.current.set(m.id, marker);
    });
  }, [mosques, selectedMosqueId]);

  // Center on mosque from card click
  const handleSelectMosque = (m) => {
    setSelectedMosqueId(m.id);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([m.lat, m.lon], 16, { duration: 1.2 });
      const marker = mosqueMarkersMapRef.current.get(m.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  // Recenter map on user location
  const handleRecenterOnUser = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([coords.lat, coords.lon], 15, { duration: 1.2 });
    }
  };

  // Filtered mosques list by search query
  const filteredMosques = useMemo(() => {
    if (!searchQuery.trim()) return mosques;
    const q = searchQuery.trim().toLowerCase();
    return mosques.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.street && m.street.toLowerCase().includes(q))
    );
  }, [mosques, searchQuery]);

  return (
    <div
      dir="rtl"
      className="w-full h-full flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden select-none"
    >
      {/* 1. Header Toolbar */}
      <header className="px-4 sm:px-6 py-3.5 bg-slate-900/90 border-b border-emerald-900/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 border border-amber-500/40 flex items-center justify-center shadow-lg">
            <Compass className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-amber-300 font-serif">
                المساجد القريبة ومواقيت الصلاة
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                دليل المسافر
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{locationName}</span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-mono text-slate-400">
                {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Location & Controls Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Locate Me Button */}
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-600/50 text-emerald-200 text-xs font-semibold transition shadow-sm hover:text-white disabled:opacity-50"
            title="تحديد الموقع الجغرافي الحالي للجهاز"
          >
            {isLocating ? (
              <MiniLoader size="sm" color="white" />
            ) : (
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{isLocating ? 'جاري التحديد...' : 'تحديد موقعي'}</span>
          </button>

          {/* Quick City Selector Dropdown */}
          <button
            onClick={() => setCitySelectorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-emerald-900/60 text-slate-200 hover:text-amber-300 text-xs font-semibold transition"
            title="اختيار مدينة سريعة للمسافر"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>تغيير المدينة</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Search Radius Picker */}
          <div className="flex items-center gap-1 bg-slate-950 border border-emerald-900/70 rounded-xl p-1 text-xs">
            <span className="text-[11px] text-slate-400 px-1.5">النطاق:</span>
            {[1000, 3000, 5000, 10000].map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition ${
                  radius === r
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {r < 1000 ? `${r}م` : `${r / 1000}كم`}
              </button>
            ))}
          </div>

          {/* Traveler Info / Rulings Modal Toggle */}
          <button
            onClick={() => setTravelerInfoOpen(!travelerInfoOpen)}
            className={`p-2 rounded-xl border text-xs transition ${
              travelerInfoOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="أحكام ورخص صلاة المسافر (القصر والجمع)"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Location Error Alert banner if any */}
      {locationError && (
        <div className="bg-rose-950/70 border-b border-rose-800/50 px-4 py-2 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{locationError}</span>
          </div>
          <button
            onClick={() => setLocationError(null)}
            className="text-rose-400 hover:text-white text-xs font-semibold"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* 2. Offline / Local Prayer Times Banner for Travelers */}
      <section className="bg-gradient-to-r from-slate-950 via-emerald-950/40 to-slate-950 border-b border-emerald-900/30 px-4 sm:px-6 py-2.5 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Next prayer highlight */}
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center gap-2 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                الصلاة القادمة:{' '}
                {prayerData?.next?.prayer
                  ? PRAYER_NAMES[prayerData.next.prayer]?.name
                  : '--'}
              </span>
              <span className="text-amber-200/90 font-mono">
                ({formatPrayerTime(prayerData?.next?.time)})
              </span>
            </div>
            {countdownText && (
              <span className="text-xs font-medium text-emerald-400 hidden sm:inline">
                {countdownText}
              </span>
            )}
          </div>

          {/* 5 Daily Prayers schedule cards */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((key) => {
              const meta = PRAYER_NAMES[key];
              const pTime = prayerData?.times?.[key];
              const isNext = prayerData?.next?.prayer === key;
              const Icon = meta.icon;

              return (
                <div
                  key={key}
                  className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-xs transition-all whitespace-nowrap ${
                    isNext
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 font-bold shadow-md shadow-amber-950/50'
                      : 'bg-slate-900/80 border-emerald-900/40 text-slate-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isNext ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{meta.name}:</span>
                  <span className="font-mono text-[11px] text-amber-300">
                    {formatPrayerTime(pTime)}
                  </span>
                  {isTravelerMode && meta.qasr && (
                    <span
                      className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold"
                      title="رخصة القصر للمسافر: ركعتان"
                    >
                      قصر ({meta.qasrRakats})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Main Split View: Mosques Sidebar (Right in RTL) + Interactive Map (Left in RTL) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Sidebar: Mosque List & Search */}
        <aside className="w-full lg:w-[380px] xl:w-[420px] lg:border-l border-emerald-900/50 bg-slate-950/90 flex flex-col h-1/2 lg:h-full shrink-0 z-10">
          {/* Search Box in Sidebar */}
          <div className="p-3 border-b border-emerald-900/40 bg-slate-900/60 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن مسجد بالاسم أو الشارع..."
                className="w-full bg-slate-950 border border-emerald-900/70 rounded-xl pr-9 pl-8 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                تم العثور على{' '}
                <strong className="text-amber-300">{filteredMosques.length}</strong>{' '}
                مسجد ومصلى
              </span>
              {isOfflineData && (
                <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-800/40">
                  <WifiOff className="w-3 h-3" />
                  بيانات محفوظة (Offline)
                </span>
              )}
            </div>
          </div>

          {/* Mosque Cards Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-emerald-800">
            {loadingMosques ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                <MiniLoader size="md" color="amber" />
                <span className="text-xs text-amber-200">
                  جاري البحث عن المساجد والمصليات في نطاق {radius / 1000} كم...
                </span>
              </div>
            ) : fetchError ? (
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                <p className="text-xs text-rose-200 leading-relaxed">{fetchError}</p>
                <button
                  onClick={() => loadNearbyMosques(coords.lat, coords.lon, radius)}
                  className="px-4 py-1.5 rounded-xl bg-rose-800 hover:bg-rose-700 text-white text-xs font-bold transition shadow"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : filteredMosques.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <MapPin className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs">
                  لم يتم العثور على مساجد مسجلة في هذا النطاق ({radius / 1000} كم).
                </p>
                <button
                  onClick={() => setRadius(Math.min(10000, radius + 3000))}
                  className="text-xs text-amber-400 hover:underline font-bold"
                >
                  توسيع نطاق البحث
                </button>
              </div>
            ) : (
              filteredMosques.map((m) => {
                const isSelected = selectedMosqueId === m.id;
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}`;

                return (
                  <div
                    key={m.id}
                    id={`mosque-card-${m.id}`}
                    onClick={() => handleSelectMosque(m)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-emerald-950/70 border-amber-400/90 shadow-xl shadow-emerald-950/80 ring-1 ring-amber-400/50'
                        : 'bg-slate-900/80 hover:bg-slate-900 border-emerald-900/40 hover:border-emerald-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-emerald-900/60 text-emerald-300'
                          }`}
                        >
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-xs sm:text-sm font-bold text-slate-100 font-serif leading-snug">
                            {m.name}
                          </h2>
                          {m.street && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {m.street}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Distance Badge */}
                      <div className="shrink-0 text-left">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold font-mono bg-emerald-950 border border-emerald-700/60 text-emerald-300">
                          {formatDistanceArabic(m.distance)}
                        </span>
                      </div>
                    </div>

                    {/* Features / Amenities Tags */}
                    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      {m.hasWomenSection && (
                        <span className="px-1.5 py-0.5 rounded bg-pink-950/40 text-pink-300 border border-pink-900/50 text-[10px]">
                          مصلى نساء
                        </span>
                      )}
                      {m.hasWheelchair && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-900/50 text-[10px]">
                          مجهز لذوي الإعاقة
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 mr-auto">
                        <Footprints className="w-3 h-3 text-slate-400" />
                        {Math.ceil(m.distance / 80)} دقيقة مشياً
                      </span>
                    </div>

                    {/* Navigation Button */}
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-amber-300/90 font-medium">
                        إقامة الصلاة: ~15-20 دقيقة بعد الأذان
                      </span>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition shadow-sm"
                        title="فتح المسار في خرائط جوجل للملاحة"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>الاتجاهات</span>
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Map Container Area */}
        <section className="flex-1 h-1/2 lg:h-full relative overflow-hidden bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Map Controls Overlay */}
          <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
            <button
              onClick={handleRecenterOnUser}
              className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-emerald-950 border border-emerald-700/60 text-emerald-300 hover:text-white transition shadow-2xl backdrop-blur-md"
              title="إعادة التمركز حول موقعي الحالي"
            >
              <Crosshair className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const map = mapInstanceRef.current;
                if (map) map.zoomIn();
              }}
              className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-emerald-950 border border-emerald-700/60 text-slate-300 hover:text-white transition shadow-2xl backdrop-blur-md"
              title="تكبير الخريطة"
            >
              +
            </button>
            <button
              onClick={() => {
                const map = mapInstanceRef.current;
                if (map) map.zoomOut();
              }}
              className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-emerald-950 border border-emerald-700/60 text-slate-300 hover:text-white transition shadow-2xl backdrop-blur-md"
              title="تصغير الخريطة"
            >
              -
            </button>
            <button
              onClick={() => setMapDarkMode(!mapDarkMode)}
              className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-emerald-950 border border-emerald-700/60 text-slate-300 hover:text-amber-300 transition shadow-2xl backdrop-blur-md"
              title={mapDarkMode ? 'التبديل إلى ألوان الخريطة العادية' : 'التبديل إلى النمط الداكن'}
            >
              {mapDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>

          {/* Map Legend Pill */}
          <div className="absolute bottom-4 left-4 z-[400] hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-slate-950/85 border border-emerald-900/60 backdrop-blur-md text-[11px] text-slate-300 shadow-xl">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              <span>موقعك</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
              <span>مسجد / مصلى</span>
            </div>
          </div>
        </section>
      </div>

      {/* 4. Quick Traveler Cities Modal */}
      <AnimatePresence>
        {citySelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/40 p-5 shadow-2xl text-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold font-serif">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  <span>اختر مدينة المسافر</span>
                </div>
                <button
                  onClick={() => setCitySelectorOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                اختر وجهتك الحالية لحساب مواقيت الصلاة فورياً والبحث عن المساجد المحيطة:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-emerald-800">
                {TRAVELER_PRESET_CITIES.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setCoords({ lat: c.lat, lon: c.lon });
                      setLocationName(`${c.name} (${c.country})`);
                      setCalculationMethod(c.method);
                      setCitySelectorOpen(false);

                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([c.lat, c.lon], 14, { duration: 1.5 });
                      }
                    }}
                    className="p-2.5 rounded-2xl bg-slate-950/80 hover:bg-emerald-950/80 border border-emerald-900/60 hover:border-amber-400 text-right transition flex flex-col gap-0.5"
                  >
                    <span className="text-xs font-bold text-slate-100">{c.name}</span>
                    <span className="text-[10px] text-emerald-400">{c.country}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Traveler Rulings & Qasr Guide Modal */}
      <AnimatePresence>
        {travelerInfoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-slate-900 border border-emerald-700/60 p-5 shadow-2xl text-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold font-serif">
                  <Info className="w-5 h-5 text-emerald-400" />
                  <span>رخص وأحكام صلاة المسافر</span>
                </div>
                <button
                  onClick={() => setTravelerInfoOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-200">
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40">
                  <h3 className="font-bold text-amber-300 mb-1">١. رخصة القصر:</h3>
                  <p>
                    تُقصر الصلاة الرباعية (الظهر، العصر، العشاء) إلى <strong>ركعتين</strong>. أما
                    الفجر والمغرب فلا قصر فيهما.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40">
                  <h3 className="font-bold text-amber-300 mb-1">٢. رخصة الجمع:</h3>
                  <p>
                    يجوز للمسافر الجمع بين <strong>الظهر والعصر</strong>، وبين{' '}
                    <strong>المغرب والعشاء</strong>، جمع تقديم في وقت الأولى أو جمع تأخير في وقت
                    الثانية حسب الأيسر له.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40">
                  <h3 className="font-bold text-amber-300 mb-1">٣. الصلاة خلف المقيم:</h3>
                  <p>
                    إذا صلى المسافر خلف إمام مقيم في المسجد، فإنه يُتم أربع ركعات تبعاً لإمامه.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setTravelerInfoOpen(false)}
                  className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition shadow"
                >
                  فهمت ذلك، تقبل الله
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
