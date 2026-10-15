const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "../../tests/typefaces",
  testMatch: "browser.spec.js",
  outputDir: "/tmp/mz-vellum-browser-results",
  timeout: 30_000,
  reporter: "list",
  use: { baseURL: process.env.FONT_SPECIMEN_URL || "http://127.0.0.1:4010", headless: true },
});
