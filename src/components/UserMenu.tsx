import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthForm } from './AuthForm';
import { ForgotPassword } from './ForgotPassword';
import { EmailVerification } from './EmailVerification';

type AuthModalView = 'login' | 'forgot-password' | null;

export function UserMenu() {
  const { currentUser, isEmailVerified, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowMenu(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (currentUser && !isEmailVerified) {
    return (
      <>
        <button
          onClick={() => setAuthModalView('login')}
          className="p-2 bg-yellow-900/30 hover:bg-yellow-900/50 rounded-lg border border-yellow-800 transition-colors relative"
          title="Email not verified"
        >
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"></span>
        </button>

        {authModalView === 'login' && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-chat-dark border border-chat-border rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-chat-border flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Email Verification Required</h3>
                <button
                  onClick={() => setAuthModalView(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <EmailVerification onVerified={() => setAuthModalView(null)} />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 p-2 bg-chat-dark hover:bg-chat-hover rounded-lg border border-chat-border transition-colors"
          aria-label="User menu"
        >
          {currentUser ? (
            <>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs text-gray-300 font-medium">
                  {currentUser.displayName || 'User'}
                </span>
                <span className="text-xs text-gray-500 truncate max-w-[120px]">
                  {currentUser.email}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {currentUser.displayName?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden sm:inline text-sm text-gray-300">Login</span>
            </>
          )}
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-chat-dark border border-chat-border rounded-lg shadow-xl z-50">
            {currentUser ? (
              <div className="py-1">
                <div className="px-4 py-2 border-b border-chat-border">
                  <p className="text-sm font-medium text-white truncate">{currentUser.displayName || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-chat-hover transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            ) : (
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setAuthModalView('login');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-chat-hover transition-colors"
                >
                  Login / Register
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {authModalView && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-chat-dark border border-chat-border rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-chat-border flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">
                {authModalView === 'forgot-password' ? 'Reset Password' : 'Login / Register'}
              </h3>
              <button
                onClick={() => setAuthModalView(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {authModalView === 'forgot-password' ? (
                <ForgotPassword
                  onBack={() => setAuthModalView('login')}
                  onSuccess={() => setAuthModalView(null)}
                />
              ) : (
                <AuthForm
                  onSuccess={() => setAuthModalView(null)}
                  onForgotPassword={() => setAuthModalView('forgot-password')}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

