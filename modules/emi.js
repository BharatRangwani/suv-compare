// modules/emi.js

export function calcEMI(principal, annualRatePercent, tenureMonths) {
  if (principal <= 0) return 0;
  if (tenureMonths <= 0) return 0;
  if (annualRatePercent === 0) return Math.round(principal / tenureMonths);

  const r = annualRatePercent / 12 / 100;
  const n = tenureMonths;
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
}

export function calcLoanSummary(onRoadPrice, downPaymentPct, annualRatePercent, tenureMonths) {
  const downPayment = Math.round(onRoadPrice * downPaymentPct / 100);
  const loanAmount = onRoadPrice - downPayment;
  const emi = calcEMI(loanAmount, annualRatePercent, tenureMonths);
  const totalPayable = emi * tenureMonths;
  const totalInterest = totalPayable - loanAmount;

  return {
    loanAmount,
    downPayment,
    emi,
    totalPayable,
    totalInterest,
    tenureMonths,
    annualRatePercent,
    downPaymentPct,
  };
}

export function getDownPaymentBand(downPaymentPct) {
  if (downPaymentPct >= 20) return 'green';
  if (downPaymentPct >= 10) return 'yellow';
  return 'red';
}

export function calcOnRoadPrice(exShowroom) {
  const roadTax = exShowroom * 0.11;
  const registration = 15000;
  const insurance = exShowroom * 0.035;
  return Math.round(exShowroom + roadTax + registration + insurance);
}

export function renderEMICalculator(container, initialOnRoadPrice) {
  container.innerHTML = `
    <div class="emi-calculator">
      <h3>EMI Calculator</h3>

      <label>On-road Price (&#8377;)
        <input type="number" id="emi-price" value="${initialOnRoadPrice}" step="10000" min="0">
      </label>

      <label>Down Payment (%)
        <input type="range" id="emi-dp-pct" min="5" max="50" value="20" step="1">
        <span id="emi-dp-display">20%</span>
      </label>

      <label>Loan Tenure
        <select id="emi-tenure">
          <option value="12">1 year</option>
          <option value="24">2 years</option>
          <option value="36">3 years</option>
          <option value="48">4 years</option>
          <option value="60" selected>5 years</option>
          <option value="84">7 years</option>
        </select>
      </label>

      <label>Interest Rate (% p.a.)
        <div class="rate-presets">
          <button class="rate-preset active" data-rate="8.5">SBI 8.5%</button>
          <button class="rate-preset" data-rate="8.75">HDFC 8.75%</button>
          <button class="rate-preset" data-rate="9.0">ICICI 9%</button>
        </div>
        <input type="number" id="emi-rate" value="8.5" step="0.25" min="1" max="25">
      </label>

      <div class="emi-result">
        <div class="emi-monthly">&#8377;<span id="emi-amount">0</span>/month</div>
        <div class="emi-breakdown">
          <div>Loan amount: &#8377;<span id="emi-loan">0</span></div>
          <div>Down payment: &#8377;<span id="emi-dp-amt">0</span> (<span id="emi-dp-pct-display">20</span>%)</div>
          <div>Total interest: &#8377;<span id="emi-interest">0</span></div>
          <div>Total payable: &#8377;<span id="emi-total">0</span></div>
        </div>
        <div id="emi-dp-band" class="down-payment-band band-green">
          20%+ down payment — comfortable EMI burden
        </div>
      </div>
    </div>
  `;

  const priceInput = container.querySelector('#emi-price');
  const dpPctInput = container.querySelector('#emi-dp-pct');
  const dpDisplay = container.querySelector('#emi-dp-display');
  const tenureSelect = container.querySelector('#emi-tenure');
  const rateInput = container.querySelector('#emi-rate');
  const ratePresets = container.querySelectorAll('.rate-preset');

  const emiAmount = container.querySelector('#emi-amount');
  const emiLoan = container.querySelector('#emi-loan');
  const emiDpAmt = container.querySelector('#emi-dp-amt');
  const emiDpPctDisplay = container.querySelector('#emi-dp-pct-display');
  const emiInterest = container.querySelector('#emi-interest');
  const emiTotal = container.querySelector('#emi-total');
  const emiDpBand = container.querySelector('#emi-dp-band');

  const bandMessages = {
    green: '20%+ down payment — comfortable EMI burden',
    yellow: '10-20% down payment — manageable, watch monthly budget',
    red: 'Under 10% down payment — high EMI and interest cost',
  };

  function recalculate() {
    const price = parseFloat(priceInput.value) || 0;
    const dpPct = parseFloat(dpPctInput.value) || 0;
    const tenure = parseInt(tenureSelect.value, 10) || 60;
    const rate = parseFloat(rateInput.value) || 0;

    dpDisplay.textContent = dpPct + '%';

    const summary = calcLoanSummary(price, dpPct, rate, tenure);

    emiAmount.textContent = summary.emi.toLocaleString('en-IN');
    emiLoan.textContent = summary.loanAmount.toLocaleString('en-IN');
    emiDpAmt.textContent = summary.downPayment.toLocaleString('en-IN');
    emiDpPctDisplay.textContent = dpPct;
    emiInterest.textContent = summary.totalInterest.toLocaleString('en-IN');
    emiTotal.textContent = summary.totalPayable.toLocaleString('en-IN');

    const band = getDownPaymentBand(dpPct);
    emiDpBand.className = `down-payment-band band-${band}`;
    emiDpBand.textContent = bandMessages[band];
  }

  priceInput.addEventListener('input', recalculate);
  dpPctInput.addEventListener('input', recalculate);
  tenureSelect.addEventListener('change', recalculate);
  rateInput.addEventListener('input', recalculate);

  ratePresets.forEach((btn) => {
    btn.addEventListener('click', () => {
      ratePresets.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      rateInput.value = btn.dataset.rate;
      recalculate();
    });
  });

  recalculate();
}
