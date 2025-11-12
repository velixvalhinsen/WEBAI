import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { FirebaseError } from 'firebase/app';
import { isFirebaseConfigured } from '../config/firebase';

type AuthMode = 'login' | 'register';

interface AuthFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export function AuthForm({ onSuccess, onForgotPassword }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup, login } = useAuth();
  const { success, error: showError } = useToast();

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password strength validation
  const isStrongPassword = (password: string): boolean => {
    // At least 6 characters (Firebase minimum)
    return password.length >= 6;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Email validation
      if (!email.trim()) {
        const msg = 'Email wajib diisi';
        showError(msg);
        alert(msg);
        setIsLoading(false);
        return;
      }

      if (!isValidEmail(email)) {
        const msg = 'Format email tidak valid';
        showError(msg);
        alert(msg);
        setIsLoading(false);
        return;
      }

      if (mode === 'register') {
        // Password validation
        if (!password) {
          const msg = 'Password wajib diisi';
          showError(msg);
          alert(msg);
          setIsLoading(false);
          return;
        }

        if (!isStrongPassword(password)) {
          const msg = 'Password minimal 6 karakter';
          showError(msg);
          alert(msg);
          setIsLoading(false);
          return;
        }

        // Confirm password validation
        if (!confirmPassword) {
          const msg = 'Konfirmasi password wajib diisi';
          showError(msg);
          alert(msg);
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          const msg = 'Password tidak sama. Silakan periksa kembali.';
          showError(msg);
          alert(msg);
          setIsLoading(false);
          return;
        }

        await signup(email.trim(), password, displayName.trim() || undefined);
        success('Akun berhasil dibuat! Silakan verifikasi email Anda sebelum login.');
        // Reset form
        setEmail('');
        setPassword('');
        setDisplayName('');
        setConfirmPassword('');
        // Switch to login mode
        setMode('login');
      } else {
        // Login validation
        if (!password) {
          const msg = 'Password wajib diisi';
          showError(msg);
          alert(msg);
          setIsLoading(false);
          return;
        }

        await login(email.trim(), password);
        success('Login berhasil!');
        onSuccess?.();
      }
    } catch (err) {
      const error = err as FirebaseError;
      let errorMessage = 'Terjadi kesalahan';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email sudah digunakan. Silakan gunakan email lain atau login.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Format email tidak valid. Silakan periksa dan coba lagi.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password terlalu lemah. Silakan gunakan minimal 6 karakter.';
          break;
        case 'auth/user-not-found':
          if (mode === 'login') {
            errorMessage = 'Email atau password salah. Silakan periksa dan coba lagi.';
          } else {
            errorMessage = 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.';
          }
          break;
        case 'auth/wrong-password':
          errorMessage = 'Email atau password salah. Silakan periksa dan coba lagi.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Email atau password salah. Silakan periksa dan coba lagi.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Terlalu banyak percobaan gagal. Silakan coba lagi nanti.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Kesalahan jaringan. Silakan periksa koneksi internet Anda.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Akun ini telah dinonaktifkan. Silakan hubungi dukungan.';
          break;
        default:
          errorMessage = error.message || 'Terjadi kesalahan. Silakan coba lagi.';
      }
      
      showError(errorMessage);
      // Also show browser alert for better visibility
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if Firebase is configured
  if (!isFirebaseConfigured()) {
    return (
      <div className="w-full">
        <div className="bg-chat-dark rounded-lg p-4 sm:p-6">
          <div className="text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Firebase Not Configured</h2>
            <p className="text-gray-400 text-sm mb-4">
              Authentication is currently disabled. To enable login/register features:
            </p>
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 text-left mb-4">
              <p className="text-yellow-400 text-sm font-medium mb-2">📝 Setup Instructions:</p>
              <ol className="text-gray-300 text-xs space-y-1 list-decimal list-inside">
                <li>Go to GitHub repository Settings</li>
                <li>Navigate to Secrets and variables → Actions</li>
                <li>Add these 6 secrets:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                    <li>VITE_FIREBASE_API_KEY</li>
                    <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                    <li>VITE_FIREBASE_PROJECT_ID</li>
                    <li>VITE_FIREBASE_STORAGE_BUCKET</li>
                    <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
                    <li>VITE_FIREBASE_APP_ID</li>
                  </ul>
                </li>
                <li>Trigger a new deployment</li>
              </ol>
            </div>
            <a
              href="https://github.com/gimnas11/WEBAI/settings/secrets/actions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Open GitHub Secrets →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-chat-dark rounded-lg p-4 sm:p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-400 text-sm">
              {mode === 'login' 
                ? 'Sign in to continue to G Chat' 
                : 'Sign up to get started with G Chat'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name (Optional)
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-chat-darker border border-chat-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-chat-darker border border-chat-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-chat-darker border border-chat-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={mode === 'login' ? 'Enter your password' : 'At least 6 characters'}
                minLength={mode === 'register' ? 6 : undefined}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-chat-darker border border-chat-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  minLength={6}
                />
              </div>
            )}

            {mode === 'login' && onForgotPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm text-blue-500 hover:text-blue-400 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setEmail('');
                  setPassword('');
                  setDisplayName('');
                  setConfirmPassword('');
                }}
                className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
    </div>
  );
}

