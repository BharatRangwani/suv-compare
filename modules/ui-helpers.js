// modules/ui-helpers.js
// First-time buyer helpers: tooltip system + dealer checklist

// ─── Tooltip glossary ─────────────────────────────────────────────────────────

const GLOSSARY = {
  ADAS: 'Advanced Driver Assistance Systems — radar/camera features like automatic emergency braking, lane-keep assist, and blind-spot warnings that help prevent accidents.',
  AEB: 'Automatic Emergency Braking — applies the brakes automatically if it detects you\'re about to hit something and you haven\'t reacted yet.',
  DCT: 'Dual Clutch Transmission — a type of automatic gearbox that uses two clutches for faster, more fuel-efficient gear changes. Slightly jerky at low speeds.',
  CVT: 'Continuously Variable Transmission — a smooth, stepless automatic. Feels like gliding. Fuel-efficient in city. Less sporty feeling than DCT.',
  'iMT': 'Intelligent Manual Transmission — a clutch-less manual. You shift gears yourself but there\'s no clutch pedal. Good middle ground.',
  'ARAI mileage': 'Official government fuel-efficiency figure tested in lab conditions. Real-world mileage is typically 15–25% lower.',
  NCAP: 'New Car Assessment Programme — global crash-safety test. 5★ = highest safety. Check which programme tested it: Global NCAP (independent) vs Bharat NCAP (India).',
  'NCAP stars': 'Crash safety rating from 1 to 5 stars. 5★ = best. Tested with adults and children in frontal and side crashes.',
  'Ground clearance': 'How high the bottom of the car is from the road. Higher = better for speed breakers and bad roads. 190mm+ is good for Indian conditions.',
  'Sunroof': 'A glass panel in the roof. Panoramic = large fixed+tilt glass. Electric sunroof = slides open. Moonroof = smaller, tilt-only.',
  'Ventilated seats': 'Seats with tiny fans inside that blow cool air through tiny holes. Excellent for Jodhpur summers — reduces sweaty back significantly.',
  'Connected car': 'Remote features via an app: lock/unlock your car, check location, start A/C remotely, get service alerts.',
  'BlueLink': 'Hyundai\'s connected car system. App-based remote control, geofencing, location tracking.',
  'iRA': 'Kia\'s connected car system (similar to Hyundai BlueLink but with Kia branding and slightly different features).',
  'i-SMART': 'MG\'s connected car system. One of the most feature-rich with voice commands and real-time data.',
  'Wireless CarPlay': 'Connect your iPhone to the car\'s screen without a cable. Your maps, music, and calls appear on the car display.',
  'Wireless AA': 'Wireless Android Auto — same as above but for Android phones.',
  'Torque': 'The pulling power of the engine, measured in Newton-metres (Nm). Higher torque = better acceleration from low speeds, better for hills.',
  'BHP': 'Brake Horsepower — the engine\'s power output. Higher BHP = higher top speed and faster acceleration.',
  'Turbo': 'A turbocharger forces more air into the engine, giving more power from a smaller engine. More efficient than naturally-aspirated engines.',
  'Strong hybrid': 'Has a large battery + electric motor that can drive the car alone at low speeds. Significantly better city fuel efficiency. Examples: Toyota Hyryder, Maruti Grand Vitara.',
  'Mild hybrid': 'Has a small battery that assists the engine slightly. Less fuel saving than strong hybrid. More of a marketing term. Most 48V systems qualify.',
  'Ex-showroom': 'The price at the dealership before registration, road tax, insurance, and other charges are added.',
  'On-road price': 'The total price you actually pay: ex-showroom + road tax + registration fees + insurance + TCS + accessories.',
  'Road tax': 'Rajasthan charges approximately 11% of ex-showroom price as road tax.',
  'TCO': '5-Year Total Cost of Ownership — includes purchase price, fuel, insurance, maintenance, minus estimated resale value. The true cost of owning a car.',
  'EMI': 'Equated Monthly Instalment — your monthly loan payment. Calculated as principal + interest, spread over the loan tenure.',
  'Resale value': 'How much you\'ll likely get when you sell the car after a few years. Toyota and Hyundai typically hold value better than others.',
  'ARAI': 'Automotive Research Association of India — the government body that tests and certifies vehicles.',
  'BS6': 'Bharat Stage 6 — India\'s current emission standard (equivalent to Euro 6). All new cars sold in India are BS6.',
  'Waiting period': 'How many weeks you\'ll wait after booking before the car is delivered to you. Popular models can have 4–16 week waits.',
  'Boot space': 'Luggage space behind the rear seats, measured in litres. 350L is decent for a family; 400L+ is generous.',
};

// ─── Tooltip injection ────────────────────────────────────────────────────────

let _tooltipEl = null;

function _getOrCreateTooltip() {
  if (_tooltipEl) return _tooltipEl;
  _tooltipEl = document.createElement('div');
  _tooltipEl.className = 'gloss-tooltip';
  _tooltipEl.setAttribute('role', 'tooltip');
  document.body.appendChild(_tooltipEl);

  // Close on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.gloss-term') && !e.target.closest('.gloss-tooltip')) {
      _tooltipEl.classList.remove('visible');
    }
  });
  return _tooltipEl;
}

function _showTooltip(term, definition, anchor) {
  const tip = _getOrCreateTooltip();
  tip.innerHTML = `<strong>${term}</strong><p>${definition}</p>`;
  tip.classList.add('visible');

  const rect = anchor.getBoundingClientRect();
  const tipWidth = 260;
  let left = rect.left + window.scrollX;
  if (left + tipWidth > window.innerWidth - 16) left = window.innerWidth - tipWidth - 16;
  if (left < 8) left = 8;
  tip.style.left = left + 'px';
  tip.style.top = (rect.bottom + window.scrollY + 6) + 'px';
}

/**
 * Scans a DOM element and wraps known glossary terms with tooltip triggers.
 * Safe to call multiple times — skips already-wrapped nodes.
 */
export function applyGlossaryTooltips(rootEl) {
  const tip = _getOrCreateTooltip();

  // Walk text nodes only
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // Skip script, style, already-wrapped terms
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (['script','style','textarea','input'].includes(tag)) return NodeFilter.FILTER_REJECT;
      if (parent.classList.contains('gloss-term')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const toReplace = [];
  let node;
  while ((node = walker.nextNode())) {
    for (const term of Object.keys(GLOSSARY)) {
      if (node.textContent.includes(term)) {
        toReplace.push({ node, term });
        break; // one replacement per text node to keep it simple
      }
    }
  }

  toReplace.forEach(({ node, term }) => {
    const text = node.textContent;
    const idx = text.indexOf(term);
    if (idx === -1) return;
    const before = document.createTextNode(text.slice(0, idx));
    const span = document.createElement('span');
    span.className = 'gloss-term';
    span.textContent = term;
    span.setAttribute('tabindex', '0');
    span.setAttribute('aria-describedby', 'gloss-tooltip');
    const after = document.createTextNode(text.slice(idx + term.length));
    const parent = node.parentNode;
    parent.replaceChild(after, node);
    parent.insertBefore(span, after);
    parent.insertBefore(before, span);

    span.addEventListener('click', e => {
      e.stopPropagation();
      if (tip.classList.contains('visible') && tip.dataset.term === term) {
        tip.classList.remove('visible');
      } else {
        tip.dataset.term = term;
        _showTooltip(term, GLOSSARY[term], span);
      }
    });
    span.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        _showTooltip(term, GLOSSARY[term], span);
      }
    });
  });
}

// ─── Dealer visit checklist ───────────────────────────────────────────────────

const CHECKLIST_ITEMS = [
  { cat: 'Before you go', items: [
    'Research 2–3 dealers for the same brand — prices vary by ₹10–30k',
    'Check waiting period on CarDekho/Team-BHP forums before visiting',
    'Know your budget, preferred variant, and colour before stepping in',
    'Get competitor quotes (e.g. quote from Kia to negotiate Hyundai)',
  ]},
  { cat: 'At the showroom', items: [
    'Ask for ex-showroom price in writing (not "on-road estimate")',
    'Ask for itemized on-road breakup: road tax, registration, insurance, TCS, accessories',
    'Ask specifically: "Is there any dealer-added accessory pack I can opt out of?"',
    'Ask: "What is the current waiting period for this colour/variant?"',
    'Ask: "Are there any pending price revision announcements?" (prices change quarterly)',
  ]},
  { cat: 'Test drive checks', items: [
    'Test infotainment: try CarPlay/AA, Bluetooth audio, speaker quality',
    'Test ventilated seats — turn them on and feel the difference',
    'Test ADAS features if available: try the automatic braking demo on display car',
    'Check rear legroom: sit in the back yourself',
    'Open the boot: check if it fits your typical luggage',
    'Drive over a speed breaker: listen for thuds, rattles, suspension feel',
    'Try parking sensor/camera clarity',
    'Test A/C cooling speed (important for Jodhpur summers)',
  ]},
  { cat: 'Finance & exchange', items: [
    'Get loan pre-approval from your bank before visiting — dealer DSA rates are usually 0.25–0.5% higher',
    'Compare SBI, HDFC, ICICI rates online before negotiating',
    'For exchange: get Cars24/Spinny quote first to know your floor price',
    'Ask dealer: "What is your exchange price for my current vehicle?"',
    'Do not bundle exchange and loan negotiations — handle separately',
  ]},
  { cat: 'Before signing', items: [
    'Check the delivery date is written in the booking form',
    'Ask about extended warranty options and pricing',
    'Confirm: which accessories are included vs priced extra',
    'Get the service schedule in writing (first free service at how many km?)',
    'Ask: "Which Jodhpur service center would you recommend for this model?"',
  ]},
];

const QUESTIONS_TO_ASK = [
  { q: 'What\'s the on-road price with zero accessories?', why: 'Dealers bundle ₹15–40k in accessories you often don\'t need (floor mats, seat covers, body film). Getting the base price lets you negotiate.' },
  { q: 'Is this a new stock or a display/demo vehicle?', why: 'Demo cars have driven km and previous customer test drives. Should get a discount.' },
  { q: 'When was this car manufactured?', why: 'Cars can sit in stock for months. Ask for a recently manufactured unit (check on the chassis plate).' },
  { q: 'What\'s your best cash discount right now?', why: 'End of month, financial year end (March), and festive season (Oct) are best times. Always ask even if it\'s not those times.' },
  { q: 'What are the exact ADAS features that work in India conditions?', why: 'Some ADAS features advertised globally are disabled or don\'t work well in India. Get clarity before paying a premium.' },
  { q: 'How many service centers are there in Jodhpur for this brand?', why: 'Critical for ownership experience. Hyundai and Maruti have widest networks; new brands (MG, Kia) are still expanding.' },
  { q: 'What is the tyre brand and size on this variant?', why: 'OEM tyres vary by variant. Top variants sometimes get better tyre brands (MRF, Bridgestone vs Apollo/JK).' },
  { q: 'Can I see the window sticker / MSRP sheet?', why: 'This shows the official price breakdown without dealer markup. Useful for negotiation.' },
];

export function renderDealerChecklist(container) {
  const el = document.createElement('section');
  el.className = 'dealer-checklist';
  el.innerHTML = `
    <h2 class="exchange-title">Dealer Visit Checklist</h2>
    <p class="exchange-subtitle">Everything to do, ask, and check before you sign anything.</p>
  `;

  // Checklist sections
  CHECKLIST_ITEMS.forEach(({ cat, items }) => {
    const section = document.createElement('div');
    section.className = 'checklist-section glass-section';
    section.innerHTML = `
      <div class="checklist-cat">${cat}</div>
      <ul class="checklist-list">
        ${items.map(item => `
          <li class="checklist-item">
            <button class="checklist-check" aria-label="Mark as done" role="checkbox" aria-checked="false">
              <span class="check-box"></span>
            </button>
            <span class="checklist-text">${item}</span>
          </li>
        `).join('')}
      </ul>
    `;
    el.appendChild(section);
  });

  // Questions to ask
  const qSection = document.createElement('div');
  qSection.className = 'questions-section';
  qSection.innerHTML = `
    <h3 class="questions-title">Questions to ask your dealer</h3>
    <div class="questions-list">
      ${QUESTIONS_TO_ASK.map(({ q, why }) => `
        <details class="question-item glass-section">
          <summary class="question-q">${q}</summary>
          <p class="question-why">${why}</p>
        </details>
      `).join('')}
    </div>
  `;
  el.appendChild(qSection);

  container.appendChild(el);

  // Checkbox toggle
  el.addEventListener('click', e => {
    const btn = e.target.closest('.checklist-check');
    if (!btn) return;
    const checked = btn.getAttribute('aria-checked') === 'true';
    btn.setAttribute('aria-checked', String(!checked));
    btn.closest('.checklist-item').classList.toggle('done', !checked);
  });
}
