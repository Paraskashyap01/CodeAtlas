import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import RecommendationsPage from './pages/RecommendationsPage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import GoalsPage from './pages/GoalsPage.jsx';
import PublicProfilePage from './pages/PublicProfilePage.jsx';
import { useAuth } from './context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, restoring } = useAuth();
  if (restoring)
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-4"></div>
          <p className="text-zinc-300 font-medium">Restoring your session...</p>
          <p className="text-zinc-500 text-sm mt-2">Just a moment</p>
        </div>
      </div>
    );
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
      <Route path="/u/:username" element={<PublicProfilePage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
