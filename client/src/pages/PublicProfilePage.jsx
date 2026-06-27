import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getPublicProfile } from '../api/profile.js';

const colors = { easy: '#10b981', medium: '#f59e0b', hard: '#f43f5e' };

const PublicProfilePage = () => {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    getPublicProfile(username)
      .then((response) => {
        setData(response.data);
        setStatus('ready');
      })
      .catch((error) => {
        console.error(error);
        setStatus(error.response?.data?.message || 'Profile unavailable');
      });
  }, [username]);

  const chartData = useMemo(() => {
    const dist = data?.codeforces?.difficultyDistribution || {};
    return [
      { name: 'Easy', key: 'easy', value: dist.easy || 0, color: colors.easy },
      { name: 'Medium', key: 'medium', value: dist.medium || 0, color: colors.medium },
      { name: 'Hard', key: 'hard', value: dist.hard || 0, color: colors.hard },
    ];
  }, [data]);

  return (
    <div className="min-h-screen bg-dark-950 px-4 py-8 text-zinc-100">
      <main className="mx-auto max-w-5xl">
        {/* Back Link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← Sign in to track
        </Link>

        {/* Loading State */}
        {status === 'loading' && (
          <div className="mt-8 flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-3"></div>
              <p className="text-zinc-400">Loading profile...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status !== 'loading' && status !== 'ready' && (
          <div className="mt-8 rounded-lg border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-200 animate-fade-in-up">
            <p className="text-lg font-semibold mb-2">Profile Not Found</p>
            <p className="text-sm">{status}</p>
          </div>
        )}

        {/* Profile Content */}
        {data && (
          <div className="animate-fade-in-up">
            {/* Header */}
            <header className="mt-8 pb-8 border-b border-zinc-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {data.profile.displayName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Competitive Programmer</p>
                  <h1 className="text-4xl font-bold mt-1">{data.profile.displayName}</h1>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-zinc-400">
                {data.profile.cfHandle && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">🔷</span>
                    <span>Codeforces: <strong>{data.profile.cfHandle}</strong></span>
                  </div>
                )}
                {data.profile.lcHandle && (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">🟨</span>
                    <span>LeetCode: <strong>{data.profile.lcHandle}</strong></span>
                  </div>
                )}
              </div>
            </header>

            {/* Stats Grid */}
            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <Stat
                label="Problems Solved"
                value={data.codeforces?.solvedCount ?? 0}
                icon="🎯"
                gradient="from-emerald-500/10 to-emerald-500/5"
                color="text-emerald-400"
              />
              <Stat
                label="Rating Updates"
                value={data.codeforces?.ratingHistory?.length ?? 0}
                icon="📈"
                gradient="from-blue-500/10 to-blue-500/5"
                color="text-blue-400"
              />
              <Stat
                label="Active Days"
                value={data.codeforces?.calendar?.length ?? 0}
                icon="🔥"
                gradient="from-rose-500/10 to-rose-500/5"
                color="text-rose-400"
              />
            </section>

            {/* Chart */}
            <section className="mt-8 panel border-zinc-700/50">
              <h2 className="section-title mb-6">📊 Difficulty Distribution</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fill: '#a1a1aa' }} />
                    <YAxis tick={{ fill: '#a1a1aa' }} />
                    <Tooltip
                      contentStyle={{
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                      {chartData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* CTA */}
            <section className="mt-12 text-center pb-8">
              <p className="text-zinc-400 mb-4">Want to track your own growth like this?</p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20"
              >
                Sign Up & Start Tracking
              </Link>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

const Stat = ({ label, value, icon, gradient, color }) => (
  <div className={`stat-card bg-gradient-to-br ${gradient} border-zinc-700/50 p-6 hover:border-zinc-600 transition-all duration-300 group`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-300 transition-colors">
          {label}
        </p>
        <p className={`mt-3 text-3xl font-bold ${color}`}>{value}</p>
      </div>
      <span className="text-3xl opacity-40 group-hover:opacity-60 transition-opacity">{icon}</span>
    </div>
  </div>
);

export default PublicProfilePage;
