import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import * as XLSXImport from "xlsx";

function normKey(k: string): string {
  return String(k)
    .trim()
    .toLowerCase()
    .replace(/[%]/g, "percent")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function pick<T>(row: Record<string, any>, keys: string[]): T | undefined {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
      return row[k] as T;
    }
  }
  return undefined;
}

function usage(): never {
  // eslint-disable-next-line no-console
  console.error(
    "Usage: pnpm tsx tools/convert-best-sellers.ts --in <best-sellers.xlsx> --out <best_sellers.json>"
  );
  process.exit(1);
}

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

const inPath = getArg("--in");
const outPath = getArg("--out");
if (!inPath || !outPath) usage();

const absIn = path.resolve(process.cwd(), inPath);
const absOut = path.resolve(process.cwd(), outPath);

if (!fs.existsSync(absIn)) {
  // eslint-disable-next-line no-console
  console.error(`Input XLSX not found: ${absIn}`);
  process.exit(1);
}

// `xlsx` is CJS; depending on the loader, functions may live under `.default`
const XLSX: any = (XLSXImport as any).default ?? (XLSXImport as any);
const wb = XLSX.readFile(absIn, { cellDates: false });
const sheetName = wb.SheetNames[0];
if (!sheetName) {
  // eslint-disable-next-line no-console
  console.error("No sheets found in XLSX.");
  process.exit(1);
}

const ws = wb.Sheets[sheetName];
const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
const rows = rawRows.map((r) => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(r)) out[normKey(k)] = v;
  return out;
});

const names = rows
  .map((r) =>
    String(
      pick(r, [
        "name_of_publication",
        "publication",
        "publication_name",
        "name",
        "publication_title",
      ]) ?? ""
    ).trim()
  )
  .filter(Boolean);

const uniq = Array.from(new Set(names.map((n) => n.trim()))).sort((a, b) => a.localeCompare(b));

fs.mkdirSync(path.dirname(absOut), { recursive: true });
fs.writeFileSync(absOut, JSON.stringify({ names: uniq }));

// eslint-disable-next-line no-console
console.log(`Loaded ${rows.length} rows from "${sheetName}"`);
// eslint-disable-next-line no-console
console.log(`Wrote ${uniq.length} best-seller names to: ${absOut}`);


