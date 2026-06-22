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
Object.defineProperty(exports, "__esModule", { value: true });
exports.terminalWebhook = exports.getTerminalCarriers = exports.trackTerminalShipment = exports.quickTerminalShipment = exports.createTerminalShipment = exports.getTerminalRates = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const axios_1 = __importStar(require("axios"));
// ─────────────────────────────────────────────────────────────────────────────
// Config helpers
// ─────────────────────────────────────────────────────────────────────────────
const getTerminalConfig = () => {
    const config = functions.config().terminal;
    return {
        baseUrl: process.env.TERMINAL_BASE_URL ||
            (config === null || config === void 0 ? void 0 : config.base_url) ||
            "https://api.terminal.africa/v1",
        secretKey: process.env.TERMINAL_SECRET_KEY || (config === null || config === void 0 ? void 0 : config.secret_key),
        webhookSecret: process.env.TERMINAL_WEBHOOK_SECRET || (config === null || config === void 0 ? void 0 : config.webhook_secret),
    };
};
/**
 * Build an Axios client pre-configured for Terminal Africa.
 * Throws an HttpsError (internal) if the secret key is not set.
 */
const terminalClient = () => {
    const { baseUrl, secretKey } = getTerminalConfig();
    if (!secretKey) {
        throw new functions.https.HttpsError("failed-precondition", "Terminal Africa Secret Key is missing. Configure TERMINAL_SECRET_KEY.");
    }
    return axios_1.default.create({
        baseURL: baseUrl,
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
        },
    });
};
/**
 * Normalise an error thrown by Axios into a human-readable message.
 * Handles cases where Terminal Africa returns HTML (e.g. 502 / 504 gateway
 * errors) instead of a JSON body.
 */
const extractAxiosErrorMessage = (error) => {
    var _a, _b, _c;
    if (error instanceof axios_1.AxiosError) {
        const responseData = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data;
        // If the response body is a non-empty string (HTML, plain-text) use a
        // generic message to avoid leaking raw HTML to the caller.
        if (typeof responseData === "string" && responseData.trim().length > 0) {
            return `Terminal Africa returned an unexpected response (HTTP ${(_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.status) !== null && _c !== void 0 ? _c : "unknown"}). The service may be temporarily unavailable.`;
        }
        // JSON body with a message field
        if (responseData === null || responseData === void 0 ? void 0 : responseData.message) {
            return responseData.message;
        }
        // Axios-level message (network timeout, ECONNREFUSED, etc.)
        if (error.message) {
            return error.message;
        }
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "An unexpected error occurred while contacting Terminal Africa.";
};
// ─────────────────────────────────────────────────────────────────────────────
// 1. Get Shipping Rates
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Fetch available carriers and their prices for a given shipment.
 *
 * Flow:
 *   a) Create a draft shipment to obtain a shipmentId
 *   b) Query /shipments/{id}/rates to get carrier options
 *
 * Falls back to mock data when TERMINAL_SECRET_KEY is not configured.
 */
exports.getTerminalRates = functions.https.onCall(async (request) => {
    const data = request.data || request;
    const { pickup_address, delivery_address, parcels } = data;
    if (!pickup_address || !delivery_address || !parcels) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required shipment details: pickup_address, delivery_address, parcels.");
    }
    if (!Array.isArray(parcels) || parcels.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "parcels must be a non-empty array.");
    }
    const { secretKey } = getTerminalConfig();
    // ── Mock mode (no API key) ──────────────────────────────────────────────
    if (!secretKey) {
        console.log("Terminal API Secret Key missing. Returning mock rates.");
        const shipmentId = "mock_shipment_" + Math.floor(Math.random() * 1000000);
        return {
            success: true,
            data: {
                shipmentId,
                rates: [
                    {
                        id: "rate_mock_sendbox",
                        carrier_name: "Sendbox (Mock)",
                        amount: 1500,
                        currency: "NGN",
                        duration: "3-5 Days",
                        carrier_id: "carrier_mock_sendbox",
                    },
                    {
                        id: "rate_mock_dhl",
                        carrier_name: "DHL Express (Mock)",
                        amount: 3500,
                        currency: "NGN",
                        duration: "1-2 Days",
                        carrier_id: "carrier_mock_dhl",
                    },
                    {
                        id: "rate_mock_fedex",
                        carrier_name: "FedEx (Mock)",
                        amount: 5000,
                        currency: "NGN",
                        duration: "1 Day",
                        carrier_id: "carrier_mock_fedex",
                    },
                ],
            },
        };
    }
    // ── Live mode ─────────────────────────────────────────────────────────────
    try {
        const client = terminalClient();
        // Step A: Create a draft shipment to get the ID used for rate queries
        const shipmentResponse = await client.post("/shipments", {
            pickup_address,
            delivery_address,
            parcels,
        });
        const shipmentId = shipmentResponse.data.data.id;
        // Step B: Fetch rates for the draft shipment
        const ratesResponse = await client.get(`/shipments/${shipmentId}/rates`);
        return {
            success: true,
            data: {
                shipmentId,
                rates: ratesResponse.data.data,
            },
        };
    }
    catch (error) {
        const message = extractAxiosErrorMessage(error);
        console.error("Terminal Rates Error:", message);
        throw new functions.https.HttpsError("internal", message);
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// 2. Create Shipment (Arrange Pickup)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Finalise a shipment by booking it with the chosen rate.
 */
exports.createTerminalShipment = functions.https.onCall(async (request) => {
    const data = request.data || request;
    const { shipmentId, rateId } = data;
    if (!shipmentId || !rateId) {
        throw new functions.https.HttpsError("invalid-argument", "Both shipmentId and rateId are required.");
    }
    const { secretKey } = getTerminalConfig();
    // ── Mock mode ──────────────────────────────────────────────────────────────
    if (!secretKey) {
        console.log("Terminal API Secret Key missing. Returning mock shipment response.");
        const carrierName = rateId.includes("dhl")
            ? "DHL Express (Mock)"
            : rateId.includes("fedex")
                ? "FedEx (Mock)"
                : "Sendbox (Mock)";
        const amount = rateId.includes("dhl") ? 3500 : rateId.includes("fedex") ? 5000 : 1500;
        return {
            success: true,
            data: {
                id: shipmentId,
                tracking_number: "TRK-MOCK-" + Math.floor(10000000 + Math.random() * 90000000),
                carrier_name: carrierName,
                amount,
                currency: "NGN",
                status: "processing",
                tracking_url: "https://sandbox.terminal.africa/track/" + shipmentId,
            },
        };
    }
    // ── Live mode ─────────────────────────────────────────────────────────────
    try {
        const client = terminalClient();
        const response = await client.post(`/shipments/${shipmentId}/arrange-pickup`, {
            rate: rateId,
        });
        return {
            success: true,
            data: response.data.data,
        };
    }
    catch (error) {
        const message = extractAxiosErrorMessage(error);
        console.error("Terminal Shipment Error:", message);
        throw new functions.https.HttpsError("internal", message);
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// 3. Quick Shipment
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Create a shipment and arrange pickup in a single API call.
 * Validates required fields before forwarding to Terminal Africa.
 */
exports.quickTerminalShipment = functions.https.onCall(async (request) => {
    const data = request.data || request;
    // ── Input validation ───────────────────────────────────────────────────────
    const { pickup_address, delivery_address, parcels, rate_id } = data;
    const missingFields = [];
    if (!pickup_address)
        missingFields.push("pickup_address");
    if (!delivery_address)
        missingFields.push("delivery_address");
    if (!parcels || !Array.isArray(parcels) || parcels.length === 0)
        missingFields.push("parcels (non-empty array)");
    if (!rate_id)
        missingFields.push("rate_id");
    if (missingFields.length > 0) {
        throw new functions.https.HttpsError("invalid-argument", `Missing required fields for quick shipment: ${missingFields.join(", ")}.`);
    }
    const { secretKey } = getTerminalConfig();
    // ── Mock mode ──────────────────────────────────────────────────────────────
    if (!secretKey) {
        console.log("Terminal API Secret Key missing. Returning mock quick shipment response.");
        return {
            success: true,
            data: {
                id: "mock_shipment_quick_" + Math.floor(Math.random() * 1000000),
                tracking_number: "TRK-MOCK-QUICK-" + Math.floor(10000000 + Math.random() * 90000000),
                carrier_name: "Sendbox (Mock)",
                amount: 2000,
                currency: "NGN",
                status: "processing",
                tracking_url: "https://sandbox.terminal.africa/track/mock_quick",
            },
        };
    }
    // ── Live mode ─────────────────────────────────────────────────────────────
    try {
        const client = terminalClient();
        const response = await client.post("/shipments/quick", data);
        return {
            success: true,
            data: response.data.data,
        };
    }
    catch (error) {
        const message = extractAxiosErrorMessage(error);
        console.error("Terminal Quick Shipment Error:", message);
        throw new functions.https.HttpsError("internal", message);
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// 4. Track Shipment
// ─────────────────────────────────────────────────────────────────────────────
exports.trackTerminalShipment = functions.https.onCall(async (request) => {
    const data = request.data || request;
    const { shipmentId } = data;
    if (!shipmentId) {
        throw new functions.https.HttpsError("invalid-argument", "shipmentId is required.");
    }
    const { secretKey } = getTerminalConfig();
    // ── Mock mode ──────────────────────────────────────────────────────────────
    if (!secretKey) {
        console.log("Terminal API Secret Key missing. Returning mock tracking status.");
        return {
            success: true,
            data: {
                status: "in_transit",
                location: "Lagos Hub",
                history: [
                    {
                        status: "shipment_created",
                        description: "Shipment draft created",
                        time: new Date(Date.now() - 86400000).toISOString(),
                    },
                    {
                        status: "pickup_arranged",
                        description: "Pickup has been arranged",
                        time: new Date(Date.now() - 43200000).toISOString(),
                    },
                    {
                        status: "in_transit",
                        description: "Shipment in transit",
                        time: new Date().toISOString(),
                    },
                ],
            },
        };
    }
    // ── Live mode ─────────────────────────────────────────────────────────────
    try {
        const client = terminalClient();
        const response = await client.get(`/shipments/${shipmentId}/track`);
        return {
            success: true,
            data: response.data.data,
        };
    }
    catch (error) {
        const message = extractAxiosErrorMessage(error);
        console.error("Terminal Tracking Error:", message);
        throw new functions.https.HttpsError("internal", message);
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// 5. Get Carriers
// ─────────────────────────────────────────────────────────────────────────────
exports.getTerminalCarriers = functions.https.onCall(async () => {
    const { secretKey } = getTerminalConfig();
    // ── Mock mode ──────────────────────────────────────────────────────────────
    if (!secretKey) {
        console.log("Terminal API Secret Key missing. Returning mock carriers.");
        return {
            success: true,
            data: [
                { id: "carrier_mock_sendbox", name: "Sendbox (Mock)", active: true },
                { id: "carrier_mock_dhl", name: "DHL Express (Mock)", active: true },
                { id: "carrier_mock_fedex", name: "FedEx (Mock)", active: true },
            ],
        };
    }
    // ── Live mode ─────────────────────────────────────────────────────────────
    try {
        const client = terminalClient();
        const response = await client.get("/carriers");
        return {
            success: true,
            data: response.data.data,
        };
    }
    catch (error) {
        const message = extractAxiosErrorMessage(error);
        console.error("Terminal Carriers Error:", message);
        throw new functions.https.HttpsError("internal", message);
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// 6. Webhook Handler
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Receives live status updates from Terminal Africa.
 *
 * Security:
 *   - Only POST requests are accepted.
 *   - The HMAC-SHA256 signature sent in the `x-terminal-signature` header is
 *     verified against TERMINAL_WEBHOOK_SECRET before any Firestore writes.
 *     If the secret is not configured the check is skipped with a warning
 *     (permissive during development; set the secret in production).
 *
 * Firestore data model (corrected):
 *   - Shipment status lives in the `deliveries` collection keyed by
 *     `terminal_shipment_id`.  The matching order is updated through the
 *     `order_id` stored on the delivery document.
 *
 * Supported event types:
 *   - shipment.status_updated   → updates delivery + order
 *   - shipment.delivered        → marks delivery + order as delivered
 */
exports.terminalWebhook = functions.https.onRequest(async (req, res) => {
    // ── Method guard ───────────────────────────────────────────────────────────
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    // ── Signature verification ─────────────────────────────────────────────────
    const { webhookSecret } = getTerminalConfig();
    if (webhookSecret) {
        const incomingSignature = req.headers["x-terminal-signature"];
        if (!incomingSignature) {
            console.error("Terminal Webhook: missing x-terminal-signature header.");
            res.status(401).send("Unauthorized: missing signature");
            return;
        }
        // Terminal Africa signs the raw JSON body with HMAC-SHA256
        const rawBody = typeof req.rawBody !== "undefined"
            ? req.rawBody
            : Buffer.from(JSON.stringify(req.body));
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(rawBody)
            .digest("hex");
        // Constant-time comparison to prevent timing attacks
        const signaturesMatch = crypto.timingSafeEqual(Buffer.from(incomingSignature), Buffer.from(expectedSignature));
        if (!signaturesMatch) {
            console.error("Terminal Webhook: invalid signature.");
            res.status(401).send("Unauthorized: invalid signature");
            return;
        }
    }
    else {
        console.warn("Terminal Webhook: TERMINAL_WEBHOOK_SECRET is not set. " +
            "Signature verification skipped. Configure this in production.");
    }
    // ── Process event ──────────────────────────────────────────────────────────
    try {
        const event = req.body;
        const { event: eventType, data } = event;
        if (!eventType || !data) {
            console.warn("Terminal Webhook: received malformed payload.", event);
            res.status(400).send("Bad Request: missing event or data");
            return;
        }
        console.log(`Terminal Africa Webhook Received: ${eventType}`, data);
        const db = admin.firestore();
        switch (eventType) {
            case "shipment.status_updated":
            case "shipment.delivered": {
                const terminalShipmentId = data.id;
                const newStatus = data.status; // e.g. 'delivered', 'in_transit', 'returned'
                if (!terminalShipmentId || !newStatus) {
                    console.warn("Terminal Webhook: status_updated event missing id or status.");
                    break;
                }
                // ── Find the delivery document by terminal_shipment_id ──────────
                const deliveryQuery = await db
                    .collection("deliveries")
                    .where("terminal_shipment_id", "==", terminalShipmentId)
                    .limit(1)
                    .get();
                if (deliveryQuery.empty) {
                    console.warn(`Terminal Webhook: no delivery found for shipment ${terminalShipmentId}.`);
                    break;
                }
                const deliveryDoc = deliveryQuery.docs[0];
                const deliveryData = deliveryDoc.data();
                // ── Update delivery status ─────────────────────────────────────
                const deliveryUpdates = {
                    delivery_status: newStatus,
                    last_status_update: admin.firestore.FieldValue.serverTimestamp(),
                    logistics_raw_event: data, // Store raw event for debugging
                };
                if (newStatus === "delivered") {
                    deliveryUpdates.actual_delivery_date =
                        admin.firestore.FieldValue.serverTimestamp();
                }
                await deliveryDoc.ref.update(deliveryUpdates);
                // ── Add status history entry ───────────────────────────────────
                const historyId = `history_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`;
                await db.collection("delivery_status_history").doc(historyId).set({
                    delivery_id: deliveryDoc.id,
                    status: newStatus,
                    location: data.location || null,
                    notes: data.description || `Status updated to ${newStatus} via Terminal Africa webhook`,
                    updated_by: "terminal_webhook",
                    created_at: admin.firestore.FieldValue.serverTimestamp(),
                });
                // ── Mirror status to the parent order ─────────────────────────
                const orderId = deliveryData.order_id;
                if (orderId) {
                    const orderUpdates = {
                        logistics_status: newStatus,
                        updated_at: admin.firestore.FieldValue.serverTimestamp(),
                    };
                    // Promote the overall order status on final states
                    if (newStatus === "delivered") {
                        orderUpdates.status = "delivered";
                        orderUpdates.delivered_at = admin.firestore.FieldValue.serverTimestamp();
                    }
                    else if (newStatus === "returned") {
                        orderUpdates.status = "returned";
                    }
                    await db.collection("orders").doc(orderId).update(orderUpdates);
                    console.log(`Order ${orderId} logistics status updated to "${newStatus}" ` +
                        `via Terminal Africa webhook (delivery: ${deliveryDoc.id}).`);
                }
                else {
                    console.warn(`Terminal Webhook: delivery ${deliveryDoc.id} has no order_id — ` +
                        "order status not updated.");
                }
                break;
            }
            default:
                console.log(`Terminal Webhook: unhandled event type "${eventType}".`);
        }
        res.status(200).send("OK");
    }
    catch (error) {
        console.error("Terminal Webhook Error:", error);
        res.status(500).send("Internal Server Error");
    }
});
//# sourceMappingURL=terminal.js.map