import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { FirebaseError } from 'firebase/app';

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export function ForgotPassword({ onBack, onSuccess }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const { success, error: showError } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Email validation
    if (!email.trim()) {
      const msg = 'Email wajib diisi';
      showError(msg);
      alert(msg);
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const msg = 'Format email tidak valid';
      showError(msg);
      alert(msg);
      return;
    }
    
    setIsLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
      onSuccess?.();
    } catch (err) {
      const error = err as FirebaseError;
      let errorMessage = 'Terjadi kesalahan';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Email tidak ditemukan. Silakan periksa email Anda atau daftar terlebih dahulu.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Format email tidak valid. Silakan periksa dan coba lagi.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Terlalu banyak permintaan. Silakan coba lagi nanti.';
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

  if (emailSent) {
    return (
      <div className="w-full">
        <div className="bg-chat-dark rounded-lg p-4 sm:p-6 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-gray-400 text-sm mb-4">
                We've sent a password reset link to
              </p>
              <p className="text-blue-400 font-medium mb-6 break-all">
                {email}
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Please check your inbox and follow the instructions to reset your password.
              </p>
            </div>

            <button
              onClick={onBack}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Back to Login
            </button>

            <p className="mt-6 text-gray-500 text-xs">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
        </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-chat-dark rounded-lg p-4 sm:p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-gray-400 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-blue-500 hover:text-blue-400 font-medium text-sm transition-colors"
            >
              ← Back to Login
            </button>
          </div>
        </div>
    </div>
  );
}

