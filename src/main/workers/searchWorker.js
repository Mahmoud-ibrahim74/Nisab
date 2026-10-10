const { parentPort } = require('node:worker_threads');
const fs = require('node:fs');
const path = require('node:path');
const { normalizeArabic } = require('../../utils/arabicNormalizer');

// In-memory cache for parsed JSON data inside worker
const cache = {
  quranArabic: null,
  suras: null,
  hadiths: new Map() // bookFilename -> parsed JSON
};

/**
 * Loads Quran data into worker cache if not already loaded
 */
function getQuranData(resourcesDir) {
  if (!cache.quranArabic) {
    const quranPath = path.join(resourcesDir, 'Quran', 'quran_Arabic.json');
    const content = fs.readFileSync(quranPath, 'utf8');
    cache.quranArabic = JSON.parse(content);
  }
  return cache.quranArabic;
}

/**
 * Searches the Holy Quran for matches
 */
function searchQuran(resourcesDir, query, options = {}) {
  const normQuery = normalizeArabic(query);
  if (!normQuery) return [];

  const quran = getQuranData(resourcesDir);
  const results = [];
  const limit = options.limit || 50;

  for (const surah of quran.data.surahs) {
    for (const ayah of surah.ayahs) {
      const normText = normalizeArabic(ayah.text);
      if (normText.includes(normQuery)) {
        results.push({
          type: 'quran',
          surahNumber: surah.number,
          surahName: surah.name,
          surahEnglishName: surah.englishName,
          ayahNumber: ayah.number,
          ayahNumberInSurah: ayah.numberInSurah,
          juz: ayah.juz,
          page: ayah.page,
          text: ayah.text
        });

        if (results.length >= limit) {
          return results;
        }
      }
    }
  }

  return results;
}

/**
 * Searches Hadith collections
 */
function searchHadith(resourcesDir, query, options = {}) {
  const normQuery = normalizeArabic(query);
  if (!normQuery) return [];

  const hadithsDir = path.join(resourcesDir, 'Hadiths');
  const targetBooks = options.books || [
    'bukhari.json',
    'muslim.json',
    'abudawud.json',
    'tirmidhi.json',
    'nasai.json',
    'ibnmajah.json'
  ];

  const results = [];
  const limit = options.limit || 50;

  for (const bookFile of targetBooks) {
    let bookData = cache.hadiths.get(bookFile);
    if (!bookData) {
      const filePath = path.join(hadithsDir, bookFile);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        bookData = JSON.parse(fileContent);
        cache.hadiths.set(bookFile, bookData);
      }
    }

    if (!bookData || !bookData.hadiths) continue;

    const bookTitle = bookData.metadata?.arabic?.title || bookFile.replace('.json', '');

    for (const hadith of bookData.hadiths) {
      if (!hadith.arabic) continue;
      const normHadith = normalizeArabic(hadith.arabic);

      if (normHadith.includes(normQuery)) {
        results.push({
          type: 'hadith',
          bookTitle,
          bookFilename: bookFile,
          hadithId: hadith.id,
          idInBook: hadith.idInBook,
          chapterId: hadith.chapterId,
          arabic: hadith.arabic,
          english: hadith.english || null
        });

        if (results.length >= limit) {
          return results;
        }
      }
    }
  }

  return results;
}

// Worker message dispatcher
parentPort.on('message', ({ id, action, resourcesDir, query, options }) => {
  try {
    let results = [];
    if (action === 'searchQuran') {
      results = searchQuran(resourcesDir, query, options);
    } else if (action === 'searchHadith') {
      results = searchHadith(resourcesDir, query, options);
    }
    parentPort.postMessage({ id, success: true, results });
  } catch (error) {
    parentPort.postMessage({ id, success: false, error: error.message });
  }
});
