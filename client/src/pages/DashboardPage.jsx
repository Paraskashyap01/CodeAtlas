import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

import AppShell from '../components/AppShell.jsx';
import { getDashboardStats, getProfile } from '../api/auth.js';

const DashboardPage = () => {
  const [profile, setProfile] = useState(null);
  const [cfData, setCfData] = useState(null);
  const [lcData, setLcData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await getProfile();
      setProfile(response.data.user);
    };
    fetchProfile().catch(console.error);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;
      const response = await getDashboardStats();
      setCfData(response.data.cf);
      setLcData(response.data.lc);
      setDashboardData(response.data);
    };
    fetchStats().catch(console.error);
  }, [profile]);

  const today = new Date();
  const yearAgo = new Date(today);
  yearAgo.setFullYear(today.getFullYear() - 1);

  const currentStreak = dashboardData?.currentStreak ?? 0;
  const mergedCalendar = dashboardData?.mergedCalendar || [];

  return (
    <AppShell title="Dashboard" subtitle="Your command centre for competitive programming.">
      {/* ZONE 1: At a glance — Stats + Streak */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 animate-fade-in-up">
        {/* Streak Card */}
        <div className="stat-card-blue p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Current Streak</p>
              <p className="mt-3 text-3xl font-bold text-blue-900">{currentStreak}</p>
              <p className="mt-1 text-xs text-blue-600">days</p>
            </div>
            <span className="text-3xl opacity-40 group-hover:opacity-60 transition-opacity">🔥</span>
          </div>
        </div>

        <Link to="/codeforces" className="block">
          <StatCard
            label="CF Problems Solved"
            value={cfData?.solvedCount ?? 0}
            icon="🎯"
            accentColor="text-emerald-900"
            colorClass="stat-card-emerald"
          />
        </Link>

        <Link to="/codeforces" className="block">
          <StatCard
            label="CF Current Rating"
            value={cfData?.currentRating ?? 0}
            icon="⭐"
            accentColor="text-blue-900"
            colorClass="stat-card-blue"
          />
        </Link>

        <Link to="/leetcode" className="block">
          <StatCard
            label="LC Problems Solved"
            value={lcData?.solvedBreakdown?.all ?? 0}
            icon="✅"
            accentColor="text-amber-900"
            colorClass="stat-card-amber"
          />
        </Link>
      </section>

      {/* ZONE 2: Consistency — Merged Heatmap */}
      <section className="panel-blue border-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="section-title flex items-center gap-2">📅 Submission Heatmap</h2>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block"></span> Codeforces + LeetCode (merged)</span>
            <span className="text-slate-400">Darker = more active</span>
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
      </section>

      {/* ZONE 3: What to do next — Weak Topics + Recommendations */}
      <section className="panel-rose border-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="section-title flex items-center gap-2">🔴 Focus Areas</h2>
          <Link
            to="/recommendations"
            className="text-sm font-medium text-rose-700 hover:text-rose-900 transition-colors underline"
          >
            Get AI Recommendations →
          </Link>
        </div>

        {cfData?.weakTopics?.length ? (
          <div className="space-y-3">
            {cfData.weakTopics.slice(0, 5).map((topic, idx) => (
              <div
                key={topic.tag}
                className="rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                style={{ animationDelay: `${0.05 * idx}s` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-900">{topic.tag}</span>
                  <span className="badge-warning">{topic.accuracy}%</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {topic.solved}/{topic.attempts} solved
                </p>
              </div>
            ))}
          </div>
        ) : (
          <Empty text="More tagged submissions needed." />
        )}
      </section>
    </AppShell>
  );
};

const StatCard = ({ label, value, icon, accentColor, colorClass = 'stat-card' }) => (
  <div className={`${colorClass} p-6 hover:shadow-md transition-all duration-300 group`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className={`text-xs font-semibold uppercase tracking-widest group-hover:opacity-80 transition-colors ${colorClass.includes('emerald') ? 'text-emerald-700' :
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
