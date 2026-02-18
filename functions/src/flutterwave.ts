import * as functions from "firebase-functions";
import axios, { AxiosInstance } from "axios";

// Flutterwave API v3 base URL
const FLW_BASE_URL = "https://api.flutterwave.com/v3";

/**
 * Create a configured Flutterwave Axios client
 */
function getFlwClient(): AxiosInstance {
    const secretKey =
        process.env.FLUTTERWAVE_SECRET_KEY ||
        functions.config().flutterwave?.secret_key;

    if (!secretKey) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "Flutterwave secret key not configured. Set FLUTTERWAVE_SECRET_KEY in .env or firebase config."
        );
    }

    return axios.create({
        baseURL: FLW_BASE_URL,
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
        },
    });
}

// ─── 1. Initialize Payment ──────────────────────────────────────────────────

export const initializeFlutterwavePayment = functions.https.onCall(
    async (request: any) => {
        const data = request.data || request;
        const { email, amount, tx_ref, redirect_url, customer, metadata } = data;

        if (!email || !amount || !tx_ref) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "email, amount, and tx_ref are required"
            );
        }

        try {
            const client = getFlwClient();
            const response = await client.post("/payments", {
                tx_ref,
                amount,
                currency: "NGN",
                redirect_url:
                    redirect_url || "https://nimex.ng/payment/callback",
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
        } catch (error: any) {
            console.error("Flutterwave payment init error:", error?.response?.data || error.message);
            throw new functions.https.HttpsError(
                "internal",
                error?.response?.data?.message || error.message || "Failed to initialize payment"
            );
        }
    }
);

// ─── 2. Verify Payment ─────────────────────────────────────────────────────

export const verifyFlutterwavePayment = functions.https.onCall(
    async (request: any) => {
        const data = request.data || request;
        const { transaction_id } = data;

        if (!transaction_id) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "transaction_id is required"
            );
        }

        try {
            const client = getFlwClient();
            const response = await client.get(
                `/transactions/${transaction_id}/verify`
            );

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
        } catch (error: any) {
            console.error("Flutterwave verify error:", error?.response?.data || error.message);
            throw new functions.https.HttpsError(
                "internal",
                error?.response?.data?.message || error.message || "Failed to verify payment"
            );
        }
    }
);

// ─── 3. Create Virtual Account (NUBAN) ─────────────────────────────────────

export const createFlutterwaveVirtualAccount = functions.https.onCall(
    async (request: any) => {
        const data = request.data || request;
        const {
            email,
            tx_ref,
            is_permanent,
            bvn,
            phonenumber,
            firstname,
            lastname,
            narration,
        } = data;

        if (!email || !tx_ref || !bvn) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "email, tx_ref, and bvn are required"
            );
        }

        try {
            const client = getFlwClient();
            const response = await client.post("/virtual-account-numbers", {
                email,
                tx_ref,
                is_permanent: is_permanent ?? true,
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
        } catch (error: any) {
            console.error("Flutterwave virtual account error:", error?.response?.data || error.message);
            throw new functions.https.HttpsError(
                "internal",
                error?.response?.data?.message || error.message || "Failed to create virtual account"
            );
        }
    }
);

// ─── 4. Create Subaccount (Vendor Wallet) ───────────────────────────────────

export const createFlutterwaveSubaccount = functions.https.onCall(
    async (request: any) => {
        const data = request.data || request;
        const {
            business_name,
            business_email,
            business_mobile,
            account_bank,
            account_number,
            country,
        } = data;

        if (!business_name || !business_email || !account_bank || !account_number) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "business_name, business_email, account_bank, and account_number are required"
            );
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
        } catch (error: any) {
            console.error("Flutterwave subaccount error:", error?.response?.data || error.message);
            throw new functions.https.HttpsError(
                "internal",
                error?.response?.data?.message || error.message || "Failed to create subaccount"
            );
        }
    }
);

// ─── 5. Process Withdrawal (Transfer to Bank) ──────────────────────────────

export const processFlutterwaveWithdrawal = functions.https.onCall(
    async (request: any) => {
        const data = request.data || request;
        const { account_bank, account_number, amount, narration, reference } =
            data;

        if (!account_bank || !account_number || !amount) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "account_bank, account_number, and amount are required"
            );
        }

        try {
            const client = getFlwClient();
            const response = await client.post("/transfers", {
                account_bank,
                account_number,
                amount,
                narration: narration || "NIMEX Vendor Withdrawal",
                currency: "NGN",
                reference: reference || `NIMEX-WDL-${Date.now()}`,
            });

            const txData = response.data.data;
            return {
                success: true,
                data: {
                    id: txData.id,
                    reference: txData.reference,
                    status: txData.status,
                    amount: txData.amount,
                    narration: txData.narration,
                    complete_message: txData.complete_message,
                },
            };
        } catch (error: any) {
            console.error("Flutterwave withdrawal error:", error?.response?.data || error.message);
            throw new functions.https.HttpsError(
                "internal",
                error?.response?.data?.message || error.message || "Failed to process withdrawal"
            );
        }
    }
);

// ─── 6. Get Bank List ───────────────────────────────────────────────────────

export const getFlutterwaveBankList = functions.https.onCall(
    async (request: any) => {
        const data = request.data || request;
        const country = data?.country || "NG";

        try {
            const client = getFlwClient();
            const response = await client.get(`/banks/${country}`);

            const banks = response.data.data.map((bank: any) => ({
                name: bank.name,
                code: bank.code,
            }));

            return { success: true, banks };
        } catch (error: any) {
            console.error("Flutterwave bank list error:", error?.response?.data || error.message);
            throw new functions.https.HttpsError(
                "internal",
                error?.response?.data?.message || error.message || "Failed to fetch bank list"
            );
        }
    }
);

// ─── 7. Resolve Account Number ──────────────────────────────────────────────

export const resolveFlutterwaveAccount = functions.https.onCall(
    async (request: any) => {
        const data = request.data || request;
        const { account_number, account_bank } = data;

        if (!account_number || !account_bank) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "account_number and account_bank are required"
            );
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
        } catch (error: any) {
            console.error("Flutterwave resolve error:", error?.response?.data || error.message);
            throw new functions.https.HttpsError(
                "internal",
                error?.response?.data?.message || error.message || "Failed to resolve account"
            );
        }
    }
);
