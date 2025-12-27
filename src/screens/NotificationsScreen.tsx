import React, { useState, useEffect } from 'react';
import { Bell, Package, MessageCircle, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { where, orderBy, onSnapshot, query, collection } from 'firebase/firestore';
import { db } from '../lib/firebase.config';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'payment' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

export const NotificationsScreen: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) return;

    // Real-time subscription
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];

      setNotifications(newNotifications);
      setLoading(false);
    }, (error) => {
      console.error('Error loading notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Removed manual loadNotifications as subscription handles it

  const markAsRead = async (notificationId: string) => {
    try {
      await FirestoreService.updateDocument(COLLECTIONS.NOTIFICATIONS, notificationId, {
        is_read: true
      });
      // State update handled by subscription
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      if (unread.length === 0) return;

      const batchOps = unread.map(n => ({
        type: 'update' as const,
        collectionName: COLLECTIONS.NOTIFICATIONS,
        documentId: n.id,
        data: { is_read: true }
      }));

      await FirestoreService.batchWrite(batchOps);
      // State update handled by subscription
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-green-600" />;
      case 'payment':
        return <DollarSign className="w-5 h-5 text-yellow-600" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-neutral-600" />;
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === 'all' ? true : !n.is_read
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Bell className="w-12 h-12 text-primary-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="font-sans text-sm text-neutral-600 mt-1">
                You have {unreadCount} unread notification{unreadCount !== 1 && 's'}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="font-sans text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors ${filter === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors ${filter === 'unread'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="font-sans text-neutral-600">
                {filter === 'unread'
                  ? 'All caught up! You have no unread notifications.'
                  : 'Notifications will appear here when you have updates.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-all hover:shadow-md ${!notification.is_read ? 'bg-primary-50 border-primary-200' : ''
                  }`}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id);
                  }
                  if (notification.link) {
                    window.location.href = notification.link;
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-sans font-semibold text-neutral-900">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5"></div>
                        )}
                      </div>
                      <p className="font-sans text-sm text-neutral-700 mb-2">
                        {notification.message}
                      </p>
                      <p className="font-sans text-xs text-neutral-500">
                        {new Date(notification.created_at).toLocaleString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
