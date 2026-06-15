// import { Telegram } from '@twa-dev/sdk'; // SDK not needed, using global window.Telegram

/**
 * Initialize Telegram Web App – set theme colors and handle close event.
 */
export function initTelegramApp() {
  if (window.Telegram?.WebApp) {
    const app = window.Telegram.WebApp;
  // Sync theme colors to CSS variables (fallbacks for older versions)
  document.documentElement.style.setProperty('--tg-theme-bg-color', app.backgroundColor || '#020617');
  document.documentElement.style.setProperty('--tg-theme-text-color', app.textColor || '#f8fafc');
  // Safe area handling – some versions lack safeArea
  if (app.safeArea && typeof app.safeArea.bottom === 'number') {
    const safeBottom = app.viewportHeight - app.safeArea.bottom;
    document.documentElement.style.setProperty('--tg-safe-bottom', `${app.safeArea.bottom}px`);
  }
  // Close handler – safely attach if supported
  if (typeof app.onEvent === 'function') {
    app.onEvent('close', () => {
      // No-op, but you can notify backend if needed.
    });
  }
  }
}

/** Get current user data from Telegram (returns minimal profile) */
export function getTelegramUser() {
  if (window.Telegram?.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe?.user || {};
    return user;
  }
  // Fallback for dev – mock user
  return { id: 'dev', first_name: 'Dev' };
}

/** Extract start params from URL (deep link) */
export function getStartParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    action: params.get('action'), // e.g., 'new' or 'edit'
    title: params.get('title'),
    audience: params.get('audience'),
    presId: params.get('presId'),
  };
}

/** Simple haptic feedback abstraction */
export function hapticFeedback(type = 'impact', style = 'light') {
  if (window.Telegram?.WebApp) {
    const app = window.Telegram.WebApp;
    const hf = app.HapticFeedback;
    if (!hf) return;
    if (type === 'impact' && typeof hf.impact === 'function') hf.impact(style);
    else if (type === 'notification' && typeof hf.notification === 'function') hf.notification(style);
    else if (type === 'selection' && typeof hf.selection === 'function') hf.selection();
  }
}

/** Back button handling for Telegram (shows native back) */
export function showBackButton(callback) {
  if (window.Telegram?.WebApp) {
    const app = window.Telegram.WebApp;
    // BackButton introduced in later versions – guard its presence
    if (app.BackButton && typeof app.BackButton.show === 'function') {
      app.BackButton.show();
      app.BackButton.onClick(callback);
      return () => {
        app.BackButton.hide();
        app.BackButton.offClick(callback);
      };
    }
  }
  // Fallback – no back button support
  return () => {};
}
