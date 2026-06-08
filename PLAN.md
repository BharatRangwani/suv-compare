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

## Plan 2 — Car Detail + Compare + Charts (PENDING)

**Goal:** Car detail page, side-by-side compare table (up to 4 + Quanto), TCO bar chart, score radar chart.

### Planned tasks

- [ ] Task 1: Car detail page — `modules/ui-detail.js`
  - Variant selector tab row (all variants of a model)
  - Full specs table, safety section, ownership section
  - Known issues expandable list with severity badges
  - All /10 ratings displayed as a visual ratings dashboard
  - Score radar/spider chart (Chart.js)
  - Service centers list for Jodhpur
  - "Compare with Quanto" + "Add to Compare" buttons

- [ ] Task 2: Compare table — `modules/ui-compare.js`
  - Up to 4 cars + Quanto as locked column 1
  - Rows grouped: Pricing, Engine, Safety, Features, Ownership
  - Color coded vs Quanto (green = better, red = worse)
  - "Show differences only" toggle
  - EMI row per car (uses saved profile down payment %)
  - Sticky header on mobile scroll

- [ ] Task 3: TCO bar chart — Chart.js integration
  - 5-year TCO comparison bar chart in compare view
  - Petrol vs diesel vs hybrid TCO for same model where applicable

- [ ] Task 4: "Better alternative in budget" feature
  - For each car, check if a higher-ranked car exists at same or lower price
  - Surface inline: "₹X cheaper, higher safety: [Car Name]"

- [ ] Task 5: Wire detail page into home card clicks

- [ ] Task 6: Tests for ui-detail, ui-compare

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
