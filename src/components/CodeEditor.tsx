import { useEffect, useRef, useState } from 'react';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
}

// Lazy load Monaco Editor
let monacoEditor: any = null;
let monacoLoader: Promise<any> | null = null;

const loadMonaco = async (): Promise<any> => {
  if (monacoEditor) return monacoEditor;
  if (monacoLoader) return monacoLoader;
  
  monacoLoader = Promise.race([
    import('monaco-editor'),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Monaco Editor load timeout')), 30000)
    )
  ]).then((monaco: any) => {
    if (monaco && monaco.editor) {
      monacoEditor = monaco;
      return monaco;
    }
    throw new Error('Monaco Editor not properly loaded');
  }).catch((error) => {
    monacoLoader = null; // Reset loader on error
    throw error;
  });
  
  return monacoLoader;
};

const languageMap: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  swift: 'swift',
  kt: 'kotlin',
  scala: 'scala',
  sh: 'shell',
  bash: 'shell',
  yml: 'yaml',
  yaml: 'yaml',
  json: 'json',
  xml: 'xml',
  html: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  md: 'markdown',
  sql: 'sql',
  vue: 'vue',
  svelte: 'svelte',
};

export function CodeEditor({ value, language, onChange }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!editorRef.current) return;

    let editor: any = null;
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    setIsLoading(true);

    // Set timeout to show error if loading takes too long
    timeoutId = setTimeout(() => {
      if (isMounted && isLoading) {
        console.error('Monaco Editor loading timeout - check network or bundle size');
        setIsLoading(false);
      }
    }, 15000);

    loadMonaco()
      .then((monaco) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!editorRef.current || !isMounted) return;

        // Check if monaco.editor exists
        if (!monaco || !monaco.editor || !monaco.editor.create) {
          throw new Error('Monaco Editor API not available');
        }

        // Dispose existing editor if any
        if (editorInstanceRef.current) {
          try {
            editorInstanceRef.current.dispose();
          } catch (e) {
            console.warn('Error disposing editor:', e);
          }
          editorInstanceRef.current = null;
        }

        // Initialize Monaco Editor
        try {
          editor = monaco.editor.create(editorRef.current, {
            value: value || '',
            language: languageMap[language] || language || 'plaintext',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            wordWrap: 'on',
            tabSize: 2,
            insertSpaces: true,
          });

          editorInstanceRef.current = editor;
          
          if (isMounted) {
            setIsLoading(false);
          }

          // Handle content changes
          editor.onDidChangeModelContent(() => {
            if (isMounted && editor) {
              try {
                const newValue = editor.getValue();
                onChange(newValue);
              } catch (e) {
                console.warn('Error getting editor value:', e);
              }
            }
          });
        } catch (createError) {
          console.error('Error creating Monaco Editor:', createError);
          if (isMounted) {
            setIsLoading(false);
          }
          throw createError;
        }
      })
      .catch((error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        console.error('Failed to load Monaco Editor:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (editor) {
        try {
          editor.dispose();
        } catch (e) {
          console.warn('Error disposing editor on cleanup:', e);
        }
      }
    };
  }, [language, isLoading]);

  // Update editor value when prop changes (only if different)
  useEffect(() => {
    if (editorInstanceRef.current && !isLoading) {
      const currentValue = editorInstanceRef.current.getValue();
      if (currentValue !== value) {
        // Preserve cursor position
        const position = editorInstanceRef.current.getPosition();
        editorInstanceRef.current.setValue(value || '');
        if (position) {
          editorInstanceRef.current.setPosition(position);
        }
      }
    }
  }, [value, isLoading]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-chat-darker">
        <div className="text-center text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-sm">Loading editor...</p>
          <p className="text-xs text-gray-500 mt-2">This may take a moment on first load</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={editorRef}
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}

