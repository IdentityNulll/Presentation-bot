import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, Sparkles, Plus, Copy, Trash2,
  ChevronLeft, ChevronRight, Image as ImageIcon, Search, Upload, Lock, Download, Check
} from 'lucide-react';
import api from '../utils/api';
import { hapticFeedback, showBackButton } from '../utils/telegram';
import LoadingSpinner from '../components/LoadingSpinner';
import SlidePreview from '../components/SlidePreview';
import { THEMES } from '../components/ThemePicker';

const LAYOUTS = [
  'Cover', 'TwoColumn', 'ImageLeft', 'ImageRight', 'FullImage',
  'Quote', 'Statistics', 'Timeline', 'Comparison', 'Team', 'Conclusion'
];

const EDITOR_TEXTS = {
  en: {
    edit_pres: "Edit Presentation",
    locked_banner: "🔒 Locked: Complete the payment in the Telegram bot chat to unlock editing and downloads.",
    save: "Save",
    saving: "Saving...",
    tab_content: "Content",
    tab_design: "Design & Image",
    tab_notes: "Speaker Notes",
    title_label: "Slide Title",
    layout_label: "Slide Layout",
    content_label: "Slide Content (one bullet per line)",
    notes_label: "Speaker Notes",
    image_url_label: "Image URL",
    image_prompt_label: "Image Prompt",
    suggested_images: "Suggested Stock Images",
    search_images: "Search Stock Images",
    upload_image: "Upload Custom Image",
    regenerate: "Regenerate with AI",
    add_slide: "Add Slide",
    duplicate_slide: "Duplicate",
    delete_slide: "Delete",
    move_left: "Move Left",
    move_right: "Move Right",
    loading: "Loading presentation...",
    saved_success: "Presentation saved successfully!",
    download_pdf: "Download PDF",
    download_pptx: "Download PPTX",
    confirm_save: "Changes Saved"
  },
  ru: {
    edit_pres: "Редактировать презентацию",
    locked_banner: "🔒 Блокировка: Завершите оплату в Телеграм-боте, чтобы открыть редактирование и скачивание.",
    save: "Сохранить",
    saving: "Сохранение...",
    tab_content: "Содержимое",
    tab_design: "Дизайн и картинка",
    tab_notes: "Заметки спикера",
    title_label: "Заголовок слайда",
    layout_label: "Макет слайда",
    content_label: "Текст слайда (по одной строке на пункт)",
    notes_label: "Заметки спикера",
    image_url_label: "URL Изображения",
    image_prompt_label: "Промпт для изображения",
    suggested_images: "Рекомендуемые изображения",
    search_images: "Искать изображения",
    upload_image: "Загрузить изображение",
    regenerate: "Пересоздать с помощью ИИ",
    add_slide: "Добавить слайд",
    duplicate_slide: "Дублировать",
    delete_slide: "Удалить",
    move_left: "Сдвинуть влево",
    move_right: "Сдвинуть вправо",
    loading: "Загрузка презентации...",
    saved_success: "Презентация успешно сохранена!",
    download_pdf: "Скачать PDF",
    download_pptx: "Скачать PPTX",
    confirm_save: "Изменения сохранены"
  },
  uz: {
    edit_pres: "Taqdimotni tahrirlash",
    locked_banner: "🔒 Bloklangan: Tahrirlash hamda PDF/PPTX yuklab olish uchun Telegram botda to'lovni tasdiqlang.",
    save: "Saqlash",
    saving: "Saqlanmoqda...",
    tab_content: "Tarkib",
    tab_design: "Dizayn va Rasm",
    tab_notes: "Notiq eslatmalari",
    title_label: "Slayd sarlavhasi",
    layout_label: "Slayd maketi",
    content_label: "Slayd matni (har bir qator bitta band)",
    notes_label: "Notiq eslatmalari",
    image_url_label: "Rasm URL manzili",
    image_prompt_label: "Rasm uchun prompt",
    suggested_images: "Tavsiya etilgan rasmlar",
    search_images: "Rasmlarni qidirish",
    upload_image: "O'z rasmini yuklash",
    regenerate: "AI orqali yangilash",
    add_slide: "Slayd qo'shish",
    duplicate_slide: "Nusxalash",
    delete_slide: "O'chirish",
    move_left: "Chapga surish",
    move_right: "O'ngga surish",
    loading: "Taqdimot yuklanmoqda...",
    saved_success: "Taqdimot muvaffaqiyatli saqlandi!",
    download_pdf: "PDF yuklab olish",
    download_pptx: "PPTX yuklab olish",
    confirm_save: "O'zgarishlar saqlandi"
  }
};

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [presentation, setPresentation] = useState(null);
  const [slides, setSlides] = useState([]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [language, setLanguage] = useState('en');
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'design' | 'notes'

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Stock Image Search State
  const [imageQuery, setImageQuery] = useState('');
  const [stockImages, setStockImages] = useState([]);
  const [searchingImages, setSearchingImages] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Track modified slides to save in batch
  const [modifiedSlideIds, setModifiedSlideIds] = useState(new Set());

  // Load user language preference and presentation details
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch user language
        const user = await api.getUserInfo();
        if (user && user.language) {
          setLanguage(user.language);
        }

        // Fetch presentation and slides
        const data = await api.getPresentation(id);
        setPresentation(data.presentation);
        setSlides(data.slides || []);
      } catch (err) {
        setError(err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Back button handling
  useEffect(() => {
    const cleanup = showBackButton(() => {
      hapticFeedback('impact', 'light');
      navigate('/');
    });
    return cleanup;
  }, [navigate]);

  const t = EDITOR_TEXTS[language] || EDITOR_TEXTS.en;
  const isApproved = presentation?.paymentStatus === 'APPROVED';

  // Local slide modification
  function handleSlideChange(updatedFields) {
    if (!isApproved) return; // Locked presentation check

    setSlides(prev => {
      const copy = [...prev];
      copy[activeSlideIdx] = { ...copy[activeSlideIdx], ...updatedFields };
      return copy;
    });
    
    const activeSlideId = slides[activeSlideIdx]?._id;
    if (activeSlideId) {
      setModifiedSlideIds(prev => {
        const nextSet = new Set(prev);
        nextSet.add(activeSlideId);
        return nextSet;
      });
    }
  }

  // Add Slide
  async function handleAddSlide() {
    if (!isApproved) return;
    try {
      hapticFeedback('impact', 'light');
      setSaving(true);
      const newSlide = await api.addSlide(id);
      setSlides(prev => [...prev, newSlide]);
      setActiveSlideIdx(slides.length);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  // Duplicate Slide
  async function handleDuplicateSlide() {
    if (!isApproved) return;
    const currentSlide = slides[activeSlideIdx];
    if (!currentSlide) return;
    try {
      hapticFeedback('impact', 'light');
      setSaving(true);
      const copy = await api.duplicateSlide(id, currentSlide._id);
      
      const newSlides = [...slides];
      newSlides.splice(activeSlideIdx + 1, 0, copy);
      
      // Update orders in state
      const reordered = newSlides.map((s, idx) => ({ ...s, order: idx }));
      setSlides(reordered);
      setActiveSlideIdx(activeSlideIdx + 1);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  // Delete Slide
  async function handleDeleteSlide() {
    if (!isApproved) return;
    if (slides.length <= 1) return; // Keep at least 1 slide
    const currentSlide = slides[activeSlideIdx];
    if (!currentSlide) return;

    try {
      hapticFeedback('impact', 'medium');
      setSaving(true);
      await api.deleteSlide(id, currentSlide._id);

      const filtered = slides.filter((_, idx) => idx !== activeSlideIdx);
      const reordered = filtered.map((s, idx) => ({ ...s, order: idx }));
      setSlides(reordered);
      setActiveSlideIdx(prev => (prev > 0 ? prev - 1 : 0));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  // Slide Reorder / Move
  async function handleMoveSlide(direction) {
    if (!isApproved) return;
    if (direction === 'left' && activeSlideIdx === 0) return;
    if (direction === 'right' && activeSlideIdx === slides.length - 1) return;

    const swapIdx = direction === 'left' ? activeSlideIdx - 1 : activeSlideIdx + 1;
    const reordered = [...slides];
    
    // Swap
    const temp = reordered[activeSlideIdx];
    reordered[activeSlideIdx] = reordered[swapIdx];
    reordered[swapIdx] = temp;

    // Fix order property
    const finalSlides = reordered.map((s, idx) => ({ ...s, order: idx }));
    setSlides(finalSlides);
    setActiveSlideIdx(swapIdx);

    try {
      await api.reorderSlides(id, finalSlides.map(s => s._id));
      hapticFeedback('selection');
    } catch (err) {
      setError("Failed to save slide order: " + err.message);
    }
  }

  // Regenerate slide with AI
  async function handleRegenerateSlide() {
    if (!isApproved) return;
    const currentSlide = slides[activeSlideIdx];
    if (!currentSlide) return;

    try {
      hapticFeedback('notification', 'success');
      setSaving(true);
      const updated = await api.regenerateSlide(id, currentSlide._id);
      
      setSlides(prev => {
        const copy = [...prev];
        copy[activeSlideIdx] = updated;
        return copy;
      });
      
      // Remove from modified set because it is now synced with backend AI version
      setModifiedSlideIds(prev => {
        const next = new Set(prev);
        next.delete(currentSlide._id);
        return next;
      });
    } catch (err) {
      setError("Regenerate failed: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Save changes
  async function handleSave() {
    hapticFeedback('impact', 'medium');
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Update presentation title/audience
      await api.updatePresentation(id, {
        title: presentation.title,
        audience: presentation.audience
      });

      // 2. Save modified slides
      for (const slideId of modifiedSlideIds) {
        const slideToSave = slides.find(s => s._id === slideId);
        if (slideToSave) {
          await api.updateSlide(id, slideId, slideToSave);
        }
      }

      setModifiedSlideIds(new Set());
      setSuccessMsg(t.confirm_save);
      hapticFeedback('notification', 'success');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      hapticFeedback('notification', 'error');
    } finally {
      setSaving(false);
    }
  }

  // Image stock search
  async function handleSearchImages() {
    if (!imageQuery.trim() || !isApproved) return;
    try {
      setSearchingImages(true);
      const results = await api.suggestImages(imageQuery);
      setStockImages(results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingImages(false);
    }
  }

  // Image upload
  async function handleUploadImage(e) {
    if (!isApproved) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await api.uploadImage(id, file);
      if (res && res.imageUrl) {
        handleSlideChange({ imageUrl: res.imageUrl });
      }
    } catch (err) {
      setError("Image upload failed: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  }

  // Export handlers
  async function handleExport(format) {
    if (!isApproved) return;
    try {
      hapticFeedback('impact', 'light');
      // Triggers browser download directly from backend
      const downloadUrl = `https://presentation-bot-production-a425.up.railway.app/api/miniapp/presentations/${id}/export/${format.toLowerCase()}?tgId=${presentation.userId}`;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      setError("Export failed: " + err.message);
    }
  }

  if (loading) return <LoadingSpinner text={t.loading} />;

  const currentSlide = slides[activeSlideIdx];
  const theme = THEMES[presentation?.style?.toLowerCase()] || THEMES.professional;

  return (
    <div className="flex flex-col min-h-screen min-h-dvh safe-bottom bg-[#030712]">
      {/* Header */}
      <header className="glass-panel px-4 py-3 border-b border-slate-800/50 flex items-center justify-between sticky top-0 z-50">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.nav_back}
        </button>

        <h1 className="text-sm font-bold text-white max-w-[40%] truncate">
          {presentation?.title}
        </h1>

        {isApproved ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {t.save}
          </button>
        ) : (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
            <Lock className="w-3 h-3" /> Locked
          </div>
        )}
      </header>

      {/* Lock Banner */}
      {!isApproved && (
        <div className="bg-amber-950/80 border-b border-amber-800/40 text-[11px] text-amber-400 px-4 py-2.5 flex items-center gap-2 font-medium">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>{t.locked_banner}</span>
        </div>
      )}

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="bg-emerald-950/80 border-b border-emerald-800/40 text-xs text-emerald-400 px-4 py-2.5 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-950/80 border-b border-red-800/40 text-xs text-red-400 px-4 py-2.5">
          {error}
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-y-auto">
        {/* Workspace: Preview and Slide List */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Active Slide Preview */}
          {currentSlide && (
            <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden shadow-xl border border-white/5 bg-slate-900">
              <SlidePreview slide={currentSlide} theme={theme} />
            </div>
          )}

          {/* Slider Pagination Controls */}
          <div className="flex items-center justify-between px-2">
            <div className="flex gap-2">
              <button
                onClick={() => handleMoveSlide('left')}
                disabled={activeSlideIdx === 0 || !isApproved}
                className="btn-secondary px-2 py-1 text-[11px] disabled:opacity-30"
              >
                {t.move_left}
              </button>
              <button
                onClick={() => handleMoveSlide('right')}
                disabled={activeSlideIdx === slides.length - 1 || !isApproved}
                className="btn-secondary px-2 py-1 text-[11px] disabled:opacity-30"
              >
                {t.move_right}
              </button>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Slide {activeSlideIdx + 1} of {slides.length}
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  hapticFeedback('selection');
                  setActiveSlideIdx(prev => (prev > 0 ? prev - 1 : slides.length - 1));
                }}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => {
                  hapticFeedback('selection');
                  setActiveSlideIdx(prev => (prev < slides.length - 1 ? prev + 1 : 0));
                }}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Slide Management Controls */}
          {isApproved && (
            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleAddSlide} className="btn-secondary text-[11px] py-2 flex items-center justify-center gap-1">
                <Plus className="w-3.5 h-3.5" /> {t.add_slide}
              </button>
              <button onClick={handleDuplicateSlide} className="btn-secondary text-[11px] py-2 flex items-center justify-center gap-1">
                <Copy className="w-3.5 h-3.5" /> {t.duplicate_slide}
              </button>
              <button onClick={handleDeleteSlide} disabled={slides.length <= 1} className="btn-secondary text-[11px] py-2 flex items-center justify-center gap-1 text-red-400 hover:text-red-300 disabled:opacity-30">
                <Trash2 className="w-3.5 h-3.5" /> {t.delete_slide}
              </button>
            </div>
          )}

          {/* Export Panel (Visible only when approved) */}
          {isApproved && (
            <div className="glass-card p-3 flex gap-2 border border-white/5 justify-between items-center">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Exports</span>
              <div className="flex gap-2">
                <button onClick={() => handleExport('PDF')} className="btn-primary text-[11px] py-1.5 px-3 flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> {t.download_pdf}
                </button>
                <button onClick={() => handleExport('PPTX')} className="btn-primary text-[11px] py-1.5 px-3 flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> {t.download_pptx}
                </button>
              </div>
            </div>
          )}

          {/* Slides Horizontal Thumbnail List */}
          <div className="flex gap-2 overflow-x-auto py-2">
            {slides.map((s, idx) => {
              const isActive = idx === activeSlideIdx;
              return (
                <button
                  key={s._id}
                  onClick={() => {
                    hapticFeedback('selection');
                    setActiveSlideIdx(idx);
                  }}
                  className={`w-14 h-10 rounded-lg overflow-hidden shrink-0 border transition-all ${
                    isActive ? 'border-indigo-500 scale-105 shadow-md' : 'border-slate-800 opacity-60'
                  }`}
                  style={{ background: `#${theme.bg || '1e293b'}` }}
                >
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: `#${theme.text || 'f8fafc'}` }}>
                    {idx + 1}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Slide Editor Form */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors ${
                activeTab === 'content' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400'
              }`}
            >
              {t.tab_content}
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors ${
                activeTab === 'design' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400'
              }`}
            >
              {t.tab_design}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors ${
                activeTab === 'notes' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400'
              }`}
            >
              {t.tab_notes}
            </button>
          </div>

          {/* Tab Content Panels */}
          {currentSlide && (
            <div className="flex-1 space-y-4">
              {/* Tab: Content */}
              {activeTab === 'content' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      {t.title_label}
                    </label>
                    <input
                      type="text"
                      disabled={!isApproved}
                      value={currentSlide.title || ''}
                      onChange={e => handleSlideChange({ title: e.target.value })}
                      className="glass-input text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      {t.layout_label}
                    </label>
                    <select
                      disabled={!isApproved}
                      value={currentSlide.type || 'TwoColumn'}
                      onChange={e => handleSlideChange({ type: e.target.value })}
                      className="glass-input text-sm cursor-pointer"
                    >
                      {LAYOUTS.map(l => (
                        <option key={l} value={l} className="bg-slate-950 text-slate-300">
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      {t.content_label}
                    </label>
                    <textarea
                      disabled={!isApproved}
                      value={currentSlide.content || ''}
                      onChange={e => handleSlideChange({ content: e.target.value })}
                      className="glass-input h-48 text-sm resize-none font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Tab: Design / AI Image */}
              {activeTab === 'design' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Image URL */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      {t.image_url_label}
                    </label>
                    <input
                      type="text"
                      disabled={!isApproved}
                      value={currentSlide.imageUrl || ''}
                      onChange={e => handleSlideChange({ imageUrl: e.target.value })}
                      className="glass-input text-xs"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {/* Image Prompt */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      {t.image_prompt_label}
                    </label>
                    <input
                      type="text"
                      disabled={!isApproved}
                      value={currentSlide.imagePrompt || ''}
                      onChange={e => handleSlideChange({ imagePrompt: e.target.value })}
                      className="glass-input text-xs"
                    />
                  </div>

                  {/* AI Regenerate slide */}
                  {isApproved && (
                    <button
                      onClick={handleRegenerateSlide}
                      className="btn-secondary w-full py-2 flex items-center justify-center gap-1.5 text-xs border-indigo-500/20 text-indigo-400 hover:text-white hover:bg-indigo-500/10"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {t.regenerate}
                    </button>
                  )}

                  {/* Local Image upload */}
                  {isApproved && (
                    <div className="pt-2 border-t border-slate-800">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {t.upload_image}
                      </label>
                      <label className="w-full h-10 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 flex items-center justify-center gap-2 cursor-pointer text-slate-400 hover:text-white transition-colors text-xs font-semibold">
                        {uploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>Browse File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* Stock search */}
                  {isApproved && (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {t.search_images}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={imageQuery}
                          onChange={e => setImageQuery(e.target.value)}
                          placeholder="Search query..."
                          className="glass-input text-xs flex-1"
                        />
                        <button
                          onClick={handleSearchImages}
                          className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      </div>

                      {searchingImages ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                        </div>
                      ) : (
                        stockImages.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 h-44 overflow-y-auto pt-1 pr-1">
                            {stockImages.map((img, i) => (
                              <button
                                key={i}
                                onClick={() => handleSlideChange({ imageUrl: img })}
                                className="relative aspect-video rounded-lg overflow-hidden border border-slate-800/80 group hover:border-indigo-500 transition-all"
                              >
                                <img src={img} alt="suggested visual" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">Apply</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Speaker Notes */}
              {activeTab === 'notes' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      {t.notes_label}
                    </label>
                    <textarea
                      disabled={!isApproved}
                      value={currentSlide.speakerNotes || ''}
                      onChange={e => handleSlideChange({ speakerNotes: e.target.value })}
                      className="glass-input h-64 text-sm resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
