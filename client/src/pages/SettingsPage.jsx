import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { getProfile, updateHandles } from '../api/auth.js';

const SettingsPage = () => {
  const [profile, setProfile] = useState(null);
  const [cfHandle, setCfHandle] = useState('');
  const [lcHandle, setLcHandle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getProfile();
        const user = response.data.user;
        setProfile(user);
        setCfHandle(user.cfHandle || '');
        setLcHandle(user.lcHandle || '');
      } catch (err) {
        console.error(err);
        setError('Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const response = await updateHandles({ cfHandle, lcHandle });
      setProfile(response.data.user);
      setMessage('Handles saved successfully.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Unable to save handles.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Settings" subtitle="Configure your Codeforces and LeetCode profiles for dashboard tracking and recommendations.">
      <div className="panel animate-fade-in-up">
        <h2 className="section-title mb-4">Profile Handles</h2>
        {loading ? (
          <div className="space-y-3">
            <div className="h-6 w-48 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-6 w-64 rounded-lg bg-slate-200 animate-pulse" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-2">Codeforces Handle</span>
                <input
                  value={cfHandle}
                  onChange={(e) => setCfHandle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-blue-50/30 transition-all duration-200"
                  placeholder="e.g., tourist"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-2">LeetCode Handle</span>
                <input
                  value={lcHandle}
                  onChange={(e) => setLcHandle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-blue-50/30 transition-all duration-200"
                  placeholder="e.g., neetcode"
                />
              </label>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Set or update your handles here so the app can fetch the latest platform stats and recommendations.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Handles'}
            </button>

            {message && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm">
                {error}
              </div>
            )}
          </form>
        )}
      </div>
    </AppShell>
  );
};

export default SettingsPage;
