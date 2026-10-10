import { eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { battles, tastings, wings } from "@/db/schema";
import { eloUpdate } from "./elo";
import type { Scores } from "./scoring";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Executor = Db | Tx;

export type BattleInput = {
  userId: string;
  wingAId: string;
  wingBId: string;
  winnerId: string;
  verdict?: string;
  kind?: "duel" | "tournament";
  tournamentId?: string;
  round?: number;
  scoresA?: Scores;
  scoresB?: Scores;
  createdAt?: Date;
};

/**
 * Records a battle: updates both wings' Elo + win/loss records and stores
 * scorecards (if any) as tastings. Run it inside a transaction.
 */
export async function recordBattle(tx: Executor, input: BattleInput) {
  if (input.wingAId === input.wingBId) throw new Error("A wing cannot battle itself.");
  if (input.winnerId !== input.wingAId && input.winnerId !== input.wingBId) {
    throw new Error("The winner must be one of the two contenders.");
  }

  const [a] = await tx.select({ elo: wings.elo }).from(wings).where(eq(wings.id, input.wingAId));
  const [b] = await tx.select({ elo: wings.elo }).from(wings).where(eq(wings.id, input.wingBId));
  if (!a || !b) throw new Error("One of those wings has wandered off.");

  const aWon = input.winnerId === input.wingAId;
  const { deltaA, deltaB } = eloUpdate(a.elo, b.elo, aWon);

  const [battle] = await tx
    .insert(battles)
    .values({
      userId: input.userId,
      wingAId: input.wingAId,
      wingBId: input.wingBId,
      winnerId: input.winnerId,
      kind: input.kind ?? "duel",
      tournamentId: input.tournamentId,
      round: input.round,
      eloBeforeA: a.elo,
      eloBeforeB: b.elo,
      eloDeltaA: deltaA,
      eloDeltaB: deltaB,
      verdict: input.verdict?.trim() ?? "",
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    })
    .returning({ id: battles.id });

  await tx
    .update(wings)
    .set({
      elo: sql`${wings.elo} + ${deltaA}`,
      wins: sql`${wings.wins} + ${aWon ? 1 : 0}`,
      losses: sql`${wings.losses} + ${aWon ? 0 : 1}`,
    })
    .where(eq(wings.id, input.wingAId));
  await tx
    .update(wings)
    .set({
      elo: sql`${wings.elo} + ${deltaB}`,
      wins: sql`${wings.wins} + ${aWon ? 0 : 1}`,
      losses: sql`${wings.losses} + ${aWon ? 1 : 0}`,
    })
    .where(eq(wings.id, input.wingBId));

  const cards = [
    input.scoresA && { wingId: input.wingAId, ...input.scoresA },
    input.scoresB && { wingId: input.wingBId, ...input.scoresB },
  ].filter((c) => !!c);
  if (cards.length) {
    await tx.insert(tastings).values(
      cards.map((c) => ({
        ...c,
        userId: input.userId,
        battleId: battle.id,
        ...(input.createdAt ? { createdAt: input.createdAt } : {}),
      })),
    );
  }

  return { id: battle.id, deltaA, deltaB };
}
