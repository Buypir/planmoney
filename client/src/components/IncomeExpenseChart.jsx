import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MONTHS = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];

function IncomeExpenseChart({ transactions }) {
  const now = new Date();
  const buckets = [];
  const indexByKey = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    indexByKey[key] = buckets.length;
    buckets.push({ month: MONTHS[d.getMonth()], income: 0, expense: 0 });
  }

  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const idx = indexByKey[key];
    if (idx === undefined) continue;
    if (t.type === 'income') buckets[idx].income += t.amount;
    else buckets[idx].expense += t.amount;
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-700">Дохід vs Витрати (за місяць)</h2>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500"></span> Дохід</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-500"></span> Витрати</span>
        </div>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#868e96' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#868e96' }} axisLine={false} tickLine={false} width={45} />
            <Tooltip
              formatter={(value) => `${value.toLocaleString()} грн`}
              contentStyle={{ borderRadius: 12, border: '1px solid #e9ecef', fontSize: 13 }}
              cursor={{ fill: '#f8f9fa' }}
            />
            <Bar dataKey="income" fill="#40c057" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="expense" fill="#f76707" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default IncomeExpenseChart;
