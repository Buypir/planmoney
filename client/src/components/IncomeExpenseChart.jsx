import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useSettings } from '../context/SettingsContext';
import { formatMoney, fromMinor } from '../money';
import { getChartColors } from '../chartTheme';

function IncomeExpenseChart({ transactions }) {
  const { t, isDark, settings } = useSettings();
  const chartColors = getChartColors(isDark);
  const months = t('months_short');
  const now = new Date();
  const buckets = [];
  const indexByKey = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    indexByKey[key] = buckets.length;
    buckets.push({ month: months[d.getMonth()], income: 0, expense: 0 });
  }

  for (const tx of transactions) {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const idx = indexByKey[key];
    if (idx === undefined) continue;
    if (tx.type === 'income') buckets[idx].income += fromMinor(tx.amount);
    else buckets[idx].expense += fromMinor(tx.amount);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('income_expense_chart_title')}</h2>
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500"></span> {t('chart_income')}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500"></span> {t('chart_expense')}</span>
        </div>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: chartColors.tick }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: chartColors.tick }} axisLine={false} tickLine={false} width={45} />
            <Tooltip
              formatter={(value) => formatMoney(value * 100, 'UAH', settings?.language)}
              contentStyle={{ borderRadius: 12, border: `1px solid ${chartColors.tooltipBorder}`, fontSize: 13, backgroundColor: chartColors.tooltipBg, color: chartColors.tooltipText }}
              cursor={{ fill: chartColors.cursor }}
            />
            <Bar dataKey="income" fill="#40c057" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="expense" fill="#fa5252" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default IncomeExpenseChart;
