// _audit_specs.cjs — apply spec audit corrections + add new feature fields to all cars
// Run: node _audit_specs.cjs

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('cars-data.json', 'utf8'));

// ─── Per-car overrides ────────────────────────────────────────────────────────
// Fields: headlights, headlight_chambers, turn_indicator_type, camera_360,
//         parking_sensors_front, parking_sensors_rear, airbags, sunroof,
//         engine_start_stop, electric_adj_seats, climate_control,
//         paddle_shifters, cruise_control

const OVERRIDES = {
  // ── Hyundai Creta ──────────────────────────────────────────────────────────
  'hyundai-creta-sx-opt-petrol-dct': {
    headlights: 'led', headlight_chambers: 4, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: true,
    climate_control: 'auto_single', paddle_shifters: true, cruise_control: 'adaptive',
  },
  'hyundai-creta-s-petrol-dct': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: true, cruise_control: 'standard',
  },
  'hyundai-creta-s-petrol-mt': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true,
    sunroof: 'none', engine_start_stop: false, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: false, cruise_control: false,
  },
  'hyundai-creta-sxo-diesel-mt': {
    headlights: 'led', headlight_chambers: 4, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: true, clutchless: false,
    sunroof: 'panoramic', engine_start_stop: false, electric_adj_seats: true,
    climate_control: 'auto_single', paddle_shifters: false, cruise_control: 'standard',
  },
  'hyundai-creta-sxo-diesel-at': {
    headlights: 'led', headlight_chambers: 4, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: true, clutchless: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: true,
    climate_control: 'auto_single', paddle_shifters: true, cruise_control: 'adaptive',
  },
  'hyundai-creta-sx-strong-hybrid': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: true, clutchless: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: true, cruise_control: 'standard',
  },
  // ── Hyundai Venue ──────────────────────────────────────────────────────────
  'hyundai-venue-sx-opt-petrol-dct': {
    headlights: 'projector_halogen', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    sunroof: 'single_pane', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: true, cruise_control: 'standard',
  },
  'hyundai-venue-s-petrol-mt': {
    headlights: 'projector_halogen', headlight_chambers: null, turn_indicator_type: 'halogen',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: false, clutchless: false,
    sunroof: 'none', engine_start_stop: false, electric_adj_seats: false,
    climate_control: 'manual', paddle_shifters: false, cruise_control: false,
  },
  // ── Kia Seltos ─────────────────────────────────────────────────────────────
  'kia-seltos-gtx-plus-petrol-dct': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: true,
    climate_control: 'auto_dual', paddle_shifters: true, cruise_control: 'adaptive',
  },
  'kia-seltos-htx-plus-petrol-dct': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: true,
    climate_control: 'auto_dual', paddle_shifters: true, cruise_control: 'adaptive',
  },
  'kia-seltos-htx-plus-diesel-at': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: true,
    climate_control: 'auto_dual', paddle_shifters: true, cruise_control: 'adaptive',
  },
  // ── Maruti Grand Vitara ────────────────────────────────────────────────────
  'maruti-grand-vitara-alpha-plus-strong-hybrid': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: false, parking_sensors_rear: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: true, cruise_control: 'standard',
  },
  'maruti-grand-vitara-alpha-plus-mild-hybrid-at': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: false, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: true, clutchless: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: true, cruise_control: 'standard',
  },
  'maruti-grand-vitara-delta-plus-mild-hybrid-mt': {
    headlights: 'projector_halogen', headlight_chambers: null, turn_indicator_type: 'halogen',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    airbags: 2, alloy_wheels: true, rear_camera: true, drive_modes: false, clutchless: false,
    sunroof: 'none', engine_start_stop: false, electric_adj_seats: false,
    climate_control: 'manual', paddle_shifters: false, cruise_control: false,
  },
  // ── Toyota Hyryder ─────────────────────────────────────────────────────────
  'toyota-hyryder-v-strong-hybrid-at': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: true,
    climate_control: 'auto_single', paddle_shifters: true, cruise_control: 'standard',
  },
  'toyota-hyryder-s-mild-hybrid-at': {
    headlights: 'projector_halogen', headlight_chambers: null, turn_indicator_type: 'halogen',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: false, clutchless: true,
    sunroof: 'none', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: false, cruise_control: 'standard',
  },
  'toyota-hyryder-g-mild-hybrid-mt': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: false, clutchless: false,
    sunroof: 'none', engine_start_stop: false, electric_adj_seats: false,
    climate_control: 'manual', paddle_shifters: false, cruise_control: false,
  },
  // ── Tata Nexon ────────────────────────────────────────────────────────────
  'tata-nexon-fearless-plus-petrol-amt': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: true, clutchless: true,
    sunroof: 'single_pane', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: false, cruise_control: 'standard',
  },
  'tata-nexon-smart-plus-petrol-mt': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: false, clutchless: false,
    sunroof: 'single_pane', engine_start_stop: false, electric_adj_seats: false,
    climate_control: 'manual', paddle_shifters: false, cruise_control: false,
  },
  'tata-nexon-creative-plus-diesel-mt': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: false, clutchless: false,
    sunroof: 'none', engine_start_stop: false, electric_adj_seats: false,
    climate_control: 'manual', paddle_shifters: false, cruise_control: false,
  },
  // ── Tata Nexon EV ─────────────────────────────────────────────────────────
  'tata-nexon-ev-empowered-plus-long-range': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: false, cruise_control: 'standard',
  },
  // ── Tata Nexon CNG ────────────────────────────────────────────────────────
  'tata-nexon-cng-smart-plus': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: false, clutchless: false,
    sunroof: 'none', engine_start_stop: false, electric_adj_seats: false,
    climate_control: 'manual', paddle_shifters: false, cruise_control: false,
  },
  // ── Tata Harrier ─────────────────────────────────────────────────────────
  'tata-harrier-adventure-plus-petrol-at': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: true,
    climate_control: 'auto_single', paddle_shifters: true, cruise_control: 'standard',
  },
  'tata-harrier-adventure-plus-diesel-at': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: true,
    climate_control: 'auto_single', paddle_shifters: true, cruise_control: 'standard',
  },
  // ── MG Astor ─────────────────────────────────────────────────────────────
  'mg-astor-savvy-cvt': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    sunroof: 'single_pane', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: false, cruise_control: 'adaptive',
  },
  // ── MG ZS EV ────────────────────────────────────────────────────────────
  'mg-zs-ev-excite-pro': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: false, cruise_control: 'standard',
  },
  // ── Hyundai Creta Electric ────────────────────────────────────────────────
  'hyundai-creta-electric-excellence-long-range': {
    headlights: 'led', headlight_chambers: 4, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: true, parking_sensors_rear: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: true,
    climate_control: 'auto_single', paddle_shifters: false, cruise_control: 'adaptive',
  },
  // ── Honda Elevate ────────────────────────────────────────────────────────
  'honda-elevate-zx-cvt': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    sunroof: 'single_pane', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: true, cruise_control: 'adaptive',
  },
  'honda-elevate-v-mt': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: false, clutchless: false,
    sunroof: 'none', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: false, cruise_control: false,
  },
  // ── VW Taigun ────────────────────────────────────────────────────────────
  'volkswagen-taigun-topline-tsi-dsg': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: true, parking_sensors_rear: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: true, cruise_control: 'standard',
  },
  'volkswagen-taigun-highline-10-tsi-at': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: true, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: false, clutchless: true,
    sunroof: 'single_pane', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: true, cruise_control: 'standard',
  },
  'volkswagen-taigun-comfortline-10-tsi-mt': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: false, clutchless: false,
    sunroof: 'none', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'manual', paddle_shifters: false, cruise_control: 'standard',
  },
  // ── Skoda Kushaq ─────────────────────────────────────────────────────────
  'skoda-kushaq-ambition-plus-tsi-dsg': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'halogen',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    sunroof: 'single_pane', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: false, cruise_control: 'standard',
  },
  'skoda-kushaq-ambition-10-tsi-at': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'halogen',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: false, clutchless: true,
    sunroof: 'single_pane', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_single', paddle_shifters: false, cruise_control: 'standard',
  },
  'skoda-kushaq-active-10-tsi-mt': {
    headlights: 'halogen', headlight_chambers: null, turn_indicator_type: 'halogen',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: false, clutchless: false,
    sunroof: 'none', engine_start_stop: false, electric_adj_seats: false,
    climate_control: 'manual', paddle_shifters: false, cruise_control: false,
  },
  // ── Mahindra Scorpio-N ───────────────────────────────────────────────────
  'mahindra-scorpio-n-z8-petrol-at': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: false, parking_sensors_rear: true,
    sunroof: 'single_pane', engine_start_stop: true, electric_adj_seats: true,
    climate_control: 'auto_dual', paddle_shifters: false, cruise_control: 'standard',
  },
  'mahindra-scorpio-n-z8-diesel-at': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: true, parking_sensors_front: false, parking_sensors_rear: true,
    sunroof: 'single_pane', engine_start_stop: true, electric_adj_seats: true,
    climate_control: 'auto_dual', paddle_shifters: false, cruise_control: 'standard',
  },
  'mahindra-scorpio-n-z4-diesel-mt': {
    headlights: 'halogen', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    airbags: 2, alloy_wheels: true, rear_camera: true, drive_modes: false, clutchless: false,
    sunroof: 'none', engine_start_stop: false, electric_adj_seats: false,
    climate_control: 'manual', paddle_shifters: false, cruise_control: false,
  },
  // ── Mahindra XUV 3XO ─────────────────────────────────────────────────────
  'mahindra-xuv-3xo-ax7-petrol-at': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: true, parking_sensors_rear: true,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_dual', paddle_shifters: false, cruise_control: 'adaptive',
  },
  'mahindra-xuv-3xo-ax5-petrol-mt': {
    headlights: 'led', headlight_chambers: null, turn_indicator_type: 'led',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    alloy_wheels: true, rear_camera: true, drive_modes: false, clutchless: false,
    sunroof: 'panoramic', engine_start_stop: true, electric_adj_seats: false,
    climate_control: 'auto_dual', paddle_shifters: false, cruise_control: false,
  },
  // ── Maruti Ertiga CNG ────────────────────────────────────────────────────
  'maruti-ertiga-cng-vxi': {
    headlights: 'projector_halogen', headlight_chambers: null, turn_indicator_type: 'halogen',
    camera_360: false, parking_sensors_front: false, parking_sensors_rear: true,
    airbags: 2,
    sunroof: 'none', engine_start_stop: false, electric_adj_seats: false,
    climate_control: 'manual', paddle_shifters: false, cruise_control: false,
  },
};

// ─── Apply overrides + fill defaults for cars not in override map ─────────────
let updated = 0;
for (const car of data.cars) {
  if (car.is_baseline) continue;

  const ov = OVERRIDES[car.id] || {};

  // Apply explicit overrides
  for (const [k, v] of Object.entries(ov)) {
    car[k] = v;
  }

  // Fill defaults for new fields only if not set by override and not already present
  if (car.headlights === undefined)           car.headlights = 'led';
  if (car.headlight_chambers === undefined)   car.headlight_chambers = null;
  if (car.turn_indicator_type === undefined)  car.turn_indicator_type = 'led';
  if (car.engine_start_stop === undefined)    car.engine_start_stop = true;
  if (car.electric_adj_seats === undefined)   car.electric_adj_seats = false;
  if (car.climate_control === undefined)      car.climate_control = 'auto_single';
  if (car.paddle_shifters === undefined)      car.paddle_shifters = false;
  if (car.cruise_control === undefined)       car.cruise_control = false;

  updated++;
}

fs.writeFileSync('cars-data.json', JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`Done. Applied overrides to ${Object.keys(OVERRIDES).length} cars, touched ${updated} total.`);

// Sanity check — print a few key corrections
const checks = [
  ['maruti-ertiga-cng-vxi', 'airbags', 2],
  ['maruti-grand-vitara-delta-plus-mild-hybrid-mt', 'airbags', 2],
  ['mahindra-scorpio-n-z4-diesel-mt', 'airbags', 2],
  ['hyundai-venue-sx-opt-petrol-dct', 'camera_360', false],
  ['mahindra-xuv-3xo-ax7-petrol-at', 'camera_360', false],
  ['kia-seltos-gtx-plus-petrol-dct', 'sunroof', 'panoramic'],
  ['mahindra-scorpio-n-z8-petrol-at', 'parking_sensors_front', false],
];
console.log('\nSanity checks:');
for (const [id, field, expected] of checks) {
  const car = data.cars.find(c => c.id === id);
  const actual = car ? car[field] : 'NOT FOUND';
  const ok = actual === expected;
  console.log(`  ${ok ? '✓' : '✗'} ${id} → ${field}: ${actual} (expected ${expected})`);
}
