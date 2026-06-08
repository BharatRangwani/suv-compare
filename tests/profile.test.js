import { getProfile, saveProfile, resetProfile, DEFAULT_PROFILE } from '../modules/profile.js';

// Mock localStorage for Node
global.localStorage = (() => {
  let store = {};
  return {
    getItem: k => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: k => { delete store[k]; },
    clear: () => { store = {}; }
  };
})();

describe('profile module', () => {
  beforeEach(() => localStorage.clear());

  test('getProfile returns default profile when nothing saved', () => {
    const p = getProfile();
    expect(p.city).toBe('Jodhpur, Rajasthan');
    expect(p.budget_target).toBe(2000000);
    expect(p.must_haves).toContain('6_airbags');
  });

  test('saveProfile persists and getProfile reads it back', () => {
    saveProfile({ ...DEFAULT_PROFILE, budget_target: 2200000 });
    const p = getProfile();
    expect(p.budget_target).toBe(2200000);
  });

  test('resetProfile restores defaults', () => {
    saveProfile({ ...DEFAULT_PROFILE, budget_target: 2200000 });
    resetProfile();
    expect(getProfile().budget_target).toBe(2000000);
  });

  test('DEFAULT_PROFILE has all required fields', () => {
    expect(DEFAULT_PROFILE).toHaveProperty('must_haves');
    expect(DEFAULT_PROFILE).toHaveProperty('nice_to_haves');
    expect(DEFAULT_PROFILE).toHaveProperty('petrol_price_jodhpur');
    expect(DEFAULT_PROFILE.must_haves).toContain('ventilated_seats');
    expect(DEFAULT_PROFILE.must_haves).toContain('connected_car');
  });
});
