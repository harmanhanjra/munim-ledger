import { useState } from 'react';
import { type Customer, type EntryType } from './ledger';
import { todayIso } from './prefs';

export function AddCustomer(props: {
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

export function AddEntry(props: {
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

export function EditCustomer(props: {
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
