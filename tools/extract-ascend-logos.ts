import fs from "node:fs";
import path from "node:path";
import process from "node:process";

type LogoMap = Record<string, string>; // publicationName -> sourceFilename.webp

function usage(): never {
  // eslint-disable-next-line no-console
  console.error(
    "Usage: pnpm tsx tools/extract-ascend-logos.ts --html <AscendResellerPortal.htm> --out <out.json>"
  );
  process.exit(1);
}

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function normName(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function collectFromRenderedHtml(html: string): LogoMap {
  const out: LogoMap = {};
  // Pattern observed in AscendResellerPortal.htm:
  // <img ... src="Ascend%20Reseller%20Portal_files/<file>.webp" ...>
  // ... <a ...>Publication Name</a>
  const re =
    /<img[^>]+src="Ascend%20Reseller%20Portal_files\/([^"]+?\.webp)"[^>]*>[\s\S]{0,1200}?<a[^>]*>([^<]+)<\/a>/gi;

  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const filename = m[1];
    const name = normName(m[2]);
    // Prefer first seen mapping to keep consistent
    if (filename && name && !out[name]) out[name] = filename;
  }

  return out;
}

const htmlPath = getArg("--html");
const outPath = getArg("--out");
if (!htmlPath || !outPath) usage();

const absHtml = path.resolve(process.cwd(), htmlPath);
const absOut = path.resolve(process.cwd(), outPath);

if (!fs.existsSync(absHtml)) {
  // eslint-disable-next-line no-console
  console.error(`HTML not found: ${absHtml}`);
  process.exit(1);
}

const html = fs.readFileSync(absHtml, "utf8");
const map = collectFromRenderedHtml(html);
fs.mkdirSync(path.dirname(absOut), { recursive: true });
fs.writeFileSync(absOut, JSON.stringify(map, null, 2));

// eslint-disable-next-line no-console
console.log(`Extracted ${Object.keys(map).length} publication->logo mappings to ${absOut}`);


