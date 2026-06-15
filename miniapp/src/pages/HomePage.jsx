import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, FolderOpen, Presentation, Zap } from 'lucide-react';
import api from '../utils/api';
import { getTelegramUser, hapticFeedback, getStartParams } from '../utils/telegram';
import PresentationCard from '../components/PresentationCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomePage() {
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = getTelegramUser();

  // Check for start params (deep link from bot)
  useEffect(() => {
    const params = getStartParams();
    if (params.action === 'new' && params.title) {
      navigate(`/create?title=${encodeURIComponent(params.title)}&audience=${encodeURIComponent(params.audience || 'General')}`);
      return;
    }
    if (params.action === 'edit' && params.presId) {
      navigate(`/editor/${params.presId}`);
      return;
    }
  }, [navigate]);

  useEffect(() => {
    loadPresentations();
  }, []);

  async function loadPresentations() {
    try {
      setLoading(true);
      const data = await api.getPresentations();
      setPresentations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    hapticFeedback('impact', 'light');
    navigate('/create');
  }

  function handleOpen(id) {
    hapticFeedback('impact', 'light');
    navigate(`/editor/${id}`);
  }

  return (
    <div className="flex flex-col min-h-screen min-h-dvh safe-bottom">
      {/* Header */}
      <header className="glass-panel px-5 py-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Presentation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">SlidePaw</h1>
              <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold">
                AI Presentations
              </p>
            </div>
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold border border-indigo-400/30">
              {(user.first_name || 'U').charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-5 overflow-y-auto">
        {/* Create New CTA */}
        <button
          onClick={handleCreate}
          className="w-full mb-6 p-5 rounded-2xl border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all duration-300 group active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-shadow">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                New Presentation
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                AI-powered slide generation in seconds
              </p>
            </div>
          </div>
        </button>

        {/* Presentations List */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-indigo-400" />
            Your Presentations
          </h2>
          {presentations.length > 0 && (
            <span className="badge bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              {presentations.length}
            </span>
          )}
        </div>

        {loading ? (
          <LoadingSpinner text="Loading your decks..." />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button onClick={loadPresentations} className="btn-secondary text-xs">
              Retry
            </button>
          </div>
        ) : presentations.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center">
              <Zap className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 font-medium">
              No presentations yet
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Tap "New Presentation" to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {presentations.map((pres) => (
              <PresentationCard
                key={pres._id}
                presentation={pres}
                onClick={() => handleOpen(pres._id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
