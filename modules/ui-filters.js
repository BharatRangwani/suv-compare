// modules/ui-filters.js

const STORAGE_KEY = 'suv_filters';

const DEFAULT_FILTERS = {
  fuel: 'all',
  transmission: 'all',
  budget: 'all',
  ncap: 'all',
  adas: 'all',
  ventilated: 'all',
  sunroof: 'all',
  waiting: 'all',
  brand: 'all'
};

export function getStoredFilters() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_FILTERS, ...JSON.parse(saved) } : { ...DEFAULT_FILTERS };
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
    // Always keep baseline car
    if (car.is_baseline) return true;

    // Fuel filter
    if (filters.fuel !== 'all') {
      if (car.fuel !== filters.fuel) return false;
    }

    // Transmission filter
    if (filters.transmission !== 'all') {
      const tx = (car.transmission || '').toUpperCase();
      if (filters.transmission === 'automatic') {
        const autoTypes = ['DCT', 'CVT', 'DSG', 'AT', 'E-CVT'];
        if (!autoTypes.some(t => tx.includes(t))) return false;
      } else if (filters.transmission === 'manual') {
        if (!tx.includes('MANUAL')) return false;
      } else if (filters.transmission === 'amt') {
        if (!tx.includes('AMT')) return false;
      }
    }

    // Budget filter (exclude baseline from budget filter — baseline already returned above)
    if (filters.budget !== 'all') {
      const price = car.ex_showroom_jodhpur || 0;
      if (filters.budget === 'under15' && price >= 1500000) return false;
      if (filters.budget === '15to18' && (price < 1500000 || price > 1800000)) return false;
      if (filters.budget === '18to21' && (price < 1800000 || price > 2100000)) return false;
      if (filters.budget === '21to25' && (price < 2100000 || price > 2500000)) return false;
      if (filters.budget === 'over25' && price <= 2500000) return false;
    }

    // NCAP filter
    if (filters.ncap !== 'all') {
      const stars = car.ncap_stars || 0;
      if (filters.ncap === '5only' && stars !== 5) return false;
      if (filters.ncap === '4plus' && stars < 4) return false;
      if (filters.ncap === '3plus' && stars < 3) return false;
    }

    // ADAS filter
    if (filters.adas === 'yes' && !car.adas) return false;

    // Ventilated seats filter
    if (filters.ventilated === 'yes' && !car.ventilated_seats) return false;

    // Sunroof filter
    if (filters.sunroof !== 'all') {
      const sr = car.sunroof || 'none';
      if (filters.sunroof === 'yes' && sr === 'none') return false;
      if (filters.sunroof === 'panoramic' && sr !== 'panoramic') return false;
    }

    // Waiting filter
    if (filters.waiting !== 'all') {
      const weeks = car.waiting_weeks_jodhpur == null ? 99 : car.waiting_weeks_jodhpur;
      if (filters.waiting === 'now' && weeks !== 0) return false;
      if (filters.waiting === 'under4' && weeks > 4) return false;
      if (filters.waiting === 'under8' && weeks > 8) return false;
    }

    // Brand filter
    if (filters.brand !== 'all') {
      if (car.brand !== filters.brand) return false;
    }

    return true;
  });
}

export function renderFilters(container, onFilterChange) {
  const FILTER_GROUPS = [
    {
      group: 'fuel',
      label: 'Fuel',
      options: [
        { value: 'all', label: 'All' },
        { value: 'petrol_turbo', label: 'Petrol Turbo' },
        { value: 'diesel', label: 'Diesel' },
        { value: 'strong_hybrid', label: 'Strong Hybrid' },
        { value: 'mild_hybrid', label: 'Mild Hybrid' }
      ]
    },
    {
      group: 'transmission',
      label: 'Transmission',
      options: [
        { value: 'all', label: 'All' },
        { value: 'automatic', label: 'Automatic' },
        { value: 'manual', label: 'Manual' },
        { value: 'amt', label: 'AMT' }
      ]
    },
    {
      group: 'budget',
      label: 'Budget',
      options: [
        { value: 'all', label: 'All' },
        { value: 'under15', label: 'Under ₹15L' },
        { value: '15to18', label: '₹15–18L' },
        { value: '18to21', label: '₹18–21L' },
        { value: '21to25', label: '₹21–25L' },
        { value: 'over25', label: 'Over ₹25L' }
      ]
    },
    {
      group: 'ncap',
      label: 'Safety',
      options: [
        { value: 'all', label: 'All' },
        { value: '5only', label: '5★ Only' },
        { value: '4plus', label: '4★+' },
        { value: '3plus', label: '3★+' }
      ]
    },
    {
      group: 'adas',
      label: 'ADAS',
      options: [
        { value: 'all', label: 'All' },
        { value: 'yes', label: 'ADAS Only' }
      ]
    },
    {
      group: 'ventilated',
      label: 'Ventilated',
      options: [
        { value: 'all', label: 'All' },
        { value: 'yes', label: 'Yes Only' }
      ]
    },
    {
      group: 'sunroof',
      label: 'Sunroof',
      options: [
        { value: 'all', label: 'All' },
        { value: 'yes', label: 'Any' },
        { value: 'panoramic', label: 'Panoramic' }
      ]
    },
    {
      group: 'waiting',
      label: 'Waiting',
      options: [
        { value: 'all', label: 'All' },
        { value: 'now', label: 'Available Now' },
        { value: 'under4', label: '<4 wks' },
        { value: 'under8', label: '<8 wks' }
      ]
    },
    {
      group: 'brand',
      label: 'Brand',
      options: [
        { value: 'all', label: 'All' },
        { value: 'Hyundai', label: 'Hyundai' },
        { value: 'Kia', label: 'Kia' },
        { value: 'Maruti Suzuki', label: 'Maruti Suzuki' },
        { value: 'Toyota', label: 'Toyota' },
        { value: 'Tata', label: 'Tata' },
        { value: 'MG', label: 'MG' },
        { value: 'Honda', label: 'Honda' },
        { value: 'Volkswagen', label: 'Volkswagen' }
      ]
    }
  ];

  let currentFilters = getStoredFilters();

  function isAnyFilterActive(filters) {
    return Object.values(filters).some(v => v !== 'all');
  }

  function buildFilterBar() {
    const bar = document.createElement('div');
    bar.className = 'filter-bar';

    FILTER_GROUPS.forEach(({ group, options }) => {
      options.forEach(({ value, label }) => {
        const btn = document.createElement('button');
        btn.className = 'filter-chip' + (currentFilters[group] === value ? ' active' : '');
        btn.dataset.group = group;
        btn.dataset.value = value;
        btn.textContent = label;
        btn.addEventListener('click', () => {
          currentFilters[group] = value;
          saveFilters(currentFilters);
          updateActiveStates();
          updateClearButton();
          onFilterChange({ ...currentFilters });
        });
        bar.appendChild(btn);
      });
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'filter-chip clear-filters' + (isAnyFilterActive(currentFilters) ? '' : ' hidden');
    clearBtn.textContent = 'Clear all';
    clearBtn.addEventListener('click', () => {
      currentFilters = { ...DEFAULT_FILTERS };
      resetFilters();
      updateActiveStates();
      updateClearButton();
      onFilterChange({ ...currentFilters });
    });
    bar.appendChild(clearBtn);

    return bar;
  }

  function updateActiveStates() {
    const chips = container.querySelectorAll('.filter-chip[data-group]');
    chips.forEach(chip => {
      const group = chip.dataset.group;
      const value = chip.dataset.value;
      chip.classList.toggle('active', currentFilters[group] === value);
    });
  }

  function updateClearButton() {
    const clearBtn = container.querySelector('.clear-filters');
    if (clearBtn) {
      clearBtn.classList.toggle('hidden', !isAnyFilterActive(currentFilters));
    }
  }

  // Clear previous content and render
  container.innerHTML = '';
  container.appendChild(buildFilterBar());
}
