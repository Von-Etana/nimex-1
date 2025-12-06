import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import * as cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// CORS Handler
const corsHandler = cors({ origin: true });

// Configuration
// In production, use functions.config().paystack.secret_key
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_placeholder";

const paystackClient = axios.create({
    baseURL: "https://api.paystack.co",
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
    },
});

// Helper: Wrap CORS and Error Handling
const wrapCors = (req: functions.https.Request, res: functions.Response, handler: () => Promise<any>) => {
    return corsHandler(req, res, async () => {
        try {
            await handler();
        } catch (error: any) {
            console.error("Function Error:", error);
            const status = error.response ? error.response.status : 500;
            const message = error.response ? error.response.data.message : error.message;
            res.status(status).json({ success: false, error: message });
        }
    });
};

/**
 * Initialize Payment (Paystack)
 */
export const initializePayment = functions.https.onRequest(async (req, res) => {
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
export const verifyPayment = functions.https.onRequest(async (req, res) => {
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
        } else {
            res.json({ success: false, error: "Payment verification failed" });
        }
    });
});

/**
 * Release Escrow (Secure Backend Logic)
 * Moves funds from Escrow to Vendor Wallet
 */
export const releaseEscrow = functions.https.onRequest(async (req, res) => {
    wrapCors(req, res, async () => {
        const { orderId, releaseType, notes, performedByUserId } = req.body;

        // Verify Inputs
        if (!orderId) throw new Error("Order ID is required");

        // Transactional Consistency
        await db.runTransaction(async (transaction) => {
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
            const currentBalance = vendorDoc.data()?.wallet_balance || 0;
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
export const refundEscrow = functions.https.onRequest(async (req, res) => {
    wrapCors(req, res, async () => {
        const { orderId, reason, performedByUserId } = req.body;

        if (!orderId) throw new Error("Order ID is required");

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
