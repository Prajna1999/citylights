import appData from "@/data/app/establishments.app.json";

export type Product = { name: string; detail: string; price: string; tone: string };

export type Shop = {
  slug: string;
  name: string;
  local: string;
  categoryId: string;
  category: string;
  area: string;
  distance: string;
  open: boolean;
  closes: string | null;
  statusNote?: string;
  description: string;
  initials: string;
  color: string;
  phone: string | null;
  whatsapp: string | null;
  verified: string | null;
  hours: string[];
  addressText: string;
  coordinates: { lat: number; lng: number };
  products: Product[];
  source: string;
};

export const shops = appData as Shop[];

const CATEGORY_ICONS: Record<string, string> = {
  "food-groceries": "✦",
  "restaurant-eatery": "☕",
  "sweets-bakery": "◍",
  "fashion-garment": "◌",
  tailoring: "✂",
  "home-living": "⌂",
  "electronics-mobile": "▤",
  pharmacy: "+",
  clinic: "⚕",
  hospital: "⚕",
  "gym-fitness": "▥",
  jewellery: "◆",
  stationery: "✎",
  services: "↗",
  hospitality: "☗",
  education: "✎",
  religious: "☸",
  transport: "➤",
  "bank-finance": "₹",
};

export const shopCategories = Object.entries(
  shops.reduce<Record<string, { icon: string; count: number }>>((acc, shop) => {
    const entry = acc[shop.category] || { icon: CATEGORY_ICONS[shop.categoryId] ?? "↗", count: 0 };
    entry.count += 1;
    acc[shop.category] = entry;
    return acc;
  }, {}),
).map(([name, meta]) => ({ name, icon: meta.icon, count: meta.count }));

export function getShop(slug: string) {
  return shops.find((shop) => shop.slug === slug);
}

export function telHref(phone: string | null) {
  return phone ? `tel:${phone.replaceAll(" ", "")}` : null;
}