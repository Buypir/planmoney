import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Percent, ArrowLeftRight, Plus, Trash2, Archive, Repeat, Wallet } from 'lucide-react';
import Topbar, { REFRESH_EVENT } from '../components/Topbar';
import StatCard from '../components/StatCard';
import ExpenseChart from '../components/ExpenseChart';
import { useSettings } from '../context/SettingsContext';
import { getPeriodRange, getPreviousPeriodRange, inRange, pctChange, fmtChange, last7DaysTrend } from '../period';
import { baseTransactions, accountCurrency, sumInCurrency, formatMoney, toMinor } from '../money';
import { API_URL } from '../config';

const changeSuffixKey = { today: 'stat_since_yesterday', week: 'stat_vs_prev_week', month: 'stat_vs_prev_month', year: 'stat_vs_prev_year' };
const CURRENCIES = ['UAH', 'USD', 'EUR'];
const intervalLabelKey = { day: 'recurring_day', week: 'recurring_week', month: 'recurring_month', year: 'recurring_year' };
const emptyRule = { amount: '', category: '', type: 'expense', interval: 'month', accountId: '' };

function Finance() {
  const { t, settings, period, rates } = useSettings();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [savedCategories, setSavedCategories] = useState([]);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');

  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountCurrency, setNewAccountCurrency] = useState('UAH');
  const [accountError, setAccountError] = useState('');
  const [recurrings, setRecurrings] = useState([]);
  const [newRule, setNewRule] = useState(emptyRule);
  const [recurringError, setRecurringError] = useState('');

  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: 'Bearer ' + token };
  const jsonHeaders = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

  const loadData = async () => {
    const [txRes, accRes, catRes, recRes] = await Promise.all([
      fetch(API_URL + '/transactions', { headers: authHeaders }),
      fetch(API_URL + '/accounts', { headers: authHeaders }),
      fetch(API_URL + '/categories', { headers: authHeaders }),
      fetch(API_URL + '/recurrings', { headers: authHeaders }),
    ]);
    setTransactions(await txRes.json());
    setAccounts(await accRes.json());
    setSavedCategories(await catRes.json());
    setRecurrings(await recRes.json());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    window.addEventListener(REFRESH_EVENT, loadData);
    return () => window.removeEventListener(REFRESH_EVENT, loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async () => {
    if (!amount) return;
    if (type === 'transfer') {
      if (!accountId || !toAccountId || accountId === toAccountId) return;
    } else if (!category) {
      return;
    }

    await fetch(API_URL + '/transactions', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        amount: toMinor(amount),
        type,
        // Переказ не має категорії: назву показуємо з типу, інакше вона застигла б однією мовою
        category: type === 'transfer' ? '' : category,
        note,
        accountId: accountId ? Number(accountId) : undefined,
        toAccountId: type === 'transfer' ? Number(toAccountId) : undefined,
      }),
    });
    setAmount('');
    setCategory('');
    setNote('');
    setToAccountId('');
    loadData();
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    loadData();
  };

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) return;
    await fetch(API_URL + '/accounts', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name: newAccountName, currency: newAccountCurrency }),
    });
    setNewAccountName('');
    setNewAccountCurrency('UAH');
    loadData();
  };

  // Рахунок із операціями видалити не можна — сервер запропонує заархівувати
  const handleDeleteAccount = async (id) => {
    const res = await fetch(`${API_URL}/accounts/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setAccountError(data.error || t('accounts_delete_failed'));
      return;
    }
    setAccountError('');
    loadData();
  };

  const handleArchiveAccount = async (id, archived) => {
    await fetch(`${API_URL}/accounts/${id}/archive`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ archived }),
    });
    setAccountError('');
    loadData();
  };

  const handleAddRecurring = async () => {
    setRecurringError('');
    const res = await fetch(API_URL + '/recurrings', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        amount: toMinor(newRule.amount),
        type: newRule.type,
        category: newRule.category,
        interval: newRule.interval,
        accountId: newRule.accountId ? Number(newRule.accountId) : undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setRecurringError(data.error || t('recurring_add_failed'));
      return;
    }
    setNewRule(emptyRule);
    loadData();
  };

  const handleToggleRecurring = async (id, active) => {
    await fetch(`${API_URL}/recurrings/${id}/active`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ active }),
    });
    loadData();
  };

  const handleDeleteRecurring = async (id) => {
    await fetch(`${API_URL}/recurrings/${id}`, { method: 'DELETE', headers: authHeaders });
    loadData();
  };

  const accountsById = Object.fromEntries(accounts.map((acc) => [acc.id, acc]));
  const activeAccounts = accounts.filter((acc) => !acc.archived);
  const archivedAccounts = accounts.filter((acc) => acc.archived);
  const baseTx = baseTransactions(transactions, accountsById, rates);

  const range = getPeriodRange(period);
  const prevRange = getPreviousPeriodRange(period);
  const periodTx = transactions.filter((tx) => inRange(tx.date, range));
  const periodBaseTx = baseTx.filter((tx) => inRange(tx.date, range));
  const prevPeriodBaseTx = baseTx.filter((tx) => inRange(tx.date, prevRange));

  const income = periodBaseTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const expense = periodBaseTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const incomePrev = prevPeriodBaseTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const expensePrev = prevPeriodBaseTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const incomeChange = fmtChange(pctChange(income, incomePrev));
  const expenseChange = fmtChange(pctChange(expense, expensePrev));
  const changeSuffix = t(changeSuffixKey[period] || 'stat_since_yesterday');
  const incomeTrend = last7DaysTrend(baseTx, 'income');
  const expenseTrend = last7DaysTrend(baseTx, 'expense');
  const balanceTrend = incomeTrend.map((v, i) => v - expenseTrend[i]);
  const balance = income - expense;
  const savingsPercent = income > 0 ? Math.round((balance / income) * 100) : 0;

  // Баланс рахунку — у його власній валюті (без конвертації)
  const accountBalance = (id) => {
    const inFlow = transactions
      .filter((tx) => tx.accountId === id && tx.type === 'income')
      .reduce((s, tx) => s + tx.amount, 0);
    const outFlow = transactions
      .filter((tx) => tx.accountId === id && tx.type === 'expense')
      .reduce((s, tx) => s + tx.amount, 0);
    const transferOut = transactions
      .filter((tx) => tx.accountId === id && tx.type === 'transfer')
      .reduce((s, tx) => s + tx.amount, 0);
    // На рахунок-отримувач зараховується toAmount — сума вже в його валюті
    const transferIn = transactions
      .filter((tx) => tx.toAccountId === id && tx.type === 'transfer')
      .reduce((s, tx) => s + (tx.toAmount ?? tx.amount), 0);
    return inFlow - outFlow - transferOut + transferIn;
  };

  // Залишки на рахунках у розрізі валют, і вже з них — підсумок у валюті з налаштувань
  const accountsByCurrency = accounts.reduce((totals, acc) => {
    totals[acc.currency] = (totals[acc.currency] || 0) + accountBalance(acc.id);
    return totals;
  }, {});
  const heldCurrencies = Object.keys(accountsByCurrency);
  const displayCurrency = settings?.currency || 'UAH';
  const totalAccountsBalance = sumInCurrency(accountsByCurrency, displayCurrency, rates);

  const accountName = (id) => accounts.find((acc) => acc.id === id)?.name || '—';

  const categories = [...new Set(periodTx.map((tx) => tx.category))];

  const filtered = periodTx
    .filter((tx) => filter === 'all' || tx.type === filter)
    .filter((tx) => categoryFilter === 'all' || tx.category === categoryFilter);

  const tabs = [
    { key: 'all', label: t('finance_tab_all') },
    { key: 'income', label: t('finance_tab_income') },
    { key: 'expense', label: t('finance_tab_expense') },
    { key: 'transfer', label: t('finance_tab_transfer') },
  ];

  const typeIcon = {
    income: <TrendingUp className="w-4 h-4 text-green-600" />,
    expense: <TrendingDown className="w-4 h-4 text-red-500" />,
    transfer: <ArrowLeftRight className="w-4 h-4 text-accent-500" />,
  };
  const typeBg = {
    income: 'bg-green-50 dark:bg-green-500/20',
    expense: 'bg-red-50 dark:bg-red-500/20',
    transfer: 'bg-accent-50 dark:bg-accent-500/20',
  };
  const typeAmountColor = {
    income: 'text-green-600',
    expense: 'text-red-500',
    transfer: 'text-accent-600',
  };
  const typeSign = { income: '+', expense: '-', transfer: '' };

  return (
    <div>
      <Topbar />

      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{t('finance_title')}</h1>
      <p className="text-gray-400 text-sm mb-6">{t('finance_subtitle')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-50 dark:bg-green-500/20"
          label={t('finance_income')} value={formatMoney(income, 'UAH', settings?.language)}
          change={incomeChange} changeSuffix={changeSuffix} trendColor="#40c057" trendData={incomeTrend} />
        <StatCard icon={TrendingDown} iconColor="text-red-500" iconBg="bg-red-50 dark:bg-red-500/20"
          label={t('finance_expense')} value={formatMoney(expense, 'UAH', settings?.language)}
          change={expenseChange} changeSuffix={changeSuffix} higherIsBetter={false} trendColor="#fa5252" trendData={expenseTrend} />
        <StatCard icon={PiggyBank} iconColor="text-accent-500" iconBg="bg-accent-50 dark:bg-accent-500/20"
          label={t('finance_balance')} value={formatMoney(balance, 'UAH', settings?.language)}
          trendColor="#f76707" trendData={balanceTrend} />
        <StatCard icon={Percent} iconColor="text-purple-500" iconBg="bg-purple-50 dark:bg-purple-500/20"
          label={t('finance_savings')} value={`${savingsPercent}%`}
          caption={t('finance_savings_caption')} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('finance_add_title')}</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('finance_amount_label')}</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 w-32" placeholder="1000" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('finance_type_label')}</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2">
              <option value="expense">{t('finance_type_expense')}</option>
              <option value="income">{t('finance_type_income')}</option>
              <option value="transfer">{t('finance_type_transfer')}</option>
            </select>
          </div>
          {type !== 'transfer' && (
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('finance_category_label')}</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} list="finance-category-options"
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2" placeholder={t('finance_category_placeholder')} />
              <datalist id="finance-category-options">
                {savedCategories.filter((c) => c.type === type).map((c) => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('finance_account_label')}</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2">
              <option value="">—</option>
              {activeAccounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
            </select>
          </div>
          {type === 'transfer' && (
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('finance_to_account_label')}</label>
              <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2">
                <option value="">—</option>
                {activeAccounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('finance_note_label')}</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2" placeholder={t('finance_note_placeholder')} />
          </div>
          <button onClick={handleAdd}
            className="flex items-center gap-2 bg-accent-500 text-[var(--accent-ink)] rounded-lg px-5 py-2 font-semibold hover:bg-accent-600">
            <Plus className="w-4 h-4" /> {t('finance_add_button')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('finance_transactions_title')}</h2>
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 rounded-full p-1 flex-wrap">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filter === tab.key ? 'bg-accent-500 text-[var(--accent-ink)]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm">
              <option value="all">{t('finance_category_filter_all')}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="text-gray-400 text-sm py-4">{t('finance_no_transactions')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    <th className="pb-2 pr-3 font-medium">{t('finance_col_date')}</th>
                    <th className="pb-2 pr-3 font-medium">{t('finance_col_category')}</th>
                    <th className="pb-2 pr-3 font-medium">{t('finance_col_note')}</th>
                    <th className="pb-2 pr-3 font-medium">{t('finance_col_account')}</th>
                    <th className="pb-2 pr-3 font-medium text-right">{t('finance_col_amount')}</th>
                    <th className="pb-2 pr-3 font-medium">{t('finance_col_status')}</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-50 dark:border-gray-700 last:border-0 group">
                      <td className="py-3 pr-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString(settings?.language === 'en' ? 'en-US' : 'uk-UA')}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${typeBg[tx.type]}`}>
                            {typeIcon[tx.type]}
                          </div>
                          <span className="text-gray-800 dark:text-gray-100 font-medium">
                            {tx.type === 'transfer' ? t('finance_type_transfer') : tx.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-gray-400">{tx.note || '—'}</td>
                      <td className="py-3 pr-3 text-gray-600 dark:text-gray-300">
                        {tx.type === 'transfer'
                          ? `${accountName(tx.accountId)} → ${accountName(tx.toAccountId)}`
                          : accountName(tx.accountId)}
                      </td>
                      <td className={`py-3 pr-3 text-right font-semibold whitespace-nowrap ${typeAmountColor[tx.type]}`}>
                        {typeSign[tx.type]}{formatMoney(tx.amount, accountCurrency(tx.accountId, accountsById), settings?.language)}
                        {tx.type === 'transfer' && tx.toAmount != null && tx.toAmount !== tx.amount && (
                          <span className="text-gray-400 font-normal">
                            {' → '}{formatMoney(tx.toAmount, accountCurrency(tx.toAccountId, accountsById), settings?.language)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-green-50 dark:bg-green-500/20 text-green-600">
                          {t('status_completed')}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleDelete(tx.id)}
                          className="text-gray-300 hover:text-red-500 row-action text-lg">
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <ExpenseChart transactions={baseTx} />

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('accounts_title')}</h2>
            </div>

            {accounts.length === 0 ? (
              <p className="text-gray-400 text-sm mb-3">{t('accounts_none')}</p>
            ) : (
              <div className="flex flex-col gap-2 mb-3">
                {activeAccounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between group">
                    <span className="text-sm text-gray-700 dark:text-gray-200">{acc.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {formatMoney(accountBalance(acc.id), acc.currency, settings?.language)}
                      </span>
                      <button onClick={() => handleArchiveAccount(acc.id, true)} title={t('accounts_archive_tooltip')}
                        className="text-gray-300 hover:text-accent-600 row-action">
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteAccount(acc.id)} title={t('accounts_delete_tooltip')}
                        className="text-gray-300 hover:text-red-500 row-action">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {archivedAccounts.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400">{t('accounts_archived_title')}</span>
                    {archivedAccounts.map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between group">
                        <span className="text-sm text-gray-400">{acc.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            {formatMoney(accountBalance(acc.id), acc.currency, settings?.language)}
                          </span>
                          <button onClick={() => handleArchiveAccount(acc.id, false)}
                            className="text-xs text-accent-600 hover:text-accent-700 row-action">
                            {t('accounts_restore')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Розбивка за валютами — показуємо лише коли валют справді кілька */}
                {heldCurrencies.length > 1 && (
                  <div className="flex flex-col gap-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                    {heldCurrencies.map((currency) => (
                      <div key={currency} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{currency}</span>
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          {formatMoney(accountsByCurrency[currency], currency, settings?.language)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('accounts_total_balance')}</span>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                    {formatMoney(totalAccountsBalance, displayCurrency, settings?.language)}
                  </span>
                </div>
              </div>
            )}

            {accountError && (
              <p className="text-xs text-red-500 mb-2">{accountError}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder={t('accounts_add_placeholder')}
                className="flex-1 min-w-32 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
              />
              <select value={newAccountCurrency} onChange={(e) => setNewAccountCurrency(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-2 text-sm shrink-0">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={handleAddAccount}
                className="text-xs text-accent-600 font-medium hover:text-accent-700 shrink-0 px-2">
                {t('accounts_add_button')}
              </button>
            </div>
          </div>

          {/* Регулярні операції */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Repeat className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('recurring_title')}</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4">{t('recurring_hint')}</p>

            {recurrings.length === 0 ? (
              <p className="text-gray-400 text-sm mb-3">{t('recurring_none')}</p>
            ) : (
              <div className="flex flex-col gap-2 mb-3">
                {recurrings.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between group gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${rule.active ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 line-through'}`}>
                        {rule.category}
                      </p>
                      <p className="text-xs text-gray-400">
                        {t(intervalLabelKey[rule.interval])} · {t('recurring_next', new Date(rule.nextRun).toLocaleDateString(settings?.language === 'en' ? 'en-US' : 'uk-UA'))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-medium ${rule.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {rule.type === 'income' ? '+' : '-'}{formatMoney(rule.amount, accountCurrency(rule.accountId, accountsById), settings?.language)}
                      </span>
                      <button onClick={() => handleToggleRecurring(rule.id, !rule.active)}
                        title={rule.active ? t('recurring_pause') : t('recurring_resume')}
                        className="text-xs text-accent-600 hover:text-accent-700 row-action">
                        {rule.active ? t('recurring_pause') : t('recurring_resume')}
                      </button>
                      <button onClick={() => handleDeleteRecurring(rule.id)}
                        className="text-gray-300 hover:text-red-500 row-action">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <input type="number" value={newRule.amount} onChange={(e) => setNewRule({ ...newRule, amount: e.target.value })}
                placeholder={t('finance_amount_label')}
                className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm" />
              <input type="text" value={newRule.category} onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                placeholder={t('finance_category_label')}
                className="flex-1 min-w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm" />
              <select value={newRule.type} onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-2 text-sm">
                <option value="expense">{t('finance_type_expense')}</option>
                <option value="income">{t('finance_type_income')}</option>
              </select>
              <select value={newRule.interval} onChange={(e) => setNewRule({ ...newRule, interval: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-2 text-sm">
                {Object.entries(intervalLabelKey).map(([key, labelKey]) => (
                  <option key={key} value={key}>{t(labelKey)}</option>
                ))}
              </select>
              <select value={newRule.accountId} onChange={(e) => setNewRule({ ...newRule, accountId: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-2 text-sm">
                <option value="">—</option>
                {activeAccounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
              <button onClick={handleAddRecurring}
                className="text-xs text-accent-600 font-medium hover:text-accent-700 px-2">
                {t('recurring_add')}
              </button>
            </div>
            {recurringError && <p className="text-xs text-red-500 mt-2">{recurringError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Finance;
