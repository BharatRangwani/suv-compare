const WEIGHTS = {
  safety: 0.20,
  value_for_money: 0.20,
  features: 0.20,
  service: 0.15,
  comfort: 0.15,
  reliability: 0.10
};

export function calcTCO(car, profile) {
  const roadTax = car.ex_showroom_jodhpur * 0.11;
  const registration = 15000;
  const insurance = car.ex_showroom_jodhpur * 0.035;
  const onRoad = car.ex_showroom_jodhpur + roadTax + registration + insurance;
  const annualKm = profile.daily_km * profile.days_per_week * 52;

  let annualFuel;
  if (car.fuel === 'electric') {
    // EV: real-world range / battery size = km per kWh, electricity ~₹8/kWh
    const kmPerKwh = car.realworld_range_km && car.battery_kwh
      ? car.realworld_range_km / car.battery_kwh
      : 6;
    annualFuel = (annualKm / kmPerKwh) * 8;
  } else if (car.fuel === 'cng') {
    // CNG: ~₹83/kg in Rajasthan, real-world ~21 km/kg
    const kmPerKg = car.realworld_cng_kmkg || 20;
    annualFuel = (annualKm / kmPerKg) * 83;
  } else {
    annualFuel = (annualKm / (car.realworld_kmpl || 15)) * profile.petrol_price_jodhpur;
  }

  const annualService = car.fuel === 'electric' ? 4000 : car.fuel === 'cng' ? 7000 : 12000;
  const operatingCosts = (annualFuel * 5) + (annualService * 5);
  const resaleValue = Math.min(
    car.ex_showroom_jodhpur * (car.resale_5yr_pct / 100),
    operatingCosts * 0.9
  );
  return Math.round(onRoad + operatingCosts - resaleValue);
}

function safetyScore(car) {
  const starScore = (car.ncap_stars / 5) * 60;
  const airbagScore = Math.min(car.airbags / 6, 1) * 25;
  const adasScore = car.adas ? 15 : 0;
  return Math.min(starScore + airbagScore + adasScore, 100);
}

function featuresScore(car, profile) {
  const mustHaveMap = {
    '6_airbags': car.airbags >= 6,
    'ventilated_seats': car.ventilated_seats,
    'connected_car': car.connected_car,
  };
  const niceHaveMap = {
    'sunroof': car.sunroof !== 'none' && car.sunroof !== undefined,
    'adas': car.adas,
    '360_camera': !!car.camera_360,
    'wireless_carplay': car.wireless_carplay,
  };
  const mustScore = profile.must_haves.reduce((acc, f) => acc + (mustHaveMap[f] ? 1 : 0), 0) / profile.must_haves.length;
  const niceScore = profile.nice_to_haves.reduce((acc, f) => acc + (niceHaveMap[f] ? 1 : 0), 0) / profile.nice_to_haves.length;
  return Math.round(mustScore * 70 + niceScore * 30);
}

function serviceScore(car) {
  const centers = car.service_centers_jodhpur || [];
  if (centers.length === 0) return 20;
  const avgRating = centers.reduce((s, c) => s + c.rating, 0) / centers.length;
  const centerCount = Math.min(centers.length, 3);
  const postSale = ((car.post_sale_service_rating || 3) / 5) * 30;
  return Math.round((centerCount / 3) * 30 + (avgRating / 5) * 40 + postSale);
}

function comfortScore(car, baseline) {
  const bootDelta = Math.min((car.boot_litres - baseline.boot_litres) / 300, 1);
  const legDelta = Math.min((car.rear_legroom_mm - baseline.rear_legroom_mm) / 200, 1);
  const gcDelta = Math.min((car.ground_clearance_mm - baseline.ground_clearance_mm) / 50, 1);
  const cabinDelta = Math.min((car.cabin_width_mm - baseline.cabin_width_mm) / 150, 1);
  return Math.round(Math.max(0, bootDelta * 30 + legDelta * 25 + gcDelta * 25 + cabinDelta * 20) * 100);
}

function valueForMoneyScore(car, profile, tco) {
  const budget5yr = profile.budget_max + (profile.petrol_price_jodhpur * (profile.daily_km * profile.days_per_week * 52 / 15) * 5);
  const ratio = 1 - Math.min(tco / budget5yr, 1);
  return Math.round(ratio * 100);
}

export function scoreCar(car, profile, baseline) {
  const tco = calcTCO(car, profile);
  const breakdown = {
    safety: Math.round(safetyScore(car)),
    features: Math.round(featuresScore(car, profile)),
    service: Math.round(serviceScore(car)),
    comfort: Math.min(Math.round(comfortScore(car, baseline)), 100),
    reliability: Math.min(Math.round(car.reliability_score || 50), 100),
    value_for_money: Math.round(valueForMoneyScore(car, profile, tco))
  };
  const total = Math.min(Math.round(
    breakdown.safety * WEIGHTS.safety +
    breakdown.value_for_money * WEIGHTS.value_for_money +
    breakdown.features * WEIGHTS.features +
    breakdown.service * WEIGHTS.service +
    breakdown.comfort * WEIGHTS.comfort +
    breakdown.reliability * WEIGHTS.reliability
  ), 100);
  return { total, breakdown, tco };
}

export function rankCars(cars, profile, baseline) {
  const scored = cars.map(car => {
    const { total, breakdown, tco } = scoreCar(car, profile, baseline);
    return { ...car, score: total, breakdown, tco };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((car, i) => ({ ...car, rank: i + 1 }));
}

export function getBestVariantPerBrand(rankedCars) {
  const bestByBrand = {};
  for (const car of rankedCars) {
    const brand = car.brand;
    if (!bestByBrand[brand] || car.score > bestByBrand[brand].score) {
      bestByBrand[brand] = car;
    }
  }
  const bestIds = new Set(Object.values(bestByBrand).map(c => c.id));
  return rankedCars.map(car => ({ ...car, is_best_variant_for_user: bestIds.has(car.id) }));
}

export function getVFMTag(rankedCar, allRanked) {
  const ratios = allRanked
    .filter(c => c.ex_showroom_jodhpur > 0)
    .map(c => c.score / (c.ex_showroom_jodhpur / 1000000))
    .sort((a, b) => b - a);
  if (ratios.length === 0) return 'fair';
  const carRatio = rankedCar.score / (rankedCar.ex_showroom_jodhpur / 1000000);
  const top25idx = Math.max(0, Math.floor(ratios.length * 0.25) - 1);
  const bottom25idx = Math.min(ratios.length - 1, Math.ceil(ratios.length * 0.75));
  const top25 = ratios[top25idx];
  const bottom25 = ratios[bottom25idx];
  if (carRatio >= top25) return 'excellent';
  if (carRatio <= bottom25) return 'overpriced';
  return 'fair';
}
