// import { Telegram } from '@twa-dev/sdk'; // SDK not needed, using global window.Telegram

/**
 * Initialize Telegram Web App – set theme colors and handle close event.
 */
export function initTelegramApp() {
  if (window.Telegram?.WebApp) {
    const app = window.Telegram.WebApp;
    // Sync theme colors to CSS variables
    document.documentElement.style.setProperty('--tg-theme-bg-color', app.backgroundColor || '#020617');
    document.documentElement.style.setProperty('--tg-theme-text-color', app.textColor || '#f8fafc');
    // Ensure safe area padding (iOS notch)
    const safeBottom = app.viewportHeight - app.safeArea.bottom;
    document.documentElement.style.setProperty('--tg-safe-bottom', `${app.safeArea.bottom}px`);
    // Close handler – navigate back to home if needed
    app.onEvent('close', () => {
      // No-op, but you can notify backend if needed.
    });
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
    if (type === 'impact') app.HapticFeedback.impact(style);
    if (type === 'notification') app.HapticFeedback.notification(style);
    if (type === 'selection') app.HapticFeedback.selection();
  }
}

/** Back button handling for Telegram (shows native back) */
export function showBackButton(callback) {
  if (window.Telegram?.WebApp) {
    const app = window.Telegram.WebApp;
    app.BackButton.show();
    app.BackButton.onClick(callback);
    return () => {
      app.BackButton.hide();
      app.BackButton.offClick(callback);
    };
  }
  return () => {};
}
