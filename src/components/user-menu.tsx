import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/sign-in" className="btn btn-secondary px-4! py-2! text-sm">
        Sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <Link href={`/judges/${user.id}`} className="btn btn-ghost px-3! py-2! text-sm" title="Your journal">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-meadow/30 font-display text-sm font-bold text-forest">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
      </Link>
      <SignOutButton />
    </div>
  );
}
