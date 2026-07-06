import { useState, useEffect } from 'react';

function Finance() {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');

  const token = localStorage.getItem('token');

  // Функція завантаження операцій із бекенду
  const fetchTransactions = async () => {
    const response = await fetch('http://localhost:3000/transactions', {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    const data = await response.json();
    setTransactions(data);
  };

  // Завантажуємо при відкритті сторінки
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Додавання нової операції
  const handleAdd = async () => {
    if (!amount || !category) return; // проста перевірка

    await fetch('http://localhost:3000/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        amount: Number(amount),
        type,
        category,
        note: '',
      }),
    });

    // Очищаємо форму й оновлюємо список
    setAmount('');
    setCategory('');
    fetchTransactions();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Фінанси</h1>

      {/* Форма додавання */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Додати операцію</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Сума</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-32"
              placeholder="1000"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Тип</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="expense">Витрата</option>
              <option value="income">Дохід</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Категорія</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Продукти"
            />
          </div>

          <button
            onClick={handleAdd}
            className="bg-orange-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-orange-700"
          >
            Додати
          </button>
        </div>
      </div>

      {/* Список операцій */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-4">Операції</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-400">Операцій ще немає</p>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center border-b border-gray-100 py-2"
              >
                <span className="text-gray-700">{t.category}</span>
                <span
                  className={t.type === 'income' ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}
                >
                  {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} ₴
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Finance;