import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "dist/manifest.json",
  "dist/background.js",
  "dist/content.js",
  "dist/overlay.css"
];

for (const file of requiredFiles) {
  await access(file);
}

const manifest = JSON.parse(await readFile("dist/manifest.json", "utf8"));

if (manifest.manifest_version !== 3) {
  throw new Error("manifest.json must use Manifest V3.");
}

if (!manifest.background?.service_worker) {
  throw new Error("manifest.json must define a background service worker.");
}

if (!manifest.commands?.["open-tab-switcher"]) {
  throw new Error("manifest.json must define open-tab-switcher.");
}

for (let slot = 1; slot <= 10; slot += 1) {
  if (!manifest.commands?.[`switch-to-recent-tab-${slot}`]) {
    throw new Error(`manifest.json must define switch-to-recent-tab-${slot}.`);
  }
}

console.log("dist extension files look loadable.");
