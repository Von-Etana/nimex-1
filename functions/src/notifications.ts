import * as admin from 'firebase-admin';
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import axios from 'axios';

/**
 * Send Push Notification to a user via their stored tokens
 */
async function sendPushNotification(userId: string, title: string, body: string, data: any = {}) {
  const profileSnap = await admin.firestore().collection('profiles').doc(userId).get();
  const profile = profileSnap.data();

  if (!profile || !profile.fcm_tokens || profile.fcm_tokens.length === 0) {
    console.log(`No FCM tokens found for user ${userId}`);
    return;
  }

  const messages: any[] = [];
  profile.fcm_tokens.forEach((token: string) => {
    messages.push({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    });
  });

  // Using Expo Push API
  try {
    const response = await axios.post('https://exp.host/--/api/v2/push/send', messages, {
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });
    console.log('Push notification result:', response.data);
  } catch (error: any) {
    console.error('Error sending push notification:', error.response?.data || error.message);
  }
}

/**
 * Trigger: Notify Vendor on New Order
 */
export const onOrderCreateNotifyVendor = onDocumentCreated('orders/{orderId}', async (event) => {
  const order = event.data?.data();
  if (!order) return;

  const vendorId = order.vendor_id;
  const totalAmount = order.total_amount;

  await sendPushNotification(
    vendorId,
    'New Order Received!',
    `You have a new order #${order.order_number} for ₦${totalAmount.toLocaleString()}`,
    { orderId: event.params.orderId, type: 'new_order' }
  );
});

/**
 * Trigger: Notify Buyer on Order Status Update
 */
export const onOrderStatusUpdateNotifyBuyer = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after || before.status === after.status) return;

  const buyerId = after.buyer_id;
  let title = 'Order Update';
  let body = `Your order #${after.order_number} status is now: ${after.status}`;

  if (after.status === 'shipped') {
    title = 'Order Shipped! 🚚';
    body = `Great news! Your order #${after.order_number} has been shipped.`;
  } else if (after.status === 'delivered') {
    title = 'Order Delivered! ✅';
    body = `Your order #${after.order_number} has been delivered. Enjoy your purchase!`;
  }

  await sendPushNotification(buyerId, title, body, {
    orderId: event.params.orderId,
    type: 'order_status',
    status: after.status,
  });
});

/**
 * Trigger: Notify Recipient on New Chat Message
 */
export const onChatMessageNotifyRecipient = onDocumentCreated('chatRooms/{chatId}/messages/{messageId}', async (event) => {
  const message = event.data?.data();
  if (!message) return;

  const chatId = event.params.chatId;
  const senderId = message.senderId;

  // Get the chat room to find the other participant
  const roomSnap = await admin.firestore().collection('chatRooms').doc(chatId).get();
  const room = roomSnap.data();

  if (!room) return;

  // Find the recipient (the one who is NOT the sender)
  const recipientId = room.participants.find((p: string) => p !== senderId);

  if (!recipientId) return;

  // Get sender's name for the notification
  const senderProfileSnap = await admin.firestore().collection('profiles').doc(senderId).get();
  const senderName = senderProfileSnap.data()?.full_name || 'Someone';

  await sendPushNotification(
    recipientId,
    `New Message from ${senderName}`,
    message.text,
    { chatId, type: 'new_message' }
  );
});
