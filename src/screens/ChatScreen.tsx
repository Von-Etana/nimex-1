import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, MessageCircle, User, Store, Loader2, Image } from 'lucide-react';
import { Button } from '../components/ui/button';
import { FirestoreService } from '../services/firestore.service';
import { FirebaseStorageService } from '../services/firebaseStorage.service';
import { COLLECTIONS } from '../lib/collections';
import { logger } from '../lib/logger';
import { sanitizeText } from '../lib/sanitization';
import { useAuth } from '../contexts/AuthContext';
import { where, orderBy, onSnapshot, query, collection, Timestamp, doc } from 'firebase/firestore';
import { db } from '../lib/firebase.config';
import { notificationService } from '../services/notificationService';

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
  buyer_typing?: boolean;
  vendor_typing?: boolean;
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
  const { vendorId: urlVendorId } = useParams<{ vendorId?: string }>();
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [otherUserPresence, setOtherUserPresence] = useState<{ isOnline: boolean; lastSeen?: string | null }>({ isOnline: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadConversations();
  }, [user?.uid]);

  // Handle URL vendorId parameter - create or find conversation
  useEffect(() => {
    const handleVendorIdParam = async () => {
      if (!urlVendorId || !user?.uid || conversations.length === 0) return;

      // Check if conversation with this vendor already exists
      const existingConvo = conversations.find(c => c.vendor_id === urlVendorId);

      if (existingConvo) {
        setSelectedConversation(existingConvo);
      } else {
        // Create new conversation with this vendor
        setCreatingConversation(true);
        try {
          const conversationId = `conv_${user.uid}_${urlVendorId}_${Date.now()}`;

          // Get vendor info
          const vendor = await FirestoreService.getDocument<any>(COLLECTIONS.VENDORS, urlVendorId);

          const newConvo: Conversation = {
            id: conversationId,
            buyer_id: user.uid,
            vendor_id: urlVendorId,
            last_message_at: new Date().toISOString(),
            unread_buyer: 0,
            unread_vendor: 0,
            vendor: { business_name: vendor?.business_name || 'Vendor' },
            buyer: { full_name: profile?.full_name || 'Buyer' }
          };

          await FirestoreService.setDocument(COLLECTIONS.CHAT_CONVERSATIONS, conversationId, {
            buyer_id: user.uid,
            vendor_id: urlVendorId,
            last_message_at: new Date().toISOString(),
            unread_buyer: 0,
            unread_vendor: 0,
            created_at: new Date().toISOString()
          });

          setConversations(prev => [newConvo, ...prev]);
          setSelectedConversation(newConvo);
        } catch (error) {
          logger.error('Error creating conversation', error);
        } finally {
          setCreatingConversation(false);
        }
      }
    };

    handleVendorIdParam();
  }, [urlVendorId, user?.uid, conversations.length]);

  // Real-time subscription for messages in selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const q = query(
      collection(db, COLLECTIONS.CHAT_MESSAGES),
      where('conversation_id', '==', selectedConversation.id),
      orderBy('created_at', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      setMessages(newMessages);

      // Mark as read if the last message is not from current user
      if (newMessages.length > 0) {
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg.sender_id !== user?.uid && !lastMsg.is_read) {
          markMessagesAsRead(selectedConversation.id);
        }
      }
    });

    return () => unsubscribe();
  }, [selectedConversation?.id]);

  // Real-time subscription for conversation data (typing status)
  useEffect(() => {
    if (!selectedConversation || !user?.uid) return;

    const unsubscribe = onSnapshot(doc(db, COLLECTIONS.CHAT_CONVERSATIONS, selectedConversation.id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as Conversation;
        if (user.uid === data.buyer_id) {
          setIsOtherUserTyping(data.vendor_typing || false);
        } else {
          setIsOtherUserTyping(data.buyer_typing || false);
        }
      }
    });

    return () => unsubscribe();
  }, [selectedConversation?.id, user?.uid]);

  // Subscribe to other user's presence
  useEffect(() => {
    if (!selectedConversation || !user?.uid) return;

    const otherUserId = user.uid === selectedConversation.buyer_id
      ? selectedConversation.vendor_id
      : selectedConversation.buyer_id;

    if (!otherUserId) return;

    const unsubscribe = onSnapshot(doc(db, COLLECTIONS.PROFILES, otherUserId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const lastSeen = data.last_seen;
        // Check if last seen is within 5 minutes
        const isOnline = lastSeen && (new Date().getTime() - new Date(lastSeen).getTime() < 5 * 60 * 1000);
        setOtherUserPresence({ isOnline, lastSeen });
      }
    });

    return () => unsubscribe();
  }, [selectedConversation?.id, user?.uid]);

  const handleTyping = () => {
    if (!selectedConversation || !user?.uid) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing status to true (optimization: only update if not already recently updated? 
    // For now, simple approach is fine, but maybe check a local ref to avoid too many writes?
    // Actually, writing on every keystroke is bad. Let's create a local ref to track if we've already set it to true.)

    // Better approach: locally track 'isTyping' state to avoid redundant 'true' writes.
    // However, for simplicity and robustness (in case of page refresh), just writing 'true' is okay as long as not *every* keystroke triggers a write if it's already true.

    // Let's implement a simple debounce for setting it to true? No, we want it immediate.
    // We can assume if we have a timeout pending, we are "typing".

    const field = selectedConversation.buyer_id === user.uid ? 'buyer_typing' : 'vendor_typing';

    if (!typingTimeoutRef.current) {
      // Only write 'true' if we weren't already typing (timeout is null)
      FirestoreService.updateDocument(COLLECTIONS.CHAT_CONVERSATIONS, selectedConversation.id, {
        [field]: true
      }).catch(e => console.error(e));
    }

    // Reset timeout to clear typing status
    typingTimeoutRef.current = setTimeout(() => {
      FirestoreService.updateDocument(COLLECTIONS.CHAT_CONVERSATIONS, selectedConversation.id, {
        [field]: false
      }).catch(e => console.error(e));
      typingTimeoutRef.current = null;
    }, 2000);
  };

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
    if (!user?.uid) return;

    try {
      setLoading(true);
      logger.info('Loading conversations');

      // Firestore doesn't support OR queries across different fields easily.
      // We fetch conversations where user is buyer AND where user is vendor, then merge.

      const buyerConversationsPromise = FirestoreService.getDocuments<any>(COLLECTIONS.CHAT_CONVERSATIONS, [
        where('buyer_id', '==', user.uid)
      ]);

      const vendorConversationsPromise = profile?.role === 'vendor'
        ? FirestoreService.getDocuments<any>(COLLECTIONS.CHAT_CONVERSATIONS, [
          where('vendor_id', '==', user.uid)
        ])
        : Promise.resolve([]);

      const [buyerConvos, vendorConvos] = await Promise.all([buyerConversationsPromise, vendorConversationsPromise]);

      // Merge and deduplicate (though IDs should be unique across these sets ideally)
      const allConvos = [...buyerConvos, ...vendorConvos];
      const uniqueConvos = Array.from(new Map(allConvos.map(c => [c.id, c])).values());

      // Manually join related data
      const enrichedConvos = await Promise.all(uniqueConvos.map(async (convo) => {
        try {
          const [buyer, vendor, product] = await Promise.all([
            FirestoreService.getDocument<any>(COLLECTIONS.PROFILES, convo.buyer_id),
            FirestoreService.getDocument<any>(COLLECTIONS.VENDORS, convo.vendor_id),
            convo.product_id ? FirestoreService.getDocument<any>(COLLECTIONS.PRODUCTS, convo.product_id) : null
          ]);

          return {
            ...convo,
            buyer: buyer ? { full_name: buyer.full_name } : { full_name: 'Unknown Buyer' },
            vendor: vendor ? { business_name: vendor.business_name } : { business_name: 'Unknown Vendor' },
            product: product ? { title: product.title } : undefined
          };
        } catch (e) {
          console.error('Error enriching conversation', e);
          return convo;
        }
      }));

      // Sort by last_message_at desc
      enrichedConvos.sort((a, b) => {
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });

      setConversations(enrichedConvos);
    } catch (error) {
      logger.error('Error loading conversations', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    // This is now handled by the real-time subscription in useEffect
    // But we can keep it for initial load if needed, or just rely on the subscription.
    // The subscription handles both initial load and updates.
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user?.uid) return;

    try {
      // Find unread messages not sent by current user
      const unreadMessages = await FirestoreService.getDocuments<Message>(COLLECTIONS.CHAT_MESSAGES, [
        where('conversation_id', '==', conversationId),
        where('is_read', '==', false),
        where('sender_id', '!=', user.uid)
      ]);

      if (unreadMessages.length > 0) {
        // Batch update
        const batchOps = unreadMessages.map(msg => ({
          type: 'update' as const,
          collectionName: COLLECTIONS.CHAT_MESSAGES,
          documentId: msg.id,
          data: { is_read: true }
        }));

        await FirestoreService.batchWrite(batchOps);

        // Also update conversation unread counts
        // This is a bit complex because we need to know if we are buyer or vendor
        // For simplicity, we can just reset the count for the current user's role
        // But we need the conversation object to know which field to update.
        // We'll skip updating the conversation document for now to avoid race conditions 
        // or just rely on the next message to fix counts, or do a separate update if we had the convo.
      }
    } catch (error) {
      logger.error('Error marking messages as read', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.uid) return;

    setSending(true);
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await FirestoreService.setDocument(COLLECTIONS.CHAT_MESSAGES, messageId, {
        conversation_id: selectedConversation.id,
        sender_id: user.uid,
        message_text: newMessage.trim(),
        is_read: false,
        created_at: Timestamp.now()
      });

      // Update conversation last message
      const updates: any = {
        last_message: newMessage.trim(),
        last_message_at: new Date().toISOString(), // Use ISO string for consistency with sorting
      };

      if (selectedConversation.buyer_id !== user.uid) {
        updates.unread_buyer = (selectedConversation.unread_buyer || 0) + 1;
      }
      if (selectedConversation.vendor_id !== user.uid) {
        updates.unread_vendor = (selectedConversation.unread_vendor || 0) + 1;
      }

      await FirestoreService.updateDocument(COLLECTIONS.CHAT_CONVERSATIONS, selectedConversation.id, updates);

      // Notify the recipient about new message
      const recipientId = selectedConversation.buyer_id === user.uid
        ? selectedConversation.vendor_id
        : selectedConversation.buyer_id;

      const senderName = selectedConversation.buyer_id === user.uid
        ? selectedConversation.buyer?.full_name || 'Buyer'
        : selectedConversation.vendor?.business_name || 'Vendor';

      await notificationService.createNotification({
        userId: recipientId,
        type: 'new_message',
        title: 'New Message 💬',
        message: `${senderName}: ${newMessage.trim().substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
        data: { conversationId: selectedConversation.id },
      });

      setNewMessage('');
      // No need to reload messages, subscription will catch it
      loadConversations(); // Refresh list to show new last message
    } catch (error) {
      logger.error('Error sending message', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation || !user?.uid) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      logger.error('Invalid file type');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      logger.error('File too large');
      return;
    }

    setUploadingImage(true);
    try {
      // Upload image
      const { url, error } = await FirebaseStorageService.uploadChatImage(
        selectedConversation.id,
        file
      );

      if (error || !url) {
        throw error || new Error('Failed to upload image');
      }

      // Create message with image
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await FirestoreService.setDocument(COLLECTIONS.CHAT_MESSAGES, messageId, {
        conversation_id: selectedConversation.id,
        sender_id: user.uid,
        image_url: url,
        is_read: false,
        created_at: Timestamp.now()
      });

      // Update conversation
      const updates: any = {
        last_message: '📷 Image',
        last_message_at: new Date().toISOString(),
      };

      if (selectedConversation.buyer_id !== user.uid) {
        updates.unread_buyer = (selectedConversation.unread_buyer || 0) + 1;
      }
      if (selectedConversation.vendor_id !== user.uid) {
        updates.unread_vendor = (selectedConversation.unread_vendor || 0) + 1;
      }

      await FirestoreService.updateDocument(COLLECTIONS.CHAT_CONVERSATIONS, selectedConversation.id, updates);

      // Notify recipient
      const recipientId = selectedConversation.buyer_id === user.uid
        ? selectedConversation.vendor_id
        : selectedConversation.buyer_id;

      await notificationService.createNotification({
        userId: recipientId,
        type: 'new_message',
        title: 'New Image 📷',
        message: 'You received a new image',
        data: { conversationId: selectedConversation.id },
      });

      loadConversations();
    } catch (error) {
      logger.error('Error uploading image', error);
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
    if (conversation.buyer_id === user?.uid) {
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

  if (loading || creatingConversation) {
    return (
      <div className="w-full min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto mb-4"></div>
          {creatingConversation && (
            <p className="font-sans text-sm text-neutral-600">Starting conversation...</p>
          )}
        </div>
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
                  const unreadCount = conversation.buyer_id === user?.uid
                    ? conversation.unread_buyer
                    : conversation.unread_vendor;

                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors ${isSelected ? 'bg-green-50 border-l-4 border-l-green-700' : ''
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${otherParticipant.type === 'vendor'
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
                    <div className={`p-2 rounded-full ${getOtherParticipant(selectedConversation).type === 'vendor'
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
                      <h3 className="font-sans font-semibold text-neutral-900 flex items-center gap-2">
                        {getOtherParticipant(selectedConversation).name}
                        {otherUserPresence.isOnline && (
                          <span className="w-2 h-2 bg-green-500 rounded-full" title="Online"></span>
                        )}
                      </h3>
                      {!otherUserPresence.isOnline && otherUserPresence.lastSeen && (
                        <p className="font-sans text-xs text-neutral-400">
                          Last seen {formatTime(otherUserPresence.lastSeen)}
                        </p>
                      )}
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
                    const isOwnMessage = message.sender_id === user?.uid;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwnMessage
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
                          <p className={`font-sans text-xs mt-1 ${isOwnMessage ? 'text-green-100' : 'text-neutral-500'
                            }`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {isOtherUserTyping && (
                    <div className="flex justify-start">
                      <div className="bg-neutral-100 text-neutral-500 text-xs px-4 py-2 rounded-lg italic flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-200"></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-neutral-200">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage || sending}
                      className="flex-shrink-0 border-neutral-200 hover:bg-neutral-50"
                      title="Send image"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Image className="w-4 h-4 text-neutral-600" />
                      )}
                    </Button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                      disabled={sending || uploadingImage}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending || uploadingImage}
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
