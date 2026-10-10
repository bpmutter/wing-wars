/**
 * Seeds a fresh database with a cozy little world: spots, wings, judges,
 * one concluded war, two wars still raging, and some solo reviews.
 * Deterministic, so every local install gets the same story.
 */
import { hashPassword } from "better-auth/crypto";
import { count } from "drizzle-orm";
import type { Db } from "@/db/client";
import { account, spotReviews, spots, tastings, user, warBattlegrounds, warMembers, wars, wingTypes, wings } from "@/db/schema";
import { seeded } from "@/lib/hash";
import type { Scores, SpotScores } from "@/lib/scoring";
import { ensureWingTypes } from "@/lib/wing-types";

export const DEMO_EMAIL = "demo@wingwars.local";
export const DEMO_PASSWORD = "wingwars";

const JUDGES = [
  { id: "judge_demo", name: "Demo Judge", email: DEMO_EMAIL },
  { id: "judge_moss", name: "Mossbeard", email: "mossbeard@wingwars.local" },
  { id: "judge_lu", name: "Lantern Lu", email: "lu@wingwars.local" },
  { id: "judge_cap", name: "Captain Drumstick", email: "captain@wingwars.local" },
  { id: "judge_fern", name: "Fern", email: "fern@wingwars.local" },
  { id: "judge_ember", name: "Old Ember", email: "ember@wingwars.local" },
];

type SeedWing = { name: string; type: string; style: "bone-in" | "boneless"; heat: number; description: string; quality: number };
/** Hidden "true" quality of the restaurant experience, used to generate believable reviews. */
type SeedVibe = { sides: number; vibe: number; service: number; value: number };

const SPOTS: { name: string; neighborhood: string; description: string; vibe: SeedVibe; wings: SeedWing[] }[] = [
  {
    name: "The Copper Kettle Tavern",
    vibe: { sides: 8, vibe: 9, service: 8, value: 7 },
    neighborhood: "Riverside",
    description: "Low beams, a crackling fireplace and a bartender who remembers your order. The wings come out in little copper pots.",
    wings: [
      { name: "Honey Garlic", type: "Honey Garlic", style: "bone-in", heat: 0, description: "Sticky, golden, roasted garlic cloves tossed right in.", quality: 7.5 },
      { name: "Classic Buffalo (Medium)", type: "Buffalo", style: "bone-in", heat: 2, description: "The benchmark. Butter, vinegar, cayenne, no nonsense.", quality: 7 },
      { name: "Fireside Garlic Parm", type: "Garlic Parmesan", style: "bone-in", heat: 0, description: "Roasted garlic butter and aged parmesan, finished by the fire.", quality: 7.4 },
      { name: "Smoked Dry Rub", type: "Dry Rub", style: "bone-in", heat: 1, description: "Hickory-smoked then flash-fried. Paprika, brown sugar, sea salt.", quality: 8.2 },
    ],
  },
  {
    name: "Windmill Hill Wing Shack",
    vibe: { sides: 6, vibe: 6, service: 6, value: 9 },
    neighborhood: "Old Town",
    description: "A walk-up window at the foot of the old windmill. Cash only. Line out the door on Fridays.",
    wings: [
      { name: "Hilltop Hot", type: "Buffalo", style: "bone-in", heat: 4, description: "Their house buffalo, cranked way up. Sweat guaranteed.", quality: 7.8 },
      { name: "Lemon Pepper Wet", type: "Lemon Pepper", style: "bone-in", heat: 0, description: "Bright, buttery, cracked-pepper perfection.", quality: 8.6 },
      { name: "Mango Habanero", type: "Fruity Heat", style: "boneless", heat: 4, description: "Sweet up front, fire in the back.", quality: 6.4 },
    ],
  },
  {
    name: "The Floating Lantern",
    vibe: { sides: 7, vibe: 9.5, service: 7, value: 6 },
    neighborhood: "Harbor District",
    description: "A converted ferry boat strung with paper lanterns. Wings and soju while the boats bob by.",
    wings: [
      { name: "Gochujang Glaze", type: "Asian Glaze", style: "bone-in", heat: 3, description: "Double-fried, shatteringly crisp, lacquered in sweet chili paste.", quality: 9.1 },
      { name: "Soy Ginger", type: "Asian Glaze", style: "bone-in", heat: 1, description: "Savory and clean with scallion confetti.", quality: 7.2 },
      { name: "Salt & Pepper Bites", type: "Salt & Pepper", style: "boneless", heat: 1, description: "Wok-tossed with garlic, chili and green onion.", quality: 6.8 },
    ],
  },
  {
    name: "Sootfire Smokehouse",
    vibe: { sides: 9, vibe: 7, service: 7, value: 7 },
    neighborhood: "Mill Street",
    description: "A brick smokehouse with a coal pit that hasn't gone out in eleven years.",
    wings: [
      { name: "Applewood Smoked", type: "Dry Rub", style: "bone-in", heat: 1, description: "Four hours over applewood. Crisped on the grill to order.", quality: 8.4 },
      { name: "Carolina Gold", type: "BBQ", style: "bone-in", heat: 1, description: "Tangy mustard BBQ sauce, a little sweet, a lot of tang.", quality: 6.9 },
      { name: "Smoked Buffalo", type: "Buffalo", style: "bone-in", heat: 2, description: "Smoked first, then fried and tossed in house buffalo. Controversial. Delicious.", quality: 8.0 },
      { name: "The Fire Demon", type: "Extreme Heat", style: "bone-in", heat: 5, description: "Ghost pepper and scorpion. Waiver required. Not joking.", quality: 5.8 },
    ],
  },
  {
    name: "Grandma Tanuki's Kitchen",
    vibe: { sides: 7, vibe: 8, service: 9.5, value: 8 },
    neighborhood: "Bamboo Lane",
    description: "Tiny family kitchen, six seats, one very opinionated grandmother.",
    wings: [
      { name: "Sweet Chili Crunch", type: "Asian Glaze", style: "bone-in", heat: 2, description: "Crispy potato-starch coating, sweet chili drizzle, toasted sesame.", quality: 8.0 },
      { name: "Garlic Parmesan", type: "Garlic Parmesan", style: "boneless", heat: 0, description: "Comfort food. Mountains of parmesan.", quality: 6.2 },
    ],
  },
  {
    name: "The Bathhouse Bar & Grill",
    vibe: { sides: 6, vibe: 8.5, service: 5.5, value: 6 },
    neighborhood: "Hot Springs",
    description: "Built into an old bathhouse. Steam rises from the courtyard pools; the wings arrive on wooden buckets.",
    wings: [
      { name: "Steam Room Buffalo", type: "Buffalo", style: "bone-in", heat: 3, description: "Steamed then fried, so they're impossibly juicy.", quality: 7.6 },
      { name: "Sriracha Honey", type: "Hot Honey", style: "bone-in", heat: 2, description: "Sweet heat with a crackly honey shell.", quality: 7.3 },
    ],
  },
  {
    name: "Cloudtop Diner",
    vibe: { sides: 7.5, vibe: 7, service: 8, value: 8.5 },
    neighborhood: "Airfield Road",
    description: "A chrome diner next to the old airstrip. Pilots swear by the wings.",
    wings: [
      { name: "Sky Pirate BBQ", type: "BBQ", style: "bone-in", heat: 1, description: "Smoky molasses BBQ, charred at the edges.", quality: 6.6 },
      { name: "Diner Buffalo", type: "Buffalo", style: "bone-in", heat: 2, description: "Classic diner-style buffalo with a side of crinkle fries.", quality: 6.8 },
      { name: "Lemon Pepper Dry", type: "Lemon Pepper", style: "bone-in", heat: 0, description: "Dry-tossed, extra pepper, a squeeze of lemon at the table.", quality: 7.0 },
      { name: "Volcano Island Jerk", type: "Jerk", style: "bone-in", heat: 4, description: "Allspice, scotch bonnet and lime. Grilled over charcoal.", quality: 8.1 },
    ],
  },
];

const NOTES = [
  "Crunch you could hear from across the room.",
  "Sauce-to-wing ratio was spiritually correct.",
  "A little dry, but the flavor carried it.",
  "I would cross a river for these.",
  "Needed more sauce. Needed more everything, honestly.",
  "The heat crept up like a sunrise.",
  "Perfectly rendered skin. Chef's kiss.",
  "Good, not great. A solid Tuesday wing.",
  "Messy in the best way. Used eleven napkins.",
  "",
  "",
  "",
];

function clamp(n: number) {
  return Math.max(1, Math.min(10, Math.round(n)));
}

const SPOT_NOTES = [
  "The ranch alone is worth the trip.",
  "Lovely spot, but we waited forty minutes for a refill.",
  "Felt like eating inside a storybook.",
  "Wings were great, the fries were a tragedy.",
  "Friendliest staff in the land. They remembered my name.",
  "A little pricey, but the lanterns, though.",
  "",
  "",
];

export async function seed(db: Db, { quiet = false } = {}) {
  const [{ n }] = await db.select({ n: count() }).from(spots);
  if (n > 0) {
    if (!quiet) console.log("🌱 Database already has data, skipping seed.");
    return false;
  }

  await ensureWingTypes(db);
  const typeIds = new Map((await db.select({ id: wingTypes.id, name: wingTypes.name }).from(wingTypes)).map((t) => [t.name, t.id]));

  const rand = seeded("wing-wars-seed");
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const now = Date.now();
  const DAY = 86_400_000;
  const judge = (name: string) => JUDGES.find((j) => j.name === name)!.id;

  // Judges (all share the demo password, but only the demo one is advertised).
  const hash = await hashPassword(DEMO_PASSWORD);
  for (const j of JUDGES) {
    const created = new Date(now - 60 * DAY);
    await db.insert(user).values({ ...j, emailVerified: true, createdAt: created, updatedAt: created });
    await db.insert(account).values({
      id: `acct_${j.id}`,
      accountId: j.id,
      providerId: "credential",
      userId: j.id,
      password: hash,
      createdAt: created,
      updatedAt: created,
    });
  }

  // Spots & wings, each with a hidden "true" flavor profile for believable scores.
  type RosterWing = { id: string; spotId: string; type: string; profile: Scores };
  const roster: RosterWing[] = [];
  const spotRoster = new Map<string, { id: string; profile: SpotScores; wings: RosterWing[] }>();
  for (const s of SPOTS) {
    const [spot] = await db
      .insert(spots)
      .values({ name: s.name, neighborhood: s.neighborhood, description: s.description, createdById: pick(JUDGES).id, createdAt: new Date(now - 50 * DAY) })
      .returning({ id: spots.id });
    const wingGame = s.wings.reduce((sum, w) => sum + w.quality, 0) / s.wings.length;
    const entry = { id: spot.id, profile: { wingGame, ...s.vibe }, wings: [] as RosterWing[] };
    spotRoster.set(s.name, entry);
    for (const w of s.wings) {
      const [wing] = await db
        .insert(wings)
        .values({ spotId: spot.id, name: w.name, wingTypeId: typeIds.get(w.type), style: w.style, heat: w.heat, description: w.description, createdById: pick(JUDGES).id, createdAt: new Date(now - 49 * DAY) })
        .returning({ id: wings.id });
      const q = w.quality;
      const rw: RosterWing = {
        id: wing.id,
        spotId: spot.id,
        type: w.type,
        profile: {
          crisp: q + (rand() - 0.5) * 3,
          sauce: q + (rand() - 0.5) * 3,
          juiciness: q + (rand() - 0.5) * 2.5,
          heat: w.heat >= 5 ? q - 1.5 : q + (rand() - 0.5) * 2,
          value: q + (rand() - 0.5) * 3,
        },
      };
      roster.push(rw);
      entry.wings.push(rw);
    }
  }

  const card = (w: RosterWing, mood: number): Scores => ({
    crisp: clamp(w.profile.crisp + mood + (rand() - 0.5) * 2.4),
    sauce: clamp(w.profile.sauce + mood + (rand() - 0.5) * 2.4),
    juiciness: clamp(w.profile.juiciness + mood + (rand() - 0.5) * 2.4),
    heat: clamp(w.profile.heat + mood + (rand() - 0.5) * 2.4),
    value: clamp(w.profile.value + mood + (rand() - 0.5) * 2.4),
  });
  const spotCard = (s: { profile: SpotScores }): SpotScores => ({
    wingGame: clamp(s.profile.wingGame + (rand() - 0.5) * 2.4),
    sides: clamp(s.profile.sides + (rand() - 0.5) * 2.4),
    vibe: clamp(s.profile.vibe + (rand() - 0.5) * 2.4),
    service: clamp(s.profile.service + (rand() - 0.5) * 2.4),
    value: clamp(s.profile.value + (rand() - 0.5) * 2.4),
  });
  // Some judges are generous, some are harsh.
  const mood = new Map(JUDGES.map((j) => [j.id, (rand() - 0.5) * 1.6]));

  /**
   * Creates a war and has its members eat their way through it.
   * `coverage` is the chance a member has visited each battleground.
   */
  async function war(opts: {
    name: string;
    description: string;
    host: string;
    members: string[];
    spotNames: string[];
    type?: string;
    fogOfWar: boolean;
    startedDaysAgo: number;
    endsInDays: number | null;
    coverage: (memberId: string) => number;
  }) {
    const created = new Date(now - opts.startedDaysAgo * DAY);
    const [w] = await db
      .insert(wars)
      .values({
        name: opts.name,
        description: opts.description,
        hostId: judge(opts.host),
        wingTypeId: opts.type ? typeIds.get(opts.type) : null,
        fogOfWar: opts.fogOfWar,
        endsAt: opts.endsInDays === null ? null : new Date(now + opts.endsInDays * DAY),
        createdAt: created,
      })
      .returning({ id: wars.id });
    const grounds = opts.spotNames.map((n) => spotRoster.get(n)!);
    await db.insert(warBattlegrounds).values(grounds.map((g, i) => ({ warId: w.id, spotId: g.id, addedById: judge(opts.host), createdAt: new Date(created.getTime() + i * 1000) })));
    const memberIds = opts.members.map(judge);
    await db.insert(warMembers).values(memberIds.map((userId, i) => ({ warId: w.id, userId, joinedAt: new Date(created.getTime() + i * 3_600_000) })));

    const span = Math.max(1, opts.startedDaysAgo - Math.max(0, -(opts.endsInDays ?? 0)));
    for (const userId of memberIds) {
      for (const g of grounds) {
        if (rand() > opts.coverage(userId)) continue;
        const eligible = opts.type ? g.wings.filter((x) => x.type === opts.type) : g.wings;
        if (eligible.length === 0) continue;
        const eaten = [...eligible].sort(() => rand() - 0.5).slice(0, 1 + Math.floor(rand() * Math.min(2, eligible.length)));
        const when = new Date(created.getTime() + rand() * span * DAY);
        for (const x of eaten) {
          await db.insert(tastings).values({ wingId: x.id, userId, warId: w.id, ...card(x, mood.get(userId)!), notes: rand() < 0.35 ? pick(NOTES) : "", createdAt: when });
        }
        if (rand() < 0.5) {
          await db.insert(spotReviews).values({ spotId: g.id, userId, warId: w.id, ...spotCard(g), notes: rand() < 0.4 ? pick(SPOT_NOTES) : "", createdAt: when });
        }
      }
    }
    return w.id;
  }

  const allSpots = SPOTS.map((s) => s.name);
  const everyone = JUDGES.map((j) => j.name);

  await war({
    name: "The Harvest Moon Wing War",
    description: "Seven taverns, six judges, one moon. Eat everything. Trust no one. Bring wet wipes.",
    host: "Lantern Lu",
    members: everyone,
    spotNames: allSpots,
    fogOfWar: true,
    startedDaysAgo: 40,
    endsInDays: -10,
    coverage: () => 0.85,
  });

  await war({
    name: "The Spring Buffalo War",
    description: "Only Buffalo counts. Classic, smoked, steamed, hot — find the one true Buffalo of the valley.",
    host: "Mossbeard",
    members: ["Mossbeard", "Demo Judge", "Captain Drumstick", "Fern"],
    spotNames: ["The Copper Kettle Tavern", "Windmill Hill Wing Shack", "Sootfire Smokehouse", "The Bathhouse Bar & Grill", "Cloudtop Diner"],
    type: "Buffalo",
    fogOfWar: true,
    startedDaysAgo: 6,
    endsInDays: 9,
    coverage: (id) => (id === judge("Demo Judge") ? 0.4 : 0.6),
  });

  await war({
    name: "The Lantern Festival Skirmish",
    description: "A quick, friendly one. No fog — we like to see the scoreboard move.",
    host: "Captain Drumstick",
    members: ["Captain Drumstick", "Lantern Lu", "Old Ember"],
    spotNames: ["The Floating Lantern", "Grandma Tanuki's Kitchen", "The Bathhouse Bar & Grill", "Cloudtop Diner"],
    fogOfWar: false,
    startedDaysAgo: 4,
    endsInDays: null,
    coverage: () => 0.75,
  });

  // A sprinkle of solo reviews, outside any war.
  for (let i = 0; i < 18; i++) {
    const w = pick(roster);
    const userId = pick(JUDGES).id;
    await db.insert(tastings).values({ wingId: w.id, userId, ...card(w, mood.get(userId)!), notes: pick(NOTES), createdAt: new Date(now - rand() * 50 * DAY) });
  }
  const spotList = [...spotRoster.values()];
  for (let i = 0; i < 8; i++) {
    const s = pick(spotList);
    await db.insert(spotReviews).values({ spotId: s.id, userId: pick(JUDGES).id, ...spotCard(s), notes: pick(SPOT_NOTES), createdAt: new Date(now - rand() * 50 * DAY) });
  }

  if (!quiet) console.log(`🌱 Seeded ${SPOTS.length} spots, ${roster.length} wings, ${JUDGES.length} judges and 3 wars. Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  return true;
}
