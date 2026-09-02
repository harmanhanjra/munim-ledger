/**
 * Munim core ledger logic.
 *
 * Pure functions only — no DOM, no storage, no framework. All money amounts
 * are integers in paise (1 rupee = 100 paise) to avoid floating-point drift.
 */

export type EntryType = 'credit' | 'payment';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string; // ISO date
}

export interface Entry {
  id: string;
  customerId: string;
  type: EntryType; // credit = you gave goods/money (they owe more); payment = they paid you
  amount: number; // paise, always > 0
  note: string;
  date: string; // ISO date
}

export interface LedgerData {
  version: number;
  customers: Customer[];
  entries: Entry[];
}

export const SCHEMA_VERSION = 1;

export interface Balance {
  /** paise; > 0 customer owes you, < 0 you owe customer, 0 settled */
  paise: number;
}

/** Balance for one customer across all their entries. */
export function customerBalance(entries: Entry[], customerId: string): Balance {
  let paise = 0;
  for (const e of entries) {
    if (e.customerId !== customerId) continue;
    paise += e.type === 'credit' ? e.amount : -e.amount;
  }
  return { paise };
}

export interface Totals {
  /** paise owed to you by all customers */
  toReceive: number;
  /** paise you owe across customers */
  toPay: number;
  /** paise received today */
  receivedToday: number;
}

export function totals(entries: Entry[], todayIso: string): Totals {
  const balances = new Map<string, number>();
  let receivedToday = 0;
  for (const e of entries) {
    const cur = balances.get(e.customerId) ?? 0;
    balances.set(e.customerId, cur + (e.type === 'credit' ? e.amount : -e.amount));
    if (e.type === 'payment' && e.date.slice(0, 10) === todayIso) receivedToday += e.amount;
  }
  let toReceive = 0;
  let toPay = 0;
  for (const b of balances.values()) {
    if (b > 0) toReceive += b;
    else if (b < 0) toPay += -b;
  }
  return { toReceive, toPay, receivedToday };
}

/** Parse a user-typed rupee amount ("150", "150.5", "1,250.75") into paise. */
export function parseRupees(input: string): number | null {
  const cleaned = input.replace(/[,\s₹]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

/** Format paise as a rupee string using Indian digit grouping. */
export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  const abs = Math.abs(rupees);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${rupees < 0 ? '-' : ''}₹${formatted}`;
}

export function validateCustomer(name: string, phone: string): string | null {
  if (!name.trim()) return 'name';
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return 'phone';
  }
  return null;
}

export interface NewEntry {
  customerId: string;
  type: EntryType;
  amountPaise: number;
  note: string;
  date: string;
}

export function validateEntry(entry: NewEntry): string | null {
  if (!entry.customerId) return 'customer';
  if (entry.type !== 'credit' && entry.type !== 'payment') return 'type';
  if (!Number.isInteger(entry.amountPaise) || entry.amountPaise <= 0) return 'amount';
  if (!/^\d{4}-\d{2}-\d{2}/.test(entry.date)) return 'date';
  return null;
}

let idCounter = 0;
export function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

/** Last activity date (most recent entry) for a customer, or null. */
export function lastActivity(entries: Entry[], customerId: string): string | null {
  let latest: string | null = null;
  for (const e of entries) {
    if (e.customerId !== customerId) continue;
    if (!latest || e.date > latest) latest = e.date;
  }
  return latest;
}

/** WhatsApp deep link for a payment reminder (deterministic message). */
export function reminderLink(phone: string, name: string, paise: number, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const text = encodeURIComponent(message);
  if (digits.length >= 10) return `https://wa.me/${digits}?text=${text}`;
  void name;
  return `https://wa.me/?text=${text}`;
}
