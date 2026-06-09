/**
 * ui-detail.js — Slide-in detail panel for SUV Compare
 * Singleton panel, radar chart via window.Chart, EMI calculator via emi.js
 */

import { calcOnRoadPrice, renderEMICalculator } from './emi.js';
import { getVFMTag, calcTCO } from './ranking.js';
import { getProfile } from './profile.js';

// ─── Module-level singleton state ────────────────────────────────────────────
let _panelEl = null;
let _backdropEl = null;
let _radarChart = null;
let _savedFocus = null;
let _escListener = null;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function fmtLakh(n) {
  return (n / 100000).toFixed(2);
}

const FUEL_LABELS = {
  petrol_turbo: 'Petrol Turbo',
  diesel: 'Diesel',
  cng: 'CNG',
  electric: 'Electric (EV)',
  strong_hybrid: 'Strong Hybrid',
  mild_hybrid: 'Mild Hybrid',
  petrol: 'Petrol NA'
};

// ─── Exported pure helpers ────────────────────────────────────────────────────

export function calcRatingsTotal(car) {
  const fields = [
    'rating_engine', 'rating_ride_handling', 'rating_nvh', 'rating_fit_finish',
    'rating_interior_quality', 'rating_interior_space', 'rating_boot_space',
    'rating_features_tech', 'rating_service_quality'
  ];
  const sum = fields.reduce((acc, k) => acc + (car[k] || 0), 0);
  return Math.round((sum / fields.length) * 10) / 10;
}

export function formatStars(n) {
  const clamped = Math.max(0, Math.min(5, Math.round(n || 0)));
  return '★'.repeat(clamped) + '☆'.repeat(5 - clamped);
}

export function getWaitingLabel(weeks) {
  const w = weeks || 0;
  if (w === 0) return 'Available Now';
  if (w === 1) return '~1 week wait';
  if (w <= 4) return `~${w} weeks wait`;
  if (w <= 8) return `~${w} weeks wait (moderate)`;
  return `${w}+ weeks wait (long)`;
}

// ─── Singleton DOM setup ──────────────────────────────────────────────────────

function ensurePanelDOM() {
  if (_panelEl) return;

  _panelEl = document.createElement('div');
  _panelEl.className = 'detail-panel';
  _panelEl.setAttribute('tabindex', '-1');
  _panelEl.setAttribute('role', 'dialog');
  _panelEl.setAttribute('aria-modal', 'true');

  _backdropEl = document.createElement('div');
  _backdropEl.className = 'detail-panel-backdrop';

  _backdropEl.addEventListener('click', closeDetailPanel);

  document.body.appendChild(_backdropEl);
  document.body.appendChild(_panelEl);

  // Escape key listener — added once
  _escListener = (e) => {
    if (e.key === 'Escape') closeDetailPanel();
  };
  document.addEventListener('keydown', _escListener);
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildBadgesSection(car) {
  const vfmTag = !car.is_baseline ? getVFMTag(car, []) : null;

  const waitingWeeks = car.waiting_weeks_jodhpur || 0;
  let waitingColor = 'green';
  if (waitingWeeks > 8) waitingColor = 'red';
  else if (waitingWeeks > 4) waitingColor = 'orange';
  else if (waitingWeeks > 0) waitingColor = 'goldenrod';

  const vfmHtml = vfmTag && !car.is_baseline
    ? `<span class="vfm-tag vfm-${(vfmTag || '').toLowerCase().replace(/\s+/g, '-')}">${vfmTag}</span>`
    : '';

  const bestBadgeHtml = car.is_best_variant_for_user
    ? `<span class="best-badge">Best Variant for You</span>`
    : '';

  const waitingHtml = `<span class="spec-chip" style="color:${waitingColor}">${getWaitingLabel(waitingWeeks)}</span>`;

  return `
    <section class="detail-section">
      <div class="spec-chips">
        ${vfmHtml}
        ${bestBadgeHtml}
        ${waitingHtml}
      </div>
    </section>`;
}

function buildPriceCostsSection(car) {
  if (car.is_baseline || !car.ex_showroom_jodhpur) return '';

  const exShowroom = car.ex_showroom_jodhpur || 0;
  const roadTax = Math.round(exShowroom * 0.11);
  const registration = 15000;
  const insurance = Math.round(exShowroom * 0.035);
  const onRoad = calcOnRoadPrice(exShowroom);
  const profile = getProfile();
  const tco = calcTCO(car, profile);
  const annualIns = car.annual_insurance_estimate || 0;
  const annualMaint = car.annual_maintenance_estimate || 0;

  return `
    <section class="detail-section">
      <h3 class="detail-section-title">Price &amp; Costs</h3>
      <dl class="specs-grid">
        <dt>Ex-Showroom (Jodhpur)</dt><dd>₹${fmtLakh(exShowroom)}L</dd>
        <dt>Road Tax (11%)</dt><dd>₹${fmtLakh(roadTax)}L</dd>
        <dt>Registration</dt><dd>₹${fmtLakh(registration)}L</dd>
        <dt>Insurance (3.5%)</dt><dd>₹${fmtLakh(insurance)}L</dd>
        <dt>On-Road Total</dt><dd><strong>₹${fmtLakh(onRoad)}L</strong></dd>
        <dt>5-Year TCO</dt><dd>₹${fmtLakh(tco)}L</dd>
        <dt>Annual Insurance Est.</dt><dd>₹${annualIns.toLocaleString('en-IN')}</dd>
        <dt>Annual Service Est.</dt><dd>₹${annualMaint.toLocaleString('en-IN')}</dd>
      </dl>
      <div id="dp-emi-calc"></div>
    </section>`;
}

function buildRatingsSection(car, baseline) {
  const ratingKeys = [
    'rating_engine', 'rating_ride_handling', 'rating_nvh', 'rating_fit_finish',
    'rating_interior_quality', 'rating_interior_space', 'rating_boot_space',
    'rating_features_tech', 'rating_service_quality'
  ];
  const ratingLabels = [
    'Engine', 'Ride+Handling', 'NVH', 'Fit+Finish', 'Interior Quality',
    'Interior Space', 'Boot Space', 'Features+Tech', 'Service Quality'
  ];

  const pillsHtml = ratingKeys.map((k, i) => {
    const val = car[k] || 0;
    return `
      <div class="rating-pill">
        <span class="rating-pill-label">${ratingLabels[i]}</span>
        <span class="rating-pill-value">${val.toFixed(1)}</span>
      </div>`;
  }).join('');

  const total = calcRatingsTotal(car);
  const baselineLabel = baseline ? ' vs Quanto Baseline' : '';

  return `
    <section class="detail-section">
      <h3 class="detail-section-title">Quality Ratings${baselineLabel}</h3>
      <div class="radar-chart-container">
        <canvas id="dp-radar-canvas"></canvas>
      </div>
      <div class="ratings-grid">
        ${pillsHtml}
      </div>
      <div class="car-score">Total: <strong>${total}</strong>/10</div>
    </section>`;
}

function buildSpecsSection(car) {
  const fuelLabel = FUEL_LABELS[car.fuel] || (car.fuel || '—');
  const txLabel = car.transmission === 'automatic' ? 'Automatic' :
                  car.transmission === 'manual' ? 'Manual' : (car.transmission || '—');
  const ncapText = car.ncap_stars ? formatStars(car.ncap_stars) + ` (${car.ncap_stars}★)` : 'Unrated';
  const isEV = car.fuel === 'electric';
  const isCNG = car.fuel === 'cng';

  const mileageRow = isEV
    ? `<dt>ARAI Range</dt><dd>${car.arai_range_km || '—'} km</dd>
       <dt>Real-World Range</dt><dd>${car.realworld_range_km ? '~' + car.realworld_range_km + ' km' : '—'}</dd>
       <dt>Battery</dt><dd>${car.battery_kwh || '—'} kWh</dd>`
    : isCNG
    ? `<dt>ARAI Mileage (CNG)</dt><dd>${car.arai_cng_kmkg || '—'} km/kg</dd>
       <dt>Real-World (CNG)</dt><dd>${car.realworld_cng_kmkg ? '~' + car.realworld_cng_kmkg + ' km/kg' : '—'}</dd>`
    : `<dt>ARAI Mileage</dt><dd>${car.arai_kmpl || '—'} kmpl</dd>
       <dt>Real-World Mileage</dt><dd>${car.realworld_kmpl || '—'} kmpl</dd>`;

  const adasFeaturesHtml = car.adas && car.adas_features && car.adas_features.length
    ? `<dt>ADAS</dt><dd>
        <span class="spec-yes">Yes</span>
        <ul class="adas-features-list">${car.adas_features.map(f => `<li>${f}</li>`).join('')}</ul>
       </dd>`
    : `<dt>ADAS</dt><dd>${car.adas ? 'Yes' : 'No'}</dd>`;

  return `
    <section class="detail-section">
      <h3 class="detail-section-title">Specifications</h3>
      <dl class="specs-grid">
        ${isEV ? '' : `<dt>Engine</dt><dd>${car.engine_cc || '—'} cc</dd>`}
        <dt>Power</dt><dd>${car.power_bhp || '—'} bhp</dd>
        <dt>Torque</dt><dd>${car.torque_nm || '—'} Nm</dd>
        <dt>Fuel Type</dt><dd>${fuelLabel}</dd>
        <dt>Transmission</dt><dd>${txLabel}</dd>
        ${mileageRow}
        <dt>Boot Space</dt><dd>${car.boot_litres || '—'} L</dd>
        <dt>Ground Clearance</dt><dd>${car.ground_clearance_mm || '—'} mm</dd>
        <dt>Cabin Width</dt><dd>${car.cabin_width_mm || '—'} mm</dd>
        <dt>Rear Legroom</dt><dd>${car.rear_legroom_mm || '—'} mm</dd>
        <dt>Airbags</dt><dd>${car.airbags || '—'}</dd>
        <dt>NCAP Rating</dt><dd>${ncapText}</dd>
        ${adasFeaturesHtml}
        <dt>360° Camera</dt><dd>${car.camera_360 ? '<span class="spec-yes">Yes</span>' : 'No'}</dd>
      </dl>
    </section>`;
}

function buildEVChargingSection(car) {
  if (car.fuel !== 'electric') return '';
  const fast = car.charging_fast_kw ? `${car.charging_fast_kw} kW DC fast charge` : '—';
  const home = car.charging_home_hours ? `~${car.charging_home_hours} hrs (7.2kW AC home)` : '—';
  const range = car.realworld_range_km ? `~${car.realworld_range_km} km` : '—';
  const costPer100 = car.realworld_range_km && car.battery_kwh
    ? '₹' + Math.round((car.battery_kwh / car.realworld_range_km) * 100 * 8) + '/100 km'
    : '—';

  return `
    <section class="detail-section">
      <h3 class="detail-section-title">⚡ Charging & Range</h3>
      <dl class="specs-grid">
        <dt>Real-World Range</dt><dd>${range}</dd>
        <dt>Battery Pack</dt><dd>${car.battery_kwh || '—'} kWh</dd>
        <dt>Fast Charging</dt><dd>${fast}</dd>
        <dt>Home Charging</dt><dd>${home}</dd>
        <dt>Running Cost</dt><dd>${costPer100} (vs ~₹700/100km petrol)</dd>
      </dl>
      <div class="ev-charging-note">
        <strong>Jodhpur charging:</strong> Tata Power EV charger at MIA Basni, EESL charger at Circuit House,
        Statiq charger at Jodhpur Airport. Highway coverage thin — plan charging stops on Jaipur / Udaipur routes.
      </div>
    </section>`;
}

function buildMustHavesSection(car) {
  const checks = [
    { label: '6 Airbags', met: (car.airbags || 0) >= 6 },
    { label: 'Ventilated Seats', met: !!car.ventilated_seats },
    { label: 'Connected Car', met: !!car.connected_car },
    { label: 'ADAS', met: !!car.adas },
    { label: '5-Star NCAP', met: (car.ncap_stars || 0) >= 5 },
    { label: 'Sunroof', met: !!car.sunroof }
  ];

  const itemsHtml = checks.map(c => {
    const cls = c.met ? 'met' : 'unmet';
    const icon = c.met ? '✓' : '✗';
    return `<li class="must-have-check ${cls}">${icon} ${c.label}</li>`;
  }).join('');

  return `
    <section class="detail-section">
      <h3 class="detail-section-title">Must-Have Checklist</h3>
      <ul class="must-haves-list">${itemsHtml}</ul>
    </section>`;
}

function buildKnownIssuesSection(car) {
  const issues = car.known_issues || [];
  if (!issues.length) return '';

  const itemsHtml = issues.map(i => {
    const sev = (i.severity || 'Minor').toLowerCase();
    const sevClass = sev === 'critical' ? 'severity-critical' :
                     sev === 'watch'    ? 'severity-watch' : 'severity-minor';
    return `
      <li class="issue-item">
        <span class="${sevClass}">[${i.severity || 'Minor'}]</span>
        <span class="issue-text">${i.issue || ''}</span>
      </li>`;
  }).join('');

  return `
    <section class="detail-section">
      <h3 class="detail-section-title">Known Issues</h3>
      <details>
        <summary>${issues.length} known issue${issues.length !== 1 ? 's' : ''}</summary>
        <ul class="issues-list">${itemsHtml}</ul>
      </details>
    </section>`;
}

function buildOwnershipSection(car) {
  return `
    <section class="detail-section">
      <h3 class="detail-section-title">Ownership &amp; Reliability</h3>
      <div class="ownership-grid">
        <div class="ownership-item">
          <span>Long-Term Reliability</span>
          <strong>${car.long_term_reliability_score || '—'}/10</strong>
        </div>
        <div class="ownership-item">
          <span>Future-Proof Score</span>
          <strong>${car.future_proof_score || '—'}/10</strong>
        </div>
        <div class="ownership-item">
          <span>Parts Availability</span>
          <strong>${car.parts_availability_score || '—'}/10</strong>
        </div>
        <div class="ownership-item">
          <span>Ease of Servicing</span>
          <strong>${car.ease_of_servicing_score || '—'}/10</strong>
        </div>
        <div class="ownership-item">
          <span>Resale Value (3yr)</span>
          <strong>${car.resale_3yr_pct != null ? car.resale_3yr_pct + '%' : '—'}</strong>
        </div>
        <div class="ownership-item">
          <span>Resale Value (5yr)</span>
          <strong>${car.resale_5yr_pct != null ? car.resale_5yr_pct + '%' : '—'}</strong>
        </div>
      </div>
    </section>`;
}

function buildServiceCentersSection(car) {
  const centers = car.service_centers_jodhpur || [];
  if (!centers.length) return '';

  const cardsHtml = centers.map(sc => {
    const rating = sc.rating ? ` · ${sc.rating}★` : '';
    const eta = sc.turnaround_hours ? ` · ~${sc.turnaround_hours}h turnaround` : '';
    return `
      <div class="service-center-card">
        <div>
          <strong>${sc.name || ''}</strong>
          <span class="service-center-meta">${sc.area || ''}${rating}${eta}</span>
        </div>
        <div class="service-center-actions">
          ${sc.phone ? `<a href="tel:${sc.phone}">${sc.phone}</a>` : ''}
          ${sc.maps_url ? `<a href="${sc.maps_url}" target="_blank" rel="noopener">Maps</a>` : ''}
        </div>
      </div>`;
  }).join('');

  return `
    <section class="detail-section">
      <h3 class="detail-section-title">Service Centers in Jodhpur</h3>
      <div class="service-center-list">${cardsHtml}</div>
    </section>`;
}

function buildProsConsSection(car) {
  const pros = car.pros || [];
  const cons = car.cons || [];
  if (!pros.length && !cons.length) return '';

  const prosHtml = pros.map(p => `<li>${p}</li>`).join('');
  const consHtml = cons.map(c => `<li>${c}</li>`).join('');

  return `
    <section class="detail-section">
      <h3 class="detail-section-title">Pros &amp; Cons</h3>
      <div class="pros-cons-grid">
        <ul class="pros-list">${prosHtml}</ul>
        <ul class="cons-list">${consHtml}</ul>
      </div>
    </section>`;
}

function buildActionsSection(car) {
  const waText = car
    ? `Check out the ${car.brand} ${car.model} on the Jodhpur SUV Comparison app: ${window.location.href}`
    : window.location.href;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
  return `
    <section class="detail-section detail-actions">
      <button id="dp-add-compare-btn" class="btn-primary">Add to Compare</button>
      <button id="dp-share-btn" class="btn-secondary">Share link</button>
      <a id="dp-wa-btn" class="btn-secondary btn-wa" href="${waUrl}" target="_blank" rel="noopener">WhatsApp</a>
    </section>`;
}

// ─── Radar chart ──────────────────────────────────────────────────────────────

function buildRadarChart(car, baseline) {
  if (!window.Chart) return;

  const canvas = document.getElementById('dp-radar-canvas');
  if (!canvas) return;

  const ratingKeys = [
    'rating_engine', 'rating_ride_handling', 'rating_nvh', 'rating_fit_finish',
    'rating_interior_quality', 'rating_interior_space', 'rating_boot_space',
    'rating_features_tech', 'rating_service_quality'
  ];
  const labels = [
    'Engine', 'Ride+Handling', 'NVH', 'Fit+Finish', 'Interior Quality',
    'Interior Space', 'Boot Space', 'Features+Tech', 'Service Quality'
  ];

  const carData = ratingKeys.map(k => car[k] || 0);
  const baselineData = baseline ? ratingKeys.map(k => baseline[k] || 0) : [];

  _radarChart = new window.Chart(canvas, {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          label: (car.brand || '') + ' ' + (car.model || ''),
          data: carData,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37,99,235,0.15)',
          pointRadius: 3
        },
        ...(baseline ? [{
          label: 'Quanto (Baseline)',
          data: baselineData,
          borderColor: '#9ca3af',
          backgroundColor: 'rgba(156,163,175,0.1)',
          borderDash: [4, 4],
          pointRadius: 2
        }] : [])
      ]
    },
    options: {
      scales: {
        r: {
          min: 0,
          max: 10,
          ticks: { stepSize: 2, font: { size: 10 } }
        }
      },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 } } }
      },
      responsive: true,
      maintainAspectRatio: true
    }
  });
}

// ─── Main panel API ───────────────────────────────────────────────────────────

export function closeDetailPanel() {
  if (!_panelEl) return;

  _panelEl.classList.remove('open');
  if (_backdropEl) _backdropEl.classList.remove('visible');

  if (_radarChart) {
    _radarChart.destroy();
    _radarChart = null;
  }

  // Remove ?car param from URL
  const url = new URL(window.location.href);
  url.searchParams.delete('car');
  history.replaceState(null, '', url.toString());

  // Restore focus
  if (_savedFocus && typeof _savedFocus.focus === 'function') {
    _savedFocus.focus();
  }
  _savedFocus = null;
}

export function renderDetailPanel(car, allRanked, baseline) {
  if (!car) return;

  ensurePanelDOM();

  // Save focus for restoration on close
  _savedFocus = document.activeElement;

  // Destroy previous chart before replacing innerHTML
  if (_radarChart) {
    _radarChart.destroy();
    _radarChart = null;
  }

  // Build header
  const rankBadgeHtml = !car.is_baseline && car.rank != null
    ? `<span class="rank-badge baseline-rank">#${car.rank}</span><span class="car-score">${(car.score || 0).toFixed(1)}</span>`
    : '';

  const headerHtml = `
    <div class="detail-header">
      <button id="detail-back-btn" class="detail-close-btn" aria-label="Back">&#8592;</button>
      <div class="detail-header-title">
        <h2>${car.brand || ''} ${car.model || ''}</h2>
        <p>${car.variant || ''}</p>
      </div>
      ${rankBadgeHtml}
      <button id="detail-close-btn" class="detail-close-btn" aria-label="Close">&#x2715;</button>
    </div>`;

  // Build body sections
  const onRoad = calcOnRoadPrice(car.ex_showroom_jodhpur || 0);

  const bodyHtml = `
    <div class="detail-body">
      ${buildBadgesSection(car)}
      ${buildPriceCostsSection(car)}
      ${buildRatingsSection(car, baseline)}
      ${buildSpecsSection(car)}
      ${buildEVChargingSection(car)}
      ${buildMustHavesSection(car)}
      ${buildKnownIssuesSection(car)}
      ${buildOwnershipSection(car)}
      ${buildServiceCentersSection(car)}
      ${buildProsConsSection(car)}
      ${buildActionsSection(car)}
    </div>`;

  _panelEl.innerHTML = `<div class="detail-sheet">${headerHtml}${bodyHtml}</div>`;

  // ── Post-innerHTML wiring ──────────────────────────────────────────────────

  // 1. Mount EMI calculator (only if price section was rendered)
  if (!car.is_baseline && car.ex_showroom_jodhpur) {
    const emiContainer = document.getElementById('dp-emi-calc');
    if (emiContainer) {
      renderEMICalculator(emiContainer, onRoad);
    }
  }

  // 2. Wire back + close buttons
  const backBtn = document.getElementById('detail-back-btn');
  const closeBtn = document.getElementById('detail-close-btn');
  if (backBtn) backBtn.addEventListener('click', closeDetailPanel);
  if (closeBtn) closeBtn.addEventListener('click', closeDetailPanel);

  // 3. Wire "Add to Compare" button
  const addBtn = document.getElementById('dp-add-compare-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      document.dispatchEvent(
        new CustomEvent('suv:addToCompare', { detail: { car }, bubbles: true })
      );
    });
  }

  // 4. Wire "Share" button
  const shareBtn = document.getElementById('dp-share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        const orig = shareBtn.textContent;
        shareBtn.textContent = 'Copied!';
        setTimeout(() => { shareBtn.textContent = orig; }, 2000);
      }).catch(() => {
        // Clipboard unavailable — fail silently
      });
    });
  }

  // 5. Build radar chart
  buildRadarChart(car, baseline);

  // 6. Set ?car=id in URL
  const url = new URL(window.location.href);
  url.searchParams.set('car', car.id || '');
  history.replaceState(null, '', url.toString());

  // 7. Show panel
  _panelEl.classList.add('open');
  if (_backdropEl) _backdropEl.classList.add('visible');

  // 8. Focus panel for keyboard navigation
  _panelEl.focus();
}
