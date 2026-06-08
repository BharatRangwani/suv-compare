const STORAGE_KEY = 'suv_user_profile';

export const DEFAULT_PROFILE = {
  city: 'Jodhpur, Rajasthan',
  current_car: 'Mahindra Quanto C8 Diesel',
  daily_km: 20,
  days_per_week: 5,
  use_case: 'city_plus_occasional_highway',
  budget_target: 2000000,
  budget_max: 2500000,
  fuel_preference: ['petrol_turbo'],
  seating: '5_seater',
  must_haves: ['6_airbags', 'ventilated_seats', 'connected_car'],
  nice_to_haves: ['sunroof', 'adas', '360_camera', 'wireless_carplay'],
  planning_horizon_months: 12,
  petrol_price_jodhpur: 103.0
};

export function getProfile() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function resetProfile() {
  localStorage.removeItem(STORAGE_KEY);
}
