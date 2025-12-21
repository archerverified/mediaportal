import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import * as XLSXImport from "xlsx";

type Publication = {
  id: number;
  name: string;
  image: string;
  genres: string[];
  price: number;
  da: number;
  tat: string;
  region: string;
  sponsored: boolean;
  indexed: boolean;
  do_follow: boolean;
  example_image: boolean;
  niches: string[];
  type: string;
  lifespan: string;
  mention_type: string;
  status: string;
  has_image: boolean;
};

type Output = {
  publications: Publication[];
  filters: {
    genres: string[];
    regions: string[];
    types: string[];
    lifespans: string[];
    sponsored: string[];
    indexed: string[];
    do_follow: string[];
    niches: string[];
  };
  columns: string[];
};

function normKey(k: string): string {
  return String(k)
    .trim()
    .toLowerCase()
    .replace(/[%]/g, "percent")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (!s) return false;
  // Special handling for backlink semantics coming from XLSX
  if (
    ["no-follow", "no follow", "nofollow", "no_follow", "nofollow"].includes(s)
  )
    return false;
  if (
    ["do-follow", "do follow", "dofollow", "do_follow", "dofollow"].includes(s)
  )
    return true;
  return ["yes", "y", "true", "1", "paid", "✓", "check", "checked"].includes(s);
}

function toNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v ?? "")
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function toInt(v: unknown): number {
  return Math.round(toNumber(v));
}

function splitList(v: unknown): string[] {
  const s = String(v ?? "").trim();
  if (!s) return [];
  return s
    .split(/[;,|]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function sanitizeForLogoFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .trim();
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
    "Usage: pnpm tsx tools/convert-mediaupdated.ts --in <path.xlsx> --out <path.json>"
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

// Optional: apply legacy Ascend logos if a name->imagePath map exists
const ascendLogoMapPath = path.resolve(
  process.cwd(),
  "client/public/data/ascend_logo_dest_map.json"
);
let ascendLogoMap: Record<string, string> | null = null;
if (fs.existsSync(ascendLogoMapPath)) {
  try {
    ascendLogoMap = JSON.parse(fs.readFileSync(ascendLogoMapPath, "utf8"));
    // eslint-disable-next-line no-console
    console.log(
      `Loaded Ascend logo map: ${Object.keys(ascendLogoMap).length} entries`
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to parse Ascend logo map at ${ascendLogoMapPath}`, e);
    ascendLogoMap = null;
  }
}

// Load logo registry for SVG mappings
const logoRegistryPath = path.resolve(
  process.cwd(),
  "client/public/data/logo-registry.json"
);
type LogoRegistry = {
  exactMatches: Record<string, string>;
  patternMatches: { pattern: string; logo: string }[];
};
let logoRegistry: LogoRegistry | null = null;
if (fs.existsSync(logoRegistryPath)) {
  try {
    logoRegistry = JSON.parse(fs.readFileSync(logoRegistryPath, "utf8"));
    // eslint-disable-next-line no-console
    console.log(
      `Loaded logo registry: ${Object.keys(logoRegistry?.exactMatches ?? {}).length} exact + ${logoRegistry?.patternMatches?.length ?? 0} patterns`
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to parse logo registry at ${logoRegistryPath}`, e);
    logoRegistry = null;
  }
}

// Function to get logo from registry
function getLogoFromRegistry(name: string): string | null {
  if (!logoRegistry) return null;
  // Check exact matches first
  if (logoRegistry.exactMatches[name]) {
    return logoRegistry.exactMatches[name];
  }
  // Check pattern matches
  for (const { pattern, logo } of logoRegistry.patternMatches) {
    if (name.includes(pattern)) {
      return logo;
    }
  }
  return null;
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
// defval keeps empty cells so keys exist consistently
const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

// Normalize headers
const rows = rawRows.map((r) => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(r)) out[normKey(k)] = v;
  return out;
});

// eslint-disable-next-line no-console
console.log(`Loaded ${rows.length} rows from "${sheetName}"`);
if (rows.length === 0) {
  // eslint-disable-next-line no-console
  console.error("No rows found. Is the first sheet empty?");
  process.exit(1);
}

// Determine if the sheet provides IDs; otherwise generate sequential IDs
const hasId = rows.some((r) => pick(r, ["id", "publication_id"]) !== undefined);

const publications: Publication[] = rows.map((r, idx) => {
  const id = hasId ? toInt(pick(r, ["id", "publication_id"]) ?? idx) : idx;

  const rawName =
    (String(
      pick(r, [
        // common variants
        "publication",
        "publication_name",
        "name",
        "site",
        "website",
        // excel header: "NAME OF PUBLICATION"
        "name_of_publication",
        // other plausible variants
        "publication_title",
        "name_of_site",
      ]) ?? ""
    ).trim() || `Publication ${id}`);

  // Remove specific publications from the output database (per request)
  // Note: some names have known variants in the source data.
  const EXCLUDE_PUBLICATIONS = new Set<string>([
    "Algar Advertiser",
    "Alwatanaka Foothills News",
    "Alwatanaka News",
    "Aracat Advertiser",
    "Attractroner",
    "Balmnet Star",
    "Baya",
    "Beautifulc",
    "Blismark",
    "Boamortal",
    "Buyrus Telegram Forum",
    "Coomandara ad id",
    // dataset contains Engadine as "Engadine (Australia)"
    "Engadine",
    "Engadine (Australia)",
    "Excectior California",
    // dataset contains a variant spelling
    "C Heads Magazine",
    "C-Heads Magazine",
    "Colacpoint Observer",
    "Coorowindra News",
    // New exclusions per plan
    "GK Magazine",
    "Click Music",
    "Invice Weekly",
    "Glass",
    "Salute Gazette",
    "Zone Deaf",
    "ISH",
    "Malaysian",
    "Masila",
    "21st Club",
    "Biblionews.com (New York)",
  ]);

  if (EXCLUDE_PUBLICATIONS.has(rawName)) {
    // @ts-expect-error map will be filtered below
    return null;
  }

  // Rename publications in the portal per plan
  const RENAME_MAP: Record<string, string> = {
    "Men's Health (Australia)": "Men's Health",
    "Hardware Gamer": "Hardcore Gamer",
    "Biblionews.com (Dallas)": "Biz Journals (Dallas)",
    "Golf Nest Traveler": "Condé Nast Traveler",
  };
  const name = RENAME_MAP[rawName] ?? rawName;

  // Genre overrides for specific publications
  const GENRE_OVERRIDES: Record<string, string[]> = {
    "East View News": ["News"],
    "Gulf Business": ["Business"],
  };

  let genres = (() => {
    const g =
      pick(r, ["genres", "genre", "category", "categories", "vertical"]) ?? "";
    const arr = Array.isArray(g) ? g.map(String) : splitList(g);
    return arr.map((x) => x.trim()).filter(Boolean);
  })();

  // Apply genre overrides if applicable
  if (GENRE_OVERRIDES[name]) {
    genres = GENRE_OVERRIDES[name];
  }

  const price = toNumber(pick(r, ["price", "cost", "rate", "usd", "price_usd"]));
  const da = toInt(pick(r, ["da", "domain_authority", "domainauthority"]));
  const tat = String(pick(r, ["tat", "turnaround_time", "turnaround"]) ?? "").trim();
  const region = String(pick(r, ["region", "geo", "country"]) ?? "").trim();

  const sponsored = toBool(
    pick(r, [
      // excel expects: Sponsored -> Paid Tag (app field `sponsored`)
      "sponsored",
      "paid_tag",
      "paid",
      "paidtag",
      "sponsored_post",
      "sponsored_content",
    ])
  );
  const indexed = toBool(pick(r, ["indexed", "index", "google_indexed"]));
  const do_follow = toBool(
    pick(r, [
      // excel expects: Backlink -> app field `do_follow`
      "backlink",
      "backlinks",
      "do_follow",
      "dofollow",
      "do_follow_link",
    ])
  );

  const niches = (() => {
    const n = pick(r, ["niches", "niche"]) ?? "";
    const arr = Array.isArray(n) ? n.map(String) : splitList(n);
    return arr.map((x) => x.trim()).filter(Boolean);
  })();

  const type = String(pick(r, ["type", "placement_type"]) ?? "article").trim() || "article";
  const lifespan =
    String(pick(r, ["lifespan", "duration"]) ?? "12 months").trim() || "12 months";
  const mention_type =
    String(pick(r, ["mention_type", "link_type"]) ?? "link").trim() || "link";
  const status = String(pick(r, ["status"]) ?? "active").trim() || "active";

  const imageCell = pick(r, ["image", "logo", "logo_file", "logo_filename"]);
  let image = "";
  // Priority 1: Explicit image from XLSX
  if (imageCell) {
    const s = String(imageCell).trim();
    if (s.startsWith("/")) image = s;
    else if (s) image = `/logos/${s}`;
  }
  // Priority 2: Logo registry (SVG mappings)
  if (!image) {
    const registryLogo = getLogoFromRegistry(name);
    if (registryLogo) image = registryLogo;
  }
  // Priority 3: Legacy Ascend logo map
  if (!image && ascendLogoMap) {
    image = ascendLogoMap[name] ?? ascendLogoMap[rawName] ?? "";
  }
  // Priority 4: Fallback to generated path (may not exist)
  if (!image) {
    image = `/logos/${id}_${sanitizeForLogoFilename(name)}.png`;
  }

  const example_image = toBool(pick(r, ["example_image", "exampleimage"]));
  const has_image =
    pick(r, ["has_image", "hasimage"]) !== undefined
      ? toBool(pick(r, ["has_image", "hasimage"]))
      : false;

  return {
    id,
    name,
    image,
    genres,
    price,
    da,
    tat,
    region,
    sponsored,
    indexed,
    do_follow,
    example_image,
    niches,
    type,
    lifespan,
    mention_type,
    status,
    has_image,
  };
}).filter(Boolean) as Publication[];

function uniqSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((x) => x.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

const out: Output = {
  publications,
  filters: {
    genres: uniqSorted(publications.flatMap((p) => p.genres)),
    regions: uniqSorted(publications.map((p) => p.region)),
    types: uniqSorted(publications.map((p) => p.type)),
    lifespans: uniqSorted(publications.map((p) => p.lifespan)),
    sponsored: ["Yes", "No"],
    indexed: ["Yes", "No"],
    do_follow: ["Yes", "No"],
    niches: uniqSorted(publications.flatMap((p) => p.niches)),
  },
  columns: [
    "Publication",
    "Genres",
    "Price",
    "DA",
    "TAT",
    "Region",
    "Sponsored",
    "Indexed",
    "Backlink",
  ],
};

fs.mkdirSync(path.dirname(absOut), { recursive: true });
fs.writeFileSync(absOut, JSON.stringify(out));

// eslint-disable-next-line no-console
console.log(`Wrote ${publications.length} publications to: ${absOut}`);

