import { loadCarsData } from './modules/data.js';
import { renderHome } from './modules/ui-home.js';
import { renderEMICalculator, calcOnRoadPrice } from './modules/emi.js';
import { renderCompare } from './modules/ui-compare.js';
import { renderDetailPanel, closeDetailPanel } from './modules/ui-detail.js';

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
    renderHome(document.getElementById('tab-home'));
  }
  if (tabId === 'jodhpur') renderJodhpurTab();
  if (tabId === 'compare') renderCompareTab();
  if (tabId === 'ranking') renderRankingPlaceholder();
}

function renderJodhpurTab() {
  const pane = document.getElementById('tab-jodhpur');
  if (pane.dataset.rendered) return;
  pane.dataset.rendered = '1';

  const emiSection = document.createElement('section');
  emiSection.style.marginBottom = '2rem';
  pane.appendChild(emiSection);
  renderEMICalculator(emiSection, 2200000);

  const infoSection = document.createElement('section');
  infoSection.innerHTML = `
    <h2 style="margin-bottom:1rem;font-size:1.1rem">Jodhpur On-Road Price Guide</h2>
    <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:1rem">
      Rajasthan registration: Road tax ~11% + Registration ~₹15,000 + 1st year insurance ~3.5% of ex-showroom.
    </p>
    <div id="jodhpur-price-list" style="display:flex;flex-direction:column;gap:0.75rem"></div>
  `;
  pane.appendChild(infoSection);

  loadCarsData().then(data => {
    const list = document.getElementById('jodhpur-price-list');
    if (!list) return;
    data.cars
      .filter(c => !c.is_baseline && c.ex_showroom_jodhpur > 0)
      .sort((a, b) => a.ex_showroom_jodhpur - b.ex_showroom_jodhpur)
      .forEach(car => {
        const onRoad = calcOnRoadPrice(car.ex_showroom_jodhpur);
        const item = document.createElement('div');
        item.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0.75rem 1rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem';
        item.innerHTML = `
          <div>
            <strong>${car.brand} ${car.model}</strong>
            <span style="color:var(--text-muted);font-size:0.85rem;margin-left:0.5rem">${car.variant}</span>
          </div>
          <div style="text-align:right;font-size:0.9rem">
            <div>Ex-sh: <strong>₹${(car.ex_showroom_jodhpur / 100000).toFixed(2)} L</strong></div>
            <div style="color:var(--accent)">On-road: <strong>₹${(onRoad / 100000).toFixed(2)} L</strong></div>
          </div>
        `;
        list.appendChild(item);
      });

    if (data.last_updated) {
      const ts = document.getElementById('data-timestamp');
      if (ts) ts.textContent = `Data last updated: ${data.last_updated}`;
    }
  }).catch(() => {});
}

function renderCompareTab() {
  const pane = document.getElementById('tab-compare');
  if (pane.dataset.rendered) return;
  pane.dataset.rendered = '1';
  renderCompare(pane);
}

function renderRankingPlaceholder() {
  const pane = document.getElementById('tab-ranking');
  if (pane.dataset.rendered) return;
  pane.dataset.rendered = '1';
  pane.innerHTML = `
    <div style="text-align:center;padding:3rem 1rem;color:var(--text-muted)">
      <div style="font-size:2rem;margin-bottom:1rem">🏆</div>
      <h2 style="margin-bottom:0.5rem">My Ranking</h2>
      <p>Detailed scoring breakdown coming in Plan 2.</p>
    </div>
  `;
}

function initTheme() {
  const saved = localStorage.getItem('suv_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('suv_theme', next);
  updateThemeIcon(next);
}

function init() {
  initTheme();

  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    const btn = document.getElementById('refresh-btn');
    btn.textContent = '⏳';
    btn.disabled = true;
    import('./modules/data.js').then(({ invalidateCache }) => {
      invalidateCache();
      homeRendered = false;
      const homePaneEl = document.getElementById('tab-home');
      homePaneEl.innerHTML = '';
      if (activeTab === 'home') {
        homeRendered = true;
        renderHome(homePaneEl);
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
