import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginApi({ email, password });
      login(response.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-950">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-2">CP Tracker</h1>
          <p className="text-zinc-400">Track your competitive programming growth</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/60 to-zinc-800/30 backdrop-blur-sm p-8 shadow-xl animate-fade-in-up">
          <h2 className="text-2xl font-bold text-white mb-6">Sign in</h2>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm animate-fade-in-up">
              ✗ {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-zinc-300 mb-2 block">Email Address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-400/50 focus:bg-zinc-900/80 transition-all duration-200"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-300 mb-2 block">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-400/50 focus:bg-zinc-900/80 transition-all duration-200"
                placeholder="••••••••"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 mt-6"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Link to Register */}
          <p className="mt-6 text-center text-sm text-zinc-400">
            New here?{' '}
            <Link to="/register" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
              Create an account
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-zinc-500">
          Track Codeforces & LeetCode • Get AI recommendations • Level up your skills
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
