/**
 * Arabic Text Normalization Utility for Nisab
 * 
 * Handles all Arabic diacritics (Tashkeel), Quranic pause marks,
 * dagger alifs, tatweel (kashida), zero-width characters, and unifies
 * Alif, Taa Marbuta, Alif Maqsura, and Hamza variations.
 */

// Regex for Tashkeel (Harakat, Tanween, Shaddah, Sukun, Dagger Alif)
const TASHKEEL_REGEX = /[\u064B-\u065F\u0670]/g;

// Regex for Quranic annotation marks (Waqf, Sajdah, Rub-el-Hizb, small signs)
const QURANIC_MARKS_REGEX = /[\u06D6-\u06ED\u0610-\u061A]/g;

// Regex for Tatweel (Kashida: ـ)
const TATWEEL_REGEX = /\u0640/g;

// Regex for invisible zero-width and BOM characters (e.g. \uFEFF found in Quran text)
const INVISIBLE_CHARS_REGEX = /[\uFEFF\u200B-\u200D\u2060\u00A0]/g;

// Regex for unifying all Alif variants (أ, إ, آ, ٱ -> ا)
const ALIF_VARIANTS_REGEX = /[\u0622\u0623\u0625\u0671]/g;

// Regex for Taa Marbuta (ة -> ه)
const TAA_MARBUTA_REGEX = /\u0629/g;

// Regex for Alif Maqsura (ى -> ي)
const ALIF_MAQSURA_REGEX = /\u0649/g;

// Regex for Hamza on Waw (ؤ -> و) and Hamza on Nabrah/Yaa (ئ -> ي)
const WAW_HAMZA_REGEX = /\u0624/g;
const YAA_HAMZA_REGEX = /\u0626/g;

/**
 * Normalizes an Arabic string for flexible, diacritic-insensitive search.
 * @param {string} text - Raw Arabic text (with Tashkeel or colloquial variants)
 * @returns {string} Normalized string suitable for indexing and querying
 */
function normalizeArabic(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    // 1. Remove BOM and zero-width artifacts
    .replace(INVISIBLE_CHARS_REGEX, '')
    // 2. Remove all Tashkeel / Harakat
    .replace(TASHKEEL_REGEX, '')
    // 3. Remove Quranic recitation & stop marks
    .replace(QURANIC_MARKS_REGEX, '')
    // 4. Remove Tatweel / Kashida
    .replace(TATWEEL_REGEX, '')
    // 5. Unify all Alif forms (أ, إ, آ, ٱ) into bare Alif (ا)
    .replace(ALIF_VARIANTS_REGEX, '\u0627')
    // 6. Normalize Taa Marbuta (ة) to Haa (ه)
    .replace(TAA_MARBUTA_REGEX, '\u0647')
    // 7. Normalize Alif Maqsura (ى) to Yaa (ي)
    .replace(ALIF_MAQSURA_REGEX, '\u064A')
    // 8. Normalize Hamza variants
    .replace(WAW_HAMZA_REGEX, '\u0648')
    .replace(YAA_HAMZA_REGEX, '\u064A')
    // 9. Normalize multiple whitespaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes a single character without trimming whitespace
 */
function normalizeChar(ch) {
  return ch
    .replace(/[\uFEFF\u200B-\u200D\u2060\u00A0]/g, '')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A\u0640]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A');
}

/**
 * Finds all exact character ranges in originalText matching query
 * Preserves original diacritics and sacred typography while matching normalized queries.
 * @param {string} originalText - The full Arabic text (with Tashkeel)
 * @param {string} query - The search query (typed without Tashkeel)
 * @returns {Array<{start: number, end: number}>} Array of range slices in originalText
 */
function findArabicMatches(originalText, query) {
  if (!originalText || !query) return [];
  const normQuery = normalizeArabic(query).trim();
  if (!normQuery) return [];

  const normChars = [];
  const normToOrigMap = [];

  for (let i = 0; i < originalText.length; i++) {
    const ch = originalText[i];
    const n = normalizeChar(ch);
    if (n.length > 0) {
      for (let j = 0; j < n.length; j++) {
        normChars.push(n[j]);
        normToOrigMap.push(i);
      }
    }
  }

  const normString = normChars.join('');
  const ranges = [];
  let startIndex = 0;

  while (true) {
    const foundIndex = normString.indexOf(normQuery, startIndex);
    if (foundIndex === -1) break;

    const origStart = normToOrigMap[foundIndex];
    const lastNormCharIndex = foundIndex + normQuery.length - 1;
    let origEnd = normToOrigMap[lastNormCharIndex] + 1;

    // Extend to capture any attached trailing diacritics
    while (origEnd < originalText.length && normalizeChar(originalText[origEnd]) === '') {
      origEnd++;
    }

    ranges.push({ start: origStart, end: origEnd });
    startIndex = foundIndex + normQuery.length;
  }

  return ranges;
}

/**
 * Checks if target Arabic text contains the search query (diacritic-agnostic).
 * @param {string} target - The text being searched (e.g., Ayah or Hadith)
 * @param {string} query - The user search query
 * @returns {boolean}
 */
function arabicIncludes(target, query) {
  if (!target || !query) return false;
  return normalizeArabic(target).includes(normalizeArabic(query));
}

module.exports = {
  normalizeArabic,
  findArabicMatches,
  arabicIncludes,
  TASHKEEL_REGEX,
  QURANIC_MARKS_REGEX,
  TATWEEL_REGEX,
  INVISIBLE_CHARS_REGEX,
  ALIF_VARIANTS_REGEX,
  TAA_MARBUTA_REGEX,
  ALIF_MAQSURA_REGEX
};
