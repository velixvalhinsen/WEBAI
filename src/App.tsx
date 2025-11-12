import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { APIKeyModal } from './components/APIKeyModal';
import { ToastContainer } from './components/ToastContainer';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { UserMenu } from './components/UserMenu';
import { useChat } from './hooks/useChat';
import { useToast } from './hooks/useToast';
import { storage } from './utils/localStorage';
import { Provider } from './utils/api';

function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>(storage.getProvider());
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toasts, removeToast, success, error: showErrorToast } = useToast();

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

      {/* Sidebar */}
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
          <div className="flex items-center gap-2 sm:gap-3">
            {error && (
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-xs sm:text-sm">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="flex-1 truncate">{error}</span>
              </div>
            )}
            {/* User Menu */}
            <UserMenu />
          </div>
        </header>

        {/* Chat Window */}
        <ChatWindow
          chat={currentChat}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={!apiKey && !import.meta.env.VITE_PROXY_URL}
          onCopyCode={handleCopyCode}
        />
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

