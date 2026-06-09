// modules/ui-exchange.js
// Quanto exchange estimator for Jodhpur tab

import { loadCarsData } from './data.js';
import { calcOnRoadPrice } from './emi.js';

// ─── Exchange value calculation ───────────────────────────────────────────────

// Base value for a ~2014 Quanto C8 Diesel (top variant at time)
// Original ex-showroom was approx ₹7.5L; market traded ~₹6.5-7L in 2014
const QUANTO_ORIGINAL_EX = 700000;

// Age-based depreciation curve for a discontinued diesel sub-4m SUV
// Year 1-3: steep, Year 3-5: moderate, Year 5-8: slow, 8+: floor
function _depreciationFactor(ageYears) {
  if (ageYears <= 1) return 0.78;
  if (ageYears <= 2) return 0.65;
  if (ageYears <= 3) return 0.55;
  if (ageYears <= 4) return 0.47;
  if (ageYears <= 5) return 0.40;
  if (ageYears <= 6) return 0.34;
  if (ageYears <= 7) return 0.29;
  if (ageYears <= 8) return 0.25;
  if (ageYears <= 10) return 0.20;
  if (ageYears <= 12) return 0.16;
  if (ageYears <= 14) return 0.12;
  return 0.09; // floor for very old cars
}

// Condition multiplier
const CONDITION_MULTIPLIER = {
  excellent: 1.10,
  good:      1.00,
  fair:      0.85,
  poor:      0.68,
};

// km/year typical usage: 12,000–15,000 km/yr; high km reduces value
function _kmMultiplier(kmDriven, ageYears) {
  const expectedKm = ageYears * 13000;
  const ratio = kmDriven / expectedKm;
  if (ratio <= 0.7) return 1.05;
  if (ratio <= 1.0) return 1.00;
  if (ratio <= 1.3) return 0.93;
  if (ratio <= 1.6) return 0.85;
  return 0.75;
}

export function calcExchangeValue(purchaseYear, condition, kmDriven) {
  const currentYear = 2026;
  const ageYears = Math.max(1, currentYear - purchaseYear);
  const base = QUANTO_ORIGINAL_EX * _depreciationFactor(ageYears);
  const condMult = CONDITION_MULTIPLIER[condition] || 1.0;
  const kmMult = _kmMultiplier(kmDriven, ageYears);
  const raw = base * condMult * kmMult;
  // Dealer exchange typically 10-15% below open market; use 12%
  const dealerValue = raw * 0.88;
  return {
    openMarket: Math.round(raw / 1000) * 1000,
    dealerExchange: Math.round(dealerValue / 1000) * 1000,
    ageYears,
  };
}

// ─── Renderer ────────────────────────────────────────────────────────────────

export function renderExchangeEstimator(container) {
  const el = document.createElement('section');
  el.className = 'exchange-estimator';
  el.innerHTML = `
    <h2 class="exchange-title">Quanto Exchange Estimator</h2>
    <p class="exchange-subtitle">See your Quanto's likely trade-in value and net cost after exchange.</p>

    <div class="exchange-form glass-section">
      <div class="exchange-row">
        <label class="exchange-label">Purchase year</label>
        <select id="ex-year" class="exchange-input">
          ${[...Array(15)].map((_, i) => {
            const yr = 2026 - i;
            return `<option value="${yr}"${yr === 2014 ? ' selected' : ''}>${yr}</option>`;
          }).join('')}
        </select>
      </div>

      <div class="exchange-row">
        <label class="exchange-label">Condition</label>
        <div class="condition-chips" id="ex-condition">
          <button class="condition-chip" data-value="excellent">Excellent</button>
          <button class="condition-chip active" data-value="good">Good</button>
          <button class="condition-chip" data-value="fair">Fair</button>
          <button class="condition-chip" data-value="poor">Poor</button>
        </div>
      </div>

      <div class="exchange-row">
        <label class="exchange-label">Kms driven <span id="ex-km-display">80,000 km</span></label>
        <input type="range" id="ex-km" min="20000" max="250000" step="5000" value="80000" class="exchange-slider">
      </div>
    </div>

    <div id="exchange-result" class="exchange-result-wrap"></div>
  `;
  container.appendChild(el);

  // State
  let condition = 'good';
  let kmDriven = 80000;
  let purchaseYear = 2014;

  const yearSel = el.querySelector('#ex-year');
  const kmSlider = el.querySelector('#ex-km');
  const kmDisplay = el.querySelector('#ex-km-display');
  const condChips = el.querySelector('#ex-condition');
  const resultWrap = el.querySelector('#exchange-result');

  function updateKmDisplay(v) {
    kmDisplay.textContent = Number(v).toLocaleString('en-IN') + ' km';
  }

  async function render() {
    const result = calcExchangeValue(purchaseYear, condition, kmDriven);
    let cars = [];
    try {
      const data = await loadCarsData();
      cars = data.cars.filter(c => !c.is_baseline && c.ex_showroom_jodhpur > 0);
    } catch (_) {}

    resultWrap.innerHTML = '';

    // Summary card
    const summary = document.createElement('div');
    summary.className = 'exchange-summary glass-section';
    summary.innerHTML = `
      <div class="exchange-summary-grid">
        <div class="exchange-val-block">
          <div class="exchange-val-label">Open market value</div>
          <div class="exchange-val">₹${(result.openMarket / 100000).toFixed(2)} L</div>
        </div>
        <div class="exchange-val-block highlight">
          <div class="exchange-val-label">Dealer exchange offer</div>
          <div class="exchange-val accent">₹${(result.dealerExchange / 100000).toFixed(2)} L</div>
          <div class="exchange-val-note">~12% below market (typical dealer margin)</div>
        </div>
        <div class="exchange-val-block">
          <div class="exchange-val-label">Age</div>
          <div class="exchange-val">${result.ageYears} yr${result.ageYears !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <p class="exchange-tip">💡 Tip: Get quotes from 2–3 dealers. Online platforms (Cars24, Spinny) often offer 5–8% more than dealers.</p>
    `;
    resultWrap.appendChild(summary);

    if (cars.length === 0) return;

    // Net cost table
    const tableWrap = document.createElement('div');
    tableWrap.innerHTML = `
      <h3 class="exchange-net-title">Net cost after exchanging your Quanto</h3>
      <p class="exchange-net-sub">On-road price minus dealer exchange offer of ₹${(result.dealerExchange / 100000).toFixed(2)}L</p>
      <div class="exchange-net-list"></div>
    `;
    const list = tableWrap.querySelector('.exchange-net-list');

    cars
      .sort((a, b) => a.ex_showroom_jodhpur - b.ex_showroom_jodhpur)
      .forEach(car => {
        const onRoad = calcOnRoadPrice(car.ex_showroom_jodhpur);
        const net = onRoad - result.dealerExchange;
        const item = document.createElement('div');
        item.className = 'exchange-net-item glass-section';
        item.innerHTML = `
          <div class="exchange-net-car">
            <strong>${car.brand} ${car.model}</strong>
            <span class="exchange-net-variant">${car.variant}</span>
          </div>
          <div class="exchange-net-prices">
            <div class="exchange-net-onroad">On-road: <strong>₹${(onRoad / 100000).toFixed(2)}L</strong></div>
            <div class="exchange-net-value ${net < 0 ? 'net-credit' : ''}">
              Net: <strong>₹${net < 0 ? '-' : ''}${(Math.abs(net) / 100000).toFixed(2)}L</strong>
              ${net < 0 ? '<span class="net-credit-badge">You\'d get cash back!</span>' : ''}
            </div>
          </div>
        `;
        list.appendChild(item);
      });
    resultWrap.appendChild(tableWrap);
  }

  // Event wiring
  yearSel.addEventListener('change', e => {
    purchaseYear = parseInt(e.target.value);
    render();
  });

  kmSlider.addEventListener('input', e => {
    kmDriven = parseInt(e.target.value);
    updateKmDisplay(kmDriven);
    render();
  });

  condChips.addEventListener('click', e => {
    const chip = e.target.closest('.condition-chip');
    if (!chip) return;
    condition = chip.dataset.value;
    condChips.querySelectorAll('.condition-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    render();
  });

  updateKmDisplay(kmDriven);
  render();
}
