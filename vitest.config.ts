import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      // Tests mock the Supabase client; these only stop src/lib/supabase.ts
      // from throwing at import time if a test forgets to.
      env: {
        VITE_SUPABASE_URL: "http://localhost.test",
        VITE_SUPABASE_ANON_KEY: "test-anon-key",
      },
    },
  }),
);
