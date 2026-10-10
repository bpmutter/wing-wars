import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(12));

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

/* ──────────────────────────────────────────────────────────────
 * Auth tables (shape required by Better Auth)
 * ────────────────────────────────────────────────────────────── */

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

/* ──────────────────────────────────────────────────────────────
 * Wing Wars tables
 * ────────────────────────────────────────────────────────────── */

/**
 * A canonical kind of wing — "Buffalo", "Lemon Pepper", "Garlic Parmesan" —
 * so the same type can be compared across restaurants.
 */
export const wingTypes = sqliteTable("wing_types", {
  id: id(),
  name: text("name").notNull().unique(),
  emoji: text("emoji").notNull().default("🍗"),
  description: text("description").notNull().default(""),
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: createdAt(),
});

/** A restaurant / bar / shack that serves wings. Spots are judged too. */
export const spots = sqliteTable("spots", {
  id: id(),
  name: text("name").notNull(),
  neighborhood: text("neighborhood").notNull().default(""),
  description: text("description").notNull().default(""),
  elo: integer("elo").notNull().default(1200),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: createdAt(),
});

/** A specific wing offering at a spot, e.g. "Honey Garlic (bone-in)". */
export const wings = sqliteTable(
  "wings",
  {
    id: id(),
    spotId: text("spot_id")
      .notNull()
      .references(() => spots.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    wingTypeId: text("wing_type_id").references(() => wingTypes.id, {
      onDelete: "set null",
    }),
    style: text("style", { enum: ["bone-in", "boneless"] })
      .notNull()
      .default("bone-in"),
    /** Heat as advertised by the spot, 0 (none) – 5 (volcanic). */
    heat: integer("heat").notNull().default(1),
    description: text("description").notNull().default(""),
    elo: integer("elo").notNull().default(1200),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (t) => [
    index("wings_spot_idx").on(t.spotId),
    index("wings_elo_idx").on(t.elo),
    index("wings_type_idx").on(t.wingTypeId),
  ],
);

/**
 * A tournament: a single-elimination bracket a user plays through.
 * Every match in it is stored as a battle.
 */
export const tournaments = sqliteTable("tournaments", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  size: integer("size").notNull(),
  championId: text("champion_id").references(() => wings.id, {
    onDelete: "set null",
  }),
  createdAt: createdAt(),
});

/** A head-to-head battle between two wings, judged by one user. */
export const battles = sqliteTable(
  "battles",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    wingAId: text("wing_a_id")
      .notNull()
      .references(() => wings.id, { onDelete: "cascade" }),
    wingBId: text("wing_b_id")
      .notNull()
      .references(() => wings.id, { onDelete: "cascade" }),
    winnerId: text("winner_id")
      .notNull()
      .references(() => wings.id, { onDelete: "cascade" }),
    /** "duel" = full scorecards, "tournament" = quick pick inside a bracket. */
    kind: text("kind", { enum: ["duel", "tournament"] })
      .notNull()
      .default("duel"),
    tournamentId: text("tournament_id").references(() => tournaments.id, {
      onDelete: "cascade",
    }),
    round: integer("round"),
    eloBeforeA: integer("elo_before_a").notNull(),
    eloBeforeB: integer("elo_before_b").notNull(),
    eloDeltaA: integer("elo_delta_a").notNull(),
    eloDeltaB: integer("elo_delta_b").notNull(),
    verdict: text("verdict").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("battles_user_idx").on(t.userId),
    index("battles_a_idx").on(t.wingAId),
    index("battles_b_idx").on(t.wingBId),
    index("battles_created_idx").on(t.createdAt),
  ],
);

/** One person's scorecard for one wing. Battles create two of these. */
export const tastings = sqliteTable(
  "tastings",
  {
    id: id(),
    wingId: text("wing_id")
      .notNull()
      .references(() => wings.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    battleId: text("battle_id").references(() => battles.id, {
      onDelete: "cascade",
    }),
    crisp: integer("crisp").notNull(),
    sauce: integer("sauce").notNull(),
    juiciness: integer("juiciness").notNull(),
    heat: integer("heat").notNull(),
    value: integer("value").notNull(),
    notes: text("notes").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("tastings_wing_idx").on(t.wingId),
    index("tastings_user_idx").on(t.userId),
  ],
);

/** A head-to-head battle between two restaurants, judged on the whole experience. */
export const spotBattles = sqliteTable(
  "spot_battles",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    spotAId: text("spot_a_id")
      .notNull()
      .references(() => spots.id, { onDelete: "cascade" }),
    spotBId: text("spot_b_id")
      .notNull()
      .references(() => spots.id, { onDelete: "cascade" }),
    winnerId: text("winner_id")
      .notNull()
      .references(() => spots.id, { onDelete: "cascade" }),
    eloBeforeA: integer("elo_before_a").notNull(),
    eloBeforeB: integer("elo_before_b").notNull(),
    eloDeltaA: integer("elo_delta_a").notNull(),
    eloDeltaB: integer("elo_delta_b").notNull(),
    verdict: text("verdict").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("spot_battles_user_idx").on(t.userId),
    index("spot_battles_a_idx").on(t.spotAId),
    index("spot_battles_b_idx").on(t.spotBId),
    index("spot_battles_created_idx").on(t.createdAt),
  ],
);

/** One person's scorecard for a restaurant. Spot battles create two of these. */
export const spotReviews = sqliteTable(
  "spot_reviews",
  {
    id: id(),
    spotId: text("spot_id")
      .notNull()
      .references(() => spots.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    spotBattleId: text("spot_battle_id").references(() => spotBattles.id, {
      onDelete: "cascade",
    }),
    wingGame: integer("wing_game").notNull(),
    sides: integer("sides").notNull(),
    vibe: integer("vibe").notNull(),
    service: integer("service").notNull(),
    value: integer("value").notNull(),
    notes: text("notes").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("spot_reviews_spot_idx").on(t.spotId),
    index("spot_reviews_user_idx").on(t.userId),
  ],
);

export type WingType = typeof wingTypes.$inferSelect;
export type Spot = typeof spots.$inferSelect;
export type Wing = typeof wings.$inferSelect;
export type Battle = typeof battles.$inferSelect;
export type Tasting = typeof tastings.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;
export type SpotBattle = typeof spotBattles.$inferSelect;
export type SpotReview = typeof spotReviews.$inferSelect;
