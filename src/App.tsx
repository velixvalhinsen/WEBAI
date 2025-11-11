import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { APIKeyModal } from './components/APIKeyModal';
import { useChat } from './hooks/useChat';
import { storage } from './utils/localStorage';
import { Provider } from './utils/api';

function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>(storage.getProvider());
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    if (savedKey) {
      setApiKey(savedKey);
      setProvider(savedProvider);
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  const handleSaveApiKey = (key: string, selectedProvider: Provider) => {
    storage.setApiKey(key);
    storage.setProvider(selectedProvider);
    setApiKey(key);
    setProvider(selectedProvider);
    setShowApiKeyModal(false);
  };

  const handleResetApiKey = () => {
    if (confirm('Are you sure you want to reset your API key? You will need to enter it again.')) {
      storage.removeApiKey();
      setApiKey(null);
      setShowApiKeyModal(true);
    }
  };

  const handleSendMessage = (message: string) => {
    if (apiKey) {
      sendMessage(message, apiKey, provider);
    }
  };

  return (
    <div className="flex h-screen bg-chat-darker text-white overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 md:hidden p-2 bg-chat-dark hover:bg-chat-hover rounded-lg border border-chat-border"
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
        onResetApiKey={handleResetApiKey}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-chat-darker border-b border-chat-border flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}Gambar/ChatGPT_Image_Nov_11__2025__07_22_25_AM-removebg-preview.png`}
              alt="GAI Logo"
              className="h-8 w-8 object-contain"
              onError={(e) => {
                // Fallback if image doesn't load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <h1 className="text-lg font-semibold">GAI Chat</h1>
          </div>
          {error && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="flex-1">{error}</span>
              {error.includes('Invalid API key') && (
                <button
                  onClick={handleResetApiKey}
                  className="ml-2 px-2 py-1 text-xs bg-red-800 hover:bg-red-700 rounded transition-colors"
                >
                  Reset Key
                </button>
              )}
            </div>
          )}
        </header>

        {/* Chat Window */}
        <ChatWindow
          chat={currentChat}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={!apiKey}
        />
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <APIKeyModal
          onSave={handleSaveApiKey}
          onClose={apiKey ? () => setShowApiKeyModal(false) : undefined}
        />
      )}
    </div>
  );
}

export default App;

