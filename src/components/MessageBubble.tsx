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
      className={`flex gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 animate-fade-in ${
        isUser ? 'bg-chat-darker' : 'bg-chat-dark'
      }`}
    >
      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-chat-border">
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
        <div className="text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">
          {isUser ? 'You' : 'G Assistant'}
        </div>
        
        {/* Display uploaded image (user message) */}
        {isUser && message.uploadedImageUrl && (
          <div className="mb-3 rounded-lg overflow-hidden border border-chat-border">
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
          <div className="mb-3 rounded-lg overflow-hidden border border-chat-border">
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
          <div className="mb-3 rounded-lg overflow-hidden border border-chat-border">
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
          <div className="mb-3 p-2 bg-yellow-900/30 border border-yellow-800 rounded text-yellow-400 text-xs">
            ⚠️ Image URL tidak tersedia
          </div>
        )}
        
        <div className="prose prose-invert prose-sm max-w-none">
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
                className="text-gray-200 leading-relaxed"
                components={{
                  p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-300">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) => {
                    if (inline) {
                      return (
                        <code className="px-1.5 py-0.5 bg-chat-hover text-blue-400 rounded text-sm font-mono">
                          {children}
                        </code>
                      );
                    }
                    return <>{children}</>;
                  },
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      {children}
                    </a>
                  ),
                  h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4 text-white">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-3 text-white">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-3 text-white">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-400 my-4">
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

