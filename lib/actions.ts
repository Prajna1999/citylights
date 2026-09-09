"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, requireUser } from "@/lib/auth";
import {
  allReports,
  appendShop,
  approveShop,
  getShop,
  saveReports,
  saveShop,
  uniqueSlug,
  verifyShopBySlug,
} from "@/lib/db";
import { CATEGORIES } from "@/lib/categories";
import {
  haversineKm,
  parseBookedDates,
  parseKeywords,
  parsePhotoUrls,
  SHOP_COLORS,
  shopInitials,
  slugify,
  type ReportItem,
  type Shop,
  type ShopStatus,
} from "@/lib/types";

function refresh() {
  revalidatePath("/", "layout");
}

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type FormState = { ok: boolean; message: string };

/** Called programmatically from the add-shop wizard (client). Returns a result object. */
export async function createShop(formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = str(formData, "name");
  if (!name) return { ok: false, message: "Shop name is required." };
  const slugBase = slugify(name);
  if (await getShop(slugBase)) return { ok: false, message: `A shop called “${name}” is already in the registry.` };

  const phone = str(formData, "phone");
  if (phone.replaceAll(/\D/g, "").length < 6) return { ok: false, message: "Add a valid phone number — at least 6 digits." };

  const lat = Number.parseFloat(str(formData, "lat"));
  const lng = Number.parseFloat(str(formData, "lng"));
  if (Number.isNaN(lat) || Number.isNaN(lng)) return { ok: false, message: "Drop a pin before saving — latitude and longitude are required." };

  const categoryName = str(formData, "category");
  const category = CATEGORIES.find((entry) => entry.name === categoryName);
  if (!category) return { ok: false, message: "Pick a category from the list." };

  const hours = Array.from({ length: 7 }, (_, index) => str(formData, `day-${index}`))
    .map((row, index) => (row ? `${DAY_NAMES[index]}: ${row}` : ""))
    .filter(Boolean);
  const whatsappRaw = str(formData, "whatsapp");
  const photoUrls = parsePhotoUrls(str(formData, "photoUrls"));

  const shop: Shop = {
    slug: await uniqueSlug(slugBase),
    name,
    local: str(formData, "local"),
    categoryId: category.id,
    category: category.name,
    area: str(formData, "area") || "Bhadrak",
    distance: `${haversineKm(lat, lng).toFixed(1)} km`,
    open: hours.length > 0,
    closes: null,
    description: str(formData, "description"),
    initials: shopInitials(name),
    color: SHOP_COLORS[name.length % SHOP_COLORS.length],
    phone: phone || null,
    whatsapp: whatsappRaw || null,
    instagram: str(formData, "instagram") || null,
    facebook: str(formData, "facebook") || null,
    website: str(formData, "website") || null,
    verified: null,
    lastVerifiedAt: null,
    status: "active",
    owner: str(formData, "owner") || undefined,
    ownerId: user.id,
    approvalStatus: user.role === "superadmin" ? "approved" : "pending",
    landmark: str(formData, "landmark") || undefined,
    offlineBooking: formData.get("offlineBooking") === "on",
    bookedDates: parseBookedDates(str(formData, "bookedDates")),
    hours,
    addressText: str(formData, "address"),
    coordinates: { lat, lng },
    products: [],
    source: user.role === "superadmin" ? "Added by curator" : "Submitted by owner",
    photoUrl: photoUrls[0] ?? null,
    photoUrls,
    keywords: parseKeywords(str(formData, "keywords")),
  };

  await appendShop(shop);
  refresh();
  return { ok: true, message: shop.slug };
}

/** Plain <form> action for the shop editor. Redirects back with ?saved / ?error feedback. */
export async function updateShopAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = str(formData, "slug");
  const existing = await getShop(slug);
  if (!existing) redirect(`/admin/shops/${slug}?error=${encodeURIComponent("This shop is no longer in the registry.")}`);
  if (user.role !== "superadmin" && existing.ownerId !== user.id) redirect("/admin");

  const name = str(formData, "name");
  if (!name) redirect(`/admin/shops/${slug}?error=${encodeURIComponent("Shop name is required.")}`);

  const status = (str(formData, "status") || "active") as ShopStatus;
  const lat = Number.parseFloat(str(formData, "lat"));
  const lng = Number.parseFloat(str(formData, "lng"));
  const category = CATEGORIES.find((entry) => entry.id === str(formData, "categoryId")) ?? {
    id: existing.categoryId,
    name: existing.category,
  };

  await saveShop({
    ...existing,
    name,
    local: str(formData, "local"),
    categoryId: category.id,
    category: category.name,
    owner: str(formData, "owner") || undefined,
    landmark: str(formData, "landmark") || undefined,
    offlineBooking: formData.get("offlineBooking") === "on",
    bookedDates: parseBookedDates(str(formData, "bookedDates")),
    area: str(formData, "area") || existing.area,
    description: str(formData, "description"),
    phone: str(formData, "phone") || null,
    whatsapp: str(formData, "whatsapp") || null,
    instagram: str(formData, "instagram") || null,
    facebook: str(formData, "facebook") || null,
    website: str(formData, "website") || null,
    addressText: str(formData, "address"),
    status,
    hours: str(formData, "hours")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    coordinates: {
      lat: Number.isNaN(lat) ? existing.coordinates.lat : lat,
      lng: Number.isNaN(lng) ? existing.coordinates.lng : lng,
    },
    open: status === "active" ? existing.open : false,
    photoUrl: parsePhotoUrls(str(formData, "photoUrls"))[0] ?? null,
    photoUrls: parsePhotoUrls(str(formData, "photoUrls")),
    keywords: parseKeywords(str(formData, "keywords")),
  });

  refresh();
  redirect(`/admin/shops/${slug}?saved=1`);
}

/** Plain <form> action: stamp last verified now. */
export async function verifyShopAction(formData: FormData): Promise<void> {
  await requireRole("superadmin");
  await verifyShopBySlug(str(formData, "slug"));
  refresh();
}

/** Plain <form> action: approve a pending business so it goes live on the public site. */
export async function approveShopAction(formData: FormData): Promise<void> {
  await requireRole("superadmin");
  await approveShop(str(formData, "slug"));
  refresh();
}

/** Plain <form> action: resolve or reopen a report. */
export async function setReportStatus(formData: FormData): Promise<void> {
  await requireRole("superadmin");
  const id = str(formData, "id");
  const next = str(formData, "next") === "resolved" ? "resolved" : "open";
  const reports = await allReports();
  await saveReports(reports.map((report) => (report.id === id ? { ...report, status: next } : report)));
  refresh();
}

/** Public report-a-problem form (used with useActionState). */
export async function submitReport(_prev: FormState, formData: FormData): Promise<FormState> {
  const body = str(formData, "body");
  if (body.length < 5) return { ok: false, message: "Tell us a little more — what has changed?" };
  const shopName = str(formData, "shopName");
  if (!shopName) return { ok: false, message: "Missing shop reference." };

  const report: ReportItem = {
    id: `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    shopName,
    body,
    phone: str(formData, "phone") || "—",
    status: "open",
    createdAt: new Date().toISOString(),
  };
  const reports = await allReports();
  await saveReports([report, ...reports]);
  refresh();
  return { ok: true, message: "Thanks — your report is in the curator queue." };
}
