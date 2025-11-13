import { useState } from 'react';

interface InputBoxProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function InputBox({ onSend, isLoading, disabled }: InputBoxProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 md:px-4 py-3 md:py-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabled ? 'Please set your API key first' : 'Type your message...'}
            className="flex-1 px-3 md:px-4 py-2.5 md:py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading || disabled}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || disabled}
            className="px-4 md:px-6 py-2.5 md:py-2 text-sm md:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation whitespace-nowrap"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

