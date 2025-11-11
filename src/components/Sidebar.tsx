import { useState } from 'react';
import { Chat } from '../utils/localStorage';

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  onDeleteAllChats: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onDeleteAllChats,
  isOpen,
  onClose,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (chat: Chat) => {
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-[280px] sm:w-64 bg-chat-darker border-r border-chat-border transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-chat-border flex items-center justify-between gap-2">
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-chat-dark hover:bg-chat-hover text-white rounded-lg transition-colors flex-1 min-h-[44px] touch-manipulation text-sm sm:text-base"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="truncate">New Chat</span>
          </button>
          <button
            onClick={onClose}
            className="md:hidden p-2.5 text-gray-400 hover:text-white touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              No chats yet. Start a new conversation!
            </div>
          ) : (
            <div className="p-2">
              {chats
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((chat) => (
                  <div
                    key={chat.id}
                    className={`group relative mb-1 rounded-lg transition-colors ${
                      currentChatId === chat.id
                        ? 'bg-chat-hover'
                        : 'hover:bg-chat-hover'
                    }`}
                  >
                    {editingId === chat.id ? (
                      <div className="p-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleSaveEdit(chat.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(chat.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                          className="w-full px-2.5 py-2 bg-chat-dark border border-chat-border rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onSelectChat(chat.id)}
                          className="w-full text-left p-3 text-sm text-gray-300 hover:text-white truncate min-h-[44px] touch-manipulation"
                        >
                          {chat.title}
                        </button>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-active:opacity-100 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(chat);
                            }}
                            className="p-2 text-gray-400 hover:text-white rounded touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Rename"
                            aria-label="Rename chat"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteChat(chat.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-400 rounded touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Delete"
                            aria-label="Delete chat"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-chat-border space-y-2">
          {chats.length > 0 && (
            <button
              onClick={onDeleteAllChats}
              className="w-full px-4 py-2.5 sm:py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors text-sm min-h-[44px] touch-manipulation"
            >
              Delete All Chats
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

