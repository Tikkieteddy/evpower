// tikkieteddielab: Vitest configuration (unit tests for utils; no DOM needed).
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.js"],
    // Users are in Thailand; date grouping must be tested in UTC+7.
    env: { TZ: "Asia/Bangkok" },
  },
});
