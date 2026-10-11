/**
 * Zakat Calculation Engine (محرك الحسابات الفقهية الشامل للزكاة)
 * Islamic Jurisprudence & Financial Rules Engine
 * 
 * Complies with consensus of contemporary Fiqh Academies (مجمع الفقه الإسلامي)
 * and Dar Al-Iftaa guidelines.
 */

// Official Fiqh Constants
export const FIQH_CONSTANTS = {
  GOLD_NISAB_GRAMS: 85,          // نصاب الذهب: 85 جراماً من الذهب الخالص عيار 24
  SILVER_NISAB_GRAMS: 595,       // نصاب الفضة: 595 جراماً من الفضة الخالصة
  ZAKAT_RATE_HIJRI: 0.025,       // نسبة الزكاة للحول الهجري (2.5% = ربع العشر)
  ZAKAT_RATE_GREGORIAN: 0.02577, // نسبة الزكاة للحول الميلادي (2.577% لاحتساب فارق الـ 11 يوماً)
  FITR_SA_KG_PER_PERSON: 2.5,    // صاع زكاة الفطر النبوي الشريف (~2.5 كجم من غالب قوت البلد)
};

// Supported Currencies
export const SUPPORTED_CURRENCIES = [
  { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري', defaultGold24: 4100, defaultSilver: 50 },
  { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي', defaultGold24: 325, defaultSilver: 4.1 },
  { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي', defaultGold24: 318, defaultSilver: 4.0 },
  { code: 'KWD', symbol: 'د.ك', name: 'دينار كويتي', defaultGold24: 26.5, defaultSilver: 0.35 },
  { code: 'QAR', symbol: 'ر.ق', name: 'ريال قطري', defaultGold24: 315, defaultSilver: 3.9 },
  { code: 'USD', symbol: '$', name: 'دولار أمريكي', defaultGold24: 86.5, defaultSilver: 1.08 },
  { code: 'EUR', symbol: '€', name: 'يورو', defaultGold24: 80.0, defaultSilver: 0.99 },
];

/**
 * Calculates derived gold prices for various karats based on 24K price
 */
export function getDerivedGoldPrices(goldPrice24) {
  const p24 = Number(goldPrice24) || 0;
  return {
    price24: p24,
    price22: p24 * (22 / 24),
    price21: p24 * (21 / 24),
    price18: p24 * (18 / 24),
  };
}

/**
 * Normalizes multi-karat gold weights into pure 24K grams equivalent:
 * pureGold = w24 + (w22 * 22/24) + (w21 * 21/24) + (w18 * 18/24)
 */
export function normalizeGoldTo24K({ w24 = 0, w22 = 0, w21 = 0, w18 = 0 }) {
  const g24 = Number(w24) || 0;
  const g22 = Number(w22) || 0;
  const g21 = Number(w21) || 0;
  const g18 = Number(w18) || 0;

  const totalRawWeight = g24 + g22 + g21 + g18;
  const pureGoldGrams = g24 + (g22 * (22 / 24)) + (g21 * (21 / 24)) + (g18 * (18 / 24));

  return {
    totalRawWeight,
    pureGoldGrams: Number(pureGoldGrams.toFixed(3)),
  };
}

/**
 * Module A: Calculates Zakat Al-Mal & Trade Goods (زكاة المال وعروض التجارة)
 */
export function calculateZakatMal({
  cash = 0,
  tradeGoods = 0,
  receivables = 0,
  investments = 0,
  debts = 0,
  nisabStandard = 'gold', // 'gold' | 'silver'
  calendarType = 'hijri', // 'hijri' (2.5%) | 'gregorian' (2.577%)
  goldPrice24 = 0,
  silverPrice = 0,
}) {
  const safeCash = Math.max(0, Number(cash) || 0);
  const safeTrade = Math.max(0, Number(tradeGoods) || 0);
  const safeReceivables = Math.max(0, Number(receivables) || 0);
  const safeInvestments = Math.max(0, Number(investments) || 0);
  const safeDebts = Math.max(0, Number(debts) || 0);

  const totalAssets = safeCash + safeTrade + safeReceivables + safeInvestments;
  const netZakatableWealth = Math.max(0, totalAssets - safeDebts);

  // Determine Nisab Threshold in money
  const nisabGrams = nisabStandard === 'silver' 
    ? FIQH_CONSTANTS.SILVER_NISAB_GRAMS 
    : FIQH_CONSTANTS.GOLD_NISAB_GRAMS;

  const unitPrice = nisabStandard === 'silver' ? (Number(silverPrice) || 0) : (Number(goldPrice24) || 0);
  const nisabThreshold = nisabGrams * unitPrice;

  // Rate based on calendar
  const rate = calendarType === 'gregorian' 
    ? FIQH_CONSTANTS.ZAKAT_RATE_GREGORIAN 
    : FIQH_CONSTANTS.ZAKAT_RATE_HIJRI;

  const isNisabReached = nisabThreshold > 0 && netZakatableWealth >= nisabThreshold;
  const nisabPercentage = nisabThreshold > 0 ? (netZakatableWealth / nisabThreshold) * 100 : 0;
  const zakatDue = isNisabReached ? netZakatableWealth * rate : 0;

  return {
    totalAssets,
    debts: safeDebts,
    netZakatableWealth,
    nisabStandard,
    nisabGrams,
    unitPrice,
    nisabThreshold,
    isNisabReached,
    nisabPercentage: Math.min(100, Number(nisabPercentage.toFixed(1))),
    actualRatio: Number(nisabPercentage.toFixed(1)),
    calendarType,
    rate,
    ratePercentageText: calendarType === 'gregorian' ? '2.577%' : '2.5%',
    zakatDue: Number(zakatDue.toFixed(2)),
  };
}

/**
 * Module B: Calculates Zakat on Gold & Silver (زكاة الذهب والفضة)
 */
export function calculateZakatGoldSilver({
  goldWeights = { w24: 0, w22: 0, w21: 0, w18: 0 },
  silverWeight = 0,
  combineWithCash = false,
  extraCash = 0,
  debts = 0,
  goldPrice24 = 0,
  silverPrice = 0,
  calendarType = 'hijri',
}) {
  const { totalRawWeight, pureGoldGrams } = normalizeGoldTo24K(goldWeights);
  const safeSilverGrams = Math.max(0, Number(silverWeight) || 0);
  const safeExtraCash = Math.max(0, Number(extraCash) || 0);
  const safeDebts = Math.max(0, Number(debts) || 0);

  const price24 = Number(goldPrice24) || 0;
  const priceSilver = Number(silverPrice) || 0;

  const rate = calendarType === 'gregorian' 
    ? FIQH_CONSTANTS.ZAKAT_RATE_GREGORIAN 
    : FIQH_CONSTANTS.ZAKAT_RATE_HIJRI;

  // 1. Gold Alone calculation
  const goldTotalValue = pureGoldGrams * price24;
  const isGoldNisabReachedAlone = pureGoldGrams >= FIQH_CONSTANTS.GOLD_NISAB_GRAMS;

  let isGoldZakatable = isGoldNisabReachedAlone;
  let goldZakatableValue = goldTotalValue;

  // 2. Combining Gold with Cash if selected
  let combinedTotalWealth = goldTotalValue;
  let goldNisabThresholdMoney = FIQH_CONSTANTS.GOLD_NISAB_GRAMS * price24;

  if (combineWithCash) {
    combinedTotalWealth = Math.max(0, goldTotalValue + safeExtraCash - safeDebts);
    isGoldZakatable = goldNisabThresholdMoney > 0 && combinedTotalWealth >= goldNisabThresholdMoney;
    goldZakatableValue = combinedTotalWealth;
  }

  const goldZakatCashDue = isGoldZakatable ? goldZakatableValue * rate : 0;
  const goldZakatGramsDue = isGoldNisabReachedAlone ? pureGoldGrams * rate : 0;

  // 3. Silver calculation
  const isSilverNisabReached = safeSilverGrams >= FIQH_CONSTANTS.SILVER_NISAB_GRAMS;
  const silverTotalValue = safeSilverGrams * priceSilver;
  const silverZakatGramsDue = isSilverNisabReached ? safeSilverGrams * rate : 0;
  const silverZakatCashDue = isSilverNisabReached ? silverTotalValue * rate : 0;

  const totalZakatCashDue = goldZakatCashDue + silverZakatCashDue;

  return {
    totalRawWeight,
    pureGoldGrams,
    goldTotalValue,
    isGoldNisabReachedAlone,
    combineWithCash,
    combinedTotalWealth,
    goldNisabThresholdMoney,
    isGoldZakatable,
    goldZakatCashDue: Number(goldZakatCashDue.toFixed(2)),
    goldZakatGramsDue: Number(goldZakatGramsDue.toFixed(3)),
    // Silver
    silverGrams: safeSilverGrams,
    silverTotalValue,
    isSilverNisabReached,
    silverZakatGramsDue: Number(silverZakatGramsDue.toFixed(3)),
    silverZakatCashDue: Number(silverZakatCashDue.toFixed(2)),
    // Aggregate
    totalZakatCashDue: Number(totalZakatCashDue.toFixed(2)),
    rate,
    ratePercentageText: calendarType === 'gregorian' ? '2.577%' : '2.5%',
  };
}

/**
 * Module C: Calculates Zakat Al-Fitr (زكاة الفطر)
 */
export function calculateZakatFitr({
  familyMembers = 1,
  mode = 'cash', // 'cash' | 'grain'
  valuePerPerson = 35, // in local currency
}) {
  const members = Math.max(1, parseInt(familyMembers, 10) || 1);
  const valPerPerson = Math.max(0, Number(valuePerPerson) || 0);

  const totalCashDue = members * valPerPerson;
  const totalKgDue = members * FIQH_CONSTANTS.FITR_SA_KG_PER_PERSON;

  // Common staple foods in the Islamic world
  const grainBreakdown = [
    { name: 'أرز فاخر (Rice)', kg: totalKgDue, note: 'غالب قوت البلد في معظم الدول العربية' },
    { name: 'قمح / دقيق (Wheat / Flour)', kg: totalKgDue, note: 'الأصل المنصوص عليه في السنة النبوية' },
    { name: 'تمر (Dates)', kg: totalKgDue, note: 'من الأصناف المنصوص عليها في الحديث الشريف' },
    { name: 'زبيب (Raisins)', kg: totalKgDue, note: 'صنف منصوص عليه شرعاً' },
  ];

  return {
    familyMembers: members,
    mode,
    valuePerPerson: valPerPerson,
    totalCashDue: Number(totalCashDue.toFixed(2)),
    totalKgDue: Number(totalKgDue.toFixed(1)),
    grainBreakdown,
  };
}

/**
 * Storage helpers for Zakat calculations history log
 */
const STORAGE_KEY_LOG = 'nisab_zakat_history_v1';
const STORAGE_KEY_SETTINGS = 'nisab_zakat_settings_v1';

export function loadSavedZakatSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load zakat settings:', e);
  }
  return {
    currencyCode: 'EGP',
    goldPrice24: 4100,
    silverPrice: 50,
    calendarType: 'hijri',
    nisabStandard: 'gold',
  };
}

export function saveZakatSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save zakat settings:', e);
  }
}

export function loadZakatHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load zakat history:', e);
  }
  return [];
}

export function saveZakatHistoryEntry(entry) {
  try {
    const history = loadZakatHistory();
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      dateFormatted: new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full' }).format(new Date()),
      ...entry,
    };
    const updated = [newEntry, ...history];
    localStorage.setItem(STORAGE_KEY_LOG, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save zakat entry:', e);
    return [];
  }
}

export function deleteZakatHistoryEntry(id) {
  try {
    const history = loadZakatHistory();
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY_LOG, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete zakat entry:', e);
    return [];
  }
}
