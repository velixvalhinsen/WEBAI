export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUrl?: string; // URL untuk gambar yang di-generate
  isImageGeneration?: boolean; // Flag untuk menandai message sebagai image generation
}

const CHATS_KEY = 'gai_chats';
const API_KEY_KEY = 'gai_api_key';
const CURRENT_CHAT_KEY = 'gai_current_chat';
const PROVIDER_KEY = 'gai_provider';

export const storage = {
  // API Key management
  getApiKey: (): string | null => {
    return localStorage.getItem(API_KEY_KEY);
  },

  setApiKey: (key: string): void => {
    localStorage.setItem(API_KEY_KEY, key);
  },

  removeApiKey: (): void => {
    localStorage.removeItem(API_KEY_KEY);
  },

  // Provider management
  getProvider: (): 'openai' | 'groq' => {
    return (localStorage.getItem(PROVIDER_KEY) as 'openai' | 'groq') || 'groq';
  },

  setProvider: (provider: 'openai' | 'groq'): void => {
    localStorage.setItem(PROVIDER_KEY, provider);
  },

  // Chat management
  getChats: (): Chat[] => {
    try {
      const data = localStorage.getItem(CHATS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveChats: (chats: Chat[]): void => {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  },

  getChat: (id: string): Chat | null => {
    const chats = storage.getChats();
    return chats.find(chat => chat.id === id) || null;
  },

  saveChat: (chat: Chat): void => {
    const chats = storage.getChats();
    const index = chats.findIndex(c => c.id === chat.id);
    if (index >= 0) {
      chats[index] = chat;
    } else {
      chats.push(chat);
    }
    storage.saveChats(chats);
  },

  deleteChat: (id: string): void => {
    const chats = storage.getChats();
    const filtered = chats.filter(c => c.id !== id);
    storage.saveChats(filtered);
  },

  deleteAllChats: (): void => {
    localStorage.removeItem(CHATS_KEY);
    localStorage.removeItem(CURRENT_CHAT_KEY);
  },

  // Current chat
  getCurrentChatId: (): string | null => {
    return localStorage.getItem(CURRENT_CHAT_KEY);
  },

  setCurrentChatId: (id: string | null): void => {
    if (id) {
      localStorage.setItem(CURRENT_CHAT_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_CHAT_KEY);
    }
  },
};

