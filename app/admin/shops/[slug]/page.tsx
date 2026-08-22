import Link from "next/link";
import { notFound } from "next/navigation";
import { updateShopAction, verifyShopAction } from "@/lib/actions";
import { CATEGORIES, getShop } from "@/lib/db";
import { daysSince, formatDate, statusLabel, telHref } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = [
  { value: "active", label: "Active — open and reachable" },
  { value: "temporarily_closed", label: "Temporarily closed" },
  { value: "permanently_closed", label: "Permanently closed (never delete)" },
];

export default async function EditShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const resolved = await searchParams;
  const shop = getShop(slug);
  if (!shop) notFound();

  const saved = resolved.saved === "1";
  const error = typeof resolved.error === "string" ? resolved.error : "";

  return (
    <div>
      <div className="admin-head">
        <p className="crumbs"><Link href="/admin/shops">← Registry</Link></p>
        <h1>{shop.name}</h1>
        <p>{shop.category} · {shop.area || "area unknown"} · added via {shop.source}</p>
      </div>

      {saved && <div className="flash success">✓ Saved. The public site is already up to date.</div>}
      {error && <div className="flash error" role="alert">{error}</div>}

      <div className="editor-side">
        <form action={verifyShopAction}>
          <input type="hidden" name="slug" value={shop.slug} />
          <button className="admin-btn success" type="submit">
            {shop.lastVerifiedAt ? `✓ Re-verify now (last ${daysSince(shop.lastVerifiedAt)}d ago)` : "✓ Verify now"}
          </button>
        </form>
        <span className="badge neutral">{statusLabel(shop)}</span>
        {shop.lastVerifiedAt ? <small className="side-note">Last verified {formatDate(shop.lastVerifiedAt)}</small> : <small className="side-note">Never verified</small>}
        {shop.phone ? <a className="side-note" href={telHref(shop.phone) ?? "#"}>Call {shop.phone} ↗</a> : null}
        <Link className="side-note" href={`/stores/${shop.slug}`}>View public page ↗</Link>
      </div>

      <form action={updateShopAction} className="editor-form">
        <input type="hidden" name="slug" value={shop.slug} />

        <fieldset className="field-group">
          <legend>Identity</legend>
          <div className="field"><label htmlFor="f-name">Shop name</label><input id="f-name" name="name" defaultValue={shop.name} required autoComplete="off" /></div>
          <div className="field-row">
            <div className="field"><label htmlFor="f-local">Local name (Odia)</label><input id="f-local" name="local" defaultValue={shop.local} autoComplete="off" /></div>
            <div className="field"><label htmlFor="f-owner">Owner</label><input id="f-owner" name="owner" defaultValue={shop.owner ?? ""} autoComplete="off" /></div>
          </div>
          <div className="field-row">
            <div className="field"><label htmlFor="f-category">Category</label>
              <select id="f-category" name="categoryId" defaultValue={shop.categoryId}>
                {CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="f-status">Status</label>
              <select id="f-status" name="status" defaultValue={shop.status ?? "active"}>
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>
          <div className="field"><label htmlFor="f-description">Description</label><textarea id="f-description" name="description" rows={3} defaultValue={shop.description} /></div>
        </fieldset>

        <fieldset className="field-group">
          <legend>Contact</legend>
          <div className="field-row">
            <div className="field"><label htmlFor="f-phone">Phone</label><input id="f-phone" name="phone" inputMode="tel" defaultValue={shop.phone ?? ""} placeholder="e.g. 98765 43210" autoComplete="off" /></div>
            <div className="field"><label htmlFor="f-whatsapp">WhatsApp</label><input id="f-whatsapp" name="whatsapp" inputMode="tel" defaultValue={shop.whatsapp ?? ""} placeholder="Often differs from phone" autoComplete="off" /></div>
          </div>
        </fieldset>

        <fieldset className="field-group">
          <legend>Where</legend>
          <div className="field-row">
            <div className="field"><label htmlFor="f-area">Area</label><input id="f-area" name="area" defaultValue={shop.area} placeholder="e.g. Kacheri Bazar" autoComplete="off" /></div>
            <div className="field"><label htmlFor="f-landmark">Landmark</label><input id="f-landmark" name="landmark" defaultValue={shop.landmark ?? ""} placeholder="Near Hanuman temple" autoComplete="off" /></div>
          </div>
          <div className="field"><label htmlFor="f-address">Address line</label><input id="f-address" name="address" defaultValue={shop.addressText} autoComplete="off" /></div>
          <div className="field-row">
            <div className="field"><label htmlFor="f-lat">Latitude</label><input id="f-lat" name="lat" inputMode="decimal" defaultValue={String(shop.coordinates.lat)} /></div>
            <div className="field"><label htmlFor="f-lng">Longitude</label><input id="f-lng" name="lng" inputMode="decimal" defaultValue={String(shop.coordinates.lng)} /></div>
          </div>
        </fieldset>

        <fieldset className="field-group">
          <legend>Timings · one line per entry</legend>
          <div className="field"><label htmlFor="f-hours">Opening hours</label><textarea id="f-hours" name="hours" rows={5} defaultValue={shop.hours.join("\n")} placeholder={"Mon–Sat: 9 AM – 8 PM\nSunday: Closed"} /><p className="hint">Leave empty if unknown. Written exactly as townsfolk should see it.</p></div>
        </fieldset>

        <div className="wizard-actions">
          <Link className="admin-btn ghost" href="/admin/shops">Cancel</Link>
          <div className="spacer" />
          <button className="admin-btn primary" type="submit">Save changes</button>
        </div>
        <p className="save-note">Saving updates the registry file immediately; the public pages refresh on the next visit.</p>
      </form>
    </div>
  );
}
