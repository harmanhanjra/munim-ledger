# Munim — Free Digital Ledger (मुनीम / ਮੁਨੀਮ)

A free, offline-first digital ledger (khata) for micro-merchants. Track who
owes you what, record payments, send gentle reminders — with **no login, no
ads, no cloud**. All data stays on your device.

## What is this?

Small shop owners across South Asia keep paper ledgers (bahí-khata) to track
daily credit ("udhaar"). Paper gets lost, arithmetic goes wrong, and existing
apps demand phone-number logins, show ads, and upload your customer data.
Munim is the alternative: a web app that behaves like a private paper ledger.

## Who is it for?

- Kirana shops, street vendors, tailors, repair stalls, small service providers
- Anyone who extends small daily credit and wants a reliable, private record
- Low-literacy and elderly users (large-text mode, icon+label buttons)

## Why does it exist?

- 56% of small businesses name cash flow / invoice tracking as an ongoing pain
- Existing ledger apps require login + app install and monetize with loans/ads
- Many merchants work on cheap phones with unreliable connectivity

## Features

- Customer ledger: give credit, record payments, per-customer balances
- Dashboard: total to receive, received today
- WhatsApp / SMS payment reminders (deterministic message, one tap)
- Offline-first: installable PWA, works with no network
- Backup: export/import JSON, validated on import
- Languages: English, हिन्दी, ਪੰਜਾਬੀ (add more in `src/i18n.ts`)
- Accessibility: large-text mode, high contrast, 48px+ touch targets,
  keyboard navigable, icon+label pairing
- Privacy: zero network calls, zero accounts, zero analytics

## Architecture

Static single-page app — no backend, no database by design.

```
src/
  ledger.ts        pure core logic (paise integers, balances, validation)
  storage.ts       versioned localStorage + backup import/export validation
  i18n.ts          EN/HI/PA dictionaries + reminder message templates
  App.tsx          all views (home, customer, add-entry, settings)
  style.css        design system (see docs/design-direction.md)
  *.test.ts(x)     unit + E2E user-flow tests (Vitest)
public/            PWA manifest, service worker, icon
automation/        ATLAS hourly research worker (separate concern, not the app)
```

Money is stored as integer paise to avoid floating-point errors. All amounts
the user types are parsed and validated before touching state.

## Installation

Requires Node.js 22.22+ (the test tooling needs it; the app itself runs on any
modern browser).

```bash
npm install
npm run dev       # develop
npm test          # run all tests
npm run build     # production build to dist/
npm run preview   # serve the production build locally
```

Note: no `package-lock.json` is committed at this stage; `npm install`
resolves current compatible versions. Pin the lock before production reuse.

## Deployment

Static hosting only — deploy `dist/` to any static host. The included
`.verdentc.json` configures Verdent's publish pipeline (`npm ci && npm run
build`, output `dist/`).

## Testing

```bash
npm test
```

- Unit: balance math, rupee parsing/formatting, validators, reminder links
- Storage: strict validation of untrusted backup JSON (malformed shapes)
- i18n: dictionary completeness across all languages, variable substitution
- E2E: full user flow (add customer → credit → payment → dashboard → persistence)
  and rejection of invalid input

## Security & Privacy

- No server, so there is no server to breach; nothing to leak
- Backup files are validated defensively before being loaded
- No secrets in source; the app makes no network requests
- Reminder sharing opens WhatsApp with a pre-filled message — nothing is sent
  without an explicit user action
- CSV export neutralizes spreadsheet formula prefixes to prevent CSV injection

## Limitations

- Data is stored per-browser (localStorage). Clearing browser data erases it —
  use Export backup regularly. (Optional cloud sync is deliberately absent.)
- Reminders require WhatsApp or SMS to be installed; the app only pre-fills.
- Not double-entry accounting — it is a simple receivables ledger.

## Roadmap

- Receipt sharing as a printable/viewable page
- Multi-book support (separate shop / personal)
- Voice input for amounts in low-literacy contexts

## Contributing

PRs welcome. Please add tests for behavior changes and keep the core logic
(`ledger.ts`) framework-free.

## License

MIT
