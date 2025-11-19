import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, User, Store } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { sanitizeText } from '../lib/sanitization';
import { useAuth } from '../contexts/AuthContext';

interface Conversation {
  id: string;
  buyer_id: string;
  vendor_id: string;
  product_id?: string;
  last_message?: string;
  last_message_at: string;
  unread_buyer: number;
  unread_vendor: number;
  buyer?: {
    full_name: string;
  };
  vendor?: {
    business_name: string;
  };
  product?: {
    title: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text?: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
  };
}

export const ChatScreen: React.FC = () => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();

    // Real-time subscription for new messages
    const messageSubscription = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Check if this message belongs to current user's conversations
          if (selectedConversation?.id === newMessage.conversation_id) {
            setMessages(prev => [...prev, newMessage]);
            markMessagesAsRead(newMessage.conversation_id);
          }
          // Refresh conversations to update last message
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      logger.info('Loading conversations');

      const { data, error } = await (supabase
        .from('chat_conversations') as any)
        .select(`
          *,
          profiles:buyer_id (
            full_name
          ),
          vendors:vendor_id (
            business_name
          ),
          products:product_id (
            title
          )
        `)
        .or(`buyer_id.eq.${user.id},vendor_id.in.(${profile?.role === 'vendor' ? `(SELECT id FROM vendors WHERE user_id = '${user.id}')` : 'null'})`)
        .order('last_message_at', { ascending: false });

      if (error) {
        logger.error('Error loading conversations', error);
        return;
      }

      setConversations(data || []);
    } catch (error) {
      logger.error('Error loading conversations', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await (supabase
        .from('chat_messages') as any)
        .select(`
          *,
          profiles:sender_id (
            full_name
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error loading messages', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      logger.error('Error loading messages', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user?.id) return;

    try {
      await (supabase
        .from('chat_messages') as any)
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      logger.error('Error marking messages as read', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.id) return;

    setSending(true);
    try {
      const { error } = await (supabase
        .from('chat_messages') as any)
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          message_text: newMessage.trim()
        });

      if (error) {
        logger.error('Error sending message', error);
        return;
      }

      // Update conversation last message
      await (supabase
        .from('chat_conversations') as any)
        .update({
          last_message: newMessage.trim(),
          last_message_at: new Date().toISOString(),
          unread_buyer: selectedConversation.buyer_id !== user.id ? selectedConversation.unread_buyer + 1 : 0,
          unread_vendor: selectedConversation.vendor_id !== user.id ? selectedConversation.unread_vendor + 1 : 0
        })
        .eq('id', selectedConversation.id);

      setNewMessage('');
      loadMessages(selectedConversation.id);
      loadConversations();
    } catch (error) {
      logger.error('Error sending message', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (conversation.buyer_id === user?.id) {
      return {
        name: conversation.vendor?.business_name || 'Vendor',
        type: 'vendor' as const
      };
    } else {
      return {
        name: conversation.buyer?.full_name || 'Buyer',
        type: 'buyer' as const
      };
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
          {/* Conversations List */}
          <div className="w-full md:w-1/3 bg-white rounded-lg border border-neutral-200 shadow-sm">
            <div className="p-4 border-b border-neutral-200">
              <h2 className="font-heading font-bold text-lg text-neutral-900">
                Messages
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-neutral-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                  <p className="font-sans text-sm">No conversations yet</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  const isSelected = selectedConversation?.id === conversation.id;
                  const unreadCount = conversation.buyer_id === user?.id
                    ? conversation.unread_buyer
                    : conversation.unread_vendor;

                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors ${
                        isSelected ? 'bg-green-50 border-l-4 border-l-green-700' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          otherParticipant.type === 'vendor'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {otherParticipant.type === 'vendor' ? (
                            <Store className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-sans font-semibold text-sm text-neutral-900 truncate">
                              {otherParticipant.name}
                            </h3>
                            <span className="font-sans text-xs text-neutral-500">
                              {formatTime(conversation.last_message_at)}
                            </span>
                          </div>
                          {conversation.product && (
                            <p className="font-sans text-xs text-neutral-600 mb-1 truncate">
                              Re: {conversation.product.title}
                            </p>
                          )}
                          {conversation.last_message && (
                            <p className="font-sans text-xs text-neutral-600 truncate">
                              {conversation.last_message}
                            </p>
                          )}
                          {unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-green-700 text-white text-xs font-bold rounded-full mt-1">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-white rounded-lg border border-neutral-200 shadow-sm flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-neutral-200">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      getOtherParticipant(selectedConversation).type === 'vendor'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {getOtherParticipant(selectedConversation).type === 'vendor' ? (
                        <Store className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-sans font-semibold text-neutral-900">
                        {getOtherParticipant(selectedConversation).name}
                      </h3>
                      {selectedConversation.product && (
                        <p className="font-sans text-xs text-neutral-600">
                          Re: {selectedConversation.product.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.sender_id === user?.id;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-green-700 text-white'
                              : 'bg-neutral-100 text-neutral-900'
                          }`}
                        >
                          {message.message_text && (
                            <p className="font-sans text-sm">{sanitizeText(message.message_text)}</p>
                          )}
                          {message.image_url && (
                            <img
                              src={message.image_url}
                              alt="Shared image"
                              className="max-w-full rounded mt-2"
                            />
                          )}
                          <p className={`font-sans text-xs mt-1 ${
                            isOwnMessage ? 'text-green-100' : 'text-neutral-500'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-neutral-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                      disabled={sending}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-green-700 hover:bg-green-800 text-white px-4"
                    >
                      {sending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                  <h3 className="font-heading font-semibold text-lg mb-2">
                    Select a conversation
                  </h3>
                  <p className="font-sans text-sm">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
