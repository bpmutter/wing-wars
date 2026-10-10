import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
  type AnySQLiteColumn,
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

/** A restaurant / bar / shack that serves wings. */
export const spots = sqliteTable("spots", {
  id: id(),
  name: text("name").notNull(),
  neighborhood: text("neighborhood").notNull().default(""),
  description: text("description").notNull().default(""),
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
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (t) => [index("wings_spot_idx").on(t.spotId), index("wings_type_idx").on(t.wingTypeId)],
);

/**
 * A war: a long-running wing crawl. People join, visit every battleground
 * (restaurant) in it, score the wings they eat there, and when the war ends
 * a champion is computed from everyone's scorecards.
 */
export const wars = sqliteTable(
  "wars",
  {
    id: id(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    hostId: text("host_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** If set, only wings of this type count (e.g. "The Great Buffalo War"). */
    wingTypeId: text("wing_type_id").references(() => wingTypes.id, {
      onDelete: "set null",
    }),
    /** Fog of war: standings stay hidden until the war ends. */
    fogOfWar: integer("fog_of_war", { mode: "boolean" }).notNull().default(true),
    /** Optional deadline; the war ends automatically when it passes. */
    endsAt: integer("ends_at", { mode: "timestamp_ms" }),
    /** Set when the host ends the war early. */
    endedAt: integer("ended_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [index("wars_host_idx").on(t.hostId)],
);

/** A restaurant taking part in a war. Each one is a battle within the war. */
export const warBattlegrounds = sqliteTable(
  "war_battlegrounds",
  {
    id: id(),
    warId: text("war_id")
      .notNull()
      .references(() => wars.id, { onDelete: "cascade" }),
    spotId: text("spot_id")
      .notNull()
      .references(() => spots.id, { onDelete: "cascade" }),
    addedById: text("added_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("war_battlegrounds_war_spot_uq").on(t.warId, t.spotId)],
);

/** Someone who has joined a war. */
export const warMembers = sqliteTable(
  "war_members",
  {
    id: id(),
    warId: text("war_id")
      .notNull()
      .references(() => wars.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: createdAt(),
  },
  (t) => [
    uniqueIndex("war_members_war_user_uq").on(t.warId, t.userId),
    index("war_members_user_idx").on(t.userId),
  ],
);

/**
 * One person's scorecard for one wing. With a warId it's a war scorecard
 * (one per judge per wing per war); without, it's a solo tasting.
 */
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
    warId: text("war_id").references((): AnySQLiteColumn => wars.id, {
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
    uniqueIndex("tastings_war_user_wing_uq").on(t.warId, t.userId, t.wingId),
  ],
);

/** One person's scorecard for a restaurant as a whole. Optionally part of a war. */
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
    warId: text("war_id").references((): AnySQLiteColumn => wars.id, {
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
    uniqueIndex("spot_reviews_war_user_spot_uq").on(t.warId, t.userId, t.spotId),
  ],
);

export type WingType = typeof wingTypes.$inferSelect;
export type Spot = typeof spots.$inferSelect;
export type Wing = typeof wings.$inferSelect;
export type Tasting = typeof tastings.$inferSelect;
export type SpotReview = typeof spotReviews.$inferSelect;
export type War = typeof wars.$inferSelect;
