import { useEffect, useMemo, useState } from 'react';
import {
  customerBalance,
  formatRupees,
  makeId,
  parseRupees,
  reminderLink,
  statementText,
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
import { t, type Lang } from './i18n';
import { loadPrefs, todayIso, type Prefs } from './prefs';
import Home from './views/Home';
import CustomerView from './views/CustomerDetail';
import { AddCustomer, AddEntry, EditCustomer } from './forms';
import Settings from './Settings';

type View =
  | { name: 'home' }
  | { name: 'customer'; id: string }
  | { name: 'addEntry'; customerId: string | null; initialType?: EntryType }
  | { name: 'addCustomer' }
  | { name: 'editCustomer'; id: string }
  | { name: 'settings' };

export default function App() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [data, setData] = useState<LedgerData>(load);
  const [view, setView] = useState<View>({ name: 'home' });
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    localStorage.setItem('munim.prefs.v1', JSON.stringify(prefs));
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
      setToast(tr('invalidAmount'));
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
            const stmt = statementText({
              name: c.name,
              balancePaise: bal,
              entries,
              labels: {
                due: bal < 0 ? tr('youWillGive') : tr('youWillGet'),
                credit: tr('giveCredit'),
                payment: tr('takePayment'),
              },
            });
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
                statementHref={entries.length > 0 ? reminderLink(c.phone, stmt) : null}
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
