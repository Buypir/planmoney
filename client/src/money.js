// Валюта рахунку, до якого прив'язана транзакція (UAH, якщо рахунок не вказано)
export function accountCurrency(accountId, accountsById) {
  return accountId ? (accountsById[accountId]?.currency || 'UAH') : 'UAH';
}

// Переводить суму транзакції в базову валюту (UAH) за курсом НБУ
export function toBaseAmount(tx, accountsById, rates) {
  const currency = accountCurrency(tx.accountId, accountsById);
  if (currency === 'UAH' || !rates?.[currency]) return tx.amount;
  return tx.amount * rates[currency];
}

// Список транзакцій з сумами, конвертованими в UAH — для підсумкових обчислень (KPI, графіки)
export function baseTransactions(transactions, accountsById, rates) {
  return transactions.map((tx) => ({ ...tx, amount: toBaseAmount(tx, accountsById, rates) }));
}

// Переводить суму з UAH у вибрану валюту — для відображення підсумкових фігур (напр. "Загальний баланс")
export function convertFromUAH(amountUAH, toCurrency, rates) {
  if (toCurrency === 'UAH' || !rates?.[toCurrency]) return amountUAH;
  return amountUAH / rates[toCurrency];
}

// Залишки в розрізі валют за всіма операціями. Працює з «сирими» транзакціями,
// бо кожна сума тут має лишатись у валюті свого рахунку (операції без рахунку — гривневі).
export function balanceByCurrency(transactions, accountsById) {
  const totals = {};
  const add = (currency, value) => {
    if (!value) return;
    totals[currency] = (totals[currency] || 0) + value;
  };

  for (const tx of transactions) {
    const currency = accountCurrency(tx.accountId, accountsById);
    if (tx.type === 'income') add(currency, tx.amount);
    else if (tx.type === 'expense') add(currency, -tx.amount);
    else if (tx.type === 'transfer') {
      add(currency, -tx.amount);
      add(accountCurrency(tx.toAccountId, accountsById), tx.toAmount ?? tx.amount);
    }
  }
  return totals;
}

// Підсумок різновалютних залишків в одній валюті за курсом НБУ
export function sumInCurrency(byCurrency, toCurrency, rates) {
  const uah = Object.entries(byCurrency).reduce(
    (sum, [currency, value]) => sum + value * (currency === 'UAH' ? 1 : (rates?.[currency] || 1)),
    0,
  );
  return convertFromUAH(uah, toCurrency, rates);
}

const SYMBOLS = { UAH: 'грн', USD: '$', EUR: '€' };
const SYMBOLS_EN = { UAH: 'UAH', USD: '$', EUR: '€' };

export function currencySymbol(currency, language) {
  return (language === 'en' ? SYMBOLS_EN : SYMBOLS)[currency] || currency;
}

// Усі суми в застосунку зберігаються в копійках/центах — так гроші не втрачають
// дробову частину при перерахунках. Ці дві функції — єдиний міст до звичних одиниць.
export const MINOR_UNITS = 100;

export function fromMinor(amount) {
  return (amount || 0) / MINOR_UNITS;
}

// Текст із поля вводу ("12,34" або "12.34") у копійки. null, якщо це не число.
export function toMinor(input) {
  const normalized = String(input).replace(',', '.').trim();
  if (normalized === '' || !/^-?\d*\.?\d*$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * MINOR_UNITS);
}

export function formatMoney(amount, currency, language) {
  const locale = language === 'en' ? 'en-US' : 'uk-UA';
  const formatted = fromMinor(amount).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${formatted} ${currencySymbol(currency, language)}`;
}
