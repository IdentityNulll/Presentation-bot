import React, { useEffect, useState } from 'react';
import { Search, Presentation, Trash2, Eye, Loader2, X, FileText, CornerDownRight } from 'lucide-react';
import api from '../utils/api';

export default function Presentations() {
  const [presentations, setPresentations] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });
  const [loading, setLoading] = useState(true);

  // Inspector State
  const [activePres, setActivePres] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchPresentations = async () => {
    setLoading(true);
    try {
      const data = await api.getPresentations(search, page);
      setPresentations(data.presentations);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresentations();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPresentations();
  };

  const handleDeletePres = async (presId) => {
    const confirmation = window.confirm('Are you sure you want to permanently delete this presentation structure?');
    if (!confirmation) return;

    try {
      await api.deletePresentation(presId);
      if (activePres?.id === presId) {
        setShowDrawer(false);
        setActivePres(null);
      }
      fetchPresentations();
    } catch (err) {
      alert('Failed to delete presentation.');
    }
  };

  const handleInspectPres = async (pres) => {
    setShowDrawer(true);
    setLoadingDetails(true);
    try {
      const details = await api.getPresentationDetails(pres.id);
      setActivePres(details);
    } catch (err) {
      console.error(err);
      alert('Failed to load presentation details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto relative flex">
      {/* Main List Column */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Generated Presentations</h2>
          <p className="text-sm text-slate-400">Inspect and moderate user-generated slide structure outlines</p>
        </div>

        {/* Search Bar */}
        <div className="flex bg-slate-900/40 p-4 rounded-2xl border border-slate-800/40">
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, topic, or audience..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input pl-11 py-2 text-sm"
            />
          </form>
        </div>

        {/* Presentations Grid */}
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {presentations.length > 0 ? (
              presentations.map((pres) => (
                <div key={pres.id} className="glass-card p-6 flex flex-col justify-between border border-slate-800/40 relative">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="bg-slate-900 border border-slate-800/60 p-2.5 rounded-xl text-blue-400 shrink-0">
                        <Presentation className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-100 text-base leading-snug line-clamp-1" title={pres.title}>
                          {pres.title}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Created by: @{pres.user?.username || pres.user?.telegramId || 'system'}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Table */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-3 border-t border-b border-slate-800/60 my-4 text-slate-400">
                      <div>
                        <span className="text-slate-600 block">TOPIC</span>
                        <span className="font-semibold text-slate-300 truncate block">{pres.topic}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block">AUDIENCE</span>
                        <span className="font-semibold text-slate-300 capitalize block">{pres.audience}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block">STYLE & LAYOUT</span>
                        <span className="font-semibold text-slate-300 capitalize block">{pres.style}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block">SLIDES COUNT</span>
                        <span className="font-semibold text-slate-300 block">{pres._count.slides} Slides</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-2 pt-2">
                    <span className="text-[10px] font-semibold text-slate-500">
                      {new Date(pres.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleInspectPres(pres)}
                        className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 active:scale-95"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect Outline
                      </button>
                      <button
                        onClick={() => handleDeletePres(pres.id)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-rose-400 border border-rose-500/20 transition-all active:scale-95"
                        title="Delete Presentation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="xl:col-span-2 py-20 text-center text-slate-500">
                No presentations logged in database.
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex items-center justify-between bg-slate-900/30 p-4 rounded-xl border border-slate-800/40">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Previous
            </button>
            <span className="text-xs text-slate-400 font-semibold">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))}
              disabled={page === pagination.pages}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Side Inspector Drawer */}
      {showDrawer && (
        <div className="w-96 glass-panel border-l border-slate-800/80 min-h-screen shrink-0 ml-6 flex flex-col p-6 shadow-2xl relative animate-in slide-in-from-right duration-300">
          {/* Close Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Presentation Outline
            </h3>
            <button
              onClick={() => setShowDrawer(false)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1">
            {loadingDetails ? (
              <div className="py-20 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              </div>
            ) : activePres ? (
              <>
                {/* Intro Info */}
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-200 text-base leading-snug">{activePres.title}</h4>
                  <p className="text-xs text-slate-500 italic">Topic: {activePres.topic}</p>
                  <p className="text-xs text-slate-500">Theme: {activePres.theme.toUpperCase()} | Language: {activePres.language}</p>
                </div>

                {/* Slides Iteration */}
                <div className="space-y-4">
                  {activePres.slides.map((slide, sIdx) => (
                    <div key={slide.id} className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-2">
                      <h5 className="font-semibold text-sm text-blue-400">
                        Slide {sIdx + 1}: {slide.title}
                      </h5>
                      <div className="pl-2 border-l border-slate-800 space-y-1 text-xs text-slate-300 font-medium">
                        {slide.content.split('\n').map((line, idx) => (
                          <div key={idx} className="flex items-start gap-1">
                            <CornerDownRight className="h-3.5 w-3.5 text-slate-600 shrink-0 mt-0.5" />
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                      
                      {slide.speakerNotes && (
                        <div className="mt-2 text-[10px] text-slate-500 leading-normal pl-2 italic">
                          <strong>Notes:</strong> {slide.speakerNotes}
                        </div>
                      )}
                      
                      {slide.imagePrompt && (
                        <div className="mt-1 text-[10px] text-slate-500 leading-normal pl-2 font-mono bg-slate-900/50 p-1 rounded">
                          <strong>Image prompt:</strong> {slide.imagePrompt}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
