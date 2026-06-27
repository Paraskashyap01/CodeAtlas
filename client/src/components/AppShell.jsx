import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/recommendations', label: 'Recs' },
  { to: '/notes', label: 'Notes' },
  { to: '/goals', label: 'Goals' },
];

const AppShell = ({ title, subtitle, children }) => {
  const { logout, user } = useAuth();
  const publicSlug = user?.cfHandle || user?.lcHandle || user?.email;

  return (
    <div className="min-h-screen bg-dark-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-gradient-to-r from-dark-950 to-dark-950/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:items-center md:justify-between lg:px-8">
          {/* Branding */}
          <div className="animate-fade-in-up">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">CP Growth Tracker</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{title}</h1>
            {subtitle && <p className="mt-2 max-w-3xl text-sm text-zinc-400 leading-relaxed">{subtitle}</p>}
          </div>

          {/* Navigation & Auth */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Nav Tabs */}
            <nav className="flex flex-wrap gap-0.5 rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-1.5 backdrop-blur-sm">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'
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
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'
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
              className="btn-secondary border-zinc-700/50 bg-zinc-800/30 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700/40"
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
