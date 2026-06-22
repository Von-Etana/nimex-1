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
exports.resolveFlutterwaveAccount = exports.getFlutterwaveBankList = exports.rejectFlutterwaveWithdrawal = exports.approveFlutterwaveWithdrawal = exports.requestFlutterwaveWithdrawal = exports.createFlutterwaveSubaccount = exports.createFlutterwaveVirtualAccount = exports.verifyFlutterwavePayment = exports.initializeFlutterwavePayment = void 0;
const functions = __importStar(require("firebase-functions"));
const axios_1 = __importDefault(require("axios"));
const admin = __importStar(require("firebase-admin"));
// Use existing admin app or initialize
const app = admin.apps.length ? admin.app() : admin.initializeApp();
const db = app.firestore();
// Flutterwave API v3 base URL
const FLW_BASE_URL = "https://api.flutterwave.com/v3";
/**
 * Create a configured Flutterwave Axios client
 */
function getFlwClient() {
    var _a;
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY ||
        ((_a = functions.config().flutterwave) === null || _a === void 0 ? void 0 : _a.secret_key);
    if (!secretKey) {
        throw new functions.https.HttpsError("failed-precondition", "Flutterwave secret key not configured. Set FLUTTERWAVE_SECRET_KEY in .env or firebase config.");
    }
    return axios_1.default.create({
        baseURL: FLW_BASE_URL,
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
        },
    });
}
// ─── 1. Initialize Payment ──────────────────────────────────────────────────
exports.initializeFlutterwavePayment = functions.https.onCall(async (request) => {
    var _a, _b, _c;
    const data = request.data || request;
    const { email, amount, tx_ref, redirect_url, customer, metadata } = data;
    if (!email || !amount || !tx_ref) {
        throw new functions.https.HttpsError("invalid-argument", "email, amount, and tx_ref are required");
    }
    try {
        const client = getFlwClient();
        const response = await client.post("/payments", {
            tx_ref,
            amount,
            currency: "NGN",
            redirect_url: redirect_url || "https://nimex.ng/payment/callback",
            customer: customer || { email },
            meta: metadata || {},
            customizations: {
                title: "NIMEX Payments",
                description: "Payment for items in cart",
                logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
            },
        });
        return {
            success: true,
            data: {
                link: response.data.data.link,
                tx_ref,
            },
        };
    }
    catch (error) {
        console.error("Flutterwave payment init error:", ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new functions.https.HttpsError("internal", ((_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message || "Failed to initialize payment");
    }
});
// ─── 2. Verify Payment ─────────────────────────────────────────────────────
exports.verifyFlutterwavePayment = functions.https.onCall(async (request) => {
    var _a, _b, _c;
    const data = request.data || request;
    const { transaction_id } = data;
    if (!transaction_id) {
        throw new functions.https.HttpsError("invalid-argument", "transaction_id is required");
    }
    try {
        const client = getFlwClient();
        const response = await client.get(`/transactions/${transaction_id}/verify`);
        const txData = response.data.data;
        return {
            success: txData.status === "successful",
            data: {
                status: txData.status,
                amount: txData.amount,
                currency: txData.currency,
                tx_ref: txData.tx_ref,
                flw_ref: txData.flw_ref,
                customer: txData.customer,
                meta: txData.meta,
            },
        };
    }
    catch (error) {
        console.error("Flutterwave verify error:", ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new functions.https.HttpsError("internal", ((_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message || "Failed to verify payment");
    }
});
// ─── 3. Create Virtual Account (NUBAN) ─────────────────────────────────────
exports.createFlutterwaveVirtualAccount = functions.https.onCall(async (request) => {
    var _a, _b, _c;
    const data = request.data || request;
    const { email, tx_ref, is_permanent, bvn, phonenumber, firstname, lastname, narration, } = data;
    if (!email || !tx_ref || !bvn) {
        throw new functions.https.HttpsError("invalid-argument", "email, tx_ref, and bvn are required");
    }
    try {
        const client = getFlwClient();
        const response = await client.post("/virtual-account-numbers", {
            email,
            tx_ref,
            is_permanent: is_permanent !== null && is_permanent !== void 0 ? is_permanent : true,
            bvn,
            phonenumber,
            firstname,
            lastname,
            narration: narration || "NIMEX Vendor Wallet",
        });
        const acctData = response.data.data;
        return {
            success: true,
            data: {
                account_number: acctData.account_number,
                bank_name: acctData.bank_name,
                order_ref: acctData.order_ref,
                flw_ref: acctData.flw_ref,
                expiry_date: acctData.expiry_date,
            },
        };
    }
    catch (error) {
        console.error("Flutterwave virtual account error:", ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new functions.https.HttpsError("internal", ((_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message || "Failed to create virtual account");
    }
});
// ─── 4. Create Subaccount (Vendor Wallet) ───────────────────────────────────
exports.createFlutterwaveSubaccount = functions.https.onCall(async (request) => {
    var _a, _b, _c;
    const data = request.data || request;
    const { business_name, business_email, business_mobile, account_bank, account_number, country, } = data;
    if (!business_name || !business_email || !account_bank || !account_number) {
        throw new functions.https.HttpsError("invalid-argument", "business_name, business_email, account_bank, and account_number are required");
    }
    try {
        const client = getFlwClient();
        const response = await client.post("/subaccounts", {
            business_name,
            business_email,
            business_mobile: business_mobile || "",
            account_bank,
            account_number,
            country: country || "NG",
            split_type: "percentage",
            split_value: 0.95, // Vendor gets 95%, platform keeps 5%
        });
        const subData = response.data.data;
        return {
            success: true,
            data: {
                subaccount_id: subData.subaccount_id || subData.id,
                account_number: subData.account_number,
                bank_name: subData.bank_name,
                account_name: subData.full_name || business_name,
            },
        };
    }
    catch (error) {
        console.error("Flutterwave subaccount error:", ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new functions.https.HttpsError("internal", ((_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message || "Failed to create subaccount");
    }
});
// ─── 5. Request Withdrawal (Create Pending Payout) ─────────────────────────
exports.requestFlutterwaveWithdrawal = functions.https.onCall(async (request) => {
    // 1. Verify Authentication
    if (!request.auth || !request.auth.uid) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required to request withdrawal");
    }
    const vendorId = request.auth.uid;
    const data = request.data || request;
    const { account_bank, bank_code, bank_name, account_number, amount, narration, reference } = data;
    const finalBankCode = bank_code || account_bank;
    if (!finalBankCode || !account_number || !amount) {
        throw new functions.https.HttpsError("invalid-argument", "Bank code, account_number, and amount are required");
    }
    if (amount <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "Amount must be greater than zero");
    }
    const payoutReference = reference || `NIMEX-WDL-${Date.now()}`;
    let payoutDocId = '';
    try {
        // 2. Transaction to check balance and deduct atomically
        await db.runTransaction(async (transaction) => {
            const vendorRef = db.collection("vendors").doc(vendorId);
            const vendorSnap = await transaction.get(vendorRef);
            if (!vendorSnap.exists) {
                throw new functions.https.HttpsError("not-found", "Vendor record not found");
            }
            const vendorData = vendorSnap.data();
            const currentBalance = (vendorData === null || vendorData === void 0 ? void 0 : vendorData.wallet_balance) || 0;
            if (currentBalance < amount) {
                throw new functions.https.HttpsError("failed-precondition", "Insufficient wallet balance");
            }
            // Deduct balance
            transaction.update(vendorRef, {
                wallet_balance: currentBalance - amount,
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            });
            // Create payout record
            const payoutRef = db.collection("payouts").doc();
            payoutDocId = payoutRef.id;
            transaction.set(payoutRef, {
                vendor_id: vendorId,
                amount: amount,
                bank_code: finalBankCode,
                bank_name: bank_name || finalBankCode,
                account_number: account_number,
                account_name: (vendorData === null || vendorData === void 0 ? void 0 : vendorData.business_name) || "Vendor",
                status: "pending",
                reference: payoutReference,
                requested_at: admin.firestore.FieldValue.serverTimestamp(),
                created_at: new Date().toISOString()
            });
            // Create wallet transaction record
            const walletTxRef = db.collection("wallet_transactions").doc();
            transaction.set(walletTxRef, {
                vendor_id: vendorId,
                type: "withdrawal",
                amount: amount,
                balance_after: currentBalance - amount,
                reference: payoutReference,
                description: narration || `Withdrawal to ${bank_name || finalBankCode} account`,
                status: "pending",
                created_at: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        return {
            success: true,
            data: {
                payoutId: payoutDocId,
                reference: payoutReference,
                status: "pending",
                amount: amount,
            },
        };
    }
    catch (error) {
        console.error("Flutterwave request withdrawal error:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", error.message || "Failed to request withdrawal");
    }
});
// ─── 5b. Approve Withdrawal (Trigger Payout via Flutterwave) ───────────────
exports.approveFlutterwaveWithdrawal = functions.https.onCall(async (request) => {
    var _a, _b, _c, _d;
    // 1. Verify Authentication
    if (!request.auth || !request.auth.uid) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required to approve withdrawal");
    }
    // 2. Verify Admin Role
    const callerProfile = await db.collection("profiles").doc(request.auth.uid).get();
    const isAdmin = callerProfile.exists && ((_a = callerProfile.data()) === null || _a === void 0 ? void 0 : _a.role) === "admin";
    if (!isAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Only administrators can approve payouts.");
    }
    const data = request.data || request;
    const { payoutId } = data;
    if (!payoutId) {
        throw new functions.https.HttpsError("invalid-argument", "payoutId is required");
    }
    let payoutData = null;
    try {
        // 3. Update Payout and Wallet Transaction to 'processing'
        await db.runTransaction(async (transaction) => {
            const payoutRef = db.collection("payouts").doc(payoutId);
            const payoutSnap = await transaction.get(payoutRef);
            if (!payoutSnap.exists) {
                throw new functions.https.HttpsError("not-found", "Payout request not found");
            }
            payoutData = payoutSnap.data();
            if (payoutData.status !== "pending") {
                throw new functions.https.HttpsError("failed-precondition", `Payout request is not pending (current status: ${payoutData.status})`);
            }
            // Update payout status to processing
            transaction.update(payoutRef, {
                status: "processing",
                approved_at: admin.firestore.FieldValue.serverTimestamp(),
                approved_by: request.auth.uid,
            });
            // Find corresponding wallet transaction
            const walletTxQuery = db.collection("wallet_transactions")
                .where("reference", "==", payoutData.reference)
                .limit(1);
            const walletTxSnap = await transaction.get(walletTxQuery);
            if (!walletTxSnap.empty) {
                transaction.update(walletTxSnap.docs[0].ref, {
                    status: "processing",
                });
            }
        });
        // 4. Call Flutterwave Transfers API
        const client = getFlwClient();
        const response = await client.post("/transfers", {
            account_bank: payoutData.bank_code || payoutData.bank_name,
            account_number: payoutData.account_number,
            amount: payoutData.amount,
            narration: `NIMEX Payout - ${payoutData.reference}`,
            currency: "NGN",
            reference: payoutData.reference,
        });
        const txData = response.data.data;
        await db.collection("payouts").doc(payoutId).update({
            transfer_reference: txData.reference,
            transfer_id: txData.id,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        return {
            success: true,
            data: {
                id: txData.id,
                reference: txData.reference,
                status: txData.status,
                amount: txData.amount,
            },
        };
    }
    catch (error) {
        console.error("Flutterwave payout approval error:", ((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
        // 5. Refund if the API call failed immediately
        if (payoutData) {
            try {
                await db.runTransaction(async (transaction) => {
                    var _a, _b, _c;
                    const vendorRef = db.collection("vendors").doc(payoutData.vendor_id);
                    const payoutRef = db.collection("payouts").doc(payoutId);
                    const vendorSnap = await transaction.get(vendorRef);
                    const currentBalance = ((_a = vendorSnap.data()) === null || _a === void 0 ? void 0 : _a.wallet_balance) || 0;
                    transaction.update(vendorRef, {
                        wallet_balance: currentBalance + payoutData.amount,
                        updated_at: admin.firestore.FieldValue.serverTimestamp()
                    });
                    transaction.update(payoutRef, {
                        status: "failed",
                        failure_reason: ((_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message || "Failed to initiate Flutterwave transfer",
                        updated_at: admin.firestore.FieldValue.serverTimestamp()
                    });
                    // Update wallet transaction to failed
                    const walletTxQuery = db.collection("wallet_transactions")
                        .where("reference", "==", payoutData.reference)
                        .limit(1);
                    const walletTxSnap = await transaction.get(walletTxQuery);
                    if (!walletTxSnap.empty) {
                        transaction.update(walletTxSnap.docs[0].ref, {
                            status: "failed",
                            balance_after: currentBalance + payoutData.amount,
                        });
                    }
                });
                console.log(`Refunded ${payoutData.amount} to vendor ${payoutData.vendor_id} after failed transfer API call`);
            }
            catch (refundError) {
                console.error("CRITICAL: Failed to refund vendor after approval API error:", refundError);
            }
        }
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", ((_d = (_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) || error.message || "Failed to process withdrawal approval");
    }
});
// ─── 5c. Reject Withdrawal (Refund Vendor Balance) ─────────────────────────
exports.rejectFlutterwaveWithdrawal = functions.https.onCall(async (request) => {
    var _a;
    // 1. Verify Authentication
    if (!request.auth || !request.auth.uid) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required to reject withdrawal");
    }
    // 2. Verify Admin Role
    const callerProfile = await db.collection("profiles").doc(request.auth.uid).get();
    const isAdmin = callerProfile.exists && ((_a = callerProfile.data()) === null || _a === void 0 ? void 0 : _a.role) === "admin";
    if (!isAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Only administrators can reject payouts.");
    }
    const data = request.data || request;
    const { payoutId, reason } = data;
    if (!payoutId) {
        throw new functions.https.HttpsError("invalid-argument", "payoutId is required");
    }
    try {
        await db.runTransaction(async (transaction) => {
            var _a;
            const payoutRef = db.collection("payouts").doc(payoutId);
            const payoutSnap = await transaction.get(payoutRef);
            if (!payoutSnap.exists) {
                throw new functions.https.HttpsError("not-found", "Payout request not found");
            }
            const payoutData = payoutSnap.data();
            if (!payoutData) {
                throw new functions.https.HttpsError("not-found", "Payout request data is empty");
            }
            if (payoutData.status !== "pending") {
                throw new functions.https.HttpsError("failed-precondition", `Payout request is not pending (current status: ${payoutData.status})`);
            }
            // 3. Refund the vendor's wallet balance
            const vendorRef = db.collection("vendors").doc(payoutData.vendor_id);
            const vendorSnap = await transaction.get(vendorRef);
            const currentBalance = ((_a = vendorSnap.data()) === null || _a === void 0 ? void 0 : _a.wallet_balance) || 0;
            transaction.update(vendorRef, {
                wallet_balance: currentBalance + payoutData.amount,
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update payout status to rejected
            transaction.update(payoutRef, {
                status: "failed",
                failure_reason: reason || "Rejected by administrator",
                rejected_at: admin.firestore.FieldValue.serverTimestamp(),
                rejected_by: request.auth.uid,
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            });
            // Find corresponding wallet transaction
            const walletTxQuery = db.collection("wallet_transactions")
                .where("reference", "==", payoutData.reference)
                .limit(1);
            const walletTxSnap = await transaction.get(walletTxQuery);
            if (!walletTxSnap.empty) {
                transaction.update(walletTxSnap.docs[0].ref, {
                    status: "failed",
                    balance_after: currentBalance + payoutData.amount,
                    description: `Rejected: ${reason || "Withdrawal rejected by admin"}`
                });
            }
        });
        return { success: true };
    }
    catch (error) {
        console.error("Flutterwave payout rejection error:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", error.message || "Failed to process withdrawal rejection");
    }
});
// ─── 6. Get Bank List ───────────────────────────────────────────────────────
exports.getFlutterwaveBankList = functions.https.onCall(async (request) => {
    var _a, _b, _c;
    const data = request.data || request;
    const country = (data === null || data === void 0 ? void 0 : data.country) || "NG";
    try {
        const client = getFlwClient();
        const response = await client.get(`/banks/${country}`);
        const banks = response.data.data.map((bank) => ({
            name: bank.name,
            code: bank.code,
        }));
        return { success: true, banks };
    }
    catch (error) {
        console.error("Flutterwave bank list error:", ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new functions.https.HttpsError("internal", ((_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message || "Failed to fetch bank list");
    }
});
// ─── 7. Resolve Account Number ──────────────────────────────────────────────
exports.resolveFlutterwaveAccount = functions.https.onCall(async (request) => {
    var _a, _b, _c;
    const data = request.data || request;
    const { account_number, account_bank } = data;
    if (!account_number || !account_bank) {
        throw new functions.https.HttpsError("invalid-argument", "account_number and account_bank are required");
    }
    try {
        const client = getFlwClient();
        const response = await client.post("/accounts/resolve", {
            account_number,
            account_bank,
        });
        const acctData = response.data.data;
        return {
            success: true,
            data: {
                account_name: acctData.account_name,
                account_number: acctData.account_number,
            },
        };
    }
    catch (error) {
        console.error("Flutterwave resolve error:", ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new functions.https.HttpsError("internal", ((_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message || "Failed to resolve account");
    }
});
//# sourceMappingURL=flutterwave.js.map