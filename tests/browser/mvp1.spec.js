const { test, expect } = require("@playwright/test");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const gameUrl = pathToFileURL(path.resolve(__dirname, "../../index.html")).href;

test("root file launch supports setup and stone placement", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  await page.goto(gameUrl);
  await expect(page.locator("#status")).toContainText("Black to play");

  await page.selectOption("#board-size", "13");
  await page.locator("#setup-form button").click();
  await expect(page.locator("#board-label")).toHaveText("13x13");

  const canvas = page.locator("#board");
  const box = await canvas.boundingBox();
  const margin = 44 * (box.width / 760);
  await canvas.click({ position: { x: margin, y: margin } });

  await expect(page.locator("#status")).toContainText("White to play");
  await expect(page.locator("#move-list li")).toHaveText("Black A1");
  expect(errors).toEqual([]);
});
