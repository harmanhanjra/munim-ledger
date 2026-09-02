import { describe, it, expect } from 'vitest';
import {
  customerBalance,
  totals,
  parseRupees,
  formatRupees,
  validateCustomer,
  validateEntry,
  makeId,
  lastActivity,
  reminderLink,
  type Entry,
} from './ledger';

const entry = (over: Partial<Entry>): Entry => ({
  id: 'e',
  customerId: 'c1',
  type: 'credit',
  amount: 100,
  note: '',
  date: '2026-09-02',
  ...over,
});

describe('customerBalance', () => {
  it('is zero with no entries', () => {
    expect(customerBalance([], 'c1').paise).toBe(0);
  });

  it('sums credits minus payments', () => {
    const entries = [
      entry({ amount: 50000 }),
      entry({ type: 'payment', amount: 20000 }),
      entry({ amount: 10000 }),
    ];
    expect(customerBalance(entries, 'c1').paise).toBe(40000);
  });

  it('ignores other customers and can go negative on overpayment', () => {
    const entries = [
      entry({ customerId: 'c2', amount: 99999 }),
      entry({ type: 'payment', amount: 15000 }),
    ];
    expect(customerBalance(entries, 'c1').paise).toBe(-15000);
  });
});

describe('totals', () => {
  it('splits positive and negative balances per customer', () => {
    const entries = [
      entry({ customerId: 'a', amount: 50000 }),
      entry({ customerId: 'b', amount: 20000 }),
      entry({ customerId: 'b', type: 'payment', amount: 25000, date: '2026-09-02' }),
    ];
    const t = totals(entries, '2026-09-02');
    expect(t.toReceive).toBe(50000); // a owes 500, b is -50 (we owe)
    expect(t.toPay).toBe(5000);
    expect(t.receivedToday).toBe(25000);
  });

  it('counts receivedToday only for payments dated today', () => {
    const entries = [
      entry({ type: 'payment', amount: 1000, date: '2026-09-01' }),
      entry({ type: 'payment', amount: 2000, date: '2026-09-02' }),
    ];
    expect(totals(entries, '2026-09-02').receivedToday).toBe(2000);
  });
});

describe('parseRupees', () => {
  it('parses plain, comma and decimal forms into paise', () => {
    expect(parseRupees('150')).toBe(15000);
    expect(parseRupees('1,250.75')).toBe(125075);
    expect(parseRupees('0.5')).toBe(50);
    expect(parseRupees('₹ 99')).toBe(9900);
  });

  it('rejects junk, zero and negative', () => {
    expect(parseRupees('abc')).toBeNull();
    expect(parseRupees('')).toBeNull();
    expect(parseRupees('0')).toBeNull();
    expect(parseRupees('-5')).toBeNull();
    expect(parseRupees('1.234')).toBeNull();
  });
});

describe('formatRupees', () => {
  it('formats with Indian grouping and ₹', () => {
    expect(formatRupees(125075)).toBe('₹1,250.75');
    expect(formatRupees(15000)).toBe('₹150');
    expect(formatRupees(-500)).toBe('-₹5');
  });
});

describe('validators', () => {
  it('customer: name required, phone optional but validated', () => {
    expect(validateCustomer('', '')).toBe('name');
    expect(validateCustomer('  Ram  ', '')).toBeNull();
    expect(validateCustomer('Ram', '12345')).toBe('phone');
    expect(validateCustomer('Ram', '+91 98765 43210')).toBeNull();
  });

  it('entry: positive integer paise and ISO date required', () => {
    expect(validateEntry({ customerId: '', type: 'credit', amountPaise: 1, note: '', date: '2026-09-02' })).toBe('customer');
    expect(validateEntry({ customerId: 'c', type: 'credit', amountPaise: 0, note: '', date: '2026-09-02' })).toBe('amount');
    expect(validateEntry({ customerId: 'c', type: 'credit', amountPaise: 10.5, note: '', date: '2026-09-02' })).toBe('amount');
    expect(validateEntry({ customerId: 'c', type: 'payment', amountPaise: 100, note: '', date: '09/02/2026' })).toBe('date');
    expect(validateEntry({ customerId: 'c', type: 'payment', amountPaise: 100, note: '', date: '2026-09-02' })).toBeNull();
  });
});

describe('misc', () => {
  it('makeId is unique', () => {
    expect(makeId('x')).not.toBe(makeId('x'));
  });

  it('lastActivity picks the most recent entry', () => {
    const entries = [
      entry({ date: '2026-09-01' }),
      entry({ date: '2026-08-30', customerId: 'c2' }),
      entry({ date: '2026-09-03' }),
    ];
    expect(lastActivity(entries, 'c1')).toBe('2026-09-03');
    expect(lastActivity(entries, 'c3')).toBeNull();
  });

  it('reminderLink builds a wa.me link with encoded text', () => {
    const link = reminderLink('+91 98765 43210', 'Ram', 50000, 'hello ₹500 due');
    expect(link.startsWith('https://wa.me/919876543210?text=')).toBe(true);
    expect(link).toContain(encodeURIComponent('hello ₹500 due'));
  });
});
