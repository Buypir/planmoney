function Dashboard() {
  // Поки тестові дані — наступного кроку підключимо реальні з бекенду
  const income = 32450;
  const expense = 12870;
  const balance = income - expense;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Добрий вечір, Богдан 👋</h1>
      <p className="text-gray-500 mb-8">Ось твій фінансовий огляд</p>

      {/* Картки згори */}
      <div className="grid grid-cols-3 gap-6">
        {/* Дохід */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm mb-2">Дохід</p>
          <p className="text-2xl font-bold text-green-600">{income.toLocaleString()} ₴</p>
        </div>

        {/* Витрати */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm mb-2">Витрати</p>
          <p className="text-2xl font-bold text-orange-600">{expense.toLocaleString()} ₴</p>
        </div>

        {/* Баланс */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm mb-2">Баланс</p>
          <p className="text-2xl font-bold text-gray-800">{balance.toLocaleString()} ₴</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;