// Personal Finance Dashboard — application logic.
// Depends on CATEGORY_BUCKET / BUCKET_PCT from categories.js, loaded first.

const STORAGE_KEY_INCOME = 'pfd.income';
const STORAGE_KEY_TX = 'pfd.transactions';
const STORAGE_KEY_CURRENCY = 'pfd.currency';
const STORAGE_KEY_THEME = 'pfd.theme';

let state = {
  income: 0,
  currency: '€',
  transactions: [],
  viewDate: new Date(), // anchors the viewed month
};

function loadState() {
  try {
    const income = parseFloat(localStorage.getItem(STORAGE_KEY_INCOME));
    state.income = isNaN(income) ? 0 : income;
    const currency = localStorage.getItem(STORAGE_KEY_CURRENCY);
    state.currency = currency || '€';
    const tx = localStorage.getItem(STORAGE_KEY_TX);
    state.transactions = tx ? JSON.parse(tx) : [];
  } catch (e) {
    state.transactions = [];
  }
}

function saveIncome() { try { localStorage.setItem(STORAGE_KEY_INCOME, String(state.income)); } catch (e) {} }
function saveCurrency() { try { localStorage.setItem(STORAGE_KEY_CURRENCY, state.currency); } catch (e) {} }
function saveTransactions() { try { localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(state.transactions)); } catch (e) {} }

function fmt(amount) {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const formatted = rounded.toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  return `${state.currency}${formatted}`;
}

function monthKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }

function currentPeriodTx() {
  const key = monthKey(state.viewDate);
  return state.transactions.filter(t => t.date && t.date.slice(0, 7) === key);
}

function renderPeriodLabel() {
  const label = state.viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  document.getElementById('period-label').textContent = label;
}

function statusFor(bucket, spent, target) {
  if (target <= 0) return { label: 'Set income', cls: 'chip-warn' };
  const pct = spent / target;
  if (bucket === 'Savings') {
    if (pct >= 1) return { label: 'Goal met', cls: 'chip-good' };
    if (pct >= 0.6) return { label: 'Behind', cls: 'chip-warn' };
    return { label: 'Far behind', cls: 'chip-bad' };
  }
  if (pct < 0.9) return { label: 'On track', cls: 'chip-good' };
  if (pct <= 1.0) return { label: 'Near limit', cls: 'chip-warn' };
  return { label: 'Over budget', cls: 'chip-bad' };
}

function barColorVar(bucket, spent, target) {
  if (target <= 0) return 'var(--border)';
  const pct = spent / target;
  if (bucket === 'Savings') {
    if (pct >= 1) return 'var(--good)';
    if (pct >= 0.6) return 'var(--warning)';
    return 'var(--critical)';
  }
  if (pct < 0.9) return 'var(--good)';
  if (pct <= 1.0) return 'var(--warning)';
  return 'var(--critical)';
}

function renderTargets() {
  document.getElementById('target-needs').textContent = fmt(state.income * BUCKET_PCT.Needs);
  document.getElementById('target-wants').textContent = fmt(state.income * BUCKET_PCT.Wants);
  document.getElementById('target-savings').textContent = fmt(state.income * BUCKET_PCT.Savings);
  document.querySelectorAll('#currency-symbol-income').forEach(el => el.textContent = state.currency);
}

function renderBuckets(periodTx) {
  const sums = { Needs: 0, Wants: 0, Savings: 0 };
  periodTx.forEach(t => { sums[CATEGORY_BUCKET[t.category]] += t.amount; });

  document.querySelectorAll('.bucket-card').forEach(card => {
    const bucket = card.dataset.bucket;
    const target = state.income * BUCKET_PCT[bucket];
    const spent = sums[bucket] || 0;
    const pct = target > 0 ? Math.min((spent / target) * 100, 100) : 0;
    const status = statusFor(bucket, spent, target);
    const color = barColorVar(bucket, spent, target);

    card.querySelector('.bucket-spent').textContent = fmt(spent);
    card.querySelector('.bucket-target').textContent = fmt(target);
    card.querySelector('.bucket-bar').style.width = pct + '%';
    card.querySelector('.bucket-bar').style.background = color;
    const chip = card.querySelector('.bucket-chip');
    chip.textContent = status.label;
    chip.className = 'bucket-chip text-xs font-medium px-2.5 py-1 rounded-full ' + status.cls;

    const remaining = target - spent;
    const remainEl = card.querySelector('.bucket-remaining');
    if (target <= 0) {
      remainEl.textContent = 'Set your monthly salary above to see targets.';
    } else if (bucket === 'Savings') {
      remainEl.textContent = remaining > 0
        ? `${fmt(remaining)} short of your 20% goal`
        : `${fmt(Math.abs(remaining))} above your 20% goal`;
    } else {
      remainEl.textContent = remaining >= 0
        ? `${fmt(remaining)} remaining this month`
        : `${fmt(Math.abs(remaining))} over this month`;
    }
  });
}

function renderCategoryBreakdown(periodTx) {
  const sums = {};
  periodTx.forEach(t => { sums[t.category] = (sums[t.category] || 0) + t.amount; });
  const entries = Object.entries(sums).sort((a, b) => b[1] - a[1]);
  const list = document.getElementById('category-list');
  const empty = document.getElementById('category-empty');

  list.querySelectorAll('.category-row').forEach(el => el.remove());

  if (entries.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const maxVal = entries[0][1];
  entries.forEach(([category, amount]) => {
    const bucket = CATEGORY_BUCKET[category];
    const row = document.createElement('div');
    row.className = 'category-row';
    const widthPct = maxVal > 0 ? Math.max((amount / maxVal) * 100, 4) : 0;
    const dotColor = bucket === 'Needs' ? 'var(--accent)' : bucket === 'Wants' ? 'var(--warning)' : 'var(--good)';
    row.innerHTML = `
      <div class="flex items-center justify-between text-sm mb-1">
        <span class="flex items-center gap-2 text-ink">
          <span class="h-1.5 w-1.5 rounded-full" style="background:${dotColor}"></span>
          ${category}
        </span>
        <span class="font-mono tabular text-ink">${fmt(amount)}</span>
      </div>
      <div class="bar-track h-1.5 rounded-full overflow-hidden">
        <div class="bar-fill h-full rounded-full" style="width:${widthPct}%; background:${dotColor}"></div>
      </div>
    `;
    list.appendChild(row);
  });
}

function renderTransactions(periodTx) {
  const body = document.getElementById('tx-body');
  const empty = document.getElementById('tx-empty');
  const count = document.getElementById('tx-count');
  body.innerHTML = '';

  const sorted = [...periodTx].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  count.textContent = sorted.length ? `${sorted.length} entr${sorted.length === 1 ? 'y' : 'ies'}` : '';

  if (sorted.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  sorted.forEach(t => {
    const bucket = CATEGORY_BUCKET[t.category];
    const bucketColor = bucket === 'Needs' ? 'accentSoft' : bucket === 'Wants' ? 'warnSoft' : 'goodSoft';
    const tr = document.createElement('tr');
    tr.className = 'row-enter border-b border-border last:border-0';
    const d = new Date(t.date + 'T00:00:00');
    const dateLabel = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
    tr.innerHTML = `
      <td class="px-5 sm:px-6 py-3 font-mono text-muted whitespace-nowrap">${dateLabel}</td>
      <td class="px-3 py-3 text-ink">${escapeHtml(t.title)}</td>
      <td class="px-3 py-3">
        <span class="inline-block text-xs font-medium px-2 py-1 rounded-full bg-${bucketColor}">${t.category}</span>
      </td>
      <td class="px-3 py-3 text-right font-mono tabular text-ink whitespace-nowrap">${fmt(t.amount)}</td>
      <td class="px-5 sm:px-6 py-3 text-right">
        <button data-id="${t.id}" class="delete-btn text-muted hover:text-bad transition-colors" aria-label="Delete transaction">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      state.transactions = state.transactions.filter(t => t.id !== id);
      saveTransactions();
      renderAll();
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderAll() {
  renderPeriodLabel();
  renderTargets();
  const periodTx = currentPeriodTx();
  renderBuckets(periodTx);
  renderCategoryBreakdown(periodTx);
  renderTransactions(periodTx);
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function initApp() {
  // --- Income input ---
  const incomeInput = document.getElementById('income');
  incomeInput.addEventListener('input', () => {
    const v = parseFloat(incomeInput.value);
    state.income = isNaN(v) || v < 0 ? 0 : v;
    saveIncome();
    renderAll();
  });

  // --- Currency selects (synced) ---
  const currencyDesktop = document.getElementById('currency');
  const currencyMobile = document.getElementById('currency-mobile');
  function onCurrencyChange(val) {
    state.currency = val;
    currencyDesktop.value = val;
    currencyMobile.value = val;
    saveCurrency();
    renderAll();
  }
  currencyDesktop.addEventListener('change', () => onCurrencyChange(currencyDesktop.value));
  currencyMobile.addEventListener('change', () => onCurrencyChange(currencyMobile.value));

  // --- Month navigation ---
  document.getElementById('prev-month').addEventListener('click', () => {
    state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() - 1, 1);
    renderAll();
  });
  document.getElementById('next-month').addEventListener('click', () => {
    state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 1);
    renderAll();
  });

  // --- Transaction form ---
  const form = document.getElementById('tx-form');
  const formError = document.getElementById('form-error');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('tx-title').value.trim();
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const category = document.getElementById('tx-category').value;
    const date = document.getElementById('tx-date').value;

    if (!title || !date || isNaN(amount) || amount <= 0) {
      formError.textContent = 'Please fill in a title, a positive amount, and a date.';
      formError.classList.remove('hidden');
      return;
    }
    formError.classList.add('hidden');

    state.transactions.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      title, amount, category, date,
    });
    saveTransactions();

    // Jump the viewed month to match the new entry so it's visible immediately
    const [y, m] = date.split('-').map(Number);
    state.viewDate = new Date(y, m - 1, 1);

    form.reset();
    document.getElementById('tx-date').value = todayStr();
    renderAll();
  });

  // --- Theme ---
  const themeToggle = document.getElementById('theme-toggle');
  const iconSun = document.getElementById('icon-sun');
  const iconMoon = document.getElementById('icon-moon');
  function applyTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
    iconSun.classList.toggle('hidden', mode !== 'dark');
    iconMoon.classList.toggle('hidden', mode === 'dark');
  }
  let savedTheme = null;
  try { savedTheme = localStorage.getItem(STORAGE_KEY_THEME); } catch (e) {}
  let currentMode = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(currentMode);
  themeToggle.addEventListener('click', () => {
    currentMode = currentMode === 'dark' ? 'light' : 'dark';
    applyTheme(currentMode);
    try { localStorage.setItem(STORAGE_KEY_THEME, currentMode); } catch (e) {}
  });

  // --- Init ---
  loadState();
  incomeInput.value = state.income > 0 ? state.income : '';
  currencyDesktop.value = state.currency;
  currencyMobile.value = state.currency;
  document.getElementById('tx-date').value = todayStr();
  renderAll();
}

document.addEventListener('DOMContentLoaded', initApp);
