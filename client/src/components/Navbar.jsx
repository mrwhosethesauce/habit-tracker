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
          <Link to="/" className="font-semibold text-gray-900">
            Habit Tracker
          </Link>
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <Link to="/analytics" className="text-sm text-gray-600 hover:text-gray-900">
            Analytics
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-gray-500">{user.email}</span>}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
