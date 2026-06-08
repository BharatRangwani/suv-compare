import { calcRatingsTotal, formatStars, getWaitingLabel } from '../modules/ui-detail.js';

// ─── calcRatingsTotal ─────────────────────────────────────────────────────────

describe('calcRatingsTotal', () => {
  const FIELDS = [
    'rating_engine', 'rating_ride_handling', 'rating_nvh', 'rating_fit_finish',
    'rating_interior_quality', 'rating_interior_space', 'rating_boot_space',
    'rating_features_tech', 'rating_service_quality'
  ];

  function makeCar(values) {
    return Object.fromEntries(FIELDS.map((f, i) => [f, values[i]]));
  }

  test('all 9 fields = 8 → 8.0', () => {
    const car = makeCar([8, 8, 8, 8, 8, 8, 8, 8, 8]);
    expect(calcRatingsTotal(car)).toBe(8.0);
  });

  test('all 9 fields = 10 → 10.0', () => {
    const car = makeCar([10, 10, 10, 10, 10, 10, 10, 10, 10]);
    expect(calcRatingsTotal(car)).toBe(10.0);
  });

  test('all 9 fields = 0 → 0.0', () => {
    const car = makeCar([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(calcRatingsTotal(car)).toBe(0.0);
  });

  test('Creta SX(O) values [8,8,7,8,8,8,8,9,8] → 8.0', () => {
    const car = makeCar([8, 8, 7, 8, 8, 8, 8, 9, 8]);
    // sum = 72, avg = 8.0
    expect(calcRatingsTotal(car)).toBe(8.0);
  });

  test('Seltos GTX+ values [8,8,8,9,9,9,8,9,6] → 8.2', () => {
    const car = makeCar([8, 8, 8, 9, 9, 9, 8, 9, 6]);
    // sum = 74, avg = 8.222... → 8.2
    expect(calcRatingsTotal(car)).toBe(8.2);
  });

  test('Quanto baseline values [5,5,3,5,4,4,3,2,5] → 4.0', () => {
    const car = makeCar([5, 5, 3, 5, 4, 4, 3, 2, 5]);
    // sum = 36, avg = 4.0
    expect(calcRatingsTotal(car)).toBe(4.0);
  });

  test('missing all fields (empty object) → 0.0', () => {
    expect(calcRatingsTotal({})).toBe(0.0);
  });

  test('mix of defined and missing fields: 3 fields defined, rest missing', () => {
    const car = { rating_engine: 9, rating_ride_handling: 9, rating_nvh: 9 };
    // sum = 27, avg = 27/9 = 3.0
    expect(calcRatingsTotal(car)).toBe(3.0);
  });

  test('non-integer values are averaged correctly', () => {
    const car = makeCar([7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5]);
    expect(calcRatingsTotal(car)).toBe(7.5);
  });

  test('return type is number', () => {
    expect(typeof calcRatingsTotal({})).toBe('number');
    expect(typeof calcRatingsTotal({ rating_engine: 8 })).toBe('number');
  });
});

// ─── formatStars ──────────────────────────────────────────────────────────────

describe('formatStars', () => {
  test('formatStars(5) → all filled stars', () => {
    expect(formatStars(5)).toBe('★★★★★');
  });

  test('formatStars(0) → all empty stars', () => {
    expect(formatStars(0)).toBe('☆☆☆☆☆');
  });

  test('formatStars(3) → 3 filled + 2 empty', () => {
    expect(formatStars(3)).toBe('★★★☆☆');
  });

  test('formatStars(1) → 1 filled + 4 empty', () => {
    expect(formatStars(1)).toBe('★☆☆☆☆');
  });

  test('formatStars(4) → 4 filled + 1 empty', () => {
    expect(formatStars(4)).toBe('★★★★☆');
  });

  test('formatStars(-1) clamps to 0 → all empty stars', () => {
    expect(formatStars(-1)).toBe('☆☆☆☆☆');
  });

  test('formatStars(6) clamps to 5 → all filled stars', () => {
    expect(formatStars(6)).toBe('★★★★★');
  });
});

// ─── getWaitingLabel ──────────────────────────────────────────────────────────

describe('getWaitingLabel', () => {
  test('0 → "Available Now"', () => {
    expect(getWaitingLabel(0)).toBe('Available Now');
  });

  test('1 → "~1 week wait"', () => {
    expect(getWaitingLabel(1)).toBe('~1 week wait');
  });

  test('2 → "~2 weeks wait"', () => {
    expect(getWaitingLabel(2)).toBe('~2 weeks wait');
  });

  test('3 → "~3 weeks wait"', () => {
    expect(getWaitingLabel(3)).toBe('~3 weeks wait');
  });

  test('4 → "~4 weeks wait"', () => {
    expect(getWaitingLabel(4)).toBe('~4 weeks wait');
  });

  test('5 → "~5 weeks wait (moderate)"', () => {
    expect(getWaitingLabel(5)).toBe('~5 weeks wait (moderate)');
  });

  test('8 → "~8 weeks wait (moderate)"', () => {
    expect(getWaitingLabel(8)).toBe('~8 weeks wait (moderate)');
  });

  test('9 → "9+ weeks wait (long)"', () => {
    expect(getWaitingLabel(9)).toBe('9+ weeks wait (long)');
  });

  test('12 → "12+ weeks wait (long)"', () => {
    expect(getWaitingLabel(12)).toBe('12+ weeks wait (long)');
  });

  test('0 and 1 do not include "moderate" or "long"', () => {
    expect(getWaitingLabel(0)).not.toMatch(/moderate|long/);
    expect(getWaitingLabel(1)).not.toMatch(/moderate|long/);
  });
});
