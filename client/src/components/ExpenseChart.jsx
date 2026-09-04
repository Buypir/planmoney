import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#e8590c', '#f59f00', '#f76707', '#e64980', '#7048e8', '#495057', '#adb5bd'];

function ExpenseChart({ transactions }) {
  const expenses = transactions.filter((t) => t.type === 'expense');

  const byCategory = {};
  for (const t of expenses) {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  }

  const data = Object.keys(byCategory)
    .map((name) => ({ name, value: byCategory[name] }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h2 className="font-semibold text-gray-700 mb-4">Витрати за категоріями</h2>

      {data.length === 0 ? (
        <p className="text-gray-400 text-sm">Витрат ще немає</p>
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
              <span className="text-lg font-bold text-gray-800">{total.toLocaleString()}</span>
              <span className="text-xs text-gray-400">грн всього</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-w-40">
            {data.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="text-gray-600">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-800 font-medium">{entry.value.toLocaleString()} грн</span>
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
