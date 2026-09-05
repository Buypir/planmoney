import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { API_URL } from '../config';

function Login() {
  const { t, reloadSettings } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    try {
      const response = await fetch(API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('login_error_default'));
        return;
      }

      // Зберігаємо токен у пам'яті браузера
      localStorage.setItem('token', data.token);

      // Підтягуємо налаштування вже під новим токеном
      await reloadSettings();

      // Переходимо на дашборд
      navigate('/');
    } catch {
      setError(t('login_error_connection'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-96">
        <h1 className="text-2xl font-bold text-accent-600 mb-6 text-center">PlanMoney</h1>

        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('login_email_label')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-4"
        />

        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('login_password_label')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-4"
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          className="w-full bg-accent-600 text-white rounded-lg py-2 font-semibold hover:bg-accent-700"
        >
          {t('login_submit')}
        </button>

        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
          {t('login_no_account')}{' '}
          <Link to="/register" className="text-accent-600 hover:text-accent-700 font-medium">
            {t('login_register_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;