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
                <th className="py-3">Friends</th>
                <th className="py-3" />
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 text-slate-700">
                  <td className="py-3">{entry.displayName}</td>
                  <td className="py-3">{entry.friendCount}</td>
                  <td className="py-3 text-right">
                    <button onClick={() => addFriend(entry.id)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
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
