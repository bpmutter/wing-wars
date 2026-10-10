import { expect, test } from "@playwright/test";

const shots = process.env.SCREENSHOT_DIR;
const snap = async (page: import("@playwright/test").Page, name: string) => {
  if (shots) await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
};

test("a new judge can sign up, battle wings and spots, and run a tournament", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Reigning champion")).toBeVisible();
  await snap(page, "01-home");

  // Sign up
  await page.goto("/sign-in?next=/battle");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Judge name").fill("Test Taster");
  await page.getByLabel("Email").fill(`taster-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("supersecret");
  await snap(page, "02-sign-up");
  await page.getByRole("button", { name: "Join the wars" }).click();
  await page.waitForURL("**/battle");

  // Battle
  await page.getByRole("button", { name: "🎲 Surprise me" }).click();
  const sliders = page.locator('input[type="range"][name^="a."]');
  for (let i = 0; i < 5; i++) await sliders.nth(i).fill("9");
  await expect(page.getByText("by score")).toBeVisible();
  await page.getByPlaceholder(/blue cheese/).fill("A playwright-certified crunch.");
  await snap(page, "03-battle-form");
  await page.getByRole("button", { name: "⚔️ Seal the verdict" }).click();
  await page.waitForURL(/\/battles\/.+/);
  await expect(page.getByText("Tale of the tape")).toBeVisible();
  await expect(page.getByText("A playwright-certified crunch.")).toBeVisible();
  await snap(page, "04-battle-report");

  // Add a spot and a wing
  await page.goto("/spots/new");
  await page.getByLabel("Name").fill("Playwright Pub");
  await page.getByRole("button", { name: "🏮 Add spot" }).click();
  await page.waitForURL(/\/spots\/.+/);
  await page.getByLabel("Flavor / name").fill("Headless Hot");
  await page.getByLabel("Wing type").selectOption({ label: "➕ Something new…" });
  await page.getByLabel("New wing type").fill("Chromium Chili");
  await page.getByRole("button", { name: "🍗 Add wing" }).click();
  await page.waitForURL(/\/wings\/.+/);
  await expect(page.getByRole("heading", { name: "Headless Hot" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Chromium Chili/ })).toBeVisible();
  await page.getByRole("button", { name: "📓 Log tasting" }).click();
  await page.waitForURL(/tasted=1/);
  await expect(page.getByText("Averaged over 1 scorecard")).toBeVisible();
  await snap(page, "05-wing");

  // Review the spot
  await page.getByRole("link", { name: "Playwright Pub" }).click();
  await page.waitForURL(/\/spots\/.+/);
  await page.getByPlaceholder(/Warm lanterns/).fill("Very headless service.");
  await page.getByRole("button", { name: "🏮 Review this spot" }).click();
  await page.waitForURL(/reviewed=1/);
  await expect(page.getByText("Averaged over 1 review")).toBeVisible();
  await expect(page.getByText("Very headless service.")).toBeVisible();

  // Wing type leaderboard
  await page.goto("/types");
  await page.getByRole("link", { name: /Chromium Chili/ }).click();
  await expect(page.getByRole("heading", { name: "The best Chromium Chili in the land" })).toBeVisible();
  await expect(page.getByText("Headless Hot", { exact: true }).filter({ visible: true })).toBeVisible();

  // Spot showdown
  await page.goto("/battle?mode=spot");
  await page.getByRole("button", { name: "🎲 Surprise me" }).click();
  const spotSliders = page.locator('input[type="range"][name^="b."]');
  for (let i = 0; i < 5; i++) await spotSliders.nth(i).fill("8");
  await snap(page, "05b-spot-battle-form");
  await page.getByRole("button", { name: "⚔️ Seal the verdict" }).click();
  await page.waitForURL(/\/spot-battles\/.+/);
  await expect(page.getByRole("heading", { name: / defeats / })).toBeVisible();
  await expect(page.getByText("Tale of the tape")).toBeVisible();
  await snap(page, "05c-spot-battle-report");

  // Tournament
  await page.goto("/tournament");
  await page.getByRole("button", { name: "4 wings" }).click();
  await page.getByRole("button", { name: "🎲 Fill randomly" }).click();
  await snap(page, "06-tournament-setup");
  await page.getByRole("button", { name: "🏯 Begin (seeded by rating)" }).click();
  for (let i = 0; i < 3; i++) {
    await expect(page.getByText("Which wing wins?")).toBeVisible();
    if (i === 1) await snap(page, "07-tournament-match");
    await page.locator("section").filter({ hasText: "Which wing wins?" }).getByRole("button").first().click();
  }
  await expect(page.getByText("is champion!")).toBeVisible();
  await page.getByRole("button", { name: "📜 Save to the chronicle" }).click();
  await page.waitForURL(/\/tournaments\/.+/);
  await expect(page.getByText("👑 Champion")).toBeVisible();
  await snap(page, "08-tournament-result");

  await page.goto("/leaderboard");
  await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
  await snap(page, "09-leaderboard");
  await page.goto("/leaderboard?board=spots");
  await expect(page.getByText("Spot ranks")).toBeVisible();
  await snap(page, "10-leaderboard-spots");
  await page.goto("/leaderboard?board=types");
  await expect(page.getByRole("columnheader", { name: "vs other types" })).toBeVisible();
  await snap(page, "11-leaderboard-types");
});
