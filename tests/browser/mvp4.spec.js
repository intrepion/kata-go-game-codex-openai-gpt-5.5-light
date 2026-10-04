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

test("root file launch shows teaching overlay liberties", async ({ page }) => {
  await page.goto(gameUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const canvas = page.locator("#board");
  const box = await canvas.boundingBox();
  await canvas.click({ position: boardPoint(box, 9, 0, 0) });
  const liberty = boardPoint(box, 9, 1, 0);
  const pixel = await canvas.evaluate((node, point) => {
    const rect = node.getBoundingClientRect();
    const scaleX = node.width / rect.width;
    const scaleY = node.height / rect.height;
    const ctx = node.getContext("2d");
    return Array.from(ctx.getImageData(point.x * scaleX, point.y * scaleY, 1, 1).data);
  }, liberty);

  expect(pixel[1]).toBeGreaterThan(pixel[0]);
  expect(pixel[1]).toBeGreaterThan(pixel[2]);
});

test("touch input previews before placing a stone", async ({ page }) => {
  await page.goto(gameUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const canvas = page.locator("#board");
  const box = await canvas.boundingBox();
  const point = boardPoint(box, 9, 0, 0);

  await canvas.dispatchEvent("pointerup", {
    pointerType: "touch",
    clientX: box.x + point.x,
    clientY: box.y + point.y,
    bubbles: true
  });
  await expect(page.locator("#status")).toContainText("Previewing Black at A1");
  await expect(page.locator("#move-list li")).toHaveCount(0);

  await canvas.dispatchEvent("pointerup", {
    pointerType: "touch",
    clientX: box.x + point.x,
    clientY: box.y + point.y,
    bubbles: true
  });
  await expect(page.locator("#move-list li")).toHaveText(["Black A1"]);
});
