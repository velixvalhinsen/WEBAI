import { useState } from 'react';
import { validateApiKey } from '../utils/api';

interface APIKeyModalProps {
  onSave: (key: string) => void;
  onClose?: () => void;
}

export function APIKeyModal({ onSave, onClose }: APIKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const isValid = await validateApiKey(apiKey.trim());
      if (isValid) {
        onSave(apiKey.trim());
        if (onClose) onClose();
      } else {
        setError('Invalid API key. Please check and try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate API key');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-chat-darker rounded-lg border border-chat-border max-w-md w-full p-6 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">OpenAI API Key</h2>
            <p className="text-sm text-gray-400">Enter your API key to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError(null);
              }}
              placeholder="sk-..."
              className="w-full px-4 py-3 bg-chat-dark border border-chat-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isValidating || !apiKey.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {isValidating ? 'Validating...' : 'Save & Continue'}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-chat-dark hover:bg-chat-hover text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-chat-border">
          <p className="text-xs text-gray-500 mb-2">Don't have an API key?</p>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Get your API key from OpenAI →
          </a>
        </div>
      </div>
    </div>
  );
}

