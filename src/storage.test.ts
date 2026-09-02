import { describe, it, expect } from 'vitest';
import { serialize, deserialize } from './storage';
import type { LedgerData } from './ledger';

const good: LedgerData = {
  version: 1,
  customers: [{ id: 'c1', name: 'Ram', phone: '9876543210', createdAt: '2026-09-01' }],
  entries: [
    { id: 'e1', customerId: 'c1', type: 'credit', amount: 5000, note: 'rice', date: '2026-09-01' },
  ],
};

describe('deserialize (untrusted input)', () => {
  it('round-trips valid data through serialize', () => {
    const out = deserialize(serialize(good));
    expect(out).toEqual(good);
  });

  it('accepts a JSON file without a version field (forward tolerant)', () => {
    const raw = JSON.stringify({ customers: good.customers, entries: good.entries });
    expect(deserialize(raw)).toEqual(good);
  });

  it('returns null on malformed JSON', () => {
    expect(deserialize('{not json')).toBeNull();
    expect(deserialize('')).toBeNull();
    expect(deserialize('null')).toBeNull();
    expect(deserialize('42')).toBeNull();
  });

  it('returns null when arrays are missing', () => {
    expect(deserialize('{"customers":[]}')).toBeNull();
  });

  it('returns null when an entry references an unknown customer', () => {
    const bad = { customers: [], entries: good.entries };
    expect(deserialize(JSON.stringify(bad))).toBeNull();
  });

  it('returns null on bad entry shape (amount, type, duplicate ids)', () => {
    const badAmount = {
      customers: good.customers,
      entries: [{ ...good.entries[0], amount: 10.5 }],
    };
    expect(deserialize(JSON.stringify(badAmount))).toBeNull();
    const badType = {
      customers: good.customers,
      entries: [{ ...good.entries[0], type: 'loan' }],
    };
    expect(deserialize(JSON.stringify(badType))).toBeNull();
    const dupIds = {
      customers: [good.customers[0], { ...good.customers[0] }],
      entries: [],
    };
    expect(deserialize(JSON.stringify(dupIds))).toBeNull();
    const noName = {
      customers: [{ id: 'c1', name: '  ', phone: '', createdAt: '' }],
      entries: [],
    };
    expect(deserialize(JSON.stringify(noName))).toBeNull();
  });
});
