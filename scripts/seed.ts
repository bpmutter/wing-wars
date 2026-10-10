/**
 * Seeds a fresh database with a cozy little world: spots, wings, judges,
 * a month of battles and one tournament. Deterministic, so every local
 * install gets the same story.
 */
import { hashPassword } from "better-auth/crypto";
import { count } from "drizzle-orm";
import type { Db } from "@/db/client";
import { account, spotReviews, spots, tastings, tournaments, user, wingTypes, wings } from "@/db/schema";
import { recordBattle, recordSpotBattle } from "@/lib/battle-engine";
import { buildBracket, seedEntrants } from "@/lib/bracket";
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

export async function seed(db: Db, { quiet = false } = {}) {
  const [{ n }] = await db.select({ n: count() }).from(spots);
  if (n > 0) {
    if (!quiet) console.log("🌱 Database already has data, skipping seed.");
    return false;
  }

  await ensureWingTypes(db);
  const typeIds = new Map((await db.select({ id: wingTypes.id, name: wingTypes.name }).from(wingTypes)).map((t) => [t.name, t.id]));

  const rand = seeded("wing-wars-seed");
  const now = Date.now();
  const DAY = 86_400_000;

  // Judges (all share the demo password, but only the demo one is advertised).
  const hash = await hashPassword(DEMO_PASSWORD);
  for (const j of JUDGES) {
    const created = new Date(now - 40 * DAY);
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

  // Spots & wings
  const roster: { id: string; quality: number; profile: Scores }[] = [];
  const spotRoster: { id: string; profile: SpotScores }[] = [];
  for (const s of SPOTS) {
    const [spot] = await db
      .insert(spots)
      .values({ name: s.name, neighborhood: s.neighborhood, description: s.description, createdById: JUDGES[1 + Math.floor(rand() * 3)].id, createdAt: new Date(now - 35 * DAY) })
      .returning({ id: spots.id });
    const wingGame = s.wings.reduce((sum, w) => sum + w.quality, 0) / s.wings.length;
    spotRoster.push({ id: spot.id, profile: { wingGame, ...s.vibe } });
    for (const w of s.wings) {
      const [wing] = await db
        .insert(wings)
        .values({ spotId: spot.id, name: w.name, wingTypeId: typeIds.get(w.type), style: w.style, heat: w.heat, description: w.description, createdById: JUDGES[1].id, createdAt: new Date(now - 34 * DAY) })
        .returning({ id: wings.id });
      // Each wing has a hidden "true" flavor profile around its quality.
      const q = w.quality;
      roster.push({
        id: wing.id,
        quality: q,
        profile: {
          crisp: q + (rand() - 0.5) * 3,
          sauce: q + (rand() - 0.5) * 3,
          juiciness: q + (rand() - 0.5) * 2.5,
          heat: w.heat >= 5 ? q - 1.5 : q + (rand() - 0.5) * 2,
          value: q + (rand() - 0.5) * 3,
        },
      });
    }
  }

  const card = (w: (typeof roster)[number]): Scores => ({
    crisp: clamp(w.profile.crisp + (rand() - 0.5) * 2.4),
    sauce: clamp(w.profile.sauce + (rand() - 0.5) * 2.4),
    juiciness: clamp(w.profile.juiciness + (rand() - 0.5) * 2.4),
    heat: clamp(w.profile.heat + (rand() - 0.5) * 2.4),
    value: clamp(w.profile.value + (rand() - 0.5) * 2.4),
  });
  const sum = (s: Scores) => s.crisp + s.sauce + s.juiciness + s.heat + s.value;

  // A month of duels.
  const BATTLES = 70;
  for (let i = 0; i < BATTLES; i++) {
    const ai = Math.floor(rand() * roster.length);
    let bi = Math.floor(rand() * (roster.length - 1));
    if (bi >= ai) bi++;
    const a = roster[ai];
    const b = roster[bi];
    const scoresA = card(a);
    const scoresB = card(b);
    let aWins = sum(scoresA) === sum(scoresB) ? rand() < 0.5 : sum(scoresA) > sum(scoresB);
    if (rand() < 0.06) aWins = !aWins; // the occasional heart-over-head verdict
    const judge = JUDGES[Math.floor(rand() * JUDGES.length)];
    const when = new Date(now - (30 - (i / BATTLES) * 30) * DAY - rand() * 6 * 3_600_000);
    await db.transaction((tx) =>
      recordBattle(tx, {
        userId: judge.id,
        wingAId: a.id,
        wingBId: b.id,
        winnerId: aWins ? a.id : b.id,
        scoresA,
        scoresB,
        verdict: NOTES[Math.floor(rand() * NOTES.length)],
        createdAt: when,
      }),
    );
  }

  // Some solo tastings with notes.
  for (let i = 0; i < 25; i++) {
    const w = roster[Math.floor(rand() * roster.length)];
    await db.insert(tastings).values({
      wingId: w.id,
      userId: JUDGES[Math.floor(rand() * JUDGES.length)].id,
      ...card(w),
      notes: NOTES[Math.floor(rand() * (NOTES.length - 3))],
      createdAt: new Date(now - rand() * 30 * DAY),
    });
  }

  // Spot showdowns and reviews.
  const spotCard = (s: (typeof spotRoster)[number]): SpotScores => ({
    wingGame: clamp(s.profile.wingGame + (rand() - 0.5) * 2.4),
    sides: clamp(s.profile.sides + (rand() - 0.5) * 2.4),
    vibe: clamp(s.profile.vibe + (rand() - 0.5) * 2.4),
    service: clamp(s.profile.service + (rand() - 0.5) * 2.4),
    value: clamp(s.profile.value + (rand() - 0.5) * 2.4),
  });
  const spotSum = (s: SpotScores) => s.wingGame + s.sides + s.vibe + s.service + s.value;
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
  const SHOWDOWNS = 24;
  for (let i = 0; i < SHOWDOWNS; i++) {
    const ai = Math.floor(rand() * spotRoster.length);
    let bi = Math.floor(rand() * (spotRoster.length - 1));
    if (bi >= ai) bi++;
    const a = spotRoster[ai];
    const b = spotRoster[bi];
    const scoresA = spotCard(a);
    const scoresB = spotCard(b);
    const aWins = spotSum(scoresA) === spotSum(scoresB) ? rand() < 0.5 : spotSum(scoresA) > spotSum(scoresB);
    const when = new Date(now - (28 - (i / SHOWDOWNS) * 28) * DAY - rand() * 6 * 3_600_000);
    await db.transaction((tx) =>
      recordSpotBattle(tx, {
        userId: JUDGES[Math.floor(rand() * JUDGES.length)].id,
        spotAId: a.id,
        spotBId: b.id,
        winnerId: aWins ? a.id : b.id,
        scoresA,
        scoresB,
        verdict: SPOT_NOTES[Math.floor(rand() * SPOT_NOTES.length)],
        createdAt: when,
      }),
    );
  }
  for (let i = 0; i < 14; i++) {
    const s = spotRoster[Math.floor(rand() * spotRoster.length)];
    await db.insert(spotReviews).values({
      spotId: s.id,
      userId: JUDGES[Math.floor(rand() * JUDGES.length)].id,
      ...spotCard(s),
      notes: SPOT_NOTES[Math.floor(rand() * (SPOT_NOTES.length - 2))],
      createdAt: new Date(now - rand() * 30 * DAY),
    });
  }

  // One festival tournament, a few days ago.
  const field = [...roster].sort(() => rand() - 0.5).slice(0, 8);
  const entrants = seedEntrants(field.sort((x, y) => y.quality - x.quality).map((w) => w.id));
  const quality = new Map(roster.map((w) => [w.id, w.quality]));
  const picks: string[] = [];
  for (;;) {
    const b = buildBracket(entrants, picks);
    if (b.complete) break;
    const m = b.current;
    const qa = quality.get(m.a)! + (rand() - 0.5) * 2;
    const qb = quality.get(m.b)! + (rand() - 0.5) * 2;
    picks.push(qa >= qb ? m.a : m.b);
  }
  const final = buildBracket(entrants, picks);
  const when = new Date(now - 2 * DAY);
  await db.transaction(async (tx) => {
    const [t] = await tx
      .insert(tournaments)
      .values({ userId: JUDGES[2].id, name: "The Harvest Moon Wing Classic", size: 8, championId: final.champion, createdAt: when })
      .returning({ id: tournaments.id });
    for (const m of final.matches) {
      await recordBattle(tx, { userId: JUDGES[2].id, wingAId: m.a, wingBId: m.b, winnerId: m.winner!, kind: "tournament", tournamentId: t.id, round: m.round, createdAt: when });
    }
  });

  if (!quiet) console.log(`🌱 Seeded ${SPOTS.length} spots, ${roster.length} wings, ${BATTLES + 7} wing battles, ${SHOWDOWNS} spot showdowns. Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  return true;
}
