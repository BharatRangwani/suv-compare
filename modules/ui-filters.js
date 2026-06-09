// modules/ui-filters.js

const STORAGE_KEY = 'suv_filters';

// Multi-select groups store arrays; single-select groups store a string.
// 'all' means no filter active (or empty array for multi).
const DEFAULT_FILTERS = {
  fuel:         [],   // multi — empty = all
  transmission: [],   // multi
  brand:        [],   // multi
  budget:       'all',
  ncap:         'all',
  mileage:      'all',
  adas:         'all',
  ventilated:   'all',
  sunroof:      'all',
  wireless:     'all',
  connected:    'all',
  service_avail:'all',
  after_sales:  'all',
  waiting:      'all',
};

// Groups that store arrays (multi-select)
const MULTI_GROUPS = new Set(['fuel', 'transmission', 'brand']);

function isActive(filters, group, value) {
  if (MULTI_GROUPS.has(group)) return filters[group].includes(value);
  return filters[group] === value;
}

function isAnyFilterActive(filters) {
  return Object.entries(filters).some(([g, v]) =>
    MULTI_GROUPS.has(g) ? v.length > 0 : v !== 'all'
  );
}

export function getStoredFilters() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...DEFAULT_FILTERS };
    const parsed = JSON.parse(saved);
    // Migrate old single-value fuel/transmission/brand to arrays
    const migrated = { ...DEFAULT_FILTERS, ...parsed };
    for (const g of MULTI_GROUPS) {
      if (!Array.isArray(migrated[g])) {
        migrated[g] = migrated[g] && migrated[g] !== 'all' ? [migrated[g]] : [];
      }
    }
    return migrated;
  } catch {
    return { ...DEFAULT_FILTERS };
  }
}

export function saveFilters(filters) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}

export function resetFilters() {
  localStorage.removeItem(STORAGE_KEY);
}

export function applyFilters(cars, filters) {
  return cars.filter(car => {
    if (car.is_baseline) return true;

    // Fuel — multi: car must match one of the selected fuels
    if (filters.fuel.length > 0 && !filters.fuel.includes(car.fuel)) return false;

    // Transmission — multi
    if (filters.transmission.length > 0) {
      const tx = (car.transmission || '').toUpperCase();
      const match = filters.transmission.some(sel => {
        if (sel === 'automatic') return ['DCT','CVT','DSG','AT','E-CVT'].some(t => tx.includes(t));
        if (sel === 'manual')    return tx.includes('MANUAL');
        if (sel === 'amt')       return tx.includes('AMT');
        return false;
      });
      if (!match) return false;
    }

    // Brand — multi
    if (filters.brand.length > 0 && !filters.brand.includes(car.brand)) return false;

    // Budget — single
    if (filters.budget !== 'all') {
      const price = car.ex_showroom_jodhpur || 0;
      if (filters.budget === 'under15'  && price >= 1500000)                       return false;
      if (filters.budget === '15to18'   && (price < 1500000 || price > 1800000))   return false;
      if (filters.budget === '18to21'   && (price < 1800000 || price > 2100000))   return false;
      if (filters.budget === '21to25'   && (price < 2100000 || price > 2500000))   return false;
      if (filters.budget === 'over25'   && price <= 2500000)                        return false;
    }

    // NCAP — single
    if (filters.ncap !== 'all') {
      const stars = car.ncap_stars || 0;
      if (filters.ncap === '5only' && stars !== 5) return false;
      if (filters.ncap === '4plus' && stars < 4)   return false;
      if (filters.ncap === '3plus' && stars < 3)   return false;
    }

    // Mileage (realworld_kmpl for non-EVs; range_km for EVs) — single
    if (filters.mileage !== 'all') {
      if (car.fuel === 'electric') {
        const range = car.realworld_range_km || 0;
        if (filters.mileage === 'over20'  && range < 300)  return false;
        if (filters.mileage === 'over18'  && range < 200)  return false;
      } else {
        const kmpl = car.realworld_kmpl || 0;
        if (filters.mileage === 'over20'  && kmpl < 20)  return false;
        if (filters.mileage === 'over18'  && kmpl < 18)  return false;
        if (filters.mileage === 'over15'  && kmpl < 15)  return false;
      }
    }

    // ADAS — single
    if (filters.adas === 'yes' && !car.adas)  return false;
    if (filters.adas === 'no'  &&  car.adas)  return false;

    // Ventilated seats — single
    if (filters.ventilated === 'yes' && !car.ventilated_seats) return false;
    if (filters.ventilated === 'no'  &&  car.ventilated_seats) return false;

    // Sunroof — single
    if (filters.sunroof !== 'all') {
      const sr = car.sunroof || 'none';
      if (filters.sunroof === 'yes'       && sr === 'none')      return false;
      if (filters.sunroof === 'panoramic' && sr !== 'panoramic') return false;
      if (filters.sunroof === 'no'        && sr !== 'none')      return false;
    }

    // Wireless connectivity (CarPlay or AA) — single
    if (filters.wireless === 'carplay'   && !car.wireless_carplay) return false;
    if (filters.wireless === 'any'       && !car.wireless_carplay && !car.wireless_aa) return false;

    // Connected / smart features — single
    if (filters.connected === 'yes' && !car.connected_car) return false;

    // Service availability (# of Jodhpur service centers) — single
    if (filters.service_avail !== 'all') {
      const count = (car.service_centers_jodhpur || []).length;
      if (filters.service_avail === '2plus' && count < 2) return false;
      if (filters.service_avail === '1plus' && count < 1) return false;
    }

    // After-sales service rating — single
    if (filters.after_sales !== 'all') {
      const rating = car.post_sale_service_rating || 0;
      if (filters.after_sales === '4plus' && rating < 4)   return false;
      if (filters.after_sales === '3plus' && rating < 3)   return false;
    }

    // Waiting — single
    if (filters.waiting !== 'all') {
      const weeks = car.waiting_weeks_jodhpur == null ? 99 : car.waiting_weeks_jodhpur;
      if (filters.waiting === 'now'    && weeks !== 0) return false;
      if (filters.waiting === 'under4' && weeks > 4)   return false;
      if (filters.waiting === 'under8' && weeks > 8)   return false;
    }

    return true;
  });
}

export function renderFilters(container, onFilterChange) {
  const FILTER_GROUPS = [
    {
      group: 'fuel', label: 'Fuel', multi: true,
      options: [
        { value: 'petrol_turbo',  label: 'Petrol Turbo' },
        { value: 'diesel',        label: 'Diesel' },
        { value: 'cng',           label: 'CNG' },
        { value: 'electric',      label: 'Electric' },
        { value: 'strong_hybrid', label: 'Strong Hybrid' },
        { value: 'mild_hybrid',   label: 'Mild Hybrid' },
      ]
    },
    {
      group: 'transmission', label: 'Transmission', multi: true,
      options: [
        { value: 'automatic', label: 'Auto / DCT' },
        { value: 'manual',    label: 'Manual' },
        { value: 'amt',       label: 'AMT / Semi-Auto' },
      ]
    },
    {
      group: 'budget', label: 'Budget', multi: false,
      options: [
        { value: 'all',     label: 'Any' },
        { value: 'under15', label: '< ₹15L' },
        { value: '15to18',  label: '₹15–18L' },
        { value: '18to21',  label: '₹18–21L' },
        { value: '21to25',  label: '₹21–25L' },
        { value: 'over25',  label: '> ₹25L' },
      ]
    },
    {
      group: 'mileage', label: 'Mileage', multi: false,
      options: [
        { value: 'all',    label: 'Any' },
        { value: 'over15', label: '> 15 kmpl' },
        { value: 'over18', label: '> 18 kmpl' },
        { value: 'over20', label: '> 20 kmpl' },
      ]
    },
    {
      group: 'ncap', label: 'Safety (NCAP)', multi: false,
      options: [
        { value: 'all',    label: 'Any' },
        { value: '3plus',  label: '3★+' },
        { value: '4plus',  label: '4★+' },
        { value: '5only',  label: '5★ Only' },
      ]
    },
    {
      group: 'adas', label: 'ADAS', multi: false,
      options: [
        { value: 'all', label: 'Any' },
        { value: 'yes', label: 'Has ADAS' },
        { value: 'no',  label: 'No ADAS' },
      ]
    },
    {
      group: 'ventilated', label: 'Vent. Seats', multi: false,
      options: [
        { value: 'all', label: 'Any' },
        { value: 'yes', label: 'Yes' },
        { value: 'no',  label: 'No' },
      ]
    },
    {
      group: 'sunroof', label: 'Sunroof', multi: false,
      options: [
        { value: 'all',       label: 'Any' },
        { value: 'yes',       label: 'Any roof' },
        { value: 'panoramic', label: 'Panoramic' },
        { value: 'no',        label: 'None' },
      ]
    },
    {
      group: 'wireless', label: 'Wireless', multi: false,
      options: [
        { value: 'all',     label: 'Any' },
        { value: 'any',     label: 'CarPlay / AA' },
        { value: 'carplay', label: 'CarPlay' },
      ]
    },
    {
      group: 'connected', label: 'Connected Car', multi: false,
      options: [
        { value: 'all', label: 'Any' },
        { value: 'yes', label: 'Yes' },
      ]
    },
    {
      group: 'service_avail', label: 'Service Centers', multi: false,
      options: [
        { value: 'all',   label: 'Any' },
        { value: '1plus', label: '1+ in Jodhpur' },
        { value: '2plus', label: '2+ in Jodhpur' },
      ]
    },
    {
      group: 'after_sales', label: 'After-Sales', multi: false,
      options: [
        { value: 'all',   label: 'Any' },
        { value: '3plus', label: 'Rating 3+' },
        { value: '4plus', label: 'Rating 4+' },
      ]
    },
    {
      group: 'waiting', label: 'Availability', multi: false,
      options: [
        { value: 'all',    label: 'Any' },
        { value: 'now',    label: 'In Stock' },
        { value: 'under4', label: '< 4 wks' },
        { value: 'under8', label: '< 8 wks' },
      ]
    },
    {
      group: 'brand', label: 'Brand', multi: true,
      options: [
        { value: 'Hyundai',       label: 'Hyundai' },
        { value: 'Kia',           label: 'Kia' },
        { value: 'Maruti Suzuki', label: 'Maruti' },
        { value: 'Toyota',        label: 'Toyota' },
        { value: 'Tata',          label: 'Tata' },
        { value: 'Mahindra',      label: 'Mahindra' },
        { value: 'MG',            label: 'MG' },
        { value: 'Honda',         label: 'Honda' },
        { value: 'Skoda',         label: 'Skoda' },
        { value: 'Volkswagen',    label: 'VW' },
      ]
    },
  ];

  let currentFilters = getStoredFilters();

  function toggleFilter(group, value, isMulti) {
    if (isMulti) {
      const arr = currentFilters[group];
      const idx = arr.indexOf(value);
      if (idx === -1) arr.push(value);
      else arr.splice(idx, 1);
    } else {
      // single-select: clicking active chip resets to 'all', else set
      currentFilters[group] = currentFilters[group] === value ? 'all' : value;
    }
  }

  function buildFilterBar() {
    const bar = document.createElement('div');
    bar.className = 'filter-bar';

    FILTER_GROUPS.forEach(({ group, label: groupLabel, options, multi }) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'filter-group';

      const catLabel = document.createElement('span');
      catLabel.className = 'filter-cat-label';
      catLabel.textContent = groupLabel;
      if (multi) {
        const badge = document.createElement('span');
        badge.className = 'filter-multi-badge';
        badge.textContent = 'multi';
        catLabel.appendChild(badge);
      }
      groupEl.appendChild(catLabel);

      const chipsEl = document.createElement('div');
      chipsEl.className = 'filter-chips-row';

      options.forEach(({ value, label }) => {
        const btn = document.createElement('button');
        btn.className = 'filter-chip' + (isActive(currentFilters, group, value) ? ' active' : '');
        btn.dataset.group = group;
        btn.dataset.value = value;
        btn.textContent = label;
        btn.addEventListener('click', () => {
          toggleFilter(group, value, multi);
          saveFilters(currentFilters);
          updateActiveStates();
          updateClearButton();
          onFilterChange({ ...currentFilters });
        });
        chipsEl.appendChild(btn);
      });

      groupEl.appendChild(chipsEl);
      bar.appendChild(groupEl);
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'filter-chip clear-filters' + (isAnyFilterActive(currentFilters) ? '' : ' hidden');
    clearBtn.textContent = '✕ Clear all';
    clearBtn.addEventListener('click', () => {
      currentFilters = {
        ...DEFAULT_FILTERS,
        fuel: [], transmission: [], brand: []
      };
      resetFilters();
      updateActiveStates();
      updateClearButton();
      onFilterChange({ ...currentFilters });
    });
    bar.appendChild(clearBtn);

    return bar;
  }

  function updateActiveStates() {
    container.querySelectorAll('.filter-chip[data-group]').forEach(chip => {
      const group = chip.dataset.group;
      const value = chip.dataset.value;
      chip.classList.toggle('active', isActive(currentFilters, group, value));
    });
  }

  function updateClearButton() {
    const clearBtn = container.querySelector('.clear-filters');
    if (clearBtn) clearBtn.classList.toggle('hidden', !isAnyFilterActive(currentFilters));
  }

  container.innerHTML = '';
  container.appendChild(buildFilterBar());
}
