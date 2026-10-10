"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ next, githubEnabled }: { next: string; githubEnabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(form: FormData) {
    setError(null);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();
    start(async () => {
      const res =
        mode === "up"
          ? await authClient.signUp.email({ email, password, name: name || email.split("@")[0] })
          : await authClient.signIn.email({ email, password });
      if (res.error) {
        setError(res.error.message ?? "Something went wrong. The spirits are confused.");
        return;
      }
      router.push(next);
      router.refresh();
    });
  }

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-paper-2 p-1">
        {(["in", "up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-full py-2 text-sm font-bold transition ${mode === m ? "bg-card shadow" : "text-ink-soft"}`}
          >
            {m === "in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form action={submit} className="grid gap-4">
        {mode === "up" && (
          <label className="block">
            <span className="mb-1 block text-sm font-bold">Judge name</span>
            <input name="name" className="field" maxLength={40} placeholder="Sir Crispington" autoComplete="nickname" />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Email</span>
          <input name="email" type="email" required className="field" autoComplete="email" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="field"
            autoComplete={mode === "up" ? "new-password" : "current-password"}
          />
        </label>
        {error && <p className="rounded-xl bg-ember/10 p-3 text-sm font-bold text-ember">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Opening the gate…" : mode === "in" ? "Enter the meadow" : "Join the wars"}
        </button>
      </form>

      {githubEnabled && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-ink-soft">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          <button
            type="button"
            className="btn btn-secondary w-full"
            disabled={pending}
            onClick={() => start(async () => void (await authClient.signIn.social({ provider: "github", callbackURL: next })))}
          >
            Continue with GitHub
          </button>
        </>
      )}
    </div>
  );
}
