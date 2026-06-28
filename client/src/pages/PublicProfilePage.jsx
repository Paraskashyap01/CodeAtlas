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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 px-4 py-8 text-slate-900">
      <main className="mx-auto max-w-5xl">
        {/* Back Link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          ← Sign in to track
        </Link>

        {/* Loading State */}
        {status === 'loading' && (
          <div className="mt-8 flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-slate-500">Loading profile...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status !== 'loading' && status !== 'ready' && (
          <div className="mt-8 rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 animate-fade-in-up">
            <p className="text-lg font-semibold mb-2">Profile Not Found</p>
            <p className="text-sm">{status}</p>
          </div>
        )}

        {/* Profile Content */}
        {data && (
          <div className="animate-fade-in-up">
            {/* Header */}
            <header className="mt-8 pb-8 border-b border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {data.profile.displayName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Competitive Programmer</p>
                  <h1 className="text-4xl font-bold mt-1 text-slate-900">{data.profile.displayName}</h1>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
                {data.profile.cfHandle && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">🔷</span>
                    <span>Codeforces: <strong>{data.profile.cfHandle}</strong></span>
                  </div>
                )}
                {data.profile.lcHandle && (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600">🟨</span>
                    <span>LeetCode: <strong>{data.profile.lcHandle}</strong></span>
                  </div>
                )}
              </div>
            </header>

            {/* Stats Grid */}
            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="stat-card-emerald p-6 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 group-hover:text-emerald-800 transition-colors">
                      Problems Solved
                    </p>
                    <p className="mt-3 text-3xl font-bold text-emerald-900">{data.codeforces?.solvedCount ?? 0}</p>
                  </div>
                  <span className="text-3xl opacity-40 group-hover:opacity-60 transition-opacity">🎯</span>
                </div>
              </div>
              <div className="stat-card-blue p-6 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-blue-700 group-hover:text-blue-800 transition-colors">
                      Rating Updates
                    </p>
                    <p className="mt-3 text-3xl font-bold text-blue-900">{data.codeforces?.ratingHistory?.length ?? 0}</p>
                  </div>
                  <span className="text-3xl opacity-40 group-hover:opacity-60 transition-opacity">📈</span>
                </div>
              </div>
              <div className="stat-card-rose p-6 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-rose-700 group-hover:text-rose-800 transition-colors">
                      Active Days
                    </p>
                    <p className="mt-3 text-3xl font-bold text-rose-900">{data.codeforces?.calendar?.length ?? 0}</p>
                  </div>
                  <span className="text-3xl opacity-40 group-hover:opacity-60 transition-opacity">🔥</span>
                </div>
              </div>
            </section>
            {/* Chart */}
            <section className="mt-8 panel border-slate-200">
              <h2 className="section-title mb-6">📊 Difficulty Distribution</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                    <YAxis tick={{ fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
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
              <p className="text-slate-600 mb-4">Want to track your own growth like this?</p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md shadow-blue-600/20"
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

export default PublicProfilePage;
