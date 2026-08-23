import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // apps/web tsconfig 는 Next 용 jsx:"preserve" — vite 8(oxc)이 .tsx 를 그대로 두면
  // 파싱 실패한다. 테스트에서 React 컴포넌트 실렌더를 위해 automatic 으로 변환.
  // (vite 8부터 esbuild 옵션은 deprecated — oxc.jsx 로 지정)
  oxc: { jsx: { runtime: "automatic" } },
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
