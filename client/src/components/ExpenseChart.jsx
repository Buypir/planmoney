import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useSettings } from '../context/SettingsContext';

const COLORS = ['#e8590c', '#f59f00', '#f76707', '#e64980', '#7048e8', '#495057', '#adb5bd'];

function ExpenseChart({ transactions }) {
  const { t } = useSettings();
  const expenses = transactions.filter((tx) => tx.type === 'expense');

  const byCategory = {};
  for (const tx of expenses) {
    byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
  }

  const data = Object.keys(byCategory)
    .map((name) => ({ name, value: byCategory[name] }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('expense_chart_title')}</h2>

      {data.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('expense_chart_none')}</p>
      ) : (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative" style={{ width: 160, height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={2}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{total.toLocaleString()}</span>
              <span className="text-xs text-gray-400">{t('expense_chart_total_suffix')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-w-40">
            {data.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="text-gray-600 dark:text-gray-300">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-800 dark:text-gray-100 font-medium">{entry.value.toLocaleString()} {t('currency_suffix')}</span>
                  <span className="text-gray-400 text-xs">{Math.round((entry.value / total) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseChart;
