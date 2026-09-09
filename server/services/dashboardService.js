const dayKey = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value.getTime();
};

const mergeCalendars = (calendars = []) => {
  const counts = new Map();
  for (const calendar of calendars) {
    for (const entry of calendar || []) {
      if (!entry?.date) continue;
      counts.set(entry.date, (counts.get(entry.date) || 0) + (entry.count || 1));
    }
  }

  return [...counts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const calculateCurrentStreak = (calendar) => {
  const activeDays = new Set(calendar.map((entry) => dayKey(entry.date)));
  if (!activeDays.size) return 0;

  const current = new Date();
  current.setHours(0, 0, 0, 0);
  if (!activeDays.has(current.getTime())) current.setDate(current.getDate() - 1);

  let streak = 0;
  while (activeDays.has(current.getTime())) {
    streak += 1;
    current.setDate(current.getDate() - 1);
  }
  return streak;
};

export const buildDashboardStats = ({ cfData, lcData }) => {
  const mergedCalendar = mergeCalendars([cfData?.calendar, lcData?.calendar]);
  return {
    currentStreak: calculateCurrentStreak(mergedCalendar),
    mergedCalendar,
    acceptedProblemsByTopic: cfData?.acceptedProblemsByTopic || {},
  };
};