/**
 * Quran Khatmah Metadata & Utility Constants
 * Standard 604-page Madani Mushaf / 30 Juz / 6236 Ayahs
 */

export const QURAN_TOTAL_PAGES = 604;
export const QURAN_TOTAL_AYAHS = 6236;
export const QURAN_TOTAL_JUZ = 30;
export const QURAN_TOTAL_HIZB = 60;

// Standard Duration Presets
export const KHATMAH_PRESETS = [
  { days: 7, label: 'أسبوع (7 أيام)', badge: 'مكثفة', desc: 'مناسبة للأوقات الفاضلة كرمضان والعشر الأواخر' },
  { days: 15, label: 'نصف شهر (15 يوماً)', badge: 'سريعة', desc: 'ورد متوازن لمن لديه وقت إضافي يومياً' },
  { days: 30, label: 'شهر كامل (30 يوماً)', badge: 'الختمة الذهبية', desc: 'الختمة المعتدلة الشائعة (جزء واحد يومياً)' },
  { days: 60, label: 'شهران (60 يوماً)', badge: 'ميسرة', desc: 'نصف جزء يومياً للتدبر والتأمل المتمهل' }
];

// The Authentic 30 Juz Metadata Table
export const JUZ_METADATA = [
  {
    juz: 1,
    name: 'الجزء الأول',
    startPage: 1,
    endPage: 21,
    startSurah: 1,
    startSurahName: 'الفاتحة',
    startAyah: 1,
    endSurah: 2,
    endSurahName: 'البقرة',
    endAyah: 141,
    firstText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
  },
  {
    juz: 2,
    name: 'الجزء الثاني',
    startPage: 22,
    endPage: 41,
    startSurah: 2,
    startSurahName: 'البقرة',
    startAyah: 142,
    endSurah: 2,
    endSurahName: 'البقرة',
    endAyah: 252,
    firstText: '۞ سَيَقُولُ السُّفَهَاءُ مِنَ النَّاسِ'
  },
  {
    juz: 3,
    name: 'الجزء الثالث',
    startPage: 42,
    endPage: 61,
    startSurah: 2,
    startSurahName: 'البقرة',
    startAyah: 253,
    endSurah: 3,
    endSurahName: 'آل عمران',
    endAyah: 92,
    firstText: '۞ تِلْكَ الرُّسُلُ فَضَّلْنَا بَعْضَهُمْ'
  },
  {
    juz: 4,
    name: 'الجزء الرابع',
    startPage: 62,
    endPage: 81,
    startSurah: 3,
    startSurahName: 'آل عمران',
    startAyah: 93,
    endSurah: 4,
    endSurahName: 'النساء',
    endAyah: 23,
    firstText: '۞ كُلُّ الطَّعَامِ كَانَ حِلًّا لِبَنِي'
  },
  {
    juz: 5,
    name: 'الجزء الخامس',
    startPage: 82,
    endPage: 101,
    startSurah: 4,
    startSurahName: 'النساء',
    startAyah: 24,
    endSurah: 4,
    endSurahName: 'النساء',
    endAyah: 147,
    firstText: '۞ وَالْمُحْصَنَاتُ مِنَ النِّسَاءِ'
  },
  {
    juz: 6,
    name: 'الجزء السادس',
    startPage: 102,
    endPage: 121,
    startSurah: 4,
    startSurahName: 'النساء',
    startAyah: 148,
    endSurah: 5,
    endSurahName: 'المائدة',
    endAyah: 81,
    firstText: '۞ لَا يُحِبُّ اللَّهُ الْجَهْرَ بِالسُّوءِ'
  },
  {
    juz: 7,
    name: 'الجزء السابع',
    startPage: 122,
    endPage: 141,
    startSurah: 5,
    startSurahName: 'المائدة',
    startAyah: 82,
    endSurah: 6,
    endSurahName: 'الأنعام',
    endAyah: 110,
    firstText: '۞ لَتَجِدَنَّ أَشَدَّ النَّاسِ عَدَاوَةً'
  },
  {
    juz: 8,
    name: 'الجزء الثامن',
    startPage: 142,
    endPage: 161,
    startSurah: 6,
    startSurahName: 'الأنعام',
    startAyah: 111,
    endSurah: 7,
    endSurahName: 'الأعراف',
    endAyah: 87,
    firstText: '۞ وَلَوْ أَنَّنَا نَزَّلْنَا إِلَيْهِمُ'
  },
  {
    juz: 9,
    name: 'الجزء التاسع',
    startPage: 162,
    endPage: 181,
    startSurah: 7,
    startSurahName: 'الأعراف',
    startAyah: 88,
    endSurah: 8,
    endSurahName: 'الأنفال',
    endAyah: 40,
    firstText: '۞ قَالَ الْمَلَأُ الَّذِينَ اسْتَكْبَرُوا'
  },
  {
    juz: 10,
    name: 'الجزء العاشر',
    startPage: 182,
    endPage: 201,
    startSurah: 8,
    startSurahName: 'الأنفال',
    startAyah: 41,
    endSurah: 9,
    endSurahName: 'التوبة',
    endAyah: 92,
    firstText: '۞ وَاعْلَمُوا أَنَّمَا غَنِمْتُمْ مِنْ'
  },
  {
    juz: 11,
    name: 'الجزء الحادي عشر',
    startPage: 202,
    endPage: 221,
    startSurah: 9,
    startSurahName: 'التوبة',
    startAyah: 93,
    endSurah: 11,
    endSurahName: 'هود',
    endAyah: 5,
    firstText: '۞ إِنَّمَا السَّبِيلُ عَلَى الَّذِينَ'
  },
  {
    juz: 12,
    name: 'الجزء الثاني عشر',
    startPage: 222,
    endPage: 241,
    startSurah: 11,
    startSurahName: 'هود',
    startAyah: 6,
    endSurah: 12,
    endSurahName: 'يوسف',
    endAyah: 52,
    firstText: '۞ وَمَا مِنْ دَابَّةٍ فِي الْأَرْضِ إِلَّا'
  },
  {
    juz: 13,
    name: 'الجزء الثالث عشر',
    startPage: 242,
    endPage: 261,
    startSurah: 12,
    startSurahName: 'يوسف',
    startAyah: 53,
    endSurah: 14,
    endSurahName: 'إبراهيم',
    endAyah: 52,
    firstText: '۞ وَمَا أُبَرِّئُ نَفْسِي ۚ إِنَّ النَّفْسَ'
  },
  {
    juz: 14,
    name: 'الجزء الرابع عشر',
    startPage: 262,
    endPage: 281,
    startSurah: 15,
    startSurahName: 'الحجر',
    startAyah: 1,
    endSurah: 16,
    endSurahName: 'النحل',
    endAyah: 128,
    firstText: 'الر ۚ تِلْكَ آيَاتُ الْكِتَابِ'
  },
  {
    juz: 15,
    name: 'الجزء الخامس عشر',
    startPage: 282,
    endPage: 301,
    startSurah: 17,
    startSurahName: 'الإسراء',
    startAyah: 1,
    endSurah: 18,
    endSurahName: 'الكهف',
    endAyah: 74,
    firstText: 'سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ'
  },
  {
    juz: 16,
    name: 'الجزء السادس عشر',
    startPage: 302,
    endPage: 321,
    startSurah: 18,
    startSurahName: 'الكهف',
    startAyah: 75,
    endSurah: 20,
    endSurahName: 'طه',
    endAyah: 135,
    firstText: '۞ قَالَ أَلَمْ أَقُلْ لَكَ إِنَّكَ لَنْ'
  },
  {
    juz: 17,
    name: 'الجزء السابع عشر',
    startPage: 322,
    endPage: 341,
    startSurah: 21,
    startSurahName: 'الأنبياء',
    startAyah: 1,
    endSurah: 22,
    endSurahName: 'الحج',
    endAyah: 78,
    firstText: 'اقْتَرَبَ لِلنَّاسِ حِسَابُهُمْ'
  },
  {
    juz: 18,
    name: 'الجزء الثامن عشر',
    startPage: 342,
    endPage: 361,
    startSurah: 23,
    startSurahName: 'المؤمنون',
    startAyah: 1,
    endSurah: 25,
    endSurahName: 'الفرقان',
    endAyah: 20,
    firstText: 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ'
  },
  {
    juz: 19,
    name: 'الجزء التاسع عشر',
    startPage: 362,
    endPage: 381,
    startSurah: 25,
    startSurahName: 'الفرقان',
    startAyah: 21,
    endSurah: 27,
    endSurahName: 'النمل',
    endAyah: 55,
    firstText: '۞ وَقَالَ الَّذِينَ لَا يَرْجُونَ لِقَاءَنَا'
  },
  {
    juz: 20,
    name: 'الجزء العشرون',
    startPage: 382,
    endPage: 401,
    startSurah: 27,
    startSurahName: 'النمل',
    startAyah: 56,
    endSurah: 29,
    endSurahName: 'العنكبوت',
    endAyah: 45,
    firstText: '۞ فَمَا كَانَ جَوَابَ قَوْمِهِ إِلَّا'
  },
  {
    juz: 21,
    name: 'الجزء الحادي والعشرون',
    startPage: 402,
    endPage: 421,
    startSurah: 29,
    startSurahName: 'العنكبوت',
    startAyah: 46,
    endSurah: 33,
    endSurahName: 'الأحزاب',
    endAyah: 30,
    firstText: '۞ وَلَا تُجَادِلُوا أَهْلَ الْكِتَابِ'
  },
  {
    juz: 22,
    name: 'الجزء الثاني والعشرون',
    startPage: 422,
    endPage: 441,
    startSurah: 33,
    startSurahName: 'الأحزاب',
    startAyah: 31,
    endSurah: 36,
    endSurahName: 'يس',
    endAyah: 27,
    firstText: '۞ وَمَنْ يَقْنُتْ مِنْكُنَّ لِلَّهِ'
  },
  {
    juz: 23,
    name: 'الجزء الثالث والعشرون',
    startPage: 442,
    endPage: 461,
    startSurah: 36,
    startSurahName: 'يس',
    startAyah: 28,
    endSurah: 39,
    endSurahName: 'الزمر',
    endAyah: 31,
    firstText: '۞ وَمَا أَنْزَلْنَا عَلَىٰ قَوْمِهِ مِنْ'
  },
  {
    juz: 24,
    name: 'الجزء الرابع والعشرون',
    startPage: 462,
    endPage: 481,
    startSurah: 39,
    startSurahName: 'الزمر',
    startAyah: 32,
    endSurah: 41,
    endSurahName: 'فصلت',
    endAyah: 46,
    firstText: '۞ فَمَنْ أَظْلَمُ مِمَّنْ كَذَبَ عَلَى'
  },
  {
    juz: 25,
    name: 'الجزء الخامس والعشرون',
    startPage: 482,
    endPage: 501,
    startSurah: 41,
    startSurahName: 'فصلت',
    startAyah: 47,
    endSurah: 45,
    endSurahName: 'الجاثية',
    endAyah: 37,
    firstText: '۞ إِلَيْهِ يُرَدُّ عِلْمُ السَّاعَةِ'
  },
  {
    juz: 26,
    name: 'الجزء السادس والعشرون',
    startPage: 502,
    endPage: 521,
    startSurah: 46,
    startSurahName: 'الأحقاف',
    startAyah: 1,
    endSurah: 51,
    endSurahName: 'الذاريات',
    endAyah: 30,
    firstText: 'حم ۚ تَنْزِيلُ الْكِتَابِ مِنَ اللَّهِ'
  },
  {
    juz: 27,
    name: 'الجزء السابع والعشرون',
    startPage: 522,
    endPage: 541,
    startSurah: 51,
    startSurahName: 'الذاريات',
    startAyah: 31,
    endSurah: 57,
    endSurahName: 'الحديد',
    endAyah: 29,
    firstText: '۞ قَالَ فَمَا خَطْبُكُمْ أَيُّهَا الْمُرْسَلُونَ'
  },
  {
    juz: 28,
    name: 'الجزء الثامن والعشرون',
    startPage: 542,
    endPage: 561,
    startSurah: 58,
    startSurahName: 'المجادلة',
    startAyah: 1,
    endSurah: 66,
    endSurahName: 'التحريم',
    endAyah: 12,
    firstText: 'قَدْ سَمِعَ اللَّهُ قَوْلَ الَّتِي'
  },
  {
    juz: 29,
    name: 'الجزء التاسع والعشرون',
    startPage: 562,
    endPage: 581,
    startSurah: 67,
    startSurahName: 'الملك',
    startAyah: 1,
    endSurah: 77,
    endSurahName: 'المرسلات',
    endAyah: 50,
    firstText: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ'
  },
  {
    juz: 30,
    name: 'الجزء الثلاثون',
    startPage: 582,
    endPage: 604,
    startSurah: 78,
    startSurahName: 'النبأ',
    startAyah: 1,
    endSurah: 114,
    endSurahName: 'الناس',
    endAyah: 6,
    firstText: 'عَمَّ يَتَسَاءَلُونَ'
  }
];

// Clean Arabic Surah List for dropdowns & selection
export const SURAHS_LIST = [
  { id: 1, name: 'الفاتحة', startPage: 1, ayahs: 7 },
  { id: 2, name: 'البقرة', startPage: 2, ayahs: 286 },
  { id: 3, name: 'آل عمران', startPage: 50, ayahs: 200 },
  { id: 4, name: 'النساء', startPage: 77, ayahs: 176 },
  { id: 5, name: 'المائدة', startPage: 106, ayahs: 120 },
  { id: 6, name: 'الأنعام', startPage: 128, ayahs: 165 },
  { id: 7, name: 'الأعراف', startPage: 151, ayahs: 206 },
  { id: 8, name: 'الأنفال', startPage: 177, ayahs: 75 },
  { id: 9, name: 'التوبة', startPage: 187, ayahs: 129 },
  { id: 10, name: 'يونس', startPage: 208, ayahs: 109 },
  { id: 11, name: 'هود', startPage: 221, ayahs: 123 },
  { id: 12, name: 'يوسف', startPage: 235, ayahs: 111 },
  { id: 13, name: 'الرعد', startPage: 249, ayahs: 43 },
  { id: 14, name: 'إبراهيم', startPage: 255, ayahs: 52 },
  { id: 15, name: 'الحجر', startPage: 262, ayahs: 99 },
  { id: 16, name: 'النحل', startPage: 267, ayahs: 128 },
  { id: 17, name: 'الإسراء', startPage: 282, ayahs: 111 },
  { id: 18, name: 'الكهف', startPage: 293, ayahs: 110 },
  { id: 19, name: 'مريم', startPage: 305, ayahs: 98 },
  { id: 20, name: 'طه', startPage: 312, ayahs: 135 },
  { id: 21, name: 'الأنبياء', startPage: 322, ayahs: 112 },
  { id: 22, name: 'الحج', startPage: 332, ayahs: 78 },
  { id: 23, name: 'المؤمنون', startPage: 342, ayahs: 118 },
  { id: 24, name: 'النور', startPage: 350, ayahs: 64 },
  { id: 25, name: 'الفرقان', startPage: 359, ayahs: 77 },
  { id: 26, name: 'الشعراء', startPage: 367, ayahs: 227 },
  { id: 27, name: 'النمل', startPage: 377, ayahs: 93 },
  { id: 28, name: 'القصص', startPage: 385, ayahs: 88 },
  { id: 29, name: 'العنكبوت', startPage: 396, ayahs: 69 },
  { id: 30, name: 'الروم', startPage: 404, ayahs: 60 },
  { id: 31, name: 'لقمان', startPage: 411, ayahs: 34 },
  { id: 32, name: 'السجدة', startPage: 415, ayahs: 30 },
  { id: 33, name: 'الأحزاب', startPage: 418, ayahs: 73 },
  { id: 34, name: 'سبأ', startPage: 428, ayahs: 54 },
  { id: 35, name: 'فاطر', startPage: 434, ayahs: 45 },
  { id: 36, name: 'يس', startPage: 440, ayahs: 83 },
  { id: 37, name: 'الصافات', startPage: 446, ayahs: 182 },
  { id: 38, name: 'ص', startPage: 453, ayahs: 88 },
  { id: 39, name: 'الزمر', startPage: 458, ayahs: 75 },
  { id: 40, name: 'غافر', startPage: 467, ayahs: 85 },
  { id: 41, name: 'فصلت', startPage: 477, ayahs: 54 },
  { id: 42, name: 'الشورى', startPage: 483, ayahs: 53 },
  { id: 43, name: 'الزخرف', startPage: 489, ayahs: 89 },
  { id: 44, name: 'الدخان', startPage: 496, ayahs: 59 },
  { id: 45, name: 'الجاثية', startPage: 499, ayahs: 37 },
  { id: 46, name: 'الأحقاف', startPage: 502, ayahs: 35 },
  { id: 47, name: 'محمد', startPage: 507, ayahs: 38 },
  { id: 48, name: 'الفتح', startPage: 511, ayahs: 29 },
  { id: 49, name: 'الحجرات', startPage: 515, ayahs: 18 },
  { id: 50, name: 'ق', startPage: 518, ayahs: 45 },
  { id: 51, name: 'الذاريات', startPage: 520, ayahs: 60 },
  { id: 52, name: 'الطور', startPage: 523, ayahs: 49 },
  { id: 53, name: 'النجم', startPage: 526, ayahs: 62 },
  { id: 54, name: 'القمر', startPage: 528, ayahs: 55 },
  { id: 55, name: 'الرحمن', startPage: 531, ayahs: 78 },
  { id: 56, name: 'الواقعة', startPage: 534, ayahs: 96 },
  { id: 57, name: 'الحديد', startPage: 537, ayahs: 29 },
  { id: 58, name: 'المجادلة', startPage: 542, ayahs: 22 },
  { id: 59, name: 'الحشر', startPage: 545, ayahs: 24 },
  { id: 60, name: 'الممتحنة', startPage: 549, ayahs: 13 },
  { id: 61, name: 'الصف', startPage: 551, ayahs: 14 },
  { id: 62, name: 'الجمعة', startPage: 553, ayahs: 11 },
  { id: 63, name: 'المنافقون', startPage: 554, ayahs: 11 },
  { id: 64, name: 'التغابن', startPage: 556, ayahs: 18 },
  { id: 65, name: 'الطلاق', startPage: 558, ayahs: 12 },
  { id: 66, name: 'التحريم', startPage: 560, ayahs: 12 },
  { id: 67, name: 'الملك', startPage: 562, ayahs: 30 },
  { id: 68, name: 'القلم', startPage: 564, ayahs: 52 },
  { id: 69, name: 'الحاقة', startPage: 566, ayahs: 52 },
  { id: 70, name: 'المعارج', startPage: 568, ayahs: 44 },
  { id: 71, name: 'نوح', startPage: 570, ayahs: 28 },
  { id: 72, name: 'الجن', startPage: 572, ayahs: 28 },
  { id: 73, name: 'المزمل', startPage: 574, ayahs: 20 },
  { id: 74, name: 'المدثر', startPage: 575, ayahs: 56 },
  { id: 75, name: 'القيامة', startPage: 577, ayahs: 40 },
  { id: 76, name: 'الإنسان', startPage: 578, ayahs: 31 },
  { id: 77, name: 'المرسلات', startPage: 580, ayahs: 50 },
  { id: 78, name: 'النبأ', startPage: 582, ayahs: 40 },
  { id: 79, name: 'النازعات', startPage: 583, ayahs: 46 },
  { id: 80, name: 'عبس', startPage: 585, ayahs: 42 },
  { id: 81, name: 'التكوير', startPage: 586, ayahs: 29 },
  { id: 82, name: 'الانفطار', startPage: 587, ayahs: 19 },
  { id: 83, name: 'المطففين', startPage: 587, ayahs: 36 },
  { id: 84, name: 'الانشقاق', startPage: 589, ayahs: 25 },
  { id: 85, name: 'البروج', startPage: 590, ayahs: 22 },
  { id: 86, name: 'الطارق', startPage: 591, ayahs: 17 },
  { id: 87, name: 'الأعلى', startPage: 591, ayahs: 19 },
  { id: 88, name: 'الغاشية', startPage: 592, ayahs: 26 },
  { id: 89, name: 'الفجر', startPage: 593, ayahs: 30 },
  { id: 90, name: 'البلد', startPage: 594, ayahs: 20 },
  { id: 91, name: 'الشمس', startPage: 595, ayahs: 15 },
  { id: 92, name: 'الليل', startPage: 595, ayahs: 21 },
  { id: 93, name: 'الضحى', startPage: 596, ayahs: 11 },
  { id: 94, name: 'الشرح', startPage: 596, ayahs: 8 },
  { id: 95, name: 'التين', startPage: 597, ayahs: 8 },
  { id: 96, name: 'العلق', startPage: 597, ayahs: 19 },
  { id: 97, name: 'القدر', startPage: 598, ayahs: 5 },
  { id: 98, name: 'البينة', startPage: 598, ayahs: 8 },
  { id: 99, name: 'الزلزلة', startPage: 599, ayahs: 8 },
  { id: 100, name: 'العاديات', startPage: 599, ayahs: 11 },
  { id: 101, name: 'القارعة', startPage: 600, ayahs: 11 },
  { id: 102, name: 'التكاثر', startPage: 600, ayahs: 8 },
  { id: 103, name: 'العصر', startPage: 601, ayahs: 3 },
  { id: 104, name: 'الهمزة', startPage: 601, ayahs: 9 },
  { id: 105, name: 'الفيل', startPage: 601, ayahs: 5 },
  { id: 106, name: 'قريش', startPage: 602, ayahs: 4 },
  { id: 107, name: 'الماعون', startPage: 602, ayahs: 7 },
  { id: 108, name: 'الكوثر', startPage: 602, ayahs: 3 },
  { id: 109, name: 'الكافرون', startPage: 603, ayahs: 6 },
  { id: 110, name: 'النصر', startPage: 603, ayahs: 3 },
  { id: 111, name: 'المسد', startPage: 603, ayahs: 5 },
  { id: 112, name: 'الإخلاص', startPage: 604, ayahs: 4 },
  { id: 113, name: 'الفلق', startPage: 604, ayahs: 5 },
  { id: 114, name: 'الناس', startPage: 604, ayahs: 6 }
];

/**
 * Calculates Werd statistics given target days and starting point
 */
export function calculateWerdTargets({ targetDays = 30, startPage = 1, endPage = 604 }) {
  const days = Math.max(1, Number(targetDays) || 30);
  const totalPagesToRead = Math.max(1, endPage - startPage + 1);

  const dailyPages = Math.max(1, Math.ceil(totalPagesToRead / days));
  const dailyJuz = (30 / days).toFixed(1);
  const dailyHizb = (60 / days).toFixed(1);
  const dailyAyahs = Math.ceil(QURAN_TOTAL_AYAHS / days);

  return {
    targetDays: days,
    totalPagesToRead,
    dailyPages,
    dailyJuz,
    dailyHizb,
    dailyAyahs
  };
}

/**
 * Resolves which Juz contains a given page number
 */
export function getJuzForPage(page) {
  const p = Math.max(1, Math.min(604, Number(page) || 1));
  const match = JUZ_METADATA.find((j) => p >= j.startPage && p <= j.endPage);
  return match || JUZ_METADATA[0];
}

/**
 * Resolves nearest Surah for a given page number
 */
export function getSurahForPage(page) {
  const p = Math.max(1, Math.min(604, Number(page) || 1));
  for (let i = SURAHS_LIST.length - 1; i >= 0; i--) {
    if (p >= SURAHS_LIST[i].startPage) {
      return SURAHS_LIST[i];
    }
  }
  return SURAHS_LIST[0];
}

/**
 * Computes today's Werd range (start page to end page) based on current bookmark
 */
export function getTodayWerdDetails(currentBookmarkPage, dailyPages) {
  const startPage = Math.max(1, Math.min(604, Number(currentBookmarkPage) || 1));
  const dPages = Math.max(1, Number(dailyPages) || 20);
  const endPage = Math.min(604, startPage + dPages - 1);

  const startJuz = getJuzForPage(startPage);
  const endJuz = getJuzForPage(endPage);
  const startSurah = getSurahForPage(startPage);
  const endSurah = getSurahForPage(endPage);

  return {
    startPage,
    endPage,
    pagesCount: endPage - startPage + 1,
    startJuzNumber: startJuz.juz,
    startJuzName: startJuz.name,
    endJuzNumber: endJuz.juz,
    endJuzName: endJuz.name,
    startSurahName: startSurah.name,
    startSurahId: startSurah.id,
    endSurahName: endSurah.name,
    endSurahId: endSurah.id,
    summaryText: `من صفحة ${startPage} (${startSurah.name}) إلى صفحة ${endPage} (${endSurah.name})`
  };
}

/**
 * Calculates current reading streak (consecutive days)
 */
export function computeReadingStreak(lastCompletedDateStr, currentStreak = 0) {
  if (!lastCompletedDateStr) return 1;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last = new Date(lastCompletedDateStr);
    last.setHours(0, 0, 0, 0);

    const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Completed already today
      return Math.max(1, currentStreak);
    } else if (diffDays === 1) {
      // Consecutive yesterday to today
      return currentStreak + 1;
    } else {
      // Missed more than 1 day, reset streak to 1
      return 1;
    }
  } catch (e) {
    return 1;
  }
}

/**
 * Authentic, beautiful Dua Khatm Al-Quran text
 */
export const DUA_KHATM_AL_QURAN = [
  {
    title: 'الاستفتاح والحمد',
    arabic: 'اللَّهُمَّ ارْحَمْنَا بِالقُرْآنِ، وَاجْعَلْهُ لَنَا إِمَاماً وَنُوراً وَهُدىً وَرَحْمَةً.'
  },
  {
    title: 'طلب الفهم والتلاوة',
    arabic: 'اللَّهُمَّ ذَكِّرْنَا مِنْهُ مَا نَسِينَا، وَعَلِّمْنَا مِنْهُ مَا جَهِلْنَا، وَارْزُقْنَا تِلاَوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ، وَاجْعَلْهُ لَنَا حُجَّةً يَا رَبَّ العَالَمِينَ.'
  },
  {
    title: 'صلاح الدين والدنيا والآخرة',
    arabic: 'اللَّهُمَّ أَصْلِحْ لَنَا دِينَنَا الَّذِي هُوَ عِصْمَةُ أَمْرِنَا، وَأَصْلِحْ لَنَا دُنْيَانَا الَّتِي فِيهَا مَعَاشُنَا، وَأَصْلِحْ لَنَا آخِرَتَنَا الَّتِي فِيهَا مَعَادُنَا، وَاجْعَلِ الحَيَاةَ زِيَادَةً لَنَا فِي كُلِّ خَيْرٍ، وَاجْعَلِ المَوْتَ رَاحَةً لَنَا مِنْ كُلِّ شَرٍّ.'
  },
  {
    title: 'حسن الخاتمة والمغفرة',
    arabic: 'اللَّهُمَّ اجْعَلْ خَيْرَ أَعْمَارِنَا أَوَاخِرَهَا، وَخَيْرَ أَعْمَالِنَا خَوَاتِمَهَا، وَخَيْرَ أَيَّامِنَا يَوْمَ نَلْقَاكَ فِيهِ.'
  },
  {
    title: 'سؤال السلامة والعافية',
    arabic: 'اللَّهُمَّ إِنَّا نَسْأَلُكَ عِيشَةً هَنِيَّةً، وَمِيتَةً سَوِيَّةً، وَمَرَدّاً غَيْرَ مَخْزٍ وَلاَ فَاضِحٍ.'
  },
  {
    title: 'قضاء الحوائج وتفريج الكروب',
    arabic: 'اللَّهُمَّ لاَ تَدَعْ لَنَا ذَنْباً إِلاَّ غَفَرْتَهُ، وَلاَ هَمّاً إِلاَّ فَرَّجْتَهُ، وَلاَ دَيْناً إِلاَّ قَضَيْتَهُ، وَلاَ حَاجَةً مِنْ حَوَائِجِ الدُّنْيَا وَالآخِرَةِ إِلاَّ قَضَيْتَهَا يَا أَرْحَمَ الرَّاحِمِينَ.'
  },
  {
    title: 'الدعاء الجامع والصلاة على النبي',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ، وَصَلَّى اللهُ عَلَى نَبِيِّنَا مُحَمَّدٍ وَعَلَى آلِهِ وَأَصْحَابِهِ الأَخْيَارِ وَسَلَّمَ تَسْلِيماً كَثِيراً.'
  }
];
