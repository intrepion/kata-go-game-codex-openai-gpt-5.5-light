const { test, expect } = require("@playwright/test");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const gameUrl = pathToFileURL(path.resolve(__dirname, "../../index.html")).href;

test("root file launch ends and scores after two passes", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  await page.goto(gameUrl);
  await page.locator("#pass-button").click();
  await expect(page.locator("#status")).toContainText("Black passed");

  await page.locator("#pass-button").click();
  await expect(page.locator("#status")).toContainText("White wins by 6.5");
  await expect(page.locator("#score-card")).toBeVisible();
  await expect(page.locator("#score-summary")).toContainText("Black 0.0 - White 6.5");
  await expect(page.locator("#pass-button")).toBeDisabled();
  await expect(page.locator("#move-list li")).toHaveText(["Black pass", "White pass"]);

  await page.reload();
  await expect(page.locator("#status")).toContainText("Black to play");
  await expect(page.locator("#score-card")).toBeHidden();
  expect(errors).toEqual([]);
});
