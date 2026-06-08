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

  // Render non-baseline ranked cars
  const ranked = rankedCars.filter(c => !c.is_baseline);
  ranked.forEach(car => {
    container.appendChild(renderCarCard(car, allRanked, baseline));
  });

  // Always render baseline card at the bottom
  if (baseline) {
    container.appendChild(renderCarCard(baseline, allRanked, baseline));
  }
}

// ─── Single car card ──────────────────────────────────────────────────────────

function renderCarCard(car, allRanked, baseline) {
  const isBaseline = !!car.is_baseline;

  const card = document.createElement('div');
  card.className = 'car-card' + (isBaseline ? ' baseline-card' : '');
  if (!isBaseline) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => renderDetailPanel(car, allRanked, baseline));
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'car-card-header';

  if (isBaseline) {
    const baselineLabel = document.createElement('div');
    baselineLabel.className = 'rank-badge baseline-rank';
    baselineLabel.textContent = 'Baseline';
    header.appendChild(baselineLabel);
  } else {
    const rankBadge = document.createElement('div');
    rankBadge.className = 'rank-badge';
    rankBadge.textContent = `#${car.rank || '—'}`;
    header.appendChild(rankBadge);
  }

  const nameBlock = document.createElement('div');
  nameBlock.className = 'car-name';
  const h3 = document.createElement('h3');
  h3.textContent = `${car.brand || ''} ${car.model || ''}`.trim();
  const variantP = document.createElement('p');
  variantP.className = 'variant-name';
  variantP.textContent = car.variant || '';
  nameBlock.appendChild(h3);
  nameBlock.appendChild(variantP);
  header.appendChild(nameBlock);

  if (!isBaseline) {
    const scoreEl = document.createElement('div');
    scoreEl.className = 'car-score';
    scoreEl.textContent = `${car.score != null ? car.score : '—'}/100`;
    header.appendChild(scoreEl);
  }

  card.appendChild(header);

  // ── Badges row ──────────────────────────────────────────────────────────────
  const badgeRow = document.createElement('div');
  badgeRow.className = 'badge-row';

  if (!isBaseline) {
    // VFM tag
    const vfmTag = getVFMTag(car, allRanked);
    const vfmEl = document.createElement('span');
    vfmEl.className = `vfm-tag vfm-${vfmTag}`;
    const vfmLabels = { excellent: 'Excellent VFM', fair: 'Fair VFM', overpriced: 'Overpriced' };
    vfmEl.textContent = vfmLabels[vfmTag] || vfmTag;
    badgeRow.appendChild(vfmEl);

    // Best variant badge
    if (car.is_best_variant_for_user) {
      const bestBadge = document.createElement('span');
      bestBadge.className = 'best-badge';
      bestBadge.textContent = 'Best Variant for You';
      badgeRow.appendChild(bestBadge);
    }
  }

  // Waiting badge (shown for all cars including baseline if data present)
  const weeks = car.waiting_weeks_jodhpur;
  if (weeks != null) {
    const colorSuffix = waitingColor(weeks);
    const waitBadge = document.createElement('span');
    waitBadge.className = `spec-chip waiting-chip waiting-${colorSuffix}`;
    waitBadge.textContent = weeks === 0 ? 'Available Now' : `${weeks} wk${weeks !== 1 ? 's' : ''} wait`;
    badgeRow.appendChild(waitBadge);
  }

  if (badgeRow.children.length > 0) {
    card.appendChild(badgeRow);
  }

  // ── Spec chips ──────────────────────────────────────────────────────────────
  const specChips = document.createElement('div');
  specChips.className = 'spec-chips';

  const fuelLabels = {
    petrol_turbo: 'Petrol Turbo',
    diesel: 'Diesel',
    strong_hybrid: 'Strong Hybrid',
    mild_hybrid: 'Mild Hybrid',
    petrol: 'Petrol'
  };

  const specs = [
    fuelLabels[car.fuel] || (car.fuel || 'Unknown'),
    car.transmission || 'Unknown',
    `${car.airbags || 0} airbags`,
    `${car.engine_cc || 0} cc / ${car.power_bhp || 0} bhp`,
    ...(car.ncap_stars ? [`${car.ncap_stars}★ NCAP`] : []),
    `${car.realworld_kmpl || 0} kmpl real`,
    `${car.boot_litres || 0} L boot`
  ];

  specs.forEach(text => {
    const chip = document.createElement('span');
    chip.className = 'spec-chip';
    chip.textContent = text;
    specChips.appendChild(chip);
  });

  card.appendChild(specChips);

  // ── Must-have check row (non-baseline only) ─────────────────────────────────
  if (!isBaseline) {
    const mustHaveChecks = [
      { key: '6_airbags', label: '6 Airbags', met: (car.airbags || 0) >= 6 },
      { key: 'ventilated_seats', label: 'Ventilated Seats', met: !!car.ventilated_seats },
      { key: 'connected_car', label: 'Connected Car', met: !!car.connected_car }
    ];

    const mustHaveRow = document.createElement('div');
    mustHaveRow.className = 'must-have-row';

    mustHaveChecks.forEach(({ label, met }) => {
      const item = document.createElement('span');
      item.className = `must-have-item ${met ? 'met' : 'unmet'}`;
      item.textContent = `${met ? '✓' : '✗'} ${label}`;
      mustHaveRow.appendChild(item);
    });

    card.appendChild(mustHaveRow);
  }

  // ── Known issues preview ─────────────────────────────────────────────────────
  const issues = car.known_issues || [];
  const topIssue = issues.find(i => i.severity === 'Critical') ||
                   issues.find(i => i.severity === 'Watch');
  if (topIssue) {
    const issueEl = document.createElement('div');
    issueEl.className = `issues-preview severity-${topIssue.severity.toLowerCase()}`;
    issueEl.textContent = `⚠ ${topIssue.issue}`;
    card.appendChild(issueEl);
  }

  // ── Price row ────────────────────────────────────────────────────────────────
  const priceRow = document.createElement('div');
  priceRow.className = 'price-row';

  if (isBaseline) {
    const currentCarLabel = document.createElement('span');
    currentCarLabel.className = 'current-car-label';
    currentCarLabel.textContent = 'Current car — no purchase price';
    priceRow.appendChild(currentCarLabel);
  } else {
    const exSR = car.ex_showroom_jodhpur || 0;
    const onRoad = exSR * 1.11 + 15000 + exSR * 0.035;

    // TCO: use pre-computed value on ranked car if available, else omit
    const tco = car.tco;

    const exEl = document.createElement('span');
    exEl.className = 'ex-showroom';
    exEl.textContent = `Ex-sh: ₹${formatLakh(exSR)}L`;
    priceRow.appendChild(exEl);

    const onRoadEl = document.createElement('span');
    onRoadEl.className = 'on-road';
    onRoadEl.textContent = `On-road: ~₹${formatLakh(onRoad)}L`;
    priceRow.appendChild(onRoadEl);

    if (tco != null) {
      const tcoEl = document.createElement('span');
      tcoEl.className = 'tco-5yr';
      tcoEl.textContent = `5yr TCO: ₹${formatLakh(tco)}L`;
      priceRow.appendChild(tcoEl);
    }
  }

  card.appendChild(priceRow);

  // ── Annual costs row (non-baseline) ─────────────────────────────────────────
  if (!isBaseline) {
    const ins = car.annual_insurance_estimate || 0;
    const svc = car.annual_maintenance_estimate || 0;
    if (ins > 0 || svc > 0) {
      const annualRow = document.createElement('div');
      annualRow.className = 'annual-costs';
      annualRow.textContent = `Ins: ₹${ins.toLocaleString('en-IN')}/yr · Service: ₹${svc.toLocaleString('en-IN')}/yr`;
      card.appendChild(annualRow);
    }
  }

  // ── Score breakdown (non-baseline, collapsible) ──────────────────────────────
  if (!isBaseline && car.breakdown) {
    const bd = car.breakdown;
    const details = document.createElement('details');
    details.className = 'score-breakdown';

    const summary = document.createElement('summary');
    summary.textContent = 'Score breakdown';
    details.appendChild(summary);

    const breakdownText = document.createElement('p');
    breakdownText.className = 'breakdown-content';
    breakdownText.textContent = [
      `Safety: ${bd.safety ?? '—'}`,
      `VFM: ${bd.value_for_money ?? '—'}`,
      `Features: ${bd.features ?? '—'}`,
      `Service: ${bd.service ?? '—'}`,
      `Comfort: ${bd.comfort ?? '—'}`,
      `Reliability: ${bd.reliability ?? '—'}`
    ].join(' · ');
    details.appendChild(breakdownText);

    card.appendChild(details);
  }

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
