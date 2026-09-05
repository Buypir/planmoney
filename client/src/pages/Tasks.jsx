import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, ListTodo, Plus, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import Topbar, { REFRESH_EVENT } from '../components/Topbar';
import { useSettings } from '../context/SettingsContext';
import { API_URL } from '../config';

const PER_PAGE = 8;

const StatBox = ({ icon: Icon, iconColor, iconBg, label, value, caption }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
    <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
      {caption && <p className="text-xs text-gray-300 dark:text-gray-500">{caption}</p>}
    </div>
  </div>
);

function emptyForm() {
  return { title: '', category: '', priority: 'medium', status: 'todo', dueDate: '', note: '' };
}

function toLocalInputValue(isoString) {
  const d = new Date(isoString);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function TaskFormFields({ t, form, setForm }) {
  return (
    <>
      <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_name_label')}</label>
      <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder={t('tasks_name_placeholder')}
        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-3" />

      <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_category_label')}</label>
      <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
        placeholder={t('tasks_category_placeholder')} list="task-category-options"
        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-3" />

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_priority_label')}</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2">
            <option value="low">{t('priority_low')}</option>
            <option value="medium">{t('priority_medium')}</option>
            <option value="high">{t('priority_high')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_status_label')}</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2">
            <option value="todo">{t('status_todo')}</option>
            <option value="in_progress">{t('status_in_progress')}</option>
            <option value="done">{t('status_done')}</option>
          </select>
        </div>
      </div>

      <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_due_date_label')}</label>
      <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-3" />

      <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_note_label')}</label>
      <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
        placeholder={t('tasks_note_placeholder')}
        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 mb-4" />
    </>
  );
}

function Tasks() {
  const { t, settings } = useSettings();
  const [tasks, setTasks] = useState([]);
  const [savedCategories, setSavedCategories] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm());

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);

  const token = localStorage.getItem('token');

  const fetchTasks = async () => {
    const res = await fetch(API_URL + '/tasks', {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    setTasks(await res.json());
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const [res, catRes] = await Promise.all([
        fetch(API_URL + '/tasks', { headers: { 'Authorization': 'Bearer ' + token } }),
        fetch(API_URL + '/categories', { headers: { 'Authorization': 'Bearer ' + token } }),
      ]);
      const data = await res.json();
      if (active) { setTasks(data); setSavedCategories(await catRes.json()); }
    })();
    window.addEventListener(REFRESH_EVENT, fetchTasks);
    return () => { active = false; window.removeEventListener(REFRESH_EVENT, fetchTasks); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildPayload = (f) => ({
    title: f.title,
    category: f.category || null,
    priority: f.priority,
    status: f.status,
    dueDate: f.dueDate ? new Date(f.dueDate).toISOString() : null,
    note: f.note || null,
  });

  const handleAdd = async () => {
    if (!form.title) return;
    await fetch(API_URL + '/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(buildPayload(form)),
    });
    setForm(emptyForm());
    fetchTasks();
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token },
    });
    fetchTasks();
  };

  const toggleDone = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await fetch(`${API_URL}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ title: task.title, category: task.category, priority: task.priority, status: newStatus, dueDate: task.dueDate, note: task.note }),
    });
    fetchTasks();
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title || '',
      category: task.category || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      dueDate: task.dueDate ? toLocalInputValue(task.dueDate) : '',
      note: task.note || '',
    });
  };

  const saveEdit = async () => {
    if (!editForm.title) return;
    await fetch(`${API_URL}/tasks/${editingTask.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(buildPayload(editForm)),
    });
    setEditingTask(null);
    fetchTasks();
  };

  const now = new Date();
  const isOverdue = (task) => task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
  const isDueToday = (task) => {
    if (!task.dueDate) return false;
    const d = new Date(task.dueDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };
  const isImportant = (task) => task.priority === 'high';

  const total = tasks.length;
  const done = tasks.filter((task) => task.status === 'done').length;
  const donePercent = total ? Math.round((done / total) * 100) : 0;
  const overdue = tasks.filter(isOverdue).length;
  const dueToday = tasks.filter(isDueToday).length;
  const important = tasks.filter(isImportant).length;

  const tabs = [
    { key: 'all', label: t('tasks_tab_all'), count: total },
    { key: 'today', label: t('tasks_tab_today'), count: dueToday },
    { key: 'overdue', label: t('tasks_tab_overdue'), count: overdue },
    { key: 'done', label: t('tasks_tab_done'), count: done },
    { key: 'important', label: t('tasks_tab_important'), count: important },
  ];

  const tabFiltered = tasks.filter((task) => {
    if (tab === 'today') return isDueToday(task);
    if (tab === 'overdue') return isOverdue(task);
    if (tab === 'done') return task.status === 'done';
    if (tab === 'important') return isImportant(task);
    return true;
  });

  const categories = [...new Set(tasks.map((task) => task.category).filter(Boolean))];

  const filtered = tabFiltered
    .filter((task) => categoryFilter === 'all' || task.category === categoryFilter)
    .filter((task) => priorityFilter === 'all' || task.priority === priorityFilter)
    .filter((task) => statusFilter === 'all' || task.status === statusFilter)
    .filter((task) => task.title.toLowerCase().includes(search.toLowerCase()));

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(currentPage * PER_PAGE, currentPage * PER_PAGE + PER_PAGE);

  const resetFilters = () => {
    setTab('all');
    setSearch('');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setStatusFilter('all');
    setPage(0);
  };

  const changeTab = (key) => { setTab(key); setPage(0); };

  const priorityStyle = {
    low: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    medium: 'bg-accent-50 dark:bg-accent-500/20 text-accent-600',
    high: 'bg-red-50 dark:bg-red-500/20 text-red-600',
  };
  const priorityLabel = { low: t('priority_low'), medium: t('priority_medium'), high: t('priority_high') };
  const statusStyle = {
    todo: 'bg-blue-50 dark:bg-blue-500/20 text-blue-600',
    in_progress: 'bg-purple-50 dark:bg-purple-500/20 text-purple-600',
    done: 'bg-green-50 dark:bg-green-500/20 text-green-600',
  };
  const statusLabel = { todo: t('status_todo'), in_progress: t('status_in_progress'), done: t('status_done') };

  const formatDueDate = (task) => {
    if (!task.dueDate) return t('tasks_no_due_date');
    const d = new Date(task.dueDate);
    const locale = settings?.language === 'en' ? 'en-US' : 'uk-UA';
    return `${d.toLocaleDateString(locale)} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div>
      <Topbar />

      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{t('tasks_title')}</h1>
      <p className="text-gray-400 text-sm mb-6">{t('tasks_subtitle')}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBox icon={ListTodo} iconColor="text-blue-500" iconBg="bg-blue-50 dark:bg-blue-500/20" label={t('tasks_stat_total')} value={total} />
        <StatBox icon={CheckCircle} iconColor="text-green-500" iconBg="bg-green-50 dark:bg-green-500/20" label={t('tasks_stat_done')} value={done} caption={t('tasks_stat_done_caption', donePercent)} />
        <StatBox icon={AlertCircle} iconColor="text-red-500" iconBg="bg-red-50 dark:bg-red-500/20" label={t('tasks_stat_overdue')} value={overdue} caption={t('tasks_stat_overdue_caption')} />
        <StatBox icon={Clock} iconColor="text-accent-500" iconBg="bg-accent-50 dark:bg-accent-500/20" label={t('tasks_stat_due_today')} value={dueToday} caption={t('tasks_stat_due_today_caption')} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('tasks_add_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_name_label')}</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 w-full" placeholder={t('tasks_name_placeholder')} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_category_label')}</label>
            <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} list="task-category-options"
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 w-full" placeholder={t('tasks_category_placeholder')} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_priority_label')}</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 w-full">
              <option value="low">{t('priority_low')}</option>
              <option value="medium">{t('priority_medium')}</option>
              <option value="high">{t('priority_high')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_status_label')}</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 w-full">
              <option value="todo">{t('status_todo')}</option>
              <option value="in_progress">{t('status_in_progress')}</option>
              <option value="done">{t('status_done')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_due_date_label')}</label>
            <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 w-full" />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{t('tasks_note_label')}</label>
            <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 w-full" placeholder={t('tasks_note_placeholder')} />
          </div>
          <button onClick={handleAdd}
            className="flex items-center justify-center gap-2 bg-accent-500 text-white rounded-lg px-5 py-2 font-semibold hover:bg-accent-600 h-fit">
            <Plus className="w-4 h-4" /> {t('tasks_add_button')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('tasks_my_tasks_title')}</h2>
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 rounded-full p-1 flex-wrap">
            {tabs.map((tb) => (
              <button key={tb.key} onClick={() => changeTab(tb.key)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  tab === tb.key ? 'bg-accent-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}>
                {tb.label} {tb.count}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder={t('tasks_search_placeholder')}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-40" />
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm">
            <option value="all">{t('tasks_filter_category_all')}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm">
            <option value="all">{t('tasks_filter_priority_all')}</option>
            <option value="low">{t('priority_low')}</option>
            <option value="medium">{t('priority_medium')}</option>
            <option value="high">{t('priority_high')}</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm">
            <option value="all">{t('tasks_filter_status_all')}</option>
            <option value="todo">{t('status_todo')}</option>
            <option value="in_progress">{t('status_in_progress')}</option>
            <option value="done">{t('status_done')}</option>
          </select>
          <button onClick={resetFilters} className="text-sm text-accent-600 font-medium hover:text-accent-700">
            {t('tasks_reset_filters')}
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">{t('tasks_none')}</p>
        ) : (
          <div className="flex flex-col">
            {paged.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700 last:border-0 group gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => toggleDone(task)}
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                      task.status === 'done' ? 'bg-accent-500 border-accent-500' : 'border-gray-300 dark:border-gray-600 hover:border-accent-400'
                    }`}>
                    {task.status === 'done' && <CheckCircle className="w-4 h-4 text-white" />}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                        {task.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
                        {task.category || t('tasks_no_category')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.note && <p className="text-xs text-gray-400 truncate">{task.note}</p>}
                      <span className={`text-xs ${isOverdue(task) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {formatDueDate(task)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityStyle[task.priority]}`}>{priorityLabel[task.priority]}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusStyle[task.status]}`}>{statusLabel[task.status]}</span>
                  <button onClick={() => openEdit(task)} title={t('tasks_edit_tooltip')}
                    className="text-gray-300 hover:text-accent-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(task.id)} title={t('tasks_delete_tooltip')}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-gray-700 flex-wrap gap-2">
            <p className="text-xs text-gray-400">
              {t('tasks_pagination_showing', currentPage * PER_PAGE + 1, Math.min((currentPage + 1) * PER_PAGE, filtered.length), filtered.length)}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}
                className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700">
                <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-300" />
              </button>
              {Array.from({ length: pageCount }, (_, i) => i).map((i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`w-7 h-7 rounded-full text-xs font-medium ${
                    currentPage === i ? 'bg-accent-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={currentPage >= pageCount - 1}
                className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700">
                <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t('tasks_edit_title')}</h3>
            <TaskFormFields t={t} form={editForm} setForm={setEditForm} />
            <div className="flex gap-2">
              <button onClick={() => setEditingTask(null)}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg py-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                {t('common_cancel')}
              </button>
              <button onClick={saveEdit}
                className="flex-1 bg-accent-500 text-white rounded-lg py-2 font-semibold hover:bg-accent-600">
                {t('tasks_save')}
              </button>
            </div>
          </div>
        </div>
      )}

      <datalist id="task-category-options">
        {savedCategories.filter((c) => c.type === 'task').map((c) => <option key={c.id} value={c.name} />)}
      </datalist>
    </div>
  );
}

export default Tasks;
