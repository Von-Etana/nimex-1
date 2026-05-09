import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

// Helper to get Terminal Config
const getTerminalConfig = () => {
    const config = functions.config().terminal;
    return {
        baseUrl: process.env.TERMINAL_BASE_URL || config?.base_url || "https://sandbox.terminal.africa/v1",
        secretKey: process.env.TERMINAL_SECRET_KEY || config?.secret_key,
    };
};

const terminalClient = () => {
    const { baseUrl, secretKey } = getTerminalConfig();
    if (!secretKey) {
        throw new Error("Terminal Africa Secret Key is missing. Configure TERMINAL_SECRET_KEY.");
    }
    return axios.create({
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
export const getTerminalRates = functions.https.onCall(async (request: any) => {
    const data = request.data || request;
    const { pickup_address, delivery_address, parcels } = data;

    if (!pickup_address || !delivery_address || !parcels) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing shipment details');
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
    } catch (error: any) {
        console.error("Terminal Rates Error:", error.response?.data || error.message);
        throw new functions.https.HttpsError('internal', error.response?.data?.message || error.message);
    }
});

/**
 * 2. Create Shipment (Arrange Pickup)
 * Use this to finalize a shipment with a selected rate.
 */
export const createTerminalShipment = functions.https.onCall(async (request: any) => {
    const data = request.data || request;
    const { shipmentId, rateId } = data;

    if (!shipmentId || !rateId) {
        throw new functions.https.HttpsError('invalid-argument', 'Shipment ID and Rate ID are required');
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
    } catch (error: any) {
        console.error("Terminal Shipment Error:", error.response?.data || error.message);
        throw new functions.https.HttpsError('internal', error.response?.data?.message || error.message);
    }
});

/**
 * 3. Quick Shipment
 * Create shipment, get rates, and arrange pickup in fewer calls.
 */
export const quickTerminalShipment = functions.https.onCall(async (request: any) => {
    const data = request.data || request;
    
    try {
        const client = terminalClient();
        const response = await client.post("/shipments/quick", data);

        return {
            success: true,
            data: response.data.data
        };
    } catch (error: any) {
        console.error("Terminal Quick Shipment Error:", error.response?.data || error.message);
        throw new functions.https.HttpsError('internal', error.response?.data?.message || error.message);
    }
});

/**
 * 4. Track Shipment
 */
export const trackTerminalShipment = functions.https.onCall(async (request: any) => {
    const data = request.data || request;
    const { shipmentId } = data;

    if (!shipmentId) {
        throw new functions.https.HttpsError('invalid-argument', 'Shipment ID is required');
    }

    try {
        const client = terminalClient();
        const response = await client.get(`/shipments/${shipmentId}/track`);

        return {
            success: true,
            data: response.data.data
        };
    } catch (error: any) {
        console.error("Terminal Tracking Error:", error.response?.data || error.message);
        throw new functions.https.HttpsError('internal', error.response?.data?.message || error.message);
    }
});

/**
 * 5. Get Carriers
 */
export const getTerminalCarriers = functions.https.onCall(async () => {
    try {
        const client = terminalClient();
        const response = await client.get("/carriers");

        return {
            success: true,
            data: response.data.data
        };
    } catch (error: any) {
        console.error("Terminal Carriers Error:", error.response?.data || error.message);
        throw new functions.https.HttpsError('internal', error.response?.data?.message || error.message);
    }
});

/**
 * 6. Webhook Handler
 * Handles live updates from Terminal Africa (shipment.status_updated, etc.)
 */
export const terminalWebhook = functions.https.onRequest(async (req, res) => {
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
    } catch (error: any) {
        console.error("Terminal Webhook Error:", error);
        res.status(500).send("Internal Server Error");
    }
});
