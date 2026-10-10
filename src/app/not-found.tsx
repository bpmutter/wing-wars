import Link from "next/link";
import { WingSpirit } from "@/components/wing-spirit";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <WingSpirit seed="lost" heat={0} size={140} dazed />
      <h1 className="mt-4 text-4xl font-semibold">Lost in the mist</h1>
      <p className="mt-2 text-ink-soft">Whatever you were looking for has wandered off into the forest.</p>
      <Link href="/" className="btn btn-primary mt-6">Return to the meadow</Link>
    </div>
  );
}
