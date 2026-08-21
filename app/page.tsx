"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { shops, shopCategories, telHref, type Shop } from "@/lib/shops";

const categories = [["All shops", "⌘", String(shops.length)] as const, ...shopCategories.map((category) => [category.name, category.icon, String(category.count)] as const)];

function statusText(shop: Shop) {
  if (shop.statusNote) return shop.statusNote;
  if (shop.open) return shop.closes ? `Open · closes ${shop.closes}` : "Open now";
  return "Closed · opens tomorrow";
}

function Icon({ name }: { name: "search" | "pin" | "phone" | "arrow" | "clock" | "grid" | "map" | "menu" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 5 5" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    phone: <path d="M7.3 4.5 5 6.1c-.7.5-.8 1.5-.5 2.3 2.3 5.8 6 9.5 11.8 11.8.8.3 1.8.1 2.3-.5l1.6-2.3c.4-.6.3-1.4-.2-1.8l-2.5-2c-.5-.4-1.2-.4-1.7 0l-1.4 1.1a15 15 0 0 1-4.1-4.1l1.1-1.4c.4-.5.4-1.2 0-1.7l-2-2.5c-.8-.5-1.6-.6-2.1-.5Z" />,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All shops");
  const [view, setView] = useState<"list" | "map">("list");
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredShops = useMemo(() => shops.filter((shop) => {
    const matchesCategory = activeCategory === "All shops" || shop.category === activeCategory;
    const normalized = query.toLowerCase();
    return matchesCategory && (!normalized || `${shop.name} ${shop.local} ${shop.category} ${shop.area}`.toLowerCase().includes(normalized));
  }), [activeCategory, query]);

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Haat home"><span className="brand-mark">H</span><span>haat<span className="brand-dot">.</span></span></a>
        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
          <a className="active" href="#browse">Browse</a>
          <a href="#how">How it works</a>
          <a href="#about">About Haat</a>
        </nav>
        <div className="header-actions"><button className="location-pill" type="button"><Icon name="pin" /> Bhadrak, Odisha <span className="chevron">⌄</span></button><button className="menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Icon name="menu" /></button></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow"><span className="live-dot" /> Your local shop directory</p><h1>Everything you need,<br /><em>right around here.</em></h1><p className="hero-intro">A simple, reliable guide to the shops and people that make Bhadrak home.</p></div>
        <div className="hero-note"><span>BHADRAK / ODISHA</span><p>From Kacheri Bazar to Charampa, find the familiar faces and useful places around town.</p><a href="#browse">Explore the directory <Icon name="arrow" /></a></div>
      </section>

      <section className="directory" id="browse">
        <div className="section-heading"><div><p className="eyebrow">The directory</p><h2>Find what you need.</h2></div><div className="view-toggle" role="group" aria-label="Change view"><button className={view === "list" ? "selected" : ""} onClick={() => setView("list")}><Icon name="grid" /> List</button><button className={view === "map" ? "selected" : ""} onClick={() => setView("map")}><Icon name="map" /> Map</button></div></div>
        <div className="search-row"><label className="search-box"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shops, categories or names" /><kbd>⌘ K</kbd></label><button className="filter-button" type="button">Filter <span>+3</span></button></div>
        <div className="category-list">{categories.map(([label, icon, count]) => <button key={label} className={activeCategory === label ? "category active" : "category"} onClick={() => setActiveCategory(label)}><span className="category-icon">{icon}</span><span>{label}</span><small>{count}</small></button>)}</div>

        {view === "list" ? <div className="results-layout"><div className="results-column"><div className="results-header"><span>{filteredShops.length} places near you</span><button type="button">Nearest first <span>⌄</span></button></div><div className="shop-list">{filteredShops.map((shop) => <article className="shop-card" key={shop.slug}><div className={`shop-thumb ${shop.color}`}><span>{shop.initials}</span><i /></div><Link href={`/stores/${shop.slug}`} className="shop-info shop-link"><div className="shop-title"><div><h3>{shop.name}</h3><p className="local-name">{shop.local}</p></div><span className={shop.open ? "status open" : "status closed"}><i />{statusText(shop)}</span></div><p className="shop-description">{shop.description}</p><div className="shop-meta"><span>{shop.category}</span><span>{shop.area}</span><span>{shop.distance}</span></div></Link>{shop.phone ? <a href={telHref(shop.phone) ?? "#"} className="call-button" aria-label={`Call ${shop.name}`}><Icon name="phone" /></a> : <span className="call-button disabled" title="No number listed"><Icon name="phone" /></span>}</article>)}</div>{filteredShops.length === 0 && <div className="empty-state">No shops match that search.<button onClick={() => { setQuery(""); setActiveCategory("All shops"); }}>Clear search</button></div>}</div><MapPreview shops={filteredShops} /></div> : <MapPreview shops={filteredShops} large />}
      </section>

      <section className="trust-strip" id="how"><div className="trust-badge">✓</div><div><p className="eyebrow">A note from the team</p><h2>Built for the way Bhadrak actually works.</h2></div><p>Every listing is checked by our local team. See something that has changed? Tell us, and we&apos;ll make it right.</p><a href="#about">How Haat stays accurate <Icon name="arrow" /></a></section>
      <footer id="about"><div className="footer-brand"><a className="brand" href="#top"><span className="brand-mark">H</span><span>haat<span className="brand-dot">.</span></span></a><p>Useful, nearby, and kept honest.<br />Made for Bhadrak.</p></div><div className="footer-links"><a href="#browse">Browse shops</a><a href="#how">How it works</a><a href="mailto:hello@haat.local">Suggest a shop</a><a href="#about">Report a problem</a></div><p className="footer-note">Mock directory · Bhadrak, Odisha<br />Coordinates 21.06° N, 86.50° E</p></footer>
    </main>
  );
}

function MapPreview({ shops, large = false }: { shops: Shop[]; large?: boolean }) {
  const S = 21.04, N = 21.09, W = 86.47, E = 86.54;
  const pin = (shop: Shop) => {
    const lat = Math.min(Math.max(shop.coordinates.lat, S), N);
    const lng = Math.min(Math.max(shop.coordinates.lng, W), E);
    return { top: `${(((N - lat) / (N - S)) * 100).toFixed(1)}%`, left: `${(((lng - W) / (E - W)) * 100).toFixed(1)}%` };
  };
  return <aside className={`map-preview ${large ? "large" : ""}`} aria-label="Map of establishments in Bhadrak"><div className="map-label"><Icon name="pin" /> Bhadrak town</div><div className="road road-a" /><div className="road road-b" /><div className="road road-c" /><div className="water" /><span className="map-place p1">Kacheri Bazar</span><span className="map-place p2">Charampa</span><span className="map-place p3">Nuabazar</span>{shops.map((shop) => <Link key={shop.slug} href={`/stores/${shop.slug}`} className="map-pin-dot" style={pin(shop)} aria-label={shop.name} title={shop.name} />)}<div className="map-card"><span>{shops.length} establishments mapped</span><strong>Explore on map <Icon name="arrow" /></strong></div></aside>;
}
