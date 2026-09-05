import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ListPlus } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { API_URL } from '../config';

export const REFRESH_EVENT = 'planmoney:refresh';

function AddTaskModal({ onClose }) {
  const { t } = useSettings();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [savedCategories, setSavedCategories] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(API_URL + '/categories', { headers: { Authorization: 'Bearer ' + token } })
      .then((res) => res.json())
      .then(setSavedCategories);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async () => {
    if (!title) return;
    await fetch(API_URL + '/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        title,
        category: category || null,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        note: note || null,
      }),
    });
    window.dispatchEvent(new Event(REFRESH_EVENT));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t('quick_add_task_title')}</h3>

        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_name_label')}</label>
        <input
          type="text"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('tasks_name_placeholder')}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-3"
        />

        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_category_label')}</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder={t('tasks_category_placeholder')}
          list="quick-task-category-options"
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-3"
        />
        <datalist id="quick-task-category-options">
          {savedCategories.filter((c) => c.type === 'task').map((c) => <option key={c.id} value={c.name} />)}
        </datalist>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_priority_label')}</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2"
            >
              <option value="low">{t('priority_low')}</option>
              <option value="medium">{t('priority_medium')}</option>
              <option value="high">{t('priority_high')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_status_label')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2"
            >
              <option value="todo">{t('status_todo')}</option>
              <option value="in_progress">{t('status_in_progress')}</option>
              <option value="done">{t('status_done')}</option>
            </select>
          </div>
        </div>

        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_due_date_label')}</label>
        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-3"
        />

        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_note_label')}</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('tasks_note_placeholder')}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg py-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('common_cancel')}
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 bg-accent-500 text-[var(--accent-ink)] rounded-lg py-2 font-semibold hover:bg-accent-600"
          >
            {t('tasks_add_button')}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTransactionModal({ onClose }) {
  const { t } = useSettings();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [savedCategories, setSavedCategories] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const headers = { Authorization: 'Bearer ' + token };
    Promise.all([
      fetch(API_URL + '/accounts', { headers }).then((res) => res.json()),
      fetch(API_URL + '/categories', { headers }).then((res) => res.json()),
    ]).then(([accData, catData]) => {
      setAccounts(accData);
      if (accData.length > 0) setAccountId(String(accData[0].id));
      setSavedCategories(catData);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async () => {
    if (!amount) return;
    if (type === 'transfer') {
      if (!accountId || !toAccountId || accountId === toAccountId) return;
    } else if (!category) {
      return;
    }

    await fetch(API_URL + '/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        amount: Number(amount),
        type,
        category: type === 'transfer' ? t('finance_type_transfer') : category,
        note: note || null,
        accountId: accountId ? Number(accountId) : undefined,
        toAccountId: type === 'transfer' ? Number(toAccountId) : undefined,
      }),
    });
    window.dispatchEvent(new Event(REFRESH_EVENT));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t('quick_add_transaction_title')}</h3>

        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('finance_amount_label')}</label>
        <input
          type="number"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1000"
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-3"
        />

        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('finance_type_label')}</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-3"
        >
          <option value="expense">{t('finance_type_expense')}</option>
          <option value="income">{t('finance_type_income')}</option>
          <option value="transfer">{t('finance_type_transfer')}</option>
        </select>

        {type !== 'transfer' && (
          <>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('finance_category_label')}</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t('finance_category_placeholder')}
              list="quick-tx-category-options"
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-3"
            />
            <datalist id="quick-tx-category-options">
              {savedCategories.filter((c) => c.type === type).map((c) => <option key={c.id} value={c.name} />)}
            </datalist>
          </>
        )}

        {accounts.length > 0 && (
          <>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('finance_account_label')}</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-3"
            >
              {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </>
        )}

        {type === 'transfer' && accounts.length > 0 && (
          <>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('finance_to_account_label')}</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-3"
            >
              <option value="">—</option>
              {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </>
        )}

        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('finance_note_label')}</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('finance_note_placeholder')}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg py-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('common_cancel')}
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 bg-accent-500 text-[var(--accent-ink)] rounded-lg py-2 font-semibold hover:bg-accent-600"
          >
            {t('finance_add_button')}
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchBox() {
  const { t } = useSettings();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(null);
      return;
    }
    const headers = { Authorization: 'Bearer ' + token };
    const timeout = setTimeout(() => {
      Promise.all([
        fetch(API_URL + '/tasks', { headers }).then((res) => res.json()),
        fetch(API_URL + '/transactions', { headers }).then((res) => res.json()),
      ]).then(([tasksData, txData]) => {
        const tasks = (Array.isArray(tasksData) ? tasksData : []).filter((task) =>
          task.title?.toLowerCase().includes(q) ||
          task.category?.toLowerCase().includes(q) ||
          task.note?.toLowerCase().includes(q)
        ).slice(0, 5);
        const transactions = (Array.isArray(txData) ? txData : []).filter((tx) =>
          tx.category?.toLowerCase().includes(q) || tx.note?.toLowerCase().includes(q)
        ).slice(0, 5);
        setResults({ tasks, transactions });
      });
    }, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  const hasResults = results && (results.tasks.length > 0 || results.transactions.length > 0);

  return (
    <div className="relative" ref={boxRef}>
      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={t('topbar_search')}
        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-full pl-9 pr-4 py-2 text-sm shadow-sm w-48 focus:outline-none focus:border-accent-300"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {!results && (
            <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">{t('topbar_search_loading')}</div>
          )}
          {results && !hasResults && (
            <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">{t('topbar_search_empty')}</div>
          )}
          {results && results.tasks.length > 0 && (
            <div className="py-1">
              <div className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">{t('nav_tasks')}</div>
              {results.tasks.map((task) => (
                <button
                  key={`task-${task.id}`}
                  onClick={() => goTo('/tasks')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                >
                  {task.title}
                  {task.category && <span className="text-gray-400 dark:text-gray-500"> · {task.category}</span>}
                </button>
              ))}
            </div>
          )}
          {results && results.transactions.length > 0 && (
            <div className="py-1 border-t border-gray-100 dark:border-gray-700">
              <div className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">{t('nav_finance')}</div>
              {results.transactions.map((tx) => (
                <button
                  key={`tx-${tx.id}`}
                  onClick={() => goTo('/finance')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm flex items-center justify-between gap-2"
                >
                  <span className="text-gray-700 dark:text-gray-200">
                    {tx.category}
                    {tx.note && <span className="text-gray-400 dark:text-gray-500"> · {tx.note}</span>}
                  </span>
                  <span className={tx.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Topbar() {
  const { t, period, setPeriod } = useSettings();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);

  const periods = [
    { key: 'today', label: t('topbar_today') },
    { key: 'week', label: t('topbar_week') },
    { key: 'month', label: t('topbar_month') },
    { key: 'year', label: t('topbar_year') },
  ];

  return (
    <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
      <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-full p-1 border border-gray-100 dark:border-gray-700 shadow-sm">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === p.key ? 'bg-accent-500 text-[var(--accent-ink)]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <SearchBox />
        <button
          onClick={() => setShowTaskModal(true)}
          className="flex items-center gap-2 bg-accent-500 text-[var(--accent-ink)] rounded-full px-4 py-2 text-sm font-medium hover:bg-accent-600"
        >
          <ListPlus className="w-4 h-4" />
          {t('topbar_add_task')}
        </button>
        <button
          onClick={() => setShowTxModal(true)}
          className="flex items-center gap-2 bg-accent-500 text-[var(--accent-ink)] rounded-full px-4 py-2 text-sm font-medium hover:bg-accent-600"
        >
          <Plus className="w-4 h-4" />
          {t('topbar_add_transaction')}
        </button>
      </div>

      {showTaskModal && <AddTaskModal onClose={() => setShowTaskModal(false)} />}
      {showTxModal && <AddTransactionModal onClose={() => setShowTxModal(false)} />}
    </div>
  );
}

export default Topbar;
