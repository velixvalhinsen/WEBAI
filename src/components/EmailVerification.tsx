import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';

interface EmailVerificationProps {
  onVerified?: () => void;
}

export function EmailVerification({ onVerified }: EmailVerificationProps) {
  const { currentUser, sendVerificationEmail, isEmailVerified } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    // Allow resend after 60 seconds
    const timer = setTimeout(() => {
      setCanResend(true);
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  const handleResend = async () => {
    if (!canResend) {
      showError('Please wait 60 seconds before resending');
      return;
    }

    setIsSending(true);
    try {
      await sendVerificationEmail();
      setCanResend(false);
      // Reset timer
      setTimeout(() => {
        setCanResend(true);
      }, 60000);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to send verification email');
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckVerification = () => {
    if (currentUser) {
      currentUser.reload().then(() => {
        if (currentUser.emailVerified) {
          success('Email verified successfully!');
          onVerified?.();
        } else {
          showError('Email not yet verified. Please check your inbox.');
        }
      }).catch((err) => {
        showError('Failed to check verification status');
      });
    }
  };

  if (isEmailVerified) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="bg-chat-dark rounded-lg p-4 sm:p-6 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
            <p className="text-gray-400 text-sm mb-4">
              We've sent a verification email to
            </p>
            <p className="text-blue-400 font-medium mb-6 break-all">
              {currentUser?.email}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Please check your inbox and click the verification link to activate your account.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCheckVerification}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              I've Verified My Email
            </button>

            <button
              onClick={handleResend}
              disabled={isSending || !canResend}
              className="w-full py-2.5 px-4 bg-chat-darker hover:bg-chat-hover disabled:bg-chat-darker disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg border border-chat-border transition-colors duration-200"
            >
              {isSending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                canResend ? 'Resend Verification Email' : 'Resend in 60s'
              )}
            </button>
          </div>

          <p className="mt-6 text-gray-500 text-xs">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </div>
    </div>
  );
}

