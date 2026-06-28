import { useEffect, useMemo, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
  Cell,
} from 'recharts';
import AppShell from '../components/AppShell.jsx';
import { getCFStats } from '../api/cf.js';

const difficultyColors = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#f43f5e' };

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'topics', label: 'Topics', icon: '🏷️' },
  { id: 'contests', label: 'Contests', icon: '🏆' },
  { id: 'submissions', label: 'Submissions', icon: '📝' },
];

const CodeforcesPage = () => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    getCFStats()
      .then((res) => {
        setData(res.data);
        setStatus('ready');
      })
      .catch((err) => {
        setStatus(err.response?.data?.message || 'Unable to load Codeforces profile');
      });
  }, []);

  const today = new Date();
  const yearAgo = new Date(today);
  yearAgo.setFullYear(today.getFullYear() - 1);

  const cfRatingSeries = useMemo(
    () =>
      (data?.ratingHistory || []).map((r) => ({
        x: new Date(r.ratingUpdateTimeSeconds * 1000).toLocaleDateString(),
        rating: r.newRating,
        contestName: r.contestName,
      })),
    [data]
  );

  const currentRating = useMemo(() => {
    const h = data?.ratingHistory || [];
    return h.length ? h[h.length - 1].newRating : 0;
  }, [data]);

  const cfDifficultyData = useMemo(() => {
    const dist = data?.difficultyDistribution || {};
    return [
      { name: 'Easy', value: dist.easy || 0, color: difficultyColors.Easy },
      { name: 'Medium', value: dist.medium || 0, color: difficultyColors.Medium },
      { name: 'Hard', value: dist.hard || 0, color: difficultyColors.Hard },
    ];
  }, [data]);

  return (
    <AppShell
      title="Codeforces"
      subtitle="Deep dive into your Codeforces profile: rating history, topic mastery, contest log, and recent submissions."
    >
      {status === 'loading' && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-slate-600">Loading Codeforces profile...</p>
          </div>
        </div>
      )}

      {status !== 'loading' && status !== 'ready' && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm animate-fade-in-up">
          ✗ {status}
        </div>
      )}

      {data && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Profile Header */}
          <div className="panel-cyan border-0 flex flex-wrap items-center gap-5">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl text-white font-bold shadow-md">
              {(data.handle || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-[200px]">
              <h2 className="text-xl font-bold text-slate-900">{data.handle}</h2>
              <p className="text-sm text-slate-600">Codeforces Handle</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="badge-primary">⭐ Rating: {currentRating}</span>
              <span className="badge-success">✅ {data.solvedCount ?? 0} Solved</span>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex flex-wrap gap-0.5 rounded-xl border border-slate-200/60 bg-slate-100/40 p-1.5 backdrop-blur-sm w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === 'overview' && (
            <OverviewTab
              data={data}
              cfRatingSeries={cfRatingSeries}
              cfDifficultyData={cfDifficultyData}
              currentRating={currentRating}
              yearAgo={yearAgo}
              today={today}
            />
          )}
          {activeTab === 'topics' && <TopicsTab topicStats={data.topicStats} submissions={data.submissions} />}
          {activeTab === 'contests' && <ContestsTab ratingHistory={data.ratingHistory} cfRatingSeries={cfRatingSeries} />}
          {activeTab === 'submissions' && <SubmissionsTab submissions={data.recentSubmissions} />}
        </div>
      )}
    </AppShell>
  );
};

// --- Overview Tab ---
const OverviewTab = ({ data, cfRatingSeries, cfDifficultyData, currentRating, yearAgo, today }) => (
  <div className="space-y-6">
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Problems Solved" value={data.solvedCount ?? 0} icon="✅" colorClass="stat-card-emerald" />
      <StatCard label="Current Rating" value={currentRating} icon="⭐" colorClass="stat-card-blue" />
      <StatCard label="Easy Solved" value={data.difficultyDistribution?.easy ?? 0} icon="🟢" colorClass="stat-card-emerald" />
      <StatCard label="Hard Solved" value={data.difficultyDistribution?.hard ?? 0} icon="🔴" colorClass="stat-card-rose" />
    </section>

    <section className="grid gap-6 lg:grid-cols-2">
      <div className="panel-cyan border-0">
        <h2 className="section-title mb-5 flex items-center gap-2">📈 Rating History</h2>
        {cfRatingSeries.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cfRatingSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="x" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(val, _, props) => [val, props.payload?.contestName || 'Rating']}
                />
                <Line type="monotone" dataKey="rating" stroke="#0969da" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty text="No rating history yet." />
        )}
      </div>

      <div className="panel-amber border-0">
        <h2 className="section-title mb-5 flex items-center gap-2">📊 Difficulty Breakdown</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cfDifficultyData}>
              <CartesianGrid stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
              <YAxis tick={{ fill: '#6b7280' }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                {cfDifficultyData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>

    <div className="panel-blue border-0">
      <h2 className="section-title mb-5 flex items-center gap-2">📅 Submission Calendar</h2>
      {data.calendar?.length ? (
        <div className="overflow-x-auto pb-4">
          <CalendarHeatmap
            startDate={yearAgo}
            endDate={today}
            values={data.calendar}
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
        <Empty text="No submission activity yet." />
      )}
    </div>

    {data.weakTopics?.length > 0 && (
      <div className="panel-rose border-0">
        <h2 className="section-title mb-5 flex items-center gap-2">🔴 Weak Topics</h2>
        <div className="space-y-3">
          {data.weakTopics.map((topic) => (
            <div key={topic.tag} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3.5">
              <span className="font-medium text-slate-900">{topic.tag}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{topic.solved}/{topic.attempts} solved</span>
                <span className="badge-warning">{topic.accuracy}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// --- Topics Tab with clickable sections showing problems ---
const TopicsTab = ({ topicStats = [], submissions = [] }) => {
  const [expandedTopic, setExpandedTopic] = useState(null);

  // Build a map: tag -> list of solved problems (unique)
  const topicProblems = useMemo(() => {
    const map = new Map();
    const seenKeys = new Set();
    for (const sub of (submissions || [])) {
      if (sub.verdict !== 'OK') continue;
      const key = `${sub.contestId}-${sub.problem?.index || sub.problemIndex}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      const tags = Array.isArray(sub.problem?.tags) ? sub.problem.tags : (sub.tags || []);
      const problemName = sub.problem?.name || sub.problemName;
      const contestId = sub.contestId ?? sub.problem?.contestId;
      const index = sub.problem?.index || sub.problemIndex;
      const url = contestId && index ? `https://codeforces.com/problemset/problem/${contestId}/${index}` : null;
      const rating = sub.problem?.rating || sub.problemRating;

      for (const tag of tags) {
        if (!map.has(tag)) map.set(tag, []);
        map.get(tag).push({ key, name: problemName, url, rating, contestId, index });
      }
    }
    return map;
  }, [submissions]);

  if (!topicStats.length) {
    return (
      <div className="panel border-0">
        <Empty text="No topic data available yet." />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Click any topic to see the problems you solved.</p>
      {topicStats.map((topic, idx) => {
        const isOpen = expandedTopic === topic.tag;
        const problems = topicProblems.get(topic.tag) || [];
        return (
          <div key={topic.tag} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm" style={{ animationDelay: `${0.02 * idx}s` }}>
            <button
              onClick={() => setExpandedTopic(isOpen ? null : topic.tag)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50 transition-colors duration-150 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-900">{topic.tag}</span>
                <span className="badge-primary text-xs">{topic.solved} solved</span>
                <span className="text-xs text-slate-500">{topic.attempts} attempts • {topic.accuracy}% accuracy</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, topic.accuracy)}%` }}
                  />
                </div>
                <span className="text-slate-400 text-sm">{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                {problems.length ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {problems.sort((a, b) => (a.rating || 0) - (b.rating || 0)).map((p) => (
                      <div key={p.key} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:border-blue-300 hover:bg-blue-50 transition-all duration-150">
                        <span className="text-sm font-medium text-slate-800 truncate flex-1">
                          {p.url ? (
                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                              {p.name}
                            </a>
                          ) : p.name}
                        </span>
                        {p.rating && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            p.rating < 1200 ? 'bg-emerald-100 text-emerald-700' :
                            p.rating < 1800 ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>{p.rating}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">No problems found for this topic in recent data.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// --- Contests Tab ---
const ContestsTab = ({ ratingHistory = [], cfRatingSeries = [] }) => (
  <div className="space-y-6">
    <div className="panel-cyan border-0">
      <h2 className="section-title mb-5 flex items-center gap-2">📈 Rating History Chart</h2>
      {cfRatingSeries.length ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cfRatingSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="x" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280' }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="rating" stroke="#0969da" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Empty text="No rating history yet." />
      )}
    </div>

    <div className="panel-violet border-0">
      <h2 className="section-title mb-5 flex items-center gap-2">🗂️ Contest Log</h2>
      {ratingHistory.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="px-4 py-3 font-semibold">Contest</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Rank</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">Change</th>
              </tr>
            </thead>
            <tbody>
              {[...ratingHistory].reverse().map((r, idx) => {
                const change = r.newRating - r.oldRating;
                return (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-900 font-medium">{r.contestName}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{new Date(r.ratingUpdateTimeSeconds * 1000).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-600">#{r.rank?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{r.newRating}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${change >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {change >= 0 ? '▲' : '▼'} {Math.abs(change)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty text="No contest history yet." />
      )}
    </div>
  </div>
);

// --- Submissions Tab ---
const SubmissionsTab = ({ submissions = [] }) => (
  <div className="panel-emerald border-0">
    <h2 className="section-title mb-5 flex items-center gap-2">🚀 Recent Submissions</h2>
    {submissions.length ? (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="px-4 py-3 font-semibold">Problem</th>
              <th className="px-4 py-3 font-semibold">Rating</th>
              <th className="px-4 py-3 font-semibold">Tags</th>
              <th className="px-4 py-3 font-semibold">Verdict</th>
              <th className="px-4 py-3 font-semibold">When</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-900 font-medium">
                  {s.problemUrl ? (
                    <a href={s.problemUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                      {s.problemName ?? 'Unknown'}
                    </a>
                  ) : s.problemName ?? 'Unknown'}
                </td>
                <td className="px-4 py-3 text-slate-600">{s.problemRating ?? '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(s.tags || []).slice(0, 3).map((t) => (
                      <span key={t} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${s.verdict === 'OK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {s.verdict === 'OK' ? 'Accepted' : s.verdict ?? '-'}
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
);

const StatCard = ({ label, value, icon, colorClass = 'stat-card' }) => (
  <div className={`${colorClass} p-6 hover:shadow-md transition-all duration-300 group`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className={`text-xs font-semibold uppercase tracking-widest ${
          colorClass.includes('emerald') ? 'text-emerald-700' :
          colorClass.includes('blue') ? 'text-blue-700' :
          colorClass.includes('amber') ? 'text-amber-700' :
          colorClass.includes('rose') ? 'text-rose-700' : 'text-slate-600'
        }`}>{label}</p>
        <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <span className="text-3xl opacity-40 group-hover:opacity-60 transition-opacity">{icon}</span>
    </div>
  </div>
);

const Empty = ({ text }) => <p className="text-sm text-slate-500 text-center py-8">— {text} —</p>;

export default CodeforcesPage;
