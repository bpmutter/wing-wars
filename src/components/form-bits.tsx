"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function SubmitButton({ children, pendingText = "One moment…" }: { children: ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
      {error && <span className="mt-1 block text-sm font-bold text-ember">{error}</span>}
    </label>
  );
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="rounded-xl bg-ember/10 p-3 text-sm font-bold text-ember">{error}</p>;
}
