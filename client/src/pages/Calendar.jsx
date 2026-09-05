import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, CheckCircle } from 'lucide-react';
import Topbar, { REFRESH_EVENT } from '../components/Topbar';
import StatCard from '../components/StatCard';
import { useSettings } from '../context/SettingsContext';

function Calendar() {
  const { t, settings } = useSettings();
  const navigate = useNavigate();
  const WEEKDAYS = t('weekdays_short');
  const MONTHS = t('months_full');
  const [transactions, setTransactions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: 'Bearer ' + token };

  const loadData = async () => {
    const [txRes, taskRes] = await Promise.all([
      fetch('http://localhost:3000/transactions', { headers: authHeaders }),
      fetch('http://localhost:3000/tasks', { headers: authHeaders }),
    ]);
    setTransactions(await txRes.json());
    setTasks(await taskRes.json());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    window.addEventListener(REFRESH_EVENT, loadData);
    return () => window.removeEventListener(REFRESH_EVENT, loadData);
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
      .filter((tx) => { const dt = new Date(tx.date); return tx.type === 'income' && dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === day; })
      .reduce((s, tx) => s + tx.amount, 0);
    const expense = transactions
      .filter((tx) => { const dt = new Date(tx.date); return tx.type === 'expense' && dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === day; })
      .reduce((s, tx) => s + tx.amount, 0);
    const taskCount = tasks.filter((task) => {
      if (!task.dueDate) return false;
      const dt = new Date(task.dueDate);
      return dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === day;
    }).length;
    return { income, expense, taskCount };
  };

  const today = new Date();
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const prevMonth = () => { setCurrent(new Date(year, month - 1, 1)); setSelectedDay(null); };
  const nextMonth = () => { setCurrent(new Date(year, month + 1, 1)); setSelectedDay(null); };

  const monthTransactions = transactions.filter((tx) => {
    const dt = new Date(tx.date);
    return dt.getFullYear() === year && dt.getMonth() === month;
  });
  const monthIncome = monthTransactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const monthExpense = monthTransactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const monthBalance = monthIncome - monthExpense;
  const monthTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const dt = new Date(task.dueDate);
    return dt.getFullYear() === year && dt.getMonth() === month;
  });
  const monthTasksDone = monthTasks.filter((task) => task.status === 'done').length;

  const dayTransactions = selectedDay
    ? transactions.filter((tx) => {
        const dt = new Date(tx.date);
        return dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === selectedDay;
      })
    : [];
  const dayTasks = selectedDay
    ? tasks.filter((task) => {
        if (!task.dueDate) return false;
        const dt = new Date(task.dueDate);
        return dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === selectedDay;
      })
    : [];
  const dayIncome = dayTransactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const dayExpense = dayTransactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);

  const toggleTaskDone = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await fetch(`http://localhost:3000/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ title: task.title, category: task.category, priority: task.priority, status: newStatus, dueDate: task.dueDate, note: task.note }),
    });
    loadData();
  };

  const locale = settings?.language === 'en' ? 'en-US' : 'uk-UA';

  return (
    <div>
      <Topbar />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700">
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {MONTHS[month]} <span className="text-gray-400 font-normal">{year}</span>
        </h1>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700">
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-50 dark:bg-green-500/20"
          label={t('calendar_income_month')} value={`${monthIncome.toLocaleString()} ${t('currency_suffix')}`} />
        <StatCard icon={TrendingDown} iconColor="text-red-500" iconBg="bg-red-50 dark:bg-red-500/20"
          label={t('calendar_expense_month')} value={`${monthExpense.toLocaleString()} ${t('currency_suffix')}`} />
        <StatCard icon={Wallet} iconColor="text-accent-500" iconBg="bg-accent-50 dark:bg-accent-500/20"
          label={t('calendar_balance_month')} value={`${monthBalance.toLocaleString()} ${t('currency_suffix')}`} />
        <StatCard icon={CheckCircle} iconColor="text-purple-500" iconBg="bg-purple-50 dark:bg-purple-500/20"
          label={t('calendar_tasks_done_month')} value={`${monthTasksDone} / ${monthTasks.length}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
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
                <button key={i} onClick={() => setSelectedDay(day)}
                  className={`min-h-24 rounded-xl border p-2 flex flex-col text-left ${
                    selectedDay === day ? 'border-accent-500 ring-1 ring-accent-500' : isToday(day) ? 'border-accent-400 bg-accent-50 dark:bg-accent-500/10' : 'border-gray-100 dark:border-gray-700 hover:border-accent-300'
                  }`}>
                  <span className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-accent-600' : 'text-gray-700 dark:text-gray-200'}`}>{day}</span>
                  <div className="flex flex-col gap-0.5 text-xs">
                    {income > 0 && <span className="text-green-600">+{income.toLocaleString()} {t('currency_suffix')}</span>}
                    {expense > 0 && <span className="text-red-500">-{expense.toLocaleString()} {t('currency_suffix')}</span>}
                    {taskCount > 0 && <span className="text-gray-400">{t('calendar_task_count', taskCount)}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {!selectedDay ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-gray-400 text-sm">{t('calendar_select_day_hint')}</p>
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  {new Date(year, month, selectedDay).toLocaleDateString(locale, { day: 'numeric', month: 'long' })}
                </h2>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t('calendar_income_month')}</span>
                    <span className="text-green-600 font-medium">+{dayIncome.toLocaleString()} {t('currency_suffix')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t('calendar_expense_month')}</span>
                    <span className="text-red-500 font-medium">-{dayExpense.toLocaleString()} {t('currency_suffix')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t('calendar_balance_month')}</span>
                    <span className="text-accent-600 font-medium">{(dayIncome - dayExpense).toLocaleString()} {t('currency_suffix')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t('calendar_tasks_done_month')}</span>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">
                      {dayTasks.filter((task) => task.status === 'done').length} / {dayTasks.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('calendar_day_tasks_title')}</h2>
                {dayTasks.length === 0 ? (
                  <p className="text-gray-400 text-sm">{t('calendar_day_no_tasks')}</p>
                ) : (
                  <div className="flex flex-col gap-2 mb-3">
                    {dayTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2">
                        <button onClick={() => toggleTaskDone(task)}
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            task.status === 'done' ? 'bg-accent-500 border-accent-500' : 'border-gray-300 dark:border-gray-600'
                          }`}>
                          {task.status === 'done' && <CheckCircle className="w-3 h-3 text-white" />}
                        </button>
                        <span className={`text-sm ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => navigate('/tasks')} className="text-xs text-accent-600 font-medium hover:text-accent-700">
                  {t('calendar_go_to_tasks')}
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('calendar_day_transactions_title')}</h2>
                {dayTransactions.length === 0 ? (
                  <p className="text-gray-400 text-sm">{t('calendar_day_no_transactions')}</p>
                ) : (
                  <div className="flex flex-col gap-2 mb-3">
                    {dayTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-200">{tx.category}</span>
                        <span className={tx.type === 'income' ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                          {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} {t('currency_suffix')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => navigate('/finance')} className="text-xs text-accent-600 font-medium hover:text-accent-700">
                  {t('calendar_go_to_finance')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Calendar;
