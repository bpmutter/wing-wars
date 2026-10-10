import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { joinWar } from "@/app/actions";
import { LeafShower, Progress, SectionTitle, StatPill, WarStatus } from "@/components/bits";
import { SubmitButton } from "@/components/form-bits";
import { Podium } from "@/components/podium";
import { SpotSpirit } from "@/components/spot-spirit";
import { WingSpirit } from "@/components/wing-spirit";
import { getWar, spotsOutsideWar } from "@/lib/queries";
import { MAX_SPOT_TOTAL, MAX_TOTAL } from "@/lib/scoring";
import { getCurrentUser } from "@/lib/session";
import { PRIOR_WEIGHT } from "@/lib/war-results";
import { warEndTime } from "@/lib/wars";
import { AddBattlegroundForm, EndWarButton } from "./war-controls";

export const metadata: Metadata = { title: "War" };

const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });

export default async function WarPage({ params, searchParams }: PageProps<"/wars/[id]">) {
  await connection();
  const { id } = await params;
  const sp = await searchParams;
  const viewer = await getCurrentUser();
  const data = await getWar(id, viewer?.id ?? null);
  if (!data) notFound();
  const { war, ended, visible, isMember, isHost, members, battlegrounds, results } = data;
  const now = new Date();
  const endTime = warEndTime(war);
  const spotName = new Map(battlegrounds.map((b) => [b.spotId, b.name]));
  const memberName = new Map(members.map((m) => [m.userId, m.name]));
  const nextUp = battlegrounds.find((b) => !b.viewerJudged);
  const addable = isMember && !ended ? await spotsOutsideWar(war.id) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {(sp.revealed || sp.started || sp.joined) && <LeafShower count={sp.revealed ? 18 : 8} />}

      {/* ── header ── */}
      <header className="card relative overflow-hidden p-6 sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-sauce">
          🏯 Wing war{data.type && <> · {data.type.emoji} {data.type.name} only</>}
        </p>
        <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">{war.name}</h1>
        <p className="mt-1 text-ink-soft">
          Hosted by{" "}
          <Link className="link" href={`/judges/${war.hostId}`}>
            {data.hostName}
          </Link>
          {endTime && (
            <>
              {" "}
              · {ended ? "ended" : "ends"} {fmtDate(endTime)}
            </>
          )}
        </p>
        {war.description && <p className="mt-4 max-w-2xl whitespace-pre-line">{war.description}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <WarStatus ended={ended} endsAt={war.endsAt} now={now} />
          {war.fogOfWar && <span className="chip">🌫️ Fog of war</span>}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill label="Battlegrounds" value={battlegrounds.length} />
          <StatPill label="Judges" value={members.length} />
          <StatPill label="Scorecards" value={data.scorecardCount} />
          <StatPill label="Ground covered" value={`${Math.round(data.completion * 100)}%`} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!ended && !viewer && (
            <Link href={`/sign-in?next=/wars/${war.id}`} className="btn btn-primary">
              ⚔️ Sign in to join this war
            </Link>
          )}
          {!ended && viewer && !isMember && (
            <form action={joinWar.bind(null, war.id)}>
              <SubmitButton pendingText="Enlisting…">⚔️ Join this war</SubmitButton>
            </form>
          )}
          {!ended && isMember && nextUp && (
            <Link href={`/wars/${war.id}/spots/${nextUp.spotId}`} className="btn btn-primary">
              🍗 Next battleground: {nextUp.name}
            </Link>
          )}
          {isHost && !ended && <EndWarButton warId={war.id} />}
        </div>
      </header>

      {/* ── your campaign ── */}
      {isMember && (
        <section className="card mt-6 p-6">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold">Your campaign</h2>
            <span className="text-sm text-ink-soft">
              {data.viewerProgress} of {battlegrounds.length} battlegrounds judged
            </span>
          </div>
          <Progress value={battlegrounds.length ? data.viewerProgress / battlegrounds.length : 0} label="Your progress" />
          {!ended && data.viewerProgress === battlegrounds.length && battlegrounds.length > 0 && (
            <p className="mt-3 text-sm font-bold text-forest">🌟 You&apos;ve judged every battleground. Rest now, brave eater — you can still update your scores until the war ends.</p>
          )}
        </section>
      )}

      {/* ── results or fog ── */}
      {visible && results ? (
        <Results
          warId={war.id}
          ended={ended}
          results={results}
          spotName={spotName}
          memberName={memberName}
          wings={data.wings}
          neighborhoods={new Map(battlegrounds.map((b) => [b.spotId, b.neighborhood]))}
        />
      ) : (
        <section className="card relative mt-6 overflow-hidden p-8 text-center">
          <div className="text-5xl" aria-hidden>
            🌫️
          </div>
          <h2 className="mt-2 text-2xl font-semibold">The fog of war hangs over the hills</h2>
          <p className="mx-auto mt-2 max-w-xl text-ink-soft">
            Standings stay hidden until the war ends
            {endTime ? <> on <b className="text-ink">{fmtDate(endTime)}</b></> : <> (the host decides when)</>}, so
            nobody&apos;s swayed by the scoreboard. Then the champion is revealed to everyone at once.
          </p>
        </section>
      )}

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_20rem]">
        {/* ── battlegrounds ── */}
        <section>
          <SectionTitle>Battlegrounds</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {battlegrounds.map((b, i) => (
              <Link
                key={b.spotId}
                href={`/wars/${war.id}/spots/${b.spotId}`}
                className="card group flex items-center gap-3 p-4 transition hover:-translate-y-0.5"
              >
                <SpotSpirit seed={b.spotId} size={56} crowned={b.standing?.place === 1} className="shrink-0 group-hover:animate-bob" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-soft">Battle {i + 1}</div>
                  <div className="truncate font-display text-lg font-semibold">{b.name}</div>
                  <div className="text-xs text-ink-soft">
                    visited by {b.judges} of {members.length} judge{members.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {b.standing?.place ? (
                    <div className="font-display text-2xl font-semibold">#{b.standing.place}</div>
                  ) : visible ? (
                    <div className="text-xs text-ink-soft">unjudged</div>
                  ) : null}
                  {isMember && <div className="text-sm">{b.viewerJudged ? "✅" : "⏳"}</div>}
                </div>
              </Link>
            ))}
          </div>
          {isMember && !ended && (
            <div className="card mt-4 p-5">
              <h3 className="mb-3 font-semibold">Add a battleground</h3>
              <AddBattlegroundForm warId={war.id} spots={addable} />
            </div>
          )}
        </section>

        {/* ── members ── */}
        <aside>
          <SectionTitle>The judges</SectionTitle>
          <ul className="card divide-y divide-line">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-meadow/30 font-display font-bold text-forest">
                  {m.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/judges/${m.userId}`} className="link block truncate font-bold">
                    {m.name}
                  </Link>
                  <div className="text-xs text-ink-soft">
                    {m.userId === war.hostId ? "🏯 Host · " : ""}
                    {m.judged}/{battlegrounds.length} battlegrounds
                  </div>
                </div>
                <div className="w-16">
                  <Progress value={battlegrounds.length ? m.judged / battlegrounds.length : 0} label={`${m.name}'s progress`} />
                </div>
              </li>
            ))}
          </ul>
          {!ended && (
            <p className="mt-3 text-xs text-ink-soft">Share this page&apos;s link to recruit more judges — anyone signed in can join.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

type Results = NonNullable<Awaited<ReturnType<typeof getWar>>>["results"] & {};
type WingInfo = NonNullable<Awaited<ReturnType<typeof getWar>>>["wings"];

function Results({
  warId,
  ended,
  results,
  spotName,
  memberName,
  wings,
  neighborhoods,
}: {
  warId: string;
  ended: boolean;
  results: Results;
  spotName: Map<string, string>;
  memberName: Map<string, string>;
  wings: WingInfo;
  neighborhoods: Map<string, string>;
}) {
  const ranked = results.standings.filter((s) => s.place !== null);
  if (ranked.length === 0) {
    return (
      <section className="card mt-6 p-8 text-center">
        <h2 className="text-2xl font-semibold">{ended ? "The war ended in silence" : "Live standings"}</h2>
        <p className="mt-2 text-ink-soft">No scorecards were filed{ended ? "" : " yet"}. {ended ? "Nobody wins. Nobody loses. Everybody's hungry." : ""}</p>
      </section>
    );
  }
  const champion = ranked[0];
  const wingLabel = (id: string) => {
    const w = wings.get(id);
    return w ? `${w.name}` : "a mystery wing";
  };

  const awards: { icon: string; title: string; who: React.ReactNode; detail: string; href?: string; avatar?: React.ReactNode }[] = [];
  if (results.bestWing) {
    const w = wings.get(results.bestWing.wingId);
    awards.push({
      icon: "🍗",
      title: "Wing of the War",
      who: wingLabel(results.bestWing.wingId),
      detail: `${spotName.get(results.bestWing.spotId)} · ${results.bestWing.rawAvg.toFixed(1)}/${MAX_TOTAL} from ${results.bestWing.judges} judge${results.bestWing.judges === 1 ? "" : "s"}`,
      href: `/wings/${results.bestWing.wingId}`,
      avatar: w && <WingSpirit seed={w.id} heat={w.heat} style={w.style} size={52} crowned />,
    });
  }
  for (const e of results.elementAwards) {
    const w = wings.get(e.wingId);
    awards.push({
      icon: e.icon,
      title: `Best ${e.label}`,
      who: wingLabel(e.wingId),
      detail: `${w ? spotName.get(w.spotId) : ""} · ${e.avg.toFixed(1)}/10`,
      href: `/wings/${e.wingId}`,
    });
  }
  if (results.bestHangout) {
    awards.push({
      icon: "🏮",
      title: "Best Hangout",
      who: spotName.get(results.bestHangout.spotId),
      detail: `the restaurant itself · ${results.bestHangout.score.toFixed(1)}/${MAX_SPOT_TOTAL}`,
      avatar: <SpotSpirit seed={results.bestHangout.spotId} size={52} />,
    });
  }
  if (results.mostDevoted) {
    const j = results.judges.find((x) => x.userId === results.mostDevoted)!;
    awards.push({ icon: "📓", title: "Most Devoted", who: memberName.get(j.userId), detail: `${j.battlegroundsJudged} battlegrounds, ${j.scorecards} scorecards`, href: `/judges/${j.userId}` });
  }
  if (results.oracle) {
    awards.push({ icon: "🔮", title: "The Oracle", who: memberName.get(results.oracle), detail: "Rankings closest to the final verdict", href: `/judges/${results.oracle}` });
  }
  if (results.contrarian) {
    awards.push({ icon: "🌪️", title: "The Contrarian", who: memberName.get(results.contrarian), detail: "Marched to the beat of their own fryer", href: `/judges/${results.contrarian}` });
  }

  return (
    <section className="mt-6">
      {ended ? (
        <div className="card mb-6 p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sauce">🏁 The war is over</p>
          <div className="my-4 flex justify-center animate-bob">
            <SpotSpirit seed={champion.spotId} size={170} crowned />
          </div>
          <h2 className="text-4xl font-semibold sm:text-5xl">{spotName.get(champion.spotId)} wins!</h2>
          <p className="mt-2 text-ink-soft">
            Champion of the war with {champion.score!.toFixed(1)} points from {champion.judges} judge{champion.judges === 1 ? "" : "s"}.
            {champion.bestWingId && <> Their {wingLabel(champion.bestWingId)} led the charge.</>}
          </p>
          <Link href={`/spots/${champion.spotId}`} className="btn btn-secondary mt-4">
            Visit the champion
          </Link>
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-semibold">Live standings</h2>
          <p className="text-sm text-ink-soft">No fog of war here — the scoreboard updates as scorecards come in.</p>
        </div>
      )}

      <Podium
        items={ranked.slice(0, 3).map((s) => ({
          id: s.spotId,
          href: `/wars/${warId}/spots/${s.spotId}`,
          name: spotName.get(s.spotId) ?? "?",
          sub: neighborhoods.get(s.spotId) ?? "",
          value: s.score!.toFixed(1),
          avatar: (size, crowned) => <SpotSpirit seed={s.spotId} size={size} crowned={crowned} className="animate-bob" />,
        }))}
      />

      {awards.length > 0 && (
        <div className="mt-8">
          <SectionTitle>{ended ? "Honors of the war" : "Honors so far"}</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {awards.map((a) => {
              const body = (
                <>
                  {a.avatar ?? (
                    <span className="grid h-13 w-13 shrink-0 place-items-center text-3xl" aria-hidden>
                      {a.icon}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-wider text-sauce">
                      {a.avatar && <>{a.icon} </>}
                      {a.title}
                    </div>
                    <div className="truncate font-display text-lg font-semibold">{a.who}</div>
                    <div className="truncate text-xs text-ink-soft">{a.detail}</div>
                  </div>
                </>
              );
              return a.href ? (
                <Link key={a.title} href={a.href} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5">
                  {body}
                </Link>
              ) : (
                <div key={a.title} className="card flex items-center gap-3 p-4">
                  {body}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <SectionTitle>Full standings</SectionTitle>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wider text-ink-soft">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Battleground</th>
                  <th className="p-3" title="The average, adjusted for how many judges scored it">Score</th>
                  <th className="p-3">Raw avg</th>
                  <th className="p-3">Judges</th>
                  <th className="p-3">Best wing</th>
                </tr>
              </thead>
              <tbody>
                {results.standings.map((s) => (
                  <tr key={s.spotId} className="border-b border-line/60 last:border-0">
                    <td className="p-3 font-display text-lg font-semibold text-ink-soft">{s.place ?? "—"}</td>
                    <td className="p-3">
                      <Link href={`/wars/${warId}/spots/${s.spotId}`} className="link font-bold">
                        {spotName.get(s.spotId)}
                      </Link>
                    </td>
                    <td className="p-3 font-bold tabular-nums">{s.score?.toFixed(1) ?? "—"}</td>
                    <td className="p-3 tabular-nums text-ink-soft">{s.rawAvg?.toFixed(1) ?? "—"}</td>
                    <td className="p-3 tabular-nums">{s.judges}</td>
                    <td className="p-3">{s.bestWingId ? wingLabel(s.bestWingId) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            Scores are out of {MAX_TOTAL}. Each judge&apos;s scorecards at a battleground are averaged into one vote,
            then each battleground&apos;s score is blended with {PRIOR_WEIGHT} imaginary average judges — so a single
            rave review can&apos;t win a war on its own.
          </p>
        </div>
        <div>
          <SectionTitle>Each judge&apos;s verdict</SectionTitle>
          <ul className="grid gap-3">
            {results.judges
              .filter((j) => j.ranking.length > 0)
              .map((j) => (
                <li key={j.userId} className="card p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link href={`/judges/${j.userId}`} className="link font-bold">
                      {memberName.get(j.userId)}
                    </Link>
                    {j.agreement !== null && (
                      <span className="text-xs text-ink-soft" title="How closely their ranking matched the final standings">
                        {Math.round(((j.agreement + 1) / 2) * 100)}% in tune
                      </span>
                    )}
                  </div>
                  <ol className="mt-2 grid gap-0.5 text-sm">
                    {j.ranking.slice(0, 3).map((r, i) => (
                      <li key={r.spotId} className="flex justify-between gap-2">
                        <span className="truncate">
                          {["🥇", "🥈", "🥉"][i]} {spotName.get(r.spotId)}
                        </span>
                        <span className="tabular-nums text-ink-soft">{r.score.toFixed(1)}</span>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
