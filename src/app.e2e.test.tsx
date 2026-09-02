// @vitest-environment jsdom
/**
 * End-to-end user-flow test against the real App component:
 * add customer -> give credit -> take payment -> verify dashboard balances
 * and localStorage persistence.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Munim app user flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('signup -> ledger -> payment -> persist', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Empty state guides the first action.
    expect(screen.getByText('No customers yet')).toBeTruthy();

    // Add a customer.
    await user.click(screen.getByRole('button', { name: 'Add customer' }));
    await user.type(screen.getByLabelText('Customer name'), 'Ram Kumar');
    await user.type(screen.getByLabelText('Phone (optional)'), '9876543210');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Back home: customer listed, settled.
    expect(screen.getByText('Ram Kumar')).toBeTruthy();
    expect(screen.getByText('Settled')).toBeTruthy();

    // Give credit of 150.
    await user.click(screen.getByText('Ram Kumar'));
    await user.click(screen.getByRole('button', { name: 'Gave credit' }));
    await user.type(screen.getByLabelText('Amount (₹)'), '150');
    await user.type(screen.getByLabelText('Note (optional)'), 'rice 5kg');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Customer view shows the outstanding balance.
    expect(screen.getByTestId('customer-balance').textContent).toBe('₹150');

    // Take payment of 50.
    await user.click(screen.getByRole('button', { name: 'Received payment' }));
    await user.type(screen.getByLabelText('Amount (₹)'), '50');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('customer-balance').textContent).toBe('₹100');

    // Dashboard totals: 100 to receive, 50 received today.
    await user.click(screen.getByRole('button', { name: '← Customers' }));
    expect(screen.getByTestId('to-receive').textContent).toBe('₹100');
    expect(screen.getByTestId('received-today').textContent).toBe('₹50');

    // Data persisted to localStorage.
    const stored = JSON.parse(localStorage.getItem('munim.ledger.v1') || '{}');
    expect(stored.customers).toHaveLength(1);
    expect(stored.entries).toHaveLength(2);
  });

  it('rejects an invalid amount with a visible message', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Add customer' }));
    await user.type(screen.getByLabelText('Customer name'), 'Shyam');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await user.click(screen.getByRole('button', { name: /Add entry/ }));
    await user.type(screen.getByLabelText('Amount (₹)'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('status').textContent).toBe('Enter a valid amount');
    // We stayed on the form; no entry was created.
    const stored = JSON.parse(localStorage.getItem('munim.ledger.v1') || '{}');
    expect(stored.entries).toHaveLength(0);
  });

  it('search with no matches shows a no-results message, not onboarding', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Add customer' }));
    await user.type(screen.getByLabelText('Customer name'), 'Ram');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await user.type(screen.getByLabelText('Search customers'), 'zzz');
    expect(screen.getByText('No customers match your search')).toBeTruthy();
    expect(screen.queryByText('No customers yet')).toBeNull();
  });

  it('edits a customer name and reflects it everywhere', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Add customer' }));
    await user.type(screen.getByLabelText('Customer name'), 'Ram');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await user.click(screen.getByText('Ram'));
    await user.click(screen.getByRole('button', { name: 'Edit customer' }));
    const nameInput = screen.getByLabelText('Customer name') as HTMLInputElement;
    expect(nameInput.value).toBe('Ram');
    await user.clear(nameInput);
    await user.type(nameInput, 'Ram Kumar');
    await user.type(screen.getByLabelText('Phone (optional)'), '9876543210');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Back on the customer view with the updated name.
    expect(screen.getByText('Ram Kumar')).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem('munim.ledger.v1') || '{}');
    expect(stored.customers[0].name).toBe('Ram Kumar');
    expect(stored.customers[0].phone).toBe('9876543210');
  });
});
