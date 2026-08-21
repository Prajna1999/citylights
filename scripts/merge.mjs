import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", "data");

async function loadDir(dir) {
  const full = path.join(DATA_DIR, dir);
  const records = [];
  try {
    for (const name of await readdir(full)) {
      if (!name.endsWith(".json")) continue;
      const file = path.join(full, name);
      const data = JSON.parse(await readFile(file, "utf8"));
      if (Array.isArray(data)) records.push(...data);
    }
  } catch {
    /* dir may not exist */
  }
  return records;
}

async function main() {
  const scraped = await loadDir("scraped");
  const curated = await loadDir("curated");

  const seen = new Set();
  const merged = [];
  for (const rec of [...scraped, ...curated]) {
    if (seen.has(rec.id)) continue;
    seen.add(rec.id);
    merged.push(rec);
  }

  merged.sort((a, b) => a.name.localeCompare(b.name));

  const outDir = path.join(DATA_DIR, "seed");
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "bhadrak-establishments-all.json"), JSON.stringify(merged, null, 2));

  const bySource = {};
  for (const rec of merged) {
    const provider = rec.source?.provider || "unknown";
    bySource[provider] = (bySource[provider] || 0) + 1;
  }
  console.log(`Merged ${merged.length} records (deduplicated by id).`);
  console.log("By source:", JSON.stringify(bySource));
  console.log("Wrote data/seed/bhadrak-establishments-all.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});