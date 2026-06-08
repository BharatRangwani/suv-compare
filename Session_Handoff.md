# Session Handoff — SUV Compare App

---

## 2026-06-09 — Plan 1 Complete, pushed to GitHub

### What changed this session

**Pre-build data expansion (cars-data.json):**
- Added 10 new fields to every car entry: `engine_rating`, `fuel_efficiency_rating`, `long_term_reliability_score`, `future_proof_score`, `parts_availability_score`, `ease_of_servicing_score`, `overall_customer_rating`, `annual_insurance_estimate`, `annual_maintenance_estimate`, `known_issues` (array with `issue` string + `severity: Minor|Watch|Critical`)
- Quanto baseline also updated with all new fields (future_proof_score: 2 — discontinued model)

**modules/ranking.js:**
- Added `getBestVariantPerBrand(rankedCars)` — takes output of `rankCars()`, returns same array with `is_best_variant_for_user: true` on the highest-scoring variant per brand

**modules/ui-filters.js** (new):
- 9 filter categories: fuel, transmission, budget, safety rating, ADAS, ventilated seats, sunroof, waiting period, brand
- `renderFilters(container, onFilterChange)` — renders horizontal chip bar, manages active state per group
- `applyFilters(cars, filters)` — AND logic; Quanto baseline always passes through
- Filter state persists in `localStorage` key `suv_filters`

**modules/ui-home.js** (new):
- `renderHome(container)` — async, loading state, error handling
- Ranked car cards with: rank badge, score/100, VFM tag, "Best Variant for You" badge, waiting period color chip, spec chips, must-have check row, known issues preview (first Critical or Watch), price row, annual costs, collapsible score breakdown
- Quanto baseline card always shown at bottom, labeled "Your Current Car"
- Filter changes re-render card list only (filter bar preserved)

**modules/emi.js** (new):
- `calcEMI(principal, annualRatePercent, tenureMonths)` — standard reducing-balance formula
- `calcLoanSummary(onRoadPrice, downPaymentPct, annualRatePercent, tenureMonths)` — full breakdown object
- `calcOnRoadPrice(exShowroom)` — Rajasthan formula (11% road tax + ₹15k reg + 3.5% insurance)
- `getDownPaymentBand(pct)` → `'green'|'yellow'|'red'`
- `renderEMICalculator(container, initialOnRoadPrice)` — full interactive widget with bank rate presets (SBI 8.5%, HDFC 8.75%, ICICI 9%), down payment slider, tenure selector, live updates

**app.js** (new):
- Tab navigation (home / compare / ranking / jodhpur) with aria-selected management
- Light/dark theme toggle with localStorage persistence
- Refresh button — invalidates data cache, re-renders home tab
- Jodhpur tab: EMI calculator + on-road price list for all cars sorted by ex-showroom
- Timestamp display from `cars-data.json.last_updated`
- Compare and Ranking tabs show "coming in Plan 2" placeholder

**tests/emi.test.js** (new):
- 25 tests across: calcEMI, calcLoanSummary, getDownPaymentBand, calcOnRoadPrice

**GitHub:**
- Remote added: `https://github.com/BharatRangwani/suv-compare.git`
- Pushed to `main` — GitHub Actions deploy triggered
- App should be live at: `https://bharatrangwani.github.io/suv-compare/`

### Test status
```
Tests: 41 passed, 41 total
  data.test.js      4 tests ✅
  profile.test.js   4 tests ✅
  ranking.test.js   8 tests ✅
  emi.test.js      25 tests ✅
```

---

### What's next — Plan 2

**First task:** Car detail page (`modules/ui-detail.js`)
- Clicking a car card on the home tab should open the detail page
- Variant selector row (all variants of that model)
- Full specs, all /10 ratings as visual dashboard, known issues with severity, service centers
- Spider/radar chart using Chart.js
- "Add to Compare" button

**Second task:** Compare table (`modules/ui-compare.js`)
- Up to 4 user-selected cars + Quanto locked in column 1
- Grouped rows, color-coded vs Quanto, EMI row, "show differences only" toggle

**Third task:** TCO bar chart (Chart.js)

See [PLAN.md](PLAN.md) for full Plan 2 task list.

---

### Open questions / decisions needed

1. **Car navigation model:** When user taps a card, should it open a full new "page" (hide home, show detail) or open a modal/sheet overlay? Recommendation: slide-in sheet on mobile (less disorienting), full pane on desktop.

2. **Compare tab flow:** Should user pick cars to compare from the Home tab ("Add to Compare" button per card), or from a dedicated picker inside the Compare tab? Current spec says both.

3. **3D models:** Free CC0 GLTF models exist for approximate car shapes on Sketchfab/free3d.com but are not brand-licensed. Confirm: use approximate stand-in models vs. image carousel only (no 3D)? Image carousel is safer and faster to implement.

4. **GitHub PAT for Refresh Database button:** The button currently just invalidates the local cache and re-renders from the existing JSON. A true GitHub Actions trigger requires a PAT stored as a repo secret. Needs one-time setup if this feature is wanted.

---

### Known issues / gotchas to remember

- `node_modules/.bin/jest` is a bash shim — doesn't work on Windows PowerShell. Always use: `node --experimental-vm-modules node_modules/jest/bin/jest.js`
- `comfortScore` is multiplied by 100 — intentional (deltas are 0–1 fractions scaled to 0–100)
- TCO resale cap: `Math.min(resale, operatingCosts × 0.9)` — prevents negative TCO for high-resale cars (Toyota Hyryder 57% resale)
- Quanto baseline has `ex_showroom_jodhpur: 0` — always exclude from budget filters and price comparisons
- Git identity configured locally (not globally): `user.email = info@upyugoglobal.com`, `user.name = BharatRangwani`
