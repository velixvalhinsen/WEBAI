import { useState, useCallback, useEffect } from 'react';
import { Chat, Message, storage } from '../utils/localStorage';
import { streamChatCompletion } from '../utils/api';

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

  const sendMessage = useCallback(async (content: string, apiKey: string) => {
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
      // Stream response
      for await (const chunk of streamChatCompletion(updatedMessages, apiKey, (err) => {
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

