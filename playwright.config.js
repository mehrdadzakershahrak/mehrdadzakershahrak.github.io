const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || "/tmp/mdz-playwright-results",
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4000",
    headless: true,
  },
  webServer: [
    {
      command: "bash tests/e2e/run-jekyll-e2e.sh",
      cwd: __dirname,
      url: "http://127.0.0.1:4000",
      reuseExistingServer: true,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 120_000,
    },
  ],
});
