import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Search, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';

interface Conversation {
  id: string;
  last_message_at: string;
  participants: Array<{
    user_id: string;
    profile: {
      full_name: string;
      avatar_url?: string;
    };
  }>;
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender: {
    full_name: string;
    avatar_url?: string;
  };
}

export const ChatScreen: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations (
          id,
          last_message_at
        )
      `)
      .eq('user_id', user?.id)
      .order('last_message_at', { ascending: false });

    if (data && !error) {
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        created_at,
        profiles:sender_id (
          full_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (data && !error) {
      setMessages(data.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        sender: {
          full_name: msg.profiles?.full_name || 'Unknown',
          avatar_url: msg.profiles?.avatar_url
        }
      })));
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation,
        sender_id: user?.id,
        content: newMessage.trim()
      });

    if (!error) {
      setNewMessage('');
      loadMessages(selectedConversation);

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-neutral-50">
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-96 bg-white border-r border-neutral-200 flex-col`}>
        <div className="p-4 border-b border-neutral-200">
          <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-4">Chats</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-100 rounded-full font-sans text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="w-16 h-16 text-neutral-300 mb-4" />
              <h3 className="font-heading font-semibold text-neutral-900 text-lg mb-2">No conversations yet</h3>
              <p className="font-sans text-neutral-600 text-sm">Start chatting with vendors to see your conversations here</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 ${
                  selectedConversation === conv.id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-heading font-semibold flex-shrink-0">
                  {getInitials(conv.participants[0]?.profile?.full_name || 'U')}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-sans font-semibold text-neutral-900 text-sm truncate">
                      {conv.participants[0]?.profile?.full_name || 'Unknown User'}
                    </h3>
                    <span className="font-sans text-xs text-neutral-500">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <p className="font-sans text-sm text-neutral-600 truncate">
                    {conv.last_message?.content || 'No messages yet'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-neutral-50`}>
        {selectedConversation ? (
          <>
            <div className="bg-white p-4 border-b border-neutral-200 flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden text-neutral-700 hover:text-primary-500"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-heading font-semibold flex-shrink-0">
                VN
              </div>
              <div className="flex-1">
                <h2 className="font-sans font-semibold text-neutral-900">Vendor Name</h2>
                <p className="font-sans text-xs text-green-600">Online</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <Phone className="w-5 h-5 text-neutral-700" />
                </button>
                <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <Video className="w-5 h-5 text-neutral-700" />
                </button>
                <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5 text-neutral-700" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwn = message.sender_id === user?.id;
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-primary-500 text-white rounded-br-none'
                            : 'bg-white text-neutral-900 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <p className="font-sans text-sm break-words">{message.content}</p>
                      </div>
                      <p className={`font-sans text-xs text-neutral-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white p-4 border-t border-neutral-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 px-4 py-3 bg-neutral-100 rounded-full font-sans text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 rounded-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send className="w-5 h-5 text-white" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="w-24 h-24 text-neutral-300 mb-6" />
            <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-2">Welcome to NIMEX Chat</h2>
            <p className="font-sans text-neutral-600 text-base max-w-md">
              Select a conversation from the list to start chatting with vendors
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
