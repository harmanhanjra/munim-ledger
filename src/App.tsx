import { useEffect, useMemo, useState } from 'react';
import {
  customerBalance,
  formatRupees,
  lastActivity,
  makeId,
  parseRupees,
  reminderLink,
  toCsv,
  totals,
  validateCustomer,
  validateEntry,
  type Customer,
  type Entry,
  type EntryType,
  type LedgerData,
} from './ledger';
import { downloadText, exportBackup, importBackup, load, save } from './storage';
import { normalizeLang, t, LANGUAGES, type Lang } from './i18n';

type View =
  | { name: 'home' }
  | { name: 'customer'; id: string }
  | { name: 'addEntry'; customerId: string | null; initialType?: EntryType }
  | { name: 'addCustomer' }
  | { name: 'editCustomer'; id: string }
  | { name: 'settings' };

interface Prefs {
  lang: Lang;
  largeText: boolean;
}

const PREFS_KEY = 'munim.prefs.v1';

function loadPrefs(): Prefs {
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

function todayIso(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export default function App() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [data, setData] = useState<LedgerData>(load);
  const [view, setView] = useState<View>({ name: 'home' });
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    document.documentElement.lang = prefs.lang;
    document.documentElement.classList.toggle('large-text', prefs.largeText);
  }, [prefs]);

  useEffect(() => {
    save(data);
  }, [data]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  const { lang } = prefs;
  const tr = (key: string, vars?: Record<string, string>) => t(lang, key, vars);

  const sortedCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...data.customers]
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .sort((a, b) => {
        const ba = customerBalance(data.entries, a.id).paise;
        const bb = customerBalance(data.entries, b.id).paise;
        if ((ba > 0) !== (bb > 0)) return ba > 0 ? -1 : 1;
        return bb - ba;
      });
  }, [data, search]);

  const totalsNow = totals(data.entries, todayIso());

  function addCustomer(name: string, phone: string): boolean {
    const err = validateCustomer(name, phone);
    if (err) {
      setToast(tr(err === 'name' ? 'invalidName' : 'invalidPhone'));
      return false;
    }
    const customer: Customer = {
      id: makeId('c'),
      name: name.trim(),
      phone: phone.trim(),
      createdAt: todayIso(),
    };
    setData((d) => ({ ...d, customers: [...d.customers, customer] }));
    setView({ name: 'home' });
    return true;
  }

  function updateCustomer(id: string, name: string, phone: string): boolean {
    const err = validateCustomer(name, phone);
    if (err) {
      setToast(tr(err === 'name' ? 'invalidName' : 'invalidPhone'));
      return false;
    }
    setData((d) => ({
      ...d,
      customers: d.customers.map((c) =>
        c.id === id ? { ...c, name: name.trim(), phone: phone.trim() } : c
      ),
    }));
    setView({ name: 'customer', id });
    return true;
  }

  function addEntry(
    customerId: string,
    type: EntryType,
    amountInput: string,
    note: string,
    date: string
  ): boolean {
    const amountPaise = parseRupees(amountInput);
    const candidate = { customerId, type, amountPaise: amountPaise ?? 0, note, date };
    const err = validateEntry(candidate);
    if (err) {
      setToast(tr(err === 'amount' ? 'invalidAmount' : 'invalidAmount'));
      return false;
    }
    const entry: Entry = {
      id: makeId('e'),
      customerId,
      type,
      amount: amountPaise as number,
      note: note.trim(),
      date,
    };
    setData((d) => ({ ...d, entries: [...d.entries, entry] }));
    setView({ name: 'customer', id: customerId });
    return true;
  }

  function deleteCustomer(id: string) {
    if (!window.confirm(tr('deleteConfirm'))) return;
    setData((d) => ({
      ...d,
      customers: d.customers.filter((c) => c.id !== id),
      entries: d.entries.filter((e) => e.customerId !== id),
    }));
    setView({ name: 'home' });
  }

  async function onImportFile(file: File) {
    const parsed = await importBackup(file);
    if (!parsed) {
      setToast(tr('importFailed'));
      return;
    }
    setData(parsed);
    setToast(tr('importSuccess'));
  }

  return (
    <div className="app">
      <header className="app-header">
        <button className="icon-btn" onClick={() => setView({ name: 'home' })} aria-label={tr('appName')}>
          <span className="brand">🧾 {tr('appName')}</span>
        </button>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => setPrefs((p) => ({ ...p, lang: p.lang === 'en' ? 'hi' : p.lang === 'hi' ? 'pa' : 'en' }))}
            aria-label={tr('language')}
            title={tr('language')}
          >
            {prefs.lang === 'en' ? 'EN' : prefs.lang === 'hi' ? 'हि' : 'ਪੰ'}
          </button>
          <button className="icon-btn" onClick={() => setView({ name: 'settings' })} aria-label={tr('settings')} title={tr('settings')}>
            ⚙️
          </button>
        </div>
      </header>

      <main>
        {view.name === 'home' && (
          <Home
            tr={tr}
            totals={totalsNow}
            customers={sortedCustomers}
            entries={data.entries}
            search={search}
            setSearch={setSearch}
            openCustomer={(id) => setView({ name: 'customer', id })}
            onAddCustomer={() => setView({ name: 'addCustomer' })}
            onAddEntry={() => setView({ name: 'addEntry', customerId: null })}
          />
        )}

        {view.name === 'customer' &&
          (() => {
            const c = data.customers.find((x) => x.id === view.id);
            if (!c) return <p className="muted">{tr('noEntries')}</p>;
            const bal = customerBalance(data.entries, c.id).paise;
            const entries = data.entries
              .filter((e) => e.customerId === c.id)
              .sort((a, b) => (a.date < b.date ? 1 : -1));
            const msg = tr('reminderMsg', { shop: tr('appName'), amount: formatRupees(bal) });
            return (
              <CustomerView
                tr={tr}
                customer={c}
                balance={bal}
                entries={entries}
                onBack={() => setView({ name: 'home' })}
                onAdd={(type) => setView({ name: 'addEntry', customerId: c.id, initialType: type })}
                onEdit={() => setView({ name: 'editCustomer', id: c.id })}
                onDelete={() => deleteCustomer(c.id)}
                reminderHref={bal > 0 ? reminderLink(c.phone, msg) : null}
              />
            );
          })()}

        {view.name === 'addCustomer' && (
          <AddCustomer tr={tr} onSave={addCustomer} onCancel={() => setView({ name: 'home' })} />
        )}

        {view.name === 'editCustomer' &&
          (() => {
            const c = data.customers.find((x) => x.id === view.id);
            if (!c) {
              setView({ name: 'home' });
              return null;
            }
            return (
              <EditCustomer
                tr={tr}
                customer={c}
                onSave={(name, phone) => updateCustomer(c.id, name, phone)}
                onCancel={() => setView({ name: 'customer', id: c.id })}
              />
            );
          })()}

        {view.name === 'addEntry' && (
          <AddEntry
            tr={tr}
            customers={data.customers}
            preselected={view.customerId}
            initialType={view.initialType}
            onSave={addEntry}
            onCancel={() =>
              setView(view.customerId ? { name: 'customer', id: view.customerId } : { name: 'home' })
            }
          />
        )}

        {view.name === 'settings' && (
          <Settings
            tr={tr}
            prefs={prefs}
            setPrefs={setPrefs}
            data={data}
            onExport={() => exportBackup(data)}
            onImport={onImportFile}
            onExportCsv={() =>
              downloadText(
                `munim-entries-${todayIso()}.csv`,
                toCsv(data.customers, data.entries),
                'text/csv;charset=utf-8'
              )
            }
          />
        )}
      </main>

      {view.name === 'home' && (
        <button
          className="fab"
          onClick={() => setView({ name: 'addEntry', customerId: null })}
          aria-label={tr('addEntry')}
        >
          ＋ {tr('addEntry')}
        </button>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ---------- Home ---------- */

function Home(props: {
  tr: (k: string, v?: Record<string, string>) => string;
  totals: { toReceive: number; toPay: number; receivedToday: number };
  customers: Customer[];
  entries: Entry[];
  search: string;
  setSearch: (s: string) => void;
  openCustomer: (id: string) => void;
  onAddCustomer: () => void;
  onAddEntry: () => void;
}) {
  const { tr, totals, customers, entries } = props;
  return (
    <>
      <section className="summary" aria-label={tr('toReceive')}>
        <div className="summary-card">
          <span className="summary-label">{tr('toReceive')}</span>
          <span className="summary-amount danger" data-testid="to-receive">
            {formatRupees(totals.toReceive)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">{tr('receivedToday')}</span>
          <span className="summary-amount ok" data-testid="received-today">
            {formatRupees(totals.receivedToday)}
          </span>
        </div>
      </section>

      <p className="privacy-note">{tr('privacy')}</p>

      {customers.length === 0 ? (
        props.search.trim() ? (
          <p className="muted no-results" role="status">
            {tr('noResults')}
          </p>
        ) : (
          <div className="empty">
            <h2>{tr('emptyTitle')}</h2>
            <p>{tr('emptyHint')}</p>
            <button className="btn primary" onClick={props.onAddCustomer}>
              {tr('addCustomer')}
            </button>
          </div>
        )
      ) : (
        <>
          <input
            className="search"
            type="search"
            placeholder={tr('searchCustomer')}
            value={props.search}
            onChange={(e) => props.setSearch(e.target.value)}
            aria-label={tr('searchCustomer')}
          />
          <ul className="customer-list">
            {customers.map((c) => {
              const bal = customerBalance(entries, c.id).paise;
              const last = lastActivity(entries, c.id);
              return (
                <li key={c.id}>
                  <button className="customer-row" onClick={() => props.openCustomer(c.id)}>
                    <span className="avatar" aria-hidden="true">
                      {c.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="customer-info">
                      <span className="customer-name">{c.name}</span>
                      <span className="customer-meta">{last ? last.slice(0, 10) : ''}</span>
                    </span>
                    <span className={`customer-balance ${bal > 0 ? 'danger' : bal < 0 ? 'ok' : 'muted'}`}>
                      {bal === 0 ? tr('settled') : formatRupees(bal)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button className="btn ghost" onClick={props.onAddCustomer}>
            ＋ {tr('addCustomer')}
          </button>
        </>
      )}
    </>
  );
}

/* ---------- Customer detail ---------- */

function CustomerView(props: {
  tr: (k: string) => string;
  customer: Customer;
  balance: number;
  entries: Entry[];
  onBack: () => void;
  onAdd: (type: EntryType) => void;
  onEdit: () => void;
  onDelete: () => void;
  reminderHref: string | null;
}) {
  const { tr, customer, balance, entries } = props;
  return (
    <>
      <button className="btn link" onClick={props.onBack}>
        ← {tr('customers')}
      </button>
      <section className="card customer-head">
        <div className="customer-head-row">
          <h2>{customer.name}</h2>
          <button className="btn link" onClick={props.onEdit} aria-label={tr('editCustomer')}>
            ✏️ {tr('edit')}
          </button>
        </div>
        <p className={`balance-line ${balance > 0 ? 'danger' : balance < 0 ? 'ok' : 'muted'}`}>
          {balance > 0 ? tr('youWillGet') : balance < 0 ? tr('youWillGive') : tr('settled')}:{' '}
          <strong data-testid="customer-balance">{formatRupees(balance)}</strong>
        </p>
        <div className="action-row">
          <button className="btn primary" onClick={() => props.onAdd('credit')}>
            {tr('giveCredit')}
          </button>
          <button className="btn success" onClick={() => props.onAdd('payment')}>
            {tr('takePayment')}
          </button>
        </div>
        {props.reminderHref && (
          <a className="btn ghost" href={props.reminderHref} target="_blank" rel="noreferrer">
            📱 {tr('reminder')}
          </a>
        )}
      </section>

      <h3 className="section-title">{tr('entries')}</h3>
      {entries.length === 0 ? (
        <p className="muted">{tr('noEntries')}</p>
      ) : (
        <ul className="entry-list">
          {entries.map((e) => (
            <li key={e.id} className="entry-row">
              <span className="entry-date">{e.date.slice(0, 10)}</span>
              <span className="entry-note">{e.note || (e.type === 'credit' ? tr('giveCredit') : tr('takePayment'))}</span>
              <span className={`entry-amount ${e.type === 'credit' ? 'danger' : 'ok'}`}>
                {e.type === 'credit' ? '+' : '−'}
                {formatRupees(e.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button className="btn danger-ghost" onClick={props.onDelete}>
        🗑 {tr('deleteCustomer')}
      </button>
    </>
  );
}

/* ---------- Forms ---------- */

function AddCustomer(props: {
  tr: (k: string) => string;
  onSave: (name: string, phone: string) => boolean;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const { tr } = props;
  return (
    <form
      className="card form"
      onSubmit={(e) => {
        e.preventDefault();
        props.onSave(name, phone);
      }}
    >
      <h2>{tr('addCustomer')}</h2>
      <label>
        {tr('customerName')}
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </label>
      <label>
        {tr('phoneOptional')}
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" type="tel" />
      </label>
      <div className="action-row">
        <button type="submit" className="btn primary">
          {tr('save')}
        </button>
        <button type="button" className="btn ghost" onClick={props.onCancel}>
          {tr('cancel')}
        </button>
      </div>
    </form>
  );
}

function AddEntry(props: {
  tr: (k: string) => string;
  customers: Customer[];
  preselected: string | null;
  initialType?: EntryType;
  onSave: (customerId: string, type: EntryType, amount: string, note: string, date: string) => boolean;
  onCancel: () => void;
}) {
  const [customerId, setCustomerId] = useState(props.preselected ?? props.customers[0]?.id ?? '');
  const [type, setType] = useState<EntryType>(props.initialType ?? 'credit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayIso());
  const { tr } = props;

  if (props.customers.length === 0) {
    return <p className="muted">{tr('emptyHint')}</p>;
  }

  return (
    <form
      className="card form"
      onSubmit={(e) => {
        e.preventDefault();
        if (props.onSave(customerId, type, amount, note, date)) setAmount('');
      }}
    >
      <h2>{tr('addEntry')}</h2>
      {!props.preselected && (
        <label>
          {tr('customers')}
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            {props.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="segmented" role="group" aria-label={tr('addEntry')}>
        <button
          type="button"
          className={type === 'credit' ? 'seg active' : 'seg'}
          onClick={() => setType('credit')}
          aria-pressed={type === 'credit'}
        >
          ↑ {tr('giveCredit')}
        </button>
        <button
          type="button"
          className={type === 'payment' ? 'seg active' : 'seg'}
          onClick={() => setType('payment')}
          aria-pressed={type === 'payment'}
        >
          ↓ {tr('takePayment')}
        </button>
      </div>
      <label>
        {tr('amount')}
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          required
          autoFocus
          placeholder="0.00"
        />
      </label>
      <label>
        {tr('note')}
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <label>
        {tr('date')}
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <div className="action-row">
        <button type="submit" className="btn primary">
          {tr('save')}
        </button>
        <button type="button" className="btn ghost" onClick={props.onCancel}>
          {tr('cancel')}
        </button>
      </div>
    </form>
  );
}

function EditCustomer(props: {
  tr: (k: string) => string;
  customer: Customer;
  onSave: (name: string, phone: string) => boolean;
  onCancel: () => void;
}) {
  const [name, setName] = useState(props.customer.name);
  const [phone, setPhone] = useState(props.customer.phone);
  const { tr } = props;
  return (
    <form
      className="card form"
      onSubmit={(e) => {
        e.preventDefault();
        props.onSave(name, phone);
      }}
    >
      <h2>{tr('editCustomer')}</h2>
      <label>
        {tr('customerName')}
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </label>
      <label>
        {tr('phoneOptional')}
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" type="tel" />
      </label>
      <div className="action-row">
        <button type="submit" className="btn primary">
          {tr('save')}
        </button>
        <button type="button" className="btn ghost" onClick={props.onCancel}>
          {tr('cancel')}
        </button>
      </div>
    </form>
  );
}

/* ---------- Settings ---------- */

function Settings(props: {
  tr: (k: string) => string;
  prefs: Prefs;
  setPrefs: (fn: (p: Prefs) => Prefs) => void;
  data: LedgerData;
  onExport: () => void;
  onImport: (f: File) => void;
  onExportCsv: () => void;
}) {
  const { tr, prefs } = props;
  return (
    <div className="card form">
      <h2>{tr('settings')}</h2>

      <label>
        {tr('language')}
        <select
          value={prefs.lang}
          onChange={(e) => props.setPrefs((p) => ({ ...p, lang: e.target.value as Lang }))}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <label className="toggle-row">
        <input
          type="checkbox"
          checked={prefs.largeText}
          onChange={(e) => props.setPrefs((p) => ({ ...p, largeText: e.target.checked }))}
        />
        {tr('largeText')}
      </label>

      <h3 className="section-title">{tr('backup')}</h3>
      <div className="action-row">
        <button className="btn primary" onClick={props.onExport}>
          ⬇ {tr('exportData')}
        </button>
        <button className="btn ghost" onClick={props.onExportCsv}>
          📄 {tr('exportCsv')}
        </button>
        <label className="btn ghost file-btn">
          ⬆ {tr('importData')}
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) props.onImport(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      <p className="privacy-note">{tr('privacy')}</p>
    </div>
  );
}
