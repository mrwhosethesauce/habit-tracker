import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (!token) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-semibold text-indigo-700 dark:text-indigo-400">
            Habit Tracker
          </Link>
          <Link to="/" className="text-sm text-gray-700 hover:text-indigo-700 dark:text-gray-300 dark:hover:text-indigo-400">
            Dashboard
          </Link>
          <Link to="/analytics" className="text-sm text-gray-700 hover:text-indigo-700 dark:text-gray-300 dark:hover:text-indigo-400">
            Analytics
          </Link>
          <Link to="/guide" className="text-sm text-gray-700 hover:text-indigo-700 dark:text-gray-300 dark:hover:text-indigo-400">
            Guide
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>}
          <Link to="/settings" className="text-sm text-gray-700 hover:text-indigo-700 dark:text-gray-300 dark:hover:text-indigo-400">
            Settings
          </Link>
          <button
            onClick={toggleTheme}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️ Default' : '🌙 Dark'}
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-700 hover:text-indigo-700 dark:text-gray-300 dark:hover:text-indigo-400"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
