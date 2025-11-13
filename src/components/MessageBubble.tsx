import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';
import { Message } from '../utils/localStorage';

interface MessageBubbleProps {
  message: Message;
  onCopyCode?: () => void;
}

export function MessageBubble({ message, onCopyCode }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Extract code blocks from markdown
  const parseContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        });
      }

      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2],
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  const parts = parseContent(message.content);

  return (
    <div
      className={`flex gap-3 sm:gap-4 p-3 sm:p-4 md:p-5 lg:p-6 transition-all duration-200 hover:bg-opacity-95 message-bubble rounded-lg sm:rounded-xl ${
        isUser 
          ? 'bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-l-4 border-indigo-500 animate-slide-in-right' 
          : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-l-4 border-gray-600 animate-slide-in-left'
      }`}
    >
      {/* Avatar dengan efek glow */}
      <div className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110 ${
        isUser 
          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-indigo-400/50' 
          : 'bg-gradient-to-br from-gray-600 to-gray-700 ring-2 ring-gray-500/50'
      }`}>
        {isUser ? (
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-xs sm:text-sm font-bold mb-2 sm:mb-3 flex items-center gap-2 ${
          isUser ? 'text-indigo-300' : 'text-gray-300'
        }`}>
          <span>{isUser ? 'You' : 'G Assistant'}</span>
          <span className="text-gray-500 text-[10px] sm:text-xs font-normal">
            {new Date(message.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        {/* Display uploaded image (user message) */}
        {isUser && message.uploadedImageUrl && (
          <div className="mb-3 sm:mb-4 rounded-xl overflow-hidden border-2 border-indigo-500/30 shadow-lg hover:shadow-indigo-500/20 transition-shadow duration-300">
            <img
              src={message.uploadedImageUrl}
              alt="Uploaded image"
              className="w-full h-auto max-w-md object-contain"
              onLoad={() => {
                console.log('[MessageBubble] Uploaded image loaded successfully');
              }}
              onError={(e) => {
                console.error('[MessageBubble] Failed to load uploaded image');
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Display edited image (assistant message) */}
        {!isUser && message.editedImageUrl && (
          <div className="mb-3 sm:mb-4 rounded-xl overflow-hidden border-2 border-gray-600/30 shadow-lg hover:shadow-gray-500/20 transition-shadow duration-300">
            <img
              src={message.editedImageUrl}
              alt={message.content || 'Edited image'}
              className="w-full h-auto max-w-md object-contain"
              onLoad={() => {
                console.log('[MessageBubble] Edited image loaded successfully:', message.editedImageUrl);
              }}
              onError={(e) => {
                console.error('[MessageBubble] Failed to load edited image:', message.editedImageUrl);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Display generated image if available */}
        {message.imageUrl && (
          <div className="mb-3 sm:mb-4 rounded-xl overflow-hidden border-2 border-gray-600/30 shadow-lg hover:shadow-gray-500/20 transition-shadow duration-300">
            <img
              src={message.imageUrl}
              alt={message.content || 'Generated image'}
              className="w-full h-auto max-w-full object-contain"
              onLoad={() => {
                console.log('[MessageBubble] Image loaded successfully:', message.imageUrl);
              }}
              onError={(e) => {
                console.error('[MessageBubble] Failed to load image:', message.imageUrl);
                console.error('[MessageBubble] Image error details:', e);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Debug: Show if imageUrl exists but image not displayed */}
        {message.isImageGeneration && !message.imageUrl && (
          <div className="mb-3 sm:mb-4 p-3 bg-yellow-900/30 border-l-4 border-yellow-500 rounded-lg text-yellow-400 text-xs sm:text-sm shadow-md">
            ⚠️ Image URL tidak tersedia
          </div>
        )}
        
        <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
          {parts.map((part, index) => {
            if (part.type === 'code') {
              return (
                <CodeBlock key={index} language={(part as { type: 'code'; content: string; language?: string }).language || 'text'} code={part.content} onCopy={onCopyCode} />
              );
            }
            return (
              <ReactMarkdown
                key={index}
                remarkPlugins={[remarkGfm]}
                className={`leading-relaxed sm:leading-loose ${
                  isUser ? 'text-gray-100' : 'text-gray-200'
                }`}
                components={{
                  p: ({ children }) => <p className="mb-3 sm:mb-4 last:mb-0 text-sm sm:text-base">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-3 sm:mb-4 space-y-1.5 sm:space-y-2 ml-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 sm:mb-4 space-y-1.5 sm:space-y-2 ml-2">{children}</ol>,
                  li: ({ children }) => <li className={`text-sm sm:text-base ${isUser ? 'text-gray-200' : 'text-gray-300'}`}>{children}</li>,
                  strong: ({ children }) => <strong className={`font-bold ${isUser ? 'text-white' : 'text-white'}`}>{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) => {
                    if (inline) {
                      return (
                        <code className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-mono ${
                          isUser 
                            ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-700/50' 
                            : 'bg-gray-900/70 text-blue-400 border border-gray-700/50'
                        }`}>
                          {children}
                        </code>
                      );
                    }
                    return <>{children}</>;
                  },
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`font-medium transition-colors duration-200 ${
                        isUser 
                          ? 'text-indigo-300 hover:text-indigo-200' 
                          : 'text-blue-400 hover:text-blue-300'
                      } underline underline-offset-2`}
                    >
                      {children}
                    </a>
                  ),
                  h1: ({ children }) => <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 mt-4 sm:mt-6 ${isUser ? 'text-white' : 'text-white'}`}>{children}</h1>,
                  h2: ({ children }) => <h2 className={`text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 mt-3 sm:mt-5 ${isUser ? 'text-white' : 'text-white'}`}>{children}</h2>,
                  h3: ({ children }) => <h3 className={`text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 mt-3 sm:mt-4 ${isUser ? 'text-white' : 'text-white'}`}>{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className={`border-l-4 pl-4 sm:pl-6 italic my-3 sm:my-4 py-2 rounded-r-lg ${
                      isUser 
                        ? 'border-indigo-500 bg-indigo-900/20 text-indigo-200' 
                        : 'border-gray-600 bg-gray-800/30 text-gray-400'
                    }`}>
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {part.content}
              </ReactMarkdown>
            );
          })}
        </div>
      </div>
    </div>
  );
}

