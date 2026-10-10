import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

const DEV_SECRET = "wing-wars-local-dev-secret-not-for-production-use";

function secret() {
  if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
  if (process.env.VERCEL) {
    throw new Error(
      "BETTER_AUTH_SECRET must be set when deployed. See TODOS.md.",
    );
  }
  return DEV_SECRET;
}

const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter(Boolean)
  .map((host) => `https://${host}`);

export const githubEnabled = Boolean(
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
);

export const auth = betterAuth({
  secret: secret(),
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined),
  trustedOrigins: vercelOrigins,
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: githubEnabled
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
      }
    : {},
  // Must be last: lets server actions set auth cookies.
  plugins: [nextCookies()],
});
