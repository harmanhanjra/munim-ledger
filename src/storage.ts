/**
 * Local-only persistence for Munim.
 *
 * Data never leaves the device: localStorage under one versioned key, plus
 * JSON backup export/import with strict validation.
 */

import type { LedgerData } from './ledger';
import { SCHEMA_VERSION } from './ledger';

const STORAGE_KEY = 'munim.ledger.v1';

function emptyData(): LedgerData {
  return { version: SCHEMA_VERSION, customers: [], entries: [] };
}

export function serialize(data: LedgerData): string {
  return JSON.stringify(data);
}

/**
 * Validate untrusted JSON into LedgerData. Returns null when the shape is
 * wrong. Defensive: this runs on import files, so it must not throw.
 */
export function deserialize(raw: string): LedgerData | null {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof obj !== 'object' || obj === null) return null;
  const o = obj as Record<string, unknown>;
  if (!Array.isArray(o.customers) || !Array.isArray(o.entries)) return null;
  const customers: LedgerData['customers'] = [];
  const ids = new Set<string>();
  for (const c of o.customers) {
    if (typeof c !== 'object' || c === null) return null;
    const cu = c as Record<string, unknown>;
    if (typeof cu.id !== 'string' || !cu.id) return null;
    if (typeof cu.name !== 'string' || !cu.name.trim()) return null;
    if (typeof cu.phone !== 'string') return null;
    if (typeof cu.createdAt !== 'string') return null;
    if (ids.has(cu.id)) return null;
    ids.add(cu.id);
    customers.push({
      id: cu.id,
      name: cu.name,
      phone: cu.phone,
      createdAt: cu.createdAt,
    });
  }
  const entries: LedgerData['entries'] = [];
  for (const e of o.entries) {
    if (typeof e !== 'object' || e === null) return null;
    const en = e as Record<string, unknown>;
    if (typeof en.id !== 'string' || !en.id) return null;
    if (!ids.has(String(en.customerId))) return null;
    if (en.type !== 'credit' && en.type !== 'payment') return null;
    if (typeof en.amount !== 'number' || !Number.isInteger(en.amount) || en.amount <= 0) return null;
    if (typeof en.note !== 'string') return null;
    if (typeof en.date !== 'string') return null;
    entries.push({
      id: en.id,
      customerId: String(en.customerId),
      type: en.type,
      amount: en.amount,
      note: en.note,
      date: en.date,
    });
  }
  return { version: SCHEMA_VERSION, customers, entries };
}

export function load(): LedgerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return deserialize(raw) ?? emptyData();
  } catch {
    return emptyData();
  }
}

export function save(data: LedgerData): void {
  localStorage.setItem(STORAGE_KEY, serialize(data));
}

/** Browser download of a JSON backup. No-op outside the browser. */
export function exportBackup(data: LedgerData): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([serialize(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `munim-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Read a File (from <input type=file>) and parse it into LedgerData. */
export async function importBackup(file: File): Promise<LedgerData | null> {
  const text = await file.text();
  return deserialize(text);
}
