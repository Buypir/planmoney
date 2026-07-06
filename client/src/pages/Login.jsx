import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('bogdan@email.com');
  const [password, setPassword] = useState('bogdan123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Помилка входу');
        return;
      }

      // Зберігаємо токен у пам'яті браузера
      localStorage.setItem('token', data.token);

      // Переходимо на дашборд
      navigate('/');
    } catch (err) {
      setError('Не вдалося зʼєднатися з сервером');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-96">
        <h1 className="text-2xl font-bold text-orange-600 mb-6 text-center">PlanMoney</h1>

        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
        />

        <label className="block text-sm text-gray-600 mb-1">Пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          className="w-full bg-orange-600 text-white rounded-lg py-2 font-semibold hover:bg-orange-700"
        >
          Увійти
        </button>
      </div>
    </div>
  );
}

export default Login;