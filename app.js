const sampleTransactions = [
  { id: 1, name: 'Whole Foods Market', category: 'Food & dining', date: '2026-10-05', payment: 'Debit card', amount: -84.32, icon: '✳' },
  { id: 2, name: 'Monthly salary', category: 'Salary', date: '2026-10-04', payment: 'Bank transfer', amount: 4200, icon: '↙' },
  { id: 3, name: 'Metro Transit', category: 'Transport', date: '2026-10-03', payment: 'Debit card', amount: -28.50, icon: '↗' },
  { id: 4, name: 'Streaming subscription', category: 'Entertainment', date: '2026-10-02', payment: 'Credit card', amount: -14.99, icon: '▷' },
  { id: 5, name: 'Cornerstone Coffee', category: 'Food & dining', date: '2026-10-01', payment: 'Debit card', amount: -8.75, icon: '☕' }
];
const budgets = [
  { name: 'Housing', icon: '⌂', spent: 1450, limit: 1800, color: 'cat-housing' },
  { name: 'Food & dining', icon: '✳', spent: 468, limit: 650, color: 'cat-food' },
  { name: 'Transport', icon: '↗', spent: 126, limit: 250, color: 'cat-transport' },
  { name: 'Shopping', icon: '◇', spent: 342, limit: 400, color: 'cat-shopping' }
];
const spending = [
  { name: 'Housing', spent: 1450, budget: 1800 },
  { name: 'Food & dining', spent: 468, budget: 650 },
  { name: 'Transport', spent: 126, budget: 250 },
  { name: 'Shopping', spent: 342, budget: 400 },
  { name: 'Other', spent: 433.50, budget: 600 }
];
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const $ = selector => document.querySelector(selector);

function loadTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem('fintrack-transactions'));
    return Array.isArray(saved) ? saved : sampleTransactions;
  } catch { return sampleTransactions; }
}
let transactions = loadTransactions();

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function renderTransactions() {
  const query = $('#transactionSearch').value.trim().toLowerCase();
  const filter = $('#filterSelect').value;
  const visible = transactions.filter(tx => {
    const type = tx.amount >= 0 ? 'income' : 'expense';
    return (filter === 'all' || filter === type) && `${tx.name} ${tx.category} ${tx.payment}`.toLowerCase().includes(query);
  }).sort((a, b) => b.date.localeCompare(a.date));

  $('#transactionRows').innerHTML = visible.map(tx => {
    const income = Number(tx.amount) >= 0;
    return `<tr>
      <td><div class="transaction-name"><span class="merchant-icon ${income ? 'income-merchant' : ''}">${escapeHTML(tx.icon || '◇')}</span>${escapeHTML(tx.name)}</div></td>
      <td><span class="category-pill">${escapeHTML(tx.category)}</span></td>
      <td>${dateFormat.format(new Date(`${tx.date}T12:00:00`))}</td>
      <td>${escapeHTML(tx.payment)}</td>
      <td class="amount ${income ? 'positive' : ''}">${income ? '+' : '−'}${money.format(Math.abs(Number(tx.amount)))}</td>
    </tr>`;
  }).join('');
  $('#emptyState').hidden = visible.length > 0;
}

function renderBudgets() {
  $('#budgetList').innerHTML = budgets.map(item => {
    const percent = Math.min(100, Math.round(item.spent / item.limit * 100));
    const tone = percent >= 90 ? 'warn' : percent <= 65 ? 'good' : '';
    return `<div class="budget-item"><div class="budget-meta">
      <span class="category-icon ${item.color}">${item.icon}</span>
      <span class="budget-names"><strong>${item.name}</strong><span>${percent}% of monthly limit</span></span>
      <span class="budget-value">${money.format(item.spent)} <span style="color:#a6afbc;font-weight:400">/ ${money.format(item.limit)}</span></span>
    </div><div class="budget-track"><div class="budget-fill ${tone}" style="width:${percent}%"></div></div></div>`;
  }).join('');
}

function renderChart() {
  const isWeek = $('#periodSelect').value === 'week';
  const rows = isWeek ? spending.map(row => ({ ...row, spent: Math.round(row.spent * .28), budget: Math.round(row.budget * .28) })) : spending;
  const max = Math.max(...rows.map(row => row.budget));
  $('#chartTotal').textContent = money.format(rows.reduce((sum, row) => sum + row.spent, 0));
  $('#spendingChart').innerHTML = rows.map(row => `<div class="chart-row">
    <span class="chart-label">${row.name}</span>
    <div class="bar-track" title="Spent ${money.format(row.spent)} of ${money.format(row.budget)} budget">
      <span class="bar-budget" style="width:${Math.max(4, row.budget / max * 100)}%"></span>
      <span class="bar-spent" style="width:${Math.min(100, row.spent / max * 100)}%"></span>
    </div><span class="bar-amount">${money.format(row.spent)}</span></div>`).join('');
}

function refreshTotals() {
  const initialIncome = sampleTransactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
  const initialExpenses = sampleTransactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const income = transactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + Number(tx.amount), 0);
  const expenses = transactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
  $('#incomeValue').textContent = money.format(1040 + income);
  $('#expenseValue').textContent = money.format(2819.50 - initialExpenses + expenses);
  $('#balanceValue').textContent = money.format(8420.50 + income - initialIncome - (expenses - initialExpenses));
}

let toastTimer;
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function openDialog() {
  const dialog = $('#transactionDialog');
  $('#transactionForm').elements.date.value = new Date().toISOString().slice(0, 10);
  if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
}

$('#openModal').addEventListener('click', openDialog);
$('#closeModal').addEventListener('click', () => $('#transactionDialog').close());
$('#cancelModal').addEventListener('click', () => $('#transactionDialog').close());
$('#transactionForm').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const income = data.get('type') === 'income';
  transactions.unshift({
    id: Date.now(), name: data.get('name').trim(), category: data.get('category'),
    date: data.get('date'), payment: data.get('payment'),
    amount: Math.abs(Number(data.get('amount'))) * (income ? 1 : -1), icon: income ? '↙' : '◇'
  });
  try { localStorage.setItem('fintrack-transactions', JSON.stringify(transactions)); } catch { /* demo still works for this session */ }
  renderTransactions(); refreshTotals(); $('#transactionDialog').close(); form.reset();
  showToast('Transaction added to your activity.');
});
$('#transactionSearch').addEventListener('input', renderTransactions);
$('#filterSelect').addEventListener('change', renderTransactions);
$('#periodSelect').addEventListener('change', renderChart);
$('#exportBtn').addEventListener('click', () => {
  const rows = [['Name', 'Category', 'Date', 'Payment method', 'Amount'], ...transactions.map(tx => [tx.name, tx.category, tx.date, tx.payment, tx.amount])];
  const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'fintrack-transactions.csv'; link.click(); URL.revokeObjectURL(url);
  showToast('Your transaction export is ready.');
});
$('#addBudgetBtn').addEventListener('click', () => showToast('Budget setup can be connected to your backend.'));
$('#mobileMenu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
document.querySelectorAll('.nav-item').forEach(link => link.addEventListener('click', () => $('#sidebar').classList.remove('open')));

renderTransactions();
renderBudgets();
renderChart();
refreshTotals();
