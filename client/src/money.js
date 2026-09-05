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

const SYMBOLS = { UAH: 'грн', USD: '$', EUR: '€' };
const SYMBOLS_EN = { UAH: 'UAH', USD: '$', EUR: '€' };

export function currencySymbol(currency, language) {
  return (language === 'en' ? SYMBOLS_EN : SYMBOLS)[currency] || currency;
}

// Копійки/центи для USD і EUR завжди округлюються до 2 знаків; гривня — без дробової частини
export function formatMoney(amount, currency, language) {
  const decimals = currency === 'UAH' ? 0 : 2;
  const locale = language === 'en' ? 'en-US' : 'uk-UA';
  const formatted = amount.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${formatted} ${currencySymbol(currency, language)}`;
}
