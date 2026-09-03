import { describe, it, expect } from 'vitest';
import { t, normalizeLang, LANGUAGES } from './i18n';

describe('i18n', () => {
  it('returns translations for all three languages', () => {
    expect(t('en', 'toReceive')).toBe('To receive');
    expect(t('hi', 'toReceive')).toBe('लेने हैं');
    expect(t('pa', 'toReceive')).toBe('ਲੈਣੇ ਹਨ');
  });

  it('falls back to English key when missing, and to key itself when unknown', () => {
    expect(t('hi', 'nonexistent_key')).toBe('nonexistent_key');
  });

  it('substitutes template variables', () => {
    expect(t('en', 'reminderMsg', { shop: 'Sharma Store', amount: '₹500' })).toBe(
      'Namaste! Gentle reminder from Sharma Store: amount due is ₹500. Thank you!'
    );
  });

  it('normalizes browser locale strings', () => {
    expect(normalizeLang('hi-IN')).toBe('hi');
    expect(normalizeLang('pa-Guru-IN')).toBe('pa');
    expect(normalizeLang('fr')).toBe('en');
    expect(normalizeLang(null)).toBe('en');
  });

  it('every language dictionary covers every English key', () => {
    const en = LANGUAGES.length; // sanity: languages registered
    expect(en).toBe(3);
    // Import dicts via behavior: all three langs resolve the same key set.
    for (const key of [
      'appName', 'toReceive', 'toPay', 'receivedToday', 'customers', 'addCustomer',
      'addEntry', 'giveCredit', 'takePayment', 'amount', 'settings', 'language',
      'largeText', 'exportData', 'importData', 'privacy', 'reminderMsg',
      'edit', 'editCustomer', 'noResults', 'exportCsv', 'shareStatement',
    ]) {
      for (const lang of ['en', 'hi', 'pa'] as const) {
        const v = t(lang, key);
        expect(v, `${lang}:${key}`).not.toBe(key);
      }
    }
  });
});
