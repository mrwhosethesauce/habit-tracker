import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  if (!token) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-semibold text-indigo-700">
            Habit Tracker
          </Link>
          <Link to="/" className="text-sm text-gray-700 hover:text-indigo-700">
            Dashboard
          </Link>
          <Link to="/analytics" className="text-sm text-gray-700 hover:text-indigo-700">
            Analytics
          </Link>
          <Link to="/guide" className="text-sm text-gray-700 hover:text-indigo-700">
            Guide
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-gray-600">{user.email}</span>}
          <Link to="/settings" className="text-sm text-gray-700 hover:text-indigo-700">
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-700 hover:text-indigo-700"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
