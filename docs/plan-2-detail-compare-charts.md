> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add per-car subjective rating fields to the data, build a full-screen car detail slide-in panel with a radar chart, build a side-by-side compare table with a TCO bar chart, and wire Chart.js from CDN into the existing static app.

**Architecture:** All new UI lives in two new ES modules (`modules/ui-detail.js` and `modules/ui-compare.js`) that import from existing modules without modifying them, except for the explicit wiring points described below (`ui-home.js` click handlers, `app.js` compare-tab call, `index.html` Chart.js CDN tag). `cars-data.json` gains 10 new fields per car entry (9 per-axis ratings + computed `ratings_total`). CSS additions go at the bottom of `styles/components.css`.

**Tech Stack:** Vanilla ES modules, no bundler, Chart.js 4.4.0 from CDN (UMD global `Chart`), Jest 29 with `--experimental-vm-modules`, GitHub Pages static hosting.

---

## Task 1 — Expand `cars-data.json` with 9 rating fields on all 11 car entries

**Files to modify:** `C:\Users\Work\suv-compare\cars-data.json`

### Ratings key

| Field | What it measures |
|---|---|
| `rating_engine` | Engine refinement, response, character /10 |
| `rating_ride_handling` | Ride comfort + cornering balance /10 |
| `rating_nvh` | Noise/vibration/harshness (higher = quieter) /10 |
| `rating_fit_finish` | Panel gaps, paint, build solidity /10 |
| `rating_interior_quality` | Material quality, dashboard feel /10 |
| `rating_interior_space` | Headroom, legroom, shoulder room /10 |
| `rating_boot_space` | Boot volume + usability /10 |
| `rating_features_tech` | Infotainment, ADAS, connected features /10 |
| `rating_service_quality` | Authorized service experience in Jodhpur /10 |
| `ratings_total` | Average of above 9, rounded to 1 decimal |

### Step-by-step

1. Open `cars-data.json` in your editor.
2. For **each** car entry, add the 10 new fields immediately after the `overall_customer_rating` field.
3. `ratings_total` is a stored value — the average of the 9 rating fields rounded to one decimal.

### Exact values per car

#### `hyundai-creta-sx-opt-petrol-dct` (Creta SX(O) Petrol DCT)
```json
"rating_engine": 8,
"rating_ride_handling": 8,
"rating_nvh": 7,
"rating_fit_finish": 8,
"rating_interior_quality": 8,
"rating_interior_space": 8,
"rating_boot_space": 8,
"rating_features_tech": 9,
"rating_service_quality": 8,
"ratings_total": 8.0
```
Rationale: 1.5T turbo is refined, ride is well-sorted, NVH acceptable for class, fit-finish is segment-best, features are class-leading with ADAS and dual-zone AC, Hyundai has 2 centers in Jodhpur with good turnaround.

#### `hyundai-creta-s-petrol-dct` (Creta S Petrol DCT)
```json
"rating_engine": 8,
"rating_ride_handling": 8,
"rating_nvh": 7,
"rating_fit_finish": 8,
"rating_interior_quality": 7,
"rating_interior_space": 8,
"rating_boot_space": 8,
"rating_features_tech": 7,
"rating_service_quality": 8,
"ratings_total": 7.7
```
Rationale: Same platform as SX(O) but no ADAS or ventilated seats drops features score. Interior quality step-down from SX(O) trim.

#### `kia-seltos-gtx-plus-petrol-dct` (Seltos GTX+ Petrol DCT)
```json
"rating_engine": 8,
"rating_ride_handling": 8,
"rating_nvh": 8,
"rating_fit_finish": 9,
"rating_interior_quality": 9,
"rating_interior_space": 9,
"rating_boot_space": 8,
"rating_features_tech": 9,
"rating_service_quality": 6,
"ratings_total": 8.2
```
Rationale: Best interior in class, premium materials, NVH noticeably better than Creta, most legroom. Service score pulled down by only 1 authorized center in Jodhpur with 24hr turnaround.

#### `kia-seltos-htx-plus-petrol-dct` (Seltos HTX+ Petrol DCT)
```json
"rating_engine": 8,
"rating_ride_handling": 8,
"rating_nvh": 8,
"rating_fit_finish": 9,
"rating_interior_quality": 8,
"rating_interior_space": 9,
"rating_boot_space": 8,
"rating_features_tech": 7,
"rating_service_quality": 6,
"ratings_total": 7.9
```
Rationale: Same platform but no ADAS. HTX+ trim interior quality slightly below GTX+. Service remains a concern.

#### `mahindra-quanto-c8-diesel` (Quanto C8 — BASELINE)
```json
"rating_engine": 5,
"rating_ride_handling": 5,
"rating_nvh": 3,
"rating_fit_finish": 5,
"rating_interior_quality": 4,
"rating_interior_space": 4,
"rating_boot_space": 3,
"rating_features_tech": 2,
"rating_service_quality": 5,
"ratings_total": 4.0
```
Rationale: 2012 discontinued sub-compact. 3-cyl diesel is rough, NVH is awful by modern standards, tiny boot, no features. Parts still available at Mahindra dealers but service experience declining.

#### `maruti-grand-vitara-alpha-plus-strong-hybrid` (Grand Vitara Alpha+ Strong Hybrid AT)
```json
"rating_engine": 7,
"rating_ride_handling": 7,
"rating_nvh": 8,
"rating_fit_finish": 7,
"rating_interior_quality": 7,
"rating_interior_space": 7,
"rating_boot_space": 6,
"rating_features_tech": 7,
"rating_service_quality": 9,
"ratings_total": 7.2
```
Rationale: Hybrid powertrain smooth and refined, good NVH. Interior plastics are mid-spec Maruti quality. Boot smaller than Creta. Maruti service network in Jodhpur is best-in-class (2 centers, fast turnaround, cheapest labor).

#### `toyota-hyryder-v-strong-hybrid-at` (Hyryder V Strong Hybrid AT)
```json
"rating_engine": 7,
"rating_ride_handling": 7,
"rating_nvh": 8,
"rating_fit_finish": 8,
"rating_interior_quality": 7,
"rating_interior_space": 7,
"rating_boot_space": 6,
"rating_features_tech": 7,
"rating_service_quality": 7,
"ratings_total": 7.2
```
Rationale: Same powertrain as Vitara but Toyota fit-finish is marginally better. Only 1 service center in Jodhpur vs Maruti's 2 but good rating.

#### `tata-nexon-fearless-plus-petrol-amt` (Nexon Fearless+ Petrol AMT)
```json
"rating_engine": 7,
"rating_ride_handling": 7,
"rating_nvh": 6,
"rating_fit_finish": 6,
"rating_interior_quality": 6,
"rating_interior_space": 7,
"rating_boot_space": 7,
"rating_features_tech": 7,
"rating_service_quality": 6,
"ratings_total": 6.6
```
Rationale: AMT gearbox is jarring; NVH not great for class; Tata interior plastics and panel gaps inconsistent per owner reviews. Good connected features via iRA. Tata service has 1 center in Jodhpur.

#### `mg-astor-savvy-cvt` (Astor Savvy CVT)
```json
"rating_engine": 7,
"rating_ride_handling": 6,
"rating_nvh": 6,
"rating_fit_finish": 7,
"rating_interior_quality": 7,
"rating_interior_space": 7,
"rating_boot_space": 9,
"rating_features_tech": 8,
"rating_service_quality": 5,
"ratings_total": 6.9
```
Rationale: Largest boot (448L) gets 9/10. Good features including AI assistant. Ride slightly stiff; lower GC (178mm). MG service center in Jodhpur has lowest rating (3.5) and long turnaround.

#### `honda-elevate-zx-cvt` (Elevate ZX CVT)
```json
"rating_engine": 7,
"rating_ride_handling": 8,
"rating_nvh": 8,
"rating_fit_finish": 8,
"rating_interior_quality": 7,
"rating_interior_space": 9,
"rating_boot_space": 9,
"rating_features_tech": 5,
"rating_service_quality": 8,
"ratings_total": 7.7
```
Rationale: Honda's i-VTEC is smooth, excellent NVH for NA engine, largest boot (458L), best rear legroom (982mm), best GC (220mm). Features score is poor: no connected car, small 8" screen, no ADAS. Honda Sangam service center rated 4.1 with 8hr turnaround.

#### `volkswagen-taigun-topline-tsi-dsg` (Taigun Topline 1.5 TSI DSG)
```json
"rating_engine": 9,
"rating_ride_handling": 9,
"rating_nvh": 8,
"rating_fit_finish": 9,
"rating_interior_quality": 8,
"rating_interior_space": 7,
"rating_boot_space": 7,
"rating_features_tech": 7,
"rating_service_quality": 4,
"ratings_total": 7.6
```
Rationale: Best driving dynamics in class; 1.5 TSI smoothest and most responsive engine; DSG is silky; European fit-finish clearly better. Service score is 4/10 — only 1 VW dealer in Jodhpur, 48hr turnaround, highest labor costs, imported parts delays.

### Verification after edit

After saving `cars-data.json`, run from `C:\Users\Work\suv-compare\`:
```
node -e "JSON.parse(require('fs').readFileSync('cars-data.json','utf8')); console.log('JSON valid')"
```

Verify every entry has exactly these 10 new keys:
`rating_engine`, `rating_ride_handling`, `rating_nvh`, `rating_fit_finish`, `rating_interior_quality`, `rating_interior_space`, `rating_boot_space`, `rating_features_tech`, `rating_service_quality`, `ratings_total`

### Commit message
```
feat(data): add 9 per-axis quality ratings to all 11 car entries

Adds rating_engine, rating_ride_handling, rating_nvh, rating_fit_finish,
rating_interior_quality, rating_interior_space, rating_boot_space,
rating_features_tech, rating_service_quality (all /10) and ratings_total
(computed average) to every car including Quanto baseline.
Values based on real-world ownership data for Jodhpur context.
```

---

## Task 2 — Add CSS for new components to `styles/components.css`

**Files to modify:** `C:\Users\Work\suv-compare\styles\components.css`

Append the following block to the END of `styles/components.css`. Do NOT modify any existing rules.

```css
/* === Detail Panel === */
.detail-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  max-width: 680px;
  height: 100%;
  background: var(--surface);
  border-left: 1px solid var(--border);
  z-index: 200;
  overflow-y: auto;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}
.detail-panel.open { transform: translateX(0); }

.detail-panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 199;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}
.detail-panel-backdrop.visible { opacity: 1; pointer-events: auto; }

.detail-header {
  position: sticky;
  top: 0;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 10;
}
.detail-header-title { flex: 1; min-width: 0; }
.detail-header-title h2 {
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.detail-header-title p {
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.detail-close-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.3rem 0.6rem;
  font-size: 1rem;
  cursor: pointer;
  color: var(--text);
  flex-shrink: 0;
}
.detail-close-btn:hover { background: var(--surface-2); }
.detail-body { padding: 1rem; display: flex; flex-direction: column; gap: 1.5rem; }
.detail-section { display: flex; flex-direction: column; gap: 0.75rem; }
.detail-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.25rem;
}

/* Ratings grid */
.ratings-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}
.rating-pill {
  background: var(--surface-2);
  border-radius: 8px;
  padding: 0.5rem 0.6rem;
  text-align: center;
}
.rating-pill-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  line-height: 1.2;
  margin-bottom: 0.2rem;
}
.rating-pill-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent);
}
.radar-chart-container {
  position: relative;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}

/* Specs grid */
.specs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem 1rem;
  font-size: 0.85rem;
}
.specs-grid dt { color: var(--text-muted); }
.specs-grid dd { font-weight: 600; }

/* Must-haves */
.must-haves-list { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.88rem; }
.must-have-check { display: flex; align-items: center; gap: 0.5rem; }
.must-have-check.met { color: var(--green); }
.must-have-check.unmet { color: var(--red); }

/* Severity badges */
.severity-minor {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 99px;
  background: var(--surface-2);
  color: var(--text-muted);
  text-transform: uppercase;
}
.severity-watch {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 99px;
  background: #fff7ed;
  color: #c2410c;
  text-transform: uppercase;
}
.severity-critical {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 99px;
  background: #fee2e2;
  color: var(--red);
  text-transform: uppercase;
}
[data-theme="dark"] .severity-watch { background: #431407; color: #fb923c; }
[data-theme="dark"] .severity-critical { background: #7f1d1d; color: #fca5a5; }

/* Issues list */
.issues-list { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem; }
.issue-item { display: flex; align-items: flex-start; gap: 0.5rem; }
.issue-text { flex: 1; }

/* Ownership scores */
.ownership-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.ownership-item {
  background: var(--surface-2);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}
.ownership-item span:last-child { font-weight: 700; color: var(--accent); }

/* Service centers */
.service-center-list { display: flex; flex-direction: column; gap: 0.75rem; }
.service-center-card {
  background: var(--surface-2);
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.85rem;
}
.service-center-card h4 { font-weight: 700; margin-bottom: 0.25rem; }
.service-center-meta { color: var(--text-muted); font-size: 0.8rem; margin-bottom: 0.4rem; }
.service-center-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.4rem; }
.service-center-actions a {
  font-size: 0.78rem;
  padding: 3px 10px;
  border-radius: 99px;
  border: 1px solid var(--border);
  color: var(--accent);
  text-decoration: none;
  background: var(--surface);
}
.service-center-actions a:hover { background: var(--accent-light); }

/* Pros/Cons grid */
.pros-cons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.pros-list, .cons-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.82rem;
  list-style: none;
}
.pros-list li::before { content: "check "; color: var(--green); font-weight: 700; }
.cons-list li::before { content: "x "; color: var(--red); font-weight: 700; }

/* Action buttons */
.detail-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.btn-secondary {
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-secondary:hover { background: var(--border); }

/* === Compare Table === */
.compare-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  min-width: 480px;
}
.compare-table th, .compare-table td {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  text-align: left;
  white-space: nowrap;
}
.compare-table thead th {
  background: var(--surface-2);
  font-weight: 700;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 5;
}
.compare-sticky-col {
  position: sticky;
  left: 0;
  background: var(--surface);
  z-index: 4;
  font-weight: 600;
  min-width: 140px;
  white-space: normal;
}
.compare-table thead .compare-sticky-col { z-index: 6; background: var(--surface-2); }
.compare-section-header td {
  background: var(--surface-2);
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  padding: 0.4rem 0.75rem;
}
.compare-better { background: #dcfce7 !important; }
.compare-worse { background: #fee2e2 !important; }
[data-theme="dark"] .compare-better { background: #14532d !important; }
[data-theme="dark"] .compare-worse { background: #7f1d1d !important; }
.compare-baseline-col { background: var(--accent-light) !important; font-weight: 700; }
.locked-badge {
  font-size: 0.65rem;
  background: var(--accent);
  color: #fff;
  padding: 1px 6px;
  border-radius: 99px;
  margin-left: 0.3rem;
  vertical-align: middle;
}

/* Compare controls */
.compare-controls { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; }
.compare-car-slots { display: flex; gap: 0.5rem; flex-wrap: wrap; flex: 1; }
.compare-car-slot {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
}
.compare-car-slot .remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 0 2px;
}
.compare-car-slot .remove-btn:hover { color: var(--red); }
.add-car-btn {
  background: none;
  border: 2px dashed var(--border);
  border-radius: 8px;
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.15s;
}
.add-car-btn:hover { border-color: var(--accent); color: var(--accent); }
.diff-toggle-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; margin-bottom: 0.75rem; }
.diff-toggle-row input[type=checkbox] { width: 16px; height: 16px; cursor: pointer; }

/* Car picker modal */
.car-picker-modal {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
@media (min-width: 600px) { .car-picker-modal { align-items: center; } }
.car-picker-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.45); }
.car-picker-sheet {
  position: relative;
  background: var(--surface);
  border-radius: 16px 16px 0 0;
  padding: 1rem;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 1;
}
@media (min-width: 600px) { .car-picker-sheet { border-radius: 16px; max-height: 70vh; } }
.car-picker-sheet h3 { margin-bottom: 0.75rem; font-size: 1rem; }
.car-picker-search {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--surface-2);
  color: var(--text);
  margin-bottom: 0.75rem;
}
.car-picker-list { display: flex; flex-direction: column; gap: 0.4rem; }
.car-picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: var(--surface-2);
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.1s;
}
.car-picker-item:hover { background: var(--accent-light); }
.car-picker-item.disabled { opacity: 0.4; pointer-events: none; }

/* Bar chart container */
.bar-chart-container {
  position: relative;
  width: 100%;
  height: 200px;
  margin: 0.75rem 0;
}
```

### Commit message
```
feat(css): add detail panel, compare table, and rating grid component styles
```

---

## Task 3 — Add Chart.js CDN tag to `index.html`

**Files to modify:** `C:\Users\Work\suv-compare\index.html`

Insert the Chart.js script tag immediately before the existing `<script type="module" src="app.js"></script>` line.

**Before:**
```html
  <script type="module" src="app.js"></script>
</body>
</html>
```

**After:**
```html
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script type="module" src="app.js"></script>
</body>
</html>
```

Chart.js loads as a UMD bundle and attaches `window.Chart`. ES modules reference `window.Chart` directly — they cannot `import` it because it is a non-module CDN script.

### Commit message
```
feat(html): load Chart.js 4.4.0 from CDN before app module
```

---

## Task 4 — Create `modules/ui-detail.js`

**Files to create:** `C:\Users\Work\suv-compare\modules\ui-detail.js`

### Overview

Exports one public function `renderDetailPanel(car, allRanked, baseline)` and three pure helpers `calcRatingsTotal(car)`, `formatStars(n)`, `getWaitingLabel(weeks)`. The panel is a `<div class="detail-panel">` appended to `document.body` on first use, reused on subsequent opens.

### Full implementation

```js
// modules/ui-detail.js
import { calcOnRoadPrice, renderEMICalculator } from './emi.js';
import { getVFMTag, calcTCO } from './ranking.js';
import { getProfile } from './profile.js';

// === Pure helpers (exported for tests) ===

export function calcRatingsTotal(car) {
  const fields = [
    'rating_engine', 'rating_ride_handling', 'rating_nvh',
    'rating_fit_finish', 'rating_interior_quality', 'rating_interior_space',
    'rating_boot_space', 'rating_features_tech', 'rating_service_quality'
  ];
  const values = fields.map(f => Number(car[f]) || 0);
  const avg = values.reduce((s, v) => s + v, 0) / fields.length;
  return Math.round(avg * 10) / 10;
}

export function formatStars(n) {
  const clamped = Math.max(0, Math.min(5, Math.round(n)));
  return '★'.repeat(clamped) + '☆'.repeat(5 - clamped);
}

export function getWaitingLabel(weeks) {
  if (weeks === 0) return 'Available Now';
  if (weeks === 1) return '~1 week wait';
  if (weeks <= 4) return `~${weeks} weeks wait`;
  if (weeks <= 8) return `~${weeks} weeks wait (moderate)`;
  return `${weeks}+ weeks wait (long)`;
}

// === Panel singleton ===

let _panelEl = null;
let _backdropEl = null;
let _radarChart = null;
let _previousFocus = null;

function ensurePanel() {
  if (_panelEl) return;
  _backdropEl = document.createElement('div');
  _backdropEl.className = 'detail-panel-backdrop';
  _backdropEl.addEventListener('click', closeDetailPanel);
  _panelEl = document.createElement('div');
  _panelEl.className = 'detail-panel';
  _panelEl.setAttribute('role', 'dialog');
  _panelEl.setAttribute('aria-modal', 'true');
  _panelEl.setAttribute('aria-label', 'Car Detail');
  document.body.appendChild(_backdropEl);
  document.body.appendChild(_panelEl);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _panelEl.classList.contains('open')) closeDetailPanel();
  });
}

function closeDetailPanel() {
  if (!_panelEl) return;
  _panelEl.classList.remove('open');
  _backdropEl.classList.remove('visible');
  if (_radarChart) { _radarChart.destroy(); _radarChart = null; }
  const url = new URL(window.location.href);
  url.searchParams.delete('car');
  window.history.replaceState(null, '', url.toString());
  if (_previousFocus) { _previousFocus.focus(); _previousFocus = null; }
}

// === Public API ===

export function renderDetailPanel(car, allRanked, baseline) {
  ensurePanel();
  _previousFocus = document.activeElement;

  const url = new URL(window.location.href);
  url.searchParams.set('car', car.id);
  window.history.replaceState(null, '', url.toString());

  if (_radarChart) { _radarChart.destroy(); _radarChart = null; }

  const isBaseline = !!car.is_baseline;
  const profile = getProfile();
  const exSR = car.ex_showroom_jodhpur || 0;
  const onRoad = exSR > 0 ? calcOnRoadPrice(exSR) : 0;
  const tco = (!isBaseline && exSR > 0)
    ? (car.tco != null ? car.tco : calcTCO(car, profile))
    : null;
  const vfmTag = !isBaseline
    ? getVFMTag(car, allRanked.filter(c => !c.is_baseline))
    : null;
  const vfmLabels = { excellent: 'Excellent VFM', fair: 'Fair VFM', overpriced: 'Overpriced' };
  const ratingsTotal = car.ratings_total != null ? car.ratings_total : calcRatingsTotal(car);

  const ratingDefs = [
    { key: 'rating_engine', label: 'Engine' },
    { key: 'rating_ride_handling', label: 'Ride+Handling' },
    { key: 'rating_nvh', label: 'NVH' },
    { key: 'rating_fit_finish', label: 'Fit+Finish' },
    { key: 'rating_interior_quality', label: 'Interior Quality' },
    { key: 'rating_interior_space', label: 'Interior Space' },
    { key: 'rating_boot_space', label: 'Boot Space' },
    { key: 'rating_features_tech', label: 'Features+Tech' },
    { key: 'rating_service_quality', label: 'Service Quality' },
  ];

  const fuelMap = {
    petrol_turbo: 'Petrol Turbo', diesel: 'Diesel',
    strong_hybrid: 'Strong Hybrid', mild_hybrid: 'Mild Hybrid', petrol: 'Petrol NA'
  };

  // Build HTML
  _panelEl.innerHTML = `
    <div class="detail-header">
      <button class="detail-close-btn" id="detail-back-btn" aria-label="Go back">&#8592;</button>
      <div class="detail-header-title">
        <h2>${car.brand} ${car.model}</h2>
        <p>${car.variant}</p>
      </div>
      ${!isBaseline
        ? `<span class="rank-badge">#${car.rank || '&mdash;'}</span><span class="car-score">${car.score != null ? car.score : '&mdash;'}/100</span>`
        : '<span class="rank-badge baseline-rank">Baseline</span>'
      }
      <button class="detail-close-btn" id="detail-close-btn" aria-label="Close">&#215;</button>
    </div>
    <div class="detail-body">
      <div class="badge-row" id="dp-badges"></div>

      ${!isBaseline && exSR > 0 ? `
      <section class="detail-section">
        <h3 class="detail-section-title">Price &amp; Costs</h3>
        <dl class="specs-grid">
          <dt>Ex-showroom</dt><dd>&#8377;${fmtLakh(exSR)} L</dd>
          <dt>Road tax (11%)</dt><dd>&#8377;${fmtLakh(exSR * 0.11)} L</dd>
          <dt>Registration</dt><dd>&#8377;15,000</dd>
          <dt>Insurance (1st yr)</dt><dd>&#8377;${fmtLakh(exSR * 0.035)} L</dd>
          <dt>On-road (Jodhpur)</dt><dd><strong>&#8377;${fmtLakh(onRoad)} L</strong></dd>
          ${tco != null ? `<dt>5-yr TCO</dt><dd><strong>&#8377;${fmtLakh(tco)} L</strong></dd>` : ''}
          <dt>Annual insurance</dt><dd>&#8377;${(car.annual_insurance_estimate || 0).toLocaleString('en-IN')}</dd>
          <dt>Annual service</dt><dd>&#8377;${(car.annual_maintenance_estimate || 0).toLocaleString('en-IN')}</dd>
        </dl>
        <div id="dp-emi-calc"></div>
      </section>
      ` : `
      <section class="detail-section">
        <h3 class="detail-section-title">Your Current Car</h3>
        <p style="color:var(--text-muted);font-size:0.9rem">This is your baseline. No purchase cost.</p>
      </section>
      `}

      <section class="detail-section">
        <h3 class="detail-section-title">Quality Ratings vs Quanto Baseline</h3>
        <div class="radar-chart-container">
          <canvas id="dp-radar-canvas"></canvas>
        </div>
        <div class="ratings-grid" id="dp-ratings-grid"></div>
        <div style="margin-top:0.5rem;text-align:center;background:var(--accent-light);border:1px solid var(--accent);border-radius:8px;padding:0.5rem">
          <div style="font-size:0.65rem;color:var(--text-muted)">Overall Rating (avg of 9)</div>
          <div style="font-size:1.3rem;font-weight:700;color:var(--accent)">${ratingsTotal}/10</div>
        </div>
      </section>

      <section class="detail-section">
        <h3 class="detail-section-title">Specifications</h3>
        <dl class="specs-grid">
          <dt>Engine</dt><dd>${car.engine_cc || '&mdash;'} cc</dd>
          <dt>Power</dt><dd>${car.power_bhp || '&mdash;'} bhp</dd>
          <dt>Torque</dt><dd>${car.torque_nm || '&mdash;'} Nm</dd>
          <dt>Fuel type</dt><dd>${fuelMap[car.fuel] || car.fuel || '&mdash;'}</dd>
          <dt>Transmission</dt><dd>${car.transmission || '&mdash;'}</dd>
          <dt>ARAI mileage</dt><dd>${car.arai_kmpl || '&mdash;'} kmpl</dd>
          <dt>Real-world</dt><dd>${car.realworld_kmpl || '&mdash;'} kmpl</dd>
          <dt>Boot space</dt><dd>${car.boot_litres || '&mdash;'} L</dd>
          <dt>Ground clearance</dt><dd>${car.ground_clearance_mm || '&mdash;'} mm</dd>
          <dt>Cabin width</dt><dd>${car.cabin_width_mm || '&mdash;'} mm</dd>
          <dt>Rear legroom</dt><dd>${car.rear_legroom_mm || '&mdash;'} mm</dd>
          <dt>Airbags</dt><dd>${car.airbags || 0}</dd>
          <dt>NCAP stars</dt><dd>${car.ncap_stars > 0 ? formatStars(car.ncap_stars) + ' (' + car.ncap_stars + ')' : 'Not rated'}</dd>
          <dt>ADAS</dt><dd>${car.adas ? 'Yes &mdash; ' + (car.adas_features || []).join(', ') : 'No'}</dd>
        </dl>
      </section>

      <section class="detail-section">
        <h3 class="detail-section-title">Must-Have Checklist</h3>
        <ul class="must-haves-list">
          <li class="must-have-check ${(car.airbags || 0) >= 6 ? 'met' : 'unmet'}">${(car.airbags || 0) >= 6 ? '&#10003;' : '&#10007;'} 6 Airbags (has ${car.airbags || 0})</li>
          <li class="must-have-check ${car.ventilated_seats ? 'met' : 'unmet'}">${car.ventilated_seats ? '&#10003;' : '&#10007;'} Ventilated Seats</li>
          <li class="must-have-check ${car.connected_car ? 'met' : 'unmet'}">${car.connected_car ? '&#10003;' : '&#10007;'} Connected Car${car.connected_system ? ' (' + car.connected_system + ')' : ''}</li>
          <li class="must-have-check ${car.adas ? 'met' : 'unmet'}">${car.adas ? '&#10003;' : '&#10007;'} ADAS</li>
          <li class="must-have-check ${(car.ncap_stars || 0) >= 5 ? 'met' : 'unmet'}">${(car.ncap_stars || 0) >= 5 ? '&#10003;' : '&#10007;'} 5-Star NCAP${car.ncap_stars > 0 ? ' (' + car.ncap_stars + 'star)' : ''}</li>
          <li class="must-have-check ${car.sunroof && car.sunroof !== 'none' ? 'met' : 'unmet'}">${car.sunroof && car.sunroof !== 'none' ? '&#10003;' : '&#10007;'} Sunroof</li>
        </ul>
      </section>

      ${(car.known_issues || []).length > 0 ? `
      <section class="detail-section">
        <h3 class="detail-section-title">Known Issues</h3>
        <details>
          <summary style="cursor:pointer;font-size:0.88rem;padding:0.3rem 0">${car.known_issues.length} known issue${car.known_issues.length !== 1 ? 's' : ''} &mdash; click to expand</summary>
          <ul class="issues-list" style="margin-top:0.5rem">
            ${car.known_issues.map(i => `
              <li class="issue-item">
                <span class="severity-${i.severity.toLowerCase()}">${i.severity}</span>
                <span class="issue-text">${i.issue}</span>
              </li>
            `).join('')}
          </ul>
        </details>
      </section>
      ` : ''}

      <section class="detail-section">
        <h3 class="detail-section-title">Ownership &amp; Reliability</h3>
        <div class="ownership-grid">
          <div class="ownership-item"><span>Long-term reliability</span><span>${car.long_term_reliability_score || '&mdash;'}/10</span></div>
          <div class="ownership-item"><span>Future-proof</span><span>${car.future_proof_score || '&mdash;'}/10</span></div>
          <div class="ownership-item"><span>Parts availability</span><span>${car.parts_availability_score || '&mdash;'}/10</span></div>
          <div class="ownership-item"><span>Ease of servicing</span><span>${car.ease_of_servicing_score || '&mdash;'}/10</span></div>
          ${car.resale_3yr_pct ? `<div class="ownership-item"><span>Resale at 3yr</span><span>${car.resale_3yr_pct}%</span></div>` : ''}
          ${car.resale_5yr_pct ? `<div class="ownership-item"><span>Resale at 5yr</span><span>${car.resale_5yr_pct}%</span></div>` : ''}
        </div>
      </section>

      ${(car.service_centers_jodhpur || []).length > 0 ? `
      <section class="detail-section">
        <h3 class="detail-section-title">Service Centers in Jodhpur</h3>
        <div class="service-center-list">
          ${car.service_centers_jodhpur.map(sc => `
            <div class="service-center-card">
              <h4>${sc.name}</h4>
              <p class="service-center-meta">${sc.area} &middot; Rating: ${sc.rating}/5 &middot; Turnaround: ~${sc.turnaround_hours}hrs</p>
              <div class="service-center-actions">
                <a href="tel:${sc.phone}">&#128222; ${sc.phone}</a>
                <a href="${sc.maps_url}" target="_blank" rel="noopener">&#128205; Maps</a>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
      ` : ''}

      ${((car.pros || []).length > 0 || (car.cons || []).length > 0) ? `
      <section class="detail-section">
        <h3 class="detail-section-title">Pros &amp; Cons</h3>
        <div class="pros-cons-grid">
          <div>
            <p style="font-weight:700;font-size:0.8rem;color:var(--green);margin-bottom:0.4rem">PROS</p>
            <ul class="pros-list">${(car.pros || []).map(p => `<li>${p}</li>`).join('')}</ul>
          </div>
          <div>
            <p style="font-weight:700;font-size:0.8rem;color:var(--red);margin-bottom:0.4rem">CONS</p>
            <ul class="cons-list">${(car.cons || []).map(c => `<li>${c}</li>`).join('')}</ul>
          </div>
        </div>
      </section>
      ` : ''}

      <div class="detail-actions">
        <button class="btn-primary" id="dp-add-compare-btn">+ Add to Compare</button>
        <button class="btn-secondary" id="dp-share-btn">Share</button>
      </div>
    </div>
  `;

  // Wire buttons
  _panelEl.querySelector('#detail-back-btn').addEventListener('click', closeDetailPanel);
  _panelEl.querySelector('#detail-close-btn').addEventListener('click', closeDetailPanel);
  _panelEl.querySelector('#dp-share-btn').addEventListener('click', () => {
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('car', car.id);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl.toString()).then(() => alert('Link copied!'));
    } else {
      prompt('Copy this link:', shareUrl.toString());
    }
  });
  _panelEl.querySelector('#dp-add-compare-btn').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('suv:addToCompare', { detail: { car } }));
  });

  // Badges
  const badgesEl = _panelEl.querySelector('#dp-badges');
  if (vfmTag) {
    const vfmEl = document.createElement('span');
    vfmEl.className = `vfm-tag vfm-${vfmTag}`;
    vfmEl.textContent = vfmLabels[vfmTag];
    badgesEl.appendChild(vfmEl);
  }
  if (car.is_best_variant_for_user) {
    const bestEl = document.createElement('span');
    bestEl.className = 'best-badge';
    bestEl.textContent = 'Best Variant for You';
    badgesEl.appendChild(bestEl);
  }
  if (car.waiting_weeks_jodhpur != null) {
    const waitEl = document.createElement('span');
    waitEl.className = 'spec-chip';
    waitEl.textContent = getWaitingLabel(car.waiting_weeks_jodhpur);
    badgesEl.appendChild(waitEl);
  }

  // Ratings pills
  const ratingsGridEl = _panelEl.querySelector('#dp-ratings-grid');
  ratingDefs.forEach(({ key, label }) => {
    const pill = document.createElement('div');
    pill.className = 'rating-pill';
    pill.innerHTML = `<div class="rating-pill-label">${label}</div><div class="rating-pill-value">${car[key] != null ? car[key] : '&mdash;'}/10</div>`;
    ratingsGridEl.appendChild(pill);
  });

  // EMI calculator
  if (!isBaseline && exSR > 0) {
    const emiContainer = _panelEl.querySelector('#dp-emi-calc');
    if (emiContainer) renderEMICalculator(emiContainer, onRoad);
  }

  // Radar chart — guard window.Chart for Node/Jest environments
  const canvas = _panelEl.querySelector('#dp-radar-canvas');
  if (canvas && typeof window !== 'undefined' && window.Chart && baseline) {
    const labels = ratingDefs.map(d => d.label);
    const carData = ratingDefs.map(d => car[d.key] != null ? car[d.key] : 0);
    const baselineData = ratingDefs.map(d => baseline[d.key] != null ? baseline[d.key] : 0);
    _radarChart = new window.Chart(canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: `${car.brand} ${car.model}`,
            data: carData,
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderColor: 'rgba(99, 102, 241, 0.9)',
            pointBackgroundColor: 'rgba(99, 102, 241, 0.9)',
            borderWidth: 2,
            pointRadius: 3,
          },
          {
            label: 'Quanto (Your car)',
            data: baselineData,
            fill: true,
            backgroundColor: 'rgba(156, 163, 175, 0.15)',
            borderColor: 'rgba(156, 163, 175, 0.8)',
            pointBackgroundColor: 'rgba(156, 163, 175, 0.8)',
            borderWidth: 2,
            pointRadius: 3,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: { r: { min: 0, max: 10, ticks: { stepSize: 2, font: { size: 9 } }, pointLabels: { font: { size: 9 } } } },
        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 12 } } }
      }
    });
  }

  // Show panel
  requestAnimationFrame(() => {
    _panelEl.classList.add('open');
    _backdropEl.classList.add('visible');
    const closeBtn = _panelEl.querySelector('#detail-close-btn');
    if (closeBtn) closeBtn.focus();
  });
}

// Helpers
function fmtLakh(rupees) { return ((rupees || 0) / 100000).toFixed(2); }
```

### IMPORTANT NOTES FOR IMPLEMENTER

1. **Canvas reuse**: `_radarChart.destroy()` is called at the top of `renderDetailPanel` before rebuilding HTML. The `innerHTML` replacement creates a fresh canvas element each time, so there is no stale canvas reference after destroy.

2. **`window.Chart` guard**: The condition `typeof window !== 'undefined' && window.Chart && baseline` prevents errors in Jest (Node.js) where `window.Chart` does not exist.

3. **`renderEMICalculator` scoping**: The existing function uses `container.querySelector(...)` — it is safe with multiple instances because it scopes to the container, not `document`.

4. **`formatStars` in template literal**: The function is called inline in the HTML template string — `formatStars(car.ncap_stars)`. This works because `formatStars` is defined in module scope before `renderDetailPanel`.

### Commit message
```
feat(modules): add ui-detail.js with slide-in panel, radar chart, ratings, and EMI
```

---

## Task 5 — Wire detail panel into `modules/ui-home.js` card clicks

**Files to modify:** `C:\Users\Work\suv-compare\modules\ui-home.js`

### Step 1: Add import at top of file

After the last existing import line, add:
```js
import { renderDetailPanel } from './ui-detail.js';
```

Existing imports (do not change these):
```js
import { loadCarsData, getBaselineCar, getCarsForRanking } from './data.js';
import { getProfile } from './profile.js';
import { rankCars, getVFMTag, getBestVariantPerBrand } from './ranking.js';
import { renderFilters, applyFilters, getStoredFilters } from './ui-filters.js';
```

After adding, the import block becomes:
```js
import { loadCarsData, getBaselineCar, getCarsForRanking } from './data.js';
import { getProfile } from './profile.js';
import { rankCars, getVFMTag, getBestVariantPerBrand } from './ranking.js';
import { renderFilters, applyFilters, getStoredFilters } from './ui-filters.js';
import { renderDetailPanel } from './ui-detail.js';
```

### Step 2: Add click handler in `renderCarCard`

In the `renderCarCard(car, allRanked, baseline)` function, find the final `return card;` statement. Insert the following block immediately before it:

```js
  // Open detail panel on card click
  card.addEventListener('click', () => {
    renderDetailPanel(car, allRanked, baseline);
  });
```

The card already has `cursor: pointer` from `.car-card` in `styles/components.css`, so no CSS change is needed.

### Verification

The `renderCarCard` function signature is `renderCarCard(car, allRanked, baseline)` and it is already called with those three arguments from `renderCarList`. No signature change is needed.

### Commit message
```
feat(ui-home): wire card click to open detail panel
```

---

## Task 6 — Create `modules/ui-compare.js`

**Files to create:** `C:\Users\Work\suv-compare\modules\ui-compare.js`

### Full implementation

```js
// modules/ui-compare.js
import { loadCarsData, getBaselineCar, getCarsForRanking } from './data.js';
import { getProfile } from './profile.js';
import { rankCars, getVFMTag, getBestVariantPerBrand, calcTCO } from './ranking.js';
import { calcOnRoadPrice, calcLoanSummary } from './emi.js';

let _compareIds = [];
let _allRanked = [];
let _baseline = null;
let _barChart = null;
let _container = null;

// === Public entry point ===

export async function renderCompare(container) {
  _container = container;
  container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-muted)">Loading compare data...</p>';
  let data;
  try {
    data = await loadCarsData();
  } catch (err) {
    container.innerHTML = `<p style="color:var(--red)">Failed to load: ${err.message}</p>`;
    return;
  }
  const profile = getProfile();
  _baseline = getBaselineCar(data);
  const carsForRanking = getCarsForRanking(data);
  const ranked = rankCars(carsForRanking, profile, _baseline);
  _allRanked = getBestVariantPerBrand(ranked);

  window.removeEventListener('suv:addToCompare', _handleAddToCompare);
  window.addEventListener('suv:addToCompare', _handleAddToCompare);

  _renderCompareUI(container);
}

function _handleAddToCompare(e) {
  const car = e.detail && e.detail.car;
  if (!car || car.is_baseline) return;
  if (_compareIds.includes(car.id)) return;
  if (_compareIds.length >= 3) {
    alert('Maximum 3 cars in compare. Remove one first.');
    return;
  }
  _compareIds.push(car.id);
  if (_container) _renderCompareUI(_container);
}

// === Render UI ===

function _renderCompareUI(container) {
  if (_barChart) { _barChart.destroy(); _barChart = null; }
  container.innerHTML = '';

  const selectedCars = _compareIds.map(id => _allRanked.find(c => c.id === id)).filter(Boolean);
  const allCols = _baseline ? [_baseline, ...selectedCars] : selectedCars;

  // Controls row
  const controls = document.createElement('div');
  controls.className = 'compare-controls';
  const slots = document.createElement('div');
  slots.className = 'compare-car-slots';

  if (_baseline) {
    const baseSlot = document.createElement('div');
    baseSlot.className = 'compare-car-slot';
    baseSlot.innerHTML = `<span>${_baseline.brand} ${_baseline.model}</span><span class="locked-badge">Locked</span>`;
    slots.appendChild(baseSlot);
  }

  selectedCars.forEach(car => {
    const slot = document.createElement('div');
    slot.className = 'compare-car-slot';
    slot.innerHTML = `<span>${car.brand} ${car.model.substring(0, 12)}</span><button class="remove-btn" data-id="${car.id}" aria-label="Remove">x</button>`;
    slot.querySelector('.remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      _compareIds = _compareIds.filter(id => id !== car.id);
      _renderCompareUI(container);
    });
    slots.appendChild(slot);
  });

  if (selectedCars.length < 3) {
    const addBtn = document.createElement('button');
    addBtn.className = 'add-car-btn';
    addBtn.textContent = '+ Add car';
    addBtn.addEventListener('click', () => _openCarPicker(container));
    slots.appendChild(addBtn);
  }

  controls.appendChild(slots);
  container.appendChild(controls);

  // Diff toggle
  let showDiffsOnly = false;
  const diffRow = document.createElement('div');
  diffRow.className = 'diff-toggle-row';
  diffRow.innerHTML = '<input type="checkbox" id="diff-toggle"><label for="diff-toggle">Show differences only</label>';
  diffRow.querySelector('#diff-toggle').addEventListener('change', (e) => {
    showDiffsOnly = e.target.checked;
    rebuildTable();
  });
  container.appendChild(diffRow);

  // TCO bar chart
  if (allCols.length > 1) {
    const barSection = document.createElement('section');
    barSection.className = 'detail-section';
    barSection.style.marginBottom = '1rem';
    barSection.innerHTML = '<h3 class="detail-section-title">5-Year TCO Comparison</h3><div class="bar-chart-container"><canvas id="compare-bar-canvas"></canvas></div>';
    container.appendChild(barSection);

    requestAnimationFrame(() => {
      const canvas = document.getElementById('compare-bar-canvas');
      if (!canvas || typeof window === 'undefined' || !window.Chart) return;
      const profile = getProfile();
      const labels = allCols.map(c => c.brand + ' ' + c.model.substring(0, 8));
      const tcoData = allCols.map(c => {
        if (c.is_baseline || !c.ex_showroom_jodhpur) return 0;
        const tco = c.tco != null ? c.tco : calcTCO(c, profile);
        return Math.round(tco / 100000 * 10) / 10;
      });
      _barChart = new window.Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: '5-yr TCO (Lakh)',
            data: tcoData,
            backgroundColor: allCols.map((c, i) => i === 0 ? 'rgba(156,163,175,0.7)' : 'rgba(99,102,241,0.7)'),
            borderColor: allCols.map((c, i) => i === 0 ? 'rgba(156,163,175,1)' : 'rgba(99,102,241,1)'),
            borderWidth: 1,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { title: { display: true, text: 'Rs Lakh' }, beginAtZero: true },
            x: { ticks: { font: { size: 10 } } }
          }
        }
      });
    });
  }

  // Table wrapper
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'compare-wrapper';
  container.appendChild(tableWrapper);

  function rebuildTable() {
    tableWrapper.innerHTML = '';
    if (allCols.length < 2) {
      tableWrapper.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;padding:1rem 0">Add at least one car to compare with the Quanto.</p>';
      return;
    }
    tableWrapper.appendChild(_buildTable(allCols, showDiffsOnly));
  }

  rebuildTable();
}

// === Build table ===

function _buildTable(cols, diffsOnly) {
  const fuelMap = { petrol_turbo: 'Petrol Turbo', diesel: 'Diesel', strong_hybrid: 'Strong Hybrid', mild_hybrid: 'Mild Hybrid', petrol: 'Petrol NA' };
  const table = document.createElement('table');
  table.className = 'compare-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const thLabel = document.createElement('th');
  thLabel.className = 'compare-sticky-col';
  thLabel.textContent = 'Feature';
  headRow.appendChild(thLabel);

  cols.forEach((car, i) => {
    const th = document.createElement('th');
    th.innerHTML = `<strong>${car.brand} ${car.model}</strong><br><span style="font-size:0.73rem;font-weight:400;color:var(--text-muted)">${car.variant.substring(0, 22)}</span>${i === 0 ? '<span class="locked-badge">Your Car</span>' : ''}`;
    if (i === 0) th.classList.add('compare-baseline-col');
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  function addSection(title) {
    const tr = document.createElement('tr');
    tr.className = 'compare-section-header';
    const td = document.createElement('td');
    td.colSpan = cols.length + 1;
    td.textContent = title;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  function addRow(label, getValue, compareMode) {
    const values = cols.map(c => getValue(c));
    if (diffsOnly && values.slice(1).every(v => v === values[0])) return;
    const tr = document.createElement('tr');
    const tdLabel = document.createElement('td');
    tdLabel.className = 'compare-sticky-col';
    tdLabel.textContent = label;
    tr.appendChild(tdLabel);
    values.forEach((val, i) => {
      const td = document.createElement('td');
      td.textContent = val;
      if (i === 0) {
        td.classList.add('compare-baseline-col');
      } else if (compareMode) {
        const bv = parseFloat(String(values[0]).replace(/[^0-9.-]/g, '')) || 0;
        const tv = parseFloat(String(val).replace(/[^0-9.-]/g, '')) || 0;
        if (compareMode === 'higher_better' && tv > bv) td.classList.add('compare-better');
        else if (compareMode === 'higher_better' && tv < bv) td.classList.add('compare-worse');
        else if (compareMode === 'lower_better' && tv < bv) td.classList.add('compare-better');
        else if (compareMode === 'lower_better' && tv > bv) td.classList.add('compare-worse');
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  const profile = getProfile();

  addSection('Pricing');
  addRow('Ex-showroom', c => c.ex_showroom_jodhpur > 0 ? `Rs ${(c.ex_showroom_jodhpur/100000).toFixed(2)}L` : 'Your car', 'lower_better');
  addRow('On-road (est.)', c => c.ex_showroom_jodhpur > 0 ? `Rs ${(calcOnRoadPrice(c.ex_showroom_jodhpur)/100000).toFixed(2)}L` : '-', 'lower_better');
  addRow('5yr TCO', c => { if (c.is_baseline || !c.ex_showroom_jodhpur) return '-'; const t = c.tco != null ? c.tco : calcTCO(c, profile); return `Rs ${(t/100000).toFixed(1)}L`; }, 'lower_better');
  addRow('EMI (20% down, 60m, 8.5%)', c => { if (c.is_baseline || !c.ex_showroom_jodhpur) return '-'; const s = calcLoanSummary(calcOnRoadPrice(c.ex_showroom_jodhpur), 20, 8.5, 60); return `Rs ${s.emi.toLocaleString('en-IN')}`; }, 'lower_better');
  addRow('Annual insurance', c => c.annual_insurance_estimate ? `Rs ${c.annual_insurance_estimate.toLocaleString('en-IN')}` : '-', 'lower_better');
  addRow('Annual service', c => c.annual_maintenance_estimate ? `Rs ${c.annual_maintenance_estimate.toLocaleString('en-IN')}` : '-', 'lower_better');

  addSection('Engine & Performance');
  addRow('Engine', c => `${c.engine_cc}cc ${fuelMap[c.fuel] || c.fuel}`);
  addRow('Power (bhp)', c => `${c.power_bhp}`, 'higher_better');
  addRow('Torque (Nm)', c => `${c.torque_nm}`, 'higher_better');
  addRow('Transmission', c => c.transmission || '-');
  addRow('ARAI mileage', c => `${c.arai_kmpl} kmpl`, 'higher_better');
  addRow('Real-world mileage', c => `${c.realworld_kmpl} kmpl`, 'higher_better');

  addSection('Safety');
  addRow('NCAP stars', c => c.ncap_stars > 0 ? `${c.ncap_stars} star` : 'Not rated', 'higher_better');
  addRow('Airbags', c => `${c.airbags || 0}`, 'higher_better');
  addRow('ADAS', c => c.adas ? 'Yes' : 'No');
  addRow('ADAS features', c => c.adas ? (c.adas_features || []).join(', ') : '-');

  addSection('Features');
  addRow('Sunroof', c => c.sunroof && c.sunroof !== 'none' ? c.sunroof.replace('_', ' ') : 'None');
  addRow('Climate control', c => c.climate_control || '-');
  addRow('Infotainment', c => c.infotainment_inches ? `${c.infotainment_inches} inch` : 'None', 'higher_better');
  addRow('Wireless CarPlay', c => c.wireless_carplay ? 'Yes' : 'No');
  addRow('Ventilated seats', c => c.ventilated_seats ? 'Yes' : 'No');
  addRow('Connected car', c => c.connected_car ? (c.connected_system || 'Yes') : 'No');

  addSection('Space & Comfort');
  addRow('Boot space (L)', c => `${c.boot_litres}L`, 'higher_better');
  addRow('Ground clearance', c => `${c.ground_clearance_mm}mm`, 'higher_better');
  addRow('Rear legroom', c => `${c.rear_legroom_mm}mm`, 'higher_better');
  addRow('Cabin width', c => `${c.cabin_width_mm}mm`, 'higher_better');

  addSection('Ownership & Reliability');
  addRow('Long-term reliability /10', c => `${c.long_term_reliability_score || '-'}`, 'higher_better');
  addRow('Future-proof /10', c => `${c.future_proof_score || '-'}`, 'higher_better');
  addRow('Parts availability /10', c => `${c.parts_availability_score || '-'}`, 'higher_better');
  addRow('Ease of servicing /10', c => `${c.ease_of_servicing_score || '-'}`, 'higher_better');
  addRow('Resale at 3yr (%)', c => c.resale_3yr_pct ? `${c.resale_3yr_pct}%` : '-', 'higher_better');
  addRow('Resale at 5yr (%)', c => c.resale_5yr_pct ? `${c.resale_5yr_pct}%` : '-', 'higher_better');
  addRow('Service centers (Jodhpur)', c => `${(c.service_centers_jodhpur || []).length}`, 'higher_better');

  addSection('Quality Ratings (/10)');
  [
    ['rating_engine', 'Engine'],
    ['rating_ride_handling', 'Ride+Handling'],
    ['rating_nvh', 'NVH (quietness)'],
    ['rating_fit_finish', 'Fit+Finish'],
    ['rating_interior_quality', 'Interior Quality'],
    ['rating_interior_space', 'Interior Space'],
    ['rating_boot_space', 'Boot Space'],
    ['rating_features_tech', 'Features+Tech'],
    ['rating_service_quality', 'Service Quality'],
    ['ratings_total', 'Overall Rating (avg)'],
  ].forEach(([key, label]) => {
    addRow(label, c => c[key] != null ? `${c[key]}/10` : '-', 'higher_better');
  });

  return table;
}

// === Car picker modal ===

function _openCarPicker(container) {
  const existing = document.getElementById('car-picker-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'car-picker-modal';
  modal.className = 'car-picker-modal';

  const backdrop = document.createElement('div');
  backdrop.className = 'car-picker-backdrop';
  backdrop.addEventListener('click', () => modal.remove());

  const sheet = document.createElement('div');
  sheet.className = 'car-picker-sheet';
  sheet.innerHTML = '<h3>Add a car to compare</h3><input type="text" class="car-picker-search" placeholder="Search brand or model..." id="picker-search"><div class="car-picker-list" id="picker-list"></div>';

  const allPickable = _allRanked.filter(c => !c.is_baseline);

  function renderList(filter) {
    const list = sheet.querySelector('#picker-list');
    list.innerHTML = '';
    const filtered = filter
      ? allPickable.filter(c => `${c.brand} ${c.model} ${c.variant}`.toLowerCase().includes(filter.toLowerCase()))
      : allPickable;
    if (filtered.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:0.5rem 0">No matches</p>';
      return;
    }
    filtered.forEach(car => {
      const item = document.createElement('div');
      const already = _compareIds.includes(car.id);
      item.className = `car-picker-item${already ? ' disabled' : ''}`;
      item.innerHTML = `<div><strong>${car.brand} ${car.model}</strong><br><span style="font-size:0.78rem;color:var(--text-muted)">${car.variant}</span></div><div style="font-size:0.8rem;color:var(--accent)">#${car.rank}</div>`;
      if (!already) {
        item.addEventListener('click', () => {
          _compareIds.push(car.id);
          modal.remove();
          _renderCompareUI(container);
        });
      }
      list.appendChild(item);
    });
  }

  sheet.querySelector('#picker-search').addEventListener('input', e => renderList(e.target.value));
  renderList('');

  modal.appendChild(backdrop);
  modal.appendChild(sheet);
  document.body.appendChild(modal);
  sheet.querySelector('#picker-search').focus();
}
```

### Commit message
```
feat(modules): add ui-compare.js with side-by-side table, TCO chart, and picker modal
```

---

## Task 7 — Update `app.js` to wire compare tab and handle `?car=` URL param

**Files to modify:** `C:\Users\Work\suv-compare\app.js`

### Step 7a: Add imports at top of file

After the existing 3 import lines, add:

```js
import { renderCompare } from './modules/ui-compare.js';
import { renderDetailPanel } from './modules/ui-detail.js';
```

The complete import block becomes:
```js
import { loadCarsData } from './modules/data.js';
import { renderHome } from './modules/ui-home.js';
import { renderEMICalculator, calcOnRoadPrice } from './modules/emi.js';
import { renderCompare } from './modules/ui-compare.js';
import { renderDetailPanel } from './modules/ui-detail.js';
```

### Step 7b: Replace the compare tab branch in `switchTab`

Find this line in `switchTab`:
```js
  if (tabId === 'compare') renderComparePlaceholder();
```

Replace it with:
```js
  if (tabId === 'compare') {
    const pane = document.getElementById('tab-compare');
    if (!pane.dataset.rendered) {
      pane.dataset.rendered = '1';
      renderCompare(pane);
    }
  }
```

### Step 7c: Delete `renderComparePlaceholder` function

Remove the entire function body (lines 80-91 in the original file):
```js
function renderComparePlaceholder() {
  const pane = document.getElementById('tab-compare');
  if (pane.dataset.rendered) return;
  pane.dataset.rendered = '1';
  pane.innerHTML = `
    <div style="text-align:center;padding:3rem 1rem;color:var(--text-muted)">
      <div style="font-size:2rem;margin-bottom:1rem">&#9878;&#65039;</div>
      <h2 style="margin-bottom:0.5rem">Compare Cars</h2>
      <p>Side-by-side comparison coming in Plan 2.</p>
    </div>
  `;
}
```

### Step 7d: Handle `?car=id` on page load — add to `init()` function

In the `init()` function, after the `switchTab('home');` call, append:

```js
  // Auto-open detail panel if URL contains ?car=id
  const _urlParams = new URLSearchParams(window.location.search);
  const _carId = _urlParams.get('car');
  if (_carId) {
    loadCarsData().then(data => {
      Promise.all([
        import('./modules/data.js'),
        import('./modules/ranking.js'),
        import('./modules/profile.js'),
      ]).then(([dataMod, rankMod, profileMod]) => {
        const profile = profileMod.getProfile();
        const baseline = dataMod.getBaselineCar(data);
        const ranked = rankMod.rankCars(dataMod.getCarsForRanking(data), profile, baseline);
        const allRanked = rankMod.getBestVariantPerBrand(ranked);
        const found = data.cars.find(c => c.id === _carId);
        if (found) {
          const rankedCar = allRanked.find(c => c.id === _carId) || found;
          renderDetailPanel(rankedCar, allRanked, baseline);
        }
      });
    }).catch(() => {});
  }
```

NOTE: The dynamic imports (`import('./modules/...')`) resolve from the browser's module cache because these modules are already imported statically at the top of `app.js` and in other modules. No extra network requests occur. This pattern is safe in browsers and fails gracefully (the `.catch(() => {})` swallows errors silently).

### Commit message
```
feat(app): wire compare tab to ui-compare and auto-open detail panel from ?car= URL param
```

---

## Task 8 — Create `tests/ui-detail.test.js`

**Files to create:** `C:\Users\Work\suv-compare\tests\ui-detail.test.js`

These tests cover only the three pure helper functions. No DOM or Chart.js mocking needed.

```js
// tests/ui-detail.test.js
import { calcRatingsTotal, formatStars, getWaitingLabel } from '../modules/ui-detail.js';

describe('calcRatingsTotal', () => {
  test('returns correct average of 9 equal fields', () => {
    const car = {
      rating_engine: 8, rating_ride_handling: 8, rating_nvh: 8,
      rating_fit_finish: 8, rating_interior_quality: 8, rating_interior_space: 8,
      rating_boot_space: 8, rating_features_tech: 8, rating_service_quality: 8,
    };
    expect(calcRatingsTotal(car)).toBe(8.0);
  });

  test('treats missing fields as 0', () => {
    const car = { rating_engine: 9 };
    // 9 / 9 fields = 1.0
    expect(calcRatingsTotal(car)).toBe(1.0);
  });

  test('rounds to 1 decimal', () => {
    const car = {
      rating_engine: 7, rating_ride_handling: 8, rating_nvh: 9,
      rating_fit_finish: 7, rating_interior_quality: 8, rating_interior_space: 9,
      rating_boot_space: 7, rating_features_tech: 8, rating_service_quality: 9,
    };
    // sum 72 / 9 = 8.0
    expect(calcRatingsTotal(car)).toBe(8.0);
  });

  test('all zeros returns 0.0', () => {
    const car = {
      rating_engine: 0, rating_ride_handling: 0, rating_nvh: 0,
      rating_fit_finish: 0, rating_interior_quality: 0, rating_interior_space: 0,
      rating_boot_space: 0, rating_features_tech: 0, rating_service_quality: 0,
    };
    expect(calcRatingsTotal(car)).toBe(0.0);
  });

  test('Quanto baseline values produce 4.0', () => {
    const quanto = {
      rating_engine: 5, rating_ride_handling: 5, rating_nvh: 3,
      rating_fit_finish: 5, rating_interior_quality: 4, rating_interior_space: 4,
      rating_boot_space: 3, rating_features_tech: 2, rating_service_quality: 5,
    };
    // sum 36 / 9 = 4.0
    expect(calcRatingsTotal(quanto)).toBe(4.0);
  });

  test('Kia Seltos GTX+ values produce 8.2', () => {
    const seltos = {
      rating_engine: 8, rating_ride_handling: 8, rating_nvh: 8,
      rating_fit_finish: 9, rating_interior_quality: 9, rating_interior_space: 9,
      rating_boot_space: 8, rating_features_tech: 9, rating_service_quality: 6,
    };
    // sum 74 / 9 = 8.222 -> 8.2
    expect(calcRatingsTotal(seltos)).toBe(8.2);
  });

  test('VW Taigun values produce 7.6', () => {
    const taigun = {
      rating_engine: 9, rating_ride_handling: 9, rating_nvh: 8,
      rating_fit_finish: 9, rating_interior_quality: 8, rating_interior_space: 7,
      rating_boot_space: 7, rating_features_tech: 7, rating_service_quality: 4,
    };
    // sum 68 / 9 = 7.555 -> 7.6
    expect(calcRatingsTotal(taigun)).toBe(7.6);
  });

  test('returns number type', () => {
    expect(typeof calcRatingsTotal({})).toBe('number');
  });

  test('near-max values round correctly', () => {
    const car = {
      rating_engine: 10, rating_ride_handling: 10, rating_nvh: 10,
      rating_fit_finish: 10, rating_interior_quality: 10, rating_interior_space: 10,
      rating_boot_space: 10, rating_features_tech: 10, rating_service_quality: 9,
    };
    // sum 89 / 9 = 9.888 -> 9.9
    expect(calcRatingsTotal(car)).toBe(9.9);
  });

  test('Honda Elevate values produce 7.7', () => {
    const elevate = {
      rating_engine: 7, rating_ride_handling: 8, rating_nvh: 8,
      rating_fit_finish: 8, rating_interior_quality: 7, rating_interior_space: 9,
      rating_boot_space: 9, rating_features_tech: 5, rating_service_quality: 8,
    };
    // sum 69 / 9 = 7.666 -> 7.7
    expect(calcRatingsTotal(elevate)).toBe(7.7);
  });
});

describe('formatStars', () => {
  test('5 stars returns 5 filled stars', () => {
    expect(formatStars(5)).toBe('★★★★★');
  });

  test('0 stars returns 5 empty stars', () => {
    expect(formatStars(0)).toBe('☆☆☆☆☆');
  });

  test('3 stars returns 3 filled 2 empty', () => {
    expect(formatStars(3)).toBe('★★★☆☆');
  });

  test('4 stars returns 4 filled 1 empty', () => {
    expect(formatStars(4)).toBe('★★★★☆');
  });

  test('value above 5 is clamped to 5 filled', () => {
    expect(formatStars(10)).toBe('★★★★★');
  });

  test('negative value is clamped to 0', () => {
    expect(formatStars(-2)).toBe('☆☆☆☆☆');
  });

  test('returns string type', () => {
    expect(typeof formatStars(3)).toBe('string');
  });
});

describe('getWaitingLabel', () => {
  test('0 weeks returns Available Now', () => {
    expect(getWaitingLabel(0)).toBe('Available Now');
  });

  test('1 week returns singular label', () => {
    expect(getWaitingLabel(1)).toBe('~1 week wait');
  });

  test('3 weeks returns plural label', () => {
    expect(getWaitingLabel(3)).toBe('~3 weeks wait');
  });

  test('4 weeks returns standard label', () => {
    expect(getWaitingLabel(4)).toBe('~4 weeks wait');
  });

  test('5 weeks returns moderate label', () => {
    expect(getWaitingLabel(5)).toBe('~5 weeks wait (moderate)');
  });

  test('8 weeks returns moderate label', () => {
    expect(getWaitingLabel(8)).toBe('~8 weeks wait (moderate)');
  });

  test('9 weeks returns long label', () => {
    expect(getWaitingLabel(9)).toBe('9+ weeks wait (long)');
  });

  test('returns string type', () => {
    expect(typeof getWaitingLabel(2)).toBe('string');
  });
});
```

### Run tests

```
node --experimental-vm-modules node_modules/jest/bin/jest.js --no-coverage tests/ui-detail.test.js
```

Expected: 27 tests pass, 0 fail.

Full suite regression check:
```
node --experimental-vm-modules node_modules/jest/bin/jest.js --no-coverage
```

Expected: All 41+ tests (existing 14 + new 27) pass.

### Commit message
```
test(ui-detail): add 27 unit tests for pure helper functions
```

---

## Implementation Order & Dependencies

| Order | Task | Depends on |
|---|---|---|
| 1 | Expand `cars-data.json` with rating fields | Nothing |
| 2 | Add CSS to `styles/components.css` | Nothing |
| 3 | Add Chart.js CDN tag to `index.html` | Nothing |
| 4 | Create `modules/ui-detail.js` | Tasks 1, 2, 3 |
| 5 | Wire clicks in `modules/ui-home.js` | Task 4 |
| 6 | Create `modules/ui-compare.js` | Tasks 1, 2, 3 |
| 7 | Update `app.js` | Tasks 4, 6 |
| 8 | Create `tests/ui-detail.test.js` | Task 4 |

Tasks 1, 2, 3 are independent and can be done in parallel. Tasks 4 and 6 are independent of each other. Tasks 5, 7, 8 depend on task 4.

---

## Critical Pitfalls

1. **Chart.js canvas reuse**: Always call `_radarChart.destroy()` before creating a new Chart. The `innerHTML` replacement creates a new canvas element, so after destroy the old reference is stale — this is correct and intentional.

2. **`window.Chart` in Jest**: Jest runs in Node.js. The guard `typeof window !== 'undefined' && window.Chart` prevents ReferenceError. Do not remove this guard.

3. **`renderEMICalculator` ID scoping**: The function uses `container.querySelector(...)` not `document.getElementById(...)`. Multiple instances on the page are safe.

4. **`_handleAddToCompare` reference stability**: It must be a module-level named function (not an inline arrow) so `removeEventListener` can identify and remove the same reference.

5. **`ratings_total` in JSON**: This is a pre-stored value. `calcRatingsTotal` is a fallback. Both must remain.

6. **Sticky column z-index stacking**: `.compare-sticky-col` z-index 4, thead has z-index 5, `thead .compare-sticky-col` has z-index 6. Do not alter these values.

7. **URL cleanup on close**: `window.history.replaceState` must remove `?car=` when panel closes, otherwise a back-navigation will re-open the panel.

---

## Manual Smoke Test Checklist

After all tasks, open `npx serve .` at `C:\Users\Work\suv-compare\` and verify:

- [ ] Home tab loads and all 10 car cards are visible
- [ ] Clicking a car card opens the detail panel (slides in from right)
- [ ] Radar chart renders with 2 datasets (car vs Quanto baseline)
- [ ] 9 rating pills + overall total are shown
- [ ] EMI calculator inside panel is functional (slider updates EMI)
- [ ] Service center phone links and Maps links are present
- [ ] Escape key or x button closes the panel
- [ ] URL shows `?car=<id>` when panel is open; cleared on close
- [ ] Navigate directly to `?car=hyundai-creta-sx-opt-petrol-dct` — panel auto-opens
- [ ] Compare tab: Quanto locked in column 0 with "Locked" badge
- [ ] "+ Add car" button opens picker modal; search filters the list
- [ ] After adding 3 cars, "+ Add car" button disappears
- [ ] TCO bar chart renders with correct data
- [ ] Green/red cell coloring: lower TCO = green, higher airbags = green
- [ ] "Show differences only" toggle hides identical rows correctly
- [ ] On narrow viewport (375px), table scrolls horizontally; first column stays sticky
- [ ] Dark mode applies to detail panel and compare table
- [ ] "Add to Compare" button in detail panel adds car to compare tab
