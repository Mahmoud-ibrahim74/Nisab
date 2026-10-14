/**
 * Bilingual Dictionary (Arabic RTL & English LTR)
 * for "Fanoos Al-Noor: The Little Explorer" (فانوس النور: المستكشف الصغير)
 */

export const I18N = {
  ar: {
    gameTitle: 'فانوس النور: المستكشف الصغير',
    subtitle: 'مغامرة تعليمية إسلامية تفاعلية للأبطال الصغار',
    heroSelect: 'اختر بطلك الصغير:',
    heroZayd: 'زيد',
    heroNoor: 'نور',
    starsCount: 'نجوم النور:',
    passportBtn: 'جواز سفر الحسنات',
    resetBtn: 'إعادة المغامرة',
    soundOn: 'تشغيل الصوت',
    soundMuted: 'كتم الصوت',
    interactHint: 'اضغط [E] أو زر التفاعل للحديث والمساعدة',
    nearStation: 'أنت بالقرب من:',
    controlsHelp: 'استخدم مفاتيح الأسهم أو WASD أو أزرار الشاشة للتنقل والاقتراب من المحطات',
    
    // Stations Names
    station1Title: 'حديقة التحية الطيبة',
    station1Subtitle: 'آداب السلام والكلمة الطيبة',
    station1NPC: 'العم كريم البستاني',

    station2Title: 'نافورة الرحمة والنقاء',
    station2Subtitle: 'الرفق بالحيوان وإماطة الأذى',
    station2NPC: 'القطة العطشى والسبيل',

    station3Title: 'سلة تمور الجدة سلمى',
    station3Subtitle: 'الصدقة وإكرام الجار والمشاركة',
    station3NPC: 'الجدة سلمى',

    station4Title: 'مئذنة النجوم المتلألئة',
    station4Subtitle: 'التفكر في خلق الله والنجمة الثمانية',
    station4NPC: 'عالمة الفلك الصغيرة مريم',

    // Station 1: Greeting Garden
    q1Intro: 'أهلاً بك يا بني في حديقة الأزهار العطرة! الكلمة الطيبة صدقة وتزرع المحبة بين الناس. هل يمكنك مساعدتي في اختيار العبارة الإسلامية المناسبة لكل موقف؟',
    q1Matches: [
      {
        id: 'greeting',
        situation: 'عندما تلتقي بصديقك أو جارك في الحي:',
        options: ['السلام عليكم ورحمة الله وبركاته', 'شكراً لك مع السلامة', 'أنا مشغول جداً'],
        correctIndex: 0,
        explanation: 'أفشوا السلام بينكم! التحية الإسلامية تنشر الأمان والمودة.'
      },
      {
        id: 'start_eating',
        situation: 'قبل أن تبدأ بتناول طعامك اللذيذ أو تبدأ عملاً مفيداً:',
        options: ['الحمد لله رب العالمين', 'بسم الله الرحمن الرحيم', 'أستغفر الله العظيم'],
        correctIndex: 1,
        explanation: 'نذكر اسم الله في بداية كل عمل طيب لتحل فيه البركة.'
      },
      {
        id: 'thanking',
        situation: 'عندما تنتهي من الطعام أو تتذكر نعم الله الكثيرة عليك:',
        options: ['لا حول ولا قوة إلا بالله', 'السلام عليكم', 'الحمد لله رب العالمين'],
        correctIndex: 2,
        explanation: 'الحمد والشكر لله يزيد النعم ويملأ القلب بالرضا والسعادة.'
      }
    ],
    q1Complete: 'أحسنت صنعاً! لقد أضاء فانوسك بالنور الزمردي الأخضر وفزت بنجمة السلام والكلمة الطيبة!',

    // Station 2: Kindness Fountain
    q2Intro: 'مرحباً يا بطل! انظر، هناك بعض الأوراق والقمامة التي أسقطتها الرياح حول السبيل، وهناك قطة صغيرة ظمآنة تنظر إلى وعاء الماء الفارغ. هل تساعدنا في تنظيف المكان وملء وعاء الماء؟',
    q2Step1Title: 'أولاً: إماطة الأذى عن الطريق (اضغط على قطع القمامة لتنظيفها):',
    q2Step1Hint: 'النظافة من الإيمان، وإماطة الأذى صدقة!',
    q2Step1Remain: 'القطع المتبقية:',
    q2Step2Title: 'ثانياً: اسكب الماء العذب في وعاء القطة الصغيرة:',
    q2PourWaterBtn: 'اسكب الماء العذب للقطة 💧',
    q2KittenPurr: 'مياووو! القطة تشرب بسعادة وتدعوا لك بالخير! «في كل كبد رطبة أجر»',
    q2Complete: 'مبارك! أضاء فانوسك بالنور الياقوتي الأزرق وكسبت نجمة الرحمة والنظافة!',

    // Station 3: Grandma Salma's Basket
    q3Intro: 'يا بني الحبيب، لقد صنعت 6 تمور سكرية و 3 قطع حلوى شهية، وأريد توزيعها بالتساوي تماماً كهدية صدقة لـ 3 من بيوت جيراننا الكرام (بيت أحمد، بيت فاطمة، بيت عمر).',
    q3Instructions: 'شارك التمور والحلوى بحيث يحصل كل بيت على (تمرتين + قطعة حلوى واحدة) بالتساوي التام!',
    q3BasketNames: ['بيت أحمد', 'بيت فاطمة', 'بيت عمر'],
    q3DatesLeft: 'التمور المتبقية في سلة الجدة:',
    q3SweetsLeft: 'الحلوى المتبقية في سلة الجدة:',
    q3AddDateBtn: '+ إضافة تمرة',
    q3AddSweetBtn: '+ إضافة حلوى',
    q3RemoveBtn: 'إرجاع',
    q3EqualShareSuccess: 'ما شاء الله! قسّمت التمور والحلوى بالعدل والإحسان، وأفرحت قلوب الجيران! «تهادوا تحابوا»',
    q3Complete: 'رائع جداً! أضاء فانوسك بالنور العقيقي الأحمر وفزت بنجمة الصدقة والمشاركة!',

    // Station 4: Starry Minaret
    q4Intro: 'مرحباً بالمستكشف النبيه! نحن ننظر إلى سماء القرية الصافية المليئة بالنجوم البديعة. مئذنة المسجد مزينة بنجمة إسلامية ثمانية (الرّبع الحزبي)، ولكن قطعها تحركت بفعل الرياح. هل يمكنك تدوير القطع الأربع لتكتمل النجمة وتضيء قبة المئذنة؟',
    q4RotateHint: 'اضغط على كل ربع لتدويره حتى تصبح كل القطع في مكانها الصحيح المتناغم:',
    q4SubhanAllah: '«سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ» ما أبدع خلق الله في كونه!',
    q4AlignedMsg: 'اكتملت النجمة الثمانية المباركة بنجاح وأضاءت قبة المسجد بنور ساحر!',
    q4Complete: 'مبارك! أضاء فانوسك بالنور الذهبي وفزت بنجمة التفكر والحكمة!',

    // Passport
    passportTitle: 'جواز سفر الحسنات والفضائل',
    passportSubtitle: 'سجل أعمالك الصالحة وأوسمتك في قرية النور',
    passportDeed1: 'وسام الكلمة الطيبة وإفشاء السلام',
    passportDeed1Desc: 'تعلم ونطق: السلام عليكم، بسم الله، والحمد لله.',
    passportDeed2: 'وسام الرفق بالحيوان ونظافة البيئة',
    passportDeed2Desc: 'إماطة الأذى عن طريق المارة وسقاية القطة الظمآنة.',
    passportDeed3: 'وسام الجود والصدقة وإكرام الجار',
    passportDeed3Desc: 'مشاركة التمور والحلويات بالعدل والمحبة بين الجيران.',
    passportDeed4: 'وسام التفكر في عظمة خلق الله',
    passportDeed4Desc: 'تأمل جمال السماء وإتقان النجمة الهندسية الإسلامية.',
    earnedOn: 'تم الإنجاز:',
    notEarnedYet: 'لم يُنجز بعد - استكشف القرية لإكماله!',
    certificateTitle: 'شهادة المستكشف الصغير المبارك',
    certificateDesc: 'نشهد أن بطلنا الصغير قد أكمل مهام قرية النور، وتحلى بالأخلاق الإسلامية الفاضلة، وجعل فانوسه يضيء ببركة الحسنات.',
    closeBtn: 'إغلاق',

    // Finale
    celebrationTitle: 'مبارك! أشرقت قرية النور بفانوسك المضيء!',
    celebrationMsg: 'بفضل الله ثم همتك ومساعدتك لأهل القرية، امتلأ فانوس الحسنات بالأنوار الأربعة واحتفلت القرية كاملة بمهرجان النور والخير!',
    playAgainBtn: 'الاستمرار في استكشاف القرية'
  },

  en: {
    gameTitle: 'Fanoos Al-Noor: The Little Explorer',
    subtitle: 'An Interactive Islamic 2D Adventure for Young Champions',
    heroSelect: 'Choose Your Little Hero:',
    heroZayd: 'Zayd',
    heroNoor: 'Noor',
    starsCount: 'Noor Stars:',
    passportBtn: 'Good Deeds Passport',
    resetBtn: 'Reset Adventure',
    soundOn: 'Audio On',
    soundMuted: 'Muted',
    interactHint: 'Press [E] or Tap to Speak & Help',
    nearStation: 'You are near:',
    controlsHelp: 'Use Arrow Keys, WASD, or On-Screen D-Pad buttons to walk towards stations',

    // Stations Names
    station1Title: 'The Greeting Garden',
    station1Subtitle: 'Good Manners & Kind Words',
    station1NPC: 'Uncle Kareem the Gardener',

    station2Title: 'The Kindness Fountain',
    station2Subtitle: 'Caring for Animals & Cleanliness',
    station2NPC: 'Thirsty Kitten & The Fountain',

    station3Title: "Grandma Salma's Date Basket",
    station3Subtitle: 'Charity, Sharing & Neighborliness',
    station3NPC: 'Grandma Salma',

    station4Title: 'The Starry Minaret',
    station4Subtitle: 'Contemplating Creation & The 8-Pointed Star',
    station4NPC: 'Little Astronomer Mariam',

    // Station 1: Greeting Garden
    q1Intro: 'Welcome, young friend, to our fragrant garden! A kind word is a charity that brings people together. Can you help me pick the right Islamic phrase for each situation?',
    q1Matches: [
      {
        id: 'greeting',
        situation: 'When you meet a friend, teacher, or neighbor:',
        options: ['Assalamu Alaikum wa Rahmatullah', 'Thank you and goodbye', "I'm very busy"],
        correctIndex: 0,
        explanation: 'Spread peace! The Islamic greeting brings warmth, safety, and blessings.'
      },
      {
        id: 'start_eating',
        situation: 'Before you begin eating your meal or starting a good task:',
        options: ['Alhamdulillah Rabbil Alamin', 'Bismillahir Rahmanir Raheem', 'Astaghfirullah'],
        correctIndex: 1,
        explanation: 'We mention the name of Allah before every good deed to invite His blessings.'
      },
      {
        id: 'thanking',
        situation: 'When you finish your meal or thank Allah for His endless gifts:',
        options: ['La hawla wa la quwwata illa billah', 'Assalamu Alaikum', 'Alhamdulillah Rabbil Alamin'],
        correctIndex: 2,
        explanation: 'Saying Alhamdulillah expresses our gratitude and fills our hearts with joy.'
      }
    ],
    q1Complete: 'Bravo! Your lantern glows with Emerald Light and you earned the Star of Kind Words!',

    // Station 2: Kindness Fountain
    q2Intro: 'Hello, hero! The evening breeze blew some litter around the community fountain, and a little kitten is gazing at an empty bowl. Will you help clean the tiles and fill the water bowl?',
    q2Step1Title: 'First: Removing obstacles and litter (Click each piece to clean it):',
    q2Step1Hint: 'Cleanliness is half of faith, and removing harm is a charity!',
    q2Step1Remain: 'Litter left:',
    q2Step2Title: 'Second: Pour fresh water into the kitten’s bowl:',
    q2PourWaterBtn: 'Pour Fresh Water 💧',
    q2KittenPurr: 'Meow! The kitten drinks happily and purrs gratefully! "There is a reward for serving any living being."',
    q2Complete: 'Marvelous! Your lantern shines with Sapphire Light and you won the Star of Compassion!',

    // Station 3: Grandma Salma's Basket
    q3Intro: 'My dear grandchild! I have 6 sweet medjool dates and 3 honey treats. I want to share them equally with 3 beloved neighbors (Ahmad, Fatima, and Omar).',
    q3Instructions: 'Divide the dates and sweets equally so each home gets (2 dates + 1 sweet treat)!',
    q3BasketNames: ["Ahmad's House", "Fatima's House", "Omar's House"],
    q3DatesLeft: 'Dates remaining in Grandma basket:',
    q3SweetsLeft: 'Sweets remaining in Grandma basket:',
    q3AddDateBtn: '+ Add Date',
    q3AddSweetBtn: '+ Add Sweet',
    q3RemoveBtn: 'Undo',
    q3EqualShareSuccess: 'MashaAllah! You shared with fairness and generous love! "Exchange gifts, and you will love one another."',
    q3Complete: 'Wonderful! Your lantern shines with Ruby Light and you won the Star of Generosity!',

    // Station 4: Starry Minaret
    q4Intro: 'Welcome, curious astronomer! Look at the twinkling night sky above our village. The minaret is crowned with an 8-pointed Islamic Star (Rub el Hizb), but the wind tilted the tiles. Can you rotate the 4 quadrants to align the star and light the dome?',
    q4RotateHint: 'Click each quadrant to rotate it until all 4 pieces click into perfect alignment (0°):',
    q4SubhanAllah: '«SubhanAllahi wa bihamdihi, SubhanAllahil Azeem» Glory be to Allah for His wondrous creation!',
    q4AlignedMsg: 'The sacred 8-pointed star is perfectly aligned and the minaret dome sparkles with light!',
    q4Complete: 'Sublime! Your lantern gleams with Golden Light and you won the Star of Wisdom!',

    // Passport
    passportTitle: 'Good Deeds Passport',
    passportSubtitle: 'Your record of virtues and honorary badges in Al-Noor Village',
    passportDeed1: 'Badge of Kind Words & Peaceful Greetings',
    passportDeed1Desc: 'Mastered Salam, Bismillah, and Alhamdulillah.',
    passportDeed2: 'Badge of Animal Mercy & Cleanliness',
    passportDeed2Desc: 'Removed courtyard litter and quenched a thirsty kitten.',
    passportDeed3: 'Badge of Generosity & Neighborly Care',
    passportDeed3Desc: 'Shared dates and treats with fairness and love among neighbors.',
    passportDeed4: 'Badge of Cosmic Contemplation & Geometry',
    passportDeed4Desc: 'Aligned the Rub el Hizb 8-pointed star and remembered Allah.',
    earnedOn: 'Earned:',
    notEarnedYet: 'Not earned yet - explore the village to achieve it!',
    certificateTitle: 'Honored Little Explorer Certificate',
    certificateDesc: 'Certified that our young champion has illuminated Al-Noor Village with noble Islamic morals and virtuous deeds.',
    closeBtn: 'Close',

    // Finale
    celebrationTitle: 'Mabrook! Al-Noor Village is Aglow with Your Lantern!',
    celebrationMsg: 'With your kindness, teamwork, and love, all 4 Noor Stars are collected! The grand courtyard is filled with lanterns, joy, and peace!',
    playAgainBtn: 'Keep Exploring the Village'
  }
};
