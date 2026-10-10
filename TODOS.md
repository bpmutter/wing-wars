# TODOs: getting Wing Wars live

The app is complete and runs locally with zero setup (`npm install && npm run dev`). Nothing was deployed and no
accounts were created. Below is everything **you** need to do to put it on the internet, in order. Every service
here has a free tier that's more than enough.

---

## 1. Create the database (Turso, free): ~5 min

Locally the app uses a SQLite file. Vercel's filesystem is read-only and ephemeral, so production needs a hosted
database. Turso is hosted SQLite (libSQL), the same driver the app already uses, so no code changes are needed.

**Option A: through Vercel (easiest).** Once the Vercel project exists (step 2), open
**Storage → Marketplace → Turso** and connect it to the project. Check which env var names it injects. The app
reads `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`, so rename or add those if the integration uses different names.

**Option B: Turso CLI.**
```bash
# install: https://docs.turso.tech/cli/installation
turso auth signup                      # or: turso auth login
turso db create wing-wars
turso db show wing-wars --url          # → TURSO_DATABASE_URL
turso db tokens create wing-wars       # → TURSO_AUTH_TOKEN
```

- [ ] Database created
- [ ] Have `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`

> **Optional:** want the demo world (spots, wings, battles) in production too? Run this once from your machine
> with the prod env vars set:
> `TURSO_DATABASE_URL=… TURSO_AUTH_TOKEN=… npm run db:seed`
> It only seeds an empty database. Note: it creates demo users whose password is the public demo password, so
> you'll probably want to start empty instead and let real people add real spots.

## 2. Create the Vercel project: ~5 min

- [ ] Push this branch / merge it to `main`
- [ ] Vercel → **Add New → Project** → import the `wing-wars` repo. The framework is detected as Next.js.
- [ ] Leave the build command as default. `package.json` has a `vercel-build` script, which Vercel runs
      automatically. It **applies database migrations** and then runs `next build`, so the schema stays in sync on
      every deploy.

## 3. Set environment variables (Vercel → Settings → Environment Variables)

| Variable | Required | Value |
|---|---|---|
| `TURSO_DATABASE_URL` | ✅ | from step 1 (`libsql://…`) |
| `TURSO_AUTH_TOKEN` | ✅ | from step 1 |
| `BETTER_AUTH_SECRET` | ✅ | a random string: `openssl rand -base64 32`. **The app refuses to start on Vercel without it** (on purpose: the dev fallback secret is public) |
| `BETTER_AUTH_URL` | recommended | your production URL, e.g. `https://wing-wars.vercel.app`. If it's unset, production falls back to Vercel's production domain automatically |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | optional | enables the "Continue with GitHub" button (see step 4) |

- [ ] Env vars set for **Production** (and **Preview** if you want preview deploys to work. A separate Turso DB
      for previews is a good idea.)
- [ ] Redeploy after adding them

## 4. (Optional) GitHub sign-in: ~3 min

Email + password works out of the box. For one-click GitHub login:

- [ ] GitHub → Settings → Developer settings → **OAuth Apps → New OAuth App**
  - Homepage URL: `https://<your-domain>`
  - Authorization callback URL: `https://<your-domain>/api/auth/callback/github`
- [ ] Copy the Client ID and a generated Client Secret into Vercel as `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- [ ] Redeploy. The button appears automatically on `/sign-in` when both are set.

(For local GitHub login, create a second OAuth app with callback `http://localhost:3000/api/auth/callback/github`
and put the values in `.env.local`.)

## 5. Smoke-test production

- [ ] Sign up, add a spot, add two wings, run a battle, check the leaderboard
- [ ] Or run the e2e test against it: `BASE_URL=https://<your-domain> npx playwright test`. Note that it creates a
      test user, a spot called "Playwright Pub" and a battle, so you may want to point it at a preview deploy
      instead.

---

## Known gaps / nice-to-haves (not required for launch)

These are ideas I deliberately left out to keep v1 tight.

- **Email verification & password reset.** Both are off. Better Auth supports them, but they need an email
  provider (e.g. Resend's free tier). Until then, a forgotten password means a new account.
- **Moderation / editing.** Spots and wings can't be edited or deleted from the UI yet, so typos are forever.
  You'd want an "owner can edit" rule and probably an admin role.
- **Duplicate spots.** Nothing stops two people adding "Joe's Wings" twice. Fuzzy-match warnings on the add form
  would help.
- **Rate limiting.** Anyone signed in can spam battles to pump a wing's Elo. Ideas: one battle per pair per judge
  per day, or weight each judge's influence.
- **Photos.** Real wing photos would be fun (Vercel Blob has a free tier). The generated wing spirits fill that
  role for now.
- **Maps / location.** Spots have a free-text neighborhood. Adding coordinates would allow a "near me" view and
  a Ghibli-style hand-drawn map page.
- **Friends / groups.** Wing-night tournaments are currently saved by one host. Group tournaments where several
  judges vote per match would be a natural next step.
- **Caching.** Every page reads fresh from the DB on each request (`connection()` + Suspense). That's fine at
  this scale. If traffic grows, wrap the read queries in `"use cache"` with `cacheTag`s and call `updateTag` in
  the server actions.
- **Dependency audit.** `npm audit` flags a moderate advisory in an old `esbuild` that drizzle-kit pulls in.
  It only affects the local dev tooling, not the deployed app, but it's worth bumping once drizzle-kit updates.
