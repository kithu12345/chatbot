import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import { Chat } from '../lib/supabase';
import { formatDistanceToNow } from '../utils/dateUtils';

interface ChatHistoryProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatHistory({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isOpen,
  onClose,
}: ChatHistoryProps) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed lg:relative top-0 left-0 h-full w-80 bg-gray-900 text-white flex flex-col z-50 transform transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat History</h2>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {chats.length === 0 ? (
            <div className="text-center text-gray-400 py-8 px-4">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs mt-1">Start a new conversation</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group relative rounded-lg transition cursor-pointer ${
                    currentChatId === chat.id
                      ? 'bg-gray-700'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <div
                    onClick={() => {
                      onSelectChat(chat.id);
                      onClose();
                    }}
                    className="p-3 pr-10"
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {chat.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(chat.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
