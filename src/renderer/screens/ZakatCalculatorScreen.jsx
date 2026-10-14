import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  Scale,
  Calendar,
  Info,
  HelpCircle,
  Save,
  Trash2,
  RefreshCw,
  Check,
  Copy,
  Plus,
  Minus,
  Wheat,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  History,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Percent,
  Banknote,
  Building,
  CreditCard,
  Layers,
  Award
} from 'lucide-react';
import {
  FIQH_CONSTANTS,
  SUPPORTED_CURRENCIES,
  getDerivedGoldPrices,
  normalizeGoldTo24K,
  calculateZakatMal,
  calculateZakatGoldSilver,
  calculateZakatFitr,
  loadSavedZakatSettings,
  saveZakatSettings,
  loadZakatHistory,
  saveZakatHistoryEntry,
  deleteZakatHistoryEntry
} from '../utils/zakatEngine';

export default function ZakatCalculatorScreen() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('mal'); // 'mal' | 'gold' | 'fitr' | 'history'

  // Settings state (Offline-first)
  const [settings, setSettings] = useState(() => loadSavedZakatSettings());
  const [currency, setCurrency] = useState(() => {
    const saved = loadSavedZakatSettings();
    return SUPPORTED_CURRENCIES.find((c) => c.code === saved.currencyCode) || SUPPORTED_CURRENCIES[0];
  });
  const [goldPrice24, setGoldPrice24] = useState(() => settings.goldPrice24 || currency.defaultGold24);
  const [silverPrice, setSilverPrice] = useState(() => settings.silverPrice || currency.defaultSilver);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [priceFetchStatus, setPriceFetchStatus] = useState(null); // null | 'success' | 'offline_fallback'

  // Module A: Zakat Al-Mal state
  const [cash, setCash] = useState('');
  const [tradeGoods, setTradeGoods] = useState('');
  const [receivables, setReceivables] = useState('');
  const [investments, setInvestments] = useState('');
  const [debts, setDebts] = useState('');
  const [nisabStandard, setNisabStandard] = useState(() => settings.nisabStandard || 'gold');
  const [calendarType, setCalendarType] = useState(() => settings.calendarType || 'hijri');

  // Module B: Zakat on Gold & Silver state
  const [goldWeights, setGoldWeights] = useState({ w24: '', w22: '', w21: '', w18: '' });
  const [silverWeight, setSilverWeight] = useState('');
  const [combineWithCash, setCombineWithCash] = useState(false);
  const [extraCash, setExtraCash] = useState('');
  const [goldDebts, setGoldDebts] = useState('');

  // Module C: Zakat Al-Fitr state
  const [familyMembers, setFamilyMembers] = useState(4);
  const [fitrMode, setFitrMode] = useState('cash'); // 'cash' | 'grain'
  const [fitrCashTier, setFitrCashTier] = useState('official'); // 'official' | 'medium' | 'generous' | 'custom'
  const [customFitrValue, setCustomFitrValue] = useState(35);

  // Module D: History log
  const [historyLog, setHistoryLog] = useState(() => loadZakatHistory());
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [saveToast, setSaveToast] = useState(null);

  // Active Tooltip modal
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Derived prices
  const derivedGold = useMemo(() => getDerivedGoldPrices(goldPrice24), [goldPrice24]);

  // Sync settings when currency changes
  const handleCurrencyChange = (newCurrencyCode) => {
    const cur = SUPPORTED_CURRENCIES.find((c) => c.code === newCurrencyCode) || SUPPORTED_CURRENCIES[0];
    setCurrency(cur);
    setGoldPrice24(cur.defaultGold24);
    setSilverPrice(cur.defaultSilver);

    const updated = {
      ...settings,
      currencyCode: cur.code,
      goldPrice24: cur.defaultGold24,
      silverPrice: cur.defaultSilver,
    };
    setSettings(updated);
    saveZakatSettings(updated);
  };

  // Save changes to local storage
  const handlePriceChange = (g24, silv) => {
    setGoldPrice24(g24);
    setSilverPrice(silv);
    const updated = {
      ...settings,
      currencyCode: currency.code,
      goldPrice24: Number(g24) || 0,
      silverPrice: Number(silv) || 0,
    };
    setSettings(updated);
    saveZakatSettings(updated);
  };

  // Optional live price fetcher
  const handleFetchLivePrice = async () => {
    setIsFetchingPrice(true);
    setPriceFetchStatus(null);
    try {
      // Simulate/Attempt online fetch with currency converter or fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${currency.code}`, {
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json();
        const rate = data?.rates?.[currency.code] || 1;
        // Approximate standard 1g 24K gold benchmark (~$86.5 USD/g)
        const approxGold = Math.round(86.5 * rate);
        const approxSilver = Number((1.08 * rate).toFixed(2));
        setGoldPrice24(approxGold);
        setSilverPrice(approxSilver);
        handlePriceChange(approxGold, approxSilver);
        setPriceFetchStatus('success');
      } else {
        // Offline default fallback
        setPriceFetchStatus('offline_fallback');
      }
    } catch {
      setPriceFetchStatus('offline_fallback');
    } finally {
      setIsFetchingPrice(false);
      setTimeout(() => setPriceFetchStatus(null), 4000);
    }
  };

  // Calculations:
  const malResult = useMemo(() => {
    return calculateZakatMal({
      cash,
      tradeGoods,
      receivables,
      investments,
      debts,
      nisabStandard,
      calendarType,
      goldPrice24,
      silverPrice,
    });
  }, [cash, tradeGoods, receivables, investments, debts, nisabStandard, calendarType, goldPrice24, silverPrice]);

  const goldSilverResult = useMemo(() => {
    return calculateZakatGoldSilver({
      goldWeights,
      silverWeight,
      combineWithCash,
      extraCash,
      debts: goldDebts,
      goldPrice24,
      silverPrice,
      calendarType,
    });
  }, [goldWeights, silverWeight, combineWithCash, extraCash, goldDebts, goldPrice24, silverPrice, calendarType]);

  const fitrPerPersonValue = useMemo(() => {
    const baseMin = currency.code === 'EGP' ? 35 : currency.code === 'SAR' ? 25 : 10;
    if (fitrCashTier === 'official') return baseMin;
    if (fitrCashTier === 'medium') return baseMin * 1.5;
    if (fitrCashTier === 'generous') return baseMin * 2.5;
    return Number(customFitrValue) || baseMin;
  }, [fitrCashTier, customFitrValue, currency]);

  const fitrResult = useMemo(() => {
    return calculateZakatFitr({
      familyMembers,
      mode: fitrMode,
      valuePerPerson: fitrPerPersonValue,
    });
  }, [familyMembers, fitrMode, fitrPerPersonValue]);

  // Save calculation to Zakat History Log
  const handleSaveToLog = () => {
    let entry = {};
    if (activeTab === 'mal') {
      entry = {
        type: 'زكاة المال وعروض التجارة',
        amount: malResult.zakatDue,
        currency: currency.symbol,
        netWealth: malResult.netZakatableWealth,
        nisabThreshold: malResult.nisabThreshold,
        nisabReached: malResult.isNisabReached,
        calendar: calendarType === 'hijri' ? 'حَوْل هجري (2.5%)' : 'حَوْل ميلادي (2.577%)',
      };
    } else if (activeTab === 'gold') {
      entry = {
        type: 'زكاة الذهب والفضة',
        amount: goldSilverResult.totalZakatCashDue,
        currency: currency.symbol,
        netWealth: goldSilverResult.goldTotalValue + goldSilverResult.silverTotalValue,
        goldGrams24: goldSilverResult.pureGoldGrams,
        silverGrams: goldSilverResult.silverGrams,
        calendar: calendarType === 'hijri' ? 'حَوْل هجري' : 'حَوْل ميلادي',
      };
    } else if (activeTab === 'fitr') {
      entry = {
        type: 'زكاة الفطر',
        amount: fitrMode === 'cash' ? fitrResult.totalCashDue : `${fitrResult.totalKgDue} كجم حبوب`,
        currency: fitrMode === 'cash' ? currency.symbol : '',
        members: familyMembers,
        mode: fitrMode === 'cash' ? 'نقداً' : 'صاع حبوب',
      };
    }

    const updated = saveZakatHistoryEntry(entry);
    setHistoryLog(updated);
    setSaveToast('تم حفظ العملية في سجل الزكاة بنجاح!');
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Copy receipt text
  const handleCopyReceipt = () => {
    let text = '';
    if (activeTab === 'mal') {
      text = `=== إيصال حساب زكاة المال | تطبيق نِصاب ===\n` +
        `التاريخ: ${new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full' }).format(new Date())}\n` +
        `إجمالي الأصول: ${malResult.totalAssets.toLocaleString()} ${currency.symbol}\n` +
        `الديون والالتزامات: ${malResult.debts.toLocaleString()} ${currency.symbol}\n` +
        `صافي المال الزكوي: ${malResult.netZakatableWealth.toLocaleString()} ${currency.symbol}\n` +
        `حد النصاب الشرعي (${malResult.nisabStandard === 'gold' ? 'ذهب 85 جم' : 'فضة 595 جم'}): ${malResult.nisabThreshold.toLocaleString()} ${currency.symbol}\n` +
        `الحالة: ${malResult.isNisabReached ? 'بلغ النصاب الشرعي وجبت الزكاة' : 'لم يبلغ النصاب'}\n` +
        `سعر الحول: ${malResult.ratePercentageText}\n` +
        `المقدار الواجب إخراجه: ${malResult.zakatDue.toLocaleString()} ${currency.symbol}\n` +
        `==================================`;
    } else if (activeTab === 'gold') {
      text = `=== إيصال حساب زكاة الذهب والفضة | تطبيق نِصاب ===\n` +
        `وزن الذهب الخالص (عيار 24): ${goldSilverResult.pureGoldGrams} جرام\n` +
        `قيمة الذهب: ${goldSilverResult.goldTotalValue.toLocaleString()} ${currency.symbol}\n` +
        `وزن الفضة: ${goldSilverResult.silverGrams} جرام\n` +
        `إجمالي الزكاة الواجبة نقداً: ${goldSilverResult.totalZakatCashDue.toLocaleString()} ${currency.symbol}\n` +
        `==================================`;
    } else {
      text = `=== إيصال زكاة الفطر | تطبيق نِصاب ===\n` +
        `عدد أفراد الأسرة: ${familyMembers}\n` +
        `طريقة الإخراج: ${fitrMode === 'cash' ? 'نقداً' : 'حبوباً (صاع)'}\n` +
        `الإجمالي: ${fitrMode === 'cash' ? `${fitrResult.totalCashDue.toLocaleString()} ${currency.symbol}` : `${fitrResult.totalKgDue} كجم قوت البلد`}\n` +
        `==================================`;
    }

    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  // Fiqh tooltips definitions
  const FIQH_TIPS = {
    immediate_debts: {
      title: 'ما هي الديون الحالة والالتزامات الواجبة الخصم؟',
      content: 'هي الديون المستحقة السداد فوراً خلال الشهر أو السنة الحالية كفواتير وإيجارات وأقساط مستحقة الأداء، ولا يُخصم منها الديون طويلة الأجل المؤجلة (كأقساط التمويل العقاري لعشرات السنين القادمة) وفقاً لفتوى مجمع الفقه الإسلامي.'
    },
    gregorian_rate: {
      title: 'لماذا نسبة الحول الميلادي 2.577% بدلاً من 2.5%؟',
      content: 'السنة الهجرية القمرية (354 يوماً) هي الأصل الشرعي ونسبتها ربع العشر (2.5%). أما السنة الميلادية الشمسية (365.25 يوماً) فتزيد بـ 11 يوماً تقريباً، ولذا يلزم زيادة النسبة بمقدار الفارق الزمني (2.5% × 365.25 ÷ 354.36 = 2.577%) لإبراء الذمة شرعاً.'
    },
    nisab_standard: {
      title: 'الفرق بين معيار الذهب ومعيار الفضة',
      content: 'نصاب الذهب (85 جراماً عيار 24) هو المعتمد لدى دار الإفتاء المصرية والمجامع الفقهية المعاصرة للعملات الورقية، نظراً لثبات قيمته الشرائية. بينما معيار الفضة (595 جراماً) يأخذ به بعض العلماء كأحوط للفقراء.'
    },
    combine_gold_cash: {
      title: 'حكم ضم الذهب إلى النقود لتكميل النصاب',
      content: 'ذهب جمهور الفقهاء (الحنفية والمالكية والحنابلة) إلى وجوب ضم الذهب إلى النقود وعروض التجارة بقيمتها المالية ليكمل بعضها بعضاً إذا كان المجموع يبلغ نصاب أحدهما، تحقيقاً لمصلحة الفقراء.'
    },
    fitr_cash_vs_grain: {
      title: 'إخراج زكاة الفطر نقداً أم طعاماً؟',
      content: 'الأصل في السنة إخراجها صاعاً من طعام (2.5 كجم تقريباً)، وأجاز الحنفية والعديد من دور الإفتاء المعاصرة (كمصر والأردن والمغرب) إخراج القيمة نقداً تيسيراً على الفقير لشراء ما يحتاجه يوم العيد.'
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none" dir="rtl">
      
      {/* 1. Header & Gold/Currency Settings Topbar */}
      <header className="shrink-0 bg-slate-900/90 backdrop-blur-md border-b border-emerald-900/50 px-3 sm:px-6 py-3.5 z-20 shadow-lg w-full">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 w-full max-w-[1700px] mx-auto">
          
          {/* Title & Brand Badge */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 via-emerald-600/30 to-amber-600/10 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <Coins className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif text-slate-100 tracking-wide">
                  حاسبة الزكاة الشاملة
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-medium">
                  نظام نِصاب الفقهي
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                حساب فقهي دقيق وفق ضوابط مجمع الفقه الإسلامي ودور الإفتاء
              </p>
            </div>
          </div>

          {/* Offline-First Gold & Currency Bar Widget */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-950/80 border border-emerald-900/40 rounded-2xl p-1.5 px-3 shadow-inner">
            
            {/* Currency selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">العملة:</span>
              <select
                value={currency.code}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="bg-slate-900 border border-slate-700/70 hover:border-amber-500/50 text-amber-300 text-xs font-semibold rounded-xl px-2.5 py-1.5 outline-none transition-colors cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200">
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* 24K Gold Price Input */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">ذهب 24:</span>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={goldPrice24}
                  onChange={(e) => handlePriceChange(e.target.value, silverPrice)}
                  className="w-20 bg-slate-900 border border-slate-700/70 focus:border-amber-400 text-amber-300 text-xs font-bold rounded-xl px-2 py-1.5 text-center outline-none transition-all"
                  placeholder="سعر 24"
                />
                <span className="text-[10px] text-slate-400 mr-1">{currency.symbol}/ج</span>
              </div>
            </div>

            {/* Auto-calculated 21K & 18K Price Badges */}
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-amber-400/90">
                21: {Math.round(derivedGold.price21)}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-amber-400/80">
                18: {Math.round(derivedGold.price18)}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* Silver Price Input */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">فضة:</span>
              <input
                type="number"
                min="0"
                step="any"
                value={silverPrice}
                onChange={(e) => handlePriceChange(goldPrice24, e.target.value)}
                className="w-16 bg-slate-900 border border-slate-700/70 focus:border-slate-400 text-slate-200 text-xs font-bold rounded-xl px-2 py-1.5 text-center outline-none transition-all"
                placeholder="فضة"
              />
              <span className="text-[10px] text-slate-400 mr-0.5">{currency.symbol}/ج</span>
            </div>

            {/* Fetch Live / Refresh Button */}
            <button
              onClick={handleFetchLivePrice}
              disabled={isFetchingPrice}
              title="تحديث الأسعار التقديرية عبر الإنترنت"
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-amber-400 border border-slate-700/60 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingPrice ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Status indicator */}
            {priceFetchStatus === 'success' && (
              <span className="text-[10px] text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Check className="w-3 h-3" /> تم التحديث
              </span>
            )}
            {priceFetchStatus === 'offline_fallback' && (
              <span className="text-[10px] text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                وضع أوفلاين
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-2 mt-3.5 border-t border-slate-800/80 pt-2.5 overflow-x-auto no-scrollbar w-full max-w-[1700px] mx-auto">
          {[
            { id: 'mal', label: 'زكاة المال والتجارة', icon: Banknote },
            { id: 'gold', label: 'زكاة الذهب والفضة', icon: Coins },
            { id: 'fitr', label: 'زكاة الفطر', icon: Wheat },
            { id: 'history', label: 'سجل الزكاة والتقارير', icon: History, count: historyLog.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all relative whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-amber-300 bg-gradient-to-r from-emerald-950/90 to-slate-900 border border-amber-500/40 shadow-md shadow-amber-950/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* 2. Main Content Body with Split Grid (Form vs. Live Receipt & Nisab Meter) */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-7 custom-scrollbar w-full min-w-0">
        <div className="w-full min-w-0 max-w-[1700px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-5 lg:gap-6 items-start">
          
          {/* Left Column (or Right in RTL): Active Tab Interactive Content */}
          <div className={`${activeTab === 'history' ? 'xl:col-span-12' : 'xl:col-span-7'} w-full min-w-0 space-y-5 lg:space-y-6`}>

            {/* TAB 1: زكاة المال وعروض التجارة */}
            {activeTab === 'mal' && (
              <motion.div
                key="tab-mal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Benchmark & Calendar Selectors Card */}
                <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-amber-400" />
                      <h2 className="text-sm font-bold text-slate-200">الضوابط الفقهية للحول والنصاب</h2>
                    </div>
                    <button
                      onClick={() => setActiveTooltip('nisab_standard')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>إرشاد فقهي</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Nisab Standard Toggle */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>معيار النصاب الشرعي:</span>
                        <span className="text-[11px] text-amber-400">
                          {nisabStandard === 'gold' ? '85 جم ذهب 24' : '595 جم فضة'}
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setNisabStandard('gold')}
                          className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            nisabStandard === 'gold'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          معيار الذهب (المعتمد)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNisabStandard('silver')}
                          className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            nisabStandard === 'silver'
                              ? 'bg-slate-700/60 text-slate-200 border border-slate-600 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          معيار الفضة (الأحوط)
                        </button>
                      </div>
                    </div>

                    {/* Calendar Type Toggle */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          نوع الحول:
                          <button
                            onClick={() => setActiveTooltip('gregorian_rate')}
                            className="text-slate-400 hover:text-amber-400"
                            title="لماذا تختلف النسبة؟"
                          >
                            <Info className="w-3 h-3" />
                          </button>
                        </span>
                        <span className="text-[11px] text-emerald-400 font-bold">
                          {calendarType === 'hijri' ? '2.5% (ربع العشر)' : '2.577% (سنوي شمسـي)'}
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setCalendarType('hijri')}
                          className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            calendarType === 'hijri'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          حول هجري (354 يوم)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalendarType('gregorian')}
                          className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            calendarType === 'gregorian'
                              ? 'bg-slate-700/60 text-slate-200 border border-slate-600 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          حول ميلادي (365 يوم)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zakatable Assets Inputs */}
                <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-slate-200">الأموال والموجودات الزكوية</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">القيم بـ ({currency.symbol})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Cash */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>السيولة النقدية والحسابات البنكية</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={cash}
                          onChange={(e) => setCash(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 text-sm font-bold rounded-xl px-3 py-2.5 outline-none transition-all"
                        />
                        <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-medium">{currency.symbol}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">نقد في اليد، ودائع، شهادات استثمار، حسابات جارية</span>
                    </div>

                    {/* Trade Goods */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>عروض التجارة (بضائع للبيع)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={tradeGoods}
                          onChange={(e) => setTradeGoods(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 text-sm font-bold rounded-xl px-3 py-2.5 outline-none transition-all"
                        />
                        <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-medium">{currency.symbol}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">تُقوّم بسعر السوق الحالي عند تمام الحول</span>
                    </div>

                    {/* Receivables */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>ديون لك مرجوة التحصيل</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={receivables}
                          onChange={(e) => setReceivables(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 text-sm font-bold rounded-xl px-3 py-2.5 outline-none transition-all"
                        />
                        <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-medium">{currency.symbol}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">ديون جيدة على مدينين قادرين على السداد</span>
                    </div>

                    {/* Investments & Stocks */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>الأسهم والاستثمارات المالية</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={investments}
                          onChange={(e) => setInvestments(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-slate-100 text-sm font-bold rounded-xl px-3 py-2.5 outline-none transition-all"
                        />
                        <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-medium">{currency.symbol}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">أسهم مضاربة (كامل القيمة) أو عوائد أسهم ثابتة</span>
                    </div>
                  </div>
                </div>

                {/* Deductions: Immediate Debts */}
                <div className="bg-slate-900/80 border border-rose-950/40 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-rose-400" />
                      <h3 className="text-sm font-bold text-slate-200">الخصوم: الديون والالتزامات الواجبة الخصم</h3>
                    </div>
                    <button
                      onClick={() => setActiveTooltip('immediate_debts')}
                      className="text-xs text-rose-300 hover:text-rose-200 flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>ما الذي يُخصم؟</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      إجمالي الديون الحالّة المستحقة السداد حالاً
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={debts}
                        onChange={(e) => setDebts(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 text-rose-300 text-sm font-bold rounded-xl px-3 py-2.5 outline-none transition-all"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-medium">{currency.symbol}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      الديون المستحقة عليك حالاً وتُطالب بسدادها قبل إخراج الزكاة (تُخصم من إجمالي المال)
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: زكاة الذهب والفضة */}
            {activeTab === 'gold' && (
              <motion.div
                key="tab-gold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Karat Normalization Card */}
                <div className="bg-slate-900/80 border border-amber-900/40 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <h2 className="text-sm font-bold text-slate-200">أوزان الذهب بمختلف العيارات (بالجرام)</h2>
                    </div>
                    <span className="text-xs text-amber-400 font-semibold">
                      نصاب الذهب: 85 جم خالص
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    {/* 24K */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-amber-300">عيار 24 (خالص)</label>
                      <input
                        type="number"
                        min="0"
                        value={goldWeights.w24}
                        onChange={(e) => setGoldWeights({ ...goldWeights, w24: e.target.value })}
                        placeholder="0 جم"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 text-sm font-bold rounded-xl px-2.5 py-2 text-center outline-none"
                      />
                    </div>

                    {/* 22K */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-amber-400/90">عيار 22</label>
                      <input
                        type="number"
                        min="0"
                        value={goldWeights.w22}
                        onChange={(e) => setGoldWeights({ ...goldWeights, w22: e.target.value })}
                        placeholder="0 جم"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 text-sm font-bold rounded-xl px-2.5 py-2 text-center outline-none"
                      />
                    </div>

                    {/* 21K */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-amber-400/80">عيار 21 (الأشهر)</label>
                      <input
                        type="number"
                        min="0"
                        value={goldWeights.w21}
                        onChange={(e) => setGoldWeights({ ...goldWeights, w21: e.target.value })}
                        placeholder="0 جم"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 text-sm font-bold rounded-xl px-2.5 py-2 text-center outline-none"
                      />
                    </div>

                    {/* 18K */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-amber-400/70">عيار 18</label>
                      <input
                        type="number"
                        min="0"
                        value={goldWeights.w18}
                        onChange={(e) => setGoldWeights({ ...goldWeights, w18: e.target.value })}
                        placeholder="0 جم"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 text-sm font-bold rounded-xl px-2.5 py-2 text-center outline-none"
                      />
                    </div>
                  </div>

                  {/* Calculated Pure Equivalent Banner */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">المعادل الصافي من الذهب عيار 24:</div>
                      <div className="text-lg font-bold text-amber-400">
                        {goldSilverResult.pureGoldGrams} <span className="text-xs font-normal">جراماً</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-slate-400">القيمة السوقية التقديرية:</div>
                      <div className="text-sm font-bold text-slate-200">
                        {goldSilverResult.goldTotalValue.toLocaleString()} {currency.symbol}
                      </div>
                    </div>
                  </div>

                  {/* Note on Women's personal jewelry */}
                  <div className="text-[11px] text-slate-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/30">
                    <span className="text-emerald-400 font-bold">تنبيه فقهي:</span> ذهب جمهور الفقهاء إلى أن الذهب المعد للزينة المعتادة للمرأة لا زكاة فيه، وتجب الزكاة فقط في الذهب المدخر أو المعد للتجارة والاستثمار، أو ما زاد عن العرف المعتاد للزينة.
                  </div>
                </div>

                {/* Option to combine gold with cash */}
                <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={combineWithCash}
                        onChange={(e) => setCombineWithCash(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-slate-200">
                        ضم قيمة الذهب إلى النقود لتكميل النصاب
                      </span>
                    </label>
                    <button
                      onClick={() => setActiveTooltip('combine_gold_cash')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>حكم الضم</span>
                    </button>
                  </div>

                  {combineWithCash && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-800">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-300">النقود الإضافية المضمومة</label>
                        <input
                          type="number"
                          min="0"
                          value={extraCash}
                          onChange={(e) => setExtraCash(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm font-bold rounded-xl px-3 py-2 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-300">الديون المستحقة للخصم</label>
                        <input
                          type="number"
                          min="0"
                          value={goldDebts}
                          onChange={(e) => setGoldDebts(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-950 border border-slate-800 text-rose-300 text-sm font-bold rounded-xl px-3 py-2 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Silver Section */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-slate-300" />
                      <h3 className="text-sm font-bold text-slate-200">زكاة الفضة (نصاب الفضة: 595 جرام)</h3>
                    </div>
                    <span className="text-xs text-slate-400">سعر الجرام: {silverPrice} {currency.symbol}</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">وزن الفضة المدخرة بالجرام</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={silverWeight}
                        onChange={(e) => setSilverWeight(e.target.value)}
                        placeholder="0 جرام"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-slate-400 text-slate-100 text-sm font-bold rounded-xl px-3 py-2.5 outline-none"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500">جرام</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: زكاة الفطر */}
            {activeTab === 'fitr' && (
              <motion.div
                key="tab-fitr"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Family Counter & Mode Switch */}
                <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-4 sm:p-5 shadow-lg space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Wheat className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-sm font-bold text-slate-200">بيانات الأسرة وطريقة الإخراج</h2>
                    </div>
                    <button
                      onClick={() => setActiveTooltip('fitr_cash_vs_grain')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>حكم إخراجها نقداً</span>
                    </button>
                  </div>

                  {/* Family Members Counter */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-sm font-bold text-slate-100">عدد أفراد الأسرة ومن تلزمك نفقتهم</div>
                      <div className="text-xs text-slate-400">عنك وعن زوجتك وأولادك ووالديك إن كانوا في نفقتك</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setFamilyMembers((prev) => Math.max(1, prev - 1))}
                        className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-200 flex items-center justify-center font-bold text-lg active:scale-95 transition-all cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xl font-bold font-serif text-amber-300 min-w-[2rem] text-center">
                        {familyMembers}
                      </span>
                      <button
                        onClick={() => setFamilyMembers((prev) => prev + 1)}
                        className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-200 flex items-center justify-center font-bold text-lg active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mode Toggle (Cash vs. Grain) */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">طريقة إخراج الزكاة:</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setFitrMode('cash')}
                        className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          fitrMode === 'cash'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span>نقداً (قيمة الصاع)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFitrMode('grain')}
                        className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          fitrMode === 'grain'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Wheat className="w-4 h-4" />
                        <span>حبوباً (صاع نبوي ~ 2.5 كجم)</span>
                      </button>
                    </div>
                  </div>

                  {/* Cash Mode Tiers */}
                  {fitrMode === 'cash' ? (
                    <div className="space-y-3 pt-2">
                      <div className="text-xs font-semibold text-slate-300">اختر فئة القيمة للفرد الواحد:</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'official', label: 'الحد الأدنى الرسمي', val: currency.code === 'EGP' ? 35 : currency.code === 'SAR' ? 25 : 10 },
                          { id: 'medium', label: 'فئة متوسطة', val: currency.code === 'EGP' ? 55 : currency.code === 'SAR' ? 40 : 15 },
                          { id: 'generous', label: 'فئة سخية (مستحب)', val: currency.code === 'EGP' ? 100 : currency.code === 'SAR' ? 60 : 25 },
                          { id: 'custom', label: 'مخصص يدوي', val: customFitrValue },
                        ].map((tier) => (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => setFitrCashTier(tier.id)}
                            className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                              fitrCashTier === tier.id
                                ? 'bg-emerald-900/30 border-amber-400 text-amber-300'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-[11px] text-slate-400">{tier.label}</div>
                            <div className="text-sm font-bold mt-1">
                              {tier.id === 'custom' ? `${customFitrValue} ${currency.symbol}` : `${tier.val} ${currency.symbol}`}
                            </div>
                          </button>
                        ))}
                      </div>

                      {fitrCashTier === 'custom' && (
                        <div className="pt-2">
                          <label className="text-xs text-slate-400">حدد القيمة النقدية للفرد:</label>
                          <input
                            type="number"
                            min="1"
                            value={customFitrValue}
                            onChange={(e) => setCustomFitrValue(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-amber-300 text-sm font-bold rounded-xl px-3 py-2 mt-1 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Grain Mode Equivalents Display */
                    <div className="space-y-3 pt-2">
                      <div className="text-xs font-semibold text-slate-300">
                        الأصناف المكافئة للصاع النبوي الشريف (2.5 كجم للفرد):
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {fitrResult.grainBreakdown.map((item, idx) => (
                          <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-slate-200">{item.name}</div>
                              <div className="text-[10px] text-slate-400">{item.note}</div>
                            </div>
                            <div className="text-base font-bold text-amber-400 font-serif">
                              {item.kg} <span className="text-xs font-sans text-slate-400">كجم</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 4: سجل الزكاة (Zakat History Log) */}
            {activeTab === 'history' && (
              <motion.div
                key="tab-history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-4 sm:p-5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-400" />
                      <h2 className="text-sm font-bold text-slate-200">سجل مدفوعات وحسابات الزكاة</h2>
                    </div>
                    <span className="text-xs text-slate-400">
                      {historyLog.length} عملية مسجلة
                    </span>
                  </div>

                  {historyLog.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 space-y-2">
                      <History className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                      <div className="text-sm font-semibold">لا توجد عمليات زكاة مسجلة بعد</div>
                      <p className="text-xs text-slate-400">
                        يمكنك حساب الزكاة من الأقسام بالأعلى ثم الضغط على "حفظ في سجل الزكاة"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {historyLog.map((log) => (
                        <div
                          key={log.id}
                          className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 hover:border-emerald-800/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-300">{log.type}</span>
                              <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                                {log.dateFormatted}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400">
                              {log.netWealth && `صافي المال: ${log.netWealth.toLocaleString()} ${log.currency} • `}
                              {log.calendar && `الحول: ${log.calendar}`}
                              {log.members && `أفراد الأسرة: ${log.members} فرد`}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0">
                            <div className="text-left">
                              <div className="text-[10px] text-emerald-400">مقدار الزكاة</div>
                              <div className="text-base font-bold text-emerald-300 font-serif">
                                {typeof log.amount === 'number' ? log.amount.toLocaleString() : log.amount}{' '}
                                <span className="text-xs">{log.currency}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setHistoryLog(deleteZakatHistoryEntry(log.id))}
                              title="حذف من السجل"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </div>

          {/* Right Column (or Left in RTL): Sticky Interactive Nisab Meter & Breakdown Receipt */}
          {activeTab !== 'history' && (
            <div className="xl:col-span-5 w-full min-w-0 space-y-5 xl:sticky xl:top-4">
            
            {/* Visual Interactive "Nisab Meter" Gauge Card (مؤشر بلوغ النصاب التفاعلي) */}
            <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-emerald-950/40 border border-amber-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              
              {/* Background ambient glow */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-bold text-slate-200">مؤشر بلوغ النصاب الشرعي</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                  {currency.code}
                </span>
              </div>

              {/* Dynamic status badge */}
              <div className="mb-4">
                {activeTab === 'mal' && (
                  malResult.isNisabReached ? (
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-amber-950/80 border border-amber-400/50 flex items-center gap-3 shadow-lg"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-300">بلغ المال النصاب الشرعي - وجبت الزكاة</div>
                        <div className="text-[11px] text-emerald-200/80">حق الله وحق الفقراء والمساكين في مالك</div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-300">لم يبلغ المال النصاب بعد - لا زكاة عليك</div>
                        <div className="text-[11px] text-slate-400">النصاب المطلوب: {malResult.nisabThreshold.toLocaleString()} {currency.symbol}</div>
                      </div>
                    </div>
                  )
                )}

                {activeTab === 'gold' && (
                  goldSilverResult.isGoldZakatable ? (
                    <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-400/40 flex items-center gap-3">
                      <Coins className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-amber-300">بلغ الذهب النصاب الشرعي (85 جم)</div>
                        <div className="text-[11px] text-amber-200/70">تجب الزكاة بمقدار ربع العشر</div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-300">وزن الذهب أقل من 85 جم خالص</div>
                        <div className="text-[11px] text-slate-400">الوزن الحالي: {goldSilverResult.pureGoldGrams} جم من 85 جم</div>
                      </div>
                    </div>
                  )
                )}

                {activeTab === 'fitr' && (
                  <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-3">
                    <Wheat className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-300">زكاة الفطر واجبة على كل فرد</div>
                      <div className="text-[11px] text-emerald-200/70">طهرة للصائم وطعمة للمساكين قبل صلاة العيد</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Gauge Bar */}
              {activeTab === 'mal' && (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">نسبة بلوغ النصاب:</span>
                    <span className="text-amber-400 font-bold">{malResult.actualRatio}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, malResult.nisabPercentage)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full transition-all ${
                        malResult.isNisabReached
                          ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-300 shadow-md shadow-amber-500/30'
                          : 'bg-emerald-600/70'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>0 {currency.symbol}</span>
                    <span>نصاب: {malResult.nisabThreshold.toLocaleString()} {currency.symbol}</span>
                  </div>
                </div>
              )}

              {/* Animated Due Amount Display */}
              <div className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 rounded-2xl p-4 sm:p-5 border border-emerald-500/30 text-center relative overflow-hidden shadow-xl">
                <span className="text-xs sm:text-sm font-bold text-emerald-300 block mb-2 tracking-wide" style={{ color: '#6ee7b7' }}>
                  إجمالي مقدار الزكاة الواجب إخراجها
                </span>
                
                <div
                  className="text-3xl sm:text-4xl font-extrabold font-serif text-amber-300 py-1"
                  style={{ color: '#fcd34d', textShadow: '0 0 20px rgba(245, 158, 11, 0.25)' }}
                >
                  {activeTab === 'mal' && malResult.zakatDue.toLocaleString()}
                  {activeTab === 'gold' && goldSilverResult.totalZakatCashDue.toLocaleString()}
                  {activeTab === 'fitr' && (fitrMode === 'cash' ? fitrResult.totalCashDue.toLocaleString() : `${fitrResult.totalKgDue} كجم`)}
                  {activeTab === 'history' && '0'}
                  {' '}
                  <span className="text-base font-sans font-bold text-amber-400" style={{ color: '#fbbf24' }}>
                    {activeTab === 'fitr' && fitrMode === 'grain' ? '' : currency.symbol}
                  </span>
                </div>

                {activeTab === 'gold' && goldSilverResult.goldZakatGramsDue > 0 && (
                  <div className="text-xs text-amber-300 font-semibold mt-2" style={{ color: '#fcd34d' }}>
                    أو عيناً: {goldSilverResult.goldZakatGramsDue} جرام ذهب عيار 24
                  </div>
                )}
              </div>

              {/* Action Buttons: Save & Copy */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={handleSaveToLog}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ في السجل</span>
                </button>
                <button
                  onClick={handleCopyReceipt}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReceipt ? 'تم النسخ!' : 'نسخ الملخص'}</span>
                </button>
              </div>

              {/* Toast message notification */}
              <AnimatePresence>
                {saveToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-3 p-2 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs text-center font-bold"
                  >
                    {saveToast}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step-by-Step Zakat Breakdown Receipt Card (ملخص الحساب) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-300">تفاصيل الحسبة خطوة بخطوة</h3>
              </div>

              {activeTab === 'mal' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>إجمالي الأصول والموجودات:</span>
                    <span className="font-bold">{malResult.totalAssets.toLocaleString()} {currency.symbol}</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>(-) الديون الحالّة والالتزامات:</span>
                    <span className="font-bold">{malResult.debts.toLocaleString()} {currency.symbol}</span>
                  </div>
                  <div className="h-px bg-slate-800 my-1" />
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>(=) صافي المال الخاضع للزكاة:</span>
                    <span>{malResult.netZakatableWealth.toLocaleString()} {currency.symbol}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>قيمة النصاب الشرعي:</span>
                    <span>{malResult.nisabThreshold.toLocaleString()} {currency.symbol}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>نسبة الزكاة المطبقة:</span>
                    <span className="text-emerald-400 font-bold">{malResult.ratePercentageText}</span>
                  </div>
                </div>
              )}

              {activeTab === 'gold' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>الذهب الخالص المعادل:</span>
                    <span className="font-bold">{goldSilverResult.pureGoldGrams} جم</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>قيمة الذهب السوقية:</span>
                    <span className="font-bold">{goldSilverResult.goldTotalValue.toLocaleString()} {currency.symbol}</span>
                  </div>
                  {goldSilverResult.silverGrams > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>الفضة المدخرة ({goldSilverResult.silverGrams} جم):</span>
                      <span className="font-bold">{goldSilverResult.silverTotalValue.toLocaleString()} {currency.symbol}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>نصاب الذهب (85 جم):</span>
                    <span className={goldSilverResult.isGoldNisabReachedAlone ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {goldSilverResult.isGoldNisabReachedAlone ? 'متحقق' : 'غير متحقق'}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'fitr' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>عدد الأفراد المشمولين:</span>
                    <span className="font-bold">{familyMembers} فرد</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>طريقة الحساب:</span>
                    <span className="font-bold">{fitrMode === 'cash' ? 'نقداً' : 'صاع حبوب'}</span>
                  </div>
                  {fitrMode === 'cash' && (
                    <div className="flex justify-between text-slate-400">
                      <span>القيمة للفرد الواحد:</span>
                      <span>{fitrResult.valuePerPerson} {currency.symbol}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Fiqh Guidelines Card */}
            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-2xl p-3.5 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>شروط وجوب الزكاة:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400 mr-1">
                <li>الملك التام للمال وحرية التصرف فيه.</li>
                <li>بلوغ المال النصاب الشرعي المحدد.</li>
                <li>مرور حول كامل (عام هجري أو ميلادي) على المال بعد بلوغ النصاب.</li>
                <li>أن يكون المال زائداً عن الحاجات الأساسية الأصلية للمسلم.</li>
              </ul>
            </div>

            </div>
          )}

        </div>
      </div>

      {/* 3. Fiqh Educational Modal Popover */}
      <AnimatePresence>
        {activeTooltip && FIQH_TIPS[activeTooltip] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-slate-100 font-serif">
                  {FIQH_TIPS[activeTooltip].title}
                </h3>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {FIQH_TIPS[activeTooltip].content}
              </p>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTooltip(null)}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  فهمت ذلك
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
