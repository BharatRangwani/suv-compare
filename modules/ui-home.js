// modules/ui-home.js

import { loadCarsData, getBaselineCar, getCarsForRanking, invalidateCache } from './data.js';
import { getProfile, saveProfile } from './profile.js';
import { rankCars, calcNOC, getVFMTag, getBestVariantPerBrand, getBetterVFMVariant } from './ranking.js';
import { renderFilters, applyFilters, getStoredFilters } from './ui-filters.js';
import { renderDetailPanel } from './ui-detail.js';

const ANNUAL_KM_MAP = {
  '8k': 22,   // 8,000 km/yr ÷ (365 × 7/7) → daily_km
  '12k': 33,
  '18k': 49,
  '25k': 68,
  '35k': 96,
};

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

  // ── Live hero data ───────────────────────────────────────────────────────────
  const nonBaseline = allRanked.filter(c => !c.is_baseline);
  const topCar = nonBaseline[0];
  const prices = nonBaseline.map(c => c.ex_showroom_jodhpur).filter(Boolean);
  const minL = prices.length ? Math.floor(Math.min(...prices) / 100000) : 12;
  const maxL = prices.length ? Math.ceil(Math.max(...prices) / 100000) : 22;
  const evCount = nonBaseline.filter(c => c.fuel === 'electric').length;
  const avgScore = nonBaseline.length
    ? Math.round(nonBaseline.reduce((s, c) => s + (c.score || 0), 0) / nonBaseline.length)
    : 0;
  const top5SafeCount = nonBaseline.filter(c => (c.ncap_stars || 0) >= 5).length;
  const budgetL = Math.round((profile.budget_max || 2500000) / 100000);

  // Slides: each has a label, big number, sub text
  const slides = [
    { eyebrow: 'Top Pick', num: topCar ? `${topCar.brand} ${topCar.model}` : '—',
      sub: topCar ? `Score ${topCar.score} · ₹${formatLakh(topCar.ex_showroom_jodhpur * 1.11 + 15000 + topCar.ex_showroom_jodhpur * 0.035)}L on-road` : '' },
    { eyebrow: 'SUVs Ranked', num: String(nonBaseline.length),
      sub: `₹${minL}L to ₹${maxL}L · 6 scored criteria` },
    { eyebrow: 'Your Budget', num: `₹${budgetL}L`,
      sub: `${nonBaseline.filter(c => c.ex_showroom_jodhpur * 1.145 + 15000 <= profile.budget_max).length} cars within reach` },
    { eyebrow: 'Electric Options', num: String(evCount),
      sub: evCount ? `EV range from ${Math.min(...nonBaseline.filter(c=>c.fuel==='electric').map(c=>c.realworld_range_km||0))} km` : 'More EVs coming soon' },
    { eyebrow: '5-Star Safety', num: String(top5SafeCount),
      sub: `${top5SafeCount} cars with 5-star NCAP rating` },
  ];

  // ── Hero slideshow ───────────────────────────────────────────────────────────
  const hero = document.createElement('div');
  hero.className = 'hero-split';
  hero.innerHTML = `
    <div class="hero-left">
      <p class="hero-eyebrow">Jodhpur, Rajasthan</p>
      <h2 class="hero-title">Find Your <strong>Next SUV</strong></h2>
      <p class="hero-sub">Ranked for your budget &amp; must-haves. Updated June 2026.</p>
    </div>
    <div class="hero-slide-wrap">
      <div class="hero-slide-track" id="hero-slide-track">
        ${slides.map((s, i) => `
          <div class="hero-slide${i === 0 ? ' active' : ''}">
            <span class="hs-eyebrow">${s.eyebrow}</span>
            <span class="hs-num">${s.num}</span>
            <span class="hs-label">${s.sub}</span>
          </div>`).join('')}
      </div>
      <div class="hero-slide-dots" id="hero-slide-dots">
        ${slides.map((_, i) => `<button class="hs-dot${i===0?' active':''}" data-idx="${i}" aria-label="Slide ${i+1}"></button>`).join('')}
      </div>
    </div>
  `;
  container.appendChild(hero);

  // Slideshow logic
  let slideIdx = 0;
  let slideTimer = null;
  const track = hero.querySelector('#hero-slide-track');
  const dotsEl = hero.querySelector('#hero-slide-dots');

  function goToSlide(n) {
    const allSlides = track.querySelectorAll('.hero-slide');
    const allDots = dotsEl.querySelectorAll('.hs-dot');
    allSlides[slideIdx]?.classList.remove('active');
    allDots[slideIdx]?.classList.remove('active');
    slideIdx = (n + slides.length) % slides.length;
    allSlides[slideIdx]?.classList.add('active');
    allDots[slideIdx]?.classList.add('active');
  }

  function startTimer() {
    clearInterval(slideTimer);
    slideTimer = setInterval(() => goToSlide(slideIdx + 1), 3500);
  }

  dotsEl.addEventListener('click', e => {
    const dot = e.target.closest('.hs-dot');
    if (!dot) return;
    goToSlide(parseInt(dot.dataset.idx));
    startTimer();
  });

  startTimer();

  // ── Must-have chips row ──────────────────────────────────────────────────────
  const chipsRow = document.createElement('div');
  chipsRow.className = 'chips-row';
  const mustLabels = { '6_airbags': '6 Airbags', ventilated_seats: 'Vent. Seats', connected_car: 'Connected Car' };
  const fuels = (profile.fuel_preference || ['petrol_turbo']).map(f =>
    ({ petrol_turbo:'Petrol Turbo', diesel:'Diesel', electric:'Electric', cng:'CNG', strong_hybrid:'Strong Hybrid' }[f] || f)
  );
  chipsRow.innerHTML = [
    `₹${budgetL}L Budget`,
    ...fuels,
    ...(profile.must_haves || []).map(k => mustLabels[k] || k)
  ].map(t => `<span class="mchip">${t}</span>`).join('');
  container.appendChild(chipsRow);

  // ── Variant disclaimer ───────────────────────────────────────────────────────
  const disclaimer = document.createElement('p');
  disclaimer.className = 'variant-disclaimer';
  disclaimer.innerHTML = 'Showing best-ranked variant per model. Use filters to see all variants &amp; powertrains.';
  container.appendChild(disclaimer);

  // ── Sort + filter bar ────────────────────────────────────────────────────────
  const filterContainer = document.createElement('div');
  filterContainer.className = 'filter-bar-wrapper';
  container.appendChild(filterContainer);

  // Sort control
  const sortBar = document.createElement('div');
  sortBar.className = 'sort-bar';
  sortBar.innerHTML = `
    <span class="sort-label">Sort:</span>
    <div class="sort-chips" id="sort-chips">
      <button class="sort-chip active" data-sort="score">Best Match</button>
      <button class="sort-chip" data-sort="price_asc">Price ↑</button>
      <button class="sort-chip" data-sort="price_desc">Price ↓</button>
      <button class="sort-chip" data-sort="safety">Safety</button>
      <button class="sort-chip" data-sort="mileage">Mileage</button>
      <button class="sort-chip" data-sort="waiting">Waiting ↑</button>
    </div>`;
  container.appendChild(sortBar);

  let currentSort = 'score';
  sortBar.querySelector('#sort-chips').addEventListener('click', e => {
    const btn = e.target.closest('.sort-chip');
    if (!btn) return;
    sortBar.querySelectorAll('.sort-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.sort;
    refresh(getStoredFilters());
  });

  const countEl = document.createElement('p');
  countEl.className = 'results-count';
  container.appendChild(countEl);

  const listContainer = document.createElement('div');
  listContainer.className = 'car-list';
  container.appendChild(listContainer);

  function applySortOrder(cars) {
    const sorted = [...cars];
    if (currentSort === 'price_asc')  return sorted.sort((a,b) => (a.ex_showroom_jodhpur||0) - (b.ex_showroom_jodhpur||0));
    if (currentSort === 'price_desc') return sorted.sort((a,b) => (b.ex_showroom_jodhpur||0) - (a.ex_showroom_jodhpur||0));
    if (currentSort === 'safety')     return sorted.sort((a,b) => (b.ncap_stars||0) - (a.ncap_stars||0));
    if (currentSort === 'mileage')    return sorted.sort((a,b) => {
      const ma = a.fuel==='electric' ? (a.realworld_range_km||0)/10 : (a.realworld_kmpl||0);
      const mb = b.fuel==='electric' ? (b.realworld_range_km||0)/10 : (b.realworld_kmpl||0);
      return mb - ma;
    });
    if (currentSort === 'waiting')    return sorted.sort((a,b) => (a.waiting_weeks_jodhpur??99) - (b.waiting_weeks_jodhpur??99));
    return sorted; // 'score' — already ranked
  }

  function refresh(filters) {
    const filtered = applyFilters(allRanked, filters);
    const nonBaselineCount = filtered.filter(c => !c.is_baseline).length;
    countEl.textContent = `${nonBaselineCount} car${nonBaselineCount !== 1 ? 's' : ''} shown`;
    const sortedFiltered = applySortOrder(filtered);
    renderCarList(listContainer, sortedFiltered, baseline, allRanked);
  }

  let lastAnnualKm = 'all';

  renderFilters(filterContainer, async (filters) => {
    // Annual KM filter: update profile daily_km, re-rank, then refresh
    if (filters.annual_km !== lastAnnualKm) {
      lastAnnualKm = filters.annual_km;
      const dailyKm = ANNUAL_KM_MAP[filters.annual_km] || profile.daily_km;
      if (filters.annual_km !== 'all') {
        saveProfile({ ...profile, daily_km: dailyKm });
        profile = { ...profile, daily_km: dailyKm };
      } else {
        // reset to default profile daily_km
        const freshProfile = getProfile();
        profile = freshProfile;
      }
      invalidateCache();
      const carsForRanking = getCarsForRanking(data);
      const ranked = rankCars(carsForRanking, profile, baseline);
      allRanked = getBestVariantPerBrand(ranked);
    }
    refresh(filters);
  });

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

}

// ─── Single car card (option-final bar-row style) ────────────────────────────

const FUEL_LABELS = {
  petrol_turbo: 'Petrol Turbo', diesel: 'Diesel', cng: 'CNG',
  electric: 'Electric', strong_hybrid: 'Strong Hybrid',
  mild_hybrid: 'Mild Hybrid', petrol: 'Petrol'
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
  variantEl.textContent = car.variant ? (car.launch_year ? `${car.variant} (${car.launch_year})` : car.variant) : '';
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
  tagsRow.addEventListener('click', e => e.stopPropagation());

  if (!isBaseline) {
    if (car.fuel === 'electric') {
      const evTag = document.createElement('span');
      evTag.className = 'btag btag-ev';
      evTag.textContent = '⚡ EV';
      tagsRow.appendChild(evTag);
      const rangeTag = document.createElement('span');
      rangeTag.className = 'btag';
      rangeTag.textContent = car.realworld_range_km ? `~${car.realworld_range_km}km range` : `${car.arai_range_km || '?'}km ARAI`;
      tagsRow.appendChild(rangeTag);
    } else if (car.fuel === 'cng') {
      const cngTag = document.createElement('span');
      cngTag.className = 'btag btag-cng';
      cngTag.textContent = '🔵 CNG';
      tagsRow.appendChild(cngTag);
      const mileTag = document.createElement('span');
      mileTag.className = 'btag';
      mileTag.textContent = car.realworld_cng_kmkg ? `~${car.realworld_cng_kmkg} km/kg` : '';
      if (mileTag.textContent) tagsRow.appendChild(mileTag);
    }
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

    const vfmTag = car.vfm_tag || getVFMTag(car, allRanked);
    const vfmLabels = { excellent: 'Excellent VFM', fair: 'Fair VFM', overpriced: 'Overpriced' };
    const vt = document.createElement('span');
    vt.className = `btag${vfmTag === 'excellent' ? ' hit' : ''}`;
    vt.textContent = vfmLabels[vfmTag] || vfmTag;
    tagsRow.appendChild(vt);

    const betterVariant = getBetterVFMVariant(car, allRanked);
    if (betterVariant) {
      const bv = document.createElement('span');
      bv.className = 'btag btag-better-vfm';
      bv.title = `${betterVariant.variant} at ₹${(betterVariant.ex_showroom_jodhpur/100000).toFixed(1)}L is better value`;
      bv.textContent = '↓ Better VFM variant';
      tagsRow.appendChild(bv);
    }

    // Ethanol badge
    if (car.ethanol_compatible) {
      const etag = document.createElement('span');
      etag.className = 'btag btag-ethanol';
      etag.title = 'Engine supports up to E20 ethanol-blended petrol (as per BS6 Phase 2 mandate)';
      etag.textContent = `⛽ ${car.ethanol_compatible}`;
      tagsRow.appendChild(etag);
    }
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

    // NOC label
    const nocEl = document.createElement('div');
    nocEl.style.cssText = 'font-size:0.65rem;color:var(--text-dim);margin-top:0.18rem;font-weight:500';
    nocEl.title = 'Net Ownership Cost: road tax + registration + 5yr insurance + 5yr fuel + 5yr maintenance − resale value';
    nocEl.textContent = car.noc != null ? `NOC ₹${formatLakh(car.noc)}L` : '';

    // Per-km cost
    const pkmEl = document.createElement('div');
    pkmEl.style.cssText = 'font-size:0.62rem;color:var(--text-dim);margin-top:0.06rem';
    pkmEl.textContent = car.perKmCost != null ? `₹${car.perKmCost.toFixed(1)}/km` : '';

    const weeks = car.waiting_weeks_jodhpur;
    right.appendChild(scoreEl);
    right.appendChild(priceEl);
    right.appendChild(nocEl);
    right.appendChild(pkmEl);
    if (weeks != null) {
      const waitEl = document.createElement('div');
      waitEl.style.cssText = `font-size:0.65rem;margin-top:0.2rem;font-weight:600;color:var(--${waitingColor(weeks) === 'green' ? 'green' : waitingColor(weeks) === 'yellow' ? 'yellow' : 'orange'})`;
      waitEl.textContent = weeks === 0 ? 'In stock' : `${weeks}w wait`;
      right.appendChild(waitEl);
    }
    const btb = bestTimeToBuy(car);
    const btbEl = document.createElement('div');
    btbEl.className = 'btb-tag';
    btbEl.dataset.color = btb.color;
    btbEl.title = btb.tip;
    btbEl.textContent = btb.label;
    right.appendChild(btbEl);
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

// "Best Time to Buy" — derived from stock, model age, and launch year
export function bestTimeToBuy(car) {
  const now = new Date().getFullYear();
  const wait = car.waiting_weeks_jodhpur ?? 99;
  const launchAge = now - (car.launch_year || now);
  const isNew = !!car.is_new_model;

  if (isNew) return { label: 'Prices settling', color: 'yellow', tip: 'New model — wait 2–3 months for prices and offers to stabilise.' };
  if (wait >= 8) return { label: 'Wait for stock', color: 'orange', tip: `${wait}w wait in Jodhpur — high demand. Dealers less likely to negotiate.` };
  if (wait === 0 && launchAge >= 2) return { label: 'Buy Now ✓', color: 'green', tip: 'In stock + mature model. Best chance for dealer discounts and exchange offers.' };
  if (wait <= 2 && launchAge >= 1) return { label: 'Good time', color: 'green', tip: 'Low wait time and settled market. Dealers are open to negotiation.' };
  if (launchAge === 0) return { label: 'Just launched', color: 'yellow', tip: 'Launched this year — prices and variants are still stabilising.' };
  return { label: 'Anytime', color: 'blue', tip: 'No strong reason to wait or rush. Negotiate on accessories and insurance.' };
}
