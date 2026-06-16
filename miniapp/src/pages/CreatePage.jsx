import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Lightbulb, Users, Palette, Rocket,
  GraduationCap, Briefcase, DollarSign, Globe, BookOpen,
  Loader2, ChevronLeft, ChevronRight, CheckCircle2, MessageSquare
} from 'lucide-react';
import api from '../utils/api';
import { showBackButton, hapticFeedback } from '../utils/telegram';
import ThemePicker, { THEMES } from '../components/ThemePicker';
import SlidePreview from '../components/SlidePreview';

const AUDIENCES = [
  { key: 'Students', icon: GraduationCap, color: '#6366f1' },
  { key: 'Teachers', icon: BookOpen, color: '#8b5cf6' },
  { key: 'Business', icon: Briefcase, color: '#3b82f6' },
  { key: 'Investors', icon: DollarSign, color: '#10b981' },
  { key: 'General', icon: Globe, color: '#f59e0b' },
];

const UI_TEXTS = {
  en: {
    new_pres: "New Presentation",
    step: "Step",
    of: "of",
    topic_q: "What's the Topic?",
    topic_desc: "Describe what your presentation is about",
    topic_placeholder: "e.g. Artificial Intelligence in Healthcare, Climate Change Solutions, Startup Fundraising...",
    title_q: "Presentation Title",
    title_desc: "Give it a catchy title (or we'll auto-generate one)",
    title_placeholder: "A Deep Dive into {topic}",
    title_note: "Leave blank for an AI-generated title",
    audience_q: "Target Audience",
    audience_desc: "Who will be viewing this deck?",
    continue: "Continue",
    choose_style: "Choose a Style",
    choose_style_desc: "Preview your actual slides in different styles",
    generating_title: "Generating Your Deck...",
    generating_desc: "AI is crafting 8-10 slides with professional content, 3 plans, and Q&A...",
    confirm_and_pay: "Confirm Style & Pay",
    payment_title: "Payment Verification",
    payment_desc: "To unlock your presentation, please complete the payment in the Telegram bot chat. Send a screenshot or photo of your receipt there.",
    payment_card: "Card Number:",
    payment_amount: "Amount:",
    close_app: "Close & Go to Chat",
    preview_deck: "Slide {current} of {total}",
    nav_back: "Back",
    confirm_and_pay_subtitle: "Price: 49,000 UZS"
  },
  ru: {
    new_pres: "Новая презентация",
    step: "Шаг",
    of: "из",
    topic_q: "Какая тема?",
    topic_desc: "Опишите, о чем ваша презентация",
    topic_placeholder: "Например: Искусственный интеллект в медицине, Изменение климата, Привлечение инвестиций...",
    title_q: "Название презентации",
    title_desc: "Придумайте название (или мы создадим его автоматически)",
    title_placeholder: "Глубокий анализ {topic}",
    title_note: "Оставьте пустым для автогенерации",
    audience_q: "Целевая аудитория",
    audience_desc: "Кто будет смотреть эту презентацию?",
    continue: "Продолжить",
    choose_style: "Выберите стиль",
    choose_style_desc: "Просмотрите слайды вашей презентации в разных стилях",
    generating_title: "Создание презентации...",
    generating_desc: "ИИ разрабатывает 8-10 слайдов с профессиональным текстом, 3 планами и Q&A...",
    confirm_and_pay: "Подтвердить стиль и оплатить",
    payment_title: "Подтверждение оплаты",
    payment_desc: "Для разблокировки презентации, пожалуйста, завершите оплату в чате Телеграм-бота и отправьте туда скриншот или фото чека.",
    payment_card: "Номер карты:",
    payment_amount: "Сумма:",
    close_app: "Закрыть и перейти в чат",
    preview_deck: "Слайд {current} из {total}",
    nav_back: "Назад",
    confirm_and_pay_subtitle: "Цена: 49,000 UZS"
  },
  uz: {
    new_pres: "Yangi taqdimot",
    step: "Bosqich",
    of: "dan",
    topic_q: "Mavzu nima?",
    topic_desc: "Taqdimotingiz nima haqida ekanligini tasvirlab bering",
    topic_placeholder: "Masalan: Tibbiyotda sun'iy intellekt, Iqlim o'zgarishi, Investitsiya jalb qilish...",
    title_q: "Taqdimot nomi",
    title_desc: "Mavzuga mos nom kiriting (yoki AI tomonidan yaratiladi)",
    title_placeholder: "{topic} bo'yicha batafsil taqdimot",
    title_note: "AI tomonidan avtomatik yaratish uchun bo'sh qoldiring",
    audience_q: "Maqsadli auditoriya",
    audience_desc: "Ushbu taqdimotni kimlar ko'radi?",
    continue: "Davom etish",
    choose_style: "Uslubni tanlang",
    choose_style_desc: "Slaydlaringizni turli dizaynlarda ko'ring",
    generating_title: "Taqdimot yaratilmoqda...",
    generating_desc: "AI 8-10 professional slayd, 3 ta reja va Savol-Javob tayyorlamoqda...",
    confirm_and_pay: "Uslubni tasdiqlash va to'lash",
    payment_title: "To'lovni tasdiqlash",
    payment_desc: "Taqdimotni blokdan ochish uchun, iltimos, to'lovni Telegram bot chatida yakunlang va u yerga to'lov chekining skrinshotini yuboring.",
    payment_card: "Karta raqami:",
    payment_amount: "Summa:",
    close_app: "Yopish va chatga o'tish",
    preview_deck: "Slayd {current} / {total}",
    nav_back: "Orqaga",
    confirm_and_pay_subtitle: "Narxi: 49,000 UZS"
  }
};

export default function CreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Wizard steps: 0=Topic, 1=Title, 2=Audience, 3=Generating, 4=StyleSelection, 5=PaymentInstructions
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState(searchParams.get('title') || '');
  const [audience, setAudience] = useState(searchParams.get('audience') || '');
  const [style, setStyle] = useState('professional');
  const [language, setLanguage] = useState('en');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Generated deck details for preview
  const [presentationId, setPresentationId] = useState(null);
  const [slides, setSlides] = useState([]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [submittingStyle, setSubmittingStyle] = useState(false);

  // Load user language preference at start
  useEffect(() => {
    async function loadUser() {
      try {
        const user = await api.getUserInfo();
        if (user && user.language) {
          setLanguage(user.language);
        }
      } catch (err) {
        console.error("Failed to load user info:", err);
      }
    }
    loadUser();
  }, []);

  // If we have params from the bot, skip ahead
  useEffect(() => {
    if (searchParams.get('title')) {
      setStep(0); // still ask for topic
    }
  }, [searchParams]);

  // Telegram back button handling
  useEffect(() => {
    const cleanup = showBackButton(() => {
      if (step > 0 && step !== 3 && step !== 5) {
        hapticFeedback('impact', 'light');
        setStep(prev => (prev === 4 ? 2 : prev - 1));
      } else {
        navigate('/');
      }
    });
    return cleanup;
  }, [step, navigate]);

  const t = UI_TEXTS[language] || UI_TEXTS.en;

  function nextStep() {
    hapticFeedback('impact', 'light');
    setStep(step + 1);
  }

  async function handleGenerate() {
    setStep(3); // showing generating screen
    setGenerating(true);
    setError(null);
    hapticFeedback('notification', 'success');

    try {
      const result = await api.generatePresentation({
        topic,
        title: title || t.title_placeholder.replace('{topic}', topic),
        audience,
        style: 'professional', // Generate initially with professional style
      });

      setPresentationId(result.presentation._id);
      setSlides(result.slides);
      setActiveSlideIdx(0);
      setGenerating(false);
      setStep(4); // Advance to style selection preview
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setGenerating(false);
      setStep(2); // Go back to audience step
      hapticFeedback('notification', 'error');
    }
  }

  async function handleConfirmStyle() {
    setSubmittingStyle(true);
    setError(null);
    hapticFeedback('impact', 'medium');

    try {
      await api.selectStyle(presentationId, style);
      hapticFeedback('notification', 'success');
      setStep(5); // Show payment instructions screen
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      hapticFeedback('notification', 'error');
    } finally {
      setSubmittingStyle(false);
    }
  }

  function handleCloseApp() {
    hapticFeedback('impact', 'light');
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    } else {
      navigate('/');
    }
  }

  // Calculate current progress percentage
  const totalSteps = 6;
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="flex flex-col min-h-screen min-h-dvh safe-bottom">
      {/* Header */}
      {step !== 3 && step !== 5 && (
        <header className="glass-panel px-5 py-4 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (step > 0) {
                  setStep(prev => (prev === 4 ? 2 : prev - 1));
                } else {
                  navigate('/');
                }
              }}
              className="w-9 h-9 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <h1 className="text-base font-bold text-white">
                {t.new_pres}
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                {t.step} {Math.min(step + 1, 4)} {t.of} 4
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 px-5 py-6 overflow-y-auto">
        {/* Step 0: Topic */}
        {step === 0 && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t.topic_q}</h2>
                <p className="text-xs text-slate-500">{t.topic_desc}</p>
              </div>
            </div>

            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.topic_placeholder}
              className="glass-input w-full h-32 resize-none"
              autoFocus
            />

            <button
              onClick={nextStep}
              disabled={!topic.trim()}
              className="btn-primary w-full mt-6"
            >
              {t.continue}
              <Rocket className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 1: Title */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t.title_q}</h2>
                <p className="text-xs text-slate-500">{t.title_desc}</p>
              </div>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.title_placeholder.replace('{topic}', topic || '...')}
              className="glass-input"
              autoFocus
            />

            <p className="text-[11px] text-slate-600 mt-2">
              {t.title_note}
            </p>

            <button onClick={nextStep} className="btn-primary w-full mt-6">
              {t.continue}
              <Rocket className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Audience */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t.audience_q}</h2>
                <p className="text-xs text-slate-500">{t.audience_desc}</p>
              </div>
            </div>

            <div className="space-y-2">
              {AUDIENCES.map((aud) => {
                const Icon = aud.icon;
                const isSelected = audience === aud.key;
                return (
                  <button
                    key={aud.key}
                    onClick={() => {
                      setAudience(aud.key);
                      hapticFeedback('selection');
                    }}
                    className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all duration-200 border ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/40'
                        : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: `${aud.color}15`,
                        border: `1px solid ${aud.color}30`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: aud.color }} />
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {aud.key}
                    </span>
                    {isSelected && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!audience}
              className="btn-primary w-full mt-6"
            >
              {t.continue}
              <Rocket className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: Generating Spinner */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center animate-pulse-glow">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              {t.generating_title}
            </h2>
            <p className="text-sm text-slate-400 text-center max-w-[280px]">
              {t.generating_desc}
            </p>

            <div className="mt-8 w-full max-w-[200px]">
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-[skeleton-shimmer_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Style Selection and Preview */}
        {step === 4 && (
          <div className="animate-slide-up space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Palette className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t.choose_style}</h2>
                <p className="text-xs text-slate-500">{t.choose_style_desc}</p>
              </div>
            </div>

            {/* Slides Preview Slider */}
            {slides.length > 0 && (
              <div className="space-y-3">
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-slate-950">
                  <SlidePreview
                    slide={slides[activeSlideIdx]}
                    theme={THEMES[style.toLowerCase()] || THEMES.professional}
                  />
                </div>

                {/* Slider Navigation Controls */}
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={() => {
                      hapticFeedback('selection');
                      setActiveSlideIdx(prev => (prev > 0 ? prev - 1 : slides.length - 1));
                    }}
                    className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-semibold text-slate-400">
                    {t.preview_deck.replace('{current}', activeSlideIdx + 1).replace('{total}', slides.length)}
                  </span>

                  <button
                    onClick={() => {
                      hapticFeedback('selection');
                      setActiveSlideIdx(prev => (prev < slides.length - 1 ? prev + 1 : 0));
                    }}
                    className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Theme Picker */}
            <div className="pt-2">
              <ThemePicker selected={style} onSelect={setStyle} />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleConfirmStyle}
              disabled={submittingStyle}
              className="btn-primary w-full mt-2"
            >
              {submittingStyle ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {t.confirm_and_pay}
            </button>
            <p className="text-center text-[11px] text-slate-500">
              {t.confirm_and_pay_subtitle}
            </p>
          </div>
        )}

        {/* Step 5: Payment Instructions */}
        {step === 5 && (
          <div className="flex flex-col items-center justify-center py-10 animate-fade-in space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>

            <div className="text-center space-y-2 max-w-[300px]">
              <h2 className="text-xl font-bold text-white">
                {t.payment_title}
              </h2>
              <p className="text-sm text-slate-400">
                {t.payment_desc}
              </p>
            </div>

            <div className="w-full glass-card p-4 space-y-3 max-w-[300px] border border-white/5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">{t.payment_card}</span>
                <span className="font-semibold text-slate-200 select-all font-mono">8600 1234 5678 9012</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">{t.payment_amount}</span>
                <span className="font-bold text-indigo-400">49,000 UZS</span>
              </div>
            </div>

            <button
              onClick={handleCloseApp}
              className="btn-primary w-full max-w-[300px]"
            >
              {t.close_app}
              <Rocket className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
