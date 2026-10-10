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

### 🏮 Spots, wings & wing types
The data model has three layers:

- A **spot** is any restaurant, bar or shack that serves wings.
- A **wing type** is a canonical kind of wing (*Buffalo*, *Lemon Pepper*, *Garlic Parmesan*, *Asian Glaze*,
  *Nashville Hot*… 13 to start, and people can add more).
- A **wing** is one specific offering: a spot's take on a type, e.g. *Hilltop Hot* (a Buffalo wing at Windmill
  Hill Wing Shack). It has a style (bone-in/boneless) and an advertised heat level from 0 (*No heat*) to 5
  (*Volcanic*).

Wings and spots are **judged separately**, and each has its own rating, ranks and leaderboard.

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

### 🏮 Judging spots
Restaurants get judged on the whole visit, not just one wing. A **spot showdown** pits two spots head to head,
and you can leave a solo **review** on any spot's page. Spots are scored on the **five virtues** (1–10):

| | Virtue | What it means |
|---|---|---|
| 🍗 | **Wing Game** | How good is the wing menu overall? |
| 🥣 | **Sides & Dips** | Ranch, blue cheese, fries, celery |
| 🏮 | **Vibe** | Cozy? Lively? Somewhere you'd linger? |
| 🙇 | **Service** | Friendly, quick, napkins on hand |
| 🪙 | **Value** | Worth the coin? |

Every spot is drawn as its own paper-lantern spirit. A spot can serve the best wing in town and still lose a
showdown if the service is grim.

### 🍃 Wing types
Each type has its own leaderboard ("the best Buffalo in the land"). You can run **same-type showdowns**: the
battle form and the tournament picker can both filter by type. Types are also ranked **against each other** by
their record in battles between *different* types, which settles the Buffalo vs. Lemon Pepper question. Same-type
battles crown the best wing within a type but don't count toward the cross-type standings.

### 📈 Ratings & ranks
Wings and spots each carry a shared **Elo rating**: they start at 1200 with K = 32. Beating a stronger rival
earns a lot, and losing to an underdog costs a lot. Ratings map to ranks:

- Wings: `Lost Crumb → Dust Sprite → Meadow Wanderer → Hilltop Hero → Sky Captain → Forest Guardian → Great Sauce Spirit`
- Spots: `Abandoned Shack → Roadside Stall → Village Tavern → Hilltop Inn → Famous Teahouse → Grand Festival Hall → Legendary Bathhouse`

The **leaderboard** has three tabs: wings and spots (top three on a podium of rolling hills) and wing types
(a cross-type standings table). It also lists the most devoted judges.

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
if the database is empty, seeds a small demo world: 7 spots, 20 wings across 13 wing types, 4 judges, about a
month of wing battles and spot showdowns, and one tournament.

**Demo login:** `demo@wingwars.local` / `wingwars`. You can also create your own account on the sign-in page
(email + password, stored locally).

### Useful scripts

| Script | What it does |
|---|---|
| `npm run dev` | Prepare the local DB (migrate + seed if empty), then start Next.js |
| `npm run build` / `npm start` | Production build / server |
| `npm run vercel-build` | Applies migrations to the configured DB, then builds (Vercel runs this automatically) |
| `npm test` | Unit tests (Vitest): Elo, ranks, scoring and bracket logic |
| `npx playwright test` | End-to-end smoke test: sign up → wing battle → add spot + wing (with a new wing type) → tasting → spot review → spot showdown → tournament |
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
    battle/            the battle scorecard form (wing vs wing, or spot vs spot)
    battles/[id]/      wing battle report
    spot-battles/[id]/ spot showdown report
    types/             wing types: cross-type standings + per-type leaderboards
    leaderboard/       podium + rankings
    spots/, wings/     browse, detail pages, add forms
    tournament/        bracket runner (client) ▸ tournaments/[id] results
    judges/[id]/       user profile / journal
    sign-in/           email+password (and optional GitHub) auth
    actions.ts         all server actions (validated with zod)
    api/auth/[...all]  Better Auth handler
  components/          wing-spirit, spot-spirit, scenery, radar chart, bracket view, cards…
  db/                  Drizzle schema + client (local file or Turso)
  lib/                 auth, session, queries, Elo, ranks, scoring, bracket logic
scripts/               setup-local (migrate + seed), migrate, seed, reset
                       (both migrate paths also insert any missing canonical wing types)
drizzle/               SQL migrations
tests/                 unit (vitest) + e2e (playwright)
```

## Deploying

See **[TODOS.md](./TODOS.md)** for the steps to go live: a Turso database, a Vercel project and a few
environment variables. It takes about 15 minutes.
