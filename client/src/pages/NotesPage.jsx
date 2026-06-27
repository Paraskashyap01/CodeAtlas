import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { createNote, getNotes } from '../api/notes.js';

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ problemId: '', platform: 'codeforces', note: '', revisit: false });
  const [message, setMessage] = useState('');

  const loadNotes = async () => {
    const response = await getNotes();
    setNotes(response.data.notes || []);
  };

  useEffect(() => {
    loadNotes().catch(console.error);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      await createNote(form);
      setForm({ problemId: '', platform: 'codeforces', note: '', revisit: false });
      await loadNotes();
      setMessage('Note saved successfully!');
    } catch (error) {
      console.error(error);
      setMessage('Unable to save note.');
    }
  };

  return (
    <AppShell
      title="Problem Notes"
      subtitle="Keep lightweight review notes for problems that deserve another pass."
    >
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] animate-fade-in-up">
        {/* Form */}
        <form onSubmit={handleSubmit} className="panel border-zinc-700/50">
          <h2 className="section-title mb-5">📝 Add Note</h2>

          <label className="block mb-4">
            <span className="text-sm font-medium text-zinc-300 mb-2 block">Problem ID</span>
            <input
              value={form.problemId}
              onChange={(e) => setForm({ ...form, problemId: e.target.value })}
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-400/50 focus:bg-zinc-900/80 transition-all duration-200"
              placeholder="1791-C or two-sum"
              required
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium text-zinc-300 mb-2 block">Platform</span>
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-4 py-2.5 text-zinc-100 outline-none focus:border-blue-400/50 focus:bg-zinc-900/80 transition-all duration-200"
            >
              <option value="codeforces">Codeforces</option>
              <option value="leetcode">LeetCode</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium text-zinc-300 mb-2 block">Your Notes</span>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-400/50 focus:bg-zinc-900/80 transition-all duration-200 min-h-28 resize-none"
              placeholder="Write your thoughts, hints, or approach here..."
              required
            />
          </label>

          <label className="flex items-center gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={form.revisit}
              onChange={(e) => setForm({ ...form, revisit: e.target.checked })}
              className="w-4 h-4 rounded border border-zinc-700/50 bg-zinc-900/50 cursor-pointer"
            />
            <span className="text-sm text-zinc-300">Mark for revisit</span>
          </label>

          <button type="submit" className="btn-primary w-full bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20">
            Save Note
          </button>

          {message && (
            <div className="mt-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-sm animate-fade-in-up">
              ✓ {message}
            </div>
          )}
        </form>

        {/* Notes List */}
        <section className="panel border-zinc-700/50">
          <h2 className="section-title mb-5">📚 Saved Notes</h2>
          <div className="space-y-3">
            {notes.length ? (
              notes.map((note, idx) => (
                <article
                  key={note._id}
                  className="rounded-lg border border-zinc-700/50 bg-zinc-950/50 p-4 hover:border-zinc-600/50 hover:bg-zinc-900/60 transition-all duration-200"
                  style={{ animationDelay: `${0.05 * idx}s` }}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="font-semibold text-zinc-50">{note.problemId}</h3>
                    <span className="badge-primary text-xs">{note.platform}</span>
                    {note.revisit && (
                      <span className="badge text-xs bg-amber-500/20 text-amber-200">
                        🔖 Revisit
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{note.note}</p>
                  <p className="mt-3 text-xs text-zinc-600">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </article>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-zinc-500 mb-2">No notes yet.</p>
                <p className="text-sm text-zinc-600">Start adding notes to track your problem-solving journey.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default NotesPage;
