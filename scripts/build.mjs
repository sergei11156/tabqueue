import { mkdir, rm, cp } from "node:fs/promises";
import { build } from "esbuild";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

await cp("src/manifest.json", "dist/manifest.json");
await cp("src/overlay.css", "dist/overlay.css");

await build({
  entryPoints: ["src/background.ts"],
  bundle: true,
  format: "esm",
  outfile: "dist/background.js",
  sourcemap: true,
  target: "chrome120",
  logLevel: "info"
});

await build({
  entryPoints: ["src/content.ts"],
  bundle: true,
  format: "iife",
  outfile: "dist/content.js",
  sourcemap: true,
  target: "chrome120",
  logLevel: "info"
});
