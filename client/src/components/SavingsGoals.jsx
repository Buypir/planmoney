import { useState, useEffect } from 'react';
import { Target, Plus, Trash2 } from 'lucide-react';

function SavingsGoals({ onUpdate }) {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const [addingGoal, setAddingGoal] = useState(null);
  const [addAmount, setAddAmount] = useState('');
  const [addError, setAddError] = useState('');

  const token = localStorage.getItem('token');

  const fetchGoals = async () => {
    const res = await fetch('http://localhost:3000/goals', {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    const data = await res.json();
    setGoals(data);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch('http://localhost:3000/goals', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      const data = await res.json();
      if (active) setGoals(data);
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!title || !targetAmount) return;
    await fetch('http://localhost:3000/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ title, targetAmount: Number(targetAmount) }),
    });
    setTitle('');
    setTargetAmount('');
    setShowForm(false);
    fetchGoals();
  };

  const openAddModal = (goal) => {
    setAddingGoal(goal);
    setAddAmount('');
    setAddError('');
  };

  const confirmAdd = async () => {
    setAddError('');
    const amount = Number(addAmount);
    if (!addAmount || isNaN(amount) || amount <= 0) return;

    const res = await fetch(`http://localhost:3000/goals/${addingGoal.id}/add`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();
    if (!res.ok) {
      setAddError(data.error || 'Помилка');
      return;
    }

    setAddingGoal(null);
    setAddAmount('');
    fetchGoals();
    if (onUpdate) onUpdate();
  };

  const handleDelete = async (goalId) => {
    await fetch(`http://localhost:3000/goals/${goalId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token },
    });
    fetchGoals();
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-500" />
          <h2 className="font-semibold text-gray-700">Цілі накопичення</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-orange-600 text-sm font-medium hover:text-orange-700"
        >
          {showForm ? 'Скасувати' : '+ Нова ціль'}
        </button>
      </div>

      {showForm && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Назва (напр. Відпустка)"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-40"
          />
          <input
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="Сума"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28"
          />
          <button
            onClick={handleCreate}
            className="bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-orange-700"
          >
            Створити
          </button>
        </div>
      )}

      {goals.length === 0 ? (
        <p className="text-gray-400 text-sm">Цілей ще немає. Створи першу!</p>
      ) : (
        <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-2">
          {goals.map((goal) => {
            const percent = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100);
            const isComplete = goal.savedAmount >= goal.targetAmount;
            return (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-800 font-medium text-sm">{goal.title}</span>
                  <div className="flex items-center gap-2">
                    {!isComplete && (
                      <button onClick={() => openAddModal(goal)} className="text-green-600 hover:text-green-700" title="Поповнити">
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(goal.id)} className="text-gray-300 hover:text-red-500" title="Видалити">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-lg font-bold text-orange-600">{goal.savedAmount.toLocaleString()} грн</span>
                  <span className="text-gray-400 text-xs mb-0.5">/ {goal.targetAmount.toLocaleString()} грн</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-orange-500'}`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {isComplete ? 'Досягнуто!' : `${percent}%`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {addingGoal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Відкласти на ціль</h3>
            <p className="text-sm text-gray-500 mb-4">{addingGoal.title}</p>

            <label className="block text-sm text-gray-600 mb-1">Сума (грн)</label>
            <input
              type="number"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="1000"
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
            />

            <p className="text-xs text-gray-400 mb-1">
              До цілі залишилось: {(addingGoal.targetAmount - addingGoal.savedAmount).toLocaleString()} грн
            </p>
            <p className="text-xs text-gray-400 mb-3">Ця сума спишеться з твого балансу.</p>

            {addError && <p className="text-red-500 text-sm mb-3">{addError}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setAddingGoal(null)}
                className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 font-medium hover:bg-gray-50"
              >
                Скасувати
              </button>
              <button
                onClick={confirmAdd}
                className="flex-1 bg-orange-600 text-white rounded-lg py-2 font-semibold hover:bg-orange-700"
              >
                Відкласти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SavingsGoals;
