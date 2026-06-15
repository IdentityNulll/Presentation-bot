import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { getTelegramUser, hapticFeedback } from '../utils/telegram';
import LoadingSpinner from '../components/LoadingSpinner';

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const user = getTelegramUser();

  useEffect(() => {
    async function fetchPresentation() {
      try {
        setLoading(true);
        const data = await api.getPresentation(id);
        setPresentation(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPresentation();
  }, [id]);

  async function handleSave() {
    if (!presentation) return;
    try {
      hapticFeedback('impact', 'light');
      setSaving(true);
      await api.updatePresentation(id, presentation);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setPresentation(prev => ({ ...prev, [name]: value }));
  }

  if (loading) return <LoadingSpinner text="Loading presentation..." />;

  return (
    <div className="flex flex-col min-h-screen safe-bottom">
      {/* Header */}
      <header className="glass-panel px-5 py-4 border-b border-slate-800/50 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <h1 className="text-lg font-bold text-white">Edit Presentation</h1>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save
        </button>
      </header>

      {/* Body */}
      <main className="flex-1 p-4 overflow-y-auto">
        {error && <p className="text-red-400 mb-4">{error}</p>}
        {presentation && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
              <input
                name="title"
                value={presentation.title || ''}
                onChange={handleChange}
                className="w-full rounded bg-slate-800/60 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Presentation title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Audience</label>
              <input
                name="audience"
                value={presentation.audience || ''}
                onChange={handleChange}
                className="w-full rounded bg-slate-800/60 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Target audience"
              />
            </div>
            {/* Additional fields can be added here */}
          </div>
        )}
      </main>
    </div>
  );
}
