import { useState, useCallback, useEffect } from 'react';
import { Chat, Message, storage } from '../utils/localStorage';
import { streamChatCompletion, Provider, generateImage, isImageGenerationRequest, extractImagePrompt, isImageEditRequest, detectImageEditType, removeBackground } from '../utils/api';

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

  const sendMessage = useCallback(async (content: string, apiKey: string | null, provider: Provider = 'groq', imageData?: string) => {
    if ((!content.trim() && !imageData) || isLoading) return;

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
      content: content.trim() || (imageData ? 'Edit this image' : ''),
      timestamp: Date.now(),
      uploadedImageUrl: imageData || undefined,
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
      // Check if requesting image editing (has uploaded image)
      if (imageData && isImageEditRequest(content, true)) {
        const editType = detectImageEditType(content);
        
        // Show loading message
        assistantContent = '🖼️ **Memproses gambar...**\n\nSedang memproses permintaan Anda. Mohon tunggu sebentar.';
        
        const loadingMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: assistantContent,
          timestamp: Date.now(),
          imageEditType: editType,
        };

        const loadingChat: Chat = {
          ...updatedChat,
          messages: [...updatedMessages, loadingMessage],
          updatedAt: Date.now(),
        };

        setCurrentChat(loadingChat);
        setChats(prev => prev.map(c => c.id === chat.id ? loadingChat : c));
        storage.saveChat(loadingChat);

        // Process image editing based on type
        if (editType === 'remove-bg') {
          const editResult = await removeBackground(imageData);
          
          if (editResult.error) {
            assistantContent = `❌ **Gagal remove background**\n\n${editResult.error}\n\n**Tips:**\n- Pastikan koneksi internet Anda stabil\n- Coba lagi dalam beberapa saat\n- Jika menggunakan proxy, pastikan proxy sudah dikonfigurasi dengan benar`;
            
            const errorMessage: Message = {
              id: assistantMessageId,
              role: 'assistant',
              content: assistantContent,
              timestamp: Date.now(),
              imageEditType: editType,
            };

            const errorChat: Chat = {
              ...updatedChat,
              messages: [...updatedMessages, errorMessage],
              updatedAt: Date.now(),
            };

            setCurrentChat(errorChat);
            setChats(prev => prev.map(c => c.id === chat.id ? errorChat : c));
            storage.saveChat(errorChat);
          } else if (editResult.imageUrl) {
            assistantContent = `✅ **Background berhasil dihapus!**\n\nGambar Anda sudah tanpa background.`;
            
            const editedMessage: Message = {
              id: assistantMessageId,
              role: 'assistant',
              content: assistantContent,
              timestamp: Date.now(),
              imageEditType: editType,
              editedImageUrl: editResult.imageUrl,
            };

            const editedChat: Chat = {
              ...updatedChat,
              messages: [...updatedMessages, editedMessage],
              updatedAt: Date.now(),
            };

            setCurrentChat(editedChat);
            setChats(prev => prev.map(c => c.id === chat.id ? editedChat : c));
            storage.saveChat(editedChat);
          }
        } else {
          // Other edit types - not implemented yet
          assistantContent = `⚠️ **Fitur belum tersedia**\n\nFitur "${editType}" sedang dalam pengembangan. Saat ini hanya support background removal.`;
          
          const notImplementedMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: assistantContent,
            timestamp: Date.now(),
            imageEditType: editType,
          };

          const notImplementedChat: Chat = {
            ...updatedChat,
            messages: [...updatedMessages, notImplementedMessage],
            updatedAt: Date.now(),
          };

          setCurrentChat(notImplementedChat);
          setChats(prev => prev.map(c => c.id === chat.id ? notImplementedChat : c));
          storage.saveChat(notImplementedChat);
        }
      } else if (isImageGenerationRequest(content)) {
        const imagePrompt = extractImagePrompt(content);
        
        // Show loading message
        assistantContent = '🖼️ **Membuat gambar...**\n\nSedang memproses permintaan Anda. Mohon tunggu sebentar.';
        
        const loadingMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: assistantContent,
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
        storage.saveChat(loadingChat);

        // Generate image
        const imageResult = await generateImage(imagePrompt);
        
        if (imageResult.error) {
          // Show error message
          assistantContent = `❌ **Gagal membuat gambar**\n\n${imageResult.error}\n\n**Tips:**\n- Pastikan koneksi internet Anda stabil\n- Coba lagi dalam beberapa saat\n- Jika menggunakan proxy, pastikan proxy sudah dikonfigurasi dengan benar`;
          
          const errorMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: assistantContent,
            timestamp: Date.now(),
            isImageGeneration: true,
          };

          const errorChat: Chat = {
            ...updatedChat,
            messages: [...updatedMessages, errorMessage],
            updatedAt: Date.now(),
          };

          setCurrentChat(errorChat);
          setChats(prev => prev.map(c => c.id === chat.id ? errorChat : c));
          storage.saveChat(errorChat);
        } else if (imageResult.imageUrl) {
          // Show success message with image
          assistantContent = `✅ **Gambar berhasil dibuat!**\n\nPrompt: "${imagePrompt}"`;
          
          const imageMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: assistantContent,
            timestamp: Date.now(),
            isImageGeneration: true,
            imageUrl: imageResult.imageUrl,
          };

          const imageChat: Chat = {
            ...updatedChat,
            messages: [...updatedMessages, imageMessage],
            updatedAt: Date.now(),
          };

          setCurrentChat(imageChat);
          setChats(prev => prev.map(c => c.id === chat.id ? imageChat : c));
          storage.saveChat(imageChat);
        } else {
          // Fallback error
          assistantContent = '❌ **Gagal membuat gambar**\n\nTerjadi kesalahan yang tidak diketahui. Silakan coba lagi.';
          
          const fallbackMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: assistantContent,
            timestamp: Date.now(),
            isImageGeneration: true,
          };

          const fallbackChat: Chat = {
            ...updatedChat,
            messages: [...updatedMessages, fallbackMessage],
            updatedAt: Date.now(),
          };

          setCurrentChat(fallbackChat);
          setChats(prev => prev.map(c => c.id === chat.id ? fallbackChat : c));
          storage.saveChat(fallbackChat);
        }
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
        storage.saveChat(directChat);
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
        storage.saveChat(directChat);
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

      // Final save (skip if already handled by special cases above)
      const isSpecialCase = isImageGenerationRequest(content) || isOwnerQuestion(content) || isGimnasQuestion(content);
      if (!isSpecialCase) {
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
      }
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

