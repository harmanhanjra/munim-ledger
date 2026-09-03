import { customerBalance, formatRupees, lastActivity, type Customer, type Entry } from '../ledger';

export default function Home(props: {
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
