import * as admin from 'firebase-admin';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import axios from 'axios';

const db = admin.firestore();

/**
 * Send In-App Notification (saved to Firestore 'notifications' collection)
 */
export async function createInAppNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data: Record<string, any> = {}
) {
  if (!userId) return;
  try {
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.collection('notifications').doc(notifId).set({
      id: notifId,
      user_id: userId,
      type,
      title,
      message,
      data,
      is_read: false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('Error creating in-app notification:', err);
  }
}

/**
 * Send Push Notification to a user via Native Firebase Cloud Messaging (FCM)
 * with automatic fallback to Expo Push API for ExponentPushTokens.
 */
async function sendPushNotification(userId: string, title: string, body: string, data: any = {}) {
  try {
    const profileSnap = await db.collection('profiles').doc(userId).get();
    const profile = profileSnap.data();

    if (!profile || !profile.fcm_tokens || profile.fcm_tokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return;
    }

    const rawTokens: string[] = Array.from(new Set(profile.fcm_tokens.filter(Boolean)));
    const fcmTokens: string[] = [];
    const expoTokens: string[] = [];

    rawTokens.forEach(token => {
      if (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) {
        expoTokens.push(token);
      } else {
        fcmTokens.push(token);
      }
    });

    // Stringify data values for FCM protocol requirement
    const stringifiedData: Record<string, string> = {};
    Object.entries(data || {}).forEach(([k, v]) => {
      stringifiedData[k] = typeof v === 'string' ? v : JSON.stringify(v);
    });

    // 1. Native Firebase Cloud Messaging (Direct, Free, Fast)
    if (fcmTokens.length > 0) {
      try {
        const fcmResponse = await admin.messaging().sendEachForMulticast({
          tokens: fcmTokens,
          notification: {
            title,
            body,
          },
          data: stringifiedData,
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'default',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
              },
            },
          },
        });

        console.log(`FCM sent to ${userId}: ${fcmResponse.successCount} succeeded, ${fcmResponse.failureCount} failed.`);

        // Prune stale or invalid tokens automatically
        if (fcmResponse.failureCount > 0) {
          const tokensToRemove: string[] = [];
          fcmResponse.responses.forEach((resp, idx) => {
            if (!resp.success && resp.error) {
              const code = resp.error.code;
              if (
                code === 'messaging/registration-token-not-registered' ||
                code === 'messaging/invalid-registration-token'
              ) {
                tokensToRemove.push(fcmTokens[idx]);
              }
            }
          });

          if (tokensToRemove.length > 0) {
            await db.collection('profiles').doc(userId).update({
              fcm_tokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove),
            });
            console.log(`Pruned ${tokensToRemove.length} stale FCM tokens for user ${userId}`);
          }
        }
      } catch (fcmErr) {
        console.error(`Error sending native FCM push to user ${userId}:`, fcmErr);
      }
    }

    // 2. Expo Push Service Fallback
    if (expoTokens.length > 0) {
      try {
        const expoMessages = expoTokens.map(token => ({
          to: token,
          sound: 'default',
          title,
          body,
          data,
        }));

        await axios.post('https://exp.host/--/api/v2/push/send', expoMessages, {
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
        });
        console.log(`Expo push sent to ${userId} (${expoTokens.length} tokens)`);
      } catch (expoErr: any) {
        console.error(`Error sending Expo push fallback to user ${userId}:`, expoErr.response?.data || expoErr.message);
      }
    }
  } catch (error: any) {
    console.error('Error in sendPushNotification:', error);
  }
}

/**
 * Trigger: Notify Vendor on New Order
 */
export const onOrderCreateNotifyVendor = onDocumentCreated('orders/{orderId}', async (event) => {
  const order = event.data?.data();
  if (!order) return;

  const vendorId = order.vendor_id;
  const orderNumber = order.order_number || event.params.orderId;
  const totalAmount = Number(order.total_amount || 0);

  const title = 'New Order Received! 🛍️';
  const body = `You have a new order #${orderNumber} for ₦${totalAmount.toLocaleString()}`;

  // 1. In-App Notification
  await createInAppNotification(vendorId, 'order_placed', title, body, {
    orderId: event.params.orderId,
    orderNumber,
    totalAmount,
  });

  // 2. Push Notification
  await sendPushNotification(vendorId, title, body, {
    orderId: event.params.orderId,
    type: 'new_order',
  });
});

/**
 * Trigger: Order Status Lifecycle Manager & Notifier
 * Automatically handles notifications and escrow state transitions:
 * - shipped: Notifies buyer
 * - delivered: Notifies buyer to inspect order
 * - disputed: Freezes escrow payout & notifies both parties
 * - refunded: Marks escrow as refunded & notifies both parties
 * - completed: Releases escrow funds & credits vendor wallet
 */
export const onOrderStatusUpdateNotifyBuyer = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after || before.status === after.status) return;

  const orderId = event.params.orderId;
  const orderNumber = after.order_number || orderId;
  const buyerId = after.buyer_id || after.user_id;
  const vendorId = after.vendor_id;
  const newStatus = after.status;

  console.log(`Order ${orderId} transitioned: ${before.status} -> ${newStatus}`);

  // ----------------------------------------------------------------------
  // 1. SHIPPED
  // ----------------------------------------------------------------------
  if (newStatus === 'shipped') {
    const title = 'Order Shipped! 🚚';
    const body = `Great news! Your order #${orderNumber} is on the way.`;
    await createInAppNotification(buyerId, 'order_shipped', title, body, { orderId, orderNumber });
    await sendPushNotification(buyerId, title, body, { orderId, type: 'order_status', status: newStatus });
  }

  // ----------------------------------------------------------------------
  // 2. DELIVERED
  // ----------------------------------------------------------------------
  else if (newStatus === 'delivered') {
    const title = 'Order Delivered! 📦';
    const body = `Your order #${orderNumber} has been delivered. Please inspect your items and confirm receipt on NIMEX.`;
    await createInAppNotification(buyerId, 'order_delivered', title, body, { orderId, orderNumber });
    await sendPushNotification(buyerId, title, body, { orderId, type: 'order_status', status: newStatus });
  }

  // ----------------------------------------------------------------------
  // 3. DISPUTED
  // ----------------------------------------------------------------------
  else if (newStatus === 'disputed') {
    // Notify Buyer
    const buyerTitle = 'Dispute Registered ⚠️';
    const buyerBody = `Your dispute for Order #${orderNumber} has been recorded. Escrow funds are paused while an admin reviews your case.`;
    await createInAppNotification(buyerId, 'dispute_opened', buyerTitle, buyerBody, { orderId, orderNumber });
    await sendPushNotification(buyerId, buyerTitle, buyerBody, { orderId, type: 'order_status', status: newStatus });

    // Notify Vendor
    if (vendorId) {
      const vendorTitle = 'Buyer Dispute Alert ⚠️';
      const vendorBody = `A dispute has been logged for Order #${orderNumber}. Escrow payout is frozen pending admin mediation.`;
      await createInAppNotification(vendorId, 'dispute_opened', vendorTitle, vendorBody, { orderId, orderNumber });
      await sendPushNotification(vendorId, vendorTitle, vendorBody, { orderId, type: 'order_status', status: newStatus });
    }

    // Freeze Escrow Transaction in Firestore
    try {
      const escrowSnap = await db.collection('escrow_transactions')
        .where('order_id', '==', orderId)
        .limit(1)
        .get();

      if (!escrowSnap.empty) {
        await escrowSnap.docs[0].ref.update({
          status: 'disputed',
          is_frozen: true,
          disputed_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Escrow for order ${orderId} marked as disputed/frozen`);
      }
    } catch (e) {
      console.error(`Failed to freeze escrow for disputed order ${orderId}:`, e);
    }
  }

  // ----------------------------------------------------------------------
  // 4. REFUNDED
  // ----------------------------------------------------------------------
  else if (newStatus === 'refunded') {
    const title = 'Order Refunded 💳';
    const buyerBody = `Order #${orderNumber} has been refunded to your payment method.`;
    const vendorBody = `Order #${orderNumber} has been marked as refunded.`;

    await createInAppNotification(buyerId, 'order_refunded', title, buyerBody, { orderId, orderNumber });
    await sendPushNotification(buyerId, title, buyerBody, { orderId, type: 'order_status', status: newStatus });

    if (vendorId) {
      await createInAppNotification(vendorId, 'order_refunded', title, vendorBody, { orderId, orderNumber });
      await sendPushNotification(vendorId, title, vendorBody, { orderId, type: 'order_status', status: newStatus });
    }

    // Update Escrow Transaction to refunded
    try {
      const escrowSnap = await db.collection('escrow_transactions')
        .where('order_id', '==', orderId)
        .limit(1)
        .get();

      if (!escrowSnap.empty) {
        await escrowSnap.docs[0].ref.update({
          status: 'refunded',
          is_frozen: false,
          refunded_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      console.error(`Failed to update escrow for refunded order ${orderId}:`, e);
    }
  }

  // ----------------------------------------------------------------------
  // 5. COMPLETED (Escrow Release & Wallet Credit)
  // ----------------------------------------------------------------------
  else if (newStatus === 'completed') {
    const buyerTitle = 'Order Completed ✅';
    const buyerBody = `Thank you for confirming receipt of Order #${orderNumber}!`;
    await createInAppNotification(buyerId, 'order_confirmed', buyerTitle, buyerBody, { orderId, orderNumber });
    await sendPushNotification(buyerId, buyerTitle, buyerBody, { orderId, type: 'order_status', status: newStatus });

    if (vendorId) {
      const vendorTitle = 'Escrow Released! 💰';
      const vendorBody = `Order #${orderNumber} is marked completed! Payout has been released to your store wallet.`;
      await createInAppNotification(vendorId, 'escrow_released', vendorTitle, vendorBody, { orderId, orderNumber });
      await sendPushNotification(vendorId, vendorTitle, vendorBody, { orderId, type: 'order_status', status: newStatus });

      // Release Escrow & Credit Vendor Wallet
      try {
        const escrowSnap = await db.collection('escrow_transactions')
          .where('order_id', '==', orderId)
          .limit(1)
          .get();

        if (!escrowSnap.empty) {
          const escrowDoc = escrowSnap.docs[0];
          const escrowData = escrowDoc.data();
          const vendorAmount = Number(escrowData.vendor_amount || (escrowData.total_amount * 0.95));

          await escrowDoc.ref.update({
            status: 'released',
            is_frozen: false,
            released_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Credit vendor wallet
          const walletRef = db.collection('wallets').doc(vendorId);
          await db.runTransaction(async (t) => {
            const wDoc = await t.get(walletRef);
            if (wDoc.exists) {
              t.update(walletRef, {
                balance: admin.firestore.FieldValue.increment(vendorAmount),
                total_earned: admin.firestore.FieldValue.increment(vendorAmount),
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
              });
            } else {
              t.set(walletRef, {
                user_id: vendorId,
                balance: vendorAmount,
                total_earned: vendorAmount,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
              });
            }

            // Log wallet transaction
            const txRef = db.collection('wallet_transactions').doc();
            t.set(txRef, {
              user_id: vendorId,
              order_id: orderId,
              amount: vendorAmount,
              type: 'escrow_payout',
              description: `Escrow payout for Order #${orderNumber}`,
              status: 'completed',
              created_at: admin.firestore.FieldValue.serverTimestamp(),
            });
          });

          console.log(`Successfully credited vendor ${vendorId} ₦${vendorAmount} for completed order ${orderId}`);
        }
      } catch (e) {
        console.error(`Failed to release escrow and credit wallet for order ${orderId}:`, e);
      }
    }
  }

  // ----------------------------------------------------------------------
  // 6. CANCELLED
  // ----------------------------------------------------------------------
  else if (newStatus === 'cancelled') {
    const title = 'Order Cancelled';
    const body = `Order #${orderNumber} has been cancelled.`;
    await createInAppNotification(buyerId, 'order_cancelled', title, body, { orderId, orderNumber });
    await sendPushNotification(buyerId, title, body, { orderId, type: 'order_status', status: newStatus });

    if (vendorId) {
      await createInAppNotification(vendorId, 'order_cancelled', title, body, { orderId, orderNumber });
      await sendPushNotification(vendorId, title, body, { orderId, type: 'order_status', status: newStatus });
    }
  }
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
  const roomSnap = await db.collection('chatRooms').doc(chatId).get();
  const room = roomSnap.data();

  if (!room) return;

  const recipientId = room.participants?.find((p: string) => p !== senderId);
  if (!recipientId) return;

  // Get sender's name for the notification
  const senderProfileSnap = await db.collection('profiles').doc(senderId).get();
  const senderName = senderProfileSnap.data()?.full_name || 'Someone';

  const title = `New Message from ${senderName}`;
  const body = message.text || 'Sent an attachment';

  await createInAppNotification(recipientId, 'new_message', title, body, { chatId });
  await sendPushNotification(recipientId, title, body, { chatId, type: 'new_message' });
});
