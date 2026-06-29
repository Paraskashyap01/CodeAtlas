import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

import AppShell from '../components/AppShell.jsx';
import { getProfile } from '../api/auth.js';
import { getCFStats } from '../api/cf.js';
import { getLCStats } from '../api/lc.js';

const DashboardPage = () => {
  const [profile, setProfile] = useState(null);
  const [cfData, setCfData] = useState(null);
  const [lcData, setLcData] = useState(null);

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
      if (profile.cfHandle) setCfData((await getCFStats()).data);
      if (profile.lcHandle) setLcData((await getLCStats()).data);
    };
    fetchStats().catch(console.error);
  }, [profile]);

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

  // Calculate current streak from merged calendar
  const currentStreak = useMemo(() => {
    const today = new Date();
    const calendar = [];
    
    // Merge CF and LC calendar data
    const counts = new Map();
    const addEntries = (items = []) => {
      for (const item of items || []) {
        if (!item?.date) continue;
        counts.set(item.date, (counts.get(item.date) || 0) + (item.count || 1));
      }
    };

    addEntries(cfData?.calendar);
    addEntries(lcData?.calendar);

    const sortedDates = [...counts.entries()]
      .map(([date]) => new Date(date))
      .sort((a, b) => b.getTime() - a.getTime());

    if (sortedDates.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date(today);
    currentDate.setHours(0, 0, 0, 0);

    for (const dateEntry of sortedDates) {
      const entryDate = new Date(dateEntry);
      entryDate.setHours(0, 0, 0, 0);

      const diffTime = currentDate.getTime() - entryDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak;
  }, [cfData, lcData]);

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
            value={cfCurrentRating}
            icon="⭐"
            accentColor="text-blue-900"
            colorClass="stat-card-blue"
          />
        </Link>

        <Link to="/leetcode" className="block">
          <StatCard
            label="LC Global Rank"
            value={lcData?.stats?.ranking?.globalRanking ?? 'N/A'}
            icon="🏆"
            accentColor="text-rose-900"
            colorClass="stat-card-rose"
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
