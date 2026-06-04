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
exports.terminalWebhook = exports.getTerminalCarriers = exports.trackTerminalShipment = exports.quickTerminalShipment = exports.createTerminalShipment = exports.getTerminalRates = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
// Helper to get Terminal Config
const getTerminalConfig = () => {
    const config = functions.config().terminal;
    return {
        baseUrl: process.env.TERMINAL_BASE_URL || (config === null || config === void 0 ? void 0 : config.base_url) || "https://sandbox.terminal.africa/v1",
        secretKey: process.env.TERMINAL_SECRET_KEY || (config === null || config === void 0 ? void 0 : config.secret_key),
    };
};
const terminalClient = () => {
    const { baseUrl, secretKey } = getTerminalConfig();
    if (!secretKey) {
        throw new Error("Terminal Africa Secret Key is missing. Configure TERMINAL_SECRET_KEY.");
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
 * 1. Get Shipping Rates
 * Use this to fetch available carriers and their prices for a given shipment.
 */
exports.getTerminalRates = functions.https.onCall(async (request) => {
    var _a, _b, _c;
    const data = request.data || request;
    const { pickup_address, delivery_address, parcels } = data;
    if (!pickup_address || !delivery_address || !parcels) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing shipment details');
    }
    const { secretKey } = getTerminalConfig();
    if (!secretKey) {
        console.log("Terminal API Secret Key missing. Returning mock rates.");
        // Generate a mock shipment ID and standard rates
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
                        carrier_id: "carrier_mock_sendbox"
                    },
                    {
                        id: "rate_mock_dhl",
                        carrier_name: "DHL Express (Mock)",
                        amount: 3500,
                        currency: "NGN",
                        duration: "1-2 Days",
                        carrier_id: "carrier_mock_dhl"
                    },
                    {
                        id: "rate_mock_fedex",
                        carrier_name: "FedEx (Mock)",
                        amount: 5000,
                        currency: "NGN",
                        duration: "1 Day",
                        carrier_id: "carrier_mock_fedex"
                    }
                ]
            }
        };
    }
    try {
        const client = terminalClient();
        // Step A: Create a draft shipment or use the 'rates' endpoint directly if available
        // Terminal Africa typically requires creating a shipment first to get rates
        const shipmentResponse = await client.post("/shipments", {
            pickup_address,
            delivery_address,
            parcels,
        });
        const shipmentId = shipmentResponse.data.data.id;
        // Step B: Fetch rates for the created shipment
        const ratesResponse = await client.get(`/shipments/${shipmentId}/rates`);
        return {
            success: true,
            data: {
                shipmentId,
                rates: ratesResponse.data.data
            }
        };
    }
    catch (error) {
        console.error("Terminal Rates Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new functions.https.HttpsError('internal', ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message);
    }
});
/**
 * 2. Create Shipment (Arrange Pickup)
 * Use this to finalize a shipment with a selected rate.
 */
exports.createTerminalShipment = functions.https.onCall(async (request) => {
    var _a, _b, _c;
    const data = request.data || request;
    const { shipmentId, rateId } = data;
    if (!shipmentId || !rateId) {
        throw new functions.https.HttpsError('invalid-argument', 'Shipment ID and Rate ID are required');
    }
    const { secretKey } = getTerminalConfig();
    if (!secretKey) {
        console.log("Terminal API Secret Key missing. Returning mock shipment response.");
        const carrierName = rateId.includes("dhl") ? "DHL Express (Mock)" : (rateId.includes("fedex") ? "FedEx (Mock)" : "Sendbox (Mock)");
        const amount = rateId.includes("dhl") ? 3500 : (rateId.includes("fedex") ? 5000 : 1500);
        return {
            success: true,
            data: {
                id: shipmentId,
                tracking_number: "TRK-MOCK-" + Math.floor(10000000 + Math.random() * 90000000),
                carrier_name: carrierName,
                amount: amount,
                currency: "NGN",
                status: "processing",
                tracking_url: "https://sandbox.terminal.africa/track/" + shipmentId
            }
        };
    }
    try {
        const client = terminalClient();
        // Arrange pickup using the selected rate
        const response = await client.post(`/shipments/${shipmentId}/arrange-pickup`, {
            rate: rateId
        });
        return {
            success: true,
            data: response.data.data
        };
    }
    catch (error) {
        console.error("Terminal Shipment Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new functions.https.HttpsError('internal', ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message);
    }
});
/**
 * 3. Quick Shipment
 * Create shipment, get rates, and arrange pickup in fewer calls.
 */
exports.quickTerminalShipment = functions.https.onCall(async (request) => {
    var _a, _b, _c;
    const data = request.data || request;
    const { secretKey } = getTerminalConfig();
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
                tracking_url: "https://sandbox.terminal.africa/track/mock_quick"
            }
        };
    }
    try {
        const client = terminalClient();
        const response = await client.post("/shipments/quick", data);
        return {
            success: true,
            data: response.data.data
        };
    }
    catch (error) {
        console.error("Terminal Quick Shipment Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new functions.https.HttpsError('internal', ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message);
    }
});
/**
 * 4. Track Shipment
 */
exports.trackTerminalShipment = functions.https.onCall(async (request) => {
    var _a, _b, _c;
    const data = request.data || request;
    const { shipmentId } = data;
    if (!shipmentId) {
        throw new functions.https.HttpsError('invalid-argument', 'Shipment ID is required');
    }
    const { secretKey } = getTerminalConfig();
    if (!secretKey) {
        console.log("Terminal API Secret Key missing. Returning mock tracking status.");
        return {
            success: true,
            data: {
                status: "in_transit",
                location: "Lagos Hub",
                history: [
                    { status: "shipment_created", description: "Shipment draft created", time: new Date(Date.now() - 86400000).toISOString() },
                    { status: "pickup_arranged", description: "Pickup has been arranged", time: new Date(Date.now() - 43200000).toISOString() },
                    { status: "in_transit", description: "Shipment in transit", time: new Date().toISOString() }
                ]
            }
        };
    }
    try {
        const client = terminalClient();
        const response = await client.get(`/shipments/${shipmentId}/track`);
        return {
            success: true,
            data: response.data.data
        };
    }
    catch (error) {
        console.error("Terminal Tracking Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new functions.https.HttpsError('internal', ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message);
    }
});
/**
 * 5. Get Carriers
 */
exports.getTerminalCarriers = functions.https.onCall(async () => {
    var _a, _b, _c;
    const { secretKey } = getTerminalConfig();
    if (!secretKey) {
        console.log("Terminal API Secret Key missing. Returning mock carriers.");
        return {
            success: true,
            data: [
                { id: "carrier_mock_sendbox", name: "Sendbox (Mock)", active: true },
                { id: "carrier_mock_dhl", name: "DHL Express (Mock)", active: true },
                { id: "carrier_mock_fedex", name: "FedEx (Mock)", active: true }
            ]
        };
    }
    try {
        const client = terminalClient();
        const response = await client.get("/carriers");
        return {
            success: true,
            data: response.data.data
        };
    }
    catch (error) {
        console.error("Terminal Carriers Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new functions.https.HttpsError('internal', ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message);
    }
});
/**
 * 6. Webhook Handler
 * Handles live updates from Terminal Africa (shipment.status_updated, etc.)
 */
exports.terminalWebhook = functions.https.onRequest(async (req, res) => {
    try {
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }
        // TODO: Verify Webhook Signature if Terminal Africa provides one
        // Terminal Africa usually sends a JSON payload
        const event = req.body;
        const { event: eventType, data } = event;
        console.log(`Terminal Africa Webhook Received: ${eventType}`, data);
        const db = admin.firestore();
        switch (eventType) {
            case "shipment.status_updated":
                // Update internal order status based on Terminal Africa shipment status
                const shipmentId = data.id;
                const status = data.status; // e.g., 'delivered', 'in_transit', 'returned'
                // Find the order with this shipment ID
                const orderQuery = await db.collection("orders")
                    .where("logistics_shipment_id", "==", shipmentId)
                    .limit(1)
                    .get();
                if (!orderQuery.empty) {
                    const orderDoc = orderQuery.docs[0];
                    await orderDoc.ref.update({
                        logistics_status: status,
                        updated_at: admin.firestore.FieldValue.serverTimestamp()
                    });
                    // Trigger notifications or other logic
                    console.log(`Order ${orderDoc.id} status updated to ${status} via Terminal Africa`);
                }
                break;
            default:
                console.log(`Unhandled Terminal Africa event type: ${eventType}`);
        }
        res.status(200).send("Webhook Received");
    }
    catch (error) {
        console.error("Terminal Webhook Error:", error);
        res.status(500).send("Internal Server Error");
    }
});
//# sourceMappingURL=terminal.js.map