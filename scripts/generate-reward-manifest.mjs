import { readdirSync, writeFileSync } from "fs";
import { join } from "path";

const VIDEO_EXT = [".mp4", ".webm", ".mov"];
const LEVELS = [1, 2, 3, 4, 5];

function scan(dir) {
  return readdirSync(join("public", dir))
    .filter((f) => VIDEO_EXT.includes(f.slice(f.lastIndexOf(".")).toLowerCase()))
    .map((f) => `/rewards/levels/${dir.split("/").pop()}/${f}`);
}

const manifest = {};
for (const lvl of LEVELS) {
  manifest[`level${lvl}`] = scan(`rewards/levels/level${lvl}`);
}

writeFileSync(
  "src/constants/rewardManifest.json",
  JSON.stringify(manifest, null, 2)
);

Object.entries(manifest).forEach(([k, v]) => console.log(`${k}: ${v.length} clips`));
