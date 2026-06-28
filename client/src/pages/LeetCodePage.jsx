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
import { getLCProfile } from '../api/lc.js';

const difficultyColors = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#f43f5e' };

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'submissions', label: 'Submissions', icon: '📝' },
  { id: 'contests', label: 'Contests', icon: '🏆' },
  { id: 'problems', label: 'Problems', icon: '🧩' },
];

const LeetCodePage = () => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    getLCProfile()
      .then((response) => {
        setData(response.data);
        setStatus('ready');
      })
      .catch((error) => {
        console.error(error);
        setStatus(error.response?.data?.message || 'Unable to load LeetCode profile');
      });
  }, []);

  const today = new Date();
  const yearAgo = new Date(today);
  yearAgo.setFullYear(today.getFullYear() - 1);

  const difficultyChartData = useMemo(() => {
    const solved = data?.solvedBreakdown || {};
    const total = data?.totalBreakdown || {};
    return ['Easy', 'Medium', 'Hard'].map((label) => {
      const key = label.toLowerCase();
      return {
        name: label,
        solved: solved[key] || 0,
        total: total[key] || 0,
        color: difficultyColors[label],
      };
    });
  }, [data]);

  const contestRatingSeries = useMemo(
    () =>
      (data?.contestHistory || [])
        .filter((c) => c.attended)
        .map((c) => ({
          x: c.contest?.startTime
            ? new Date(c.contest.startTime * 1000).toLocaleDateString()
            : '',
          rating: Math.round(c.rating),
          title: c.contest?.title,
        })),
    [data]
  );

  return (
    <AppShell
      title="LeetCode"
      subtitle="Deep dive into your LeetCode profile: solved breakdown, submissions, contest history, and topic mastery."
    >
      {status === 'loading' && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-slate-600">Loading LeetCode profile...</p>
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
          {/* Profile header */}
          <div className="panel-violet border-0 flex flex-wrap items-center gap-5">
            {data.profile?.avatar && (
              <img
                src={data.profile.avatar}
                alt={data.handle}
                className="h-16 w-16 rounded-full border-2 border-white shadow-md"
              />
            )}
            <div className="flex-1 min-w-[200px]">
              <h2 className="text-xl font-bold text-slate-900">
                {data.profile?.realName || data.handle}
              </h2>
              <p className="text-sm text-slate-600">@{data.handle}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {data.profile?.contestBadge?.name && (
                <span className="badge-primary">🏅 {data.profile.contestBadge.name}</span>
              )}
              {data.profile?.ranking != null && (
                <span className="badge-success">Rank #{data.profile.ranking.toLocaleString()}</span>
              )}
              <span className="badge-warning">🔥 {data.streak || 0} day streak</span>
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
              difficultyChartData={difficultyChartData}
              yearAgo={yearAgo}
              today={today}
            />
          )}
          {activeTab === 'submissions' && <SubmissionsTab submissions={data.submissions} />}
          {activeTab === 'contests' && (
            <ContestsTab data={data} contestRatingSeries={contestRatingSeries} />
          )}
          {activeTab === 'problems' && <ProblemsTab skills={data.skills} />}
        </div>
      )}
    </AppShell>
  );
};

// --- Overview Tab -----------------------------------------------------------

const OverviewTab = ({ data, difficultyChartData, yearAgo, today }) => (
  <div className="space-y-6">
    {/* Stat cards */}
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Solved"
        value={data.solvedBreakdown?.all ?? 0}
        icon="✅"
        colorClass="stat-card-emerald"
      />
      <StatCard
        label="Contest Rating"
        value={data.contestRanking?.rating ? Math.round(data.contestRanking.rating) : 'N/A'}
        icon="⭐"
        colorClass="stat-card-blue"
      />
      <StatCard
        label="Global Rank"
        value={
          data.contestRanking?.globalRanking
            ? `#${data.contestRanking.globalRanking.toLocaleString()}`
            : 'N/A'
        }
        icon="🏆"
        colorClass="stat-card-amber"
      />
      <StatCard
        label="Active Days"
        value={data.totalActiveDays ?? 0}
        icon="📅"
        colorClass="stat-card-rose"
      />
    </section>

    <section className="grid gap-6 lg:grid-cols-2">
      <div className="panel-amber border-0">
        <h2 className="section-title mb-5 flex items-center gap-2">📊 Difficulty Breakdown</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.solvedBreakdown ? Object.entries({
              Easy: data.solvedBreakdown.easy,
              Medium: data.solvedBreakdown.medium,
              Hard: data.solvedBreakdown.hard,
            }).map(([name, value]) => ({ name, value, color: difficultyColors[name] })) : []}>
              <CartesianGrid stroke="#e5e7eb" />
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
                {difficultyChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel-cyan border-0">
        <h2 className="section-title mb-5 flex items-center gap-2">🎯 Today's Daily Challenge</h2>
        {data.daily ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-900">
                #{data.daily.question?.questionFrontendId} {data.daily.question?.title}
              </h3>
              <span
                className={`badge text-xs ${
                  data.daily.question?.difficulty === 'Easy'
                    ? 'bg-emerald-100 text-emerald-800'
                    : data.daily.question?.difficulty === 'Medium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {data.daily.question?.difficulty}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Acceptance rate: {data.daily.question?.acRate?.toFixed(1)}%
            </p>
            <div className="flex flex-wrap gap-2">
              {(data.daily.question?.topicTags || []).map((tag) => (
                <span key={tag.slug} className="badge-primary text-xs">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <Empty text="Daily challenge unavailable." />
        )}
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

    {data.badges?.length > 0 && (
      <div className="panel-violet border-0">
        <h2 className="section-title mb-5 flex items-center gap-2">🏅 Badges</h2>
        <div className="flex flex-wrap gap-4">
          {data.badges.map((badge) => (
            <div
              key={badge.id}
              className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 w-28 text-center"
            >
              <img
                src={badge.icon?.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`}
                alt={badge.displayName}
                className="h-10 w-10 object-contain"
              />
              <span className="text-xs font-medium text-slate-700">{badge.displayName}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// --- Submissions Tab ---------------------------------------------------------

const statusColor = (statusDisplay) => {
  if (statusDisplay === 'Accepted') return 'bg-emerald-100 text-emerald-800';
  if (statusDisplay?.includes('Error')) return 'bg-slate-200 text-slate-700';
  return 'bg-rose-100 text-rose-800';
};

const SubmissionsTab = ({ submissions }) => (
  <div className="panel-emerald border-0">
    <h2 className="section-title mb-5 flex items-center gap-2">🚀 Recent Submissions</h2>
    {submissions?.length ? (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="px-4 py-3 font-semibold">Problem</th>
              <th className="px-4 py-3 font-semibold">Language</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Runtime</th>
              <th className="px-4 py-3 font-semibold">Memory</th>
              <th className="px-4 py-3 font-semibold">When</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                <td className="px-4 py-3 text-slate-900 font-medium">
                  {s.frontendId ? `#${s.frontendId} ` : ''}
                  {s.title}
                </td>
                <td className="px-4 py-3 text-slate-600">{s.langName || s.lang || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(s.statusDisplay)}`}>
                    {s.statusDisplay ?? '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{s.runtime || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{s.memory || '-'}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {s.timestamp ? new Date(parseInt(s.timestamp, 10) * 1000).toLocaleString() : '-'}
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

// --- Contests Tab -------------------------------------------------------------

const ContestsTab = ({ data, contestRatingSeries }) => (
  <div className="space-y-6">
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Rating"
        value={data.contestRanking?.rating ? Math.round(data.contestRanking.rating) : 'N/A'}
        icon="⭐"
        colorClass="stat-card-blue"
      />
      <StatCard
        label="Global Rank"
        value={
          data.contestRanking?.globalRanking
            ? `#${data.contestRanking.globalRanking.toLocaleString()}`
            : 'N/A'
        }
        icon="🏆"
        colorClass="stat-card-amber"
      />
      <StatCard
        label="Contests Attended"
        value={data.contestRanking?.attendedContestsCount ?? 0}
        icon="🎯"
        colorClass="stat-card-emerald"
      />
      <StatCard
        label="Top Percentage"
        value={data.contestRanking?.topPercentage != null ? `${data.contestRanking.topPercentage}%` : 'N/A'}
        icon="📈"
        colorClass="stat-card-rose"
      />
    </section>

    <div className="panel-cyan border-0">
      <h2 className="section-title mb-5 flex items-center gap-2">📈 Contest Rating History</h2>
      {contestRatingSeries.length ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={contestRatingSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="x" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Line type="monotone" dataKey="rating" stroke="#7c3aed" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Empty text="No contest history yet." />
      )}
    </div>

    <div className="panel-violet border-0">
      <h2 className="section-title mb-5 flex items-center gap-2">🗂️ Contest Log</h2>
      {data.contestHistory?.filter((c) => c.attended).length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="px-4 py-3 font-semibold">Contest</th>
                <th className="px-4 py-3 font-semibold">Rank</th>
                <th className="px-4 py-3 font-semibold">Solved</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">Trend</th>
              </tr>
            </thead>
            <tbody>
              {data.contestHistory
                .filter((c) => c.attended)
                .slice()
                .reverse()
                .map((c, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-4 py-3 text-slate-900 font-medium">{c.contest?.title}</td>
                    <td className="px-4 py-3 text-slate-600">#{c.ranking?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.problemsSolved}/{c.totalProblems}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{Math.round(c.rating)}</td>
                    <td className="px-4 py-3">
                      {c.trendDirection === 'UP' ? (
                        <span className="text-emerald-600">▲</span>
                      ) : (
                        <span className="text-rose-500">▼</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty text="No contests attended yet." />
      )}
    </div>
  </div>
);

// --- Problems / Skills Tab -------------------------------------------------

const skillTierMeta = {
  fundamental: { label: 'Fundamental', panel: 'panel-emerald', badge: 'badge-success' },
  intermediate: { label: 'Intermediate', panel: 'panel-amber', badge: 'badge-warning' },
  advanced: { label: 'Advanced', panel: 'panel-rose', badge: 'badge-danger' },
};

const ProblemsTab = ({ skills }) => {
  const tiers = ['fundamental', 'intermediate', 'advanced'];
  const hasAny = tiers.some((tier) => skills?.[tier]?.length);

  if (!hasAny) {
    return (
      <div className="panel border-0">
        <Empty text="No topic/skill data available yet." />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {tiers.map((tier) => {
        const meta = skillTierMeta[tier];
        const items = (skills?.[tier] || []).slice().sort((a, b) => b.problemsSolved - a.problemsSolved);
        return (
          <div key={tier} className={`${meta.panel} border-0`}>
            <h2 className="section-title mb-5 flex items-center gap-2">{meta.label}</h2>
            {items.length ? (
              <div className="space-y-2.5">
                {items.map((skill, idx) => (
                  <div
                    key={skill.tagSlug}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                    style={{ animationDelay: `${0.03 * idx}s` }}
                  >
                    <span className="text-sm font-medium text-slate-900">{skill.tagName}</span>
                    <span className={`${meta.badge} text-xs`}>{skill.problemsSolved}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="Nothing here yet." />
            )}
          </div>
        );
      })}
    </div>
  );
};

// --- Shared bits -------------------------------------------------------------

const StatCard = ({ label, value, icon, colorClass = 'stat-card' }) => (
  <div className={`${colorClass} p-6 hover:shadow-md transition-all duration-300 group`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p
          className={`text-xs font-semibold uppercase tracking-widest group-hover:opacity-80 transition-colors ${
            colorClass.includes('emerald')
              ? 'text-emerald-700'
              : colorClass.includes('blue')
              ? 'text-blue-700'
              : colorClass.includes('amber')
              ? 'text-amber-700'
              : colorClass.includes('rose')
              ? 'text-rose-700'
              : 'text-slate-600'
          }`}
        >
          {label}
        </p>
        <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <span className="text-3xl opacity-40 group-hover:opacity-60 transition-opacity">{icon}</span>
    </div>
  </div>
);

const Empty = ({ text }) => <p className="text-sm text-slate-500 text-center py-8">— {text} —</p>;

export default LeetCodePage;
