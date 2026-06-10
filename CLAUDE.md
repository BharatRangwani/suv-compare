# SUV Compare — Project Conventions

> Project-specific instructions for Claude Code. Overrides global CLAUDE.md where noted.

---

## Project Overview

Static web app hosted on **GitHub Pages** at `https://bharatrangwani.github.io/suv-compare/`.  
Vanilla JS ES modules — no bundler, no framework. Phone-first, works on desktop too.  
Owner: BharatRangwani | Email: info@upyugoglobal.com | City: Jodhpur, Rajasthan.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Hosting | GitHub Pages (branch: `main`, root: `/`) |
| JS | Vanilla ES modules (`type="module"`, no bundler) |
| CSS | Custom properties (light/dark via `[data-theme]`) |
| Tests | Jest 29 with `--experimental-vm-modules` and `"transform": {}` |
| 3D viewer | Three.js r158+ (Plan 3) |
| Charts | Chart.js (Plan 2) |

**Run tests:** `node --experimental-vm-modules node_modules/jest/bin/jest.js --no-coverage`  
**Dev server:** `npx serve .` (then open localhost:3000)  
**Deploy:** push to `main` → GitHub Actions auto-deploys via `.github/workflows/deploy.yml`

---

## File Structure

```
index.html              — App shell, tab nav, ES module entry point
app.js                  — Tab routing, theme toggle, refresh button
cars-data.json          — All car data (11 entries: 10 SUVs + Quanto baseline)
styles/
  base.css              — Reset, typography, header, tab nav
  theme.css             — CSS variables for light/dark mode
  components.css        — Car cards, VFM tags, filter chips, EMI widget
  responsive.css        — Mobile/tablet/desktop breakpoints
modules/
  data.js               — loadCarsData(), getBaselineCar(), getCarsForRanking(), invalidateCache()
  profile.js            — getProfile(), saveProfile(), resetProfile(), DEFAULT_PROFILE
  ranking.js            — scoreCar(), rankCars(), getVFMTag(), getBestVariantPerBrand(), calcTCO()
  ui-filters.js         — renderFilters(), applyFilters(), getStoredFilters(), saveFilters()
  ui-home.js            — renderHome() — ranked card list with filters
  emi.js                — calcEMI(), calcLoanSummary(), calcOnRoadPrice(), renderEMICalculator()
tests/
  data.test.js          — 4 tests
  profile.test.js       — 4 tests
  ranking.test.js       — 8 tests
  emi.test.js           — 25 tests
.github/workflows/
  deploy.yml            — GitHub Pages deploy on push to main
```

---

## Key Conventions

### Data
- `cars-data.json` is the single source of truth. Never hardcode car data in JS modules.
- `is_baseline: true` marks the Quanto — it is always shown, never filtered, never ranked.
- All prices in **paise (integer rupees)** — e.g. ₹19.79L stored as `1979000`.
- Jodhpur petrol price stored in `cars-data.json` root as `petrol_price_jodhpur`.
- On-road price formula: `ex_showroom × 1.11 (road tax) + 15000 (registration) + ex_showroom × 0.035 (insurance)`.

### Scoring
- 6 weighted categories: safety 20%, VFM 20%, features 20%, service 15%, comfort 15%, reliability 10%.
- All sub-scores normalized 0–100. Total capped at 100.
- TCO resale deduction uses full resale value: `ex_showroom × resale_5yr_pct`. No cap — on-road price always exceeds resale so TCO cannot go negative.
- `getBestVariantPerBrand()` must be called after `rankCars()` — it uses `.score`.

### CSS classes (already defined — do not recreate)
- `.car-card`, `.vfm-tag`, `.vfm-excellent`, `.vfm-fair`, `.vfm-overpriced`
- `.best-badge`, `.spec-chips`, `.spec-chip`
- `.filter-bar`, `.filter-chip`, `.filter-chip.active`
- `.btn-primary`, `.emi-calculator`, `.emi-result`, `.emi-breakdown`
- `.down-payment-band`, `.band-green`, `.band-yellow`, `.band-red`

### localStorage keys
| Key | Content |
|---|---|
| `suv_user_profile` | User preference profile object |
| `suv_filters` | Active filter state object |
| `suv_theme` | `'light'` or `'dark'` |

---

## Car Data Schema (cars-data.json)

Every non-baseline car has these fields:

```
id, brand, model, variant, fuel, transmission
engine_cc, power_bhp, torque_nm
arai_kmpl, realworld_kmpl
ex_showroom_jodhpur
boot_litres, ground_clearance_mm, kerb_weight_kg, seating
rear_legroom_mm, cabin_width_mm
airbags, ncap_stars, adas, adas_features[]
wireless_carplay, wireless_aa, ventilated_seats, sunroof, connected_car, connected_system
climate_control, infotainment_inches
resale_3yr_pct, resale_5yr_pct
reliability_score, owner_rating, post_sale_service_rating
engine_rating /10, fuel_efficiency_rating /10
long_term_reliability_score /10, future_proof_score /10
parts_availability_score /10, ease_of_servicing_score /10
overall_customer_rating /10
annual_insurance_estimate (₹/yr), annual_maintenance_estimate (₹/yr)
known_issues[]: { issue (string), severity: 'Minor'|'Watch'|'Critical' }
pros[], cons[]
waiting_weeks_jodhpur
launch_year, is_new_model
service_centers_jodhpur[]: { name, area, phone, maps_url, rating, turnaround_hours }
```

---

## Fuel Type Values
| Value in JSON | Display label |
|---|---|
| `petrol_turbo` | Petrol Turbo |
| `petrol` | Petrol NA |
| `diesel` | Diesel |
| `strong_hybrid` | Strong Hybrid |
| `mild_hybrid` | Mild Hybrid |

---

## Plan Status

| Plan | Status |
|---|---|
| Plan 1 — Foundation | ✅ Complete (commit `2f0d2b2`) |
| Plan 2 — Car Detail + Compare + Charts | Pending |
| Plan 3 — 3D Viewer + Actions + Helpers | Pending |

---

## Jodhpur Context

- Rajasthan road tax: ~11%
- Registration: ~₹15,000
- First-year insurance: ~3.5% of ex-showroom
- Petrol price: ₹103/L (update in `cars-data.json` when it changes)
- Key concern for owner: service center availability, waiting period, parts supply
