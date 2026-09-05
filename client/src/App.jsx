import { Routes, Route, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
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
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: t('nav_dashboard') },
    { to: '/calendar', label: t('nav_calendar') },
    { to: '/tasks', label: t('nav_tasks') },
    { to: '/finance', label: t('nav_finance') },
    { to: '/analytics', label: t('nav_analytics') },
    { to: '/settings', label: t('nav_settings') },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Мобільна верхня панель з кнопкою меню */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-accent-600">PlanMoney</h2>
        <button onClick={() => setMenuOpen(true)} className="p-2 text-gray-600 dark:text-gray-300" aria-label={t('nav_open_menu')}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Затемнення фону при відкритому мобільному меню */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMenuOpen(false)} />
      )}

      {/* Бічне меню: статичне на десктопі, висувне на мобільному */}
      <aside className={`w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col
        fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:static md:translate-x-0
        ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-accent-600">PlanMoney</h2>
          <button onClick={() => setMenuOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-gray-600" aria-label={t('nav_close_menu')}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="px-4 py-2 rounded-lg hover:bg-accent-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
              {link.label}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 dark:text-gray-400 hover:text-red-500 text-sm">
          <LogOut className="w-4 h-4" /> {t('nav_logout')}
        </button>
      </aside>

      {/* Основна частина — тут показується активна сторінка */}
      <main className="flex-1 min-w-0 p-4 pt-20 md:p-8">
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
