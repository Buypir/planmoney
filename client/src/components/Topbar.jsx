import { useState } from 'react';
import { Search, Plus, ListPlus } from 'lucide-react';

function Topbar() {
  const [period, setPeriod] = useState('today');

  const periods = [
    { key: 'today', label: 'Сьогодні' },
    { key: 'week', label: 'Тиждень' },
    { key: 'month', label: 'Місяць' },
    { key: 'year', label: 'Рік' },
  ];

  return (
    <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
      <div className="flex items-center gap-1 bg-white rounded-full p-1 border border-gray-100 shadow-sm">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === p.key ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Пошук..."
            className="bg-white border border-gray-100 rounded-full pl-9 pr-4 py-2 text-sm shadow-sm w-48 focus:outline-none focus:border-orange-300"
          />
        </div>
        <button className="flex items-center gap-2 bg-orange-500 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-orange-600">
          <ListPlus className="w-4 h-4" />
          Додати задачу
        </button>
        <button className="flex items-center gap-2 bg-orange-500 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-orange-600">
          <Plus className="w-4 h-4" />
          Додати операцію
        </button>
      </div>
    </div>
  );
}

export default Topbar;
