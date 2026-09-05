import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { translate } from '../i18n';
import { API_URL } from '../config';

const SettingsContext = createContext(null);

const applyTheme = (theme) => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [period, setPeriod] = useState('month');
  const [rates, setRates] = useState(null);
  // Токен тримаємо в стані, а не читаємо з localStorage при кожному рендері:
  // інакше охоронці роутів не дізнаються, що він зник
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  // Викликається на старті й після входу/виходу — інакше налаштування
  // залишились би порожніми до перезавантаження сторінки
  const reloadSettings = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    if (!storedToken) {
      setSettings(null);
      setRates(null);
      return;
    }
    const headers = { Authorization: 'Bearer ' + storedToken };
    const [settingsRes, ratesRes] = await Promise.all([
      fetch(API_URL + '/settings', { headers }),
      fetch(API_URL + '/exchange-rates', { headers }),
    ]);

    // Токен протух або недійсний — прибираємо його, щоб застосунок повів на вхід
    if (settingsRes.status === 401) {
      localStorage.removeItem('token');
      setToken(null);
      setSettings(null);
      setRates(null);
      return;
    }

    setSettings(settingsRes.ok ? await settingsRes.json() : null);
    setRates(ratesRes.ok ? await ratesRes.json() : null);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reloadSettings();
  }, [reloadSettings]);

  useEffect(() => {
    if (!settings) return;
    applyTheme(settings.theme);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains('dark'));
    if (settings.theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      applyTheme('system');
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.theme]);

  useEffect(() => {
    if (!settings) return;
    document.documentElement.dataset.accent = settings.accentColor || 'orange';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.accentColor]);

  const saveSettings = async (partial) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    const token = localStorage.getItem('token');
    const res = await fetch(API_URL + '/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(partial),
    });
    const updated = await res.json();
    setSettings(updated);
    return updated;
  };

  const t = (key, ...args) => translate(settings?.language || 'uk', key, ...args);

  return (
    <SettingsContext.Provider value={{ settings, saveSettings, reloadSettings, token, t, isDark, period, setPeriod, rates }}>
      {children}
    </SettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  return useContext(SettingsContext);
}
