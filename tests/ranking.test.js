import { scoreCar, rankCars, calcTCO, getVFMTag } from '../modules/ranking.js';
import { DEFAULT_PROFILE } from '../modules/profile.js';

const mockCreta = {
  id: 'hyundai-creta-sx-opt-petrol-dct',
  ex_showroom_jodhpur: 1979000,
  ncap_stars: 5, airbags: 6, adas: true,
  ventilated_seats: true, connected_car: true,
  sunroof: 'panoramic', wireless_carplay: true,
  boot_litres: 433, rear_legroom_mm: 945,
  ground_clearance_mm: 190, cabin_width_mm: 1790,
  realworld_kmpl: 13.5,
  resale_5yr_pct: 48, reliability_score: 78,
  service_centers_jodhpur: [{ rating: 4.1 }, { rating: 3.8 }],
  post_sale_service_rating: 3.9
};

const mockNexon = {
  id: 'tata-nexon-fearless-plus-petrol-amt',
  ex_showroom_jodhpur: 1454000,
  ncap_stars: 5, airbags: 6, adas: false,
  ventilated_seats: false, connected_car: true,
  sunroof: 'single_pane', wireless_carplay: true,
  boot_litres: 350, rear_legroom_mm: 860,
  ground_clearance_mm: 208, cabin_width_mm: 1730,
  realworld_kmpl: 13.0,
  resale_5yr_pct: 44, reliability_score: 72,
  service_centers_jodhpur: [{ rating: 3.7 }],
  post_sale_service_rating: 3.5
};

const mockQuanto = {
  boot_litres: 274, rear_legroom_mm: 800,
  ground_clearance_mm: 185, cabin_width_mm: 1680,
  ncap_stars: 0
};

describe('ranking engine', () => {
  test('scoreCar returns object with total between 0 and 100', () => {
    const result = scoreCar(mockCreta, DEFAULT_PROFILE, mockQuanto);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  test('scoreCar breakdown has all 6 categories', () => {
    const result = scoreCar(mockCreta, DEFAULT_PROFILE, mockQuanto);
    expect(result.breakdown).toHaveProperty('safety');
    expect(result.breakdown).toHaveProperty('value_for_money');
    expect(result.breakdown).toHaveProperty('features');
    expect(result.breakdown).toHaveProperty('service');
    expect(result.breakdown).toHaveProperty('comfort');
    expect(result.breakdown).toHaveProperty('reliability');
  });

  test('rankCars returns array sorted by total score descending', () => {
    const ranked = rankCars([mockCreta, mockNexon], DEFAULT_PROFILE, mockQuanto);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
  });

  test('rankCars attaches tco to each car', () => {
    const ranked = rankCars([mockCreta], DEFAULT_PROFILE, mockQuanto);
    expect(ranked[0].tco).toBeGreaterThan(0);
  });

  test('calcTCO returns positive number', () => {
    const tco = calcTCO(mockCreta, DEFAULT_PROFILE);
    expect(tco).toBeGreaterThan(0);
  });

  test('calcTCO for Creta is less than on-road price plus operating costs (resale reduces TCO)', () => {
    const tco = calcTCO(mockCreta, DEFAULT_PROFILE);
    const onRoad = mockCreta.ex_showroom_jodhpur * 1.145 + 15000;
    const annualKm = DEFAULT_PROFILE.daily_km * DEFAULT_PROFILE.days_per_week * 52;
    const annualFuel = (annualKm / mockCreta.realworld_kmpl) * DEFAULT_PROFILE.petrol_price_jodhpur;
    const opCosts = (annualFuel + 12000) * 5;
    expect(tco).toBeGreaterThan(0);
    expect(tco).toBeLessThan(onRoad + opCosts);
  });

  test('getVFMTag returns one of three valid tags', () => {
    const ranked = rankCars([mockCreta, mockNexon], DEFAULT_PROFILE, mockQuanto);
    const tag = getVFMTag(ranked[0], ranked);
    expect(['excellent', 'fair', 'overpriced']).toContain(tag);
  });

  test('car with all must-haves scores higher on features than car missing them', () => {
    const withAll = scoreCar(mockCreta, DEFAULT_PROFILE, mockQuanto);
    const withoutAll = scoreCar(mockNexon, DEFAULT_PROFILE, mockQuanto);
    expect(withAll.breakdown.features).toBeGreaterThan(withoutAll.breakdown.features);
  });
});
