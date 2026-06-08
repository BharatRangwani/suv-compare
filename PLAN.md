# SUV Compare — Implementation Plans

> **Status as of 2026-06-09**

---

## Plan 1 — Foundation ✅ COMPLETE

**Goal:** Project scaffold, car database, ranking engine, home tab UI, filters, EMI calculator.

**Commit:** `2f0d2b2` on `main`  
**Tests:** 41/41 passing

### Completed tasks
- [x] Task 1: Project scaffold (`index.html`, `package.json`, `.gitignore`, GitHub Actions deploy)
- [x] Task 2: CSS theming (`styles/base.css`, `theme.css`, `components.css`, `responsive.css`)
- [x] Task 3–4: Car database (`cars-data.json`) — 10 SUVs + Quanto baseline, full schema
- [x] Task 5: Data loader module (`modules/data.js`)
- [x] Task 6: User profile module (`modules/profile.js`)
- [x] Task 7: Ranking engine (`modules/ranking.js`) — 6-category scoring, TCO, VFM tags, best variant per brand
- [x] Task 8: Home tab UI (`modules/ui-home.js`, `modules/ui-filters.js`) — ranked cards, 9-category filters
- [x] Task 9: App wiring (`app.js`) — tab nav, theme toggle, refresh, Jodhpur tab
- [x] Task 10: EMI calculator (`modules/emi.js`, `tests/emi.test.js`)
- [x] Task 11: Full test run + push to GitHub

---

## Plan 2 — Car Detail + Compare + Charts ✅ COMPLETE

**Goal:** Car detail page, side-by-side compare table (up to 4 + Quanto), TCO bar chart, score radar chart.

**Commit:** `095a0d2` on `main`
**Tests:** 68/68 passing

### Completed tasks

- [x] Task 1: Car detail page — `modules/ui-detail.js`
  - Variant selector tab row (all variants of a model)
  - Full specs table, safety section, ownership section
  - Known issues expandable list with severity badges
  - All /10 ratings displayed as a visual ratings dashboard
  - Score radar/spider chart (Chart.js)
  - Service centers list for Jodhpur
  - "Compare with Quanto" + "Add to Compare" buttons

- [x] Task 2: Compare table — `modules/ui-compare.js`
- [x] Task 3: TCO bar chart — Chart.js integration
- [x] Task 4: Wire detail page into home card clicks
- [x] Task 5: Tests for ui-detail (27 tests)

---

## Plan 2b — UI Redesign: Glass Morphism ✅ COMPLETE

**Goal:** Full visual overhaul — Gradient Hero + Glass Cards theme.

**Commit:** `a180cd7` on `main`

### Completed tasks

- [x] Rewrite `styles/theme.css` — unified dark-base, glass variables, rgba semantic colours
- [x] Rewrite `styles/base.css` — gradient mesh bg, glass header, bottom floating pill nav, hero section classes
- [x] Rewrite `styles/components.css` — glass cards, purple glow for #1, gradient text, glass detail panel/modals
- [x] Update `styles/responsive.css` — bottom padding for floating nav
- [x] Update `index.html` — Inter font, tab buttons with icon+label markup
- [x] Update `modules/ui-home.js` — hero section (eyebrow/title/pills), `data-rank` on cards
- [x] Fix `app.js` — stray closing brace in `init()`

---

## Plan 3 — 3D Viewer + Auto-Refresh + First-Time Helpers (PENDING)

**Goal:** Three.js 3D model viewer with color switcher, GitHub Actions weekly data refresh, first-time buyer tools.

### Planned tasks

- [ ] Task 1: Three.js 3D viewer — `modules/ui-3d.js`
  - GLTF/GLB model loader (on demand)
  - Orbit controls (drag/pinch/scroll)
  - Color switcher (material update)
  - Auto-rotate on load, pause on touch
  - Image carousel fallback if no 3D model

- [ ] Task 2: Color swatches per car in `cars-data.json`
  - Add `colors[]` field: `{ name, hex, material_hex }`

- [ ] Task 3: GitHub Actions data refresh workflow
  - `.github/workflows/refresh-data.yml`
  - Weekly Sunday 6am IST trigger
  - Manual trigger via "Refresh Database" button (GitHub PAT required)

- [ ] Task 4: Quanto exchange estimator
  - Rough resale value estimate based on year + condition dropdown
  - Inline in home tab or Jodhpur tab

- [ ] Task 5: First-time buyer helpers
  - Tooltip system for technical terms (ADAS, DCT, NCAP, etc.)
  - "Dealer visit checklist" — printable list
  - "Questions to ask your dealer" section per car detail page

- [ ] Task 6: Full app QA pass on mobile (Chrome DevTools phone emulation + actual phone test)
