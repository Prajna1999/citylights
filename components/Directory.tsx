"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ListBusinessPopup from "@/components/ListBusinessPopup";
import TrinityMark from "@/components/TrinityMark";
import { CATEGORY_ICONS, telHref, type Shop } from "@/lib/types";

function statusText(shop: Shop) {
  if (shop.status === "temporarily_closed") return shop.statusNote || "Temporarily closed";
  if (shop.status === "permanently_closed") return "Permanently closed";
  if (shop.statusNote) return shop.statusNote;
  if (shop.open) return shop.closes ? `Open · closes ${shop.closes}` : "Open now";
  return "Closed · opens tomorrow";
}

function isShut(shop: Shop) {
  return shop.status === "temporarily_closed" || shop.status === "permanently_closed" || !shop.open;
}

function Icon({ name }: { name: "search" | "pin" | "phone" | "whatsapp" | "arrow" | "clock" | "grid" | "map" | "menu" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 5 5" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    phone: <path d="M7.3 4.5 5 6.1c-.7.5-.8 1.5-.5 2.3 2.3 5.8 6 9.5 11.8 11.8.8.3 1.8.1 2.3-.5l1.6-2.3c.4-.6.3-1.4-.2-1.8l-2.5-2c-.5-.4-1.2-.4-1.7 0l-1.4 1.1a15 15 0 0 1-4.1-4.1l1.1-1.4c.4-.5.4-1.2 0-1.7l-2-2.5c-.8-.5-1.6-.6-2.1-.5Z" />,
    whatsapp: <g fill="currentColor" transform="scale(1.5)"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.336-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" /></g>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function WheelMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 2.8v18.4M2.8 12h18.4M5.53 5.53l12.94 12.94M18.47 5.53 5.53 18.47" />
    </svg>
  );
}

const C = 200;
const polar = (r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: +(C + r * Math.cos(rad)).toFixed(2), y: +(C + r * Math.sin(rad)).toFixed(2) };
};
const line = (r1: number, r2: number, deg: number, sw: number, key: string) => {
  const a = polar(r1, deg);
  const b = polar(r2, deg);
  return <line key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />;
};

function KonarkWheel({ className }: { className?: string }) {
  const majors = Array.from({ length: 8 }, (_, i) => i * 45);
  const minors = Array.from({ length: 16 }, (_, i) => i * 22.5 + 11.25);
  const rimBeads = Array.from({ length: 36 }, (_, i) => i * 10);
  const hubDots = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <svg className={className} viewBox="0 0 400 400" fill="none" aria-hidden="true">
      <circle cx={C} cy={C} r="196" stroke="currentColor" strokeWidth="6" />
      <circle cx={C} cy={C} r="188" stroke="currentColor" strokeWidth="1.5" />
      {rimBeads.map((deg) => {
        const p = polar(182, deg);
        return <circle key={`rb${deg}`} cx={p.x} cy={p.y} r="3.6" fill="currentColor" />;
      })}
      <circle cx={C} cy={C} r="172" stroke="currentColor" strokeWidth="3" />
      <circle cx={C} cy={C} r="165" stroke="currentColor" strokeWidth="1" />
      <circle cx={C} cy={C} r="128" stroke="currentColor" strokeWidth="2" />

      {minors.map((deg) => line(48, 124, deg, 2, `m${deg}`))}

      {majors.map((deg) => {
        const mid = polar(104, deg);
        const knop = polar(148, deg);
        const tipA = polar(160, deg - 4.5);
        const tipB = polar(160, deg + 4.5);
        const baseA = polar(40, deg - 7);
        const baseB = polar(40, deg + 7);
        return (
          <g key={`M${deg}`}>
            {line(38, 158, deg, 6, `ml${deg}`)}
            <circle cx={mid.x} cy={mid.y} r="7" fill="currentColor" />
            <circle cx={knop.x} cy={knop.y} r="5.5" fill="currentColor" />
            <polygon points={`${tipA.x},${tipA.y} ${tipB.x},${tipB.y} ${polar(168, deg).x},${polar(168, deg).y}`} fill="currentColor" />
            <polygon points={`${baseA.x},${baseA.y} ${baseB.x},${baseB.y} ${polar(26, deg).x},${polar(26, deg).y}`} fill="currentColor" />
          </g>
        );
      })}

      <circle cx={C} cy={C} r="44" stroke="currentColor" strokeWidth="5" />
      <circle cx={C} cy={C} r="35" stroke="currentColor" strokeWidth="1.5" />
      {hubDots.map((deg) => {
        const p = polar(29.5, deg);
        return <circle key={`hd${deg}`} cx={p.x} cy={p.y} r="1.8" fill="currentColor" />;
      })}
      <circle cx={C} cy={C} r="14" stroke="currentColor" strokeWidth="3" />
      <circle cx={C} cy={C} r="4.5" fill="currentColor" />
    </svg>
  );
}

export default function Directory({ shops }: { shops: Shop[] }) {
  const PER_PAGE = 10;
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All shops");
  const [view, setView] = useState<"list" | "map">("list");
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(1);

  const changeQuery = (value: string) => { setQuery(value); setPage(1); };
  const changeCategory = (label: string) => { setActiveCategory(label); setPage(1); };
  const clearFilters = () => { setQuery(""); setActiveCategory("All shops"); setPage(1); };

  const categories = useMemo(
    () => [["All shops", "⌘", String(shops.length)] as const, ...Object.entries(
      shops.reduce<Record<string, { icon: string; count: number }>>((acc, shop) => {
        const entry = acc[shop.category] || { icon: CATEGORY_ICONS[shop.categoryId] ?? "↗", count: 0 };
        entry.count += 1;
        acc[shop.category] = entry;
        return acc;
      }, {}),
    ).map(([name, meta]) => [name, meta.icon, String(meta.count)] as const)],
    [shops],
  );

  const filteredShops = useMemo(() => shops.filter((shop) => {
    const matchesCategory = activeCategory === "All shops" || shop.category === activeCategory;
    const normalized = query.toLowerCase();
    const haystack = `${shop.name} ${shop.local} ${shop.category} ${shop.area} ${shop.owner ?? ""} ${(shop.keywords ?? []).join(" ")}`;
    return matchesCategory && (!normalized || haystack.toLowerCase().includes(normalized));
  }), [shops, activeCategory, query]);

  const totalPages = Math.max(1, Math.ceil(filteredShops.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagedShops = filteredShops.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#top" aria-label="Haat home"><TrinityMark className="trinity-mark brand-trinity" /><span>haat<span className="brand-dot">.</span></span></a>
          <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
            <a className="active" href="#browse">Browse</a>
            <a href="#how">How it works</a>
            <a href="#about">About Haat</a>
          </nav>
          <div className="header-actions"><button className="location-pill" type="button"><Icon name="pin" /> Bhadrak, Odisha <span className="chevron">⌄</span></button><button className="menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Icon name="menu" /></button></div>
        </div>
      </header>

      <main className="site-shell">
      <KonarkWheel className="bg-wheel" />
      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow"><span className="live-dot" /> Your local shop directory</p><h1>Everything you need,<br /><em>right around here.</em></h1><p className="hero-intro">A simple, reliable guide to the shops and people that make Bhadrak home.</p></div>
        <div className="hero-note"><span><span className="odia">ଭଦ୍ରକ</span> · ODISHA</span><p>From Kacheri Bazar to Charampa, find the familiar faces and useful places around town.</p><a href="#browse">Explore the directory <Icon name="arrow" /></a></div>
      </section>

      <section className="directory" id="browse">
        <div className="section-heading"><div><p className="eyebrow">The directory</p><h2>Find what you need.</h2></div><div className="view-toggle" role="group" aria-label="Change view"><button className={view === "list" ? "selected" : ""} onClick={() => setView("list")}><Icon name="grid" /> List</button><button className={view === "map" ? "selected" : ""} onClick={() => setView("map")}><Icon name="map" /> Map</button></div></div>
        <form className="search-row" onSubmit={(event) => event.preventDefault()} role="search"><label className="search-box"><Icon name="search" /><input value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Search shops, categories or names" aria-label="Search shops" /></label><noscript><button type="submit">Search</button></noscript></form>
        <div className="category-list">{categories.map(([label, icon, count]) => <button key={label} className={activeCategory === label ? "category active" : "category"} onClick={() => changeCategory(label)}><span className="category-icon">{icon}</span><span>{label}</span><small>{count}</small></button>)}</div>

        {view === "list" ? <div className="results-layout"><div className="results-column"><div className="results-header"><span>{filteredShops.length} places near you</span><span className="page-count">Page {safePage} of {totalPages}</span></div><div className="shop-list">{pagedShops.map((shop) => <article className="shop-card" key={shop.slug}><div className={`shop-thumb ${shop.color}`}>{shop.photoUrl ? <Image src={shop.photoUrl} alt="" fill sizes="150px" className="thumb-photo" /> : <span className="thumb-fallback">{shop.category}</span>}<i /></div><Link href={`/stores/${shop.slug}`} className="shop-info shop-link"><div className="shop-title"><div><h3>{shop.name}</h3><p className="local-name">{shop.local}</p></div><span className={isShut(shop) ? "status closed" : "status open"}><i />{statusText(shop)}</span></div><p className="shop-description">{shop.description}</p><div className="shop-meta"><span>{shop.category}</span><span>{shop.area}</span>{shop.distance ? <span>{shop.distance}</span> : null}</div></Link><div className="shop-actions">{shop.phone ? <a href={telHref(shop.phone) ?? "#"} className="call-button" aria-label={`Call ${shop.name}`}><Icon name="phone" /></a> : <span className="call-button disabled" title="No number listed"><Icon name="phone" /></span>}{shop.whatsapp ? <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="whatsapp-button" aria-label={`WhatsApp ${shop.name}`}><Icon name="whatsapp" /></a> : <span className="whatsapp-button disabled" title="No WhatsApp listed"><Icon name="whatsapp" /></span>}</div></article>)}</div>{filteredShops.length === 0 && <div className="empty-state"><WheelMark className="empty-wheel" />No shops match that search.<button onClick={clearFilters}>Clear search</button></div>}{totalPages > 1 && <nav className="pagination" aria-label="Pages of results"><button className="page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>← Prev</button><span className="page-status">Showing {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filteredShops.length)} of {filteredShops.length}</span><button className="page-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next →</button></nav>}</div></div> : <MapPreview shops={filteredShops} large />}
      </section>

      <div className="jhoti-band" aria-hidden="true" />
      <section className="trust-strip" id="how"><div className="trust-badge"><WheelMark /></div><div><p className="eyebrow">A note from the team</p><h2>Built for the way Bhadrak actually works.</h2></div><p>Every listing carries its source and verification date. See something that has changed? Tell us, and we&apos;ll make it right.</p><a href="#about">How Haat stays accurate <Icon name="arrow" /></a></section>
      <div className="jhoti-band" aria-hidden="true" />
      <footer id="about"><div className="footer-brand"><a className="brand" href="#top"><span className="brand-mark">ହ</span><span>haat<span className="brand-dot">.</span></span></a><p>Useful, nearby, and kept honest.<br /><span className="odia">ଆମ ଭଦ୍ରକ</span> — our own Bhadrak.</p><TrinityMark className="trinity-mark" /></div><div className="footer-links"><Link href="/#browse">Browse shops</Link><Link href="/#how">How it works</Link><a href="mailto:hello@haat.local">Suggest a shop</a><Link href="/#about">Report a problem</Link></div><div className="footer-side"><p className="footer-note">Bhadrak, Odisha<br />Coordinates 21.06° N, 86.50° E</p><p className="footer-admin">Team · <Link href="/admin">Curator panel</Link></p></div></footer>
      </main>
      <ListBusinessPopup />
    </>
  );
}

function MapPreview({ shops, large = false }: { shops: Shop[]; large?: boolean }) {
  const S = 20.9, N = 21.32, W = 86.44, E = 86.75;
  const pin = (shop: Shop) => {
    const lat = Math.min(Math.max(shop.coordinates.lat, S), N);
    const lng = Math.min(Math.max(shop.coordinates.lng, W), E);
    return { top: `${(((N - lat) / (N - S)) * 100).toFixed(1)}%`, left: `${(((lng - W) / (E - W)) * 100).toFixed(1)}%` };
  };
  return <aside className={`map-preview ${large ? "large" : ""}`} aria-label="Map of establishments in Bhadrak"><div className="map-label"><Icon name="pin" /> Bhadrak district · <span className="odia">ଭଦ୍ରକ</span></div><div className="road road-a" /><div className="road road-b" /><div className="road road-c" /><div className="water" /><span className="map-place river">Salandi river</span><span className="map-place p1">Kacheri Bazar</span><span className="map-place p2">Charampa</span><span className="map-place p3">Nuabazar</span>{shops.map((shop) => <Link key={shop.slug} href={`/stores/${shop.slug}`} className="map-pin-dot" style={pin(shop)} aria-label={shop.name} title={shop.name} />)}<div className="map-card"><span>{shops.length} establishments mapped</span><strong>Schematic map · pins approximate</strong></div></aside>;
}
