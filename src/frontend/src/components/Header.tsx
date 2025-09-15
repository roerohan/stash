import { NavLink } from 'react-router-dom';
import { Code, Home, Search, PlusSquare } from 'lucide-react';

const Header = () => {
  // In a real app, you'd have a way to check auth status
  // const isAuthenticated = false; // Placeholder for future auth logic

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center space-x-2 text-xl font-bold text-white">
            <Code className="w-6 h-6 text-indigo-400" />
            <span>Stash</span>
          </NavLink>
          <nav className="flex items-center space-x-4">
            <NavLink to="/" className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                <PlusSquare className="w-4 h-4 mr-2" /> New Paste
            </NavLink>
            <NavLink to="/search" className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                <Search className="w-4 h-4 mr-2" /> Search
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                <Home className="w-4 h-4 mr-2" /> Dashboard
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
