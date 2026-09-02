/**
 * i18n for Munim: English, Hindi, Punjabi.
 *
 * Plain dictionaries — no dependency. Adding a language = adding one object.
 */

export type Lang = 'en' | 'hi' | 'pa';

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

type Dict = Record<string, string>;

const en: Dict = {
  appName: 'Munim',
  tagline: 'Your free digital ledger',
  toReceive: 'To receive',
  toPay: 'To pay',
  receivedToday: 'Received today',
  customers: 'Customers',
  addCustomer: 'Add customer',
  customerName: 'Customer name',
  phoneOptional: 'Phone (optional)',
  save: 'Save',
  cancel: 'Cancel',
  addEntry: 'Add entry',
  giveCredit: 'Gave credit',
  takePayment: 'Received payment',
  amount: 'Amount (₹)',
  note: 'Note (optional)',
  date: 'Date',
  balance: 'Balance',
  youWillGet: 'You will get',
  youWillGive: 'You will give',
  settled: 'Settled',
  reminder: 'Send reminder',
  share: 'Share',
  settings: 'Settings',
  language: 'Language',
  largeText: 'Large text',
  backup: 'Backup',
  exportData: 'Export backup',
  importData: 'Import backup',
  privacy: 'All data stays on this device. Nothing is uploaded.',
  emptyTitle: 'No customers yet',
  emptyHint: 'Add your first customer to start your ledger.',
  deleteCustomer: 'Delete customer',
  deleteConfirm: 'Delete this customer and all their entries?',
  entries: 'Entries',
  noEntries: 'No entries yet',
  invalidAmount: 'Enter a valid amount',
  invalidName: 'Enter a name',
  invalidPhone: 'Enter a valid phone number',
  importFailed: 'That file is not a valid Munim backup',
  importSuccess: 'Backup imported',
  reminderMsg: 'Namaste! Gentle reminder from {shop}: amount due is {amount}. Thank you!',
  searchCustomer: 'Search customers',
  today: 'Today',
  edit: 'Edit',
  editCustomer: 'Edit customer',
  noResults: 'No customers match your search',
  exportCsv: 'Export CSV (entries)',
};

const hi: Dict = {
  appName: 'मुनीम',
  tagline: 'आपकी मुफ़्त डिजिटल बही-खाता',
  toReceive: 'लेने हैं',
  toPay: 'देने हैं',
  receivedToday: 'आज मिले',
  customers: 'ग्राहक',
  addCustomer: 'ग्राहक जोड़ें',
  customerName: 'ग्राहक का नाम',
  phoneOptional: 'फ़ोन (वैकल्पिक)',
  save: 'सहेजें',
  cancel: 'रद्द करें',
  addEntry: 'एंट्री जोड़ें',
  giveCredit: 'उधार दिया',
  takePayment: 'भुगतान मिला',
  amount: 'राशि (₹)',
  note: 'नोट (वैकल्पिक)',
  date: 'तारीख़',
  balance: 'बैलेंस',
  youWillGet: 'आपको मिलेंगे',
  youWillGive: 'आपको देने हैं',
  settled: 'हिसाब बराबर',
  reminder: 'याद दिलाएँ',
  share: 'साझा करें',
  settings: 'सेटिंग्स',
  language: 'भाषा',
  largeText: 'बड़ा टेक्स्ट',
  backup: 'बैकअप',
  exportData: 'बैकअप निकालें',
  importData: 'बैकअप लाएँ',
  privacy: 'सारा डेटा इसी डिवाइस पर रहता है। कुछ भी अपलोड नहीं होता।',
  emptyTitle: 'अभी कोई ग्राहक नहीं',
  emptyHint: 'बही शुरू करने के लिए पहला ग्राहक जोड़ें।',
  deleteCustomer: 'ग्राहक हटाएँ',
  deleteConfirm: 'इस ग्राहक और उनकी सभी एंट्री हटाएँ?',
  entries: 'एंट्री',
  noEntries: 'अभी कोई एंट्री नहीं',
  invalidAmount: 'सही राशि डालें',
  invalidName: 'नाम डालें',
  invalidPhone: 'सही फ़ोन नंबर डालें',
  importFailed: 'यह फ़ाइल मुनीम का सही बैकअप नहीं है',
  importSuccess: 'बैकअप आ गया',
  reminderMsg: 'नमस्ते! {shop} की ओर से याद दिलाना: {amount} बाकी है। धन्यवाद!',
  searchCustomer: 'ग्राहक खोजें',
  today: 'आज',
  edit: 'संपादित करें',
  editCustomer: 'ग्राहक संपादित करें',
  noResults: 'खोज से कोई ग्राहक नहीं मिला',
  exportCsv: 'CSV निर्यात (एंट्री)',
};

const pa: Dict = {
  appName: 'ਮੁਨੀਮ',
  tagline: 'ਤੁਹਾਡੀ ਮੁਫ਼ਤ ਡਿਜੀਟਲ ਬਹੀ-ਖਾਤਾ',
  toReceive: 'ਲੈਣੇ ਹਨ',
  toPay: 'ਦੇਣੇ ਹਨ',
  receivedToday: 'ਅੱਜ ਮਿਲੇ',
  customers: 'ਗਾਹਕ',
  addCustomer: 'ਗਾਹਕ ਜੋੜੋ',
  customerName: 'ਗਾਹਕ ਦਾ ਨਾਮ',
  phoneOptional: 'ਫ਼ੋਨ (ਵਿਕਲਪਿਕ)',
  save: 'ਸੰਭਾਲੋ',
  cancel: 'ਰੱਦ ਕਰੋ',
  addEntry: 'ਐਂਟਰੀ ਜੋੜੋ',
  giveCredit: 'ਉਧਾਰ ਦਿੱਤਾ',
  takePayment: 'ਪੈਸੇ ਮਿਲੇ',
  amount: 'ਰਕਮ (₹)',
  note: 'ਨੋਟ (ਵਿਕਲਪਿਕ)',
  date: 'ਤਾਰੀਖ਼',
  balance: 'ਬਾਕੀ',
  youWillGet: 'ਤੁਹਾਨੂੰ ਮਿਲਣੇ ਹਨ',
  youWillGive: 'ਤੁਹਾਨੂੰ ਦੇਣੇ ਹਨ',
  settled: 'ਹਿਸਾਬ ਬਰਾਬਰ',
  reminder: 'ਯਾਦ ਦਿਵਾਓ',
  share: 'ਸਾਂਝਾ ਕਰੋ',
  settings: 'ਸੈਟਿੰਗਾਂ',
  language: 'ਭਾਸ਼ਾ',
  largeText: 'ਵੱਡੀ ਲਿਖਤ',
  backup: 'ਬੈਕਅੱਪ',
  exportData: 'ਬੈਕਅੱਪ ਕੱਢੋ',
  importData: 'ਬੈਕਅੱਪ ਪਾਓ',
  privacy: 'ਸਾਰਾ ਡਾਟਾ ਇਸੇ ਡਿਵਾਈਸ ਤੇ ਰਹਿੰਦਾ ਹੈ। ਕੁਝ ਵੀ ਅੱਪਲੋਡ ਨਹੀਂ ਹੁੰਦਾ।',
  emptyTitle: 'ਹਾਲੇ ਕੋਈ ਗਾਹਕ ਨਹੀਂ',
  emptyHint: 'ਬਹੀ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਪਹਿਲਾ ਗਾਹਕ ਜੋੜੋ।',
  deleteCustomer: 'ਗਾਹਕ ਮਿਟਾਓ',
  deleteConfirm: 'ਇਹ ਗਾਹਕ ਤੇ ਉਸ ਦੀਆਂ ਸਾਰੀਆਂ ਐਂਟਰੀਆਂ ਮਿਟਾਈਏ?',
  entries: 'ਐਂਟਰੀਆਂ',
  noEntries: 'ਹਾਲੇ ਕੋਈ ਐਂਟਰੀ ਨਹੀਂ',
  invalidAmount: 'ਸਹੀ ਰਕਮ ਪਾਓ',
  invalidName: 'ਨਾਮ ਪਾਓ',
  invalidPhone: 'ਸਹੀ ਫ਼ੋਨ ਨੰਬਰ ਪਾਓ',
  importFailed: 'ਇਹ ਫ਼ਾਈਲ ਮੁਨੀਮ ਦਾ ਸਹੀ ਬੈਕਅੱਪ ਨਹੀਂ ਹੈ',
  importSuccess: 'ਬੈਕਅੱਪ ਆ ਗਿਆ',
  reminderMsg: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! {shop} ਵੱਲੋਂ ਯਾਦ ਦਿਵਾਉਣਾ: {amount} ਬਾਕੀ ਹੈ। ਧੰਨਵਾਦ!',
  searchCustomer: 'ਗਾਹਕ ਲੱਭੋ',
  today: 'ਅੱਜ',
  edit: 'ਸੋਧੋ',
  editCustomer: 'ਗਾਹਕ ਸੋਧੋ',
  noResults: 'ਖੋਜ ਨਾਲ ਕੋਈ ਗਾਹਕ ਨਹੀਂ ਮਿਲਿਆ',
  exportCsv: 'CSV ਨਿਰਯਾਤ (ਐਂਟਰੀਆਂ)',
};

const dicts: Record<Lang, Dict> = { en, hi, pa };

export function t(lang: Lang, key: string, vars?: Record<string, string>): string {
  const dict = dicts[lang] ?? en;
  let s = dict[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return s;
}

/** Fallback chain: exact match → language family → English. */
export function normalizeLang(input: string | null | undefined): Lang {
  if (input === 'hi' || input === 'pa') return input;
  if (input && input.startsWith('hi')) return 'hi';
  if (input && input.startsWith('pa')) return 'pa';
  return 'en';
}
