import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, CheckCircle, Lightbulb, TrendingUp as TrendUp, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import Topbar, { REFRESH_EVENT } from '../components/Topbar';
import StatCard from '../components/StatCard';
import ExpenseChart from '../components/ExpenseChart';
import { useSettings } from '../context/SettingsContext';
import { getChartColors } from '../chartTheme';
import { getPeriodRange, getPreviousPeriodRange, inRange, pctChange, fmtChange } from '../period';
import { baseTransactions } from '../money';
import { API_URL } from '../config';

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const changeSuffixKey = { today: 'stat_since_yesterday', week: 'stat_vs_prev_week', month: 'analytics_vs_last_month', year: 'stat_vs_prev_year' };
const periodLabelKey = { today: 'topbar_today', week: 'topbar_week', month: 'topbar_month', year: 'topbar_year' };
const dailyChartTitleKey = { today: 'analytics_hourly_chart_title', week: 'analytics_daily_chart_title', month: 'analytics_daily_chart_title', year: 'analytics_monthly_chart_title' };

function buildPeriodBuckets(range, period, transactions, monthsShort) {
  if (period === 'today') {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ day: h, income: 0, expense: 0 }));
    for (const tx of transactions) {
      if (!inRange(tx.date, range)) continue;
      const idx = new Date(tx.date).getHours();
      if (tx.type === 'income') buckets[idx].income += tx.amount;
      else if (tx.type === 'expense') buckets[idx].expense += tx.amount;
    }
    return buckets;
  }
  if (period === 'year') {
    const buckets = Array.from({ length: 12 }, (_, m) => ({ day: monthsShort[m], income: 0, expense: 0 }));
    for (const tx of transactions) {
      if (!inRange(tx.date, range)) continue;
      const idx = new Date(tx.date).getMonth();
      if (tx.type === 'income') buckets[idx].income += tx.amount;
      else if (tx.type === 'expense') buckets[idx].expense += tx.amount;
    }
    return buckets;
  }
  const days = [];
  const cursor = new Date(range.start);
  while (cursor < range.end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  const buckets = days.map((d) => ({ day: d.getDate(), date: d, income: 0, expense: 0 }));
  for (const tx of transactions) {
    if (!inRange(tx.date, range)) continue;
    const d = new Date(tx.date);
    const idx = days.findIndex((day) => day.getFullYear() === d.getFullYear() && day.getMonth() === d.getMonth() && day.getDate() === d.getDate());
    if (idx === -1) continue;
    if (tx.type === 'income') buckets[idx].income += tx.amount;
    else if (tx.type === 'expense') buckets[idx].expense += tx.amount;
  }
  return buckets;
}

function Analytics() {
  const { t, settings, isDark, period, rates } = useSettings();
  const chartColors = getChartColors(isDark);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [tasks, setTasks] = useState([]);

  const token = localStorage.getItem('token');

  const loadData = async () => {
    const [txRes, accRes, taskRes] = await Promise.all([
      fetch(API_URL + '/transactions', { headers: { 'Authorization': 'Bearer ' + token } }),
      fetch(API_URL + '/accounts', { headers: { 'Authorization': 'Bearer ' + token } }),
      fetch(API_URL + '/tasks', { headers: { 'Authorization': 'Bearer ' + token } }),
    ]);
    setTransactions(await txRes.json());
    setAccounts(await accRes.json());
    setTasks(await taskRes.json());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    window.addEventListener(REFRESH_EVENT, loadData);
    return () => window.removeEventListener(REFRESH_EVENT, loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locale = settings?.language === 'en' ? 'en-US' : 'uk-UA';
  const now = new Date();

  const accountsById = Object.fromEntries(accounts.map((acc) => [acc.id, acc]));
  const baseTx = baseTransactions(transactions, accountsById, rates);

  const sumByType = (txs, type) => txs.filter((tx) => tx.type === type).reduce((s, tx) => s + tx.amount, 0);
  const txInMonth = (y, m) => baseTx.filter((tx) => { const d = new Date(tx.date); return d.getFullYear() === y && d.getMonth() === m; });

  const range = getPeriodRange(period, now);
  const prevRange = getPreviousPeriodRange(period, now);
  const curTx = baseTx.filter((tx) => inRange(tx.date, range));
  const prevTx = baseTx.filter((tx) => inRange(tx.date, prevRange));

  const income = sumByType(curTx, 'income');
  const expense = sumByType(curTx, 'expense');
  const balance = income - expense;
  const prevIncome = sumByType(prevTx, 'income');
  const prevExpense = sumByType(prevTx, 'expense');
  const prevBalance = prevIncome - prevExpense;

  const incomeChange = pctChange(income, prevIncome);
  const expenseChange = pctChange(expense, prevExpense);
  const balanceChange = pctChange(balance, prevBalance);
  const changeSuffix = t(changeSuffixKey[period] || 'analytics_vs_last_month');
  const periodLabel = t(periodLabelKey[period] || 'topbar_month');

  const tasksDone = tasks.filter((task) => task.status === 'done').length;
  const tasksTotal = tasks.length;
  const donePercent = tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  const monthsShort = t('months_short');
  const dailyData = buildPeriodBuckets(range, period, baseTx, monthsShort);

  const bestIncomeDay = (period === 'week' || period === 'month')
    ? dailyData.reduce((best, d) => (d.income > (best?.income || 0) ? d : best), null)
    : null;

  const byCategory = {};
  for (const tx of curTx.filter((tx) => tx.type === 'expense')) {
    byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
  }
  const topCategory = Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a])[0];
  const topCategoryAmount = topCategory ? byCategory[topCategory] : 0;

  const monthlyComparison = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const txs = txInMonth(d.getFullYear(), d.getMonth());
    const inc = sumByType(txs, 'income');
    const exp = sumByType(txs, 'expense');
    monthlyComparison.push({ month: monthsShort[d.getMonth()], income: inc, expense: exp, net: inc - exp });
  }

  const weeklyTasks = [];
  const thisWeekStart = startOfWeek(now);
  for (let i = 4; i >= 0; i--) {
    const weekStart = new Date(thisWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekTasks = tasks.filter((task) => {
      if (!task.dueDate) return false;
      const d = new Date(task.dueDate);
      return d >= weekStart && d < weekEnd;
    });
    weeklyTasks.push({
      week: weekStart.toLocaleDateString(locale, { day: 'numeric', month: 'numeric' }),
      done: weekTasks.filter((task) => task.status === 'done').length,
      total: weekTasks.length,
    });
  }
  const lastWeek = weeklyTasks[weeklyTasks.length - 1];
  const lastWeekPercent = lastWeek.total ? Math.round((lastWeek.done / lastWeek.total) * 100) : 0;

  return (
    <div>
      <Topbar />

      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{t('analytics_title')}</h1>
      <p className="text-gray-400 text-sm mb-6">{t('analytics_subtitle')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-50 dark:bg-green-500/20"
          label={t('analytics_income_period', periodLabel)} value={`${income.toLocaleString()} ${t('currency_suffix')}`}
          change={fmtChange(incomeChange)} changeSuffix={changeSuffix} />
        <StatCard icon={TrendingDown} iconColor="text-red-500" iconBg="bg-red-50 dark:bg-red-500/20"
          label={t('analytics_expense_period', periodLabel)} value={`${expense.toLocaleString()} ${t('currency_suffix')}`}
          change={fmtChange(expenseChange)} changeSuffix={changeSuffix} />
        <StatCard icon={Wallet} iconColor="text-accent-500" iconBg="bg-accent-50 dark:bg-accent-500/20"
          label={t('analytics_net_result')} value={`${balance.toLocaleString()} ${t('currency_suffix')}`}
          change={fmtChange(balanceChange)} changeSuffix={changeSuffix} />
        <StatCard icon={CheckCircle} iconColor="text-purple-500" iconBg="bg-purple-50 dark:bg-purple-500/20"
          label={t('analytics_tasks_progress')} value={`${donePercent}%`}
          caption={t('analytics_tasks_progress_detail', tasksDone, tasksTotal)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t(dailyChartTitleKey[period] || 'analytics_daily_chart_title')}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500"></span>{t('chart_income')}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500"></span>{t('chart_expense')}</span>
            </div>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} barGap={1}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: chartColors.tick }} axisLine={false} tickLine={false} interval={period === 'week' || period === 'year' ? 0 : 4} />
                <YAxis tick={{ fontSize: 11, fill: chartColors.tick }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => `${v.toLocaleString()} ${t('currency_suffix')}`}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${chartColors.tooltipBorder}`, fontSize: 13, backgroundColor: chartColors.tooltipBg, color: chartColors.tooltipText }} cursor={{ fill: chartColors.cursor }} />
                <Bar dataKey="income" fill="#40c057" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" fill="#fa5252" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <ExpenseChart transactions={curTx} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('analytics_months_comparison_title')}</h2>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparison} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartColors.tick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chartColors.tick }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => `${v.toLocaleString()} ${t('currency_suffix')}`}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${chartColors.tooltipBorder}`, fontSize: 13, backgroundColor: chartColors.tooltipBg, color: chartColors.tooltipText }} cursor={{ fill: chartColors.cursor }} />
                <Legend wrapperStyle={{ fontSize: 12, color: chartColors.tick }} formatter={(v) => (v === 'income' ? t('chart_income') : v === 'expense' ? t('chart_expense') : t('chart_net_result'))} />
                <Bar dataKey="income" fill="#40c057" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" fill="#fa5252" radius={[2, 2, 0, 0]} />
                <Bar dataKey="net" fill="#7048e8" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('analytics_weekly_tasks_title')}</h2>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTasks} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: chartColors.tick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chartColors.tick }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${chartColors.tooltipBorder}`, fontSize: 13, backgroundColor: chartColors.tooltipBg, color: chartColors.tooltipText }} cursor={{ fill: chartColors.cursor }} />
                <Legend wrapperStyle={{ fontSize: 12, color: chartColors.tick }} formatter={(v) => (v === 'done' ? t('chart_done') : t('chart_total'))} />
                <Bar dataKey="total" fill={chartColors.grid} radius={[2, 2, 0, 0]} />
                <Bar dataKey="done" fill="#40c057" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-400 mt-2">{t('analytics_week_tasks_caption', lastWeekPercent)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-accent-500" />
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('analytics_insights_period', periodLabel)}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{t('analytics_top_expense_category')}</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {topCategory ? `${topCategory} — ${topCategoryAmount.toLocaleString()} ${t('currency_suffix')}` : t('analytics_no_data')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{t('analytics_best_income_day')}</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {bestIncomeDay && bestIncomeDay.income > 0
                  ? bestIncomeDay.date.toLocaleDateString(locale, { day: 'numeric', month: 'long' })
                  : t('analytics_no_data')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
            <div className="w-9 h-9 rounded-full bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center shrink-0">
              <TrendUp className="w-4 h-4 text-accent-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{t('analytics_net_result_trend')}</p>
              <p className={`text-sm font-semibold ${balanceChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {fmtChange(balanceChange)}
              </p>
              <p className="text-xs text-gray-400">{balanceChange >= 0 ? t('analytics_financial_improvement') : t('analytics_financial_decline')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
            <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{t('analytics_tasks_progress')}</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{donePercent}% {t('analytics_tasks_progress_detail', tasksDone, tasksTotal)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
