import { loadCarsData, getBaselineCar, getCarsForRanking, invalidateCache } from '../modules/data.js';
import { readFileSync } from 'fs';

// Polyfill fetch for Node test environment
global.fetch = async (url) => ({
  ok: true,
  json: async () => JSON.parse(readFileSync(new URL('../cars-data.json', import.meta.url)))
});

describe('data module', () => {
  beforeEach(() => invalidateCache());

  test('loadCarsData returns object with cars array', async () => {
    const data = await loadCarsData();
    expect(Array.isArray(data.cars)).toBe(true);
    expect(data.cars.length).toBeGreaterThan(0);
  });

  test('getBaselineCar returns Quanto', async () => {
    const data = await loadCarsData();
    const baseline = getBaselineCar(data);
    expect(baseline.model).toBe('Quanto');
    expect(baseline.is_baseline).toBe(true);
  });

  test('getCarsForRanking excludes baseline', async () => {
    const data = await loadCarsData();
    const cars = getCarsForRanking(data);
    expect(cars.every(c => !c.is_baseline)).toBe(true);
    expect(cars.length).toBeGreaterThan(0);
  });

  test('getCarsForRanking returns only non-baseline cars', async () => {
    const data = await loadCarsData();
    const cars = getCarsForRanking(data);
    expect(cars.length).toBeGreaterThan(0);
    expect(cars.every(c => !c.is_baseline)).toBe(true);
  });
});
