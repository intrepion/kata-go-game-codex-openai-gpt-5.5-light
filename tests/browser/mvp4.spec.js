const { test, expect } = require("@playwright/test");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const gameUrl = pathToFileURL(path.resolve(__dirname, "../../index.html")).href;

function boardPoint(box, size, x, y) {
  const margin = 44 * (box.width / 760);
  const gap = (box.width - margin * 2) / (size - 1);
  return {
    x: margin + x * gap,
    y: margin + y * gap
  };
}

test("root file launch supports undo and refresh restore", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  await page.goto(gameUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const canvas = page.locator("#board");
  const box = await canvas.boundingBox();
  await canvas.click({ position: boardPoint(box, 9, 0, 0) });
  await canvas.click({ position: boardPoint(box, 9, 1, 0) });
  await expect(page.locator("#move-list li")).toHaveText(["Black A1", "White B1"]);

  await page.locator("#undo-button").click();
  await expect(page.locator("#move-list li")).toHaveText(["Black A1"]);
  await expect(page.locator("#status")).toContainText("Undid");

  await page.reload();
  await expect(page.locator("#move-list li")).toHaveText(["Black A1"]);
  await expect(page.locator("#status")).toContainText("Undid");
  await expect(page.locator("#undo-button")).toBeEnabled();
  expect(errors).toEqual([]);
});
