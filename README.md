# HMS Hotel

Hotel Property Management System (HMS / PMS) built with **Next.js**, **TypeScript**, and **Tailwind CSS v4**, using the [TailAdmin](https://tailadmin.com) dashboard design system.

The front-desk workflow is modelled on products like [Little Hotelier](https://www.littlehotelier.com/): a centralised availability calendar, daily operations, channel tools, and revenue insights.

All data lives in the browser via `localStorage` — there is no database or backend yet. Demo staff login is client-side only. Currency is **IDR (Rupiah)**; UI language can be toggled **English ↔ Indonesian**.

## Demo login

```
Email:    reception@hmshotel.com
Password: demo
```

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sample data is seeded on first visit (`hms-hotel-data-v4`).

```bash
npm run build && npm start   # production
npx tsc --noEmit             # types
npm run lint                 # eslint
```

---

## Features in the app

### Shell & platform

| Feature | Notes |
|--------|--------|
| Staff sign-in | Demo auth gate for admin pages |
| Sidebar navigation | Top ops items + Report + Channel manager sections |
| Light / dark theme | Persisted preference |
| EN / ID language toggle | Whole-app UI copy via dictionaries |
| Rupiah (IDR) formatting | Rates, folios, charts, reports |
| Support widget | In-app HMS support chat + report error modal |

### Dashboard (`/`)

- Today’s occupancy, available / occupied rooms, guests
- Arrivals, departures, active bookings
- Revenue snapshot and short-horizon forecast chart
- Housekeeping / room-status overview

### Insights (`/insights`)

- Occupancy trend (7 / 30 / 90 day windows)
- ADR and RevPAR summaries
- Revenue and room nights by room type

### Reservations & calendar (`/reservations`)

- **Tape chart** — rooms as rows, nights as columns, colour-coded stay bars; 7d / 14d / month views; sticky room column; rooms-available row; cancelled stays toggle
- **Find available rooms** — date range, room type, party size (adults / children / infants); capacity filtered by room-type limits; reserve offline
- **Find a booking** — booking code + guest last name
- Create / edit stay, folio (charges & payments), guest details, notes
- Check-in / check-out with room status updates; cancel booked stays
- **Move room** — relocate stay; live key cards revoked on move
- **Key card + QR** — mock encoder after check-in; revoke on check-out or room move
- Overlap protection (no double-booking)
- Booking source badge; offline / channel-style sources

### Manage Room (`/rooms`)

- Room inventory: number, type, floor, nightly rate (IDR), status
- Quick status actions (available / maintenance / cleaning)
- **Room types** — label, bed size, amenities (AC, TV, Wi‑Fi, …), max adults / children / infants
- Amenities and capacity inherited by every room of that type

### Rooms & Prices (`/rates`)

- Rate plans per room type / package templates
- Daily rate and availability grid
- Bulk update rates / availability by date range and weekdays

### Guests (`/guests`)

- Guest directory (name, email, phone, ID document)
- Add / edit profiles used by bookings

### Guest messages (`/messages`)

- Outbound guest message templates / history (confirmation, pre-arrival, etc.)

### Client chat (`/chat`)

- Staff-side guest conversation inbox (demo)

### Housekeeping (`/housekeeping`)

- Per-room cleaning status for a selected date
- Notes and status updates (pending → in progress → clean → inspected)

### Hotel services (`/services`)

- Catalog of guest extras (room service, spa, laundry, transfer, dining, …)
- Name, description, category, IDR price, show/hide on mobile
- Guest mobile catalog at `/m/services` (no staff login)

### Reports

- **Check-In** (`/check-in`) — arrivals / departures report, CSV / print helpers
- **Booking activity** (`/booking-activity`) — audit trail of booking events (create, pay, check-in/out, move, key encode/revoke, cancel)

### Channel manager

- **Channel manager** (`/channel-manager`) — push-style rates / availability to connected channels (simulated)
- **Channels** (`/channels`) — connected OTA / direct channel status and settings
- **Yield rules** (`/yield-rules`) — automated pricing rules (length of stay, % adjust, date windows)

### Mobile guest surface

- `/m/services` — phone-width list of active hotel services for guests

---

## Must-have HMS features not built yet

These are standard for a production hotel PMS. They are **not** in this demo app today and are the natural next backlog.

### Property & identity

- [ ] Real multi-user auth (SSO / password reset) with **roles & permissions** (front desk, housekeeping, revenue, owner)
- [ ] Multi-property / multi-hotel chain support
- [ ] Property profile (address, tax ID, check-in/out times, policies)
- [ ] Staff audit log (who changed what, when)

### Reservations & inventory

- [ ] Group bookings / allotments / blocks
- [ ] Waitlist and overbooking controls
- [ ] Company / travel-agent / corporate rate accounts
- [ ] Deposit, cancellation, and no-show policies with automatic charges
- [ ] Split / master–guest folios; city ledger
- [ ] Night audit (end-of-day close, room & tax posting)
- [ ] Maintenance / out-of-order rooms with work orders

### Payments & accounting

- [ ] Payment gateway (card / QRIS / e-wallet) with PCI-aware flow
- [ ] Official invoices / tax invoices (e.g. Indonesian e-Faktur)
- [ ] Accounting export (journal, AR aging) and ERP integration
- [ ] Refunds, voids, and cashier shift / cash drawer

### Channels & distribution

- [ ] Live OTA / channel-manager API sync (not simulated)
- [ ] Two-way ARI (availability, rates, inventory) and reservation delivery
- [ ] Booking engine / direct booking website widget
- [ ] Metasearch and GDS connectivity

### Guest experience

- [ ] Full guest mobile / web app (book, modify, digital registration card)
- [ ] In-stay service **ordering** (not catalog-only) with folio posting
- [ ] Real email / SMS / WhatsApp delivery for confirmations and reminders
- [ ] ID / passport scan and document storage
- [ ] Loyalty / CRM segments and marketing preferences
- [ ] Online check-in / check-out and express bill settlement

### Operations

- [ ] Housekeeping mobile app with task assignment and photos
- [ ] Minibar / POS / F&B outlet posting into the folio
- [ ] Lost & found
- [ ] Concierge / task management beyond chat

### Platform

- [ ] Backend API + database (replace `localStorage`)
- [ ] Cloud backup, multi-device sync, and offline conflict handling
- [ ] Webhooks and public API for partners
- [ ] Automated tests (unit / e2e) and CI environments
- [ ] Data residency / GDPR-style consent and retention controls

---

## Project layout

```
src/app/                     App Router pages (dashboard, reservations, rooms,
                             rates, guests, messages, chat, housekeeping,
                             services, check-in, booking-activity, channels,
                             channel-manager, yield-rules, insights, login,
                             m/services)
src/layout/                  Admin shell, sidebar, header
src/context/                 Auth, sidebar, theme, locale, support chat
src/components/              Feature UI (calendar, reservations, dashboard, …)
src/lib/store.ts             localStorage store, business rules, seed data
src/lib/api.ts               Promise wrappers around the store
src/lib/useHotelData.ts      useSyncExternalStore subscription hook
src/lib/metrics.ts           Occupancy, ADR, RevPAR, currency helpers
src/lib/i18n/                EN / ID dictionaries
src/lib/types.ts             Shared TypeScript types
```

## Data layer

`src/lib/store.ts` is a synchronous `localStorage`-backed store with `subscribe` / `getSnapshot`. Pages use `useHotelData` (`useSyncExternalStore`), so a mutation on one screen refreshes every other view without manual refetching.

Seeded demo rates and services use Indonesian Rupiah amounts. Changing language does not change currency — amounts stay in IDR.
