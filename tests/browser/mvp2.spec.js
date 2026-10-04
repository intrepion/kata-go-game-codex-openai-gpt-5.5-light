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

test("root file launch applies captures and rejects occupied moves visibly", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  await page.goto(gameUrl);
  const canvas = page.locator("#board");
  const box = await canvas.boundingBox();

  for (const [x, y] of [
    [1, 0],
    [1, 1],
    [0, 1],
    [4, 4],
    [2, 1],
    [5, 5],
    [1, 2]
  ]) {
    await canvas.click({ position: boardPoint(box, 9, x, y) });
  }

  await expect(page.locator("#black-captures")).toHaveText("1");
  await expect(page.locator("#status")).toContainText("captured 1");
  await expect(page.locator("#move-list li").last()).toContainText("x1");

  await canvas.click({ position: boardPoint(box, 9, 1, 2) });
  await expect(page.locator("#status")).toContainText("occupied");
  await expect(page.locator("#status")).toHaveClass(/is-warning/);
  expect(errors).toEqual([]);
});
