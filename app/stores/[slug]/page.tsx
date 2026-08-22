import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReportForm from "@/components/ReportForm";
import { getShop, shops, telHref } from "@/lib/shops";

export async function generateStaticParams() {
  return (await shops()).map((shop) => ({ slug: shop.slug }));
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShop(slug);
  if (!shop) notFound();

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

  return (
    <main className="store-page">
      <header className="store-topbar"><Link className="brand" href="/"><span className="brand-mark">ହ</span><span>haat<span className="brand-dot">.</span></span></Link><Link className="back-link" href="/"><span>←</span> Back to directory</Link><span className="store-location">Bhadrak, Odisha</span></header>
      <div className="store-content">
        <div className="store-breadcrumb"><Link href="/">Directory</Link><span>/</span><span>{shop.category}</span><span>/</span><strong>{shop.name}</strong></div>
        <section className="store-hero">
          <div className={`store-gallery ${shop.color}`}>{shop.photoUrl ? <div className="gallery-main photo"><Image src={shop.photoUrl} alt={`Storefront of ${shop.name}`} fill sizes="(max-width: 720px) 100vw, 480px" priority className="gallery-photo" /><span className="gallery-caption">Storefront photo</span></div> : <div className="gallery-main"><span className="gallery-shape shape-one" /><span className="gallery-shape shape-two" /><strong>{shop.initials}</strong><small>Storefront photo<br />mock image</small></div>}<div className="gallery-side"><div className="gallery-detail"><span>✦</span><small>Inside the<br />shop</small></div><div className="gallery-detail second"><span>＋</span><small>Products<br />in stock</small></div></div>{shop.photoUrl ? null : <span className="gallery-caption">Images are illustrative mockups</span>}</div>
          <div className="store-intro"><p className="eyebrow">{shop.category} · {shop.area}</p><h1>{shop.name}</h1>{shop.local ? <p className="store-local">{shop.local}</p> : null}<div className="store-status"><span className={status.closed ? "status closed" : "status open"}><i />{status.text}</span><span className="verified">{shop.verified ? `✓ Verified ${shop.verified}` : "⏳ Awaiting verification"}</span></div><p className="store-description">{shop.description}</p><div className="store-actions">{shop.phone && !status.closed ? <a className="primary-action" href={telHref(shop.phone) ?? "#"}>Call store <span>↗</span></a> : <span className={shop.phone ? "primary-action disabled" : "primary-action disabled"}>{shop.phone ? "Calling paused" : "No number yet"}</span>}{shop.whatsapp && !status.closed ? <a className="secondary-action" href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp <span>↗</span></a> : null}</div>{shop.owner ? <p className="response-note">Owner: {shop.owner}</p> : null}</div>
        </section>
        <section className="store-body"><div className="catalog-section"><div className="store-section-head"><div><p className="eyebrow">What you&apos;ll find</p><h2>Product catalogue</h2></div><span>{shop.products.length} sample items</span></div><p className="catalog-note">A quick look at the everyday things available here. Stock and prices may change.</p><div className="product-grid">{shop.products.map((product) => <article className={`product-card ${product.tone}`} key={product.name}><div className="product-art"><span /></div><div className="product-copy"><h3>{product.name}</h3><p>{product.detail}</p><strong>{product.price}</strong></div></article>)}</div></div><aside className="store-aside"><div className="aside-block"><p className="eyebrow">Visit the shop</p><h3>Find us near<br /><em>{shop.area}</em></h3><div className="mini-map"><span className="mini-road one" /><span className="mini-road two" /><span className="mini-pin">●</span><small>{shop.coordinates.lat.toFixed(4)}, {shop.coordinates.lng.toFixed(4)}</small></div><p className="address"><span>⌖</span> {address}{shop.landmark ? <><br /><small>Near {shop.landmark}</small></> : <><br /><small>{shop.distance} from the town centre</small></>}</p><a className="directions" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`} target="_blank" rel="noreferrer">Get directions <span>↗</span></a></div><div className="aside-block hours"><p className="eyebrow">Opening hours</p>{shop.hours.length ? shop.hours.map((line, index) => <p key={`${line}-${index}`}>{line}</p>) : <p className="no-hours">Hours not listed yet</p>}</div><ReportForm shopName={shop.name} /></aside></section>
        <div className="jhoti-band" aria-hidden="true" />
        <div className="store-footer"><Link href="/">← Browse more shops</Link><span>{shop.source}</span><Link className="footer-admin" href="/admin">Curator panel</Link></div>
      </div>
    </main>
  );
}
