import { expect, test, type Page } from "@playwright/test";

const shots = process.env.SCREENSHOT_DIR;
const snap = async (page: Page, name: string) => {
  if (shots) await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
};
/** Next keeps previous pages mounted but hidden, so only look at what's on screen. */
const visibleText = (page: Page, text: string | RegExp) => page.getByText(text).filter({ visible: true }).first();

test("a new judge can start a war, fight it, end it, and join another", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Latest war champion")).toBeVisible();
  await snap(page, "01-home");

  // Sign up
  await page.goto("/sign-in?next=/wars/new");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Judge name").fill("Test Taster");
  await page.getByLabel("Email").fill(`taster-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("supersecret");
  await page.getByRole("button", { name: "Join the wars" }).click();
  await page.waitForURL("**/wars/new");

  // Declare a war over two spots
  await page.getByLabel("Name of the war").fill("The Playwright Pepper War");
  await page.locator("label").filter({ hasText: "The Copper Kettle Tavern" }).click();
  await page.locator("label").filter({ hasText: "Cloudtop Diner" }).click();
  await snap(page, "02-new-war");
  await page.getByRole("button", { name: "🏯 Declare war" }).click();
  await page.waitForURL(/\/wars\/[^/]+\?started=1/);
  await expect(page.getByRole("heading", { name: "The Playwright Pepper War" })).toBeVisible();
  await expect(visibleText(page, "The fog of war hangs over the hills")).toBeVisible();
  const warUrl = page.url().split("?")[0];

  // Fight at the first battleground: the first wing's scorecard is open by default
  await page.getByRole("link", { name: /Next battleground/ }).click();
  await page.waitForURL(/\/spots\//);
  const sliders = page.locator('form input[type="range"][name="crisp"]').first();
  await sliders.fill("9");
  await page.getByRole("button", { name: "📜 File scorecard" }).first().click();
  await page.waitForURL(/saved=/);
  await expect(visibleText(page, "✅ Your score")).toBeVisible();

  // Review the restaurant itself
  await page.getByPlaceholder(/Warm lanterns/).fill("Cozy as a hearth.");
  await page.getByRole("button", { name: "🏮 Review this spot" }).click();
  await page.waitForURL(/reviewed=1/);
  await expect(page.getByRole("button", { name: "🏮 Update review" })).toBeVisible();
  await snap(page, "03-battleground");

  // Add a brand-new spot straight into the war, then a wing there, and score it
  await page.goto(warUrl);
  await page.getByRole("link", { name: "Add a brand-new spot to the war" }).click();
  await page.getByLabel("Name").fill("Playwright Pub");
  await page.getByRole("button", { name: "🏮 Add spot" }).click();
  await page.waitForURL(/\/spots\/[^/]+\?added=1/);
  await page.getByLabel("Flavor / name").fill("Headless Hot");
  await page.getByLabel("Wing type").selectOption({ label: "🔥 Buffalo" });
  await page.getByRole("button", { name: "🍗 Add wing" }).click();
  await page.waitForURL(/wing=/);
  await page.getByRole("button", { name: "📜 File scorecard" }).click();
  await page.waitForURL(/saved=/);
  await expect(visibleText(page, "✅ Your score")).toBeVisible();

  // End the war as host and see the reveal
  await page.goto(warUrl);
  await page.getByRole("button", { name: "🏁 End the war now" }).click();
  await page.getByRole("button", { name: "Yes, end the war" }).click();
  await page.waitForURL(/revealed=1/);
  await expect(visibleText(page, "The war is over")).toBeVisible();
  await expect(visibleText(page, / wins!$/)).toBeVisible();
  await expect(visibleText(page, "Wing of the War")).toBeVisible();
  await snap(page, "04-war-results");

  // Join someone else's war (the seeded live-scoreboard one)
  await page.goto("/wars");
  await snap(page, "05-wars");
  await page.getByRole("link", { name: /The Lantern Festival Skirmish/ }).click();
  await expect(visibleText(page, "Live standings")).toBeVisible();
  await page.getByRole("button", { name: "⚔️ Join this war" }).click();
  await page.waitForURL(/joined=1/);
  await expect(visibleText(page, "Your campaign")).toBeVisible();
  await snap(page, "06-live-war");

  // Solo review of a wing, outside any war
  await page.goto("/wings");
  await page.getByRole("link", { name: /Lemon Pepper Wet/ }).first().click();
  await page.getByPlaceholder(/Crackly skin/).fill("Bright as a spring morning.");
  await page.getByRole("button", { name: "📓 Save review" }).click();
  await page.waitForURL(/tasted=1/);
  await expect(visibleText(page, "Bright as a spring morning.")).toBeVisible();

  // Hall of Fame
  for (const [board, heading] of [
    ["", "The rest of the field"],
    ["?board=spots", "The rest of the villages"],
    ["?board=types", "Best in type"],
    ["?board=champions", "Every concluded war"],
  ] as const) {
    await page.goto(`/leaderboard${board}`);
    await expect(visibleText(page, heading)).toBeVisible();
  }
  await page.goto("/leaderboard");
  await snap(page, "07-hall-of-fame");

  // The seeded Buffalo war is still under fog for outsiders
  await page.goto("/wars");
  await page.getByRole("link", { name: /The Spring Buffalo War/ }).click();
  await expect(visibleText(page, "The fog of war hangs over the hills")).toBeVisible();
});
