# HMS Hotel

Hotel Property Management System built with **Next.js**, **TypeScript**, and **Tailwind CSS v4**,
using the [TailAdmin](https://tailadmin.com) dashboard design system.

The front-desk workflow is modelled on [Little Hotelier](https://www.littlehotelier.com/id/lh-demo/):
a centralised availability calendar, daily operations, and revenue insights.

All data lives in the browser via `localStorage` — there is no database or backend.

## Features

### Daily operations dashboard

- Occupancy, room revenue, ADR, and RevPAR for today and the coming week
- Arrivals / departures / in-house lists with one-click check-in and check-out
- 14-day forecast of rooms sold against expected revenue
- Live housekeeping breakdown

### Booking calendar

- **Timeline (tape chart)** — rooms as rows, nights as columns, stays as bars.
  Grouped by room type, sticky room column, 7/14/30-day windows.
  Click any open night to start a booking; click a stay to manage it.
- **Month** — calendar overview of every stay, drag to select a date range.

### Reservations

- Search and filter by status, with nights and stay totals
- Overlap protection: a room cannot be double-booked
- Check-in and check-out transitions that move room status automatically

### Rooms & guests

- Room inventory with type, floor, nightly rate, and housekeeping status
- Guest directory with contact and ID details

### Insights

- Occupancy trend for past or upcoming 7 / 30 / 90 days
- ADR and RevPAR summaries
- Revenue and room nights broken down by room type

## Requirements

- Node.js 20+

## Setup

```bash
npm install
```

## Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sample data is seeded on first visit.

## Build

```bash
npm run build
npm start
```

## Checks

```bash
npx tsc --noEmit   # types
npm run lint       # eslint
```

## Project layout

```
src/app/                     App Router pages (dashboard, calendar, reservations,
                             rooms, guests, insights)
src/layout/                  TailAdmin shell: AdminShell, AppSidebar, AppHeader
src/context/                 Sidebar collapse + light/dark theme
src/components/calendar/     TapeChart timeline and month calendar
src/components/dashboard/    Metric cards, forecast chart, operations lists
src/components/insights/     Occupancy and revenue charts
src/components/reservations/ Shared booking + detail dialogs
src/components/ui/           TailAdmin kit: table, modal, badge, button
src/lib/store.ts             localStorage store, business rules, seed data
src/lib/useHotelData.ts      useSyncExternalStore hook — pages re-render on any change
src/lib/metrics.ts           Occupancy, ADR, RevPAR, revenue calculations
src/lib/api.ts               Async wrappers around the store
src/lib/types.ts             Shared TypeScript types
```

## Notes on the data layer

`src/lib/store.ts` is a synchronous `localStorage`-backed store that exposes a
`subscribe` / `getSnapshot` pair. Pages read it through `useHotelData`, which
wraps `useSyncExternalStore`, so a mutation on one page immediately refreshes
every other view without manual refetching.
