import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Lightbulb, Users, Palette, Rocket,
  GraduationCap, Briefcase, DollarSign, Globe, BookOpen,
  Loader2
} from 'lucide-react';
import api from '../utils/api';
import { showBackButton, hapticFeedback } from '../utils/telegram';
import ThemePicker from '../components/ThemePicker';

const AUDIENCES = [
  { key: 'Students', icon: GraduationCap, color: '#6366f1' },
  { key: 'Teachers', icon: BookOpen, color: '#8b5cf6' },
  { key: 'Business', icon: Briefcase, color: '#3b82f6' },
  { key: 'Investors', icon: DollarSign, color: '#10b981' },
  { key: 'General', icon: Globe, color: '#f59e0b' },
];

const STEPS = ['topic', 'title', 'audience', 'style', 'generating'];

export default function CreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState(searchParams.get('title') || '');
  const [audience, setAudience] = useState(searchParams.get('audience') || '');
  const [style, setStyle] = useState('professional');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // If we have params from the bot, skip ahead
  useEffect(() => {
    if (searchParams.get('title')) {
      setStep(0); // still ask for topic
    }
  }, [searchParams]);

  // Telegram back button
  useEffect(() => {
    const cleanup = showBackButton(() => {
      if (step > 0 && !generating) {
        hapticFeedback('impact', 'light');
        setStep(step - 1);
      } else {
        navigate('/');
      }
    });
    return cleanup;
  }, [step, generating, navigate]);

  function nextStep() {
    hapticFeedback('impact', 'light');
    setStep(step + 1);
  }

  async function handleGenerate() {
    setStep(4); // generating step
    setGenerating(true);
    setError(null);
    hapticFeedback('notification', 'success');

    try {
      const result = await api.generatePresentation({
        topic,
        title: title || `A Deep Dive into ${topic}`,
        audience,
        style,
      });
      navigate(`/editor/${result.presentation._id}`);
    } catch (err) {
      setError(err.message);
      setGenerating(false);
      setStep(3); // go back to style step
      hapticFeedback('notification', 'error');
    }
  }

  const progress = ((step + 1) / 5) * 100;

  return (
    <div className="flex flex-col min-h-screen min-h-dvh safe-bottom">
      {/* Header */}
      <header className="glass-panel px-5 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (step > 0 && !generating ? setStep(step - 1) : navigate('/'))}
            className="w-9 h-9 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-white">
              New Presentation
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
              Step {Math.min(step + 1, 4)} of 4
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

      {/* Content */}
      <main className="flex-1 px-5 py-6 overflow-y-auto">
        {/* Step 1: Topic */}
        {step === 0 && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">What's the Topic?</h2>
                <p className="text-xs text-slate-500">
                  Describe what your presentation is about
                </p>
              </div>
            </div>

            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Artificial Intelligence in Healthcare, Climate Change Solutions, Startup Fundraising..."
              className="glass-input w-full h-32 resize-none"
              autoFocus
            />

            <button
              onClick={nextStep}
              disabled={!topic.trim()}
              className="btn-primary w-full mt-6"
            >
              Continue
              <Rocket className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Title */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Presentation Title</h2>
                <p className="text-xs text-slate-500">
                  Give it a catchy title (or we'll auto-generate one)
                </p>
              </div>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`A Deep Dive into ${topic || '...'}`}
              className="glass-input"
              autoFocus
            />

            <p className="text-[11px] text-slate-600 mt-2">
              Leave blank for an AI-generated title
            </p>

            <button onClick={nextStep} className="btn-primary w-full mt-6">
              Continue
              <Rocket className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: Audience */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Target Audience</h2>
                <p className="text-xs text-slate-500">
                  Who will be viewing this deck?
                </p>
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

            <button
              onClick={nextStep}
              disabled={!audience}
              className="btn-primary w-full mt-6"
            >
              Continue
              <Rocket className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 4: Style/Theme */}
        {step === 3 && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Palette className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Choose a Style</h2>
                <p className="text-xs text-slate-500">
                  Pick a design theme for your slides
                </p>
              </div>
            </div>

            <ThemePicker selected={style} onSelect={setStyle} />

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            <button onClick={handleGenerate} className="btn-primary w-full mt-6">
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </button>
          </div>
        )}

        {/* Step 5: Generating */}
        {step === 4 && (
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
              Generating Your Deck...
            </h2>
            <p className="text-sm text-slate-400 text-center max-w-[250px]">
              AI is crafting your slides with {audience.toLowerCase()} audience in mind
            </p>

            <div className="mt-8 w-full max-w-[200px]">
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-[skeleton-shimmer_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
