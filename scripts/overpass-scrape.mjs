import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");

const OVERPASS_URL = process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter";
const NOMINATIM_URL = process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org";
const UA = process.env.NOMINATIM_UA || "haat-bhadrak-dir/1.0 (curation bot; contact@haat.local)";

const CITY = process.env.CITY || "Bhadrak";
const BBOX = (process.env.BBOX || "21.040,86.470,21.090,86.540").split(",").map(Number);
const ENRICH_ADDRESS = process.env.ENRICH_ADDRESS === "1";
const ENRICH_LIMIT = Number(process.env.ENRICH_LIMIT || "60");

const [south, west, north, east] = BBOX;
const bbox = `${south},${west},${north},${east}`;

let enrichmentCount = 0;

const QUERY = `
[out:json][timeout:90];
(
  node["shop"](bbox);
  way["shop"](bbox);
  node["amenity"~"restaurant|cafe|fast_food|pharmacy|clinic|hospital|dentist|doctors|gym|marketplace|school|college|university|place_of_worship|bank|atm"](bbox);
  way["amenity"~"restaurant|cafe|fast_food|pharmacy|clinic|hospital|dentist|doctors|gym|marketplace|school|college|university|place_of_worship|bank|atm"](bbox);
  node["healthcare"](bbox);
  way["healthcare"](bbox);
  node["leisure"~"fitness_centre|sports_centre"](bbox);
  way["leisure"~"fitness_centre|sports_centre"](bbox);
  node["craft"](bbox);
  way["craft"](bbox);
  node["tourism"~"hotel|guest_house"](bbox);
  way["tourism"~"hotel|guest_house"](bbox);
  node["office"](bbox);
  way["office"](bbox);
  node["railway"="station"](bbox);
  way["railway"="station"](bbox);
);
out center tags;
`.replaceAll("(bbox)", `(${bbox})`);

const CATEGORY_MAP = [
  { match: (t) => ["clothes", "fashion", "boutique", "shoes", "jewellery"].some((k) => t.shop === k || (t.shop && t.shop.includes(k))), id: "fashion-garment" },
  { match: (t) => ["supermarket", "grocery", "convenience", "general", "greengrocer", "butcher", "fish", "dairy"].some((k) => t.shop === k), id: "food-groceries" },
  { match: (t) => t.amenity === "restaurant" || t.amenity === "fast_food" || t.amenity === "cafe", id: "restaurant-eatery" },
  { match: (t) => t.shop === "bakery" || t.shop === "confectionery" || t.shop === "pastry", id: "sweets-bakery" },
  { match: (t) => ["electronics", "mobile_phone", "computer"].some((k) => t.shop === k), id: "electronics-mobile" },
  { match: (t) => t.amenity === "pharmacy" || t.healthcare === "pharmacy", id: "pharmacy" },
  { match: (t) => t.amenity === "hospital" || t.healthcare === "hospital", id: "hospital" },
  { match: (t) => ["clinic", "doctors", "dentist"].some((k) => t.amenity === k) || (t.healthcare && t.healthcare !== "pharmacy" && t.healthcare !== "hospital"), id: "clinic" },
  { match: (t) => t.leisure === "fitness_centre" || t.leisure === "sports_centre" || t.amenity === "gym", id: "gym-fitness" },
  { match: (t) => t.craft === "tailor", id: "tailoring" },
  { match: (t) => ["furniture", "houseware", "household", "kitchen"].some((k) => t.shop === k), id: "home-living" },
  { match: (t) => t.shop === "stationery", id: "stationery" },
  { match: (t) => t.shop === "jeweller" || t.shop === "jewelry", id: "jewellery" },
  { match: (t) => t.tourism === "hotel" || t.tourism === "guest_house", id: "hospitality" },
  { match: (t) => ["school", "college", "university", "kindergarten"].some((k) => t.amenity === k), id: "education" },
  { match: (t) => t.amenity === "place_of_worship", id: "religious" },
  { match: (t) => t.amenity === "bank" || t.amenity === "atm", id: "bank-finance" },
  { match: (t) => t.railway === "station", id: "transport" },
];

function categorize(tags) {
  for (const rule of CATEGORY_MAP) {
    if (rule.match(tags)) return rule.id;
  }
  return "services";
}

const STATUS_MAP = [
  { keys: ["disused", "abandoned", "demolished"], value: "permanently_closed" },
  { keys: ["construction", "proposed"], value: "temporarily_closed" },
];

function status(tags) {
  for (const rule of STATUS_MAP) {
    if (rule.keys.some((k) => tags[k] === "yes" || tags[k] === "true")) return rule.value;
  }
  return "active";
}

function first(...values) {
  return values.find((v) => v && v.trim());
}

async function fetchOverpass(query) {
  const url = new URL(OVERPASS_URL);
  url.searchParams.set("data", query);
  const response = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Overpass ${response.status}: ${await response.text()}`);
  return response.json();
}

async function reverseGeocode(lat, lon) {
  const url = new URL(`${NOMINATIM_URL}/reverse`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  const response = await fetch(url, { headers: { "User-Agent": UA } });
  if (!response.ok) throw new Error(`Nominatim ${response.status}`);
  await new Promise((r) => setTimeout(r, 1100)); // respect 1 req/s
  return response.json();
}

function pickAddress(tags, geocoded) {
  if (tags["addr:full"]) {
    return {
      line: tags["addr:full"],
      district: tags["addr:district"] || undefined,
      state: tags["addr:state"] || undefined,
      pincode: tags["addr:postcode"] || undefined,
    };
  }
  if (tags["addr:street"] || tags["addr:city"]) {
    return {
      line: [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(", ") || undefined,
      landmark: tags["addr:landmark"] || undefined,
      locality: tags["addr:suburb"] || tags["addr:city"] || undefined,
      district: tags["addr:district"] || undefined,
      state: tags["addr:state"] || undefined,
      pincode: tags["addr:postcode"] || undefined,
      country: tags["addr:country"] || undefined,
    };
  }
  if (geocoded?.address) {
    const a = geocoded.address;
    return {
      line: [a.road && geocoded.name !== a.road ? a.road : undefined].filter(Boolean).join(", ") || undefined,
      locality: a.suburb || a.city_district || a.town || undefined,
      district: a.county || undefined,
      state: a.state || undefined,
      pincode: a.postcode || undefined,
      country: a.country || undefined,
    };
  }
  return {};
}

async function enrichAddress(element, tags) {
  if (!ENRICH_ADDRESS) return null;
  const hasAddr = tags["addr:full"] || tags["addr:street"] || tags["addr:city"] || tags["addr:postcode"];
  if (hasAddr) return null;
  if (enrichmentCount >= ENRICH_LIMIT) return null;
  enrichmentCount += 1;
  try {
    return await reverseGeocode(element.lat, element.lon);
  } catch {
    return null;
  }
}

function toEstablishment(element, categoriesByName) {
  const tags = element.tags || {};
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  const categoryId = categorize(tags);
  const name = tags.name || tags["name:en"] || "(unnamed)";
  const local = tags["name:or"] || tags["name:odia"] || undefined;

  return {
    id: `${element.type}/${element.id}`,
    name,
    ...(local ? { name_local: local } : {}),
    category_id: categoryId,
    category_name: categoriesByName[categoryId]?.name || categoryId,
    subcategory: [tags.shop, tags.amenity, tags.healthcare, tags.leisure, tags.craft, tags.tourism].filter(Boolean),
    ...(tags.operator ? { owner_name: tags.operator } : {}),
    ...(tags.description ? { description: tags.description } : {}),
    phone: first(tags.phone, tags["contact:phone"], tags["phone:mobile"]) || undefined,
    whatsapp: tags["contact:whatsapp"] || undefined,
    address: { line: undefined, landmark: undefined, locality: undefined, district: undefined, state: undefined, pincode: undefined, country: undefined },
    location: { type: "Point", coordinates: [lon, lat] },
    ...(tags.opening_hours ? { hours: [{ note: tags.opening_hours }] } : {}),
    status: status(tags),
    last_verified_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: {
      provider: "openstreetmap",
      place_id: `${element.type}/${element.id}`,
      scraped_at: new Date().toISOString(),
      url: tags["website"] || tags["contact:website"] || `https://www.openstreetmap.org/${element.type}/${element.id}`,
    },
    tags: Object.entries(tags).filter(([, v]) => v && v !== "no").map(([k, v]) => `${k}=${v}`).slice(0, 20),
    meta: {
      is_scraped: true,
      requires_verification: true,
      osm_type: element.type,
      osm_id: element.id,
      opening_hours_raw: tags.opening_hours || null,
    },
  };
}

async function main() {
  const categories = JSON.parse(await readFile(path.join(DATA_DIR, "categories.json"), "utf8"));
  const categoriesByName = Object.fromEntries(categories.map((c) => [c.id, c]));

  console.log(`Querying Overpass for ${CITY} (bbox ${bbox})...`);
  const data = await fetchOverpass(QUERY);
  const elements = data.elements || [];
  console.log(`Fetched ${elements.length} raw OSM elements.`);

  const outDir = path.join(DATA_DIR, "scraped");
  await mkdir(outDir, { recursive: true });

  const records = [];
  for (const element of elements) {
    const tags = element.tags || {};
    if (!tags.name) continue; // skip unnamed
    const geocoded = await enrichAddress(element, tags);
    const rec = toEstablishment(element, categoriesByName);
    if (geocoded) rec.address = pickAddress(tags, geocoded);
    else if (Object.keys(tags).some((k) => k.startsWith("addr:"))) rec.address = pickAddress(tags, null);
    records.push(rec);
  }

  records.sort((a, b) => a.name.localeCompare(b.name));
  const fileName = `${CITY.toLowerCase().replaceAll(" ", "-")}-establishments.json`;
  await writeFile(path.join(outDir, fileName), JSON.stringify(records, null, 2));
  console.log(`Wrote ${records.length} establishments -> data/scraped/${fileName}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
