import { loadCarsData, invalidateCache } from './modules/data.js';
import { renderHome, bestTimeToBuy } from './modules/ui-home.js';
import { renderEMICalculator, calcOnRoadPrice } from './modules/emi.js';
import { renderCompare } from './modules/ui-compare.js';
import { renderDetailPanel, closeDetailPanel } from './modules/ui-detail.js';
import { renderExchangeEstimator } from './modules/ui-exchange.js';
import { renderDealerChecklist, applyGlossaryTooltips } from './modules/ui-helpers.js';
import { openProfileEditor } from './modules/ui-profile.js';

const TABS = ['home', 'compare', 'ranking', 'jodhpur'];
let activeTab = 'home';
let homeRendered = false;

function switchTab(tabId) {
  TABS.forEach(t => {
    const pane = document.getElementById(`tab-${t}`);
    const btn = document.querySelector(`[data-tab="${t}"]`);
    const isActive = t === tabId;
    pane.classList.toggle('hidden', !isActive);
    pane.classList.toggle('active', isActive);
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  activeTab = tabId;

  if (tabId === 'home' && !homeRendered) {
    homeRendered = true;
    const homePane = document.getElementById('tab-home');
    renderHome(homePane).then(() => applyGlossaryTooltips(homePane)).catch(() => {});
  }
  if (tabId === 'jodhpur') renderFinanceTab();
  if (tabId === 'compare') renderCompareTab();
  if (tabId === 'ranking') renderRankingPlaceholder();
}

async function renderFinanceTab() {
  const pane = document.getElementById('tab-jodhpur');
  if (pane.dataset.rendered) return;
  pane.dataset.rendered = '1';

  pane.innerHTML = '<p style="padding:2rem 1.25rem;color:var(--text-muted);font-size:0.85rem">Loading…</p>';

  // ── Load all data up front ───────────────────────────────────────────────────
  const { getProfile }                         = await import('./modules/profile.js');
  const { rankCars, getBestVariantPerBrand }   = await import('./modules/ranking.js');
  const { getCarsForRanking, getBaselineCar }  = await import('./modules/data.js');
  const { calcOnRoadPrice, calcEMI }           = await import('./modules/emi.js');
  const { calcExchangeValue }                  = await import('./modules/ui-exchange.js');
  const { saveProfile }                        = await import('./modules/profile.js');

  const data     = await loadCarsData();
  let profile    = getProfile();
  const baseline = getBaselineCar(data);
  const allRanked = getBestVariantPerBrand(rankCars(getCarsForRanking(data), profile, baseline));

  // Deduplicate by brand+model for the car selector
  const seen = new Set();
  const cars = allRanked.filter(c => {
    const key = `${c.brand}||${c.model}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.ex_showroom_jodhpur - b.ex_showroom_jodhpur);

  // Top pick (highest score, already rank 1 after dedup)
  const topCar = [...cars].sort((a, b) => b.score - a.score)[0];

  // ── EMI + exchange state ─────────────────────────────────────────────────────
  let selectedCarId = topCar ? topCar.id : null;
  let dpPct         = 20;
  let rate          = 8.5;
  let tenureMonths  = 60;
  let exchYear      = 2013;
  let exchCondition = 'fair';
  let exchKm        = 80000;

  function getExch() { return calcExchangeValue(exchYear, exchCondition, exchKm); }
  function getSelectedCar() { return cars.find(c => c.id === selectedCarId) || topCar; }
  function getOnRoad(car) { return calcOnRoadPrice(car.ex_showroom_jodhpur); }
  function getEMI(car) {
    const onRoad = getOnRoad(car);
    const principal = Math.round(onRoad * (1 - dpPct / 100));
    return calcEMI(principal, rate, tenureMonths);
  }
  function fL(v) { return '₹' + (v / 100000).toFixed(2) + 'L'; }
  function fLshort(v) { return '₹' + (v / 100000).toFixed(1) + 'L'; }

  pane.innerHTML = '';

  // ── 1. Answer card ───────────────────────────────────────────────────────────
  const answerCard = document.createElement('div');
  answerCard.className = 'fin-answer-card';
  pane.appendChild(answerCard);

  function updateAnswerCard() {
    const car   = getSelectedCar();
    if (!car) return;
    const onRoad  = getOnRoad(car);
    const exch    = getExch();
    const net     = onRoad - exch.dealerExchange;
    const emi     = getEMI(car);
    const waitTxt = car.waiting_weeks_jodhpur != null
      ? (car.waiting_weeks_jodhpur === 0 ? 'In stock' : `${car.waiting_weeks_jodhpur} wks`)
      : '—';
    answerCard.innerHTML = `
      <div class="fin-ac-eyebrow">Your buying picture · ${car.brand} ${car.model}</div>
      <div class="fin-ac-sentence">
        <strong>${car.brand} ${car.model}</strong> costs <strong>${fLshort(onRoad)} on-road</strong>.
        After trading your Quanto (~${fL(exch.dealerExchange)}), net cost is
        <strong>${fL(net)}</strong>.
        At ${dpPct}% down + ${rate}% p.a., that's
        <strong>₹${emi.toLocaleString('en-IN')}/month</strong> for ${tenureMonths / 12} years.
      </div>
      <div class="fin-ac-nums">
        <div class="fin-ac-num"><div class="fin-ac-val">${fL(net)}</div><div class="fin-ac-lbl">Net after exchange</div></div>
        <div class="fin-ac-num"><div class="fin-ac-val">₹${emi.toLocaleString('en-IN')}</div><div class="fin-ac-lbl">EMI / month</div></div>
        <div class="fin-ac-num"><div class="fin-ac-val">${waitTxt}</div><div class="fin-ac-lbl">Wait time</div></div>
      </div>
    `;
  }
  updateAnswerCard();

  // ── 2. Adjust your loan ──────────────────────────────────────────────────────
  const adjWrap = document.createElement('div');
  adjWrap.className = 'fin-section';
  adjWrap.innerHTML = `
    <div class="fin-sec-hd"><span>Adjust your loan</span><span class="fin-reset" id="fin-reset">Reset</span></div>
    <div class="fin-adj-card">
      <div class="fin-car-sel" id="fin-car-sel"></div>
      <div class="fin-adj-result">
        <div class="fin-ar-cell">
          <div class="fin-ar-lbl">Monthly EMI</div>
          <div class="fin-ar-val" id="fin-emi-val">—</div>
        </div>
        <div class="fin-ar-cell">
          <div class="fin-ar-lbl">After exchange</div>
          <div class="fin-ar-val" id="fin-net-val">—</div>
        </div>
      </div>
      <div class="fin-adj-controls">
        <div class="fin-ctrl">
          <span class="fin-ctrl-lbl">Petrol price</span>
          <input type="number" id="fin-petrol-price" min="80" max="140" step="1"
            value="${profile.petrol_price_jodhpur || 103}"
            style="width:4.5rem;padding:0.2rem 0.4rem;border:1px solid var(--border);border-radius:6px;font-size:0.82rem;background:var(--surface);color:var(--text)">
          <span style="font-size:0.75rem;color:var(--text-muted)">₹/litre</span>
        </div>
        <div class="fin-ctrl">
          <span class="fin-ctrl-lbl">Down payment</span>
          <input type="range" id="fin-dp" min="5" max="50" value="20" style="flex:1;accent-color:var(--blue)">
          <span class="fin-ctrl-val" id="fin-dp-val">20%</span>
          <span class="fin-ctrl-amt" id="fin-dp-amt" style="font-size:0.72rem;color:var(--text-muted);min-width:4rem;text-align:right"></span>
        </div>
        <div class="fin-ctrl">
          <span class="fin-ctrl-lbl">Bank / rate</span>
          <div class="fin-chips" id="fin-rate-chips">
            <button class="fin-chip active" data-rate="8.5">SBI 8.5%</button>
            <button class="fin-chip" data-rate="8.6">BoB 8.6%</button>
            <button class="fin-chip" data-rate="8.75">HDFC 8.75%</button>
            <button class="fin-chip" data-rate="8.99">Kotak 8.99%</button>
            <button class="fin-chip" data-rate="9.0">ICICI 9%</button>
            <button class="fin-chip" data-rate="9.15">Axis 9.15%</button>
          </div>
        </div>
        <div class="fin-ctrl">
          <span class="fin-ctrl-lbl">Tenure</span>
          <div class="fin-chips" id="fin-tenure-chips">
            <button class="fin-chip" data-tenure="36">3yr</button>
            <button class="fin-chip" data-tenure="48">4yr</button>
            <button class="fin-chip active" data-tenure="60">5yr</button>
            <button class="fin-chip" data-tenure="72">6yr</button>
            <button class="fin-chip" data-tenure="84">7yr</button>
          </div>
        </div>
        <div class="fin-ctrl fin-ctrl-emi-target">
          <span class="fin-ctrl-lbl">Target EMI</span>
          <span style="font-size:0.75rem;color:var(--text-muted)">₹</span>
          <input type="number" id="fin-target-emi" min="1000" max="200000" step="500"
            placeholder="e.g. 25000"
            style="width:6rem;padding:0.2rem 0.4rem;border:1px solid var(--border);border-radius:6px;font-size:0.82rem;background:var(--surface);color:var(--text)">
          <span class="fin-ctrl-lbl" style="margin-left:0.25rem;color:var(--text-muted);font-size:0.72rem" id="fin-target-emi-hint"></span>
        </div>
      </div>
    </div>
  `;
  pane.appendChild(adjWrap);

  // Build car selector
  function buildCarSel() {
    const track = adjWrap.querySelector('#fin-car-sel');
    track.innerHTML = cars.map(c => `
      <button class="fin-car-opt${c.id === selectedCarId ? ' sel' : ''}" data-id="${c.id}">
        <div class="fin-co-brand">${c.brand}</div>
        <div class="fin-co-model">${c.model}</div>
        <div class="fin-co-price">${fLshort(getOnRoad(c))}</div>
      </button>
    `).join('');
    track.querySelectorAll('.fin-car-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCarId = btn.dataset.id;
        track.querySelectorAll('.fin-car-opt').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
        updateLoanResult();
        updateAnswerCard();
      });
    });
  }
  buildCarSel();

  function updateLoanResult() {
    const car   = getSelectedCar();
    if (!car) return;
    const emi   = getEMI(car);
    const onRoad = getOnRoad(car);
    const net   = onRoad - getExch().dealerExchange;
    const dpAmt = Math.round(onRoad * dpPct / 100);
    adjWrap.querySelector('#fin-emi-val').textContent = '₹' + emi.toLocaleString('en-IN');
    adjWrap.querySelector('#fin-net-val').textContent = fL(net);
    const dpAmtEl = adjWrap.querySelector('#fin-dp-amt');
    if (dpAmtEl) dpAmtEl.textContent = '₹' + dpAmt.toLocaleString('en-IN');
  }
  updateLoanResult();

  // Down payment slider
  adjWrap.querySelector('#fin-dp').addEventListener('input', e => {
    dpPct = parseInt(e.target.value);
    adjWrap.querySelector('#fin-dp-val').textContent = dpPct + '%';
    updateLoanResult();
    updateAnswerCard();
  });

  // Rate chips
  adjWrap.querySelector('#fin-rate-chips').addEventListener('click', e => {
    const btn = e.target.closest('.fin-chip');
    if (!btn) return;
    rate = parseFloat(btn.dataset.rate);
    adjWrap.querySelectorAll('#fin-rate-chips .fin-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateLoanResult();
    updateAnswerCard();
  });

  // Tenure chips
  adjWrap.querySelector('#fin-tenure-chips').addEventListener('click', e => {
    const btn = e.target.closest('.fin-chip');
    if (!btn) return;
    tenureMonths = parseInt(btn.dataset.tenure);
    adjWrap.querySelectorAll('#fin-tenure-chips .fin-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateLoanResult();
    updateAnswerCard();
  });

  // Petrol price
  adjWrap.querySelector('#fin-petrol-price').addEventListener('change', e => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v) && v >= 80 && v <= 140) {
      profile = { ...profile, petrol_price_jodhpur: v };
      saveProfile(profile);
    }
  });

  // Reset
  adjWrap.querySelector('#fin-reset').addEventListener('click', () => {
    dpPct = 20; rate = 8.5; tenureMonths = 60;
    selectedCarId = topCar ? topCar.id : selectedCarId;
    adjWrap.querySelector('#fin-dp').value = 20;
    adjWrap.querySelector('#fin-dp-val').textContent = '20%';
    adjWrap.querySelector('#fin-petrol-price').value = 103;
    const tgtEmiEl = adjWrap.querySelector('#fin-target-emi');
    if (tgtEmiEl) { tgtEmiEl.value = ''; }
    const hintEl = adjWrap.querySelector('#fin-target-emi-hint');
    if (hintEl) { hintEl.textContent = ''; }
    profile = { ...profile, petrol_price_jodhpur: 103 };
    saveProfile(profile);
    adjWrap.querySelectorAll('#fin-rate-chips .fin-chip').forEach(b => b.classList.toggle('active', b.dataset.rate === '8.5'));
    adjWrap.querySelectorAll('#fin-tenure-chips .fin-chip').forEach(b => b.classList.toggle('active', b.dataset.tenure === '60'));
    buildCarSel();
    updateLoanResult();
    updateAnswerCard();
  });

  // Target EMI — back-calculate required DP%
  adjWrap.querySelector('#fin-target-emi').addEventListener('input', e => {
    const targetEMI = parseInt(e.target.value, 10);
    const hintEl = adjWrap.querySelector('#fin-target-emi-hint');
    if (!targetEMI || targetEMI < 1000) { hintEl.textContent = ''; return; }
    const car = getSelectedCar();
    const onRoad = getOnRoad(car);
    // Reverse EMI formula: P = EMI * ((1+r)^n - 1) / (r * (1+r)^n)
    const r = rate / 12 / 100;
    const n = tenureMonths;
    const factor = (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
    const maxPrincipal = Math.round(targetEMI * factor);
    const reqDP = Math.round(((onRoad - maxPrincipal) / onRoad) * 100);
    if (reqDP < 5) {
      hintEl.textContent = '⚠ EMI too high — DP already at min';
      hintEl.style.color = 'var(--red)';
      return;
    }
    if (reqDP > 95) {
      hintEl.textContent = '⚠ EMI too low — need > 95% down';
      hintEl.style.color = 'var(--red)';
      return;
    }
    hintEl.textContent = `→ needs ${reqDP}% down (₹${Math.round(onRoad * reqDP / 100).toLocaleString('en-IN')})`;
    hintEl.style.color = 'var(--text-muted)';
    dpPct = reqDP;
    adjWrap.querySelector('#fin-dp').value = reqDP;
    adjWrap.querySelector('#fin-dp-val').textContent = reqDP + '%';
    updateLoanResult();
    updateAnswerCard();
  });

  // ── 3. Exchange card ─────────────────────────────────────────────────────────
  const exchWrap = document.createElement('div');
  exchWrap.className = 'fin-section';
  exchWrap.innerHTML = `
    <div class="fin-sec-hd"><span>Your Quanto — sell vs scrap</span></div>
    <div class="fin-exch-card">
      <div class="fin-exch-top">
        <div>
          <div class="fin-exch-lbl">Dealer offer</div>
          <div class="fin-exch-val" id="fin-exch-dealer">—</div>
          <div class="fin-exch-desc" id="fin-exch-market">—</div>
        </div>
        <div style="text-align:right">
          <div class="fin-exch-lbl">Net cost · <span id="fin-exch-carname">top pick</span></div>
          <div class="fin-exch-net" id="fin-exch-net">—</div>
          <div class="fin-exch-desc">on-road minus exchange</div>
        </div>
      </div>
      <div class="fin-exch-form">
        <select id="fin-exch-year">
          ${[...Array(15)].map((_, i) => {
            const yr = 2026 - i;
            return `<option value="${yr}"${yr === 2013 ? ' selected' : ''}>${yr}</option>`;
          }).join('')}
        </select>
        <input type="range" id="fin-exch-km" min="20000" max="250000" step="5000" value="80000">
        <span id="fin-exch-km-lbl" class="fin-exch-km-lbl">80k km</span>
        <div class="fin-chips" id="fin-cond-chips">
          <button class="fin-chip" data-cond="excellent">Exc</button>
          <button class="fin-chip" data-cond="good">Good</button>
          <button class="fin-chip active" data-cond="fair">Fair</button>
          <button class="fin-chip" data-cond="poor">Poor</button>
        </div>
      </div>
      <!-- Sell vs Scrap comparison -->
      <div class="fin-scrap-compare" id="fin-scrap-compare"></div>
      <div class="fin-exch-tip">💡 Cars24 / Spinny often pay 5–8% more than dealers. Get 3 quotes before deciding.</div>
    </div>
  `;
  pane.appendChild(exchWrap);

  function updateExchange() {
    const exch   = getExch();
    const car    = getSelectedCar();
    const net    = car ? getOnRoad(car) - exch.dealerExchange : null;
    exchWrap.querySelector('#fin-exch-dealer').textContent = fL(exch.dealerExchange);
    exchWrap.querySelector('#fin-exch-market').textContent = `Open market ~${fL(exch.openMarket)} · ~12% below`;
    exchWrap.querySelector('#fin-exch-carname').textContent = car ? car.model : 'top pick';
    exchWrap.querySelector('#fin-exch-net').textContent = net != null ? fL(net) : '—';

    // Scrap value: HSRP-compliant scrapping in Rajasthan gives a certificate + metal weight value
    // ~10-year-old discontinued diesel: ~₹0.8–1.2L scrap + 25% road tax rebate on new car
    const scrapMetal = Math.round(Math.min(exch.openMarket * 0.18, 90000) / 1000) * 1000;
    const roadTaxRebate = car ? Math.round(getOnRoad(car) * 0.025 / 1000) * 1000 : 0; // 2.5% rebate on new OTR
    const scrapTotal = scrapMetal + roadTaxRebate;
    const sellNetBetter = exch.dealerExchange > scrapTotal;
    const scrapEl = exchWrap.querySelector('#fin-scrap-compare');
    if (scrapEl) {
      scrapEl.innerHTML = `
        <div class="fin-scrap-row">
          <div class="fin-scrap-opt${sellNetBetter ? ' fin-scrap-winner' : ''}">
            <div class="fin-scrap-lbl">Sell / Trade-in</div>
            <div class="fin-scrap-val">${fL(exch.dealerExchange)}</div>
            <div class="fin-scrap-sub">dealer exchange offer</div>
            ${sellNetBetter ? '<span class="fin-scrap-badge">Better deal</span>' : ''}
          </div>
          <div class="fin-scrap-vs">vs</div>
          <div class="fin-scrap-opt${!sellNetBetter ? ' fin-scrap-winner' : ''}">
            <div class="fin-scrap-lbl">Scrap (HSRP)</div>
            <div class="fin-scrap-val">${fL(scrapTotal)}</div>
            <div class="fin-scrap-sub">metal ~${fL(scrapMetal)} + tax rebate ~${fL(roadTaxRebate)}</div>
            ${!sellNetBetter ? '<span class="fin-scrap-badge">Better deal</span>' : ''}
          </div>
        </div>
        <div class="fin-scrap-note">Scrap certificate under Rajasthan Vehicle Scrapping Policy also exempts you from green tax on the new vehicle.</div>
      `;
    }

    updateLoanResult();
    updateAnswerCard();
  }
  updateExchange();

  exchWrap.querySelector('#fin-exch-year').addEventListener('change', e => {
    exchYear = parseInt(e.target.value); updateExchange();
  });
  exchWrap.querySelector('#fin-exch-km').addEventListener('input', e => {
    exchKm = parseInt(e.target.value);
    const k = Math.round(exchKm / 1000);
    exchWrap.querySelector('#fin-exch-km-lbl').textContent = k + 'k km';
    updateExchange();
  });
  exchWrap.querySelector('#fin-cond-chips').addEventListener('click', e => {
    const btn = e.target.closest('.fin-chip');
    if (!btn) return;
    exchCondition = btn.dataset.cond;
    exchWrap.querySelectorAll('#fin-cond-chips .fin-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateExchange();
  });

  // ── 4. On-road prices ────────────────────────────────────────────────────────
  const pricesWrap = document.createElement('div');
  pricesWrap.className = 'fin-section';
  pricesWrap.innerHTML = `<div class="fin-sec-hd"><span>On-road prices · all cars</span></div>`;
  const priceList = document.createElement('div');
  priceList.className = 'fin-price-list';
  cars
    .slice()
    .sort((a, b) => a.ex_showroom_jodhpur - b.ex_showroom_jodhpur)
    .forEach(car => {
      const onRoad   = getOnRoad(car);
      const isTop    = car.id === (topCar && topCar.id);
      const row = document.createElement('div');
      row.className = 'fin-price-row' + (isTop ? ' top-pick' : '');
      row.innerHTML = `
        <div class="fin-pr-car">
          ${car.brand} ${car.model}
          <small>${car.variant}</small>
        </div>
        <div class="fin-pr-right">
          <div class="fin-pr-exsh">Ex-sh ${fL(car.ex_showroom_jodhpur)}</div>
          <div class="fin-pr-onroad">${fL(onRoad)}</div>
        </div>
      `;
      priceList.appendChild(row);
    });
  pricesWrap.appendChild(priceList);
  pane.appendChild(pricesWrap);

  // ── 5. Dealer checklist ──────────────────────────────────────────────────────
  const checkWrap = document.createElement('div');
  checkWrap.className = 'fin-section';
  checkWrap.innerHTML = `<div class="fin-sec-hd"><span>Dealer visit checklist</span></div>`;
  const checklist = document.createElement('div');
  checklist.className = 'fin-checklist';
  [
    'Ask for OTR (on-road) price in writing',
    'Negotiate accessories separately — don\'t bundle',
    'Confirm actual waiting period (not brochure estimate)',
    'Compare exchange offer with Cars24 / Spinny',
    'Confirm colour and variant availability',
    'Ask about free service package / extended warranty',
  ].forEach(text => {
    const row = document.createElement('label');
    row.className = 'fin-check-row';
    row.innerHTML = `<input type="checkbox"> ${text}`;
    checklist.appendChild(row);
  });
  checkWrap.appendChild(checklist);
  pane.appendChild(checkWrap);

  const pad = document.createElement('div');
  pad.style.height = '1.5rem';
  pane.appendChild(pad);

  if (data.last_updated) {
    const ts = document.getElementById('data-timestamp');
    if (ts) ts.textContent = `Data last updated: ${data.last_updated}`;
  }
}

function renderCompareTab() {
  const pane = document.getElementById('tab-compare');
  if (pane.dataset.rendered) return;
  pane.dataset.rendered = '1';
  renderCompare(pane);
}

async function renderRankingPlaceholder() {
  const pane = document.getElementById('tab-ranking');
  if (pane.dataset.rendered) return;
  pane.dataset.rendered = '1';

  pane.innerHTML = '<p style="padding:2rem 1.25rem;color:var(--text-muted);font-size:0.85rem">Loading…</p>';

  try {
    const { getCarsForRanking, getBaselineCar } = await import('./modules/data.js');
    const { getProfile }                         = await import('./modules/profile.js');
    const { rankCars, getBestVariantPerBrand, getBetterVFMVariant } = await import('./modules/ranking.js');
    const { calcOnRoadPrice, calcEMI }           = await import('./modules/emi.js');
    const { renderFilters, applyFilters, getStoredFilters } = await import('./modules/ui-filters.js');

    const data    = await loadCarsData();
    const profile = getProfile();
    const baseline = getBaselineCar(data);
    const allVariantsRanked = rankCars(getCarsForRanking(data), profile, baseline);
    const allRanked = getBestVariantPerBrand(allVariantsRanked);

    const seen = new Set();
    const fullRanked = allRanked.filter(c => {
      const key = `${c.brand}||${c.model}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    pane.innerHTML = '';

    // ── Filter bar ───────────────────────────────────────────────────────────
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-bar-wrapper';
    pane.appendChild(filterContainer);

    const countEl = document.createElement('p');
    countEl.className = 'results-count';
    pane.appendChild(countEl);

    const CATS = [
      { key: 'safety',          label: 'Safety',      w: 20 },
      { key: 'value_for_money', label: 'VFM',         w: 20 },
      { key: 'features',        label: 'Features',    w: 20 },
      { key: 'service',         label: 'Service',     w: 15 },
      { key: 'comfort',         label: 'Comfort',     w: 15 },
      { key: 'reliability',     label: 'Reliability', w: 10 },
    ];
    const MEDALS = ['🥇', '🥈', '🥉'];

    function waitLabel(car) {
      if (car.waiting_weeks_jodhpur == null) return '—';
      return car.waiting_weeks_jodhpur === 0 ? 'In stock' : `${car.waiting_weeks_jodhpur} wks`;
    }

    function buildTags(car) {
      const tags = [];
      if (car.airbags >= 6)          tags.push({ text: '6 Airbags',        cls: 'good' });
      if (car.ventilated_seats)      tags.push({ text: 'Vent. Seats',       cls: 'good' });
      if (car.adas)                  tags.push({ text: 'ADAS',              cls: 'good' });
      if (car.connected_car)         tags.push({ text: 'Connected car',     cls: 'good' });
      if (car.ncap_stars >= 5)       tags.push({ text: '5-star NCAP',       cls: 'good' });
      if (car.waiting_weeks_jodhpur === 0)  tags.push({ text: 'In stock',   cls: 'good' });
      else if (car.waiting_weeks_jodhpur >= 6) tags.push({ text: `${car.waiting_weeks_jodhpur}-wk wait`, cls: 'warn' });
      const sc = car.service_centers_jodhpur;
      if (sc && sc.length <= 1)      tags.push({ text: 'Limited service',   cls: 'bad'  });
      const btb = bestTimeToBuy(car);
      const btbCls = btb.color === 'green' ? 'good' : btb.color === 'orange' ? 'warn' : 'neutral';
      tags.push({ text: btb.label, cls: btbCls, tip: btb.tip });
      const betterVFM = getBetterVFMVariant(car, allVariantsRanked);
      if (betterVFM) tags.push({ text: '↓ Better VFM variant', cls: 'better-vfm',
        tip: `${betterVFM.variant} @ ₹${(betterVFM.ex_showroom_jodhpur/100000).toFixed(1)}L is better value` });
      return tags.map(t => `<span class="rnk-tag ${t.cls}"${t.tip ? ` title="${t.tip}"` : ''}>${t.text}</span>`).join('');
    }

    // ── Podium + expandable list (re-rendered on filter change) ─────────────
    const podiumEl = document.createElement('div');
    pane.appendChild(podiumEl);

    const secLbl = document.createElement('div');
    secLbl.className = 'rnk-sec-lbl';
    pane.appendChild(secLbl);

    const list = document.createElement('div');
    list.className = 'rnk-exp-list';
    pane.appendChild(list);

    const pad = document.createElement('div');
    pad.style.height = '1.5rem';
    pane.appendChild(pad);

    function renderList(ranked) {
      // Podium
      podiumEl.innerHTML = '';
      const top3 = ranked.slice(0, 3);
      if (top3.length > 0) {
        podiumEl.className = 'rnk-podium';
        const podOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
        podOrder.forEach(car => {
          const isFirst = car === top3[0];
          const medal   = MEDALS[ranked.indexOf(car)] || '';
          const onRoad  = calcOnRoadPrice(car.ex_showroom_jodhpur);
          const pod = document.createElement('div');
          pod.className = 'rnk-pod' + (isFirst ? ' rnk-pod-1' : '');
          pod.innerHTML = `
            <div class="rnk-pod-medal">${medal}</div>
            <div class="rnk-pod-score${isFirst ? ' top' : ''}">${Math.round(car.score ?? 0)}</div>
            <div class="rnk-pod-score-lbl">/ 100</div>
            <div class="rnk-pod-brand">${car.brand}</div>
            <div class="rnk-pod-model">${car.model}</div>
            <div class="rnk-pod-var">${car.variant || ''}</div>
            <div class="rnk-pod-price${isFirst ? ' top' : ''}">₹${(onRoad / 100000).toFixed(1)}L OTR</div>
          `;
          podiumEl.appendChild(pod);
        });
      } else {
        podiumEl.className = '';
      }

      // Count + section label
      countEl.textContent = `${ranked.length} car${ranked.length !== 1 ? 's' : ''} shown`;
      secLbl.textContent = ranked.length ? 'All rankings · tap to expand' : 'No cars match the selected filters';

      // Expandable list
      list.innerHTML = '';
      ranked.forEach((car, idx) => {
        const score   = Math.round(car.score ?? 0);
        const onRoad  = calcOnRoadPrice(car.ex_showroom_jodhpur);
        const wait    = waitLabel(car);
        const bd      = car.breakdown || {};
        const rankCls = idx === 0 ? ' r1' : idx === 1 ? ' r2' : idx === 2 ? ' r3' : '';
        const medal   = MEDALS[idx] ? `<span style="font-size:0.7rem">${MEDALS[idx]}</span>` : '';

        const catGrid = CATS.map(c => {
          const val = bd[c.key] != null ? Math.round(bd[c.key]) : 0;
          return `
            <div class="rnk-det-cat">
              <div class="rnk-det-cat-row">
                <span class="rnk-det-cat-name">${c.label}</span>
                <span class="rnk-det-cat-val">${val}</span>
              </div>
              <div class="rnk-det-cat-bar"><div class="rnk-det-cat-fill" style="width:${val}%"></div></div>
            </div>`;
        }).join('');

        const card = document.createElement('div');
        card.className = `rnk-exp-card${rankCls}`;
        card.innerHTML = `
          <div class="rnk-exp-row">
            <div class="rnk-exp-num">${car.rank}</div>
            <div class="rnk-exp-info">
              <div class="rnk-exp-name">${car.brand} ${car.model}</div>
              <div class="rnk-exp-sub">${car.variant || ''}</div>
            </div>
            <div class="rnk-exp-bar-col">
              <div class="rnk-exp-bar-track"><div class="rnk-exp-bar-fill" style="width:${score}%"></div></div>
              <div class="rnk-exp-score-lbl">${score}</div>
            </div>
            <div class="rnk-exp-price-col">
              <div class="rnk-exp-price">₹${(onRoad / 100000).toFixed(1)}L</div>
              <div class="rnk-exp-wait">${wait}</div>
            </div>
            <span class="rnk-exp-chev">›</span>
          </div>
          <div class="rnk-exp-detail">
            <div class="rnk-det-inner">
              <div class="rnk-det-badge">
                <div class="rnk-det-rank-num">${car.rank}</div>
                ${medal}
              </div>
              <div class="rnk-det-main">
                <div class="rnk-det-brand">${car.brand}</div>
                <div class="rnk-det-name">${car.model}</div>
                <div class="rnk-det-var">${car.variant || ''}</div>
                <div class="rnk-det-bar-wrap">
                  <div class="rnk-det-bar-track"><div class="rnk-det-bar-fill" style="width:${score}%"></div></div>
                  <span class="rnk-det-bar-pct">${score}</span>
                </div>
              </div>
              <div class="rnk-det-right">
                <div class="rnk-det-score">${score}</div>
                <div class="rnk-det-score-lbl">/ 100</div>
                <div class="rnk-det-price">₹${(onRoad / 100000).toFixed(2)}L</div>
                <div class="rnk-det-wait">${wait}</div>
              </div>
            </div>
            <div class="rnk-det-tags">${buildTags(car)}</div>
            <div class="rnk-det-cats">${catGrid}</div>
            <div class="rnk-det-actions">
              <button class="rnk-det-btn rnk-det-btn-primary" data-id="${car.id}">View details</button>
              <button class="rnk-det-btn rnk-det-btn-secondary" data-id="${car.id}">Compare</button>
            </div>
          </div>
        `;

        card.querySelector('.rnk-exp-row').addEventListener('click', () => {
          const wasOpen = card.classList.contains('open');
          list.querySelectorAll('.rnk-exp-card').forEach(c => c.classList.remove('open'));
          if (!wasOpen) card.classList.add('open');
        });

        card.querySelector('.rnk-det-btn-primary')?.addEventListener('click', e => {
          e.stopPropagation();
          renderDetailPanel(car, ranked, baseline);
        });

        card.querySelector('.rnk-det-btn-secondary')?.addEventListener('click', e => {
          e.stopPropagation();
          renderCompareTab();
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent('suv:addToCompare', { detail: { car } }));
          }, 50);
          switchTab('compare');
        });

        list.appendChild(card);
      });
    }

    // Wire filters
    renderFilters(filterContainer, filters => {
      const filtered = applyFilters(fullRanked, filters);
      renderList(filtered);
    });

    // Initial render
    renderList(applyFilters(fullRanked, getStoredFilters()));

  } catch (e) {
    pane.innerHTML = `<p style="padding:2rem 1.25rem;color:var(--red)">Failed to load: ${e.message}</p>`;
  }
}

function initTheme() {
  const saved = localStorage.getItem('suv_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.textContent = saved === 'dark' ? '☀️' : '🌙';
  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('suv_theme', next);
    btn.textContent = next === 'dark' ? '☀️' : '🌙';
  });
}

function init() {
  initTheme();

  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Detail panel events
  document.addEventListener('suv:ensureCompare', () => renderCompareTab());
  document.addEventListener('suv:openCompare', () => switchTab('compare'));

  document.getElementById('profile-btn')?.addEventListener('click', () => {
    openProfileEditor((updatedProfile) => {
      // Re-render home tab with new profile
      invalidateCache();
      homeRendered = false;
      const homePaneEl = document.getElementById('tab-home');
      homePaneEl.innerHTML = '';
      if (activeTab === 'home') {
        homeRendered = true;
        renderHome(homePaneEl).then(() => applyGlossaryTooltips(homePaneEl)).catch(() => {});
      }
    });
  });

  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    const btn = document.getElementById('refresh-btn');
    btn.textContent = '⏳';
    btn.disabled = true;
    import('./modules/data.js').then(({ invalidateCache }) => {
      invalidateCache();
      homeRendered = false;
      const homePaneEl = document.getElementById('tab-home');
      homePaneEl.innerHTML = '';
      const rankingPane = document.getElementById('tab-ranking');
      rankingPane.innerHTML = '';
      delete rankingPane.dataset.rendered;
      const comparePane = document.getElementById('tab-compare');
      comparePane.innerHTML = '';
      delete comparePane.dataset.rendered;
      if (activeTab === 'home') {
        homeRendered = true;
        renderHome(homePaneEl);
      } else if (activeTab === 'ranking') {
        renderRankingPlaceholder();
      } else if (activeTab === 'compare') {
        renderCompareTab();
      }
    }).finally(() => {
      btn.textContent = '↻';
      btn.disabled = false;
    });
  });

  loadCarsData().then(data => {
    if (data.last_updated) {
      const ts = document.getElementById('data-timestamp');
      if (ts) ts.textContent = `Data last updated: ${data.last_updated}`;
    }
  }).catch(() => {});

  switchTab('home');

  // Auto-open detail panel if ?car=id is in URL (for shareable links)
  const carId = new URLSearchParams(window.location.search).get('car');
  if (carId) _openCarById(carId);
}

async function _openCarById(carId) {
  try {
    const [data, { rankCars, getBestVariantPerBrand }, { getProfile }, { getBaselineCar, getCarsForRanking }] =
      await Promise.all([
        loadCarsData(),
        import('./modules/ranking.js'),
        import('./modules/profile.js'),
        import('./modules/data.js')
      ]);
    const baseline = getBaselineCar(data);
    const ranked = getBestVariantPerBrand(rankCars(getCarsForRanking(data), getProfile(), baseline));
    const target = ranked.find(c => c.id === carId) || data.cars.find(c => c.id === carId);
    if (target) renderDetailPanel(target, ranked, baseline);
  } catch (_) {}
}

document.addEventListener('DOMContentLoaded', init);
