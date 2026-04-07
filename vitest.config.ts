import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
  },
  resolve: {
    alias: {
      "@build-up/shared": path.resolve(__dirname, "packages/shared/src/index.ts"),
      "@build-up/shared/": path.resolve(__dirname, "packages/shared/src/"),
      "@build-up/ai": path.resolve(__dirname, "packages/ai/src/index.ts"),
      "@build-up/ai/": path.resolve(__dirname, "packages/ai/src/"),
    },
  },
});
