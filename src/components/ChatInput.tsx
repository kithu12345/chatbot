import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';

interface FilePreview {
  file: File;
  preview?: string;
}

interface ChatInputProps {
  onSendMessage: (message: string, files: File[]) => void;
  disabled: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: FilePreview[] = [];

    selectedFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles((prev) => [
            ...prev,
            { file, preview: e.target?.result as string },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        newFiles.push({ file });
      }
    });

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if ((!message.trim() && files.length === 0) || disabled) return;

    onSendMessage(message.trim(), files.map((f) => f.file));
    setMessage('');
    setFiles([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4">
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((filePreview, index) => (
            <div
              key={index}
              className="relative bg-gray-100 rounded-lg p-2 flex items-center gap-2 group"
            >
              {filePreview.preview ? (
                <img
                  src={filePreview.preview}
                  alt={filePreview.file.name}
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                  {filePreview.file.type === 'application/pdf' ? (
                    <FileText className="w-8 h-8 text-gray-500" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-500" />
                  )}
                </div>
              )}
              <div className="max-w-32">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {filePreview.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(filePreview.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={disabled}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            style={{
              minHeight: '48px',
              maxHeight: '200px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = '48px';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={disabled || (!message.trim() && files.length === 0)}
          className="flex-shrink-0 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2 text-center">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
}
