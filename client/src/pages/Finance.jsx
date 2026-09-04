import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Plus } from 'lucide-react';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';

function Finance() {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState('all');

  const token = localStorage.getItem('token');

  const fetchTransactions = async () => {
    const res = await fetch('http://localhost:3000/transactions', {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    setTransactions(await res.json());
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch('http://localhost:3000/transactions', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      const data = await res.json();
      if (active) setTransactions(data);
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async () => {
    if (!amount || !category) return;
    await fetch('http://localhost:3000/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ amount: Number(amount), type, category, note: '' }),
    });
    setAmount('');
    setCategory('');
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:3000/transactions/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token },
    });
    fetchTransactions();
  };

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const filtered = transactions.filter((t) => filter === 'all' || t.type === filter);

  const tabs = [
    { key: 'all', label: 'Всі' },
    { key: 'income', label: 'Дохід' },
    { key: 'expense', label: 'Витрати' },
  ];

  return (
    <div>
      <Topbar />

      <h1 className="text-2xl font-bold text-gray-800 mb-1">Фінанси</h1>
      <p className="text-gray-400 text-sm mb-6">Керуй своїми доходами та витратами</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-50"
          label="Дохід" value={`${income.toLocaleString()} грн`}
          trendColor="#40c057" trendData={[10, 12, 9, 15, 13, 18, 20]} />
        <StatCard icon={TrendingDown} iconColor="text-red-500" iconBg="bg-red-50"
          label="Витрати" value={`${expense.toLocaleString()} грн`}
          trendColor="#fa5252" trendData={[18, 14, 16, 12, 15, 11, 13]} />
        <StatCard icon={PiggyBank} iconColor="text-orange-500" iconBg="bg-orange-50"
          label="Баланс" value={`${balance.toLocaleString()} грн`}
          trendColor="#f76707" trendData={[8, 10, 12, 11, 14, 16, 19]} />
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Додати операцію</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Сума</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-32" placeholder="1000" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Тип</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2">
              <option value="expense">Витрата</option>
              <option value="income">Дохід</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Категорія</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2" placeholder="Продукти" />
          </div>
          <button onClick={handleAdd}
            className="flex items-center gap-2 bg-orange-500 text-white rounded-lg px-5 py-2 font-semibold hover:bg-orange-600">
            <Plus className="w-4 h-4" /> Додати
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-gray-700">Операції</h2>
          <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`px-4 py-1 rounded-full text-sm font-medium ${
                  filter === tab.key ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">Операцій немає</p>
        ) : (
          <div className="flex flex-col">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 group">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-50' : 'bg-orange-50'}`}>
                    {t.type === 'income'
                      ? <TrendingUp className="w-4 h-4 text-green-600" />
                      : <TrendingDown className="w-4 h-4 text-orange-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.category}</p>
                    <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('uk-UA')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-orange-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} грн
                  </span>
                  <button onClick={() => handleDelete(t.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Finance;
