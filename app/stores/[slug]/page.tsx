import Link from "next/link";
import { notFound } from "next/navigation";
import EventAvailability from "@/components/EventAvailability";
import PhotoCarousel from "@/components/PhotoCarousel";
import ReportForm from "@/components/ReportForm";
import { getCurrentUser } from "@/lib/auth";
import { getShop, telHref } from "@/lib/shops";
import { shopPhotos, takesEventDateBookings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShop(slug);
  if (!shop) notFound();
  if (shop.approvalStatus === "pending") {
    const viewer = await getCurrentUser();
    const canPreview = viewer && (viewer.role === "superadmin" || viewer.id === shop.ownerId);
    if (!canPreview) notFound();
  }

  const shut = shop.status === "temporarily_closed" || shop.status === "permanently_closed" || !shop.open;
  const status = {
    closed: shop.status === "temporarily_closed" || shop.status === "permanently_closed",
    text:
      shop.status === "temporarily_closed"
        ? shop.statusNote || "Temporarily closed"
        : shop.status === "permanently_closed"
          ? "Permanently closed"
          : shut
            ? "Closed · opens tomorrow"
            : shop.closes
              ? `Open · closes ${shop.closes}`
              : "Open now",
  };
  const address = shop.addressText || `${shop.area}, Bhadrak, Odisha`;
  const mapsQuery = `${shop.name}, ${shop.area}, Bhadrak, Odisha`;
  const showAvailability = !status.closed && takesEventDateBookings(shop);

  return (
    <main className="store-page">
      <header className="store-topbar"><Link className="brand" href="/"><span className="brand-mark">ହ</span><span>haat<span className="brand-dot">.</span></span></Link><Link className="back-link" href="/"><span>←</span> Back to directory</Link><span className="store-location">Bhadrak, Odisha</span></header>
      <div className="store-content">
        <div className="store-breadcrumb"><Link href="/">Directory</Link><span>/</span><span>{shop.category}</span><span>/</span><strong>{shop.name}</strong></div>
        <section className="store-hero">
          <PhotoCarousel photos={shopPhotos(shop)} shopName={shop.name} color={shop.color} category={shop.category} />
          <div className="store-intro"><p className="eyebrow">{shop.category} · {shop.area}</p><h1>{shop.name}</h1>{shop.local ? <p className="store-local">{shop.local}</p> : null}<div className="store-status"><span className={status.closed ? "status closed" : "status open"}><i />{status.text}</span><span className="verified">{shop.verified ? `✓ Verified ${shop.verified}` : "⏳ Awaiting verification"}</span></div><p className="store-description">{shop.description}</p><div className="store-actions">{shop.phone && !status.closed ? <a className="primary-action" href={telHref(shop.phone) ?? "#"}>Call store <span>↗</span></a> : <span className="primary-action disabled">{shop.phone ? "Calling paused" : "No number yet"}</span>}{shop.whatsapp && !status.closed ? <a className="secondary-action" href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp <span>↗</span></a> : <span className="secondary-action disabled">{shop.whatsapp ? "WhatsApp paused" : "No WhatsApp yet"}</span>}</div>{(shop.instagram || shop.facebook || shop.website) ? <div className="social-links">{shop.instagram ? <a href={shop.instagram} target="_blank" rel="noreferrer">Instagram <span>↗</span></a> : null}{shop.facebook ? <a href={shop.facebook} target="_blank" rel="noreferrer">Facebook <span>↗</span></a> : null}{shop.website ? <a href={shop.website} target="_blank" rel="noreferrer">Website <span>↗</span></a> : null}</div> : null}{shop.owner ? <p className="response-note">Owner: {shop.owner}</p> : null}</div>
        </section>
        <section className="store-body">{showAvailability ? (
          <div className="catalog-section"><div className="store-section-head"><div><p className="eyebrow">Check availability</p><h2>Booking calendar</h2></div></div><p className="catalog-note">Tap an available date below to ask {shop.name} about it — dates already booked are marked and can&apos;t be selected.</p><EventAvailability shopName={shop.name} whatsapp={shop.whatsapp} bookedDates={shop.bookedDates ?? []} /></div>
        ) : (
          <div className="catalog-section"><div className="store-section-head"><div><p className="eyebrow">What you&apos;ll find</p><h2>Product catalogue</h2></div><span>{shop.products.length} sample items</span></div><p className="catalog-note">A quick look at the everyday things available here. Stock and prices may change.</p><div className="product-grid">{shop.products.map((product) => <article className={`product-card ${product.tone}`} key={product.name}><div className="product-art"><span /></div><div className="product-copy"><h3>{product.name}</h3><p>{product.detail}</p><strong>{product.price}</strong></div></article>)}</div></div>
        )}<aside className="store-aside"><div className="aside-block"><p className="eyebrow">Visit the shop</p><h3>Find us near<br /><em>{shop.area}</em></h3><div className="mini-map"><span className="mini-road one" /><span className="mini-road two" /><span className="mini-pin">●</span><small>{shop.coordinates.lat.toFixed(4)}, {shop.coordinates.lng.toFixed(4)}</small></div><p className="address"><span>⌖</span> {address}{shop.landmark ? <><br /><small>Near {shop.landmark}</small></> : <><br /><small>{shop.distance} from the town centre</small></>}</p><a className="directions" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`} target="_blank" rel="noreferrer">Get directions <span>↗</span></a></div><div className="aside-block hours"><p className="eyebrow">Opening hours</p>{shop.hours.length ? shop.hours.map((line, index) => <p key={`${line}-${index}`}>{line}</p>) : <p className="no-hours">Hours not listed yet</p>}</div><ReportForm shopName={shop.name} /></aside></section>
        <div className="jhoti-band" aria-hidden="true" />
        <div className="store-footer"><Link href="/">← Browse more shops</Link><span>{shop.source}</span><Link className="footer-admin" href="/admin">Curator panel</Link></div>
      </div>
    </main>
  );
}
