# HMS Hotel — Front desk app

Single-hotel **front office** app for properties that subscribe to our HMS SaaS.

Receptionists run day-to-day operations here. Hotel **owners / managers** use the same workspace for inventory, rates, channels, and performance. **Multi-hotel / SaaS admin** (tenant onboarding, billing, portfolio dashboards) lives in a **separate app** — this product is scoped to one property at a time.

Built with **Next.js**, **TypeScript**, and **Tailwind CSS v4** ([TailAdmin](https://tailadmin.com)). Demo data is stored in the browser (`localStorage`); currency is **IDR**; UI language toggles **English ↔ Indonesian**.

## Who this app is for

| Role | What they do here |
|------|-------------------|
| **Receptionist** | Bookings, availability, check-in/out, folio, keys, guests, housekeeping handoff, guest messages/chat |
| **Owner / GM** | Room inventory & types, rates & yield, channels, insights, hotel services catalog, reports |
| **SaaS / multi-hotel ops** | **Not this app** — portfolio, tenants, and billing are handled elsewhere |

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

Open [http://localhost:3000](http://localhost:3000). Sample property data is seeded on first visit.

```bash
npm run build && npm start
npx tsc --noEmit
npm run lint
```

---

## Features for receptionists

Front-desk work for one hotel.

### Arrivals, stays, and departures

- **Reservations calendar (tape chart)** — rooms × nights, colour-coded stays, 7 / 14 / month views
- **Find available rooms** — dates, room type, party size (adults / children / infants); reserve offline
- **Find a booking** — booking code + guest last name
- Check-in / check-out with automatic room status changes
- Cancel booked stays; move a guest to another room
- Overlap protection (no double-booking)

### Guest & stay details

- Guest profiles (name, contact, ID)
- Folio: room charges, extras, payments, balance due
- Notes and booking source
- Key card encode (after check-in) + self check-in QR; keys revoked on check-out or room move

### Daily ops

- **Dashboard** — occupancy, arrivals, departures, in-house snapshot
- **Housekeeping** — cleaning status by room and date
- **Guest messages** — outbound templates / history
- **Client chat** — staff-side guest conversations
- **Check-in report** — arrivals / departures lists, export / print helpers
- **Booking activity** — audit trail of booking events

### Guest-facing hotel services

- Staff maintain the **Hotel services** catalog (spa, laundry, transfer, …)
- Guests see active services on mobile at `/m/services`

---

## Features for owners / managers

Property setup and commercial control for the hotel using our SaaS.

### Inventory & product

- **Manage Room** — room numbers, floors, rates, status
- **Room types** — bed size, amenities (AC, TV, Wi‑Fi, …), capacity (adults / children / infants)
- **Hotel services** — priced extras shown to guests on mobile

### Revenue & distribution

- **Rooms & Prices** — rate plans and daily rates / availability
- **Yield rules** — automated price adjustments by date / LOS / %
- **Channels** — connected OTAs / direct booking status
- **Channel manager** — push rates & availability (simulated sync in this demo)

### Performance

- **Insights** — occupancy trend, ADR, RevPAR, revenue by room type
- Dashboard KPIs for today and the near term
- Booking activity for operational oversight

### Workspace

- Staff sign-in (demo)
- Light / dark theme
- EN / ID language toggle
- IDR (Rupiah) throughout

---

## Out of scope (other SaaS app)

Handled by the **multi-hotel / platform** product, not this receptionist app:

- Multiple properties under one login / portfolio switcher
- Tenant onboarding, subscriptions, and billing
- Cross-hotel reporting for the SaaS operator
- Central user directory across hotels

---

## Roadmap — still needed for a full hotel SaaS property app

Gaps that reception and owners typically still need on **this** property app (not the multi-hotel console).

### Reception

- [ ] Role-based access (receptionist vs owner vs housekeeping) inside the property
- [ ] Deposits, cancellation / no-show rules, and automatic charges
- [ ] Split / master–guest folios; city ledger / company accounts
- [ ] Night audit (end-of-day close)
- [ ] Card / QRIS / e-wallet payments (PCI-aware)
- [ ] Official invoices / tax invoices
- [ ] Group bookings and allotments
- [ ] Waitlist and controlled overbooking
- [ ] Real email / SMS / WhatsApp delivery
- [ ] In-stay **service ordering** (not catalog-only) posting to folio
- [ ] Digital registration card / ID capture
- [ ] Housekeeping task assignment on mobile

### Owner / revenue

- [ ] Live two-way OTA / channel-manager sync (replace simulation)
- [ ] Direct booking engine / widget for the hotel website
- [ ] Deeper financial reports and accounting export
- [ ] Policies, packages, and corporate rates
- [ ] Maintenance / out-of-order with work orders

### Platform (shared with SaaS backend)

- [ ] Real API + database (replace `localStorage`)
- [ ] Cloud sync across front-desk devices
- [ ] Property profile (address, tax ID, standard check-in/out times)

---

## Project layout

```
src/app/                 Property pages (dashboard, reservations, rooms, rates,
                         guests, messages, chat, housekeeping, services,
                         reports, channels, insights, login, m/services)
src/layout/              Reception shell (sidebar, header)
src/context/             Auth, sidebar, theme, locale
src/components/          Front-desk and owner UI
src/lib/store.ts         Browser store + business rules (demo)
src/lib/api.ts           Async wrappers
src/lib/i18n/            EN / ID copy
src/lib/metrics.ts       Occupancy, ADR, RevPAR, IDR formatting
```

## Data layer

`src/lib/store.ts` keeps one hotel’s data in `localStorage`. `useHotelData` uses `useSyncExternalStore` so every screen stays in sync when reception or ownership changes something. Production SaaS will swap this for a backend API while keeping the same front-desk workflows.
