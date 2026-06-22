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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.terminalWebhook = exports.getTerminalCarriers = exports.trackTerminalShipment = exports.quickTerminalShipment = exports.createTerminalShipment = exports.getTerminalRates = exports.resolveFlutterwaveAccount = exports.getFlutterwaveBankList = exports.rejectFlutterwaveWithdrawal = exports.approveFlutterwaveWithdrawal = exports.requestFlutterwaveWithdrawal = exports.createFlutterwaveSubaccount = exports.createFlutterwaveVirtualAccount = exports.verifyFlutterwavePayment = exports.onChatMessageNotifyRecipient = exports.onOrderStatusUpdateNotifyBuyer = exports.onOrderCreateNotifyVendor = exports.initializeFlutterwavePayment = exports.sendEmail = exports.sendTermiiSms = exports.refundEscrow = exports.releaseEscrow = exports.verifyPayment = exports.initializePayment = exports.flutterwaveWebhook = exports.paystackWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const cors_1 = __importDefault(require("cors"));
const crypto = __importStar(require("crypto"));
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// CORS Handler - Restrict to known origins
const allowedOrigins = [
    "https://nimex.ng",
    "https://www.nimex.ng",
    "https://nimex-ecommerce.web.app",
    "https://nimex-ecommerce.firebaseapp.com",
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173", "http://localhost:3000"] : []),
];
const corsHandler = (0, cors_1.default)({ origin: allowedOrigins });
// Configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ((_a = functions.config().paystack) === null || _a === void 0 ? void 0 : _a.secret_key);
if (!PAYSTACK_SECRET_KEY) {
    console.error("CRITICAL: PAYSTACK_SECRET_KEY is not configured. Payment functions will fail.");
}
const paystackClient = axios_1.default.create({
    baseURL: "https://api.paystack.co",
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
    },
});
// Helper: Verify Firebase Auth Token from Authorization header
async function verifyAuthToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw { status: 401, message: "Missing or invalid Authorization header" };
    }
    const idToken = authHeader.split("Bearer ")[1];
    try {
        return await admin.auth().verifyIdToken(idToken);
    }
    catch (_a) {
        throw { status: 401, message: "Invalid or expired auth token" };
    }
}
// Helper: Wrap CORS and Error Handling
const wrapCors = (req, res, handler) => {
    return corsHandler(req, res, async () => {
        try {
            await handler();
        }
        catch (error) {
            console.error("Function Error:", error);
            const status = error.status || (error.response ? error.response.status : 500);
            const message = error.message || (error.response ? error.response.data.message : "Internal error");
            res.status(status).json({ success: false, error: message });
        }
    });
};
/**
 * Verify Paystack Webhook Signature
 */
const verifyPaystackSignature = (payload, signature) => {
    const hash = crypto
        .createHmac("sha512", PAYSTACK_SECRET_KEY)
        .update(payload)
        .digest("hex");
    return hash === signature;
};
/**
 * Paystack Webhook Handler
 * Handles various Paystack events including:
 * - charge.success: Successful payment
 * - transfer.success: Successful transfer/payout
 * - subscription.create: New subscription
 * - charge.abandoned: User abandoned payment (DO NOT mark as failed)
 */
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
    try {
        // Only accept POST requests
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }
        // Verify webhook signature
        const signature = req.headers["x-paystack-signature"];
        const payload = JSON.stringify(req.body);
        if (!signature || !verifyPaystackSignature(payload, signature)) {
            console.warn("Invalid Paystack webhook signature");
            res.status(401).send("Invalid signature");
            return;
        }
        const event = req.body;
        const eventType = event.event;
        const data = event.data;
        console.log(`Received Paystack webhook: ${eventType}`, { reference: data.reference });
        switch (eventType) {
            case "charge.success":
                await handleChargeSuccess(data);
                break;
            case "charge.abandoned":
                // IMPORTANT: Do NOT mark as failed - user just didn't complete payment
                // This is expected behavior when user closes payment modal
                console.log(`Payment abandoned: ${data.reference} - No action taken (this is normal)`);
                // Optionally log for analytics but don't update any status
                await logPaymentEvent(data.reference, "abandoned", data);
                break;
            case "transfer.success":
                await handleTransferSuccess(data);
                break;
            case "transfer.failed":
                await handleTransferFailed(data);
                break;
            case "subscription.create":
                await handleSubscriptionCreate(data);
                break;
            case "subscription.not_renew":
                await handleSubscriptionNotRenew(data);
                break;
            default:
                console.log(`Unhandled Paystack event: ${eventType}`);
        }
        // Always return 200 to Paystack to acknowledge receipt
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error("Paystack webhook error:", error);
        // Still return 200 to prevent Paystack from retrying
        res.status(200).json({ received: true, error: error.message });
    }
});
/**
 * Verify Flutterwave Webhook Signature
 */
const verifyFlutterwaveSignature = (signature) => {
    var _a;
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH || ((_a = functions.config().flutterwave) === null || _a === void 0 ? void 0 : _a.webhook_hash);
    if (!secretHash) {
        console.warn("FLUTTERWAVE_WEBHOOK_HASH is not configured.");
        // Dev fallback to prevent signature failure during local testing
        if (process.env.NODE_ENV !== "production") {
            return true;
        }
        return false;
    }
    return signature === secretHash;
};
/**
 * Flutterwave Webhook Handler
 */
exports.flutterwaveWebhook = functions.https.onRequest(async (req, res) => {
    try {
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }
        const signature = req.headers["verif-hash"];
        if (!signature || !verifyFlutterwaveSignature(signature)) {
            console.warn("Invalid Flutterwave webhook signature");
            res.status(401).send("Invalid signature");
            return;
        }
        const payload = req.body;
        const event = payload.event;
        const data = payload.data;
        console.log(`Received Flutterwave webhook: ${event}`, { id: data === null || data === void 0 ? void 0 : data.id, reference: data === null || data === void 0 ? void 0 : data.reference });
        // Event names: "transfer.completed" or "transfer.failed"
        if (event === "transfer.completed") {
            await handleTransferSuccess({ reference: data.reference });
        }
        else if (event === "transfer.failed") {
            await handleTransferFailed({ reference: data.reference, reason: data.complete_message || "Transfer failed" });
        }
        else {
            console.log(`Unhandled Flutterwave event: ${event}`);
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error("Flutterwave webhook error:", error);
        res.status(200).json({ received: true, error: error.message });
    }
});
/**
 * Handle successful charge (payment)
 */
async function handleChargeSuccess(data) {
    const reference = data.reference;
    const amount = data.amount / 100; // Convert from kobo to naira
    const metadata = data.metadata || {};
    console.log(`Processing successful charge: ${reference}, amount: ${amount}`);
    // Check if this is a subscription payment
    if (reference.includes("NIMEX-SUB-") || metadata.type === "subscription") {
        await handleSubscriptionPayment(reference, amount, data);
    }
    // Check if this is an order payment
    else if (reference.includes("NIMEX-") || metadata.order_id) {
        await handleOrderPayment(reference, amount, data);
    }
    // Log the successful payment
    await logPaymentEvent(reference, "success", data);
}
/**
 * Handle subscription payment
 */
async function handleSubscriptionPayment(reference, amount, data) {
    var _a;
    try {
        const metadata = data.metadata || {};
        // Extract vendor ID and plan from metadata (fallback to reference for legacy compatibility)
        let vendorId = metadata.vendor_id;
        let plan = metadata.plan;
        if (!vendorId || !plan) {
            const parts = reference.split("-");
            if (parts.length >= 4 && parts[1] === "SUB") {
                vendorId = parts[2];
                plan = parts[3];
            }
            else {
                console.error("Could not parse subscription details from metadata or reference");
                return;
            }
        }
        // Server-side price validation
        const planPrices = {
            monthly: 1550,
            quarterly: 3550,
            semi_annual: 6550,
            annual: 10550,
        };
        const expectedPrice = planPrices[plan];
        if (!expectedPrice) {
            console.error(`Invalid subscription plan: ${plan}`);
            return;
        }
        if (amount < expectedPrice) {
            console.error(`Insufficient payment for ${plan} plan. Paid: ${amount}, Expected: ${expectedPrice}`);
            return;
        }
        // Get plan duration
        const planDurations = {
            monthly: 1,
            quarterly: 3,
            semi_annual: 6,
            annual: 12,
        };
        const durationMonths = planDurations[plan] || 1;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);
        // Update vendor subscription status
        await db.collection("vendors").doc(vendorId).update({
            subscription_plan: plan,
            subscription_status: "active",
            subscription_start_date: startDate.toISOString(),
            subscription_end_date: endDate.toISOString(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Log transaction for admin dashboard
        await db.collection("payment_transactions").add({
            amount: amount,
            payment_status: "paid",
            payment_method: "paystack",
            payment_reference: reference,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            vendor_id: vendorId,
            buyer_id: vendorId,
            type: "subscription",
            description: `Subscription Payment - ${plan} Plan`,
            customer_email: ((_a = data.customer) === null || _a === void 0 ? void 0 : _a.email) || "",
        });
        console.log(`Subscription activated for vendor ${vendorId}: ${plan} plan until ${endDate.toISOString()}`);
    }
    catch (error) {
        console.error("Error handling subscription payment:", error);
        throw error;
    }
}
/**
 * Handle order payment
 */
async function handleOrderPayment(reference, amount, data) {
    var _a;
    try {
        // Idempotency check: skip if this reference was already processed
        const existingTx = await db.collection("payment_transactions")
            .where("payment_reference", "==", reference)
            .where("type", "==", "order")
            .limit(1)
            .get();
        if (!existingTx.empty) {
            console.log(`Order payment already processed for reference: ${reference}, skipping.`);
            return;
        }
        const metadata = data.metadata || {};
        const orderId = metadata.order_id;
        if (orderId) {
            // Update order payment status
            const orderRef = db.collection("orders").doc(orderId);
            const orderDoc = await orderRef.get();
            if (orderDoc.exists) {
                await orderRef.update({
                    payment_status: "paid",
                    payment_reference: reference,
                    payment_method: "paystack",
                    payment_date: admin.firestore.FieldValue.serverTimestamp(),
                    updated_at: admin.firestore.FieldValue.serverTimestamp(),
                });
                // Create escrow transaction if needed
                const orderData = orderDoc.data();
                if (orderData && !orderData.escrow_id) {
                    const escrowRef = await db.collection("escrow_transactions").add({
                        order_id: orderId,
                        buyer_id: orderData.user_id,
                        vendor_id: orderData.vendor_id,
                        total_amount: amount,
                        platform_fee: Math.round(amount * 0.05 * 100) / 100, // 5% platform fee
                        vendor_amount: Math.round(amount * 0.95 * 100) / 100, // 95% to vendor
                        status: "held",
                        created_at: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    await orderRef.update({
                        escrow_id: escrowRef.id,
                        escrow_status: "held",
                    });
                    // Send SMS to Vendor
                    try {
                        const vendorDoc = await db.collection("vendors").doc(orderData.vendor_id).get();
                        const vendorData = vendorDoc.data();
                        const vendorPhone = (vendorData === null || vendorData === void 0 ? void 0 : vendorData.business_phone) || (vendorData === null || vendorData === void 0 ? void 0 : vendorData.phone);
                        if (vendorPhone) {
                            const message = `New Order! You have received a new order #${orderId} for N${amount.toLocaleString()}. Check your dashboard to process it.`;
                            await sendSmsViaTermii(vendorPhone, message);
                        }
                    }
                    catch (smsError) {
                        console.error("Failed to send order SMS to vendor:", smsError);
                    }
                }
                console.log(`Order ${orderId} marked as paid`);
            }
        }
        // Log payment transaction
        await db.collection("payment_transactions").add({
            amount: amount,
            payment_status: "paid",
            payment_method: "paystack",
            payment_reference: reference,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            order_id: orderId || null,
            buyer_id: metadata.buyer_id || null,
            type: "order",
            description: `Order Payment - ${orderId}`,
            customer_email: ((_a = data.customer) === null || _a === void 0 ? void 0 : _a.email) || "",
        });
    }
    catch (error) {
        console.error("Error handling order payment:", error);
        throw error;
    }
}
/**
 * Handle successful transfer (payout to vendor)
 */
async function handleTransferSuccess(data) {
    const reference = data.reference;
    console.log(`Transfer successful: ${reference}`);
    await db.runTransaction(async (transaction) => {
        const payoutQuery = db.collection("payouts")
            .where("transfer_reference", "==", reference)
            .limit(1);
        const payoutSnap = await transaction.get(payoutQuery);
        if (payoutSnap.empty) {
            console.warn(`No payout document found for successful transfer reference: ${reference}`);
            return;
        }
        const payoutDoc = payoutSnap.docs[0];
        // Update payout status to completed
        transaction.update(payoutDoc.ref, {
            status: "completed",
            completed_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        // Find and update corresponding wallet transaction
        const walletTxQuery = db.collection("wallet_transactions")
            .where("reference", "==", payoutDoc.data().reference)
            .limit(1);
        const walletTxSnap = await transaction.get(walletTxQuery);
        if (!walletTxSnap.empty) {
            transaction.update(walletTxSnap.docs[0].ref, {
                status: "successful",
            });
        }
    });
}
/**
 * Handle failed transfer (payout failed)
 * Performs automatic vendor wallet refund atomically.
 */
async function handleTransferFailed(data) {
    const reference = data.reference;
    console.error(`Transfer failed: ${reference}`, data);
    await db.runTransaction(async (transaction) => {
        var _a;
        // Update payout status
        const payoutQuery = db.collection("payouts")
            .where("transfer_reference", "==", reference)
            .limit(1);
        const payoutSnap = await transaction.get(payoutQuery);
        if (payoutSnap.empty) {
            console.warn(`No payout document found for failed transfer reference: ${reference}`);
            return;
        }
        const payoutDoc = payoutSnap.docs[0];
        const payoutData = payoutDoc.data();
        if (payoutData.status === "failed") {
            console.log(`Payout ${payoutDoc.id} already marked as failed`);
            return;
        }
        // Refund the vendor's wallet balance
        const vendorRef = db.collection("vendors").doc(payoutData.vendor_id);
        const vendorSnap = await transaction.get(vendorRef);
        const currentBalance = ((_a = vendorSnap.data()) === null || _a === void 0 ? void 0 : _a.wallet_balance) || 0;
        transaction.update(vendorRef, {
            wallet_balance: currentBalance + payoutData.amount,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        // Mark payout as failed
        transaction.update(payoutDoc.ref, {
            status: "failed",
            failure_reason: data.reason || "Transfer failed (reported via webhook)",
            failed_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        // Find and update corresponding wallet transaction
        const walletTxQuery = db.collection("wallet_transactions")
            .where("reference", "==", payoutData.reference)
            .limit(1);
        const walletTxSnap = await transaction.get(walletTxQuery);
        if (!walletTxSnap.empty) {
            transaction.update(walletTxSnap.docs[0].ref, {
                status: "failed",
                balance_after: currentBalance + payoutData.amount,
                description: `Failed: ${data.reason || "Bank transfer failed"}`
            });
        }
        console.log(`Successfully refunded ${payoutData.amount} to vendor ${payoutData.vendor_id} due to failed transfer ${reference}`);
    });
}
/**
 * Handle subscription creation
 */
async function handleSubscriptionCreate(data) {
    console.log(`Subscription created: ${data.subscription_code}`);
    // Handle if using Paystack's subscription feature directly
}
/**
 * Handle subscription not renewed
 */
async function handleSubscriptionNotRenew(data) {
    var _a;
    console.log(`Subscription not renewed: ${data.subscription_code}`);
    // Mark vendor subscription as expired
    if ((_a = data.customer) === null || _a === void 0 ? void 0 : _a.email) {
        const vendorQuery = await db.collection("profiles")
            .where("email", "==", data.customer.email)
            .where("role", "==", "vendor")
            .limit(1)
            .get();
        if (!vendorQuery.empty) {
            const userId = vendorQuery.docs[0].id;
            await db.collection("vendors").doc(userId).update({
                subscription_status: "expired",
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    }
}
/**
 * Log payment events for analytics/debugging
 */
async function logPaymentEvent(reference, status, data) {
    try {
        await db.collection("payment_events").add({
            reference,
            status,
            event_data: data,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        console.error("Error logging payment event:", error);
    }
}
/**
 * Initialize Payment (Paystack)
 */
exports.initializePayment = functions.https.onRequest(async (req, res) => {
    wrapCors(req, res, async () => {
        // Verify caller is authenticated
        await verifyAuthToken(req);
        const { email, amount, reference, callback_url, metadata } = req.body;
        if (!email || !amount) {
            res.status(400).json({ success: false, error: "Email and amount are required" });
            return;
        }
        const response = await paystackClient.post("/transaction/initialize", {
            email,
            amount: amount.toString(),
            reference,
            callback_url,
            metadata,
        });
        res.json({ success: true, data: response.data.data });
    });
});
/**
 * Verify Payment (Paystack)
 */
exports.verifyPayment = functions.https.onRequest(async (req, res) => {
    wrapCors(req, res, async () => {
        // Verify caller is authenticated
        await verifyAuthToken(req);
        const { reference } = req.body;
        if (!reference) {
            res.status(400).json({ success: false, error: "Reference is required" });
            return;
        }
        const response = await paystackClient.get(`/transaction/verify/${reference}`);
        const data = response.data.data;
        if (data.status === "success") {
            res.json({ success: true, data });
        }
        else {
            res.json({ success: false, error: "Payment verification failed" });
        }
    });
});
/**
 * Release Escrow (Secure Backend Logic)
 * Moves funds from Escrow to Vendor Wallet
 */
exports.releaseEscrow = functions.https.onRequest(async (req, res) => {
    wrapCors(req, res, async () => {
        var _a;
        // Verify caller is authenticated and is admin or relevant party
        const decodedToken = await verifyAuthToken(req);
        const callerUid = decodedToken.uid;
        const { orderId, releaseType, notes } = req.body;
        // Verify Inputs
        if (!orderId)
            throw new Error("Order ID is required");
        // Verify caller is admin or the buyer/vendor of this order
        const orderCheck = await db.collection("orders").doc(orderId).get();
        if (!orderCheck.exists)
            throw { status: 404, message: "Order not found" };
        const orderInfo = orderCheck.data();
        const callerProfile = await db.collection("profiles").doc(callerUid).get();
        const isAdmin = callerProfile.exists && ((_a = callerProfile.data()) === null || _a === void 0 ? void 0 : _a.role) === "admin";
        if (!isAdmin && callerUid !== orderInfo.user_id && callerUid !== orderInfo.vendor_id) {
            throw { status: 403, message: "Not authorized to release escrow for this order" };
        }
        // Transactional Consistency
        await db.runTransaction(async (transaction) => {
            var _a;
            // 1. Get Escrow Transaction
            const escrowRef = db.collection("escrow_transactions").where("order_id", "==", orderId).limit(1);
            const escrowSnapshot = await transaction.get(escrowRef);
            if (escrowSnapshot.empty) {
                throw new Error("Escrow transaction not found");
            }
            const escrowDoc = escrowSnapshot.docs[0];
            const escrowData = escrowDoc.data();
            if (escrowData.status !== "held") {
                throw new Error(`Escrow status is '${escrowData.status}', cannot release.`);
            }
            // 2. Get Vendor
            const vendorRef = db.collection("vendors").doc(escrowData.vendor_id);
            const vendorDoc = await transaction.get(vendorRef);
            if (!vendorDoc.exists) {
                throw new Error("Vendor not found");
            }
            // 3. Update Escrow Status
            transaction.update(escrowDoc.ref, {
                status: "released",
                released_at: admin.firestore.FieldValue.serverTimestamp(),
                release_reason: notes || "Delivery Confirmed",
                release_type: releaseType // 'manual_buyer', 'auto', etc.
            });
            // 4. Update Vendor Balance (atomic increment to prevent race conditions)
            const creditAmount = Number(escrowData.vendor_amount);
            transaction.update(vendorRef, {
                wallet_balance: admin.firestore.FieldValue.increment(creditAmount),
                total_sales: admin.firestore.FieldValue.increment(1)
            });
            const newBalance = (((_a = vendorDoc.data()) === null || _a === void 0 ? void 0 : _a.wallet_balance) || 0) + creditAmount;
            // 5. Create Wallet Transaction Record
            const txRef = db.collection("wallet_transactions").doc();
            transaction.set(txRef, {
                vendor_id: escrowData.vendor_id,
                type: "sale",
                amount: creditAmount,
                balance_after: newBalance,
                reference: `ESCROW-${escrowDoc.id}`,
                description: `Payment released for Order #${orderId}`,
                status: "completed",
                created_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            // 6. Update Order Status (Sync)
            const orderRef = db.collection("orders").doc(orderId);
            transaction.update(orderRef, {
                escrow_status: "released",
                status: "delivered", // Assuming release means delivered/completed
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            });
            // 7. Update Delivery Status (Sync)
            const deliveryRef = db.collection("deliveries").where("order_id", "==", orderId).limit(1);
            const deliverySnap = await transaction.get(deliveryRef);
            if (!deliverySnap.empty) {
                const deliveryDoc = deliverySnap.docs[0];
                transaction.update(deliveryDoc.ref, {
                    delivery_status: "delivered",
                    actual_delivery_date: admin.firestore.FieldValue.serverTimestamp(),
                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                });
                // Add status history
                const historyRef = db.collection("delivery_status_history").doc();
                transaction.set(historyRef, {
                    delivery_id: deliveryDoc.id,
                    status: "delivered",
                    location: "Delivered",
                    notes: "Delivery confirmed and escrow released",
                    updated_by: "system_escrow_release",
                    created_at: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            // 8. Create escrow release record (audit trail)
            const releaseRef = db.collection("escrow_releases").doc();
            transaction.set(releaseRef, {
                escrow_transaction_id: escrowDoc.id,
                release_type: releaseType || "manual_buyer",
                buyer_confirmed_delivery: true,
                delivery_confirmed_at: admin.firestore.FieldValue.serverTimestamp(),
                release_requested_by: callerUid,
                created_at: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        // Post-transaction SMS (Safe to do here)
        try {
            // Need to fetch order again or use what we had? We didn't keep order data out of transaction scope.
            // Let's just fetch the buyer profile directly since we have buyer_id from inputs? 
            // Wait, we don't have buyer_id in inputs. We have it in `escrowData` but that was inside transaction.
            // To be efficient, let's just do a quick lookup or rely on a separate trigger.
            // For now, let's do a quick lookup of the order to get buyer_id.
            const orderSnap = await db.collection("orders").doc(orderId).get();
            const orderData = orderSnap.data();
            if (orderData === null || orderData === void 0 ? void 0 : orderData.user_id) {
                const profileSnap = await db.collection("profiles").doc(orderData.user_id).get();
                const profileData = profileSnap.data();
                const buyerPhone = profileData === null || profileData === void 0 ? void 0 : profileData.phone;
                if (buyerPhone) {
                    const message = `Order Delivered! Your order #${orderId} has been confirmed delivered. Thank you for shopping with Nimex.`;
                    await sendSmsViaTermii(buyerPhone, message);
                }
            }
        }
        catch (smsError) {
            console.error("Failed to send delivery SMS to buyer:", smsError);
        }
        res.json({ success: true, message: "Escrow released successfully" });
    });
});
/**
 * Refund Escrow (Secure Backend Logic)
 * Marks Escrow as refunded and updates Order
 * Note: Actual money refund via Paystack/Flutterwave API is a separate step usually.
 * This logic handles the SYSTEM state.
 */
exports.refundEscrow = functions.https.onRequest(async (req, res) => {
    wrapCors(req, res, async () => {
        var _a;
        // Verify caller is authenticated and authorized
        const decodedToken = await verifyAuthToken(req);
        const callerUid = decodedToken.uid;
        const { orderId, reason } = req.body;
        if (!orderId)
            throw new Error("Order ID is required");
        // Verify caller is admin or the buyer of this order
        const orderCheck = await db.collection("orders").doc(orderId).get();
        if (!orderCheck.exists)
            throw { status: 404, message: "Order not found" };
        const orderInfo = orderCheck.data();
        const callerProfile = await db.collection("profiles").doc(callerUid).get();
        const isAdmin = callerProfile.exists && ((_a = callerProfile.data()) === null || _a === void 0 ? void 0 : _a.role) === "admin";
        if (!isAdmin && callerUid !== orderInfo.user_id) {
            throw { status: 403, message: "Not authorized to refund this order" };
        }
        const performedByUserId = callerUid;
        await db.runTransaction(async (transaction) => {
            const escrowRef = db.collection("escrow_transactions").where("order_id", "==", orderId).limit(1);
            const escrowSnapshot = await transaction.get(escrowRef);
            if (escrowSnapshot.empty) {
                throw new Error("Escrow transaction not found");
            }
            const escrowDoc = escrowSnapshot.docs[0];
            const escrowData = escrowDoc.data();
            if (escrowData.status !== "held") {
                throw new Error(`Escrow status is '${escrowData.status}', cannot refund.`);
            }
            // Update Escrow
            transaction.update(escrowDoc.ref, {
                status: "refunded",
                released_at: admin.firestore.FieldValue.serverTimestamp(),
                release_reason: reason || "Refunded",
                refunded_by: performedByUserId
            });
            // Update Order
            const orderRef = db.collection("orders").doc(orderId);
            transaction.update(orderRef, {
                status: "cancelled",
                payment_status: "refunded",
                escrow_status: "refunded",
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            });
            // Note: If you need to trigger Paystack Refund API, do it here.
        });
        res.json({ success: true, message: "Escrow refunded/cancelled successfully" });
    });
});
// Helper: Send SMS via Termii
async function sendSmsViaTermii(to, message) {
    var _a, _b, _c, _d, _e, _f;
    const apiKey = process.env.TERMII_API_KEY || ((_a = functions.config().termii) === null || _a === void 0 ? void 0 : _a.api_key);
    const baseUrl = process.env.TERMII_BASE_URL || ((_b = functions.config().termii) === null || _b === void 0 ? void 0 : _b.base_url) || "https://v3.api.termii.com";
    const senderId = process.env.TERMII_SENDER_ID || ((_c = functions.config().termii) === null || _c === void 0 ? void 0 : _c.sender_id) || "NIMEX";
    if (!apiKey) {
        throw new Error("Termii API Key is missing");
    }
    try {
        const payload = {
            to: to,
            from: senderId,
            sms: message,
            type: "plain",
            channel: "generic",
            api_key: apiKey,
        };
        console.log(`Sending Termii SMS to ${to}: ${message}`);
        const response = await axios_1.default.post(`${baseUrl}/api/sms/send`, payload);
        console.log("Termii API Response:", response.data);
        return response.data;
    }
    catch (error) {
        console.error("Termii SMS Error:", ((_d = error.response) === null || _d === void 0 ? void 0 : _d.data) || error.message);
        throw new Error(((_f = (_e = error.response) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f.message) || "Failed to send SMS via Termii");
    }
}
/**
 * Send SMS (Termii) - Callable Function
 * Secure endpoint to send SMS from client
 */
exports.sendTermiiSms = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required to send SMS');
    }
    // Determine if it's v1 (data, context) or v2 (request)
    // The type error suggested it's CallableRequest, so let's handle both or assume v2 structure if typed that way.
    // Actually, to be safe and avoid type errors, let's cast or check.
    // However, since we saw "Property 'to' does not exist on type 'CallableRequest'", the first arg IS the request object.
    const data = request.data || request; // Fallback if it's actually v1 and request IS data
    // const context = request.auth ? { auth: request.auth } : request.context; // Unused
    const { to, message } = data;
    if (!to || !message) {
        throw new functions.https.HttpsError('invalid-argument', 'Recipient (to) and message are required');
    }
    try {
        const result = await sendSmsViaTermii(to, message);
        return { success: true, data: result };
    }
    catch (error) {
        console.error("Termii send error:", error);
        throw new functions.https.HttpsError('internal', error.message || "Failed to send SMS");
    }
});
/**
 * Send Email (SendGrid) - Callable Function
 * Secure endpoint to send emails from client
 */
exports.sendEmail = functions.https.onCall(async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required to send email');
    }
    const data = request.data || request;
    const { to, subject, html } = data;
    if (!to || !subject || !html) {
        throw new functions.https.HttpsError('invalid-argument', 'Recipient (to), subject, and html content are required');
    }
    const apiKey = process.env.SENDGRID_API_KEY || ((_a = functions.config().sendgrid) === null || _a === void 0 ? void 0 : _a.api_key);
    if (!apiKey) {
        throw new functions.https.HttpsError('failed-precondition', 'SendGrid API key not configured');
    }
    try {
        await axios_1.default.post('https://api.sendgrid.com/v3/mail/send', {
            personalizations: [{ to: [{ email: to }] }],
            from: { email: 'noreply@nimex.ng', name: 'NIMEX' },
            subject,
            content: [{ type: 'text/html', value: html }]
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        return { success: true };
    }
    catch (error) {
        console.error("SendGrid error:", ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
        throw new functions.https.HttpsError('internal', "Failed to send email via SendGrid");
    }
});
// Export Flutterwave Functions
const flw = __importStar(require("./flutterwave"));
exports.initializeFlutterwavePayment = flw.initializeFlutterwavePayment;
// Export Notification Functions
const notifications = __importStar(require("./notifications"));
exports.onOrderCreateNotifyVendor = notifications.onOrderCreateNotifyVendor;
exports.onOrderStatusUpdateNotifyBuyer = notifications.onOrderStatusUpdateNotifyBuyer;
exports.onChatMessageNotifyRecipient = notifications.onChatMessageNotifyRecipient;
exports.verifyFlutterwavePayment = flw.verifyFlutterwavePayment;
exports.createFlutterwaveVirtualAccount = flw.createFlutterwaveVirtualAccount;
exports.createFlutterwaveSubaccount = flw.createFlutterwaveSubaccount;
exports.requestFlutterwaveWithdrawal = flw.requestFlutterwaveWithdrawal;
exports.approveFlutterwaveWithdrawal = flw.approveFlutterwaveWithdrawal;
exports.rejectFlutterwaveWithdrawal = flw.rejectFlutterwaveWithdrawal;
exports.getFlutterwaveBankList = flw.getFlutterwaveBankList;
exports.resolveFlutterwaveAccount = flw.resolveFlutterwaveAccount;
// Export Terminal Africa Functions
const terminal = __importStar(require("./terminal"));
exports.getTerminalRates = terminal.getTerminalRates;
exports.createTerminalShipment = terminal.createTerminalShipment;
exports.quickTerminalShipment = terminal.quickTerminalShipment;
exports.trackTerminalShipment = terminal.trackTerminalShipment;
exports.getTerminalCarriers = terminal.getTerminalCarriers;
exports.terminalWebhook = terminal.terminalWebhook;
//# sourceMappingURL=index.js.map