# 🍗 Wing Wars

> *Two wings enter. One wing is crowned.*

Wing Wars is a cozy, vaguely Studio-Ghibli-flavored web app for settling the most important debate of all:
**whose wings are best?** Pit chicken wings from different restaurants against each other, judge them on the
five elements, and watch the rankings drift like clouds over the hills.

Built with Next.js 16 (App Router, Cache Components), Tailwind CSS 4, Better Auth and Drizzle ORM on
SQLite/libSQL. It runs entirely locally with zero config, and is designed to deploy to Vercel with a free Turso
database.

---

## The concept

### 🏮 Spots & wings
A **spot** is any restaurant, bar or shack that serves wings. Each spot has **wings**: a specific flavor/style
like *Honey Garlic (bone-in)*, with an advertised heat level from 0 (*No heat*) to 5 (*Volcanic*).

Every wing gets its own **wing spirit**: a little procedurally generated forest creature (drumstick or nugget,
depending on style). Its color comes from the heat level, and its face, crispy bits and sauce drips come from
the wing's ID. Hot wings grow flames, champions wear crowns of leaves, and losers look a bit dazed.

### ⚔️ Battles
The core loop. Eat two wings side by side, then score **each** on the **five elements** (1–10):

| | Element | What it means |
|---|---|---|
| 🍂 | **Crisp** | Shatter, crackle, crunch |
| 🍯 | **Sauce** | Flavor, coverage, stickiness |
| 💧 | **Juiciness** | Tender, moist, meaty |
| 🔥 | **Heat** | How *good* the burn is (not just how hot) |
| 🪙 | **Value** | Worth the coin? |

The winner defaults to the higher total, but you can overrule your own scorecard (a "heart-over-head
verdict"). Every battle gets a **battle report** with a tale-of-the-tape comparison, an overlaid flavor-radar
chart, rating changes, the all-time head-to-head record, and a little shower of falling leaves.

### 📈 Ratings & ranks
Wings carry a shared **Elo rating**: they start at 1200 with K = 32. Beating a stronger wing earns a lot,
and losing to an underdog costs a lot. Ratings map to ranks:

`Lost Crumb → Dust Sprite → Meadow Wanderer → Hilltop Hero → Sky Captain → Forest Guardian → Great Sauce Spirit`

The **leaderboard** puts the top three on a podium of rolling hills, and also lists the most devoted judges.

### 🏯 Tournaments
For wing nights. Pick 4, 8 or 16 wings, seed them by rating (1v8, 4v5, …) or draw at random, then tap the
winner of each match through the bracket. Saving it records every match as a battle, so ratings move. The
server replays the bracket itself to check it, so nobody can sneak a wing into the final.

### 📓 Tastings & judges
You can also log a **solo tasting** (one scorecard, no opponent). It feeds the wing's average flavor profile
but doesn't touch its Elo. Every user has a **judge page** with a title (*Apprentice Taster → Elder of the
Fryer*), their battles, their tasting journal and their highest-scored wing.

---

## Running it locally

Requires Node 20+.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

That's it. `npm run dev` runs a `predev` step that creates `local.db` (SQLite), applies the migrations and,
if the database is empty, seeds a small demo world: 7 spots, 18 wings, 4 judges, about a month of battles and
one tournament.

**Demo login:** `demo@wingwars.local` / `wingwars`. You can also create your own account on the sign-in page
(email + password, stored locally).

### Useful scripts

| Script | What it does |
|---|---|
| `npm run dev` | Prepare the local DB (migrate + seed if empty), then start Next.js |
| `npm run build` / `npm start` | Production build / server |
| `npm run vercel-build` | Applies migrations to the configured DB, then builds (Vercel runs this automatically) |
| `npm test` | Unit tests (Vitest): Elo, ranks and bracket logic |
| `npx playwright test` | End-to-end smoke test: sign up → battle → add spot/wing → tasting → tournament |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:generate` | Generate a new migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to whatever DB the env points at |
| `npm run db:seed` | Seed demo data (only if the DB is empty) |
| `npm run db:reset` | Delete `local.db` (the next `npm run dev` recreates and reseeds it) |
| `npm run db:studio` | Browse the database in Drizzle Studio |

---

## Tech choices (and why)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** App Router, Server Actions, Cache Components | You asked for Next.js on Vercel. All mutations are server actions; pages stream behind Suspense boundaries. |
| Styling | **Tailwind CSS 4** with a custom palette | Sunlit meadow by day, lantern-lit night sky in dark mode (follows the OS setting). Fonts: *Fraunces* (soft, slightly wonky serif) and *Zen Maru Gothic* (rounded). |
| Database | **SQLite via libSQL + Drizzle ORM** | Locally it's a plain file with no Docker and no account. In production the same driver talks to **Turso**, whose free tier is generous. |
| Auth | **Better Auth** (email + password, optional GitHub) | Self-hosted in your own DB, free, and works offline in local mode with no third-party service. GitHub OAuth turns on automatically when its env vars are set. |
| Art | Hand-written inline SVG | Clouds, hills, cottage, moon, fireflies and wing spirits are all code. No image hosting needed. |

There's no image upload, payment or email. All the illustration is generated, so the free tiers cover
everything.

## Project layout

```
src/
  app/                 routes (App Router)
    page.tsx           home: hero, reigning champion, recent battles, top wings
    battle/            the battle scorecard form
    battles/[id]/      battle report
    leaderboard/       podium + rankings
    spots/, wings/     browse, detail pages, add forms
    tournament/        bracket runner (client) ▸ tournaments/[id] results
    judges/[id]/       user profile / journal
    sign-in/           email+password (and optional GitHub) auth
    actions.ts         all server actions (validated with zod)
    api/auth/[...all]  Better Auth handler
  components/          wing-spirit, scenery, radar chart, bracket view, cards…
  db/                  Drizzle schema + client (local file or Turso)
  lib/                 auth, session, queries, Elo, ranks, scoring, bracket logic
scripts/               setup-local (migrate+seed), migrate, seed, reset
drizzle/               SQL migrations
tests/                 unit (vitest) + e2e (playwright)
```

## Deploying

See **[TODOS.md](./TODOS.md)** for the steps to go live: a Turso database, a Vercel project and a few
environment variables. It takes about 15 minutes.
