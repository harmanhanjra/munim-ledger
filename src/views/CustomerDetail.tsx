import { formatRupees, type Customer, type Entry, type EntryType } from '../ledger';

export default function CustomerView(props: {
  tr: (k: string) => string;
  customer: Customer;
  balance: number;
  entries: Entry[];
  onBack: () => void;
  onAdd: (type: EntryType) => void;
  onEdit: () => void;
  onDelete: () => void;
  reminderHref: string | null;
  statementHref: string | null;
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
        {props.statementHref && (
          <a className="btn ghost" href={props.statementHref} target="_blank" rel="noreferrer">
            📤 {tr('shareStatement')}
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
