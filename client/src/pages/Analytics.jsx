import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, CheckCircle, Lightbulb, TrendingUp as TrendUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import ExpenseChart from '../components/ExpenseChart';

function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [tasks, setTasks] = useState([]);

  const token = localStorage.getItem('token');

  useEffect(() => {
    let active = true;
    (async () => {
      const [txRes, taskRes] = await Promise.all([
        fetch('http://localhost:3000/transactions', { headers: { 'Authorization': 'Bearer ' + token } }),
        fetch('http://localhost:3000/tasks', { headers: { 'Authorization': 'Bearer ' + token } }),
      ]);
      const txData = await txRes.json();
      const taskData = await taskRes.json();
      if (active) { setTransactions(txData); setTasks(taskData); }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const tasksDone = tasks.filter((t) => t.status === 'done').length;
  const tasksTotal = tasks.length;
  const donePercent = tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyData = [];
  for (let d = 1; d <= daysInMonth; d++) dailyData.push({ day: d, income: 0, expense: 0 });
  for (const t of transactions) {
    const date = new Date(t.date);
    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      const idx = date.getDate() - 1;
      if (t.type === 'income') dailyData[idx].income += t.amount;
      else dailyData[idx].expense += t.amount;
    }
  }

  const byCategory = {};
  for (const t of transactions.filter((t) => t.type === 'expense')) {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  }
  const topCategory = Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a])[0];
  const topCategoryAmount = topCategory ? byCategory[topCategory] : 0;

  return (
    <div>
      <Topbar />

      <h1 className="text-2xl font-bold text-gray-800 mb-1">Аналітика</h1>
      <p className="text-gray-400 text-sm mb-6">Детальний огляд твоїх фінансів і задач</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-50"
          label="Дохід за місяць" value={`${income.toLocaleString()} грн`}
          trendColor="#40c057" trendData={[10, 12, 9, 15, 13, 18, 20]} />
        <StatCard icon={TrendingDown} iconColor="text-red-500" iconBg="bg-red-50"
          label="Витрати за місяць" value={`${expense.toLocaleString()} грн`}
          trendColor="#fa5252" trendData={[18, 14, 16, 12, 15, 11, 13]} />
        <StatCard icon={Wallet} iconColor="text-orange-500" iconBg="bg-orange-50"
          label="Чистий результат" value={`${balance.toLocaleString()} грн`}
          trendColor="#f76707" trendData={[8, 10, 12, 11, 14, 16, 19]} />
        <StatCard icon={CheckCircle} iconColor="text-purple-500" iconBg="bg-purple-50"
          label="Виконання задач" value={`${donePercent}%`}
          trendColor="#7048e8" trendData={[2, 3, 3, 4, 5, 6, tasksDone]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Дохід і витрати за день</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500"></span>Дохід</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-500"></span>Витрати</span>
            </div>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} barGap={1}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#868e96' }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: '#868e96' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => `${v.toLocaleString()} грн`}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e9ecef', fontSize: 13 }} cursor={{ fill: '#f8f9fa' }} />
                <Bar dataKey="income" fill="#40c057" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" fill="#f76707" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <ExpenseChart transactions={transactions} />
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-orange-500" />
          <h2 className="font-semibold text-gray-700">Інсайти за місяць</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Топ категорія витрат</p>
              <p className="text-sm font-semibold text-gray-800">
                {topCategory ? `${topCategory} — ${topCategoryAmount.toLocaleString()} грн` : 'Немає даних'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <TrendUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Чистий результат</p>
              <p className={`text-sm font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {balance.toLocaleString()} грн
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Виконання задач</p>
              <p className="text-sm font-semibold text-gray-800">{donePercent}% ({tasksDone} з {tasksTotal})</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
