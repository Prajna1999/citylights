# PRD — Town Shop Registry (v1)

**Status:** Draft
**Scope:** One town. Read-only for the public. Team-curated.
**Explicit non-goal:** transactions, delivery, chat, feed, social.

---

## 1. Problem

Townsfolk have no reliable, structured answer to *"who sells X, where are they, are they open, how do I reach them?"* Today this lives in memory, word of mouth, and expired WhatsApp Status posts. Memory is stale and unqueryable.

## 2. What v1 is

A trustworthy, complete, browsable registry of every shop in the town — with pictures and a map — maintained by a small internal team.

**It is a phone book with photos and a map.** That is the whole product. Its only competitive claim is *accuracy*.

## 3. Success criteria

Ship-blocking targets, measured 8 weeks post-launch:

| Metric | Target | Why |
|---|---|---|
| Shop coverage | ≥ 90% of town's shops | Below this, users hit gaps and stop trusting it |
| Records verified in last 90 days | 100% | Staleness is the only way this dies |
| Median time to add a shop (admin) | ≤ 90 sec | Determines whether coverage is reachable |
| Repeat visitors / month | ≥ 15% of registered users | Honest read on whether a directory retains |

That last one is deliberately low. A pure directory should not be expected to retain. If it comes in near zero, that is the signal to build the activity layer, not a failure of execution.

## 4. Users

**Townsperson (consumer).** No account. Opens the app when they need something. Success = found the shop and called it within 60 seconds.

**Curator (internal).** Adds and re-verifies shops. Success = adds a shop in under 90 seconds, standing on a footpath, on a mid-range Android phone, on 4G.

**Shopkeeper.** *Not a user in v1.* No login, no dashboard, no self-serve. They are the subject of a record, not an operator of one.

## 5. Scope

### In

- Browse shops by category
- Search by shop name, category, owner name
- Shop detail page: name, category, description, photos, timings, phone, WhatsApp, address, map pin
- Tap-to-call / tap-to-WhatsApp
- Map view of all shops
- "Open now" computed from timings
- Report-a-problem (one tap, free text) on every shop page
- Admin panel: full CRUD, photo upload, map pin drop, verification queue

### Out (v1)

Ratings and reviews · offers and stock · shopkeeper login · user accounts · comments · feed · orders · payments · delivery · multi-town · notifications · WhatsApp integration

### Deferred, decision pending

**Ratings.** Cut from v1 deliberately. With no accounts, ratings are trivially gameable; in a town of a few thousand, a 2-star average is a personal insult to a neighbour, and you will absorb that conflict. Revisit after the registry is trusted.

**Activity layer** (offers, "open late today", new stock). This is the retention engine and it cannot be team-curated — it changes daily. v1 ships without it. Open question, unanswered: does it come from shopkeepers or townsfolk?

## 6. Functional requirements

### 6.1 Browse & search

- Category grid on home. Categories are a **fixed, curated list** — not free text. Free-text categories fragment instantly ("Kirana" / "kirana" / "Grocery" / "General Store").
- Search matches shop name, category, owner name. Must tolerate transliteration and misspelling — Postgres trigram similarity (`pg_trgm`), not `LIKE`.
- Default sort: distance if location permission granted, else alphabetical.
- Every list row shows: name, category, open/closed, distance if available.

### 6.2 Shop detail

Above the fold, in order: photo, name, open/closed, **call button**. The call button is the primary action of the entire app; everything else is secondary. Do not bury it.

Below: WhatsApp button, timings for the week, description, address, map, photo gallery, `last verified` date, report-a-problem.

Show `last verified` to users. It is a public honesty signal and it creates pressure on your own team to keep the queue clean.

### 6.3 Map

- All shops as pins, clustered at low zoom.
- Tap pin → mini card → shop detail.
- "Directions" hands off to Google Maps. Do not build routing.

### 6.4 Open now

Computed client-side from `shop_hours`. Must handle: multiple slots per day (the lunch-break split is the norm), weekly off, and a manual `temporarily_closed` flag.

Show `Open · closes 8:00 PM` or `Closed · opens 9:00 AM tomorrow`. Never a bare boolean.

### 6.5 Report a problem

One tap from any shop page. Free text, optional phone number. Lands in the admin queue. This is your only crowd-sourced signal in v1 and it is how you learn what is stale.

### 6.6 Admin panel

The real v1 deliverable. Optimise this before you polish the consumer app.

- Mobile-first. Curators work standing in a market, not at a desk.
- Add shop: name → category → phone → photo (camera) → pin (GPS "use my location") → timings. Everything else optional.
- Timings via preset templates (`9–1, 4–8, Sunday off`) with per-day override. Never seven free-text fields.
- **Offline-tolerant.** Draft persists locally, syncs later. Market lanes have bad signal and losing a half-entered shop kills curator morale fast.
- Photo compression on-device before upload.
- Verification queue sorted by `last_verified_at ASC`.
- Report queue.

## 7. Data model

```sql
shop
  id                uuid pk
  name              text not null
  name_local        text                  -- Odia/Hindi script
  category_id       uuid fk -> category
  owner_name        text
  description       text
  phone             text                  -- E.164
  whatsapp          text                  -- often differs from phone
  address_line      text
  landmark          text                  -- how people actually navigate
  lat, lng          numeric
  status            enum(active, temporarily_closed, permanently_closed)
  last_verified_at  timestamptz not null
  created_at, updated_at

category
  id uuid pk, name text, slug text, icon text, sort_order int

shop_photo
  id, shop_id fk, url, is_primary bool, sort_order int

shop_hours
  id, shop_id fk, day_of_week int(0-6), open_time time, close_time time
  -- multiple rows per day = multiple slots. No row = closed that day.

report
  id, shop_id fk, body text, reporter_phone text, status enum(open, resolved), created_at
```

Notes on choices:

- `landmark` is a real field, not a nicety. In small towns, `near Hanuman temple` locates a shop; a street address does not.
- `name_local` from day one. Retrofitting a second script into an existing dataset is painful.
- `last_verified_at` is `not null` by design. There is no such thing as an unverified record.
- `permanently_closed` is a status, never a delete. Deletion loses the fact that you checked.
- Do not soft-delete via a `deleted` boolean *and* a status enum. Pick the enum.

## 8. Non-functional

- **Mobile web, not native.** No install friction, no store review cycle, instant updates. This is the correct call for v1 and probably v2. Revisit only if you need push notifications.
- Shop detail interactive in **< 2.5s on 4G, mid-range Android.**
- Photos served resized and in WebP. An uncompressed shop photo gallery will silently cost your users real money in data.
- Works with location permission **denied**. Many users will deny it. Distance and default sort degrade gracefully; nothing breaks.
- Full-page-load-per-navigation is acceptable. Do not build an SPA for a phone book.

## 9. Suggested stack

Server-rendered app (Next.js / Rails / Django — any), Postgres with `pg_trgm` and PostGIS, object storage for photos behind a CDN, MapLibre + OpenStreetMap tiles or Google Maps JS. Single small VM is sufficient; this is a read-heavy site for a few thousand people.

Aggressively cache the shop list. Shops change daily at most.

## 10. Launch plan

| Phase | Weeks | Exit criteria |
|---|---|---|
| Admin panel + schema | 1–2 | Curator adds a real shop end-to-end in ≤ 90s |
| Curation sprint | 2–5 | ≥ 90% coverage, every record has ≥ 1 photo |
| Consumer app | 4–6 | Browse, search, detail, map, call |
| Soft launch | 7 | 20–30 townsfolk, watch them use it, do not explain it |
| Public launch | 8 | Coverage and verification targets held |

Curation runs *parallel to and ahead of* consumer development. Launching a directory that is 40% complete burns the trust you will need later, and you only get one first impression in a town this size.

## 11. Risks

| Risk | Mitigation |
|---|---|
| Registry rots after launch enthusiasm fades | Verification queue + named owner + monthly re-verify quota. Treat as a standing job, not a project. |
| Curation is one person; they leave | Two curators minimum, even part-time. Document the process. |
| Nobody returns after week one | Expected for a directory. This is the trigger for the activity layer, not a failure. |
| Shopkeeper objects to their listing | Honour removal within 24h, no argument. One angry shopkeeper in a small town is a reputational event. |
| Photos of people captured incidentally | Shoot storefronts and goods. Avoid faces. |

## 12. Open questions

1. Where does the activity layer come from — shopkeepers or townsfolk? **Blocks v2 design.**
2. Ratings: ever? Under what identity model?
3. What is the town, and how many shops exactly? Every estimate here assumes roughly 200–500.
4. Who owns curation by name after launch?