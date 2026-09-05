import { Routes, Route, Link, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Finance from './pages/Finance';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { useSettings } from './context/SettingsContext';

function AppLayout() {
  const { t } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Бічне меню */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col">
        <h2 className="text-xl font-bold text-accent-600 mb-8">PlanMoney</h2>
        <nav className="flex flex-col gap-2 flex-1">
          <Link to="/" className="px-4 py-2 rounded-lg hover:bg-accent-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">{t('nav_dashboard')}</Link>
          <Link to="/calendar" className="px-4 py-2 rounded-lg hover:bg-accent-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">{t('nav_calendar')}</Link>
          <Link to="/tasks" className="px-4 py-2 rounded-lg hover:bg-accent-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">{t('nav_tasks')}</Link>
          <Link to="/finance" className="px-4 py-2 rounded-lg hover:bg-accent-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">{t('nav_finance')}</Link>
          <Link to="/analytics" className="px-4 py-2 rounded-lg hover:bg-accent-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">{t('nav_analytics')}</Link>
          <Link to="/settings" className="px-4 py-2 rounded-lg hover:bg-accent-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">{t('nav_settings')}</Link>
        </nav>
        <button onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 dark:text-gray-400 hover:text-red-500 text-sm">
          <LogOut className="w-4 h-4" /> {t('nav_logout')}
        </button>
      </aside>

      {/* Основна частина — тут показується активна сторінка */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
