import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  MessageCircle,
  ShieldCheck,
  Laptop,
  CheckCircle,
  Info,
  Users,
  Code2,
  CheckCheck
} from 'lucide-react';
import ArabesquePattern from '../components/ArabesquePattern';
import developerPhoto from '../../assets/icon_person.png';
import hagerPhoto from '../../assets/hager.jpeg';
import appIcon from '../../assets/icon.png';

// Brand SVG Icons
const GithubIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const FacebookIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export default function AboutScreen() {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleOpenUrl = (url) => {
    if (window.nisabAPI?.openExternal) {
      window.nisabAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div
      style={{ height: '100%', overflowY: 'auto' }}
      className="relative h-full w-full bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-8 select-none overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800"
      dir="rtl"
    >
      <ArabesquePattern className="opacity-10 text-emerald-500" />

      <div className="relative z-10 w-full min-w-0 max-w-[1700px] mx-auto space-y-6 sm:space-y-8 pb-12">
        
        {/* 1. Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-900/40 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 via-emerald-600/30 to-amber-600/10 border border-amber-500/40 flex items-center justify-center shadow-inner shrink-0">
              <Info className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-amber-300 font-serif">
                  عن التطبيق وفريق العمل
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold">
                  الإصدار 1.0.0
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                نِصاب | الموسوعة الإسلامية المكتبية الشاملة - صدقة جارية لوجه الله تعالى
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenUrl('https://github.com/Mahmoud-ibrahim74/Nisab')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-800/60 text-slate-200 hover:text-amber-300 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <GithubIcon className="w-4 h-4" />
              <span>مستودع المشروع</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 2. Team Members Showcase Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-300">
              فريق العمل والتطوير (Engineering & Quality Team)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* Member 1: Mahmoud Ibrahim */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl p-4 sm:p-5 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-emerald-950/50 border border-amber-500/40 shadow-2xl relative overflow-hidden flex flex-col justify-between"
            >
              {/* Ambient Glows */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

              <div>
                {/* Photo Container */}
                <div className="relative w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl group bg-slate-950/80 flex items-center justify-center">
                  <img
                    src={developerPhoto}
                    alt="م. محمود إبراهيم - Software Engineer"
                    className="w-full h-full object-contain rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                  />

                  {/* Top Status Badge */}
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-950/90 backdrop-blur-md border border-amber-500/50 text-xs text-amber-300 font-bold shadow-lg flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>مطور ومؤسس نِصاب</span>
                  </div>

                  {/* Bottom Gradient Info Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-4 pt-14 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex flex-col items-center text-center">
                    <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-100">
                      م. محمود إبراهيم
                    </h3>
                    <span className="text-xs text-amber-300 font-mono mt-0.5" dir="ltr">
                      Mahmoud Ibrahim
                    </span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                        <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                        Software Engineer
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sincere Note */}
              <div className="w-full mt-3 p-3 rounded-2xl bg-slate-950/80 border border-emerald-900/50 text-center">
                <p className="text-xs text-slate-300 leading-relaxed font-serif">
                  « نسألكم الدعاء بظهر الغيب بالقبول والمغفرة »
                </p>
              </div>
            </motion.div>

            {/* Member 2: Hager AbdelNasser */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="rounded-3xl p-4 sm:p-5 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-emerald-950/50 border border-amber-500/40 shadow-2xl relative overflow-hidden flex flex-col justify-between"
            >
              {/* Ambient Glows */}
              <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

              <div>
                {/* Photo Container */}
                <div className="relative w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl group bg-slate-950/80 flex items-center justify-center">
                  <img
                    src={hagerPhoto}
                    alt="م. هاجر عبد الناصر - Software Engineer & Software Tester"
                    className="w-full h-full object-contain rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                  />

                  {/* Top Status Badge */}
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-950/90 backdrop-blur-md border border-amber-500/50 text-xs text-amber-300 font-bold shadow-lg flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>اختبار وضمان جودة البرمجيات</span>
                  </div>

                  {/* Bottom Gradient Info Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-4 pt-14 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex flex-col items-center text-center">
                    <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-100">
                      م. هاجر عبد الناصر
                    </h3>
                    <span className="text-xs text-amber-300 font-mono mt-0.5" dir="ltr">
                      Hager AbdelNasser
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                        <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                        Software Engineer
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300">
                        <CheckCheck className="w-3.5 h-3.5 text-amber-400" />
                        Software Tester
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sincere Note */}
              <div className="w-full mt-3 p-3 rounded-2xl bg-slate-950/80 border border-emerald-900/50 text-center">
                <p className="text-xs text-slate-300 leading-relaxed font-serif">
                  « فحص واختبار دقة النظام وضمان تجربة استخدام موثوقة »
                </p>
              </div>
            </motion.div>

          </div>
        </div>

        {/* 3. Mission, Contacts & Technical Specifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Card 1: Bio & Direct Contact Channels */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-emerald-950/90 via-slate-900/95 to-slate-950 border border-emerald-700/50 shadow-2xl relative overflow-hidden h-full flex flex-col justify-between"
          >
            <div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-300">
                    رسالة المشروع وفريق العمل
                  </h2>
                  <span className="text-xs font-mono text-emerald-300 px-2.5 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40">
                    صدقة جارية
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed font-serif pt-1">
                  «الحمد لله الذي بنعمته تتم الصالحات، صُمم وبُني تطبيق نِصاب خالصاً لوجه الله تعالى ليكون رفيقاً إيمانياً عصرياً للمسلم في حياته اليومية على الحاسوب، جامعاً بين دقة المعلومة الشرعية الموثقة وسلاسة التجربة الرقمية، نسأل الله أن يتقبله صدقة جارية عنا وعن والدينا وأهلينا، ولكل من ساهم فيه أو استفاد منه.»
                </p>
              </div>

              {/* Direct Contact Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-5 border-t border-emerald-900/40">
                
                {/* WhatsApp */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-900/60 hover:border-emerald-500/60 transition group flex flex-col justify-between shadow-md">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <MessageCircle className="w-4 h-4" />
                        واتساب (WhatsApp)
                      </span>
                      <button
                        onClick={() => handleCopy('01069903556', 'wa')}
                        title="نسخ رقم الهاتف"
                        className="text-slate-400 hover:text-amber-300 cursor-pointer p-0.5 transition"
                      >
                        {copiedKey === 'wa' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="text-sm font-bold font-mono text-slate-100 tracking-wider mb-3 text-left" dir="ltr">
                      01069903556
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenUrl('https://wa.me/201069903556')}
                    className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <span>مراسلة عبر واتساب</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Facebook */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-900/60 hover:border-blue-500/60 transition group flex flex-col justify-between shadow-md">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                        <FacebookIcon className="w-4 h-4" />
                        فيسبوك (Facebook)
                      </span>
                      <button
                        onClick={() => handleCopy('https://m.facebook.com/Houda405/', 'fb')}
                        title="نسخ الرابط"
                        className="text-slate-400 hover:text-amber-300 cursor-pointer p-0.5 transition"
                      >
                        {copiedKey === 'fb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="text-xs font-mono text-slate-300 truncate mb-3" dir="ltr">
                      fb.com/Houda405
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenUrl('https://m.facebook.com/Houda405/')}
                    className="w-full py-2 px-2.5 rounded-xl bg-blue-950/70 hover:bg-blue-900 text-blue-200 border border-blue-800/50 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <span>زيارة الملف الشخصي</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* GitHub */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-900/60 hover:border-amber-500/60 transition group flex flex-col justify-between shadow-md">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <GithubIcon className="w-4 h-4" />
                        جيت هاب (GitHub)
                      </span>
                      <button
                        onClick={() => handleCopy('https://github.com/Mahmoud-ibrahim74/Nisab', 'gh')}
                        title="نسخ الرابط"
                        className="text-slate-400 hover:text-amber-300 cursor-pointer p-0.5 transition"
                      >
                        {copiedKey === 'gh' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="text-xs font-mono text-slate-300 truncate mb-3" dir="ltr">
                      Mahmoud-ibrahim74/Nisab
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenUrl('https://github.com/Mahmoud-ibrahim74/Nisab')}
                    className="w-full py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700/80 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <span>فتح المستودع</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sincere Dedication Banner */}
            <div className="mt-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs text-amber-200 leading-relaxed">
                <span className="font-bold">تطبيق مجاني وخالٍ تماماً من الإعلانات:</span> لا توجد أي خطط مدفوعة أو اشتراكات، جميع الخدمات والخصائص متاحة ومفتوحة لجميع المسلمين حول العالم.
              </div>
            </div>
          </motion.div>

          {/* Card 2: Nisab Brand & Architecture Specifications */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-emerald-950/40 border border-amber-500/30 shadow-2xl relative overflow-hidden backdrop-blur-xl h-full flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3.5 pb-4 border-b border-emerald-900/40">
                <img
                  src={appIcon}
                  alt="Nisab Logo"
                  className="w-14 h-14 rounded-2xl shadow-xl border border-amber-500/40 object-cover shrink-0"
                />
                <div>
                  <h3 className="text-xl font-bold font-serif text-amber-300">
                    نِصاب | Nisab Desktop Application
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-800/60 font-semibold">
                      v1.0.0 (Release)
                    </span>
                    <span className="text-[11px] text-slate-400">Offline-First Islamic Platform</span>
                  </div>
                </div>
              </div>

              {/* Technical Specifications Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400">البيئة البرمجية:</span>
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                    تطبيق مكتبي متكامل (Windows)
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400">الاتصال بالإنترنت:</span>
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    يعمل 100% بدون إنترنت (Offline)
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400">الخصوصية والأمان:</span>
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    بياناتك محلية بالكامل، لا تتبع
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400">الترخيص المصدري:</span>
                  <span className="font-bold text-slate-200 font-mono">MIT Open Source License</span>
                </div>
              </div>

              {/* Tech Stack Pills */}
              <div className="mt-4 pt-3.5 border-t border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold mb-2">التقنيات المستخدمة في البناء والتطوير:</div>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                  {['Electron', 'React 19', 'Tailwind CSS v4', 'Vite', 'Adhan.js', 'Framer Motion', 'Howler.js', 'Leaflet', 'Lucide Icons'].map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-emerald-900/50 text-slate-300 font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
              جميع الحقوق محفوظة لوجه الله تعالى • 2026 م / 1447 هـ
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}
