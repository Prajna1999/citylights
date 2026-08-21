import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CENTER = { lat: 21.06, lon: 86.5 };

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function slugify(text, index) {
  const base = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return base || `place-${index}`;
}

function initials(name) {
  const words = name.split(/\s+/).filter(Boolean).slice(0, 2);
  return words.map((w) => w[0]).join("").toUpperCase() || "?";
}

const PRODUCTS = {
  "food-groceries": [
    { name: "Basmati rice", detail: "5 kg · household pack", price: "₹620", tone: "grain" },
    { name: "Mustard oil", detail: "1 L · Kachi Ghani", price: "₹168", tone: "oil" },
    { name: "Moong dal", detail: "1 kg · local stock", price: "₹142", tone: "dal" },
    { name: "Jaggery", detail: "500 g · block", price: "₹48", tone: "jaggery" },
  ],
  "restaurant-eatery": [
    { name: "Veg thali", detail: "Rice · dal · sabzi", price: "₹120", tone: "oil" },
    { name: "Chicken curry", detail: "Half plate", price: "₹140", tone: "dal" },
    { name: "Paratha & chai", detail: "Combo", price: "₹60", tone: "jaggery" },
    { name: "Rasgulla", detail: "Per piece", price: "₹30", tone: "cake" },
  ],
  "sweets-bakery": [
    { name: "Chhena poda", detail: "500 g · fresh", price: "₹280", tone: "cake" },
    { name: "Rasabali", detail: "Box of 4", price: "₹160", tone: "rasabali" },
    { name: "Khaja", detail: "250 g · crisp", price: "₹95", tone: "khaja" },
    { name: "Mixture", detail: "500 g · savoury", price: "₹180", tone: "mixture" },
  ],
  "fashion-garment": [
    { name: "Sambalpuri ikat", detail: "Cotton · handloom", price: "₹1,850", tone: "weave" },
    { name: "Bomkai silk", detail: "Silk blend · festive", price: "₹3,400", tone: "silk" },
    { name: "Daily cotton saree", detail: "Printed", price: "₹680", tone: "cotton" },
    { name: "Blouse piece", detail: "Assorted colours", price: "₹220", tone: "cloth" },
  ],
  tailoring: [
    { name: "Kurta stitching", detail: "Per piece", price: "₹250", tone: "cloth" },
    { name: "Pants alteration", detail: "Quick job", price: "₹80", tone: "cloth" },
    { name: "Blouse stitching", detail: "Per piece", price: "₹150", tone: "weave" },
    { name: "Zipper repair", detail: "Same day", price: "₹50", tone: "cloth" },
  ],
  "home-living": [
    { name: "Steel handi set", detail: "3 pieces", price: "₹890", tone: "steel" },
    { name: "Stacking storage", detail: "Set of 3", price: "₹540", tone: "storage" },
    { name: "Coconut scraper", detail: "Wood & steel", price: "₹160", tone: "wood" },
    { name: "LED table lamp", detail: "USB · warm light", price: "₹420", tone: "lamp" },
  ],
  "electronics-mobile": [
    { name: "Screen guard", detail: "Tempered glass", price: "₹150", tone: "screen" },
    { name: "Type-C cable", detail: "Fast charge · 1 m", price: "₹249", tone: "cable" },
    { name: "Wireless earbuds", detail: "Bluetooth · black", price: "₹799", tone: "buds" },
    { name: "Phone cover", detail: "Multiple models", price: "₹199", tone: "cover" },
  ],
  pharmacy: [
    { name: "First-aid kit", detail: "Home size · 24 items", price: "₹299", tone: "kit" },
    { name: "Digital thermometer", detail: "Fast reading", price: "₹180", tone: "thermo" },
    { name: "ORS sachets", detail: "Pack of 5", price: "₹65", tone: "sachet" },
    { name: "Mosquito repellent", detail: "60 nights", price: "₹149", tone: "repel" },
  ],
  clinic: [
    { name: "Consultation", detail: "General OPD", price: "₹300", tone: "kit" },
    { name: "Blood test", detail: "Basic panel", price: "₹500", tone: "sachet" },
    { name: "ECG", detail: "At clinic", price: "₹350", tone: "thermo" },
    { name: "Vaccination", detail: "Inquire at desk", price: "₹200", tone: "kit" },
  ],
  hospital: [
    { name: "OPD registration", detail: "Per visit", price: "₹50", tone: "kit" },
    { name: "General ward", detail: "Per day", price: "₹800", tone: "sachet" },
    { name: "Pharmacy", detail: "In hospital", price: "—", tone: "thermo" },
    { name: "Ambulance", detail: "24x7 service", price: "On call", tone: "repel" },
  ],
  "gym-fitness": [
    { name: "Monthly pass", detail: "All equipment", price: "₹800", tone: "screen" },
    { name: "Personal training", detail: "Per session", price: "₹300", tone: "buds" },
    { name: "Diet plan", detail: "With trainer", price: "₹500", tone: "cable" },
    { name: "Zumba batch", detail: "Evening slot", price: "₹1,000", tone: "cover" },
  ],
  jewellery: [
    { name: "Gold chain", detail: "Per gram + making", price: "Market rate", tone: "jaggery" },
    { name: "Silver anklet", detail: "Per piece", price: "₹1,200", tone: "steel" },
    { name: "Temple bangles", detail: "Set of 6", price: "₹2,400", tone: "silk" },
    { name: "Pendant", detail: "Assorted", price: "₹900", tone: "cake" },
  ],
  stationery: [
    { name: "Notebook", detail: "200 pages", price: "₹45", tone: "cloth" },
    { name: "Ball pens", detail: "Pack of 5", price: "₹60", tone: "wood" },
    { name: "Photo copies", detail: "Per page", price: "₹2", tone: "storage" },
    { name: "Drawing set", detail: "For school", price: "₹150", tone: "weave" },
  ],
  services: [
    { name: "Service", detail: "Inquire at counter", price: "—", tone: "storage" },
    { name: "Repair", detail: "On site", price: "Quote", tone: "steel" },
    { name: "Consultation", detail: "By appointment", price: "—", tone: "lamp" },
    { name: "Home visit", detail: "Available", price: "Quote", tone: "wood" },
  ],
  hospitality: [
    { name: "AC room", detail: "Per night", price: "₹1,400", tone: "silk" },
    { name: "Non-AC room", detail: "Per night", price: "₹800", tone: "cotton" },
    { name: "Breakfast", detail: "Per person", price: "₹150", tone: "oil" },
    { name: "Banquet", detail: "For events", price: "On quote", tone: "steel" },
  ],
  education: [
    { name: "Admission", detail: "Academic year", price: "Inquire", tone: "weave" },
    { name: "Hostel", detail: "Per month", price: "₹3,000", tone: "storage" },
    { name: "Transport", detail: "Bus facility", price: "₹800", tone: "steel" },
    { name: "Tuition", detail: "Per subject", price: "₹500", tone: "cloth" },
  ],
  religious: [
    { name: "Darshan", detail: "Free entry", price: "Free", tone: "jaggery" },
    { name: "Prasad", detail: "Offering", price: "₹50", tone: "cake" },
    { name: "Puja booking", detail: "Check timings", price: "Inquire", tone: "oil" },
    { name: "Donation", detail: "Optional", price: "—", tone: "wood" },
  ],
  transport: [
    { name: "Ticket", detail: "Per ride", price: "Local", tone: "storage" },
    { name: "Loading", detail: "Per trip", price: "Quote", tone: "steel" },
    { name: "Tour booking", detail: "Full day", price: "₹2,500", tone: "cable" },
    { name: "Parcel service", detail: "Intercity", price: "By weight", tone: "cover" },
  ],
  "bank-finance": [
    { name: "Savings account", detail: "Zero balance option", price: "Free", tone: "wood" },
    { name: "Fixed deposit", detail: "From", price: "7% p.a.", tone: "jaggery" },
    { name: "Loan", detail: "Eligibility check", price: "Inquire", tone: "silk" },
    { name: "ATM", detail: "24x7", price: "Free", tone: "steel" },
  ],
};

const FALLBACK_PRODUCTS = PRODUCTS["services"];

const CATEGORY_UI = {
  "food-groceries": { icon: "✦", color: "saffron" },
  "restaurant-eatery": { icon: "☕", color: "saffron" },
  "sweets-bakery": { icon: "◍", color: "yellow" },
  "fashion-garment": { icon: "◌", color: "rose" },
  tailoring: { icon: "✂", color: "rose" },
  "home-living": { icon: "⌂", color: "teal" },
  "electronics-mobile": { icon: "▤", color: "indigo" },
  pharmacy: { icon: "+", color: "blue" },
  clinic: { icon: "⚕", color: "blue" },
  hospital: { icon: "⚕", color: "blue" },
  "gym-fitness": { icon: "▥", color: "teal" },
  jewellery: { icon: "◆", color: "yellow" },
  stationery: { icon: "✎", color: "indigo" },
  services: { icon: "↗", color: "indigo" },
  hospitality: { icon: "☗", color: "rose" },
  education: { icon: "✎", color: "blue" },
  religious: { icon: "☸", color: "saffron" },
  transport: { icon: "➤", color: "teal" },
  "bank-finance": { icon: "₹", color: "yellow" },
};

function hoursStrings(rec) {
  const out = [];
  for (const slot of rec.hours || []) {
    if (slot.note) out.push(`Hours: ${slot.note}`);
    else if (slot.day_of_week !== undefined) {
      const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][slot.day_of_week];
      out.push(`${day}: ${slot.open_time ?? "—"} – ${slot.close_time ?? "—"}`);
    }
  }
  return out;
}

function areaFor(rec) {
  const a = rec.address || {};
  return a.locality || a.landmark || a.line || "Bhadrak";
}

function addressText(rec) {
  const a = rec.address || {};
  return [a.line, a.landmark, a.locality, a.district, a.state, a.pincode].filter(Boolean).join(", ");
}

async function main() {
  const records = JSON.parse(await readFile(path.join(ROOT, "data/seed/bhadrak-establishments-all.json"), "utf8"));

  const slugCounts = {};
  const shops = records.map((rec, index) => {
    const [lon, lat] = rec.location?.coordinates || [86.5, 21.06];
    const ui = CATEGORY_UI[rec.category_id] || CATEGORY_UI.services;
    let slug = slugify(rec.name, index);
    slugCounts[slug] = (slugCounts[slug] || 0) + 1;
    if (slugCounts[slug] > 1) slug = `${slug}-${slugCounts[slug]}`;

    const distanceKm = haversineKm(CENTER, { lat, lon });
    const statusNote =
      rec.status === "permanently_closed" ? "Permanently closed"
      : rec.status === "temporarily_closed" ? "Temporarily closed"
      : undefined;
    const verified = rec.last_verified_at ? new Date(rec.last_verified_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

    return {
      slug,
      name: rec.name,
      local: rec.name_local || "",
      categoryId: rec.category_id,
      category: rec.category_name,
      area: areaFor(rec),
      distance: `${distanceKm.toFixed(1)} km`,
      open: rec.status === "active",
      closes: null,
      statusNote,
      description: rec.description || `${rec.category_name} listed in the Bhadrak directory.`,
      initials: initials(rec.name),
      color: ui.color,
      phone: rec.phone || null,
      whatsapp: rec.whatsapp || null,
      verified,
      hours: hoursStrings(rec),
      addressText: addressText(rec),
      coordinates: { lat, lng: lon },
      products: PRODUCTS[rec.category_id] || FALLBACK_PRODUCTS,
      source: `${rec.source?.provider === "openstreetmap" ? "OpenStreetMap" : "Curated"}${rec.meta?.requires_verification ? " · awaiting verification" : ""}`,
    };
  });

  shops.sort((a, b) => a.name.localeCompare(b.name));

  const outDir = path.join(ROOT, "data/app");
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "establishments.app.json"), JSON.stringify(shops, null, 2));

  const byCat = {};
  for (const shop of shops) byCat[shop.category] = (byCat[shop.category] || 0) + 1;
  console.log(`Built app data: ${shops.length} establishments.`);
  console.log(JSON.stringify(byCat, null, 1));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});