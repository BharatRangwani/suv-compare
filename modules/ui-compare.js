// modules/ui-compare.js
// Compare tab — up to 3 cars vs Quanto baseline

import { loadCarsData, getBaselineCar, getCarsForRanking } from './data.js';
import { rankCars, calcTCO, getBestVariantPerBrand } from './ranking.js';
import { getProfile } from './profile.js';
import { calcOnRoadPrice, calcEMI } from './emi.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtLakh(paise) {
  if (paise == null || isNaN(paise)) return '—';
  return '₹' + (paise / 100000).toFixed(2) + ' L';
}

function fmtRating(val) {
  if (val == null || val === '') return '—';
  return val + '/10';
}

function fmtYesNo(val) {
  if (val == null) return '—';
  return val ? 'Yes' : 'No';
}

function fmtStars(n) {
  if (n == null || n === '') return '—';
  const stars = Math.round(Number(n));
  if (stars <= 0) return 'Unrated';
  return '★'.repeat(stars) + '☆'.repeat(Math.max(0, 5 - stars));
}

function fmtSunroof(val) {
  if (!val || val === 'none') return 'None';
  if (val === 'single_pane') return 'Single';
  if (val === 'panoramic') return 'Panoramic';
  return String(val);
}

function fmtFuel(val) {
  const map = {
    petrol_turbo: 'Petrol Turbo',
    petrol: 'Petrol NA',
    diesel: 'Diesel',
    strong_hybrid: 'Strong Hybrid',
    mild_hybrid: 'Mild Hybrid',
  };
  return map[val] || (val || '—');
}

function fmtConnected(val, system) {
  if (!val) return 'No';
  return system || 'Yes';
}

// ─── comparison direction: true = higher is better ───────────────────────────

const HIGHER_IS_BETTER = true;
const LOWER_IS_BETTER  = false;

// ─── row definitions ──────────────────────────────────────────────────────────
// Each row: { label, key, format, direction }
// direction: true = higher better, false = lower better, null = no colouring

function buildRowDefs() {
  return [
    // PRICING
    { _section: 'PRICING' },
    {
      label: 'Ex-showroom (₹L)',
      getValue: (car) => car.ex_showroom_jodhpur,
      format: (car) => fmtLakh(car.ex_showroom_jodhpur),
      rawVal: (car) => car.ex_showroom_jodhpur,
      direction: LOWER_IS_BETTER,
    },
    {
      label: 'On-road Jodhpur (₹L)',
      getValue: (car) => calcOnRoadPrice(car.ex_showroom_jodhpur),
      format: (car) => fmtLakh(calcOnRoadPrice(car.ex_showroom_jodhpur)),
      rawVal: (car) => calcOnRoadPrice(car.ex_showroom_jodhpur),
      direction: LOWER_IS_BETTER,
    },
    {
      label: '5-yr TCO (₹L)',
      getValue: (car) => car.tco != null ? car.tco : null,
      format: (car) => car.tco != null ? fmtLakh(car.tco) : '—',
      rawVal: (car) => car.tco,
      direction: LOWER_IS_BETTER,
    },
    {
      label: 'Monthly EMI (₹)',
      getValue: (car) => {
        const onRoad = calcOnRoadPrice(car.ex_showroom_jodhpur);
        const principal = Math.round(onRoad * 0.80);
        return calcEMI(principal, 8.5, 60);
      },
      format: (car) => {
        const onRoad = calcOnRoadPrice(car.ex_showroom_jodhpur);
        const principal = Math.round(onRoad * 0.80);
        const emi = calcEMI(principal, 8.5, 60);
        return '₹' + emi.toLocaleString('en-IN');
      },
      rawVal: (car) => {
        const onRoad = calcOnRoadPrice(car.ex_showroom_jodhpur);
        const principal = Math.round(onRoad * 0.80);
        return calcEMI(principal, 8.5, 60);
      },
      direction: LOWER_IS_BETTER,
    },
    {
      label: 'Annual insurance (₹)',
      getValue: (car) => car.annual_insurance_estimate,
      format: (car) => car.annual_insurance_estimate != null
        ? '₹' + car.annual_insurance_estimate.toLocaleString('en-IN')
        : '—',
      rawVal: (car) => car.annual_insurance_estimate,
      direction: LOWER_IS_BETTER,
    },
    {
      label: 'Annual maintenance (₹)',
      getValue: (car) => car.annual_maintenance_estimate,
      format: (car) => car.annual_maintenance_estimate != null
        ? '₹' + car.annual_maintenance_estimate.toLocaleString('en-IN')
        : '—',
      rawVal: (car) => car.annual_maintenance_estimate,
      direction: LOWER_IS_BETTER,
    },

    // ENGINE
    { _section: 'ENGINE' },
    {
      label: 'Engine (cc)',
      format: (car) => car.engine_cc != null ? String(car.engine_cc) : '—',
      rawVal: (car) => car.engine_cc,
      direction: null,
    },
    {
      label: 'Power (bhp)',
      format: (car) => car.power_bhp != null ? String(car.power_bhp) : '—',
      rawVal: (car) => car.power_bhp,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Torque (Nm)',
      format: (car) => car.torque_nm != null ? String(car.torque_nm) : '—',
      rawVal: (car) => car.torque_nm,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Fuel type',
      format: (car) => fmtFuel(car.fuel),
      rawVal: (car) => car.fuel,
      direction: null,
    },
    {
      label: 'Transmission',
      format: (car) => car.transmission || '—',
      rawVal: (car) => car.transmission,
      direction: null,
    },
    {
      label: 'ARAI mileage (kmpl)',
      format: (car) => car.arai_kmpl != null ? String(car.arai_kmpl) : '—',
      rawVal: (car) => car.arai_kmpl,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Real-world mileage (kmpl)',
      format: (car) => car.realworld_kmpl != null ? String(car.realworld_kmpl) : '—',
      rawVal: (car) => car.realworld_kmpl,
      direction: HIGHER_IS_BETTER,
    },

    // SAFETY
    { _section: 'SAFETY' },
    {
      label: 'Airbags',
      format: (car) => car.airbags != null ? String(car.airbags) : '—',
      rawVal: (car) => car.airbags,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'NCAP stars',
      format: (car) => fmtStars(car.ncap_stars),
      rawVal: (car) => car.ncap_stars,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'ADAS',
      format: (car) => fmtYesNo(car.adas),
      rawVal: (car) => car.adas ? 1 : 0,
      direction: HIGHER_IS_BETTER,
    },

    // FEATURES
    { _section: 'FEATURES' },
    {
      label: 'Ventilated seats',
      format: (car) => fmtYesNo(car.ventilated_seats),
      rawVal: (car) => car.ventilated_seats ? 1 : 0,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Sunroof',
      format: (car) => fmtSunroof(car.sunroof),
      rawVal: (car) => {
        const m = { none: 0, single_pane: 1, panoramic: 2 };
        return m[car.sunroof] != null ? m[car.sunroof] : 0;
      },
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Connected car',
      format: (car) => fmtConnected(car.connected_car, car.connected_system),
      rawVal: (car) => car.connected_car ? 1 : 0,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Wireless CarPlay',
      format: (car) => fmtYesNo(car.wireless_carplay),
      rawVal: (car) => car.wireless_carplay ? 1 : 0,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Infotainment (inches)',
      format: (car) => car.infotainment_inches ? String(car.infotainment_inches) + '"' : '—',
      rawVal: (car) => car.infotainment_inches || 0,
      direction: HIGHER_IS_BETTER,
    },

    // SPACE
    { _section: 'SPACE' },
    {
      label: 'Boot (litres)',
      format: (car) => car.boot_litres != null ? String(car.boot_litres) : '—',
      rawVal: (car) => car.boot_litres,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Ground clearance (mm)',
      format: (car) => car.ground_clearance_mm != null ? String(car.ground_clearance_mm) : '—',
      rawVal: (car) => car.ground_clearance_mm,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Rear legroom (mm)',
      format: (car) => car.rear_legroom_mm != null ? String(car.rear_legroom_mm) : '—',
      rawVal: (car) => car.rear_legroom_mm,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Cabin width (mm)',
      format: (car) => car.cabin_width_mm != null ? String(car.cabin_width_mm) : '—',
      rawVal: (car) => car.cabin_width_mm,
      direction: HIGHER_IS_BETTER,
    },

    // OWNERSHIP
    { _section: 'OWNERSHIP' },
    {
      label: 'Waiting period (weeks)',
      format: (car) => car.waiting_weeks_jodhpur != null ? String(car.waiting_weeks_jodhpur) : '—',
      rawVal: (car) => car.waiting_weeks_jodhpur,
      direction: LOWER_IS_BETTER,
    },
    {
      label: 'Resale 3yr (%)',
      format: (car) => car.resale_3yr_pct != null ? car.resale_3yr_pct + '%' : '—',
      rawVal: (car) => car.resale_3yr_pct,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Resale 5yr (%)',
      format: (car) => car.resale_5yr_pct != null ? car.resale_5yr_pct + '%' : '—',
      rawVal: (car) => car.resale_5yr_pct,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Long-term reliability (/10)',
      format: (car) => fmtRating(car.long_term_reliability_score),
      rawVal: (car) => car.long_term_reliability_score,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Parts availability (/10)',
      format: (car) => fmtRating(car.parts_availability_score),
      rawVal: (car) => car.parts_availability_score,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Ease of servicing (/10)',
      format: (car) => fmtRating(car.ease_of_servicing_score),
      rawVal: (car) => car.ease_of_servicing_score,
      direction: HIGHER_IS_BETTER,
    },

    // RATINGS
    { _section: 'RATINGS' },
    {
      label: 'Engine rating (/10)',
      format: (car) => fmtRating(car.rating_engine),
      rawVal: (car) => car.rating_engine,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Ride+Handling (/10)',
      format: (car) => fmtRating(car.rating_ride_handling),
      rawVal: (car) => car.rating_ride_handling,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'NVH (/10)',
      format: (car) => fmtRating(car.rating_nvh),
      rawVal: (car) => car.rating_nvh,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Fit+Finish (/10)',
      format: (car) => fmtRating(car.rating_fit_finish),
      rawVal: (car) => car.rating_fit_finish,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Interior Quality (/10)',
      format: (car) => fmtRating(car.rating_interior_quality),
      rawVal: (car) => car.rating_interior_quality,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Interior Space (/10)',
      format: (car) => fmtRating(car.rating_interior_space),
      rawVal: (car) => car.rating_interior_space,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Boot Space (/10)',
      format: (car) => fmtRating(car.rating_boot_space),
      rawVal: (car) => car.rating_boot_space,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Features+Tech (/10)',
      format: (car) => fmtRating(car.rating_features_tech),
      rawVal: (car) => car.rating_features_tech,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Service Quality (/10)',
      format: (car) => fmtRating(car.rating_service_quality),
      rawVal: (car) => car.rating_service_quality,
      direction: HIGHER_IS_BETTER,
    },
    {
      label: 'Overall Rating (/10)',
      format: (car) => fmtRating(car.ratings_total),
      rawVal: (car) => car.ratings_total,
      direction: HIGHER_IS_BETTER,
    },
  ];
}

// ─── colour helper ────────────────────────────────────────────────────────────

function getCellClass(rowDef, baselineCar, selectedCar) {
  if (rowDef.direction == null) return '';
  const bVal = rowDef.rawVal(baselineCar);
  const sVal = rowDef.rawVal(selectedCar);
  if (bVal == null || sVal == null || bVal === sVal) return '';
  const selectedIsBetter = rowDef.direction === HIGHER_IS_BETTER
    ? sVal > bVal
    : sVal < bVal;
  return selectedIsBetter ? 'compare-better' : 'compare-worse';
}

// ─── chart ────────────────────────────────────────────────────────────────────

let _chartInstance = null;

function renderTCOChart(container, baselineCar, selectedCars) {
  let chartDiv = container.querySelector('.bar-chart-container');
  if (!chartDiv) {
    chartDiv = document.createElement('div');
    chartDiv.className = 'bar-chart-container';
    container.appendChild(chartDiv);
  }

  if (selectedCars.length === 0) {
    chartDiv.innerHTML = '';
    if (_chartInstance) { _chartInstance.destroy(); _chartInstance = null; }
    return;
  }

  if (!window.Chart) {
    chartDiv.innerHTML = '<p style="padding:1rem;color:var(--text-secondary)">Chart.js not loaded — TCO chart unavailable.</p>';
    return;
  }

  // Destroy previous
  if (_chartInstance) { _chartInstance.destroy(); _chartInstance = null; }

  chartDiv.innerHTML = '<canvas id="tco-bar-chart"></canvas>';
  const canvas = chartDiv.querySelector('#tco-bar-chart');

  const allCars = [baselineCar, ...selectedCars];
  const labels = allCars.map(c => `${c.brand} ${c.model}`);
  const values = allCars.map(c => c.tco != null ? Math.round(c.tco / 100000) : 0);
  const colors = allCars.map((_, i) => i === 0
    ? 'rgba(99,102,241,0.75)'
    : 'rgba(34,197,94,0.75)');

  _chartInstance = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '5-yr TCO (₹L)',
        data: values,
        backgroundColor: colors,
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ' ₹' + ctx.parsed.x.toFixed(2) + ' L',
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: '₹ Lakh' },
          beginAtZero: true,
        },
      },
    },
  });
}

// ─── table builder ────────────────────────────────────────────────────────────

function buildTable(baselineCar, selectedCars, showDiffOnly) {
  const rowDefs = buildRowDefs();
  const totalCols = 1 + 1 + selectedCars.length; // label + baseline + selected

  let html = `<div class="compare-wrapper"><table class="compare-table">`;

  // thead
  html += `<thead><tr>`;
  html += `<th class="compare-sticky-col"></th>`;
  html += `<th class="compare-baseline-col">
    ${baselineCar.brand} ${baselineCar.model}
    <br><span class="locked-badge">Your Car</span>
  </th>`;
  for (const car of selectedCars) {
    html += `<th>${car.brand} ${car.model}<br><small>${car.variant || ''}</small></th>`;
  }
  html += `</tr></thead><tbody>`;

  for (const row of rowDefs) {
    // Section header row
    if (row._section) {
      html += `<tr class="compare-section-header">
        <td colspan="${totalCols}">${row._section}</td>
      </tr>`;
      continue;
    }

    // If "show differences only" is active, skip rows where all selected match baseline
    if (showDiffOnly && selectedCars.length > 0) {
      const baseVal = row.rawVal(baselineCar);
      const allSame = selectedCars.every(c => row.rawVal(c) === baseVal);
      if (allSame) continue;
    }

    html += `<tr>`;
    html += `<td class="compare-sticky-col">${row.label}</td>`;
    html += `<td class="compare-baseline-col">${row.format(baselineCar)}</td>`;
    for (const car of selectedCars) {
      const cls = getCellClass(row, baselineCar, car);
      html += `<td${cls ? ` class="${cls}"` : ''}>${row.format(car)}</td>`;
    }
    html += `</tr>`;
  }

  html += `</tbody></table></div>`;
  return html;
}

// ─── controls row ─────────────────────────────────────────────────────────────

function buildControls(selectedCars, showDiffOnly) {
  const slots = selectedCars.map((car, i) => `
    <span class="compare-car-slot">
      ${car.brand} ${car.model}
      <button class="remove-car-btn" data-index="${i}" aria-label="Remove ${car.brand} ${car.model}">×</button>
    </span>
  `).join('');

  const addHidden = selectedCars.length >= 3 ? ' hidden' : '';

  return `
    <div class="compare-controls">
      <div class="compare-car-slots">${slots}</div>
      <button class="add-car-btn btn-primary${addHidden}">Add car +</button>
      <label class="diff-toggle-row">
        <input type="checkbox" id="diff-toggle" ${showDiffOnly ? 'checked' : ''}>
        Show differences only
      </label>
    </div>
  `;
}

// ─── car picker modal ─────────────────────────────────────────────────────────

function buildPickerModal(allCars, baselineCar, selectedCars) {
  const selectedIds = new Set(selectedCars.map(c => c.id));

  const items = allCars
    .filter(c => c.id !== baselineCar.id)
    .map(car => {
      const disabled = selectedIds.has(car.id);
      const price = car.ex_showroom_jodhpur
        ? ' — ₹' + (car.ex_showroom_jodhpur / 100000).toFixed(2) + ' L'
        : '';
      return `<div class="car-picker-item${disabled ? ' disabled' : ''}"
               data-id="${car.id}"
               role="option"
               aria-disabled="${disabled}">
        ${car.brand} ${car.model} — ${car.variant || ''}${price}
      </div>`;
    })
    .join('');

  return `
    <div class="car-picker-backdrop"></div>
    <div class="car-picker-sheet" role="dialog" aria-label="Pick a car">
      <div class="car-picker-modal">
        <input class="car-picker-search" type="text" placeholder="Search brand or model…" aria-label="Search cars">
        <div class="car-picker-list">${items}</div>
      </div>
    </div>
  `;
}

// ─── main render function ─────────────────────────────────────────────────────

export async function renderCompare(container) {
  // ── load data ──
  const data        = await loadCarsData();
  const profile     = getProfile();
  const baselineCar = getBaselineCar(data);
  const carsForRank = getCarsForRanking(data);
  const ranked      = getBestVariantPerBrand(rankCars(carsForRank, profile, baselineCar));

  // Attach tco to baseline too (so chart can show it)
  const baselineWithTCO = { ...baselineCar, tco: calcTCO(baselineCar, profile) };

  // All non-baseline cars (ranked, with tco attached)
  const allCars = ranked; // already has .tco from rankCars/scoreCar

  // ── state ──
  let selectedCars  = [];
  let showDiffOnly  = false;
  let pickerOpen    = false;

  // ── outer structure ──
  container.innerHTML = `
    <div id="compare-controls-root"></div>
    <div id="compare-table-root"></div>
    <div id="compare-chart-root"></div>
    <div id="compare-picker-root"></div>
  `;

  const controlsRoot = container.querySelector('#compare-controls-root');
  const tableRoot    = container.querySelector('#compare-table-root');
  const chartRoot    = container.querySelector('#compare-chart-root');
  const pickerRoot   = container.querySelector('#compare-picker-root');

  // ── internal render ──
  function _render() {
    // Controls
    controlsRoot.innerHTML = buildControls(selectedCars, showDiffOnly);

    // Table
    tableRoot.innerHTML = buildTable(baselineWithTCO, selectedCars, showDiffOnly);

    // TCO chart
    renderTCOChart(chartRoot, baselineWithTCO, selectedCars);

    // ── bind controls events ──

    // Remove-car buttons
    controlsRoot.querySelectorAll('.remove-car-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        selectedCars.splice(idx, 1);
        _render();
      });
    });

    // Add car button
    const addBtn = controlsRoot.querySelector('.add-car-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        _openPicker();
      });
    }

    // Diff toggle
    const diffToggle = controlsRoot.querySelector('#diff-toggle');
    if (diffToggle) {
      diffToggle.addEventListener('change', (e) => {
        showDiffOnly = e.target.checked;
        _render();
      });
    }
  }

  // ── picker ──
  function _openPicker() {
    if (pickerOpen) return;
    pickerOpen = true;
    pickerRoot.innerHTML = buildPickerModal(allCars, baselineWithTCO, selectedCars);

    const backdrop = pickerRoot.querySelector('.car-picker-backdrop');
    const search   = pickerRoot.querySelector('.car-picker-search');
    const list     = pickerRoot.querySelector('.car-picker-list');

    // Search filter
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      list.querySelectorAll('.car-picker-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? '' : 'none';
      });
    });

    // Item click
    list.addEventListener('click', (e) => {
      const item = e.target.closest('.car-picker-item');
      if (!item || item.classList.contains('disabled')) return;
      const id = item.dataset.id;
      const car = allCars.find(c => c.id === id);
      if (car && selectedCars.length < 3 && !selectedCars.find(c => c.id === id)) {
        selectedCars.push(car);
      }
      _closePicker();
      _render();
    });

    // Backdrop click
    backdrop.addEventListener('click', _closePicker);

    // Escape key
    document.addEventListener('keydown', _escHandler);

    // Focus search
    requestAnimationFrame(() => search.focus());
  }

  function _escHandler(e) {
    if (e.key === 'Escape') _closePicker();
  }

  function _closePicker() {
    if (!pickerOpen) return;
    pickerOpen = false;
    pickerRoot.innerHTML = '';
    document.removeEventListener('keydown', _escHandler);
  }

  // ── listen for external add-to-compare event ──
  function _handleAddToCompare(e) {
    const car = e.detail && e.detail.car;
    if (!car) return;
    if (selectedCars.length >= 3) return;
    if (selectedCars.find(c => c.id === car.id)) return;
    if (car.id === baselineWithTCO.id) return;

    // Find the ranked version (which has .tco, .score etc.)
    const rankedCar = allCars.find(c => c.id === car.id) || car;
    selectedCars.push(rankedCar);
    _render();
  }

  document.addEventListener('suv:addToCompare', _handleAddToCompare);

  // Initial render
  _render();
}
