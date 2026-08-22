export type Product = { name: string; detail: string; price: string; tone: string };

export type ShopStatus = "active" | "temporarily_closed" | "permanently_closed";

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
  lastVerifiedAt?: string | null;
  status?: ShopStatus;
  owner?: string;
  landmark?: string;
  hours: string[];
  addressText: string;
  coordinates: { lat: number; lng: number };
  products: Product[];
  source: string;
};

export type ReportItem = {
  id: string;
  shopName: string;
  body: string;
  phone: string;
  status: "open" | "resolved";
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
};

export const SHOP_COLORS = ["saffron", "rose", "teal", "blue", "indigo", "yellow"] as const;

export const CATEGORY_ICONS: Record<string, string> = {
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

export const TOWN_CENTRE = { lat: 21.06, lng: 86.5 };

export function telHref(phone: string | null) {
  return phone ? `tel:${phone.replaceAll(" ", "")}` : null;
}

export function statusLabel(shop: Pick<Shop, "status" | "statusNote">) {
  switch (shop.status ?? "active") {
    case "temporarily_closed":
      return shop.statusNote || "Temporarily closed";
    case "permanently_closed":
      return "Permanently closed";
    default:
      return "Active";
  }
}

export function shopInitials(name: string) {
  const words = name.split(/\s+/).filter((word) => /[a-zA-Z0-9]/.test(word));
  const letters = words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "");
  return (letters.join("") || "H").slice(0, 2);
}

export function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "shop";
}

export function haversineKm(lat: number, lng: number) {
  const R = 6371;
  const dLat = ((lat - TOWN_CENTRE.lat) * Math.PI) / 180;
  const dLng = ((lng - TOWN_CENTRE.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((TOWN_CENTRE.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}
