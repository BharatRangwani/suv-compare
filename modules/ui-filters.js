// modules/ui-filters.js

const STORAGE_KEY = 'suv_filters';

// Multi-select groups store arrays; single-select groups store a string.
// 'all' means no filter active (or empty array for multi).
const DEFAULT_FILTERS = {
  fuel:             [],   // multi — empty = all
  transmission:     [],   // multi
  brand:            [],   // multi
  budget:           'all',
  ncap:             'all',
  mileage:          'all',
  annual_km:        'all',
  ev_charging:      'all',
  adas:             'all',
  ventilated:       'all',
  sunroof:          'all',
  wireless:         'all',
  connected:        'all',
  camera_360:       'all',
  rear_camera:      'all',
  alloy_wheels:     'all',
  parking_sensors:  'all',
  drive_modes:      'all',
  clutchless:       'all',
  dash_cam:         'all',
  vfm:              'all',
  platform:         'all',
  service_avail:    'all',
  parts_avail:      'all',
  after_sales:      'all',
  waiting:          'all',
  headlights:       'all',
  turn_indicator:   'all',
  engine_ss:        'all',
  electric_seats:   'all',
  climate_ctrl:     'all',
  paddle_shifters:  'all',
  cruise_ctrl:      'all',
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
    // Remove stale transmission values from old filter format (automatic → at/dct/cvt)
    const VALID_TX = new Set(['manual','amt','cvt','at','dct']);
    migrated.transmission = migrated.transmission.filter(v => VALID_TX.has(v));
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
        if (sel === 'dct')       return tx === 'DCT' || tx.includes('DCT') || tx.includes('DSG');
        if (sel === 'at')        return tx === 'AT'  || (tx.includes('AT') && !tx.includes('AMT') && !tx.includes('DCT') && !tx.includes('DSG'));
        if (sel === 'cvt')       return tx.includes('CVT');
        if (sel === 'manual')    return tx === 'MT'  || tx === 'MANUAL' || tx.includes('MT') && !tx.includes('AMT');
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

    // Annual KM — updates conceptual usage tier; filters out cars that are poor value at that usage
    // This is a display/informational filter: we show it but don't hard-exclude cars here.
    // The actual re-ranking based on profile.daily_km happens when annual_km filter triggers re-rank.
    // (No car exclusion for annual_km — it drives profile, not a hard filter.)

    // EV Charging — single (only filters EV cars)
    if (filters.ev_charging !== 'all' && car.fuel === 'electric') {
      const ct = car.charging_type || 'both';
      if (filters.ev_charging === 'home'   && ct !== 'home'   && ct !== 'both') return false;
      if (filters.ev_charging === 'public' && ct !== 'public' && ct !== 'both') return false;
      if (filters.ev_charging === 'both'   && ct !== 'both')                    return false;
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

    // 360-degree camera — single
    if (filters.camera_360 === 'yes' && !car.camera_360) return false;

    // Rear parking camera — single
    if (filters.rear_camera === 'yes' && !car.rear_camera) return false;

    // Alloy wheels — single
    if (filters.alloy_wheels === 'yes' && !car.alloy_wheels) return false;

    // Parking sensors — single
    if (filters.parking_sensors !== 'all') {
      if (filters.parking_sensors === 'rear' && !car.parking_sensors_rear)  return false;
      if (filters.parking_sensors === 'both' && !(car.parking_sensors_front && car.parking_sensors_rear)) return false;
    }

    // Drive modes (Eco/City/Sport selector) — single
    if (filters.drive_modes === 'yes' && !car.drive_modes) return false;

    // Clutchless (no clutch pedal: AMT, DCT, CVT, DSG, AT, e-CVT) — single
    if (filters.clutchless === 'yes' && !car.clutchless) return false;

    // Factory dash cam — single
    if (filters.dash_cam === 'yes' && !car.dash_cam) return false;

    // VFM tag — single (values: 'excellent' | 'fair' | 'overpriced' from getVFMTag)
    if (filters.vfm !== 'all') {
      const tag = car.vfm_tag || 'fair';
      if (filters.vfm === 'excellent'  && tag !== 'excellent') return false;
      if (filters.vfm === 'good'       && tag === 'overpriced') return false;
      if (filters.vfm === 'overpriced' && tag !== 'overpriced') return false;
    }

    // Platform — single (maps logical group → platform string fragments)
    if (filters.platform !== 'all') {
      const plat = (car.platform || '').toLowerCase();
      if (filters.platform === 'mqb'      && !plat.includes('mqb'))       return false;
      if (filters.platform === 'tnga'     && !plat.includes('tnga'))       return false;
      if (filters.platform === 'k2sp2'    && !plat.includes('k2') && !plat.includes('sp2')) return false;
      if (filters.platform === 'bof'      && !plat.includes('bof'))        return false;
      if (filters.platform === 'ev_only'  && car.fuel !== 'electric')      return false;
    }

    // Service availability (# of Jodhpur service centers) — single
    if (filters.service_avail !== 'all') {
      const count = (car.service_centers_jodhpur || []).length;
      if (filters.service_avail === '2plus' && count < 2) return false;
      if (filters.service_avail === '1plus' && count < 1) return false;
    }

    // Parts availability score — single
    if (filters.parts_avail !== 'all') {
      const pa = car.parts_availability_score || 0;
      if (filters.parts_avail === '8plus' && pa < 8) return false;
      if (filters.parts_avail === '6plus' && pa < 6) return false;
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

    // Headlights — single
    if (filters.headlights !== 'all') {
      const hl = car.headlights || 'halogen';
      if (filters.headlights === 'led'              && hl === 'halogen')          return false;
      if (filters.headlights === 'led'              && hl === 'projector_halogen') return false;
      if (filters.headlights === 'projector_halogen'&& hl === 'halogen')          return false;
      if (filters.headlights === 'led_4chamber'     && car.headlight_chambers !== 4) return false;
      if (filters.headlights === 'led_3chamber'     && car.headlight_chambers !== 3) return false;
    }

    // Turn indicator type — single
    if (filters.turn_indicator === 'led'     && (car.turn_indicator_type || 'halogen') !== 'led')     return false;
    if (filters.turn_indicator === 'halogen' && (car.turn_indicator_type || 'halogen') !== 'halogen') return false;

    // Engine start/stop (push-button) — single
    if (filters.engine_ss === 'yes' && !car.engine_start_stop) return false;
    if (filters.engine_ss === 'no'  &&  car.engine_start_stop) return false;

    // Electric adjustable seats — single
    if (filters.electric_seats === 'yes' && !car.electric_adj_seats) return false;

    // Climate control — single
    if (filters.climate_ctrl !== 'all') {
      const cc = car.climate_control || 'manual';
      if (filters.climate_ctrl === 'auto'      && cc === 'manual')      return false;
      if (filters.climate_ctrl === 'auto_dual' && cc !== 'auto_dual')   return false;
    }

    // Paddle shifters — single
    if (filters.paddle_shifters === 'yes' && !car.paddle_shifters) return false;

    // Cruise control — single
    if (filters.cruise_ctrl !== 'all') {
      const cc = car.cruise_control;
      if (filters.cruise_ctrl === 'any'      && !cc)              return false;
      if (filters.cruise_ctrl === 'adaptive' && cc !== 'adaptive') return false;
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
        { value: 'manual', label: 'MT (Manual)' },
        { value: 'amt',    label: 'AMT' },
        { value: 'cvt',    label: 'CVT' },
        { value: 'at',     label: 'AT (Torque Conv.)' },
        { value: 'dct',    label: 'DCT / DSG' },
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
      group: 'annual_km', label: 'Annual KM', multi: false,
      options: [
        { value: 'all',  label: 'Any' },
        { value: '8k',   label: '~8k km/yr' },
        { value: '12k',  label: '~12k km/yr' },
        { value: '18k',  label: '~18k km/yr' },
        { value: '25k',  label: '~25k km/yr' },
        { value: '35k',  label: '35k+ km/yr' },
      ]
    },
    {
      group: 'ev_charging', label: 'EV Charging', multi: false,
      options: [
        { value: 'all',    label: 'Any' },
        { value: 'home',   label: 'Home Charging' },
        { value: 'public', label: 'Public Charging' },
        { value: 'both',   label: 'Home + Public' },
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
      group: 'camera_360', label: '360° Camera', multi: false,
      options: [
        { value: 'all', label: 'Any' },
        { value: 'yes', label: 'Yes' },
      ]
    },
    {
      group: 'rear_camera', label: 'Rear Camera', multi: false,
      options: [
        { value: 'all', label: 'Any' },
        { value: 'yes', label: 'Yes' },
      ]
    },
    {
      group: 'alloy_wheels', label: 'Alloy Wheels', multi: false,
      options: [
        { value: 'all', label: 'Any' },
        { value: 'yes', label: 'Yes' },
      ]
    },
    {
      group: 'parking_sensors', label: 'Parking Sensors', multi: false,
      options: [
        { value: 'all',  label: 'Any' },
        { value: 'rear', label: 'Rear' },
        { value: 'both', label: 'Front + Rear' },
      ]
    },
    {
      group: 'drive_modes', label: 'Drive Modes', multi: false,
      options: [
        { value: 'all', label: 'Any' },
        { value: 'yes', label: 'Eco / Sport' },
      ]
    },
    {
      group: 'clutchless', label: 'No Clutch', multi: false,
      options: [
        { value: 'all', label: 'Any' },
        { value: 'yes', label: 'Clutchless' },
      ]
    },
    {
      group: 'dash_cam', label: 'Dash Cam', multi: false,
      options: [
        { value: 'all', label: 'Any' },
        { value: 'yes', label: 'Factory fitted' },
      ]
    },
    {
      group: 'vfm', label: 'Value Rating', multi: false,
      options: [
        { value: 'all',        label: 'Any' },
        { value: 'excellent',  label: '🏷 Excellent' },
        { value: 'good',       label: 'Good+' },
        { value: 'overpriced', label: 'Overpriced' },
      ]
    },
    {
      group: 'platform', label: 'Platform / Tech', multi: false,
      options: [
        { value: 'all',    label: 'Any' },
        { value: 'mqb',    label: 'VW MQB (EU)' },
        { value: 'tnga',   label: 'Toyota TNGA' },
        { value: 'k2sp2',  label: 'Hyundai-Kia K2' },
        { value: 'bof',    label: 'Body-on-Frame' },
        { value: 'ev_only',label: 'EV Platform' },
      ]
    },
    {
      group: 'headlights', label: 'Headlights', multi: false,
      options: [
        { value: 'all',              label: 'Any' },
        { value: 'led',              label: 'LED / Full LED' },
        { value: 'projector_halogen',label: 'Projector Halogen' },
        { value: 'led_4chamber',     label: '4-Chamber LED' },
        { value: 'led_3chamber',     label: '3-Chamber LED' },
      ]
    },
    {
      group: 'turn_indicator', label: 'Turn Indicator', multi: false,
      options: [
        { value: 'all',     label: 'Any' },
        { value: 'led',     label: 'LED' },
        { value: 'halogen', label: 'Halogen' },
      ]
    },
    {
      group: 'engine_ss', label: 'Push Start', multi: false,
      options: [
        { value: 'all', label: 'Any' },
        { value: 'yes', label: 'Push Button Start' },
        { value: 'no',  label: 'Key Start' },
      ]
    },
    {
      group: 'electric_seats', label: 'Electric Seats', multi: false,
      options: [
        { value: 'all', label: 'Any' },
        { value: 'yes', label: 'Electric Adj.' },
      ]
    },
    {
      group: 'climate_ctrl', label: 'Climate Control', multi: false,
      options: [
        { value: 'all',      label: 'Any' },
        { value: 'auto',     label: 'Auto AC' },
        { value: 'auto_dual',label: 'Dual-Zone Auto' },
      ]
    },
    {
      group: 'paddle_shifters', label: 'Paddle Shifters', multi: false,
      options: [
        { value: 'all', label: 'Any' },
        { value: 'yes', label: 'Yes' },
      ]
    },
    {
      group: 'cruise_ctrl', label: 'Cruise Control', multi: false,
      options: [
        { value: 'all',      label: 'Any' },
        { value: 'any',      label: 'Any Cruise' },
        { value: 'adaptive', label: 'Adaptive / ACC' },
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
      group: 'parts_avail', label: 'Parts Availability', multi: false,
      options: [
        { value: 'all',   label: 'Any' },
        { value: '6plus', label: 'Score 6+/10' },
        { value: '8plus', label: 'Score 8+/10' },
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

  let syncToggleLabel = null; // set after toggle header is built

  function updateActiveStates() {
    container.querySelectorAll('.filter-chip[data-group]').forEach(chip => {
      const group = chip.dataset.group;
      const value = chip.dataset.value;
      chip.classList.toggle('active', isActive(currentFilters, group, value));
    });
    if (syncToggleLabel) syncToggleLabel();
  }

  function updateClearButton() {
    const clearBtn = container.querySelector('.clear-filters');
    if (clearBtn) clearBtn.classList.toggle('hidden', !isAnyFilterActive(currentFilters));
  }

  const COLLAPSE_KEY = 'suv_filters_collapsed';
  let collapsed = localStorage.getItem(COLLAPSE_KEY) === 'true';

  function activeCount() {
    return Object.entries(currentFilters).reduce((n, [g, v]) =>
      n + (MULTI_GROUPS.has(g) ? v.length : (v !== 'all' ? 1 : 0)), 0);
  }

  function buildToggleHeader() {
    const hdr = document.createElement('div');
    hdr.className = 'filter-toggle-hdr';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'filter-toggle-btn';
    toggleBtn.setAttribute('aria-expanded', String(!collapsed));

    function syncLabel() {
      const n = activeCount();
      toggleBtn.innerHTML = collapsed
        ? `<span class="filter-toggle-icon">▶</span> Filters${n > 0 ? ` <span class="filter-toggle-count">${n}</span>` : ''}`
        : `<span class="filter-toggle-icon open">▼</span> Filters${n > 0 ? ` <span class="filter-toggle-count">${n}</span>` : ''}`;
      toggleBtn.setAttribute('aria-expanded', String(!collapsed));
    }
    syncLabel();
    syncToggleLabel = syncLabel;

    toggleBtn.addEventListener('click', () => {
      collapsed = !collapsed;
      localStorage.setItem(COLLAPSE_KEY, String(collapsed));
      const bar = container.querySelector('.filter-bar');
      if (bar) bar.classList.toggle('filter-bar-hidden', collapsed);
      syncLabel();
    });

    hdr.appendChild(toggleBtn);
    return hdr;
  }

  container.innerHTML = '';
  container.appendChild(buildToggleHeader());
  const bar = buildFilterBar();
  if (collapsed) bar.classList.add('filter-bar-hidden');
  container.appendChild(bar);
}
