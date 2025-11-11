import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputBox } from './InputBox';
import { Chat } from '../utils/localStorage';

interface ChatWindowProps {
  chat: Chat | null;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  onCopyCode?: () => void;
}

const CHAT_TEMPLATES = [
  { label: 'Build a React todo app', prompt: 'Build a React todo app with TypeScript' },
  { label: 'Debug JavaScript error', prompt: 'Help me debug this JavaScript error' },
  { label: 'Create REST API', prompt: 'Create a REST API with Node.js' },
  { label: 'Explain React hooks', prompt: 'Explain how React hooks work' },
  { label: 'Tentang Owner', prompt: 'Tentang Owner' },
];

export function ChatWindow({ chat, onSendMessage, isLoading, disabled, onCopyCode }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, isLoading]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-dark">
        <div className="text-center text-gray-400 px-4">
          <div className="mb-6 animate-bounce">
            <svg className="w-20 h-20 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg mb-2 font-semibold text-white">Start a new conversation</p>
          <p className="text-sm">Click "New Chat" to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-chat-dark overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-32 md:pb-0">
        {chat.messages.length === 0 ? (
          <div className="min-h-full flex items-center md:items-start justify-center px-3 sm:px-4 py-6 sm:py-8 md:py-12">
            <div className="text-center text-gray-400 max-w-2xl w-full py-4 md:py-0">
              {/* Animated Logo/Icon */}
              <div className="mb-4 sm:mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-full p-4 sm:p-6 animate-pulse">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-2 sm:mb-3">Welcome to G Chat</h2>
              <p className="mb-4 sm:mb-6 text-xs sm:text-sm md:text-base text-gray-300 px-2">
                Your AI programming assistant is ready to help you build, debug, and create amazing projects.
              </p>

              {/* Chat Templates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {CHAT_TEMPLATES.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => !disabled && !isLoading && onSendMessage(template.prompt)}
                    disabled={disabled || isLoading}
                    className="p-3 sm:p-4 bg-chat-darker border border-chat-border rounded-lg hover:bg-chat-hover hover:border-blue-600/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                        {template.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* About Owner */}
              <div className="mt-4 sm:mt-6 md:mt-8 pt-4 sm:pt-6 border-t border-chat-border pb-8 sm:pb-6">
                <p className="text-xs text-gray-500 mb-1.5 sm:mb-2">Tentang Owner</p>
                <p className="text-xs sm:text-sm text-gray-400 break-words px-2">
                  Dibuat oleh <span className="text-blue-400 font-semibold">GimnasIrwandi</span> <span className="text-blue-400">@_gmns</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full px-2 sm:px-4">
            {chat.messages.map((message) => (
              <MessageBubble key={message.id} message={message} onCopyCode={onCopyCode} />
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

