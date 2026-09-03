import { normalizeLang, type Lang } from './i18n';

export interface Prefs {
  lang: Lang;
  largeText: boolean;
}

export const PREFS_KEY = 'munim.prefs.v1';

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { lang: normalizeLang(p.lang), largeText: Boolean(p.largeText) };
    }
  } catch {
    /* ignore */
  }
  const browser = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return { lang: normalizeLang(browser), largeText: false };
}

export function todayIso(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
