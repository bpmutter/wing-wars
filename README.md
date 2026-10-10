# 🍗 Wing Wars

> *Declare war. Eat everywhere. Crown a champion.*

Wing Wars is a cozy, vaguely Studio-Ghibli-flavored web app for settling the most important debate of all:
**whose wings are best?** You start a **war**, a long-running campaign across the restaurants in your town.
Friends join it, eat their way through every restaurant, and score what they find. When the war ends, the
results are tallied and a champion is crowned.

Built with Next.js 16 (App Router, Cache Components), Tailwind CSS 4, Better Auth and Drizzle ORM on
SQLite/libSQL. It runs entirely locally with zero config, and is designed to deploy to Vercel with a free Turso
database.

---

## The concept

### 🏯 Wars
A **war** is the heart of the app.

1. **Someone declares a war.** They pick the **battlegrounds** (restaurants), choose whether every wing counts
   or only one type (*"The Spring Buffalo War"*), and set an optional end date.
2. **People join** by opening the war's link. There are no teams; every member is a judge.
3. **Each restaurant is a battle.** At each battleground, a judge scores every wing they eat on the five elements.
   They can update their scores until the war ends, and can also optionally review the restaurant itself.
   Members can add more battlegrounds while the war is on, including brand-new spots.
4. **The fog of war** (on by default) keeps each battle hidden from you until you've judged it yourself. Once you
   file a scorecard at a battleground, its fog lifts for you: you see its score, each wing's average, and every
   judge's vote and notes. You can't peek before you eat, so nobody copies the crowd. The overall standings and
   honors stay hidden from everyone until the war ends, then are revealed together. Fogged scorecards also
   stay out of the Hall of Fame and judges' journals until then. Hosts can turn the fog off for a live scoreboard.
5. **The war ends** on its end date, or when the host ends it early. Then the champion is revealed.

### 👑 How the winner is computed
All of this lives in `src/lib/war-results.ts` (pure and unit tested):

- Each scorecard totals the five elements (out of 50).
- At each battleground, a judge's scorecards are **averaged into one vote**. Eating three flavors doesn't give
  you three votes.
- Each battleground's votes are averaged and then **blended with 3 imaginary average judges** (a Bayesian
  average). A spot that only one person visited gets pulled toward the middle; one that five people loved
  mostly speaks for itself. This stops a single rave review from winning a war.
- The highest score wins.

The reveal also hands out honors:

- **Wing of the War**, plus the best wing at each of the five elements (Best Crisp, Best Sauce, …).
- **Best Hangout**, from the optional restaurant reviews.
- **Most Devoted**, the judge who covered the most ground.
- **The Oracle** and **The Contrarian**: the judges whose personal rankings matched the final standings best
  and worst (Spearman correlation).

### 🍃 The five elements
Wings are scored 1–10 on each:

| | Element | What it means |
|---|---|---|
| 🍂 | **Crisp** | Shatter, crackle, crunch |
| 🍯 | **Sauce** | Flavor, coverage, stickiness |
| 💧 | **Juiciness** | Tender, moist, meaty |
| 🔥 | **Heat** | How *good* the burn is (not just how hot) |
| 🪙 | **Value** | Worth the coin? |

Restaurants have their own **five virtues**: Wing Game, Sides & Dips, Vibe, Service and Value.

### 🏮 Spots, wings & wing types
- A **spot** is any restaurant, bar or shack that serves wings. Each one is drawn as its own paper-lantern spirit.
- A **wing type** is a canonical kind of wing: Buffalo, Lemon Pepper, Garlic Parmesan, Asian Glaze, Nashville
  Hot and so on. There are 13 to start, and people can add more.
- A **wing** is one spot's take on a type, e.g. *Hilltop Hot* (a Buffalo wing at Windmill Hill Wing Shack).
  Every wing gets a procedurally generated forest-spirit face. Hotter wings glow redder and grow flames.

### 🏆 Hall of Fame & solo reviews
Not everything needs a war. You can review any wing or restaurant on its own page at any time. Every scorecard,
war or solo, feeds the **Hall of Fame**, which ranks wings, spots, wing types and past war champions. It uses
the same adjusted averages, so one 10/10 can't top the hill. Averages also earn titles:

- Wings: *Lost Crumb → Dust Sprite → Meadow Wanderer → Hilltop Hero → Sky Captain → Forest Guardian → Great Sauce Spirit*
- Spots: *Abandoned Shack → … → Legendary Bathhouse*

---

## Running it locally

Requires Node 20+.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

That's it. `npm run dev` runs a `predev` step that creates `local.db` (SQLite), applies the migrations and,
if the database is empty, seeds a small demo world: 7 spots, 22 wings across 13 wing types, 6 judges, and
three wars:

- **The Harvest Moon Wing War**: concluded, so you can see a full results reveal.
- **The Spring Buffalo War**: Buffalo only, under fog of war. The demo judge is a member partway through, so some battles are revealed to them and some are still fogged.
- **The Lantern Festival Skirmish**: fog off, with a live scoreboard. The demo judge hasn't joined it yet.

**Demo login:** `demo@wingwars.local` / `wingwars`. You can also create your own account on the sign-in page
(email + password, stored locally).

### Useful scripts

| Script | What it does |
|---|---|
| `npm run dev` | Prepare the local DB (migrate + seed if empty), then start Next.js |
| `npm run build` / `npm start` | Production build / server |
| `npm run vercel-build` | Applies migrations to the configured DB, then builds (Vercel runs this automatically) |
| `npm test` | Unit tests (Vitest): war results, scoring and the Bayesian averages |
| `npx playwright test` | End-to-end smoke test: sign up → declare a war → score wings at a battleground → review the restaurant → add a new spot + wing mid-war → end the war → results → join another war → solo review → Hall of Fame |
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
  app/                       routes (App Router)
    page.tsx                 home: latest champion, raging wars, top wings & spots
    wars/                    list of wars ▸ new/ (declare a war)
    wars/[id]/               war overview: join, progress, battlegrounds, judges, fog / results reveal
    wars/[id]/spots/[spotId] a battleground: score the wings there, review the restaurant
    leaderboard/             Hall of Fame (wings, spots, wing types, war champions)
    spots/, wings/, types/   browse, detail pages, add forms, solo reviews
    judges/[id]/             user profile: wars, tasting journal, reviews
    sign-in/                 email+password (and optional GitHub) auth
    actions.ts               all server actions (validated with zod)
    api/auth/[...all]        Better Auth handler
  components/                wing-spirit, spot-spirit, scenery, podium, radar chart, cards…
  db/                        Drizzle schema + client (local file or Turso)
  lib/
    war-results.ts           how a war is decided (pure, unit tested)
    wars.ts                  war lifecycle helpers (ended? results visible?)
    queries.ts               all reads
    scoring.ts, ranks.ts     the five elements/virtues and the title ladders
    auth.ts, session.ts      Better Auth setup and helpers
scripts/                     setup-local (migrate + seed), migrate, seed, reset
                             (both migrate paths also insert any missing canonical wing types)
drizzle/                     SQL migrations
tests/                       unit (vitest) + e2e (playwright)
```

## Deploying

See **[TODOS.md](./TODOS.md)** for the steps to go live: a Turso database, a Vercel project and a few
environment variables. It takes about 15 minutes.
