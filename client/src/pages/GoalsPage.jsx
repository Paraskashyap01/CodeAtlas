import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { getGoal, saveGoal, updateGoal } from '../api/goals.js';

const GoalsPage = () => {
  const [goal, setGoal] = useState(null);
  const [form, setForm] = useState({ goalDescription: 'Solve 5 graph problems this week', targetCount: 5 });
  const [message, setMessage] = useState('');

  const loadGoal = async () => {
    const response = await getGoal();
    setGoal(response.data.goal);
    if (response.data.goal) {
      setForm({ goalDescription: response.data.goal.goalDescription, targetCount: response.data.goal.targetCount });
    }
  };

  useEffect(() => {
    loadGoal().catch(console.error);
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await saveGoal({ ...form, targetCount: Number(form.targetCount) });
      setGoal(response.data.goal);
      setMessage('Weekly goal saved successfully!');
    } catch (error) {
      console.error(error);
      setMessage('Unable to save goal.');
    }
  };

  const changeProgress = async (delta) => {
    if (!goal) return;
    const nextSolved = Math.max(0, goal.solvedCount + delta);
    const response = await updateGoal(goal._id, { solvedCount: nextSolved });
    setGoal(response.data.goal);
  };

  const pct = goal ? Math.min(100, Math.round((goal.solvedCount / goal.targetCount) * 100)) : 0;

  return (
    <AppShell
      title="Weekly Goals"
      subtitle="Set ambitious targets and track your progress throughout the week."
    >
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] animate-fade-in-up">
        {/* Goal Form */}
        <form onSubmit={handleSave} className="panel border-zinc-700/50">
          <h2 className="section-title mb-5">📝 Set Goal</h2>

          <label className="block mb-4">
            <span className="text-sm font-medium text-zinc-300 mb-2 block">Goal Description</span>
            <input
              value={form.goalDescription}
              onChange={(e) => setForm({ ...form, goalDescription: e.target.value })}
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-4 py-2.5 text-zinc-100 outline-none focus:border-blue-400/50 focus:bg-zinc-900/80 transition-all duration-200"
              placeholder="e.g., Solve 5 DP problems"
              required
            />
          </label>

          <label className="block mb-6">
            <span className="text-sm font-medium text-zinc-300 mb-2 block">Target Count</span>
            <input
              type="number"
              min="1"
              value={form.targetCount}
              onChange={(e) => setForm({ ...form, targetCount: e.target.value })}
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-4 py-2.5 text-zinc-100 outline-none focus:border-blue-400/50 focus:bg-zinc-900/80 transition-all duration-200"
              required
            />
          </label>

          <button type="submit" className="btn-primary w-full bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20">
            Save Goal
          </button>

          {message && (
            <div className="mt-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-sm animate-fade-in-up">
              ✓ {message}
            </div>
          )}
        </form>

        {/* Progress Display */}
        <section className="panel border-zinc-700/50">
          <h2 className="section-title mb-6">🎯 Current Progress</h2>

          {goal ? (
            <div className="space-y-6">
              {/* Goal Title */}
              <div>
                <p className="text-sm text-zinc-400 uppercase tracking-wider mb-2">This Week's Goal</p>
                <p className="text-lg font-semibold text-zinc-100">{goal.goalDescription}</p>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-zinc-400">Progress</span>
                  <span className="text-sm font-semibold text-blue-400">{pct}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-zinc-800/50 border border-zinc-700/50">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      pct >= 100
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        : 'bg-gradient-to-r from-blue-400 to-blue-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-zinc-400">
                  <span className="text-zinc-100 font-semibold">{goal.solvedCount}</span> of{' '}
                  <span className="text-zinc-100 font-semibold">{goal.targetCount}</span> problems solved
                </p>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => changeProgress(-1)}
                  className="btn-secondary flex-1 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/30 hover:border-zinc-600/50"
                >
                  −1
                </button>
                <button
                  onClick={() => changeProgress(1)}
                  className="btn-primary flex-1 bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                >
                  +1 Solved
                </button>
              </div>

              {/* Completion Badge */}
              {goal.done && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center animate-fade-in-up">
                  <p className="text-emerald-200 font-medium">🎉 Goal completed!</p>
                  <p className="text-emerald-300/70 text-sm mt-1">Great work this week!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-500 mb-4">No weekly goal set yet.</p>
              <p className="text-sm text-zinc-600">Create your first goal using the form on the left.</p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default GoalsPage;
