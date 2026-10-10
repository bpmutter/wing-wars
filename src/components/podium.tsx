import Link from "next/link";
import type { ReactNode } from "react";

export type PodiumItem = {
  id: string;
  href: string;
  name: string;
  sub: string;
  value: string;
  avatar: (size: number, crowned: boolean) => ReactNode;
};

/** Top three, each standing on its own little hill (2nd, 1st, 3rd). */
export function Podium({ items }: { items: PodiumItem[] }) {
  const slots = [
    { it: items[1], place: 2, h: 110 },
    { it: items[0], place: 1, h: 150 },
    { it: items[2], place: 3, h: 88 },
  ];
  return (
    <div className="card relative overflow-hidden px-2 pt-8">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-1/60 to-sky-2/30" aria-hidden />
      <div className="relative grid grid-cols-3 items-end gap-2">
        {slots.map(({ it, place, h }) =>
          it ? (
            <Link key={it.id} href={it.href} className="group flex flex-col items-center text-center">
              {it.avatar(place === 1 ? 130 : 100, place === 1)}
              <div className="mt-1 max-w-full truncate px-1 font-display text-base font-semibold group-hover:underline sm:text-xl">{it.name}</div>
              <div className="max-w-full truncate px-1 text-xs text-ink-soft sm:text-sm">{it.sub || " "}</div>
              <div
                className="mt-2 flex w-full flex-col items-center justify-start rounded-t-[50%_40px] bg-gradient-to-b from-meadow to-moss pt-4 text-[#fffaf0]"
                style={{ height: h }}
              >
                <span className="font-display text-3xl font-bold">{place}</span>
                <span className="text-sm font-bold tabular-nums">{it.value}</span>
              </div>
            </Link>
          ) : (
            <div key={place} />
          ),
        )}
      </div>
    </div>
  );
}
