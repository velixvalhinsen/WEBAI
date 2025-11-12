import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { APIKeyModal } from './components/APIKeyModal';
import { ToastContainer } from './components/ToastContainer';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { UserMenu } from './components/UserMenu';
import { FileManager } from './components/FileManager';
import { useChat } from './hooks/useChat';
import { useToast } from './hooks/useToast';
import { useAuth } from './contexts/AuthContext';
import { storage } from './utils/localStorage';
import { Provider } from './utils/api';

function App() {
  const { currentUser } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>(storage.getProvider());
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'files'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toasts, removeToast, success, error: showErrorToast } = useToast();

  // Debug: Verify File Manager button exists after render
  useEffect(() => {
    const checkButton = () => {
      const btn = document.getElementById('file-manager-button');
      if (btn) {
        console.log('✅ File Manager button FOUND in DOM!', btn);
        console.log('Button styles:', window.getComputedStyle(btn));
      } else {
        console.error('❌ File Manager button NOT FOUND in DOM!');
      }
    };
    // Check immediately and after a short delay
    checkButton();
    setTimeout(checkButton, 100);
  }, []);

  const {
    chats,
    currentChat,
    isLoading,
    error,
    createNewChat,
    selectChat,
    deleteChat,
    renameChat,
    deleteAllChats,
    sendMessage,
  } = useChat();

  // Check for API key on mount
  useEffect(() => {
    const savedKey = storage.getApiKey();
    const savedProvider = storage.getProvider();
    
    // Check if proxy is available (no API key needed)
    const proxyUrl = import.meta.env.VITE_PROXY_URL;
    
    if (savedKey) {
      setApiKey(savedKey);
      setProvider(savedProvider);
    } else if (proxyUrl) {
      // Proxy available, no API key needed
      setApiKey(null);
      setProvider(savedProvider);
    } else {
      // No proxy and no API key, show modal
      setShowApiKeyModal(true);
    }
  }, []);

  // Show toast when error occurs
  useEffect(() => {
    if (error) {
      showErrorToast(error);
    }
  }, [error, showErrorToast]);

  const handleSaveApiKey = (key: string, selectedProvider: Provider) => {
    storage.setApiKey(key);
    storage.setProvider(selectedProvider);
    setApiKey(key);
    setProvider(selectedProvider);
    setShowApiKeyModal(false);
    success('API key saved successfully!');
  };

  const handleSendMessage = (message: string) => {
    // Can send message if API key exists OR proxy is available
    const proxyUrl = import.meta.env.VITE_PROXY_URL;
    if (apiKey || proxyUrl) {
      sendMessage(message, apiKey, provider);
    } else {
      showErrorToast('Please set your API key first');
    }
  };

  const handleCopyCode = () => {
    success('Code copied to clipboard!');
  };

  // Main app - always visible, login via UserMenu
  return (
    <div className="flex h-screen bg-chat-darker text-white overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-3 left-3 z-30 md:hidden p-2.5 bg-chat-dark hover:bg-chat-hover rounded-lg border border-chat-border touch-manipulation"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar - Only show in chat view */}
      {currentView === 'chat' && (
        <Sidebar
          chats={chats}
          currentChatId={currentChat?.id || null}
          onSelectChat={(id) => {
            selectChat(id);
            setSidebarOpen(false);
          }}
          onNewChat={() => {
            createNewChat();
            setSidebarOpen(false);
          }}
          onDeleteChat={deleteChat}
          onRenameChat={renameChat}
          onDeleteAllChats={() => {
            if (confirm('Are you sure you want to delete all chats? This cannot be undone.')) {
              deleteAllChats();
            }
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 sm:h-16 bg-chat-darker border-b border-chat-border flex items-center justify-between pl-14 md:pl-3 sm:pl-4 md:px-6 pr-3 sm:pr-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src={`${import.meta.env.BASE_URL}Gambar/ChatGPT_Image_Nov_11__2025__07_22_25_AM-removebg-preview.png`}
              alt="G Logo"
              className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
              onError={(e) => {
                // Fallback if image doesn't load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <h1 className="text-base sm:text-lg font-semibold">G Chat</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-nowrap">
            {error && currentView === 'chat' && (
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-xs sm:text-sm flex-shrink">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="flex-1 truncate">{error}</span>
              </div>
            )}
            {/* Navigation Buttons */}
            <button
              onClick={() => setCurrentView('chat')}
              className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center gap-2 font-semibold flex-shrink-0 ${
                currentView === 'chat'
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-chat-dark border-chat-border text-gray-300 hover:bg-chat-hover'
              }`}
              title="Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-sm font-bold whitespace-nowrap hidden sm:inline">Chat</span>
            </button>
            {/* File Manager Button - Only show if logged in */}
            {currentUser && (
              <button
                id="file-manager-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('✅ File Manager button clicked!');
                  setCurrentView('files');
                }}
                className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center gap-2 font-semibold flex-shrink-0 ${
                  currentView === 'files'
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-chat-dark border-chat-border text-gray-300 hover:bg-chat-hover'
                }`}
                title="File Manager - Upload ZIP and edit code"
                aria-label="Open File Manager"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-sm font-bold whitespace-nowrap hidden sm:inline">Files</span>
              </button>
            )}
            {/* User Menu */}
            <UserMenu />
          </div>
        </header>

        {/* Content based on current view */}
        {currentView === 'chat' ? (
          <ChatWindow
            chat={currentChat}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            disabled={!apiKey && !import.meta.env.VITE_PROXY_URL}
            onCopyCode={handleCopyCode}
          />
        ) : currentUser ? (
          <FileManager
            onClose={() => setCurrentView('chat')}
            apiKey={apiKey}
            provider={provider}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-4">Please login to access File Manager</p>
              <button
                onClick={() => setCurrentView('chat')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Back to Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <APIKeyModal
          onSave={handleSaveApiKey}
          onClose={apiKey ? () => setShowApiKeyModal(false) : undefined}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

    </div>
  );
}

export default App;

