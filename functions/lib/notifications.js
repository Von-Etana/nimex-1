"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onChatMessageNotifyRecipient = exports.onOrderStatusUpdateNotifyBuyer = exports.onOrderCreateNotifyVendor = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
const axios_1 = __importDefault(require("axios"));
/**
 * Send Push Notification to a user via their stored tokens
 */
async function sendPushNotification(userId, title, body, data = {}) {
    var _a;
    const profileSnap = await admin.firestore().collection('profiles').doc(userId).get();
    const profile = profileSnap.data();
    if (!profile || !profile.fcm_tokens || profile.fcm_tokens.length === 0) {
        console.log(`No FCM tokens found for user ${userId}`);
        return;
    }
    const messages = [];
    profile.fcm_tokens.forEach((token) => {
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
        const response = await axios_1.default.post('https://exp.host/--/api/v2/push/send', messages, {
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
        });
        console.log('Push notification result:', response.data);
    }
    catch (error) {
        console.error('Error sending push notification:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
    }
}
/**
 * Trigger: Notify Vendor on New Order
 */
exports.onOrderCreateNotifyVendor = (0, firestore_1.onDocumentCreated)('orders/{orderId}', async (event) => {
    var _a;
    const order = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!order)
        return;
    const vendorId = order.vendor_id;
    const totalAmount = order.total_amount;
    await sendPushNotification(vendorId, 'New Order Received!', `You have a new order #${order.order_number} for ₦${totalAmount.toLocaleString()}`, { orderId: event.params.orderId, type: 'new_order' });
});
/**
 * Trigger: Notify Buyer on Order Status Update
 */
exports.onOrderStatusUpdateNotifyBuyer = (0, firestore_1.onDocumentUpdated)('orders/{orderId}', async (event) => {
    var _a, _b;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after || before.status === after.status)
        return;
    const buyerId = after.buyer_id;
    let title = 'Order Update';
    let body = `Your order #${after.order_number} status is now: ${after.status}`;
    if (after.status === 'shipped') {
        title = 'Order Shipped! 🚚';
        body = `Great news! Your order #${after.order_number} has been shipped.`;
    }
    else if (after.status === 'delivered') {
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
exports.onChatMessageNotifyRecipient = (0, firestore_1.onDocumentCreated)('chatRooms/{chatId}/messages/{messageId}', async (event) => {
    var _a, _b;
    const message = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!message)
        return;
    const chatId = event.params.chatId;
    const senderId = message.senderId;
    // Get the chat room to find the other participant
    const roomSnap = await admin.firestore().collection('chatRooms').doc(chatId).get();
    const room = roomSnap.data();
    if (!room)
        return;
    // Find the recipient (the one who is NOT the sender)
    const recipientId = room.participants.find((p) => p !== senderId);
    if (!recipientId)
        return;
    // Get sender's name for the notification
    const senderProfileSnap = await admin.firestore().collection('profiles').doc(senderId).get();
    const senderName = ((_b = senderProfileSnap.data()) === null || _b === void 0 ? void 0 : _b.full_name) || 'Someone';
    await sendPushNotification(recipientId, `New Message from ${senderName}`, message.text, { chatId, type: 'new_message' });
});
//# sourceMappingURL=notifications.js.map