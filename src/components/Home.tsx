import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Chat, Message, Attachment } from '../lib/supabase';
import ChatHeader from './ChatHeader';
import ChatHistory from './ChatHistory';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

export default function Home() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    }
  }, [currentChatId]);

  const loadChats = async () => {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading chats:', error);
      return;
    }

    setChats(data || []);
    setLoading(false);

    if (data && data.length > 0 && !currentChatId) {
      setCurrentChatId(data[0].id);
    } else if (data && data.length === 0) {
      createNewChat();
    }
  };

  const loadMessages = async (chatId: string) => {
    setLoading(true);

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error loading messages:', messagesError);
      setLoading(false);
      return;
    }

    setMessages(messagesData || []);

    if (messagesData && messagesData.length > 0) {
      const messageIds = messagesData.map((m) => m.id);
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('attachments')
        .select('*')
        .in('message_id', messageIds);

      if (attachmentsError) {
        console.error('Error loading attachments:', attachmentsError);
      } else {
        const attachmentsByMessage: Record<string, Attachment[]> = {};
        (attachmentsData || []).forEach((att) => {
          if (!attachmentsByMessage[att.message_id]) {
            attachmentsByMessage[att.message_id] = [];
          }
          attachmentsByMessage[att.message_id].push(att);
        });
        setAttachments(attachmentsByMessage);
      }
    }

    setLoading(false);
  };

  const createNewChat = async () => {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: user!.id,
        title: 'New Chat',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      return;
    }

    setChats((prev) => [data, ...prev]);
    setCurrentChatId(data.id);
    setMessages([]);
    setAttachments({});
  };

  const deleteChat = async (chatId: string) => {
    const { error } = await supabase.from('chats').delete().eq('id', chatId);

    if (error) {
      console.error('Error deleting chat:', error);
      return;
    }

    setChats((prev) => prev.filter((c) => c.id !== chatId));

    if (currentChatId === chatId) {
      const remainingChats = chats.filter((c) => c.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        createNewChat();
      }
    }
  };

  const clearCurrentChat = async () => {
    if (!currentChatId) return;

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', currentChatId);

    if (error) {
      console.error('Error clearing chat:', error);
      return;
    }

    setMessages([]);
    setAttachments({});
  };

  const updateChatTitle = async (chatId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');

    await supabase
      .from('chats')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', chatId);

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? { ...chat, title, updated_at: new Date().toISOString() }
          : chat
      )
    );
  };

  const handleSendMessage = async (content: string, files: File[]) => {
    if (!currentChatId || (!content && files.length === 0)) return;

    setSending(true);

    const { data: userMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: currentChatId,
        role: 'user',
        content: content || 'Sent attachments',
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error sending message:', messageError);
      setSending(false);
      return;
    }

    setMessages((prev) => [...prev, userMessage]);

    if (messages.length === 0) {
      updateChatTitle(currentChatId, content || 'Sent attachments');
    }

    if (files.length > 0) {
      const uploadedAttachments: Attachment[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user!.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath);

        const { data: attachment, error: attachmentError } = await supabase
          .from('attachments')
          .insert({
            message_id: userMessage.id,
            file_name: file.name,
            file_type: file.type,
            file_url: publicUrlData.publicUrl,
          })
          .select()
          .single();

        if (!attachmentError && attachment) {
          uploadedAttachments.push(attachment);
        }
      }

      if (uploadedAttachments.length > 0) {
        setAttachments((prev) => ({
          ...prev,
          [userMessage.id]: uploadedAttachments,
        }));
      }
    }

    setIsTyping(true);

    setTimeout(async () => {
      const aiResponse = generateAIResponse(content, files);

      const { data: assistantMessage, error: assistantError } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChatId,
          role: 'assistant',
          content: aiResponse,
        })
        .select()
        .single();

      if (assistantError) {
        console.error('Error sending assistant message:', assistantError);
      } else {
        setMessages((prev) => [...prev, assistantMessage]);
      }

      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentChatId);

      setIsTyping(false);
      setSending(false);
    }, 1500);
  };

  const generateAIResponse = (userMessage: string, files: File[]): string => {
    if (files.length > 0) {
      const fileTypes = files.map((f) => {
        if (f.type.startsWith('image/')) return 'image';
        if (f.type === 'application/pdf') return 'PDF';
        return 'file';
      });

      const uniqueTypes = [...new Set(fileTypes)];
      return `I can see you've shared ${uniqueTypes.join(' and ')} file(s). ${
        userMessage
          ? `Regarding your message: "${userMessage}" - `
          : ''
      }I'm an AI assistant and I can help analyze and discuss the content you've shared. How would you like me to assist you with these files?`;
    }

    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm your AI assistant. How can I help you today?";
    }

    if (lowerMessage.includes('how are you')) {
      return "I'm doing great, thank you for asking! I'm here to help you with any questions or tasks you have.";
    }

    if (lowerMessage.includes('help')) {
      return "I'm here to help! You can ask me questions, have conversations, upload images and PDFs for discussion, or share URLs. What would you like to know or discuss?";
    }

    if (lowerMessage.match(/https?:\/\/[^\s]+/)) {
      return "I can see you've shared a URL. I can help you discuss or analyze the content from that link. What would you like to know about it?";
    }

    return `Thank you for your message: "${userMessage}". I'm an AI assistant designed to help with various tasks, answer questions, and have meaningful conversations. How can I assist you further?`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatHistory
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col">
        <div className="lg:hidden">
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">AI Chat</h1>
          </div>
        </div>

        <div className="hidden lg:block">
          <ChatHeader onClearChat={clearCurrentChat} />
        </div>

        <ChatMessages
          messages={messages}
          attachments={attachments}
          loading={loading}
          isTyping={isTyping}
        />

        <ChatInput onSendMessage={handleSendMessage} disabled={sending} />
      </div>
    </div>
  );
}
