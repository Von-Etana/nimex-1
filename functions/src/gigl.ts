import * as functions from "firebase-functions";
import axios from "axios";

// Helper to get GIGL Config
const getGiglConfig = () => {
    const config = functions.config().gigl;
    return {
        baseUrl: process.env.GIGL_BASE_URL || config?.base_url || "https://giglogistics.com/api", // Default to live, override for test
        // Auth might be Basic Auth (client_id:client_secret) or just API Key depending on specific GIGL endpoint version
        // Most GIGL integrations use Basic Auth to get a token.
        clientId: process.env.GIGL_CLIENT_ID || config?.client_id,
        clientSecret: process.env.GIGL_CLIENT_SECRET || config?.client_secret,
        username: process.env.GIGL_USERNAME || config?.username,
        password: process.env.GIGL_PASSWORD || config?.password,
    };
};

// Helper: Get Access Token
// Note: GIGL often uses Basic Auth with Username/Password to get an OAuth token
async function getGiglToken() {
    const { baseUrl, username, password } = getGiglConfig();
    try {
        const response = await axios.post(`${baseUrl}/v1/auth/login`, {
            email: username,
            password: password
        });
        return response.data.data.token; // Adjust based on actual response structure
    } catch (error: any) {
        console.error("GIGL Auth Error:", error.response?.data || error.message);
        throw new Error("Failed to authenticate with GIGL");
    }
}

// 1. Get Shipping Quote
export const getGiglShippingQuote = functions.https.onCall(async (data, context) => {
    const { pickupStationId, deliveryState, deliveryCity, weight } = data;

    // Validate inputs
    if (!pickupStationId || !deliveryState || !deliveryCity) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
        // Implement pricing logic (Mock or Real)
        // Since we don't have the exact docs or live keys, implementing a robust mock structure first
        // that allows swapping in the real API call easily.

        // Mock Response for Development/Demo
        // In production, this would await axios.post(...)

        const mockPrice = 1500 + (weight * 500); // Base 1500 + 500 per kg

        return {
            success: true,
            data: {
                price: mockPrice,
                estimatedDays: 3,
                zoneCode: "LG"
            }
        };
    } catch (error: any) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// 2. Create Shipment
export const createGiglShipment = functions.https.onCall(async (data, context) => {
    // Basic validation
    if (!data.orderId || !data.receiver) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing order details');
    }

    try {
        // Mock Shipment Creation
        const trackingNumber = "NIMEX-" + Math.floor(Math.random() * 1000000);

        return {
            success: true,
            data: {
                shipmentId: "SH-" + Math.floor(Math.random() * 1000000),
                trackingNumber: trackingNumber,
                cost: data.amount || 2000
            }
        };
    } catch (error: any) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// 3. Track Shipment
export const trackGiglShipment = functions.https.onCall(async (data, context) => {
    const { trackingNumber } = data;

    if (!trackingNumber) {
        throw new functions.https.HttpsError('invalid-argument', 'Tracking number required');
    }

    try {
        // Mock Tracking Response
        return {
            success: true,
            data: {
                status: "in_transit",
                location: "Lagos Hub",
                history: [
                    { status: "picked_up", location: "Vendor Shop", timestamp: new Date().toISOString() },
                    { status: "in_transit", location: "Lagos Hub", timestamp: new Date().toISOString() }
                ]
            }
        };
    } catch (error: any) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// 4. Get Service Areas (Stations)
export const getGiglServiceAreas = functions.https.onCall(async (data, context) => {
    try {
        // Return hardcoded list or fetch from API
        // Fetching from API is better to keep in sync

        // Mock Data
        return {
            success: true,
            data: [
                { state: "Lagos", cities: ["Ikeja", "Lekki", "Yaba", "Surulere"] },
                { state: "Abuja", cities: ["Garki", "Wuse", "Maitama"] },
                { state: "Rivers", cities: ["Port Harcourt", "Obio-Akpor"] }
            ]
        };
    } catch (error: any) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
