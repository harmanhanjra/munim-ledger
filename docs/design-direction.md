# Munim — Visual & Product Design Direction

> Locked design spec for v1. Style comps could not be generated (image service
> unavailable), so this document is the authoritative visual contract.
> Selected direction: **Trust Green Ledger** with bazaar-warm accessibility cues.

## Product

**Munim** (Hindi/Punjabi: मुनीम/ਮੁਨੀਮ — a traditional bookkeeper) is a free,
offline-first digital ledger (khata) for micro-merchants. No login, no ads, no
cloud. Data never leaves the device.

## Design principles

1. **Global readability first** — huge numerals, high contrast, minimum 16px
   body text, minimum 48px touch targets.
2. **Icon + label pairing** — every icon carries a text label (low-literacy
   support).
3. **One primary action per screen** — a single large thumb-zone button.
4. **Familiar metaphor** — a traditional paper ledger book, translated
   carefully to screen.
5. **Money is always right-aligned, tabular numerals.**

## Color system

| Token | Value | Use |
|---|---|---|
| `--paper` | `#FAF7F0` | App background (warm paper) |
| `--ink` | `#14532D` | Primary ink, headings, brand |
| `--accent` | `#F59E0B` | Money amounts, highlights (saffron) |
| `--card` | `#FFFFFF` | Card surfaces |
| `--line` | `#E7E0D2` | Ledger rules/dividers |
| `--danger` | `#B91C1C` | Amount owed (customer owes you) |
| `--ok` | `#15803D` | Settled / payment received |
| `--muted` | `#6B6455` | Secondary text |

Contrast: ink on paper ≥ 7:1, danger on card ≥ 5.5:1, accent used only for
large numerals.

## Typography

- System font stack (fast on low-end devices, no webfont download):
  `-apple-system, "Segoe UI", Roboto, "Noto Sans", "Noto Sans Devanagari", "Noto Sans Gurmukhi", sans-serif`
- Numerals: `font-variant-numeric: tabular-nums`.
- Scale: totals 34–40px bold, row amounts 20px semibold, body 16px, labels 14px.
- Large-text mode: root scale ×1.25 toggle, persisted.

## Primary screen (Home / Dashboard)

- Header: app name + language + settings.
- Summary card: two big numbers — **To Receive** (danger) and **Received
  today** (ok).
- Customer list: name, last activity date, outstanding amount color-coded.
  Tap → customer detail.
- Floating primary action: large green **"+ Add Entry"** button, bottom-right.
- Empty state: friendly guidance with a big first-action button.

## Customer detail

- Header: name, phone (optional), balance.
- Action row: **Give credit** / **Take payment** (two big buttons).
- Entry list (ledger lines): date, note, signed amount.
- Share reminder via WhatsApp/SMS text (deterministic generated message).

## Add entry form

- Big segmented choice first: Credit (given) vs Payment (received).
- Numeric keypad-friendly amount input, optional note, optional date.
- Validation messages inline, in the user's language.

## Settings

- Language: English / हिन्दी / ਪੰਜਾਬੀ.
- Large text toggle.
- Backup: export JSON / import JSON.
- Data notice: "All data stays on this device."
