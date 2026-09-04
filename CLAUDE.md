# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

PlanMoney is a personal finance/task planner web app: an Express + Prisma (PostgreSQL) API in `server/`, and a React (Vite + Tailwind v4) SPA in `client/`. These are two independent npm projects with no shared root package.json or workspace config — install and run each separately.

Code comments, error messages, and UI copy in this repo are written in Ukrainian. Match that convention when editing existing files.

## Commands

### Server (`server/`)
```
npm install
npm run dev      # nodemon index.js — runs on http://localhost:3000
npm start        # node index.js
npx prisma generate           # regenerate Prisma client after schema.prisma changes
npx prisma migrate dev --name <migration_name>   # create + apply a migration
```
Requires a `.env` with `DATABASE_URL` (Postgres connection string) and `JWT_SECRET`. There is no test suite or lint config in `server/`.

### Client (`client/`)
```
npm install
npm run dev       # Vite dev server
npm run build     # production build
npm run lint      # ESLint (flat config, eslint.config.js)
npm run preview   # preview production build
```
There is no test suite configured for the client.

## Architecture

### Server: routes → middleware → controllers → Prisma
`server/index.js` wires everything: each resource has a `routes/<x>Routes.js` file mounted at a base path, paired with a `controllers/<x>Controller.js` that contains the actual logic and talks to Prisma directly (no service/repository layer).

- `/` → `homeRoutes` (public)
- `/auth` → `authRoutes` (public — register/login, issues JWT)
- `/transactions`, `/tasks`, `/categories` → each wrapped in `authMiddleware` at the `app.use()` level in `index.js`, not per-route

`authMiddleware` (`server/middleware/authMiddleware.js`) expects `Authorization: Bearer <token>`, verifies it with `JWT_SECRET`, and sets `req.userId` — every downstream controller for a protected resource filters/scopes Prisma queries by `req.userId` (see `transactionController.js`) rather than trusting a client-supplied user id.

`server/prismaClient.js` is the single Prisma client instance (using `@prisma/adapter-pg` — Prisma 7 requires an explicit driver adapter rather than a bare connection string). Import this shared instance in controllers instead of instantiating `PrismaClient` directly.

Data model (`server/prisma/schema.prisma`): `User` has many `Transaction`, `Task`, and `Category`, each owned via a `userId` foreign key. `Transaction.type` and `Category.type` are free-form strings (e.g. income/expense), not enums.

### Client: page-per-route, no shared state layer yet
`client/src/main.jsx` sets up `BrowserRouter`; `client/src/App.jsx` renders a persistent sidebar and a `<Routes>` table mapping each nav item to a component in `client/src/pages/` (Dashboard, Calendar, Tasks, Finance, Analytics, Settings, Login). There is currently no global state management, API client abstraction, or auth-context — each page is expected to fetch its own data (see how `Finance.jsx`/`Dashboard.jsx` call the server directly) and CORS is wide open on the server (`app.use(cors())`, no origin restriction) to support this during development.

Styling is Tailwind v4 via the `@tailwindcss/vite` plugin (configured in `client/vite.config.js`), not a separate `tailwind.config.js`/PostCSS setup.

### `playground/`
Standalone `index.html`, unrelated to the client or server build — not part of either npm project.
