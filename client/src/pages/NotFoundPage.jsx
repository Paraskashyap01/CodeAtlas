import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';

const NotFoundPage = () => (
  <AppShell title="Page Not Found" subtitle="The page you are looking for does not exist.">
    <div className="panel-rose text-center animate-fade-in-up">
      <h2 className="section-title mb-4">404</h2>
      <p className="text-slate-700 mb-6">
        We couldn't find that page. Try returning to the dashboard or use the nav above.
      </p>
      <Link to="/dashboard" className="btn-primary bg-blue-600 text-white hover:bg-blue-700">
        Back to Dashboard
      </Link>
    </div>
  </AppShell>
);

export default NotFoundPage;
