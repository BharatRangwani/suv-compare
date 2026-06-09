// modules/ui-home.js

import { loadCarsData, getBaselineCar, getCarsForRanking } from './data.js';
import { getProfile } from './profile.js';
import { rankCars, getVFMTag, getBestVariantPerBrand } from './ranking.js';
import { renderFilters, applyFilters, getStoredFilters } from './ui-filters.js';
import { renderDetailPanel } from './ui-detail.js';

// ─── Public entry point ───────────────────────────────────────────────────────

export async function renderHome(container) {
  // Show loading state immediately
  container.innerHTML = '<p class="loading-text">Loading...</p>';

  let data, profile, baseline, allRanked;

  try {
    [data, profile] = await Promise.all([loadCarsData(), Promise.resolve(getProfile())]);
    baseline = getBaselineCar(data);
    const carsForRanking = getCarsForRanking(data);
    const ranked = rankCars(carsForRanking, profile, baseline);
    allRanked = getBestVariantPerBrand(ranked);
  } catch (err) {
    container.innerHTML = `<p class="error-text">Failed to load car data: ${err.message}</p>`;
    return;
  }

  // Build page structure
  container.innerHTML = '';

  // Hero section — split grid matching option-final design
  const topCount = allRanked.filter(c => !c.is_baseline).length;
  const hero = document.createElement('div');
  hero.className = 'hero-split';
  hero.innerHTML = `
    <div class="hero-left">
      <p class="hero-eyebrow">Jodhpur, Rajasthan</p>
      <h2 class="hero-title">Find Your <strong>Next SUV</strong></h2>
      <p class="hero-sub">Ranked for your budget &amp; must-haves. Updated June 2025.</p>
    </div>
    <div class="hero-right">
      <div class="hero-stat">
        <span class="hs-num">${topCount}</span>
        <span class="hs-label">SUVs ranked</span>
      </div>
      <div class="hero-divider"></div>
      <div class="hero-stat">
        <span class="hs-num">₹12–22L</span>
        <span class="hs-label">Price range</span>
      </div>
      <div class="hero-divider"></div>
      <div class="hero-stat">
        <span class="hs-num">6</span>
        <span class="hs-label">Criteria scored</span>
      </div>
    </div>
  `;
  container.appendChild(hero);

  // Must-have chips row
  const chipsRow = document.createElement('div');
  chipsRow.className = 'chips-row';
  chipsRow.innerHTML = `
    <span class="mchip">₹20L Budget</span>
    <span class="mchip">Petrol Turbo</span>
    <span class="mchip">6 Airbags</span>
    <span class="mchip">Ventilated Seats</span>
  `;
  container.appendChild(chipsRow);

  const filterContainer = document.createElement('div');
  filterContainer.className = 'filter-bar-wrapper';
  container.appendChild(filterContainer);

  const countEl = document.createElement('p');
  countEl.className = 'results-count';
  container.appendChild(countEl);

  const listContainer = document.createElement('div');
  listContainer.className = 'car-list';
  container.appendChild(listContainer);

  function refresh(filters) {
    const filtered = applyFilters(allRanked, filters);
    // Exclude baseline from count display
    const nonBaselineCount = filtered.filter(c => !c.is_baseline).length;
    countEl.textContent = `${nonBaselineCount} car${nonBaselineCount !== 1 ? 's' : ''} shown`;
    renderCarList(listContainer, filtered, baseline, allRanked);
  }

  // Mount filter bar — on change re-render card list only
  renderFilters(filterContainer, (filters) => {
    refresh(filters);
  });

  // Initial render with stored filters
  refresh(getStoredFilters());
}

// ─── Car list renderer ────────────────────────────────────────────────────────

function renderCarList(container, rankedCars, baseline, allRanked) {
  container.innerHTML = '';

  // Show only the best variant per brand+model, maintaining rank order
  const seen = new Set();
  const deduped = rankedCars.filter(c => {
    if (c.is_baseline) return false;
    const key = `${c.brand}||${c.model}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Re-number ranks after dedup
  deduped.forEach((car, i) => {
    container.appendChild(renderCarCard({ ...car, rank: i + 1 }, allRanked, baseline));
  });

  // Always render baseline card at the bottom
  if (baseline) {
    container.appendChild(renderCarCard(baseline, allRanked, baseline));
  }
}

// ─── Single car card (option-final bar-row style) ────────────────────────────

const FUEL_LABELS = {
  petrol_turbo: 'Petrol Turbo', diesel: 'Diesel',
  strong_hybrid: 'Strong Hybrid', mild_hybrid: 'Mild Hybrid', petrol: 'Petrol'
};

function renderCarCard(car, allRanked, baseline) {
  const isBaseline = !!car.is_baseline;
  const card = document.createElement('div');
  const isTop = !isBaseline && car.rank === 1;

  card.className = isBaseline ? 'car-card baseline-card' : `car-card${isTop ? '' : ''}`;
  if (!isBaseline) {
    if (car.rank) card.dataset.rank = car.rank;
    card.addEventListener('click', () => renderDetailPanel(car, allRanked, baseline));
  }

  // ── Rank number ─────────────────────────────────────────────────────────────
  const rankEl = document.createElement('div');
  rankEl.className = 'rank-badge' + (isTop ? '' : '');
  rankEl.innerHTML = isBaseline
    ? '<span class="baseline-rank">Baseline</span>'
    : `${car.rank}`;

  // ── Centre info block ────────────────────────────────────────────────────────
  const info = document.createElement('div');
  info.className = 'car-name';

  // Brand (small caps above model)
  const brandEl = document.createElement('div');
  brandEl.className = 'car-brand-label';
  brandEl.style.cssText = 'font-size:0.62rem;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.1rem';
  brandEl.textContent = car.brand || '';

  // Model + variant
  const modelRow = document.createElement('div');
  modelRow.style.cssText = 'display:flex;align-items:baseline;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.35rem';
  const modelEl = document.createElement('span');
  modelEl.style.cssText = 'font-size:1.05rem;font-weight:700;color:var(--text);letter-spacing:-0.02em;line-height:1.2';
  modelEl.textContent = car.model || '';
  const variantEl = document.createElement('span');
  variantEl.style.cssText = 'font-size:0.72rem;color:var(--text-muted);font-weight:400';
  variantEl.textContent = car.variant || '';
  modelRow.appendChild(modelEl);
  if (!isBaseline) modelRow.appendChild(variantEl);

  // Score bar
  const barTrack = document.createElement('div');
  barTrack.className = 'score-bar-track';
  const barFill = document.createElement('div');
  barFill.className = 'score-bar-fill';
  barFill.style.width = isBaseline ? '0%' : `${car.score || 0}%`;
  barTrack.appendChild(barFill);

  // Feature tags
  const tagsRow = document.createElement('div');
  tagsRow.className = 'bar-tags';

  if (!isBaseline) {
    const mustHaveTags = [
      { label: '6 Airbags', hit: (car.airbags || 0) >= 6 },
      { label: 'Vent. Seats', hit: !!car.ventilated_seats },
      { label: 'Connected Car', hit: !!car.connected_car },
    ];
    mustHaveTags.forEach(({ label, hit }) => {
      const t = document.createElement('span');
      t.className = 'btag' + (hit ? ' hit' : '');
      t.textContent = label;
      tagsRow.appendChild(t);
    });

    const vfmTag = getVFMTag(car, allRanked);
    const vfmLabels = { excellent: 'Excellent VFM', fair: 'Fair VFM', overpriced: 'Overpriced' };
    const vt = document.createElement('span');
    vt.className = `btag${vfmTag === 'excellent' ? ' hit' : ''}`;
    vt.textContent = vfmLabels[vfmTag] || vfmTag;
    tagsRow.appendChild(vt);
  } else {
    const fuel = FUEL_LABELS[car.fuel] || car.fuel || '';
    [fuel, `${car.engine_cc || 0}cc`, 'Baseline'].forEach(t => {
      const el = document.createElement('span');
      el.className = 'btag';
      el.textContent = t;
      tagsRow.appendChild(el);
    });
  }

  info.appendChild(brandEl);
  info.appendChild(modelRow);
  if (!isBaseline) info.appendChild(barTrack);
  info.appendChild(tagsRow);

  // ── Right column: score + price ──────────────────────────────────────────────
  const right = document.createElement('div');
  right.style.cssText = 'text-align:right;flex-shrink:0;min-width:52px';

  if (!isBaseline) {
    const scoreEl = document.createElement('div');
    scoreEl.className = 'car-score';
    scoreEl.textContent = car.score != null ? Math.round(car.score) : '—';

    const exSR = car.ex_showroom_jodhpur || 0;
    const onRoad = exSR * 1.11 + 15000 + exSR * 0.035;
    const priceEl = document.createElement('div');
    priceEl.style.cssText = 'font-size:0.72rem;color:var(--text-muted);margin-top:0.2rem';
    priceEl.textContent = exSR ? `₹${formatLakh(onRoad)}L` : '—';

    const weeks = car.waiting_weeks_jodhpur;
    if (weeks != null) {
      const waitEl = document.createElement('div');
      waitEl.style.cssText = `font-size:0.65rem;margin-top:0.2rem;font-weight:600;color:var(--${waitingColor(weeks) === 'green' ? 'green' : waitingColor(weeks) === 'yellow' ? 'yellow' : 'orange'})`;
      waitEl.textContent = weeks === 0 ? 'In stock' : `${weeks}w wait`;
      right.appendChild(scoreEl);
      right.appendChild(priceEl);
      right.appendChild(waitEl);
    } else {
      right.appendChild(scoreEl);
      right.appendChild(priceEl);
    }
  } else {
    const label = document.createElement('div');
    label.style.cssText = 'font-size:0.68rem;color:var(--text-dim);text-align:right';
    label.textContent = 'Your car';
    right.appendChild(label);
  }

  // ── Assemble ─────────────────────────────────────────────────────────────────
  const inner = document.createElement('div');
  inner.className = 'car-card-header';
  inner.appendChild(rankEl);
  inner.appendChild(info);
  inner.appendChild(right);
  card.appendChild(inner);

  return card;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLakh(rupees) {
  const lakh = (rupees || 0) / 100000;
  return lakh.toFixed(2);
}

function waitingColor(weeks) {
  if (weeks === 0) return 'green';
  if (weeks <= 4) return 'yellow';
  if (weeks <= 8) return 'orange';
  return 'red';
}
