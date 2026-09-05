import { createContext, useContext, useEffect, useState } from 'react';
import { translate } from '../i18n';

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:3000/settings', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((res) => res.json())
      .then(setSettings);
    fetch('http://localhost:3000/exchange-rates', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((res) => res.json())
      .then(setRates);
  }, []);

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
    const res = await fetch('http://localhost:3000/settings', {
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
    <SettingsContext.Provider value={{ settings, saveSettings, t, isDark, period, setPeriod, rates }}>
      {children}
    </SettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  return useContext(SettingsContext);
}
