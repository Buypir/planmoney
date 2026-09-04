import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, ListTodo, Plus, Trash2 } from 'lucide-react';
import Topbar from '../components/Topbar';

const StatBox = ({ icon: Icon, iconColor, iconBg, label, value }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-3">
    <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  </div>
);

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [filter, setFilter] = useState('all');

  const token = localStorage.getItem('token');

  const fetchTasks = async () => {
    const res = await fetch('http://localhost:3000/tasks', {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    setTasks(await res.json());
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch('http://localhost:3000/tasks', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      const data = await res.json();
      if (active) setTasks(data);
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async () => {
    if (!title) return;
    await fetch('http://localhost:3000/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ title, priority, status }),
    });
    setTitle('');
    fetchTasks();
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:3000/tasks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token },
    });
    fetchTasks();
  };

  const toggleDone = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await fetch(`http://localhost:3000/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ title: task.title, priority: task.priority, status: newStatus }),
    });
    fetchTasks();
  };

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const todo = tasks.filter((t) => t.status === 'todo').length;

  const filtered = tasks.filter((t) => filter === 'all' || t.status === filter);

  const tabs = [
    { key: 'all', label: 'Всі' },
    { key: 'todo', label: 'До виконання' },
    { key: 'in_progress', label: 'В процесі' },
    { key: 'done', label: 'Виконані' },
  ];

  const priorityStyle = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-orange-50 text-orange-600',
    high: 'bg-red-50 text-red-600',
  };
  const priorityLabel = { low: 'Низький', medium: 'Середній', high: 'Високий' };
  const statusStyle = {
    todo: 'bg-blue-50 text-blue-600',
    in_progress: 'bg-purple-50 text-purple-600',
    done: 'bg-green-50 text-green-600',
  };
  const statusLabel = { todo: 'До виконання', in_progress: 'В процесі', done: 'Виконано' };

  return (
    <div>
      <Topbar />

      <h1 className="text-2xl font-bold text-gray-800 mb-1">Задачі</h1>
      <p className="text-gray-400 text-sm mb-6">Організуй свої справи та досягай цілей</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBox icon={ListTodo} iconColor="text-blue-500" iconBg="bg-blue-50" label="Всього" value={total} />
        <StatBox icon={CheckCircle} iconColor="text-green-500" iconBg="bg-green-50" label="Виконані" value={done} />
        <StatBox icon={Clock} iconColor="text-purple-500" iconBg="bg-purple-50" label="В процесі" value={inProgress} />
        <StatBox icon={AlertCircle} iconColor="text-orange-500" iconBg="bg-orange-50" label="До виконання" value={todo} />
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Додати задачу</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm text-gray-600 mb-1">Назва</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full" placeholder="Підготувати звіт" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Пріоритет</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2">
              <option value="low">Низький</option>
              <option value="medium">Середній</option>
              <option value="high">Високий</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Статус</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2">
              <option value="todo">До виконання</option>
              <option value="in_progress">В процесі</option>
              <option value="done">Виконано</option>
            </select>
          </div>
          <button onClick={handleAdd}
            className="flex items-center gap-2 bg-orange-500 text-white rounded-lg px-5 py-2 font-semibold hover:bg-orange-600">
            <Plus className="w-4 h-4" /> Додати
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-gray-700">Мої задачі</h2>
          <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 flex-wrap">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === tab.key ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">Задач немає</p>
        ) : (
          <div className="flex flex-col">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 group">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleDone(t)}
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                      t.status === 'done' ? 'bg-orange-500 border-orange-500' : 'border-gray-300 hover:border-orange-400'
                    }`}>
                    {t.status === 'done' && <CheckCircle className="w-4 h-4 text-white" />}
                  </button>
                  <span className={`text-sm ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {t.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityStyle[t.priority]}`}>{priorityLabel[t.priority]}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusStyle[t.status]}`}>{statusLabel[t.status]}</span>
                  <button onClick={() => handleDelete(t.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Tasks;
