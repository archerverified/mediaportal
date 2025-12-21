import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function usage(): never {
  // eslint-disable-next-line no-console
  console.error(
    "Usage: pnpm tsx tools/copy-ascend-logos.ts --map <ascend_logo_source_map.json> --assets <Ascend Reseller Portal_files> --outDir <client/public/logos_ascend> --outMap <ascend_logo_dest_map.json>"
  );
  process.exit(1);
}

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function sanitizeForFilename(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const mapPath = getArg("--map");
const assetsDir = getArg("--assets");
const outDir = getArg("--outDir");
const outMap = getArg("--outMap");
if (!mapPath || !assetsDir || !outDir || !outMap) usage();

const absMap = path.resolve(process.cwd(), mapPath);
const absAssets = path.resolve(process.cwd(), assetsDir);
const absOutDir = path.resolve(process.cwd(), outDir);
const absOutMap = path.resolve(process.cwd(), outMap);

if (!fs.existsSync(absMap)) {
  // eslint-disable-next-line no-console
  console.error(`Map not found: ${absMap}`);
  process.exit(1);
}
if (!fs.existsSync(absAssets)) {
  // eslint-disable-next-line no-console
  console.error(`Assets dir not found: ${absAssets}`);
  process.exit(1);
}

const srcMap = JSON.parse(fs.readFileSync(absMap, "utf8")) as Record<string, string>;
fs.mkdirSync(absOutDir, { recursive: true });

const destMap: Record<string, string> = {};

let copied = 0;
let missing = 0;

for (const [pubName, srcFilename] of Object.entries(srcMap)) {
  const base = sanitizeForFilename(pubName);
  if (!base) continue;
  const destFilename = `${base}.webp`;
  const srcPath = path.join(absAssets, srcFilename);
  const altPath = srcFilename.replace(/_002\.webp$/i, ".webp");
  const srcPathAlt = path.join(absAssets, altPath);

  const finalSrc = fs.existsSync(srcPath) ? srcPath : fs.existsSync(srcPathAlt) ? srcPathAlt : null;
  if (!finalSrc) {
    missing++;
    continue;
  }

  const destPath = path.join(absOutDir, destFilename);
  fs.copyFileSync(finalSrc, destPath);
  destMap[pubName] = `/logos_ascend/${destFilename}`;
  copied++;
}

fs.mkdirSync(path.dirname(absOutMap), { recursive: true });
fs.writeFileSync(absOutMap, JSON.stringify(destMap, null, 2));

// eslint-disable-next-line no-console
console.log(`Copied ${copied} logos to ${absOutDir}`);
// eslint-disable-next-line no-console
console.log(`Missing ${missing} source logo files in assets dir`);
// eslint-disable-next-line no-console
console.log(`Wrote destination map to ${absOutMap}`);


