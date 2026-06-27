import { useEffect, useMemo, useState } from 'react';
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
      setMessage('Handles saved. Fresh stats will load from the connected profiles.');
    } catch (error) {
      console.error(error);
      setMessage('Unable to save handles.');
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
        <h2 className="section-title mb-4">Manage Handles</h2>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="block">
            <span className="block text-sm font-medium text-zinc-300 mb-2">Codeforces Handle</span>
            <input
              value={cfHandle}
              onChange={(e) => setCfHandle(e.target.value)}
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-400/50 focus:bg-zinc-900/80 transition-all duration-200"
              placeholder="e.g., tourist"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-zinc-300 mb-2">LeetCode Handle</span>
            <input
              value={lcHandle}
              onChange={(e) => setLcHandle(e.target.value)}
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-400/50 focus:bg-zinc-900/80 transition-all duration-200"
              placeholder="e.g., neetcode"
            />
          </label>
          <button type="submit" className="btn-primary bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20">
            Save
          </button>
        </div>
        {message && (
          <div className="mt-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-sm animate-fade-in-up">
            ✓ {message}
          </div>
        )}
      </form>

      {/* Stats Grid */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <StatCard
          label="CF Problems Solved"
          value={cfData?.solvedCount ?? 0}
          icon="🎯"
          gradient="from-emerald-500/10 to-emerald-500/5"
          accentColor="text-emerald-400"
        />
        <StatCard
          label="CF Current Rating"
          value={cfCurrentRating}
          icon="⭐"
          gradient="from-blue-500/10 to-blue-500/5"
          accentColor="text-blue-400"
        />
        <StatCard
          label="LC Easy / Med / Hard"
          value={lcCounts ? `${lcCounts.easy}/${lcCounts.medium}/${lcCounts.hard}` : 'N/A'}
          icon="📊"
          gradient="from-amber-500/10 to-amber-500/5"
          accentColor="text-amber-400"
        />
        <StatCard
          label="LC Global Rank"
          value={lcData?.stats?.ranking?.globalRanking ?? 'N/A'}
          icon="🏆"
          gradient="from-rose-500/10 to-rose-500/5"
          accentColor="text-rose-400"
        />
      </section>

      {/* Charts Section */}
      <section className="grid gap-6 lg:grid-cols-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <Panel title="📈 Codeforces Rating History" icon="chart">
          {cfRatingSeries.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cfRatingSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="x" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#a1a1aa' }} />
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }} />
                  <Line type="monotone" dataKey="rating" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty text="No rating history yet." />
          )}
        </Panel>

        <Panel title="📊 Difficulty Distribution" icon="chart">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cfDifficultyChartData}>
                <CartesianGrid stroke="#3f3f46" />
                <XAxis dataKey="name" tick={{ fill: '#a1a1aa' }} />
                <YAxis tick={{ fill: '#a1a1aa' }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                  {cfDifficultyChartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      {/* Calendar & Weak Topics */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <Panel title="📅 Submission Calendar" icon="calendar">
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
        </Panel>

        <Panel title="🔴 Weak Topics" icon="alert">
          {cfData?.weakTopics?.length ? (
            <div className="space-y-3">
              {cfData.weakTopics.map((topic, idx) => (
                <div
                  key={topic.tag}
                  className="group rounded-lg border border-zinc-700/50 bg-zinc-950/50 p-3.5 hover:border-zinc-600/50 hover:bg-zinc-900/60 transition-all duration-200 cursor-pointer"
                  style={{ animationDelay: `${0.05 * idx}s` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-zinc-100 group-hover:text-zinc-50 transition-colors">{topic.tag}</span>
                    <span className="badge-warning">{topic.accuracy}%</span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {topic.solved}/{topic.attempts} solved
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="More tagged submissions needed." />
          )}
        </Panel>
      </section>

      {/* Recent Submissions Table */}
      <Panel title="🚀 Recent Codeforces Submissions" className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        {cfData?.recentSubmissions?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700/50 text-zinc-400">
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
                    className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 text-zinc-100 font-medium">{s.problemName ?? 'Unknown'}</td>
                    <td className="px-4 py-3 text-zinc-400">{s.problemRating ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          s.verdict === 'OK'
                            ? 'bg-emerald-500/20 text-emerald-200'
                            : 'bg-rose-500/20 text-rose-200'
                        }`}
                      >
                        {s.verdict ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
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
      </Panel>
    </AppShell>
  );
};

const StatCard = ({ label, value, icon, gradient, accentColor }) => (
  <div className={`stat-card bg-gradient-to-br ${gradient} border-zinc-700/50 p-6 hover:border-zinc-600 transition-all duration-300 group`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-300 transition-colors">
          {label}
        </p>
        <p className={`mt-3 text-3xl font-bold ${accentColor}`}>{value}</p>
      </div>
      <span className="text-3xl opacity-40 group-hover:opacity-60 transition-opacity">{icon}</span>
    </div>
  </div>
);

const Panel = ({ title, children, className = '', icon }) => (
  <section className={`panel border-zinc-700/50 ${className}`}>
    <h2 className="section-title mb-5 flex items-center gap-2">
      {title}
    </h2>
    {children}
  </section>
);

const Empty = ({ text }) => (
  <p className="text-sm text-zinc-500 text-center py-8">— {text} —</p>
);

export default DashboardPage;
