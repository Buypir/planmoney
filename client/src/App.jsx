import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Finance from './pages/Finance';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';

function App() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Бічне меню */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6">
        <h2 className="text-xl font-bold text-orange-600 mb-8">PlanMoney</h2>
        <nav className="flex flex-col gap-2">
          <Link to="/" className="px-4 py-2 rounded-lg hover:bg-orange-50 text-gray-700">Дашборд</Link>
          <Link to="/calendar" className="px-4 py-2 rounded-lg hover:bg-orange-50 text-gray-700">Календар</Link>
          <Link to="/tasks" className="px-4 py-2 rounded-lg hover:bg-orange-50 text-gray-700">Задачі</Link>
          <Link to="/finance" className="px-4 py-2 rounded-lg hover:bg-orange-50 text-gray-700">Фінанси</Link>
          <Link to="/analytics" className="px-4 py-2 rounded-lg hover:bg-orange-50 text-gray-700">Аналітика</Link>
          <Link to="/settings" className="px-4 py-2 rounded-lg hover:bg-orange-50 text-gray-700">Налаштування</Link>
        </nav>
      </aside>

      {/* Основна частина — тут показується активна сторінка */}
      <main className="flex-1 p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;