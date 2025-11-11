import { useState } from 'react';
import { validateApiKey, Provider } from '../utils/api';
import { storage } from '../utils/localStorage';

interface APIKeyModalProps {
  onSave: (key: string, provider: Provider) => void;
  onClose?: () => void;
}

export function APIKeyModal({ onSave, onClose }: APIKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<Provider>(storage.getProvider());
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
      const result = await validateApiKey(apiKey.trim(), provider);
      if (result.valid) {
        storage.setProvider(provider);
        onSave(apiKey.trim(), provider);
        if (onClose) onClose();
      } else {
        setError(result.error || 'Invalid API key. Please check and try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate API key');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-chat-darker rounded-lg border border-chat-border max-w-md w-full p-4 sm:p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">API Key</h2>
            <p className="text-sm text-gray-400">Enter your API key to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-300 mb-2">
              Provider
            </label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value as Provider);
                setError(null);
              }}
              className="w-full px-4 py-3 bg-chat-dark border border-chat-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="groq">Groq (FREE - Recommended)</option>
              <option value="openai">OpenAI (Paid)</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Groq offers free API access with fast responses. No credit card required!
            </p>
          </div>

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
              placeholder={provider === 'groq' ? 'gsk_...' : 'sk-...'}
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

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="submit"
              disabled={isValidating || !apiKey.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium min-h-[44px] touch-manipulation"
            >
              {isValidating ? 'Validating...' : 'Save & Continue'}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-chat-dark hover:bg-chat-hover text-gray-300 rounded-lg transition-colors min-h-[44px] touch-manipulation"
              >
                Cancel
              </button>
            )}
          </div>
          
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                // Skip validation and save directly
                storage.setProvider(provider);
                onSave(apiKey.trim(), provider);
                if (onClose) onClose();
              }}
              disabled={!apiKey.trim()}
              className="text-xs text-gray-400 hover:text-gray-300 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip validation and save anyway
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-chat-border">
          <p className="text-xs text-gray-500 mb-2">Don't have an API key?</p>
          <div className="space-y-1">
            {provider === 'groq' ? (
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 underline block"
              >
                Get FREE API key from Groq →
              </a>
            ) : (
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 underline block"
              >
                Get your API key from OpenAI →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

