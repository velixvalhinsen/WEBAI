import { useEffect, useRef, useState } from 'react';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
}

// Lazy load Monaco Editor
let monacoEditor: any = null;
let monacoLoader: Promise<any> | null = null;

const loadMonaco = async () => {
  if (monacoEditor) return monacoEditor;
  if (monacoLoader) return monacoLoader;
  
  monacoLoader = import('monaco-editor').then((monaco) => {
    monacoEditor = monaco;
    return monaco;
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

    loadMonaco().then((monaco) => {
      if (!editorRef.current) return;

      // Initialize Monaco Editor
      editor = monaco.editor.create(editorRef.current, {
        value,
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
      setIsLoading(false);

      // Handle content changes
      editor.onDidChangeModelContent(() => {
        const newValue = editor.getValue();
        onChange(newValue);
      });
    });

    return () => {
      if (editor) {
        editor.dispose();
      }
    };
  }, [language]);

  // Update editor value when prop changes
  useEffect(() => {
    if (editorInstanceRef.current && editorInstanceRef.current.getValue() !== value) {
      editorInstanceRef.current.setValue(value);
    }
  }, [value]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-chat-darker">
        <div className="text-center text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-sm">Loading editor...</p>
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

