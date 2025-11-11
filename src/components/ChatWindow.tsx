import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputBox } from './InputBox';
import { Chat } from '../utils/localStorage';

interface ChatWindowProps {
  chat: Chat | null;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatWindow({ chat, onSendMessage, isLoading, disabled }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, isLoading]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-dark">
        <div className="text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg mb-2">Start a new conversation</p>
          <p className="text-sm">Click "New Chat" to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-chat-dark overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {chat.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center text-gray-400 max-w-md w-full">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Welcome to G Chat</h2>
              <p className="mb-4 text-sm sm:text-base">Your AI programming assistant is ready to help you build, debug, and create amazing projects.</p>
              <div className="text-left space-y-2 text-xs sm:text-sm">
                <p className="text-gray-500">Try asking:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>"Build a React todo app with TypeScript"</li>
                  <li>"Help me debug this JavaScript error"</li>
                  <li>"Create a REST API with Node.js"</li>
                  <li>"Explain how React hooks work"</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full px-2 sm:px-4">
            {chat.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 bg-chat-dark animate-fade-in">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-chat-border">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-semibold text-gray-300 mb-2">G Assistant</div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <InputBox onSend={onSendMessage} isLoading={isLoading} disabled={disabled} />
    </div>
  );
}

