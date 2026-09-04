import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Topbar from '../components/Topbar';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];

function Calendar() {
  const [transactions, setTransactions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [current, setCurrent] = useState(new Date());

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

  const year = current.getFullYear();
  const month = current.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let firstDay = new Date(year, month, 1).getDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDayData = (day) => {
    const income = transactions
      .filter((t) => { const dt = new Date(t.date); return t.type === 'income' && dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === day; })
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => { const dt = new Date(t.date); return t.type === 'expense' && dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === day; })
      .reduce((s, t) => s + t.amount, 0);
    const taskCount = tasks.filter((t) => {
      if (!t.dueDate) return false;
      const dt = new Date(t.dueDate);
      return dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === day;
    }).length;
    return { income, expense, taskCount };
  };

  const today = new Date();
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));

  return (
    <div>
      <Topbar />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {MONTHS[month]} <span className="text-gray-400 font-normal">{year}</span>
        </h1>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-sm font-medium text-gray-400 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((day, i) => {
            if (day === null) return <div key={i}></div>;
            const { income, expense, taskCount } = getDayData(day);
            return (
              <div key={i}
                className={`min-h-24 rounded-xl border p-2 flex flex-col ${isToday(day) ? 'border-orange-400 bg-orange-50' : 'border-gray-100'}`}>
                <span className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-orange-600' : 'text-gray-700'}`}>{day}</span>
                <div className="flex flex-col gap-0.5 text-xs">
                  {income > 0 && <span className="text-green-600">+{income.toLocaleString()} грн</span>}
                  {expense > 0 && <span className="text-orange-500">-{expense.toLocaleString()} грн</span>}
                  {taskCount > 0 && <span className="text-gray-400">{taskCount} задач</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Calendar;
