import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const app = admin.apps.length ? admin.app() : admin.initializeApp();
const db = app.firestore();

type ReferralType = "vendor" | "marketer";

interface ReferralActionRequest {
    referralType: ReferralType;
    referralId: string;
    reason?: string;
    paymentMethod?: string;
    referenceNumber?: string;
    notes?: string;
}

const referralConfig = {
    vendor: {
        collection: "vendor_referrals",
        settingType: "vendor_referral",
    },
    marketer: {
        collection: "marketer_referrals",
        settingType: "marketer_referral",
    },
} as const;

function getRequestData(request: any): ReferralActionRequest {
    const data = request.data || request;
    const referralType = data.referralType as ReferralType;
    const referralId = typeof data.referralId === "string" ? data.referralId.trim() : "";

    if (referralType !== "vendor" && referralType !== "marketer") {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "referralType must be either 'vendor' or 'marketer'."
        );
    }

    if (!referralId) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "referralId is required."
        );
    }

    return {
        referralType,
        referralId,
        reason: typeof data.reason === "string" ? data.reason.trim() : undefined,
        paymentMethod: typeof data.paymentMethod === "string" ? data.paymentMethod.trim() : undefined,
        referenceNumber: typeof data.referenceNumber === "string" ? data.referenceNumber.trim() : undefined,
        notes: typeof data.notes === "string" ? data.notes.trim() : undefined,
    };
}

async function assertAdmin(request: any): Promise<string> {
    if (!request.auth?.uid) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "Authentication is required."
        );
    }

    const profile = await db.collection("profiles").doc(request.auth.uid).get();
    if (!profile.exists || profile.data()?.role !== "admin") {
        throw new functions.https.HttpsError(
            "permission-denied",
            "Only administrators can manage referral commissions."
        );
    }

    return request.auth.uid;
}

async function getCommissionAmount(referralType: ReferralType): Promise<number> {
    const { settingType } = referralConfig[referralType];
    const settingSnap = await db.collection("commission_settings")
        .where("type", "==", settingType)
        .where("is_active", "==", true)
        .limit(1)
        .get();

    const fallback = referralType === "vendor" ? 5000 : 10000;
    if (settingSnap.empty) {
        return fallback;
    }

    const amount = Number(settingSnap.docs[0].data().commission_amount);
    if (!Number.isFinite(amount) || amount < 0) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            `Invalid active commission setting for ${settingType}.`
        );
    }

    return amount;
}

export const approveReferralCommission = functions.https.onCall(async (request: any) => {
    const adminUid = await assertAdmin(request);
    const { referralType, referralId } = getRequestData(request);
    const config = referralConfig[referralType];
    const commissionAmount = await getCommissionAmount(referralType);

    await db.runTransaction(async (transaction) => {
        const referralRef = db.collection(config.collection).doc(referralId);
        const referralSnap = await transaction.get(referralRef);

        if (!referralSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Referral request not found.");
        }

        const referral = referralSnap.data() || {};
        if (referral.status !== "pending") {
            throw new functions.https.HttpsError(
                "failed-precondition",
                `Referral request is not pending (current status: ${referral.status}).`
            );
        }

        transaction.update(referralRef, {
            status: "completed",
            commission_amount: commissionAmount,
            commission_paid: false,
            approved_by: adminUid,
            approved_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        if (referralType === "vendor") {
            const referrerVendorId = referral.referrer_vendor_id;
            const referredVendorId = referral.referred_vendor_id;

            if (referrerVendorId) {
                transaction.update(db.collection("vendors").doc(referrerVendorId), {
                    total_referrals: admin.firestore.FieldValue.increment(1),
                    updated_at: admin.firestore.FieldValue.serverTimestamp(),
                });
            }

            if (referredVendorId && referrerVendorId) {
                transaction.update(db.collection("vendors").doc(referredVendorId), {
                    referred_by_vendor_id: referrerVendorId,
                    updated_at: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        } else {
            const marketerId = referral.marketer_id;
            const vendorId = referral.vendor_id;

            if (marketerId) {
                transaction.update(db.collection("marketers").doc(marketerId), {
                    total_referrals: admin.firestore.FieldValue.increment(1),
                    total_commission_earned: admin.firestore.FieldValue.increment(commissionAmount),
                    updated_at: admin.firestore.FieldValue.serverTimestamp(),
                });
            }

            if (vendorId && marketerId) {
                transaction.update(db.collection("vendors").doc(vendorId), {
                    referred_by_marketer_id: marketerId,
                    updated_at: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        }
    });

    return { success: true, commissionAmount };
});

export const rejectReferralCommission = functions.https.onCall(async (request: any) => {
    const adminUid = await assertAdmin(request);
    const { referralType, referralId, reason } = getRequestData(request);
    const { collection } = referralConfig[referralType];

    await db.runTransaction(async (transaction) => {
        const referralRef = db.collection(collection).doc(referralId);
        const referralSnap = await transaction.get(referralRef);

        if (!referralSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Referral request not found.");
        }

        const referral = referralSnap.data() || {};
        if (referral.status !== "pending") {
            throw new functions.https.HttpsError(
                "failed-precondition",
                `Only pending referrals can be rejected (current status: ${referral.status}).`
            );
        }

        transaction.update(referralRef, {
            status: "rejected",
            rejection_reason: reason || "Rejected by administrator",
            rejected_by: adminUid,
            rejected_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
    });

    return { success: true };
});

export const markReferralCommissionPaid = functions.https.onCall(async (request: any) => {
    const adminUid = await assertAdmin(request);
    const { referralType, referralId, paymentMethod, referenceNumber, notes } = getRequestData(request);

    if (!paymentMethod) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "paymentMethod is required."
        );
    }

    const { collection } = referralConfig[referralType];
    let paymentId = "";

    await db.runTransaction(async (transaction) => {
        const referralRef = db.collection(collection).doc(referralId);
        const referralSnap = await transaction.get(referralRef);

        if (!referralSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Referral request not found.");
        }

        const referral = referralSnap.data() || {};
        if (referral.status !== "completed") {
            throw new functions.https.HttpsError(
                "failed-precondition",
                `Only approved referrals can be marked paid (current status: ${referral.status}).`
            );
        }

        if (referral.commission_paid === true) {
            throw new functions.https.HttpsError(
                "failed-precondition",
                "Referral commission is already marked as paid."
            );
        }

        const amount = Number(referral.commission_amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new functions.https.HttpsError(
                "failed-precondition",
                "Referral has no payable commission amount."
            );
        }

        const paymentRef = db.collection("commission_payments").doc();
        paymentId = paymentRef.id;

        const recipientId = referralType === "vendor"
            ? referral.referrer_vendor_id
            : referral.marketer_id;

        transaction.set(paymentRef, {
            recipient_type: referralType,
            recipient_id: recipientId,
            amount,
            payment_method: paymentMethod,
            reference_number: referenceNumber || null,
            status: "completed",
            referral_ids: [referralId],
            referral_type: referralType,
            notes: notes || null,
            processed_by: adminUid,
            processed_at: admin.firestore.FieldValue.serverTimestamp(),
            created_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        transaction.update(referralRef, {
            commission_paid: true,
            commission_paid_at: admin.firestore.FieldValue.serverTimestamp(),
            commission_payment_id: paymentId,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
    });

    return { success: true, paymentId };
});
