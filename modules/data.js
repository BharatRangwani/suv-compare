let _cache = null;

export async function loadCarsData() {
  if (_cache) return _cache;
  const res = await fetch('./cars-data.json');
  if (!res.ok) throw new Error('Failed to load car data');
  _cache = await res.json();
  return _cache;
}

export function invalidateCache() {
  _cache = null;
}

export function getBaselineCar(data) {
  return data.cars.find(c => c.is_baseline === true);
}

export function getCarsForRanking(data) {
  return data.cars.filter(c => !c.is_baseline);
}
