import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Palette, Wallet, Download, Upload, Archive,
  Target, Plus, Trash2, Star, Sun, Moon, Monitor,
} from 'lucide-react';
import Topbar, { REFRESH_EVENT } from '../components/Topbar';
import { useSettings } from '../context/SettingsContext';
import { API_URL } from '../config';
import { PRESET_ACCENTS, resolveAccentHex } from '../accent';
import { formatMoney, fromMinor, toMinor } from '../money';

const CATEGORY_TYPES = [
  { key: 'task', labelKey: 'category_task' },
  { key: 'income', labelKey: 'category_income' },
  { key: 'expense', labelKey: 'category_expense' },
];

const CATEGORY_COLORS = ['#f76707', '#339af0', '#40c057', '#e64980', '#7048e8', '#495057'];

const CURRENCIES = [
  { key: 'UAH', labelKey: 'currency_uah' },
  { key: 'USD', labelKey: 'currency_usd' },
  { key: 'EUR', labelKey: 'currency_eur' },
];

const LANGUAGES = [
  { key: 'uk', labelKey: 'lang_uk' },
  { key: 'en', labelKey: 'lang_en' },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${checked ? 'bg-accent-500' : 'bg-gray-200 dark:bg-gray-600'}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

function Settings() {
  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: 'Bearer ' + token };
  const jsonHeaders = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

  const [user, setUser] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const [categories, setCategories] = useState([]);
  const [addingType, setAddingType] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);

  const { settings, saveSettings: saveSettingsCtx, reloadSettings, t } = useSettings();
  const navigate = useNavigate();
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [budgetDraft, setBudgetDraft] = useState('');

  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const loadData = async () => {
    const [meRes, catRes, goalsRes, txRes, accRes] = await Promise.all([
      fetch(API_URL + '/auth/me', { headers: authHeaders }),
      fetch(API_URL + '/categories', { headers: authHeaders }),
      fetch(API_URL + '/goals', { headers: authHeaders }),
      fetch(API_URL + '/transactions', { headers: authHeaders }),
      fetch(API_URL + '/accounts', { headers: authHeaders }),
    ]);
    const me = await meRes.json();
    setUser(me);
    setNameDraft(me.name || '');
    setCategories(await catRes.json());
    setGoals(await goalsRes.json());
    setTransactions(await txRes.json());
    setAccounts(await accRes.json());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    window.addEventListener(REFRESH_EVENT, loadData);
    return () => window.removeEventListener(REFRESH_EVENT, loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (settings) setBudgetDraft(settings.monthlyBudget == null ? '' : fromMinor(settings.monthlyBudget));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.monthlyBudget]);

  const saveProfile = async () => {
    const res = await fetch(API_URL + '/auth/me', {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ name: nameDraft }),
    });
    setUser(await res.json());
    setEditingProfile(false);
  };

  const saveSettings = (partial) => saveSettingsCtx(partial);

  const addCategory = async (type) => {
    if (!newCatName.trim()) return;
    await fetch(API_URL + '/categories', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name: newCatName, type, color: newCatColor }),
    });
    setNewCatName('');
    setNewCatColor(CATEGORY_COLORS[0]);
    setAddingType(null);
    const res = await fetch(API_URL + '/categories', { headers: authHeaders });
    setCategories(await res.json());
  };

  const deleteCategory = async (id) => {
    await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE', headers: authHeaders });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleExport = () => {
    const accountById = Object.fromEntries(accounts.map((acc) => [acc.id, acc]));
    const typeLabel = { income: t('csv_income'), expense: t('csv_expense'), transfer: t('finance_type_transfer') };

    const header = [t('csv_date'), t('csv_type'), t('csv_category'), t('csv_amount'), t('csv_currency'), t('csv_account'), t('csv_note')];
    const rows = transactions.map((tx) => [
      new Date(tx.date).toLocaleDateString(settings.language === 'en' ? 'en-US' : 'uk-UA'),
      typeLabel[tx.type] || tx.type,
      tx.category,
      fromMinor(tx.amount).toFixed(2),
      accountById[tx.accountId]?.currency || 'UAH',
      tx.type === 'transfer'
        ? `${accountById[tx.accountId]?.name || '—'} → ${accountById[tx.toAccountId]?.name || '—'}`
        : (accountById[tx.accountId]?.name || ''),
      tx.note || '',
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'planmoney-transactions.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!settings) {
    return (
      <div>
        <Topbar />
        <p className="text-gray-400 text-sm">{t('settings_loading')}</p>
      </div>
    );
  }

  const activeGoal = goals.find((g) => g.savedAmount < g.targetAmount) || goals[0];

  const now = new Date();
  const monthExpense = transactions
    .filter((t) => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
    .reduce((s, t) => s + t.amount, 0);
  const budgetPercent = settings.monthlyBudget ? Math.min(Math.round((monthExpense / settings.monthlyBudget) * 100), 100) : 0;

  const handleDeleteAccount = async () => {
    setDeleteError('');
    const res = await fetch(API_URL + '/auth/me', {
      method: 'DELETE',
      headers: jsonHeaders,
      body: JSON.stringify({ password: deletePassword }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error || t('delete_account_failed'));
      return;
    }
    localStorage.removeItem('token');
    await reloadSettings();
    navigate('/login');
  };

  const currentAccent = resolveAccentHex(settings.accentColor);
  const isCustomAccent = !PRESET_ACCENTS.some((c) => c.hex.toLowerCase() === currentAccent.toLowerCase());

  return (
    <div>
      <Topbar />

      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{t('settings_title')}</h1>
      <p className="text-gray-400 text-sm mb-6">{t('settings_subtitle')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ліва колонка: Профіль + Сповіщення */}
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('profile_title')}</h2>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center text-xl font-bold">
                {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                {editingProfile ? (
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm w-full"
                  />
                ) : (
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{user?.name || t('profile_no_name')}</p>
                )}
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-accent-600 font-medium mb-4">
              <Star className="w-3.5 h-3.5 fill-accent-500 text-accent-500" />
              {t('profile_premium')}
            </div>

            {editingProfile ? (
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingProfile(false); setNameDraft(user?.name || ''); }}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg py-1.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('profile_cancel')}
                </button>
                <button
                  onClick={saveProfile}
                  className="flex-1 bg-accent-500 text-[var(--accent-ink)] rounded-lg py-1.5 text-sm font-semibold hover:bg-accent-600"
                >
                  {t('profile_save')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingProfile(true)}
                className="w-full border border-accent-200 text-accent-600 rounded-lg py-1.5 text-sm font-medium hover:bg-accent-50"
              >
                {t('profile_edit')}
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('notifications_title')}</h2>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 max-w-xs">
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-100">{t('notif_tasks_label')}</p>
                  <p className="text-xs text-gray-400">{t('notif_tasks_desc')}</p>
                </div>
                <Toggle checked={settings.notifyTasks} onChange={(v) => saveSettings({ notifyTasks: v })} />
              </div>
              <div className="flex items-center justify-between gap-3 max-w-xs">
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-100">{t('notif_budget_label')}</p>
                  <p className="text-xs text-gray-400">{t('notif_budget_desc')}</p>
                </div>
                <Toggle checked={settings.notifyBudget} onChange={(v) => saveSettings({ notifyBudget: v })} />
              </div>
              <div className="flex items-center justify-between gap-3 max-w-xs">
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-100">{t('notif_goals_label')}</p>
                  <p className="text-xs text-gray-400">{t('notif_goals_desc')}</p>
                </div>
                <Toggle checked={settings.notifyGoals} onChange={(v) => saveSettings({ notifyGoals: v })} />
              </div>
              <div className="flex items-center justify-between gap-3 max-w-xs">
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-100">{t('notif_email_label')}</p>
                  <p className="text-xs text-gray-400">{t('notif_email_desc')}</p>
                </div>
                <Toggle checked={settings.emailDigest} onChange={(v) => saveSettings({ emailDigest: v })} />
              </div>
            </div>
          </div>
        </div>

        {/* Права колонка: Категорії + Вигляд */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('categories_title')}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {CATEGORY_TYPES.map((ct) => (
                <div key={ct.key}>
                  <p className="text-xs font-medium text-gray-400 mb-2">{t(ct.labelKey)}</p>
                  <div className="flex flex-col gap-2 mb-2">
                    {categories.filter((c) => c.type === ct.key).map((c) => (
                      <div key={c.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || '#adb5bd' }} />
                          <span className="text-sm text-gray-700 dark:text-gray-200">{c.name}</span>
                        </div>
                        <button
                          onClick={() => deleteCategory(c.id)}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {categories.filter((c) => c.type === ct.key).length === 0 && (
                      <p className="text-xs text-gray-300">{t('category_none')}</p>
                    )}
                  </div>

                  {addingType === ct.key ? (
                    <div className="flex flex-col gap-2">
                      <input
                        autoFocus
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder={t('category_name_placeholder')}
                        className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm"
                      />
                      <div className="flex items-center gap-1">
                        {CATEGORY_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewCatColor(color)}
                            className={`w-4 h-4 rounded-full ${newCatColor === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setAddingType(null)}
                          className="flex-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg py-1 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {t('category_cancel')}
                        </button>
                        <button
                          onClick={() => addCategory(ct.key)}
                          className="flex-1 text-xs bg-accent-500 text-[var(--accent-ink)] rounded-lg py-1 font-semibold hover:bg-accent-600"
                        >
                          {t('category_confirm_add')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingType(ct.key); setNewCatName(''); setNewCatColor(CATEGORY_COLORS[0]); }}
                      className="text-xs text-accent-600 font-medium hover:text-accent-700"
                    >
                      {t('category_add')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('appearance_title')}</h2>
            </div>

            <p className="text-xs text-gray-400 mb-2">{t('theme_label')}</p>
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 rounded-full p-1 w-fit mb-4">
              {[
                { key: 'light', label: t('theme_light'), icon: Sun },
                { key: 'dark', label: t('theme_dark'), icon: Moon },
                { key: 'system', label: t('theme_system'), icon: Monitor },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => saveSettings({ theme: opt.key })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    settings.theme === opt.key ? 'bg-accent-500 text-[var(--accent-ink)]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400 mb-2">{t('accent_label')}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_ACCENTS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => saveSettings({ accentColor: c.hex })}
                  title={c.hex}
                  className={`w-7 h-7 rounded-full ${currentAccent.toLowerCase() === c.hex.toLowerCase() ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}

              {/* Будь-який власний колір */}
              <label
                className={`w-7 h-7 rounded-full cursor-pointer relative overflow-hidden ${isCustomAccent ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                style={{ background: isCustomAccent ? currentAccent : 'conic-gradient(#f97316, #22c55e, #4dabf7, #a855f7, #ec4899, #f97316)' }}
                title={t('accent_custom')}
              >
                <input
                  type="color"
                  value={currentAccent}
                  onChange={(e) => saveSettings({ accentColor: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>

              <span className="text-xs text-gray-400 font-mono">{currentAccent}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('finance_settings_title')}</h2>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('currency_label')}</label>
              <select
                value={settings.currency}
                onChange={(e) => saveSettings({ currency: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
              >
                {CURRENCIES.map((c) => <option key={c.key} value={c.key}>{t(c.labelKey)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('month_start_label')}</label>
              <select
                value={settings.monthStart}
                onChange={(e) => saveSettings({ monthStart: Number(e.target.value) })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{t('month_start_day', d)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('language_label')}</label>
              <select
                value={settings.language}
                onChange={(e) => saveSettings({ language: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
              >
                {LANGUAGES.map((l) => <option key={l.key} value={l.key}>{t(l.labelKey)}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Archive className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('backup_title')}</h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-800 dark:text-gray-100">{t('export_title')}</p>
                <p className="text-xs text-gray-400">{t('export_desc')}</p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 border border-accent-200 text-accent-600 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-accent-50 shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> {t('export_button')}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-800 dark:text-gray-100">{t('backup_label')}</p>
                <p className="text-xs text-gray-400">{t('backup_desc')}</p>
              </div>
              <button disabled className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 text-gray-400 rounded-lg px-3 py-1.5 text-sm font-medium cursor-not-allowed shrink-0">
                <Archive className="w-3.5 h-3.5" /> {t('soon')}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-800 dark:text-gray-100">{t('import_label')}</p>
                <p className="text-xs text-gray-400">{t('import_desc')}</p>
              </div>
              <button disabled className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 text-gray-400 rounded-lg px-3 py-1.5 text-sm font-medium cursor-not-allowed shrink-0">
                <Upload className="w-3.5 h-3.5" /> {t('soon')}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('goals_budget_title')}</h2>
          </div>

          {activeGoal ? (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-800 dark:text-gray-100 font-medium">{activeGoal.title}</span>
                <span className="text-xs text-gray-400">
                  {Math.min(Math.round((activeGoal.savedAmount / activeGoal.targetAmount) * 100), 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-accent-500 rounded-full"
                  style={{ width: `${Math.min(Math.round((activeGoal.savedAmount / activeGoal.targetAmount) * 100), 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                {formatMoney(activeGoal.savedAmount, 'UAH', settings.language)} / {formatMoney(activeGoal.targetAmount, 'UAH', settings.language)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-300 mb-4 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> {t('no_goals')}
            </p>
          )}

          <label className="block text-xs text-gray-400 mb-1">{t('monthly_budget_label')}</label>
          <input
            type="number"
            value={budgetDraft}
            onChange={(e) => setBudgetDraft(e.target.value)}
            onBlur={() => saveSettings({ monthlyBudget: budgetDraft === '' ? null : toMinor(budgetDraft) })}
            placeholder={t('monthly_budget_placeholder')}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm mb-2"
          />

          {settings.monthlyBudget ? (
            <>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full ${budgetPercent >= 100 ? 'bg-red-500' : 'bg-accent-500'}`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                {t('budget_used', formatMoney(monthExpense, 'UAH', settings.language), formatMoney(settings.monthlyBudget, 'UAH', settings.language), budgetPercent)}
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-300">{t('budget_set_hint')}</p>
          )}
        </div>
      </div>

      {/* Видалення акаунта */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-red-100 dark:border-red-500/30 mt-4">
        <h2 className="font-semibold text-red-600 dark:text-red-400 mb-1">{t('danger_zone_title')}</h2>
        <p className="text-xs text-gray-400 mb-4">{t('delete_account_desc')}</p>

        {!deletingAccount ? (
          <button
            onClick={() => setDeletingAccount(true)}
            className="text-sm border border-red-300 dark:border-red-500/50 text-red-600 dark:text-red-400 rounded-lg px-4 py-2 font-medium hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            {t('delete_account_button')}
          </button>
        ) : (
          <div className="max-w-sm">
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('delete_account_password_label')}</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-3"
            />
            {deleteError && <p className="text-xs text-red-500 mb-3">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setDeletingAccount(false); setDeletePassword(''); setDeleteError(''); }}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('common_cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-700"
              >
                {t('delete_account_confirm')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
