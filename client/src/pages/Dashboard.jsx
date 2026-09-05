import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, CheckCircle, ListChecks } from 'lucide-react';
import Topbar, { REFRESH_EVENT } from '../components/Topbar';
import StatCard from '../components/StatCard';
import SavingsGoals from '../components/SavingsGoals';
import ExpenseChart from '../components/ExpenseChart';
import IncomeExpenseChart from '../components/IncomeExpenseChart';
import { useSettings } from '../context/SettingsContext';
import { getPeriodRange, getPreviousPeriodRange, inRange, pctChange, fmtChange, last7DaysTrend } from '../period';
import { baseTransactions, accountCurrency, balanceByCurrency, sumInCurrency, formatMoney } from '../money';
import { API_URL } from '../config';

const changeSuffixKey = { today: 'stat_since_yesterday', week: 'stat_vs_prev_week', month: 'stat_vs_prev_month', year: 'stat_vs_prev_year' };

function Dashboard() {
  const { t, period, settings, rates } = useSettings();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);

  const token = localStorage.getItem('token');

  const loadData = async () => {
    const [txRes, accRes, taskRes, meRes] = await Promise.all([
      fetch(API_URL + '/transactions', { headers: { 'Authorization': 'Bearer ' + token } }),
      fetch(API_URL + '/accounts', { headers: { 'Authorization': 'Bearer ' + token } }),
      fetch(API_URL + '/tasks', { headers: { 'Authorization': 'Bearer ' + token } }),
      fetch(API_URL + '/auth/me', { headers: { 'Authorization': 'Bearer ' + token } }),
    ]);
    setTransactions(await txRes.json());
    setAccounts(await accRes.json());
    setTasks(await taskRes.json());
    setUser(await meRes.json());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    window.addEventListener(REFRESH_EVENT, loadData);
    return () => window.removeEventListener(REFRESH_EVENT, loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accountsById = Object.fromEntries(accounts.map((acc) => [acc.id, acc]));
  const baseTx = baseTransactions(transactions, accountsById, rates);

  const displayCurrency = settings?.currency || 'UAH';
  // Залишок рахуємо в розрізі валют, а вже тоді зводимо в одну — інакше
  // різні валюти складались би як однакові числа
  const byCurrency = balanceByCurrency(transactions, accountsById);
  const balance = sumInCurrency(byCurrency, displayCurrency, rates);
  const heldCurrencies = Object.keys(byCurrency);
  const balanceBreakdown = heldCurrencies.length > 1
    ? heldCurrencies.map((c) => formatMoney(byCurrency[c], c, settings?.language)).join(' · ')
    : t('dashboard_balance_caption');
  const tasksDone = tasks.filter((task) => task.status === 'done').length;
  const tasksTotal = tasks.length;

  const now = new Date();
  const todayLabel = t('today_date_string', now.getDate(), t('months_genitive')[now.getMonth()], now.getFullYear(), t('weekdays_full')[now.getDay()]);

  const range = getPeriodRange(period, now);
  const prevRange = getPreviousPeriodRange(period, now);
  const curTx = transactions.filter((tx) => inRange(tx.date, range));
  const curBaseTx = baseTx.filter((tx) => inRange(tx.date, range));
  const prevBaseTx = baseTx.filter((tx) => inRange(tx.date, prevRange));

  const income = curBaseTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const expense = curBaseTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const incomePrev = prevBaseTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const expensePrev = prevBaseTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const incomeChange = fmtChange(pctChange(income, incomePrev));
  const expenseChange = fmtChange(pctChange(expense, expensePrev));
  const changeSuffix = t(changeSuffixKey[period] || 'stat_since_yesterday');

  const incomeTrend = last7DaysTrend(baseTx, 'income');
  const expenseTrend = last7DaysTrend(baseTx, 'expense');
  const balanceTrend = incomeTrend.map((v, i) => v - expenseTrend[i]);
  const tasksTrend = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days.map((day) => tasks.filter((task) => new Date(task.createdAt) <= day).length);
  })();

  // Спершу невиконані з найближчим дедлайном — інакше в блоці опинялись
  // просто перші п'ять задач у довільному порядку
  const upcomingTasks = [...tasks]
    .sort((a, b) => {
      if ((a.status === 'done') !== (b.status === 'done')) return a.status === 'done' ? 1 : -1;
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    })
    .slice(0, 5);

  const todayIncome = curTx.filter((tx) => tx.type === 'income').slice(0, 5);
  const todayExpense = curTx.filter((tx) => tx.type === 'expense').slice(0, 5);
  const periodLabelKey = { today: 'topbar_today', week: 'topbar_week', month: 'topbar_month', year: 'topbar_year' };

  const priorityBadge = {
    low: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    medium: 'bg-accent-50 dark:bg-accent-500/20 text-accent-600',
    high: 'bg-red-50 dark:bg-red-500/20 text-red-600',
  };
  const priorityLabel = { low: t('priority_low'), medium: t('priority_medium'), high: t('priority_high') };

  return (
    <div>
      <Topbar />

      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('dashboard_greeting', user?.name || t('profile_no_name'))}</h1>
      <p className="text-gray-400 text-sm mb-6">{todayLabel}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-50 dark:bg-green-500/20"
          label={t('dashboard_income')} value={`${income.toLocaleString()} ${t('currency_suffix')}`}
          change={incomeChange} changeSuffix={changeSuffix} trendColor="#40c057" trendData={incomeTrend} />
        <StatCard icon={TrendingDown} iconColor="text-red-500" iconBg="bg-red-50 dark:bg-red-500/20"
          label={t('dashboard_expense')} value={`${expense.toLocaleString()} ${t('currency_suffix')}`}
          change={expenseChange} changeSuffix={changeSuffix} trendColor="#fa5252" trendData={expenseTrend} />
        <StatCard icon={Wallet} iconColor="text-accent-500" iconBg="bg-accent-50 dark:bg-accent-500/20"
          label={t('dashboard_balance')} value={formatMoney(balance, displayCurrency, settings?.language)}
          caption={balanceBreakdown} trendColor="#f76707" trendData={balanceTrend} />
        <StatCard icon={CheckCircle} iconColor="text-purple-500" iconBg="bg-purple-50 dark:bg-purple-500/20"
          label={t('dashboard_tasks_completed')} value={`${tasksDone} / ${tasksTotal}`}
          trendColor="#7048e8" trendData={tasksTrend} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('dashboard_my_tasks_title')}</h2>
          </div>
          {tasks.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('dashboard_no_tasks')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded border shrink-0 ${task.status === 'done' ? 'bg-accent-500 border-accent-500' : 'border-gray-300 dark:border-gray-600'}`}></div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                      {task.title}
                    </span>
                    {task.category && <p className="text-xs text-gray-400">{task.category}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${priorityBadge[task.priority]}`}>{priorityLabel[task.priority]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('dashboard_finance_period_title', t(periodLabelKey[period] || 'topbar_today'))}</h2>
          </div>
          {curTx.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('dashboard_no_transactions')}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {todayIncome.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-600 mb-2">{t('dashboard_income_group')}</p>
                  <div className="flex flex-col gap-2">
                    {todayIncome.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-500/20 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-200">{tx.category}</span>
                        </div>
                        <span className="text-sm font-semibold text-green-600">+{formatMoney(tx.amount, accountCurrency(tx.accountId, accountsById), settings?.language)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {todayExpense.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-500 mb-2">{t('dashboard_expense_group')}</p>
                  <div className="flex flex-col gap-2">
                    {todayExpense.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-200">{tx.category}</span>
                        </div>
                        <span className="text-sm font-semibold text-red-500">-{formatMoney(tx.amount, accountCurrency(tx.accountId, accountsById), settings?.language)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <SavingsGoals onUpdate={loadData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ExpenseChart transactions={baseTx} />
        <IncomeExpenseChart transactions={baseTx} />
      </div>
    </div>
  );
}

export default Dashboard;
