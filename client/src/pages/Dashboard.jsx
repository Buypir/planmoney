import { useState, useEffect } from 'react';

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Завантажуємо транзакції при відкритті сторінки
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/transactions', {
          headers: { 'Authorization': 'Bearer ' + token },
        });
        const data = await response.json();
        setTransactions(data);
      } catch (err) {
        console.error('Помилка завантаження:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Рахуємо дохід і витрати з реальних даних
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expense;

  if (loading) {
    return <p className="text-gray-500">Завантаження...</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Добрий вечір, Богдан 👋</h1>
      <p className="text-gray-500 mb-8">Ось твій фінансовий огляд</p>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm mb-2">Дохід</p>
          <p className="text-2xl font-bold text-green-600">{income.toLocaleString()} ₴</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm mb-2">Витрати</p>
          <p className="text-2xl font-bold text-orange-600">{expense.toLocaleString()} ₴</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm mb-2">Баланс</p>
          <p className="text-2xl font-bold text-gray-800">{balance.toLocaleString()} ₴</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;