import { Bot, User, Image as ImageIcon, FileText } from 'lucide-react';
import { Message as MessageType, Attachment } from '../lib/supabase';
import { formatTime } from '../utils/dateUtils';

interface MessageProps {
  message: MessageType;
  attachments?: Attachment[];
}

function isImageFile(fileType: string): boolean {
  return fileType.startsWith('image/');
}

function isPDFFile(fileType: string): boolean {
  return fileType === 'application/pdf';
}

function isURL(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

function renderMessageContent(content: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);

  return parts.map((part, index) => {
    if (isURL(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 underline break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export default function Message({ message, attachments = [] }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} mb-6`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700'
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      <div className={`flex-1 max-w-3xl ${isUser ? 'items-end' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white ml-auto'
              : 'bg-gray-100 text-gray-800'
          }`}
          style={{ maxWidth: '85%' }}
        >
          <div className="whitespace-pre-wrap break-words">
            {renderMessageContent(message.content)}
          </div>

          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id}>
                  {isImageFile(attachment.file_type) ? (
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={attachment.file_url}
                        alt={attachment.file_name}
                        className="max-w-full h-auto"
                      />
                    </div>
                  ) : isPDFFile(attachment.file_type) ? (
                    <a
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        isUser
                          ? 'bg-blue-500 hover:bg-blue-400'
                          : 'bg-white hover:bg-gray-50'
                      } transition`}
                    >
                      <FileText className="w-5 h-5" />
                      <span className="text-sm font-medium truncate">
                        {attachment.file_name}
                      </span>
                    </a>
                  ) : (
                    <a
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        isUser
                          ? 'bg-blue-500 hover:bg-blue-400'
                          : 'bg-white hover:bg-gray-50'
                      } transition`}
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-sm font-medium truncate">
                        {attachment.file_name}
                      </span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className={`text-xs text-gray-500 mt-1 px-2 ${
            isUser ? 'text-right' : ''
          }`}
        >
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
}
