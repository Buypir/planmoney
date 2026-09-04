import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, CheckCircle, ListChecks } from 'lucide-react';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import SavingsGoals from '../components/SavingsGoals';
import ExpenseChart from '../components/ExpenseChart';
import IncomeExpenseChart from '../components/IncomeExpenseChart';

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [tasks, setTasks] = useState([]);

  const token = localStorage.getItem('token');

  const loadData = async () => {
    const [txRes, taskRes] = await Promise.all([
      fetch('http://localhost:3000/transactions', { headers: { 'Authorization': 'Bearer ' + token } }),
      fetch('http://localhost:3000/tasks', { headers: { 'Authorization': 'Bearer ' + token } }),
    ]);
    setTransactions(await txRes.json());
    setTasks(await taskRes.json());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const tasksDone = tasks.filter((t) => t.status === 'done').length;
  const tasksTotal = tasks.length;

  return (
    <div>
      <Topbar />

      <h1 className="text-2xl font-bold text-gray-800">Добрий вечір, Богдан 👋</h1>
      <p className="text-gray-400 text-sm mb-6">Ось твій фінансовий огляд на сьогодні</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-50"
          label="Дохід" value={`${income.toLocaleString()} грн`}
          change="+12%" trendColor="#40c057" trendData={[10, 12, 9, 15, 13, 18, 20]} />
        <StatCard icon={TrendingDown} iconColor="text-red-500" iconBg="bg-red-50"
          label="Витрати" value={`${expense.toLocaleString()} грн`}
          change="-8%" trendColor="#fa5252" trendData={[18, 14, 16, 12, 15, 11, 13]} />
        <StatCard icon={Wallet} iconColor="text-orange-500" iconBg="bg-orange-50"
          label="Баланс" value={`${balance.toLocaleString()} грн`}
          change="+18%" trendColor="#f76707" trendData={[8, 10, 12, 11, 14, 16, 19]} />
        <StatCard icon={CheckCircle} iconColor="text-purple-500" iconBg="bg-purple-50"
          label="Виконано задач" value={`${tasksDone} / ${tasksTotal}`}
          trendColor="#7048e8" trendData={[2, 3, 3, 4, 5, 6, tasksDone]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-5 h-5 text-gray-700" />
            <h2 className="font-semibold text-gray-700">Мої задачі на сьогодні</h2>
          </div>
          {tasks.length === 0 ? (
            <p className="text-gray-400 text-sm">Задач ще немає</p>
          ) : (
            <div className="flex flex-col gap-3">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded border ${task.status === 'done' ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}></div>
                  <span className={`text-sm ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-gray-700" />
            <h2 className="font-semibold text-gray-700">Фінанси за сьогодні</h2>
          </div>
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-sm">Операцій ще немає</p>
          ) : (
            <div className="flex flex-col gap-3">
              {transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{t.category}</span>
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-orange-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} грн
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <SavingsGoals onUpdate={loadData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ExpenseChart transactions={transactions} />
        <IncomeExpenseChart transactions={transactions} />
      </div>
    </div>
  );
}

export default Dashboard;
