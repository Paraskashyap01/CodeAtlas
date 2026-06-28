import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/leetcode', label: 'LeetCode' },
  { to: '/recommendations', label: 'Recs' },
  { to: '/notes', label: 'Notes' },
  { to: '/goals', label: 'Goals' },
  { to: '/friends', label: 'Friends' },
];

const AppShell = ({ title, subtitle, children }) => {
  const { logout, user } = useAuth();
  const publicSlug = user?.cfHandle || user?.lcHandle || user?.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200/50 bg-gradient-to-r from-white/80 via-slate-50/60 to-blue-50/40 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:items-center md:justify-between lg:px-8">
          {/* Branding */}
          <div className="animate-fade-in-up">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">CP Growth Tracker</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="mt-2 max-w-3xl text-sm text-slate-600 leading-relaxed">{subtitle}</p>}
          </div>

          {/* Navigation & Auth */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Nav Tabs */}
            <nav className="flex flex-wrap gap-0.5 rounded-xl border border-slate-200/60 bg-slate-100/40 p-1.5 backdrop-blur-sm">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {publicSlug && (
                <NavLink
                  to={`/u/${encodeURIComponent(publicSlug)}`}
                  className={({ isActive }) =>
                    `rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                    }`
                  }
                >
                  Public
                </NavLink>
              )}
            </nav>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="btn-secondary border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
};

export default AppShell;
