import { calcEMI, calcLoanSummary, getDownPaymentBand, calcOnRoadPrice } from '../modules/emi.js';

describe('calcEMI', () => {
  test('standard 5-year loan at 8.5% on ₹15L principal gives ~₹30,775/month', () => {
    // ₹15L at 8.5% p.a. over 60 months → EMI ≈ ₹30,775
    const emi = calcEMI(1500000, 8.5, 60);
    expect(emi).toBeGreaterThanOrEqual(30575);
    expect(emi).toBeLessThanOrEqual(30975);
  });

  test('zero interest rate returns principal / tenure', () => {
    expect(calcEMI(600000, 0, 60)).toBe(10000);
  });

  test('zero interest with rounding: 1000000 / 36 = Math.round result', () => {
    expect(calcEMI(1000000, 0, 36)).toBe(Math.round(1000000 / 36));
  });

  test('zero principal returns 0', () => {
    expect(calcEMI(0, 8.5, 60)).toBe(0);
  });

  test('negative principal returns 0', () => {
    expect(calcEMI(-100000, 8.5, 60)).toBe(0);
  });

  test('zero tenure returns 0', () => {
    expect(calcEMI(1500000, 8.5, 0)).toBe(0);
  });

  test('negative tenure returns 0', () => {
    expect(calcEMI(1500000, 8.5, -12)).toBe(0);
  });
});

describe('calcLoanSummary', () => {
  test('20% down on ₹20L on-road: loanAmount = 1600000', () => {
    const summary = calcLoanSummary(2000000, 20, 8.5, 60);
    expect(summary.loanAmount).toBe(1600000);
  });

  test('totalInterest is positive', () => {
    const summary = calcLoanSummary(2000000, 20, 8.5, 60);
    expect(summary.totalInterest).toBeGreaterThan(0);
  });

  test('totalPayable equals emi * tenureMonths', () => {
    const summary = calcLoanSummary(2000000, 20, 8.5, 60);
    expect(summary.totalPayable).toBe(summary.emi * summary.tenureMonths);
  });

  test('summary fields are all integers (no decimals)', () => {
    const summary = calcLoanSummary(2000000, 20, 8.5, 60);
    const intFields = ['loanAmount', 'downPayment', 'emi', 'totalPayable', 'totalInterest'];
    intFields.forEach((field) => {
      expect(Number.isInteger(summary[field])).toBe(true);
    });
  });

  test('downPayment is correct percentage of onRoadPrice', () => {
    const summary = calcLoanSummary(2000000, 25, 9.0, 36);
    expect(summary.downPayment).toBe(500000);
    expect(summary.loanAmount).toBe(1500000);
  });

  test('summary carries back tenureMonths, annualRatePercent, downPaymentPct', () => {
    const summary = calcLoanSummary(2000000, 20, 8.5, 60);
    expect(summary.tenureMonths).toBe(60);
    expect(summary.annualRatePercent).toBe(8.5);
    expect(summary.downPaymentPct).toBe(20);
  });
});

describe('getDownPaymentBand', () => {
  test('20 → green', () => {
    expect(getDownPaymentBand(20)).toBe('green');
  });

  test('25 → green', () => {
    expect(getDownPaymentBand(25)).toBe('green');
  });

  test('50 → green', () => {
    expect(getDownPaymentBand(50)).toBe('green');
  });

  test('15 → yellow', () => {
    expect(getDownPaymentBand(15)).toBe('yellow');
  });

  test('10 → yellow', () => {
    expect(getDownPaymentBand(10)).toBe('yellow');
  });

  test('9 → red', () => {
    expect(getDownPaymentBand(9)).toBe('red');
  });

  test('5 → red', () => {
    expect(getDownPaymentBand(5)).toBe('red');
  });

  test('0 → red', () => {
    expect(getDownPaymentBand(0)).toBe('red');
  });
});

describe('calcOnRoadPrice', () => {
  test('₹20L ex-showroom: total = 2305000', () => {
    // roadTax=220000, registration=15000, insurance=70000 → 2305000
    expect(calcOnRoadPrice(2000000)).toBe(2305000);
  });

  test('return value is an integer', () => {
    expect(Number.isInteger(calcOnRoadPrice(2000000))).toBe(true);
  });

  test('result includes all components correctly', () => {
    const ex = 1500000;
    const expected = Math.round(ex + ex * 0.11 + 15000 + ex * 0.035);
    expect(calcOnRoadPrice(ex)).toBe(expected);
  });

  test('registration is always fixed at 15000', () => {
    // Two prices differing only by ex-showroom: difference in on-road
    // should equal difference in tax+insurance (not registration)
    const diff1 = calcOnRoadPrice(1000000);
    const diff2 = calcOnRoadPrice(2000000);
    const exDiff = 1000000;
    const taxInsuranceDiff = exDiff + exDiff * 0.11 + exDiff * 0.035;
    expect(diff2 - diff1).toBe(Math.round(taxInsuranceDiff));
  });
});
