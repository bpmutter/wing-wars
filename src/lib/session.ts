import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export type CurrentUser = { id: string; name: string; image: string | null };

/** Returns the signed-in user, or null. Reads request headers, so call it inside a Suspense boundary. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, image } = session.user;
  return { id, name, image: image ?? null };
}

/** Like getCurrentUser, but sends visitors to the sign-in page. */
export async function requireUser(returnTo = "/"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return user;
}
