import { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { CodeEditor } from './CodeEditor';
import { MessageBubble } from './MessageBubble';
import { InputBox } from './InputBox';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { fileStorage } from '../utils/fileStorage';
import { streamChatCompletion } from '../utils/api';
import { Provider } from '../utils/api';
import { Message } from '../utils/localStorage';

interface FileManagerProps {
  onClose: () => void;
  onAskAI?: (question: string, context?: string) => void;
  apiKey?: string | null;
  provider?: Provider;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
}

export function FileManager({ onClose, onAskAI, apiKey, provider = 'groq' }: FileManagerProps) {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { success, error: showError } = useToast();

  // Get user ID for storage
  const getUserId = (): string => {
    return currentUser?.uid || 'anonymous';
  };

  // Load files from storage on mount
  useEffect(() => {
    const loadFiles = async () => {
      if (!currentUser) {
        setIsLoadingFiles(false);
        return;
      }

      try {
        setIsLoadingFiles(true);
        const userId = getUserId();
        const savedFiles = await fileStorage.loadFiles(userId);
        
        if (savedFiles && savedFiles.length > 0) {
          setFiles(savedFiles);
          // Don't show toast on initial load to avoid spam
        }

        // Load expanded folders state
        const savedExpanded = fileStorage.loadExpandedFolders(userId);
        setExpandedFolders(savedExpanded);
      } catch (error) {
        console.error('Error loading files:', error);
      } finally {
        setIsLoadingFiles(false);
      }
    };

    loadFiles();
  }, [currentUser?.uid]); // Reload when user changes

  // Save files to storage whenever they change
  useEffect(() => {
    if (files.length > 0 && currentUser && !isLoadingFiles) {
      const saveFiles = async () => {
        try {
          const userId = getUserId();
          await fileStorage.saveFiles(userId, files);
        } catch (error) {
          console.error('Error saving files:', error);
        }
      };

      // Debounce save to avoid too many writes
      const timeoutId = setTimeout(saveFiles, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [files, currentUser?.uid, isLoadingFiles]);

  // Save expanded folders state
  useEffect(() => {
    if (currentUser && expandedFolders.size > 0) {
      const userId = getUserId();
      fileStorage.saveExpandedFolders(userId, expandedFolders);
    }
  }, [expandedFolders, currentUser?.uid]);

  const clearFiles = async () => {
    if (!currentUser) return;
    
    try {
      const userId = getUserId();
      await fileStorage.deleteFiles(userId);
      fileStorage.saveExpandedFolders(userId, new Set());
      setFiles([]);
      setSelectedFile(null);
      setExpandedFolders(new Set());
      success('Files cleared successfully');
    } catch (error) {
      console.error('Error clearing files:', error);
      showError('Failed to clear files');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      showError('Please upload a ZIP file');
      return;
    }

    // Clear existing files before uploading new one
    if (files.length > 0) {
      const userId = getUserId();
      await fileStorage.deleteFiles(userId);
      fileStorage.saveExpandedFolders(userId, new Set());
      setFiles([]);
      setSelectedFile(null);
      setExpandedFolders(new Set());
    }

    setIsLoading(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const fileTree: FileNode[] = [];
      const fileMap = new Map<string, FileNode>();

      // Process all files in ZIP
      for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue; // Skip directories, we'll create them from file paths

        const parts = path.split('/').filter(p => p);
        let currentLevel = fileTree;
        let currentPath = '';

        // Build folder structure
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          currentPath += (currentPath ? '/' : '') + part;
          
          let folder = fileMap.get(currentPath);
          if (!folder) {
            folder = {
              name: part,
              path: currentPath,
              type: 'folder',
              children: []
            };
            fileMap.set(currentPath, folder);
            
            // Find parent folder
            const parentPath = parts.slice(0, i).join('/');
            if (parentPath) {
              const parent = fileMap.get(parentPath);
              if (parent && parent.children) {
                parent.children.push(folder);
              }
            } else {
              // Root level folder
              const existing = currentLevel.find(f => f.name === part && f.type === 'folder');
              if (!existing) {
                currentLevel.push(folder);
              }
            }
          }
          currentLevel = folder.children || [];
        }

        // Add file
        const fileName = parts[parts.length - 1];
        const filePath = path;
        const content = await zipEntry.async('text');
        
        const fileNode: FileNode = {
          name: fileName,
          path: filePath,
          type: 'file',
          content
        };

        if (parts.length === 1) {
          // Root level file
          currentLevel.push(fileNode);
        } else {
          // File in folder
          const parentPath = parts.slice(0, -1).join('/');
          const parent = fileMap.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(fileNode);
          }
        }
      }

      // Sort file tree: folders first, then files, both alphabetically
      const sortFileTree = (nodes: FileNode[]): FileNode[] => {
        return nodes
          .sort((a, b) => {
            // Folders first
            if (a.type !== b.type) {
              return a.type === 'folder' ? -1 : 1;
            }
            // Then alphabetically
            return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          })
          .map(node => {
            if (node.type === 'folder' && node.children) {
              return {
                ...node,
                children: sortFileTree(node.children)
              };
            }
            return node;
          });
      };

      setFiles(sortFileTree(fileTree));
      success('ZIP file extracted successfully!');
    } catch (err) {
      console.error('Error extracting ZIP:', err);
      showError('Failed to extract ZIP file. Please check if it\'s a valid ZIP file.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.path);
      const indent = level * 20;

      if (node.type === 'folder') {
        return (
          <div key={node.path}>
            <div
              className="flex items-center gap-2 py-1 px-2 hover:bg-chat-hover cursor-pointer rounded"
              style={{ paddingLeft: `${indent + 8}px` }}
              onClick={() => toggleFolder(node.path)}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-sm text-gray-300">{node.name}</span>
            </div>
            {isExpanded && node.children && (
              <div>{renderFileTree(node.children, level + 1)}</div>
            )}
          </div>
        );
      } else {
        const isSelected = selectedFile?.path === node.path;
        return (
          <div
            key={node.path}
            className={`flex items-center gap-2 py-1 px-2 hover:bg-chat-hover cursor-pointer rounded ${
              isSelected ? 'bg-blue-900/30' : ''
            }`}
            style={{ paddingLeft: `${indent + 8}px` }}
            onClick={() => setSelectedFile(node)}
          >
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-gray-300">{node.name}</span>
          </div>
        );
      }
    });
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  // Scroll to bottom of AI messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAILoading]);

  const handleAskAI = async (question: string, context?: string) => {
    if (!selectedFile) return;

    const fullQuestion = context 
      ? `${question}\n\nContext:\n${context}` 
      : question;

    // Toggle AI panel open
    if (!showAIPanel) {
      setShowAIPanel(true);
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: fullQuestion,
      timestamp: Date.now(),
    };

    setAiMessages(prev => [...prev, userMessage]);
    setIsAILoading(true);

    try {
      // Stream response
      let assistantContent = '';
      const assistantMessageId = (Date.now() + 1).toString();

      // Prepare messages for streamChatCompletion (system messages are handled internally)
      const messagesForStream: Message[] = [...aiMessages, userMessage];

      for await (const chunk of streamChatCompletion(
        messagesForStream,
        apiKey || null,
        provider,
        (err) => {
          showError(err.message);
        }
      )) {
        if (chunk.done) break;
        assistantContent += chunk.content;

        // Update assistant message in real-time
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: assistantContent,
          timestamp: Date.now(),
        };

        setAiMessages(prev => {
          const withoutLast = prev.slice(0, -1);
          return [...withoutLast, userMessage, assistantMessage];
        });
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      showError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-chat-darker">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-chat-border bg-chat-dark">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">File Manager</h2>
          {files.length > 0 && (
            <span className="text-sm text-gray-400">
              {files.length} {files.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {files.length > 0 && (
            <button
              onClick={clearFiles}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Clear all files"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            title={files.length > 0 ? "Upload new ZIP (will replace current files)" : "Upload ZIP file"}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Extracting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {files.length > 0 ? 'Replace ZIP' : 'Upload ZIP'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        <div className="w-64 border-r border-chat-border overflow-y-auto bg-chat-darker flex-shrink-0">
            {isLoadingFiles ? (
              <div className="p-8 text-center text-gray-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-sm">Loading files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm">Upload a ZIP file to get started</p>
                {currentUser && (
                  <p className="text-xs text-gray-500 mt-2">Only one ZIP file at a time. Files are saved automatically.</p>
                )}
              </div>
            ) : (
              <div className="p-2">{renderFileTree(files)}</div>
            )}
          </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedFile ? (
            <>
              <div className="p-2 border-b border-chat-border bg-chat-darker flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-300">{selectedFile.path}</span>
                </div>
                <button
                  onClick={() => {
                    if (selectedFile) {
                      const context = `File: ${selectedFile.path}\n\nContent:\n${selectedFile.content?.substring(0, 2000)}...`;
                      handleAskAI(`Analyze this file and help me understand it: ${selectedFile.path}`, context);
                    }
                  }}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                  title="Ask AI about this file"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Ask AI
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  value={selectedFile.content || ''}
                  language={getFileExtension(selectedFile.name)}
                  onChange={(newValue) => {
                    if (selectedFile) {
                      // Update file content in the tree
                      const updateFileContent = (nodes: FileNode[]): FileNode[] => {
                        return nodes.map(node => {
                          if (node.path === selectedFile.path && node.type === 'file') {
                            return { ...node, content: newValue };
                          }
                          if (node.children) {
                            return { ...node, children: updateFileContent(node.children) };
                          }
                          return node;
                        });
                      };
                      
                      const updatedFiles = updateFileContent(files);
                      setFiles(updatedFiles);
                      
                      // Update selected file
                      const updatedFile = { ...selectedFile, content: newValue };
                      setSelectedFile(updatedFile);
                    }
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Select a file to edit</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Panel - Toggleable */}
        {showAIPanel && (
          <div className="w-96 border-l border-chat-border bg-chat-dark flex flex-col flex-shrink-0">
            {/* AI Panel Header */}
            <div className="p-3 border-b border-chat-border flex items-center justify-between bg-chat-darker">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
              </div>
              <button
                onClick={() => setShowAIPanel(false)}
                className="p-1 hover:bg-chat-hover rounded transition-colors"
                title="Close AI Panel"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* AI Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {aiMessages.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-sm">Click "Ask AI" to start a conversation</p>
                  {selectedFile && (
                    <p className="text-xs text-gray-500 mt-2">About: {selectedFile.path}</p>
                  )}
                </div>
              ) : (
                <>
                  {aiMessages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {isAILoading && (
                    <div className="flex gap-3 p-3 bg-chat-dark animate-fade-in">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-chat-border">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-300 mb-2">G Assistant</div>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* AI Input */}
            <div className="border-t border-chat-border bg-chat-darker p-3">
              <InputBox
                onSend={(message) => {
                  if (selectedFile) {
                    const context = `File: ${selectedFile.path}\n\nContent:\n${selectedFile.content?.substring(0, 2000)}...`;
                    handleAskAI(message, context);
                  } else {
                    handleAskAI(message);
                  }
                }}
                isLoading={isAILoading}
                disabled={!apiKey && !import.meta.env.VITE_PROXY_URL}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

