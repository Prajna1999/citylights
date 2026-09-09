import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BookedDatesEditor from "@/components/BookedDatesEditor";
import { updateShopAction, verifyShopAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { CATEGORIES, getShop } from "@/lib/db";
import { daysSince, EVENT_CATEGORY_IDS, formatDate, shopPhotos, statusLabel, telHref } from "@/lib/types";

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
  const user = await requireUser();
  const { slug } = await params;
  const resolved = await searchParams;
  const shop = await getShop(slug);
  if (!shop) notFound();
  if (user.role !== "superadmin" && shop.ownerId !== user.id) redirect("/admin");

  const saved = resolved.saved === "1";
  const error = typeof resolved.error === "string" ? resolved.error : "";
  const isSuperadmin = user.role === "superadmin";
  const backHref = isSuperadmin ? "/admin/shops" : "/admin/my-businesses";

  return (
    <div>
      <div className="admin-head">
        <p className="crumbs"><Link href={backHref}>← Back</Link></p>
        <h1>{shop.name}</h1>
        <p>{shop.category} · {shop.area || "area unknown"} · added via {shop.source}</p>
      </div>

      {saved && <div className="flash success">✓ Saved. The public site is already up to date.</div>}
      {error && <div className="flash error" role="alert">{error}</div>}

      <div className="editor-side">
        {isSuperadmin ? (
          <form action={verifyShopAction}>
            <input type="hidden" name="slug" value={shop.slug} />
            <button className="admin-btn success" type="submit">
              {shop.lastVerifiedAt ? `✓ Re-verify now (last ${daysSince(shop.lastVerifiedAt)}d ago)` : "✓ Verify now"}
            </button>
          </form>
        ) : (
          <span className={shop.approvalStatus === "pending" ? "badge open" : "badge resolved"}>
            {shop.approvalStatus === "pending" ? "Pending approval" : "Live"}
          </span>
        )}
        <span className="badge neutral">{statusLabel(shop)}</span>
        {shop.lastVerifiedAt ? <small className="side-note">Last verified {formatDate(shop.lastVerifiedAt)}</small> : <small className="side-note">Never verified</small>}
        {shop.phone ? <a className="side-note" href={telHref(shop.phone) ?? "#"}>Call {shop.phone} ↗</a> : null}
        {(shop.approvalStatus !== "pending" || isSuperadmin) && <Link className="side-note" href={`/stores/${shop.slug}`}>View public page ↗</Link>}
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
          <div className="field"><label htmlFor="f-keywords">Search keywords</label><input id="f-keywords" name="keywords" defaultValue={(shop.keywords ?? []).join(", ")} placeholder="e.g. plumber, pipe repair, tap fitting" autoComplete="off" /><p className="hint">Comma-separated words customers might search for — helps this listing get more calls.</p></div>
          <div className="field"><label htmlFor="f-photo">Photo URLs <span className="optional">Cloudinary · up to 3, one per line</span></label><textarea id="f-photo" name="photoUrls" rows={3} defaultValue={shopPhotos(shop).join("\n")} placeholder="https://res.cloudinary.com/…" /></div>
        </fieldset>

        <fieldset className="field-group">
          <legend>Contact</legend>
          <div className="field-row">
            <div className="field"><label htmlFor="f-phone">Phone</label><input id="f-phone" name="phone" inputMode="tel" defaultValue={shop.phone ?? ""} placeholder="e.g. 98765 43210" autoComplete="off" /></div>
            <div className="field"><label htmlFor="f-whatsapp">WhatsApp</label><input id="f-whatsapp" name="whatsapp" inputMode="tel" defaultValue={shop.whatsapp ?? ""} placeholder="Often differs from phone" autoComplete="off" /></div>
          </div>
          <div className="field-row">
            <div className="field"><label htmlFor="f-instagram">Instagram <span className="optional">optional</span></label><input id="f-instagram" name="instagram" defaultValue={shop.instagram ?? ""} placeholder="https://instagram.com/yourshop" autoComplete="off" /></div>
            <div className="field"><label htmlFor="f-facebook">Facebook <span className="optional">optional</span></label><input id="f-facebook" name="facebook" defaultValue={shop.facebook ?? ""} placeholder="https://facebook.com/yourshop" autoComplete="off" /></div>
            <div className="field"><label htmlFor="f-website">Website <span className="optional">optional</span></label><input id="f-website" name="website" defaultValue={shop.website ?? ""} placeholder="https://yourshop.com" autoComplete="off" /></div>
          </div>
          {(EVENT_CATEGORY_IDS as readonly string[]).includes(shop.categoryId) && (
            <>
              <label className="checkbox-field">
                <input type="checkbox" name="offlineBooking" defaultChecked={shop.offlineBooking ?? false} />
                This business only takes bookings offline (phone/in-person) — hides the event-date option on its public page entirely.
              </label>
              <div className="field">
                <label>Dates already booked</label>
                <p className="hint">Mark any dates you already have a booking for — customers checking your page will see those dates as unavailable.</p>
                <BookedDatesEditor name="bookedDates" initialDates={shop.bookedDates ?? []} />
              </div>
            </>
          )}
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
          <Link className="admin-btn ghost" href={backHref}>Cancel</Link>
          <div className="spacer" />
          <button className="admin-btn primary" type="submit">Save changes</button>
        </div>
        <p className="save-note">Saving updates the registry file immediately; the public pages refresh on the next visit.</p>
      </form>
    </div>
  );
}
