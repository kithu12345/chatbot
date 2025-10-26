import { useEffect, useRef } from 'react';
import { Message as MessageType, Attachment } from '../lib/supabase';
import Message from './Message';
import { Loader2 } from 'lucide-react';

interface ChatMessagesProps {
  messages: MessageType[];
  attachments: Record<string, Attachment[]>;
  loading: boolean;
  isTyping: boolean;
}

export default function ChatMessages({
  messages,
  attachments,
  loading,
  isTyping,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Start a Conversation
            </h3>
            <p className="text-gray-600">
              Send a message to begin chatting with the AI assistant. You can
              also upload images and PDFs.
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              attachments={attachments[message.id] || []}
            />
          ))}

          {isTyping && (
            <div className="flex gap-4 mb-6">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-700">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div className="flex-1 max-w-3xl">
                <div className="bg-gray-100 rounded-2xl px-4 py-3 inline-block">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
