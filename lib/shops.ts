import { getShop, visibleShops } from "@/lib/db";
import { CATEGORY_ICONS, type Shop } from "@/lib/types";

export type { Product, Shop } from "@/lib/types";
export { telHref } from "@/lib/types";

export async function shops(): Promise<Shop[]> {
  return visibleShops();
}

export { getShop };

export async function shopCategories(shopsList?: Shop[]) {
  const list = shopsList ?? (await visibleShops());
  return Object.entries(
    list.reduce<Record<string, { icon: string; count: number }>>((acc, shop) => {
      const entry = acc[shop.category] || { icon: CATEGORY_ICONS[shop.categoryId] ?? "↗", count: 0 };
      entry.count += 1;
      acc[shop.category] = entry;
      return acc;
    }, {}),
  ).map(([name, meta]) => ({ name, icon: meta.icon, count: meta.count }));
}
