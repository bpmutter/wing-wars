"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-ghost px-3! py-2! text-sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await authClient.signOut();
          router.push("/");
          router.refresh();
        })
      }
    >
      {pending ? "…" : "Sign out"}
    </button>
  );
}
