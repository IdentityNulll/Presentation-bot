import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Key, Sliders, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    AI_PROVIDER: 'local',
    GEMINI_API_KEY: '',
    OPENROUTER_API_KEY: '',
    OPENROUTER_MODEL: 'google/gemini-2.5-flash',
    FREE_LIMIT_PRESENTATIONS: '5',
    FREE_LIMIT_EXPORTS: '10'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(prev => ({ ...prev, ...data }));
      } catch (err) {
        setStatus({ type: 'error', message: 'Failed to retrieve system settings.' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      await api.updateSettings(settings);
      setStatus({ type: 'success', message: 'System configurations saved successfully!' });
      
      // Re-fetch to display masked keys correctly
      const data = await api.getSettings();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">System Configuration</h2>
        <p className="text-sm text-slate-400">Configure active AI providers, API access tokens, and user thresholds</p>
      </div>

      {status.message && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${
          status.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
            : 'bg-rose-500/15 border-rose-500/25 text-rose-400'
        }`}>
          {status.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: AI Provider */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/60 space-y-4">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="h-5 w-5 text-blue-500" />
            AI Generation Engine Settings
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
                Active AI Provider
              </label>
              <select
                name="AI_PROVIDER"
                value={settings.AI_PROVIDER}
                onChange={handleChange}
                className="w-full glass-input cursor-pointer"
              >
                <option value="local">Local Template Fallback (No Keys Required)</option>
                <option value="gemini">Gemini Developer API</option>
                <option value="openrouter">OpenRouter API Portal</option>
              </select>
              <p className="text-[10px] text-slate-500 pl-1 leading-normal">
                If the selected provider is unreachable or return errors, SlidePaw automatically defaults to the Local Template Fallback.
              </p>
            </div>

            {settings.AI_PROVIDER === 'openrouter' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
                  OpenRouter Model Selected
                </label>
                <input
                  type="text"
                  name="OPENROUTER_MODEL"
                  value={settings.OPENROUTER_MODEL}
                  onChange={handleChange}
                  placeholder="google/gemini-2.5-flash"
                  className="w-full glass-input"
                />
                <p className="text-[10px] text-slate-500 pl-1">
                  Enter model identifier string (e.g. google/gemini-2.5-flash or anthropic/claude-3-haiku).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Keys */}
        {settings.AI_PROVIDER !== 'local' && (
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/60 space-y-4">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Key className="h-5 w-5 text-blue-500" />
              API Key Authentication
            </h4>

            <div className="bg-blue-500/10 border border-blue-500/25 p-3 rounded-xl flex items-start gap-2.5 text-xs text-blue-400 leading-normal mb-4">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>
                To secure keys, existing strings are masked (e.g. ••••••••). Re-entering a value will overwrite it. Leaving masked strings untouched keeps them unchanged in the database.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settings.AI_PROVIDER === 'gemini' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    name="GEMINI_API_KEY"
                    value={settings.GEMINI_API_KEY}
                    onChange={handleChange}
                    placeholder="AIzaSy..."
                    className="w-full glass-input"
                  />
                </div>
              )}

              {settings.AI_PROVIDER === 'openrouter' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
                    OpenRouter API Key
                  </label>
                  <input
                    type="password"
                    name="OPENROUTER_API_KEY"
                    value={settings.OPENROUTER_API_KEY}
                    onChange={handleChange}
                    placeholder="sk-or-..."
                    className="w-full glass-input"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Limits */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/60 space-y-4">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <SettingsIcon className="h-5 w-5 text-blue-500" />
            User Usage Limits (Free Accounts)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
                Max Presentations per User
              </label>
              <input
                type="number"
                name="FREE_LIMIT_PRESENTATIONS"
                value={settings.FREE_LIMIT_PRESENTATIONS}
                onChange={handleChange}
                min="1"
                className="w-full glass-input"
              />
              <p className="text-[10px] text-slate-500 pl-1">
                Total slideshow projects a standard user is permitted to generate.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
                Max Exports per User
              </label>
              <input
                type="number"
                name="FREE_LIMIT_EXPORTS"
                value={settings.FREE_LIMIT_EXPORTS}
                onChange={handleChange}
                min="1"
                className="w-full glass-input"
              />
              <p className="text-[10px] text-slate-500 pl-1">
                Total exports (PDF/PPTX/MD) allowed for free users before restrictions apply.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-8 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
