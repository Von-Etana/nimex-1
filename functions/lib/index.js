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
exports.refundEscrow = exports.releaseEscrow = exports.verifyPayment = exports.initializePayment = exports.paystackWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const cors_1 = __importDefault(require("cors"));
const crypto = __importStar(require("crypto"));
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// CORS Handler
const corsHandler = (0, cors_1.default)({ origin: true });
// Configuration
// In production, use functions.config().paystack.secret_key
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_placeholder";
const paystackClient = axios_1.default.create({
    baseURL: "https://api.paystack.co",
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
    },
});
// Helper: Wrap CORS and Error Handling
const wrapCors = (req, res, handler) => {
    return corsHandler(req, res, async () => {
        try {
            await handler();
        }
        catch (error) {
            console.error("Function Error:", error);
            const status = error.response ? error.response.status : 500;
            const message = error.response ? error.response.data.message : error.message;
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
        // Extract vendor ID and plan from reference: NIMEX-SUB-{vendorId}-{plan}-{timestamp}
        const parts = reference.split("-");
        if (parts.length >= 4 && parts[1] === "SUB") {
            const vendorId = parts[2];
            const plan = parts[3];
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
    // Update payout status if exists
    const payoutQuery = await db.collection("payouts")
        .where("transfer_reference", "==", reference)
        .limit(1)
        .get();
    if (!payoutQuery.empty) {
        await payoutQuery.docs[0].ref.update({
            status: "completed",
            completed_at: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
}
/**
 * Handle failed transfer (payout failed)
 */
async function handleTransferFailed(data) {
    const reference = data.reference;
    console.error(`Transfer failed: ${reference}`, data);
    // Update payout status
    const payoutQuery = await db.collection("payouts")
        .where("transfer_reference", "==", reference)
        .limit(1)
        .get();
    if (!payoutQuery.empty) {
        await payoutQuery.docs[0].ref.update({
            status: "failed",
            failure_reason: data.reason || "Unknown error",
            failed_at: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
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
        const { email, amount, reference, callback_url, metadata } = req.body;
        if (!email || !amount) {
            res.status(400).json({ success: false, error: "Email and amount are required" });
            return;
        }
        const response = await paystackClient.post("/transaction/initialize", {
            email,
            amount: amount.toString(), // Paystack expects string or number (in kobo)
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
        const { reference } = req.body;
        if (!reference) {
            res.status(400).json({ success: false, error: "Reference is required" });
            return;
        }
        const response = await paystackClient.get(`/transaction/verify/${reference}`);
        const data = response.data.data;
        if (data.status === "success") {
            // Check if this was a subscription payment/order and update DB if needed?
            // For now, return verification to client, client calls next step or we handle webhook.
            // Best practice: Use Webhooks. But for this migration, we mirror current flow.
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
        const { orderId, releaseType, notes, performedByUserId: _performedByUserId } = req.body;
        // Verify Inputs
        if (!orderId)
            throw new Error("Order ID is required");
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
            // 4. Update Vendor Balance
            const currentBalance = ((_a = vendorDoc.data()) === null || _a === void 0 ? void 0 : _a.wallet_balance) || 0;
            const creditAmount = Number(escrowData.vendor_amount);
            const newBalance = currentBalance + creditAmount;
            transaction.update(vendorRef, {
                wallet_balance: newBalance,
                total_sales: admin.firestore.FieldValue.increment(1) // Optional: increment sales count
            });
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
        });
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
        const { orderId, reason, performedByUserId } = req.body;
        if (!orderId)
            throw new Error("Order ID is required");
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
//# sourceMappingURL=index.js.map