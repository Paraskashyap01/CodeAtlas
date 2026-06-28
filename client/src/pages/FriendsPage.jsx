import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { api } from '../api/auth.js';

const FriendsPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [message, setMessage] = useState('');

  const loadLeaderboard = async () => {
    const response = await api.get('/friends/leaderboard');
    setLeaderboard(response.data.leaderboard || []);
  };

  useEffect(() => {
    loadLeaderboard().catch(console.error);
  }, []);

  const addFriend = async (userId) => {
    try {
      await api.post('/friends/add', { userId });
      setMessage('Friend added.');
      await loadLeaderboard();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to add friend.');
    }
  };

  return (
    <AppShell title="Friends" subtitle="Browse a simple community leaderboard and add friends to follow their progress.">
      <div className="panel-blue animate-fade-in-up">
        <h2 className="section-title mb-4">🏆 Leaderboard</h2>
        {message && <p className="mb-4 text-sm text-emerald-700">{message}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-3">User</th>
                <th className="py-3">CF Rating</th>
                <th className="py-3">Problems Solved</th>
                <th className="py-3">Friends</th>
                <th className="py-3" />
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-medium">{entry.displayName}</td>
                  <td className="py-3">
                    {entry.cfRating ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {entry.cfRating}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    {entry.cfSolvedCount ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {entry.cfSolvedCount}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 text-slate-600">{entry.friendCount}</td>
                  <td className="py-3 text-right">
                    <button onClick={() => addFriend(entry.id)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors">
                      Add friend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
};

export default FriendsPage;
