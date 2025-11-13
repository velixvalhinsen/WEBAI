import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface InputBoxProps {
  onSend: (message: string, imageData?: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  onToast?: (toast: { type: 'success' | 'error' | 'warning' | 'info'; message: string }) => void;
}

export function InputBox({ onSend, isLoading, disabled, onToast }: InputBoxProps) {
  const [input, setInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || uploadedImage) && !isLoading && !disabled) {
      onSend(input, uploadedImage || undefined);
      setInput('');
      setUploadedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user is logged in
    if (!currentUser) {
      if (onToast) {
        onToast({ 
          type: 'warning', 
          message: 'Anda harus login terlebih dahulu untuk mengupload gambar. Silakan login terlebih dahulu.' 
        });
      } else {
        alert('Anda harus login terlebih dahulu untuk mengupload gambar. Silakan login terlebih dahulu.');
      }
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      if (onToast) {
        onToast({ type: 'error', message: 'Please select an image file' });
      } else {
        alert('Please select an image file');
      }
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      if (onToast) {
        onToast({ type: 'error', message: 'Image size should be less than 10MB' });
      } else {
        alert('Image size should be less than 10MB');
      }
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 md:px-4 py-3 md:py-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        {/* Preview uploaded image */}
        {uploadedImage && (
          <div className="mb-2 relative inline-block">
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="max-h-32 max-w-xs rounded-lg border border-gray-300 dark:border-gray-600"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              aria-label="Remove image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="flex gap-2">
          {/* File upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
            disabled={isLoading || disabled}
          />
          <label
            htmlFor="image-upload"
            className={`px-3 py-2.5 md:py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex items-center justify-center ${
              isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Upload image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </label>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabled ? 'Please set your API key first' : uploadedImage ? 'Describe what to do with the image...' : 'Type your message...'}
            className="flex-1 px-3 md:px-4 py-2.5 md:py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading || disabled}
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !uploadedImage) || disabled}
            className="px-4 md:px-6 py-2.5 md:py-2 text-sm md:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation whitespace-nowrap"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

