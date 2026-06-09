// modules/ui-profile.js — Profile editor bottom sheet

import { getProfile, saveProfile, DEFAULT_PROFILE } from './profile.js';

const MUST_HAVE_OPTIONS = [
  { key: '6_airbags',       label: '6 Airbags' },
  { key: 'ventilated_seats',label: 'Vent. Seats' },
  { key: 'connected_car',   label: 'Connected Car' },
];

const NICE_TO_HAVE_OPTIONS = [
  { key: 'sunroof',          label: 'Sunroof' },
  { key: 'adas',             label: 'ADAS' },
  { key: '360_camera',       label: '360° Camera' },
  { key: 'wireless_carplay', label: 'Wireless CarPlay' },
];

const FUEL_OPTIONS = [
  { key: 'petrol_turbo',  label: 'Petrol Turbo' },
  { key: 'diesel',        label: 'Diesel' },
  { key: 'electric',      label: 'Electric (EV)' },
  { key: 'cng',           label: 'CNG' },
  { key: 'strong_hybrid', label: 'Strong Hybrid' },
];

const DAYS_OPTIONS = [3, 5, 7];

// ─── Public API ───────────────────────────────────────────────────────────────

// opts.extraSection: optional { title, buildEl } — inserts a labelled section
// into the sheet body before the footer, then calls buildEl(container) to populate it.
export function openProfileEditor(onSave, opts = {}) {
  const existing = document.getElementById('profile-sheet-backdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'profile-sheet-backdrop';
  backdrop.className = 'profile-sheet-backdrop';
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) closeSheet(backdrop);
  });

  const sheet = document.createElement('div');
  sheet.className = 'profile-sheet';
  sheet.innerHTML = buildSheetHtml();
  backdrop.appendChild(sheet);

  // Inject extra section (e.g. ranking filters) before the footer
  if (opts.extraSection) {
    const footer = sheet.querySelector('.prf-footer');
    const extraWrap = document.createElement('div');
    extraWrap.className = 'prf-extra-section';
    if (opts.extraSection.title) {
      const hd = document.createElement('div');
      hd.className = 'prf-extra-hd';
      hd.textContent = opts.extraSection.title;
      extraWrap.appendChild(hd);
    }
    opts.extraSection.buildEl(extraWrap);
    sheet.querySelector('.prf-body').appendChild(extraWrap);
  }

  document.body.appendChild(backdrop);

  // Animate in
  requestAnimationFrame(() => backdrop.classList.add('visible'));

  wireEvents(sheet, backdrop, onSave);
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildSheetHtml() {
  const p = getProfile();

  const budgetL = Math.round((p.budget_max || 2500000) / 100000);
  const dailyKm = p.daily_km || 20;
  const daysPerWeek = p.days_per_week || 5;
  const fuelPref = Array.isArray(p.fuel_preference) ? p.fuel_preference : ['petrol_turbo'];
  const mustHaves = Array.isArray(p.must_haves) ? p.must_haves : DEFAULT_PROFILE.must_haves;
  const niceToHaves = Array.isArray(p.nice_to_haves) ? p.nice_to_haves : DEFAULT_PROFILE.nice_to_haves;

  const fuelChips = FUEL_OPTIONS.map(f =>
    `<button type="button" class="prf-chip${fuelPref.includes(f.key) ? ' active' : ''}" data-group="fuel" data-val="${f.key}">${f.label}</button>`
  ).join('');

  const daysChips = DAYS_OPTIONS.map(d =>
    `<button type="button" class="prf-chip${daysPerWeek === d ? ' active' : ''}" data-group="days" data-val="${d}">${d} days/wk</button>`
  ).join('');

  const mustChips = MUST_HAVE_OPTIONS.map(m =>
    `<button type="button" class="prf-chip${mustHaves.includes(m.key) ? ' active' : ''}" data-group="must" data-val="${m.key}">${m.label}</button>`
  ).join('');

  const niceChips = NICE_TO_HAVE_OPTIONS.map(n =>
    `<button type="button" class="prf-chip${niceToHaves.includes(n.key) ? ' active' : ''}" data-group="nice" data-val="${n.key}">${n.label}</button>`
  ).join('');

  return `
    <div class="prf-header">
      <h3 class="prf-title">Your Profile</h3>
      <button id="prf-close-btn" class="prf-close" aria-label="Close">&#x2715;</button>
    </div>

    <div class="prf-body">

      <div class="prf-field">
        <label class="prf-label">Max budget
          <span class="prf-val-badge" id="prf-budget-badge">₹${budgetL}L</span>
        </label>
        <input type="range" id="prf-budget" class="prf-range" min="12" max="40" step="1" value="${budgetL}">
        <div class="prf-range-ends"><span>₹12L</span><span>₹40L</span></div>
      </div>

      <div class="prf-field">
        <label class="prf-label">Daily driving
          <span class="prf-val-badge" id="prf-km-badge">${dailyKm} km</span>
        </label>
        <input type="range" id="prf-km" class="prf-range" min="10" max="100" step="5" value="${dailyKm}">
        <div class="prf-range-ends"><span>10 km</span><span>100 km</span></div>
      </div>

      <div class="prf-field">
        <label class="prf-label">Days per week</label>
        <div class="prf-chips">${daysChips}</div>
      </div>

      <div class="prf-field">
        <label class="prf-label">Fuel preference <small>(pick all that apply)</small></label>
        <div class="prf-chips">${fuelChips}</div>
      </div>

      <div class="prf-field">
        <label class="prf-label">Must-haves</label>
        <div class="prf-chips">${mustChips}</div>
      </div>

      <div class="prf-field">
        <label class="prf-label">Nice-to-haves</label>
        <div class="prf-chips">${niceChips}</div>
      </div>

    </div>

    <div class="prf-footer">
      <button id="prf-reset-btn" class="prf-btn-reset">Reset defaults</button>
      <button id="prf-save-btn" class="prf-btn-save">Save &amp; re-rank</button>
    </div>
  `;
}

// ─── Event wiring ─────────────────────────────────────────────────────────────

function wireEvents(sheet, backdrop, onSave) {
  // Close
  sheet.querySelector('#prf-close-btn').addEventListener('click', () => closeSheet(backdrop));

  // Budget range
  const budgetEl = sheet.querySelector('#prf-budget');
  const budgetBadge = sheet.querySelector('#prf-budget-badge');
  budgetEl.addEventListener('input', () => {
    budgetBadge.textContent = `₹${budgetEl.value}L`;
  });

  // Daily km range
  const kmEl = sheet.querySelector('#prf-km');
  const kmBadge = sheet.querySelector('#prf-km-badge');
  kmEl.addEventListener('input', () => {
    kmBadge.textContent = `${kmEl.value} km`;
  });

  // Chips — days is single-select; fuel/must/nice are multi-select
  sheet.addEventListener('click', e => {
    const btn = e.target.closest('.prf-chip[data-group]');
    if (!btn) return;
    const group = btn.dataset.group;
    if (group === 'days') {
      sheet.querySelectorAll('.prf-chip[data-group="days"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    } else {
      btn.classList.toggle('active');
    }
  });

  // Reset
  sheet.querySelector('#prf-reset-btn').addEventListener('click', () => {
    const p = { ...DEFAULT_PROFILE };
    saveProfile(p);
    // Rebuild sheet with default values
    sheet.innerHTML = buildSheetHtml();
    wireEvents(sheet, backdrop, onSave);
  });

  // Save
  sheet.querySelector('#prf-save-btn').addEventListener('click', () => {
    const current = getProfile();
    const budgetMax = parseInt(sheet.querySelector('#prf-budget').value) * 100000;
    const dailyKm = parseInt(sheet.querySelector('#prf-km').value);
    const daysPerWeek = parseInt(sheet.querySelector('.prf-chip[data-group="days"].active')?.dataset.val || '5');
    const fuelPref = [...sheet.querySelectorAll('.prf-chip[data-group="fuel"].active')].map(b => b.dataset.val);
    const mustHaves = [...sheet.querySelectorAll('.prf-chip[data-group="must"].active')].map(b => b.dataset.val);
    const niceToHaves = [...sheet.querySelectorAll('.prf-chip[data-group="nice"].active')].map(b => b.dataset.val);

    const updated = {
      ...current,
      budget_max: budgetMax,
      budget_target: Math.round(budgetMax * 0.8),
      daily_km: dailyKm,
      days_per_week: daysPerWeek,
      fuel_preference: fuelPref.length ? fuelPref : ['petrol_turbo'],
      must_haves: mustHaves,
      nice_to_haves: niceToHaves,
    };
    saveProfile(updated);
    closeSheet(backdrop);
    if (typeof onSave === 'function') onSave(updated);
  });
}

function closeSheet(backdrop) {
  backdrop.classList.remove('visible');
  setTimeout(() => backdrop.remove(), 280);
}
