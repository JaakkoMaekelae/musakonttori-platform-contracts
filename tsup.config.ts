import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    product: "src/product.ts",
    collector: "src/collector.ts",
    auth: "src/auth.ts",
    fixtures: "src/fixtures.ts",
    "integration/index": "src/integration/index.ts",
  },
  format: ["esm", "cjs"],
  dts: false,
  clean: true,
  sourcemap: true,
  external: ["zod"],
});
