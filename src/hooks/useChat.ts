import { useState, useCallback, useEffect } from 'react';
import { Chat, Message, storage } from '../utils/localStorage';
import { streamChatCompletion, Provider, generateImage, isImageGenerationRequest, extractImagePrompt } from '../utils/api';

export function useChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load chats from localStorage on mount
  useEffect(() => {
    const loadedChats = storage.getChats();
    setChats(loadedChats);

    const currentChatId = storage.getCurrentChatId();
    if (currentChatId) {
      const chat = loadedChats.find(c => c.id === currentChatId);
      if (chat) {
        setCurrentChat(chat);
      }
    }
  }, []);

  const createNewChat = useCallback(() => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats(prev => [...prev, newChat]);
    setCurrentChat(newChat);
    storage.saveChat(newChat);
    storage.setCurrentChatId(newChat.id);
    setError(null);
    return newChat;
  }, []);

  const selectChat = useCallback((chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
      storage.setCurrentChatId(chatId);
      setError(null);
    }
  }, [chats]);

  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    storage.deleteChat(chatId);
    if (currentChat?.id === chatId) {
      setCurrentChat(null);
      storage.setCurrentChatId(null);
    }
  }, [currentChat]);

  const renameChat = useCallback((chatId: string, newTitle: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const updated = { ...chat, title: newTitle, updatedAt: Date.now() };
        storage.saveChat(updated);
        if (currentChat?.id === chatId) {
          setCurrentChat(updated);
        }
        return updated;
      }
      return chat;
    }));
  }, [currentChat]);

  const deleteAllChats = useCallback(() => {
    setChats([]);
    setCurrentChat(null);
    storage.deleteAllChats();
  }, []);

  // Helper function to check if message is asking about owner
  const isOwnerQuestion = (message: string): boolean => {
    const normalized = message.toLowerCase().trim();
    const ownerPatterns = [
      /tentang\s+owner/i,
      /siapa\s+pembuat/i,
      /who\s+made\s+this/i,
      /creator/i,
      /developer/i,
      /pembuat\s+ai/i,
      /pembuat\s+aplikasi/i,
    ];
    return ownerPatterns.some(pattern => pattern.test(normalized));
  };

  // Helper function to check if message is asking about Gimnas
  const isGimnasQuestion = (message: string): boolean => {
    const normalized = message.toLowerCase().trim();
    const gimnasPatterns = [
      /siapa\s+(itu\s+)?gimnas/i,
      /siapakah\s+gimnas/i,
      /gimnas\s+itu\s+siapa/i,
      /who\s+is\s+gimnas/i,
      /what\s+is\s+gimnas/i,
    ];
    return gimnasPatterns.some(pattern => pattern.test(normalized));
  };

  const sendMessage = useCallback(async (content: string, apiKey: string | null, provider: Provider = 'groq') => {
    if (!content.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    // Create new chat if none exists
    let chat = currentChat;
    if (!chat) {
      chat = createNewChat();
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...chat.messages, userMessage];
    const updatedChat: Chat = {
      ...chat,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    setCurrentChat(updatedChat);
    setChats(prev => prev.map(c => c.id === chat.id ? updatedChat : c));
    storage.saveChat(updatedChat);

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    let assistantContent = '';

    try {
      // Check if requesting image generation
      if (isImageGenerationRequest(content)) {
        const imagePrompt = extractImagePrompt(content);
        
        // Show loading message
        const loadingMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: 'Sedang membuat gambar...',
          timestamp: Date.now(),
          isImageGeneration: true,
        };

        const loadingChat: Chat = {
          ...updatedChat,
          messages: [...updatedMessages, loadingMessage],
          updatedAt: Date.now(),
        };

        setCurrentChat(loadingChat);
        setChats(prev => prev.map(c => c.id === chat.id ? loadingChat : c));

        // Generate image
        const result = await generateImage(imagePrompt);
        console.log('[useChat] Image generation result:', result);
        
        if (result.error) {
          // Check if it's a CORS/proxy error
          if (result.error.includes('CORS') || result.error.includes('proxy')) {
            assistantContent = `**Fitur Image Generation Sedang Dalam Pengembangan**\n\nMaaf, fitur pembuatan gambar saat ini belum dapat digunakan karena memerlukan konfigurasi backend proxy khusus untuk mengatasi masalah CORS (Cross-Origin Resource Sharing).\n\n**Penjelasan Teknis:**\n- Hugging Face Inference API tidak mengizinkan request langsung dari browser karena kebijakan CORS\n- Diperlukan backend proxy (Cloudflare Worker atau Vercel) untuk meneruskan request\n- Endpoint `/image` perlu ditambahkan di backend proxy untuk handle image generation\n\n**Solusi:**\n1. Setup backend proxy dengan endpoint image generation\n2. Atau tunggu update berikutnya yang akan menambahkan fitur ini\n\nTerima kasih atas pengertiannya! 🙏`;
          } else {
            assistantContent = `**Gagal membuat gambar**\n\nError: ${result.error}\n\n**Kemungkinan penyebab:**\n- Model sedang loading (coba lagi dalam beberapa detik)\n- Rate limit tercapai\n- Masalah koneksi ke server\n\nSilakan coba lagi nanti.`;
          }
        } else {
          assistantContent = `Gambar berhasil dibuat untuk: "${imagePrompt}"`;
        }

        const imageMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: assistantContent,
          timestamp: Date.now(),
          imageUrl: result.imageUrl || undefined,
          isImageGeneration: true,
        };
        
        console.log('[useChat] Image message created:', {
          id: imageMessage.id,
          hasImageUrl: !!imageMessage.imageUrl,
          imageUrl: imageMessage.imageUrl,
        });

        const imageChat: Chat = {
          ...updatedChat,
          messages: [...updatedMessages, imageMessage],
          updatedAt: Date.now(),
        };

        setCurrentChat(imageChat);
        setChats(prev => prev.map(c => c.id === chat.id ? imageChat : c));
        storage.saveChat(imageChat);
      } else if (isOwnerQuestion(content)) {
        // Check if asking about owner - provide direct response
        assistantContent = 'G Chat dibuat oleh **GimnasIrwandi**. GimnasIrwandi adalah pembuat dan developer dari aplikasi AI Chat ini.';
        
        // Update assistant message immediately
        const directMessages = [...updatedMessages, {
          id: assistantMessageId,
          role: 'assistant' as const,
          content: assistantContent,
          timestamp: Date.now(),
        }];

        const directChat: Chat = {
          ...updatedChat,
          messages: directMessages,
          updatedAt: Date.now(),
        };

        setCurrentChat(directChat);
        setChats(prev => prev.map(c => c.id === chat.id ? directChat : c));
      } else if (isGimnasQuestion(content)) {
        assistantContent = 'Gimnas adalah pembuat AI ini';
        
        // Update assistant message immediately
        const directMessages = [...updatedMessages, {
          id: assistantMessageId,
          role: 'assistant' as const,
          content: assistantContent,
          timestamp: Date.now(),
        }];

        const directChat: Chat = {
          ...updatedChat,
          messages: directMessages,
          updatedAt: Date.now(),
        };

        setCurrentChat(directChat);
        setChats(prev => prev.map(c => c.id === chat.id ? directChat : c));
      } else {
        // Stream response from API
        for await (const chunk of streamChatCompletion(updatedMessages, apiKey, provider, (err) => {
          setError(err.message);
        })) {
          if (chunk.done) break;
          assistantContent += chunk.content;

          // Update assistant message in real-time
          const streamingMessages = [...updatedMessages, {
            id: assistantMessageId,
            role: 'assistant' as const,
            content: assistantContent,
            timestamp: Date.now(),
          }];

          const streamingChat: Chat = {
            ...updatedChat,
            messages: streamingMessages,
            updatedAt: Date.now(),
          };

          setCurrentChat(streamingChat);
          setChats(prev => prev.map(c => c.id === chat.id ? streamingChat : c));
        }
      }

      // Final save
      const finalMessages = [...updatedMessages, {
        id: assistantMessageId,
        role: 'assistant' as const,
        content: assistantContent,
        timestamp: Date.now(),
      }];

      const finalChat: Chat = {
        ...updatedChat,
        messages: finalMessages,
        title: chat.title === 'New Chat' && updatedMessages.length === 1
          ? content.trim().slice(0, 50)
          : chat.title,
        updatedAt: Date.now(),
      };

      setCurrentChat(finalChat);
      setChats(prev => prev.map(c => c.id === chat.id ? finalChat : c));
      storage.saveChat(finalChat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [currentChat, isLoading, createNewChat]);

  return {
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
  };
}

