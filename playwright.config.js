const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/browser",
  use: {
    viewport: { width: 1280, height: 900 }
  }
});
