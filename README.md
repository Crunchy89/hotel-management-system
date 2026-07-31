# HMS Hotel

Hotel Property Management System built with **Next.js**, **TypeScript**, and **Tailwind CSS**.

Data is stored in the browser via `localStorage` (no database).

## Features

- Rooms inventory with status (available, occupied, cleaning, maintenance)
- Guest profiles
- Reservations with overlap protection
- Check-in / check-out flows that update room status
- Sample data seeded on first visit

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

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Project layout

```
src/app/              App Router pages
src/components/       UI shell, modals, badges
src/lib/store.ts      Client-side data + business rules
src/lib/api.ts        Thin async wrappers used by pages
src/lib/types.ts      Shared TypeScript types
```
