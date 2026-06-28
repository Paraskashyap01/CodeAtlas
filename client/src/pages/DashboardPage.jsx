import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Tooltip, Cell } from 'recharts';

import AppShell from '../components/AppShell.jsx';
import { getProfile, updateHandles } from '../api/auth.js';
import { getCFStats } from '../api/cf.js';
import { getLCStats } from '../api/lc.js';

const difficultyColors = { easy: '#10b981', medium: '#f59e0b', hard: '#f43f5e' };

const DashboardPage = () => {
  const [profile, setProfile] = useState(null);
  const [cfData, setCfData] = useState(null);
  const [lcData, setLcData] = useState(null);
  const [cfHandle, setCfHandle] = useState('');
  const [lcHandle, setLcHandle] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await getProfile();
      setProfile(response.data.user);
      setCfHandle(response.data.user.cfHandle || '');
      setLcHandle(response.data.user.lcHandle || '');
    };
    fetchProfile().catch(console.error);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;
      if (profile.cfHandle) setCfData((await getCFStats()).data);
      if (profile.lcHandle) setLcData((await getLCStats()).data);
    };
    fetchStats().catch(console.error);
  }, [profile]);

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await updateHandles({ cfHandle, lcHandle });
      setProfile(response.data.user);
      setCfHandle(response.data.user.cfHandle || '');
      setLcHandle(response.data.user.lcHandle || '');
      setMessage('Handles saved. Fresh stats will load from the connected profiles.');
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || 'Unable to save handles.');
    }
  };

  const cfRatingSeries = useMemo(
    () =>
      (cfData?.ratingHistory || []).map((r) => ({
        x: new Date(r.ratingUpdateTimeSeconds * 1000).toLocaleDateString(),
        rating: r.newRating,
      })),
    [cfData]
  );

  const cfDifficultyChartData = useMemo(() => {
    const dist = cfData?.difficultyDistribution || {};
    return [
      { name: 'Easy', key: 'easy', value: dist.easy || 0, color: difficultyColors.easy },
      { name: 'Medium', key: 'medium', value: dist.medium || 0, color: difficultyColors.medium },
      { name: 'Hard', key: 'hard', value: dist.hard || 0, color: difficultyColors.hard },
    ];
  }, [cfData]);

  const lcCounts = useMemo(() => {
    const ac = lcData?.stats?.submitStats?.acSubmissionNum;
    if (!ac) return null;
    
    // Handle both array and string cases
    if (Array.isArray(ac)) {
      return {
        easy: ac.find((x) => x.difficulty === 'Easy')?.count ?? 0,
        medium: ac.find((x) => x.difficulty === 'Medium')?.count ?? 0,
        hard: ac.find((x) => x.difficulty === 'Hard')?.count ?? 0,
      };
    }
    
    // If ac is a string, it might be empty or malformed
    return null;
  }, [lcData]);

  const cfCurrentRating = useMemo(() => {
    const ratings = cfData?.ratingHistory || [];
    if (ratings.length === 0) return 0;
    return ratings[ratings.length - 1]?.newRating ?? 0;
  }, [cfData]);

  const today = new Date();
  const yearAgo = new Date(today);
  yearAgo.setFullYear(today.getFullYear() - 1);

  const mergedCalendar = useMemo(() => {
    const counts = new Map();
    const addEntries = (items = []) => {
      for (const item of items || []) {
        if (!item?.date) continue;
        counts.set(item.date, (counts.get(item.date) || 0) + (item.count || 1));
      }
    };

    addEntries(cfData?.calendar);
    addEntries(lcData?.calendar);

    return [...counts.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  }, [cfData, lcData]);

  return (
    <AppShell title="Dashboard" subtitle="Track ratings, solved volume, topic coverage, and daily consistency from Codeforces and LeetCode.">
      <form onSubmit={handleSave} className="panel animate-fade-in-up">
        <h2 className="section-title mb-1">Manage Handles</h2>
        <p className="section-subtitle mb-4">
          Each handle can only be set once and is permanently linked to this account.
        </p>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-2">
              Codeforces Handle {profile?.cfHandle && <span title="Locked">🔒</span>}
            </span>
            <input
              value={cfHandle}
              onChange={(e) => setCfHandle(e.target.value)}
              disabled={Boolean(profile?.cfHandle)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-blue-50/30 transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              placeholder="e.g., tourist"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-2">
              LeetCode Handle {profile?.lcHandle && <span title="Locked">🔒</span>}
            </span>
            <input
              value={lcHandle}
              onChange={(e) => setLcHandle(e.target.value)}
              disabled={Boolean(profile?.lcHandle)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-blue-50/30 transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              placeholder="e.g., neetcode"
            />
          </label>
          <button
            type="submit"
            disabled={Boolean(profile?.cfHandle) && Boolean(profile?.lcHandle)}
            className="btn-primary bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          >
            Save
          </button>
        </div>
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg border text-sm animate-fade-in-up ${
              message.startsWith('Handles saved')
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {message.startsWith('Handles saved') ? '✓' : '✗'} {message}
          </div>
        )}
      </form>

      {/* Stats Grid */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <Link to="/codeforces" className="block">
          <StatCard
            label="CF Problems Solved"
            value={cfData?.solvedCount ?? 0}
            icon="🎯"
            gradient="from-emerald-100 to-emerald-50"
            accentColor="text-emerald-900"
            colorClass="stat-card-emerald"
          />
        </Link>
        <Link to="/codeforces" className="block">
          <StatCard
            label="CF Current Rating"
            value={cfCurrentRating}
            icon="⭐"
            gradient="from-blue-100 to-blue-50"
            accentColor="text-blue-900"
            colorClass="stat-card-blue"
          />
        </Link>
        <Link to="/leetcode" className="block">
          <StatCard
            label="LC Easy / Med / Hard"
            value={lcCounts ? `${lcCounts.easy}/${lcCounts.medium}/${lcCounts.hard}` : 'N/A'}
            icon="📊"
            gradient="from-amber-100 to-amber-50"
            accentColor="text-amber-900"
            colorClass="stat-card-amber"
          />
        </Link>
        <Link to="/leetcode" className="block">
          <StatCard
            label="LC Global Rank"
            value={lcData?.stats?.ranking?.globalRanking ?? 'N/A'}
            icon="🏆"
            gradient="from-rose-100 to-rose-50"
            accentColor="text-rose-900"
            colorClass="stat-card-rose"
          />
        </Link>
      </section>

      {/* Charts Section */}
      <section className="grid gap-6 lg:grid-cols-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="panel-cyan border-0">
          <h2 className="section-title mb-5 flex items-center gap-2">
            📈 Codeforces Rating History
          </h2>
          {cfRatingSeries.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cfRatingSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="x" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                  <Line type="monotone" dataKey="rating" stroke="#0969da" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty text="No rating history yet." />
          )}
        </div>

        <div className="panel-amber border-0">
          <h2 className="section-title mb-5 flex items-center gap-2">
            📊 Difficulty Distribution
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cfDifficultyChartData}>
                <CartesianGrid stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                <YAxis tick={{ fill: '#6b7280' }} />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                  {cfDifficultyChartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Calendar & Weak Topics */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="panel-blue border-0">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="section-title flex items-center gap-2">📅 Submission Calendar</h2>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block"></span> Codeforces + LeetCode (merged)</span>
              <span className="text-slate-400">Darker = more submissions</span>
            </div>
          </div>
          {mergedCalendar.length ? (
            <div className="overflow-x-auto pb-4">
              <CalendarHeatmap
                startDate={yearAgo}
                endDate={today}
                values={mergedCalendar}
                classForValue={(value) => {
                  if (!value) return 'color-empty';
                  if (value.count >= 5) return 'color-scale-4';
                  if (value.count >= 3) return 'color-scale-3';
                  if (value.count >= 2) return 'color-scale-2';
                  return 'color-scale-1';
                }}
              />
            </div>
          ) : (
            <Empty text="Accepted submissions will appear here." />
          )}
        </div>

        <div className="panel-rose border-0">
          <h2 className="section-title mb-5 flex items-center gap-2">
            🔴 Weak Topics
          </h2>
          {cfData?.weakTopics?.length ? (
            <div className="space-y-3">
              {cfData.weakTopics.map((topic, idx) => (
                <div
                  key={topic.tag}
                  className="group rounded-lg border border-slate-200 bg-white p-3.5 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                  style={{ animationDelay: `${0.05 * idx}s` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-900 group-hover:text-slate-800 transition-colors">{topic.tag}</span>
                    <span className="badge-warning">{topic.accuracy}%</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {topic.solved}/{topic.attempts} solved
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="More tagged submissions needed." />
          )}
        </div>
      </section>

      {/* Recent Submissions Table */}
      <div className="panel-emerald border-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <h2 className="section-title mb-5 flex items-center gap-2">
          🚀 Recent Codeforces Submissions
        </h2>
        {cfData?.recentSubmissions?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Problem</th>
                  <th className="px-4 py-3 font-semibold">Rating</th>
                  <th className="px-4 py-3 font-semibold">Verdict</th>
                  <th className="px-4 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {cfData.recentSubmissions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 text-slate-900 font-medium">
                      {s.problemUrl ? (
                        <a
                          href={s.problemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:text-blue-900 hover:underline"
                        >
                          {s.problemName ?? 'Unknown'}
                        </a>
                      ) : (
                        s.problemName ?? 'Unknown'
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.problemRating ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          s.verdict === 'OK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.verdict ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {s.creationTimeSeconds ? new Date(s.creationTimeSeconds * 1000).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="No submission data yet." />
        )}
      </div>
    </AppShell>
  );
};

const StatCard = ({ label, value, icon, gradient, accentColor, colorClass = 'stat-card' }) => (
  <div className={`${colorClass} p-6 hover:shadow-md transition-all duration-300 group`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className={`text-xs font-semibold uppercase tracking-widest group-hover:opacity-80 transition-colors ${
          colorClass.includes('emerald') ? 'text-emerald-700' :
          colorClass.includes('blue') ? 'text-blue-700' :
          colorClass.includes('amber') ? 'text-amber-700' :
          colorClass.includes('rose') ? 'text-rose-700' :
          'text-slate-600'
        }`}>
          {label}
        </p>
        <p className={`mt-3 text-3xl font-bold ${accentColor}`}>{value}</p>
      </div>
      <span className="text-3xl opacity-40 group-hover:opacity-60 transition-opacity">{icon}</span>
    </div>
  </div>
);

const Empty = ({ text }) => (
  <p className="text-sm text-slate-500 text-center py-8">— {text} —</p>
);

export default DashboardPage;
