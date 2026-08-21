import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", "data");

const REQUIRED = ["id", "name", "category_id", "status", "location", "created_at", "updated_at"];
const STATUSES = ["active", "temporarily_closed", "permanently_closed"];
const DAYS = [0, 1, 2, 3, 4, 5, 6];

function errorsFor(rec, index, file) {
  const errs = [];
  const where = `${file}[${index}] ${rec.name || rec.id}`;
  for (const key of REQUIRED) {
    if (rec[key] === undefined || rec[key] === null) errs.push(`${where}: missing "${key}"`);
  }
  if (!STATUSES.includes(rec.status)) errs.push(`${where}: bad status "${rec.status}"`);
  if (rec.location?.type !== "Point") errs.push(`${where}: location.type must be "Point"`);
  if (!Array.isArray(rec.location?.coordinates) || rec.location.coordinates.length !== 2 || rec.location.coordinates.some((n) => typeof n !== "number")) {
    errs.push(`${where}: location.coordinates must be [lng, lat]`);
  }
  if (rec.category_id === "services" && !rec.meta?.is_scraped) {
    errs.push(`${where}: uncategorised (fell back to "services")`);
  }
  for (const slot of rec.hours || []) {
    const hasDay = DAYS.includes(slot.day_of_week);
    const hasRaw = typeof slot.note === "string" && slot.note.length > 0;
    if (!hasDay && !hasRaw) errs.push(`${where}: hours slot needs day_of_week or a raw note`);
  }
  return errs;
}

async function collectFiles() {
  const files = [];
  for (const dir of ["scraped", "seed"]) {
    const full = path.join(DATA_DIR, dir);
    try {
      for (const name of await readdir(full)) {
        if (name.endsWith(".json")) files.push(path.join(full, name));
      }
    } catch {
      /* dir may not exist */
    }
  }
  return files;
}

async function main() {
  const files = await collectFiles();
  const include = process.argv.slice(2);
  const targets = include.length ? include.map((p) => path.resolve(p)) : files;

  if (!targets.length) {
    console.log("No JSON files found under data/scraped or data/seed.");
    return;
  }

  let failures = 0;
  for (const file of targets) {
    const records = JSON.parse(await readFile(file, "utf8"));
    for (let i = 0; i < records.length; i++) {
      const errs = errorsFor(records[i], i, file);
      for (const e of errs) console.log("✗ " + e);
      failures += errs.length;
    }
    console.log(`${records.length} records checked in ${file}`);
  }
  if (failures) {
    console.log(`\n${failures} issue(s) found.`);
    process.exit(1);
  }
  console.log("\nAll records valid ✓");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
