import { useState, useRef, useEffect } from 'react';

interface InputBoxProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function InputBox({ onSend, isLoading, disabled }: InputBoxProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSend(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-chat-border bg-chat-darker fixed bottom-0 left-0 right-0 md:sticky md:bottom-0 z-20" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-3 sm:p-4">
        <div className="flex flex-row items-center gap-2 sm:gap-3">
          <div className="flex-1 relative w-full">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? 'Please set your API key first' : 'Type your message... (Shift+Enter for new line)'}
              disabled={isLoading || disabled}
              rows={1}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 bg-chat-dark border border-chat-border rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto text-sm sm:text-base min-h-[44px] leading-normal"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading || disabled}
            className="flex-shrink-0 px-4 sm:px-6 h-[44px] sm:h-auto sm:py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="hidden sm:inline">Sending...</span>
                <span className="sm:hidden">Sending</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

