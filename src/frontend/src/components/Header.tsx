import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Code, Home, Search, PlusSquare, Menu, X, LogIn, User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  const navLinks = [
    { to: '/', icon: PlusSquare, text: 'New Paste' },
    { to: '/search', icon: Search, text: 'Search' },
    { to: '/dashboard', icon: Home, text: 'Dashboard' },
  ];

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center space-x-2 text-xl font-bold text-white">
            <Code className="w-6 h-6 text-indigo-400" />
            <span>Stash</span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4">
            {navLinks.map(link => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                <link.icon className="w-4 h-4 mr-2" /> {link.text}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center">
            {isLoading ? (
              <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-4 text-gray-300">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <a href="/cdn-cgi/access/logout" className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white" title="Logout">
                  <LogOut className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <a href="/login" className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                <LogIn className="w-4 h-4 mr-2" /> Login
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Close main menu' : 'Open main menu'}
            >
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden" id="mobile-menu">
          <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map(link => (
              <NavLink key={link.to} to={link.to} onClick={() => setIsMenuOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                <div className="flex items-center">
                  <link.icon className="w-5 h-5 mr-3" />
                  <span>{link.text}</span>
                </div>
              </NavLink>
            ))}
            <div className="border-t border-gray-700 pt-4 mt-4">
              {isLoading ? (
                <div className="flex items-center px-3 py-2">
                  <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                </div>
              ) : isAuthenticated && user ? (
                <div className="flex items-center justify-between px-3 py-2 text-base font-medium text-white">
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-3" />
                    <span>{user.email}</span>
                  </div>
                  <a href="/cdn-cgi/access/logout" onClick={() => setIsMenuOpen(false)} className="p-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white" title="Logout">
                    <LogOut className="w-5 h-5" />
                  </a>
                </div>
              ) : (
                <a href="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                  <div className="flex items-center">
                    <LogIn className="w-5 h-5 mr-3" />
                    <span>Login</span>
                  </div>
                </a>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
