import { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { CodeEditor } from './CodeEditor';
import { useToast } from '../hooks/useToast';

interface FileManagerProps {
  onClose: () => void;
  onAskAI?: (question: string, context?: string) => void;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
}

export function FileManager({ onClose, onAskAI }: FileManagerProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      showError('Please upload a ZIP file');
      return;
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

      setFiles(fileTree);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-chat-dark border border-chat-border rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-chat-border">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">File Manager</h2>
            {files.length > 0 && (
              <span className="text-sm text-gray-400">
                {files.length} {files.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
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
                  Upload ZIP
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-chat-hover rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Tree Sidebar */}
          <div className="w-64 border-r border-chat-border overflow-y-auto bg-chat-darker">
            {files.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm">Upload a ZIP file to get started</p>
              </div>
            ) : (
              <div className="p-2">{renderFileTree(files)}</div>
            )}
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col">
            {selectedFile ? (
              <>
                <div className="p-2 border-b border-chat-border bg-chat-darker flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-300">{selectedFile.path}</span>
                  </div>
                  {onAskAI && (
                    <button
                      onClick={() => {
                        const context = `File: ${selectedFile.path}\n\nContent:\n${selectedFile.content?.substring(0, 2000)}...`;
                        onAskAI(`Analyze this file and help me understand it: ${selectedFile.path}`, context);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                      title="Ask AI about this file"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      Ask AI
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    value={selectedFile.content || ''}
                    language={getFileExtension(selectedFile.name)}
                    onChange={(newValue) => {
                      if (selectedFile) {
                        selectedFile.content = newValue;
                        setSelectedFile({ ...selectedFile });
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
        </div>
      </div>
    </div>
  );
}

