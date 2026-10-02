import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const deleteUserAccount = functions.https.onCall(async (request: any) => {
  const authContext = request.auth;
  if (!authContext || !authContext.uid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be authenticated to request account deletion.'
    );
  }

  const uid = authContext.uid;
  const db = admin.firestore();
  const auth = admin.auth();

  console.log('Starting account deletion workflow for user: ' + uid);

  try {
    const now = new Date().toISOString();

    const buyerOrdersSnap = await db
      .collection('orders')
      .where('buyer_id', '==', uid)
      .where('status', 'in', ['pending', 'payment_pending'])
      .get();

    const batch = db.batch();
    buyerOrdersSnap.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'cancelled',
        cancellation_reason: 'Account deleted by user',
        updated_at: now,
      });
    });

    const profileRef = db.collection('profiles').doc(uid);
    const profileSnap = await profileRef.get();
    if (profileSnap.exists) {
      batch.update(profileRef, {
        full_name: 'Deleted User',
        email: 'deleted_' + uid.slice(0, 8) + '@deleted.nimex.ng',
        phone: null,
        avatar_url: null,
        location: null,
        fcm_tokens: [],
        deleted_at: now,
        is_active: false,
      });
    }

    const vendorRef = db.collection('vendors').doc(uid);
    const vendorSnap = await vendorRef.get();
    if (vendorSnap.exists) {
      batch.update(vendorRef, {
        business_name: 'Closed Store',
        business_description: 'This vendor account was closed.',
        is_active: false,
        subscription_status: 'cancelled',
        deleted_at: now,
      });

      const productsSnap = await db
        .collection('products')
        .where('vendor_id', '==', uid)
        .get();

      productsSnap.forEach((pDoc) => {
        batch.update(pDoc.ref, {
          is_active: false,
          deleted_at: now,
        });
      });
    }

    const marketerRef = db.collection('marketers').doc(uid);
    const marketerSnap = await marketerRef.get();
    if (marketerSnap.exists) {
      batch.update(marketerRef, {
        status: 'inactive',
        deleted_at: now,
      });
    }

    await batch.commit();

    await auth.deleteUser(uid);

    console.log('Account deletion completed successfully for user: ' + uid);
    return {
      success: true,
      message: 'Your account and associated active data have been deleted.',
      deletedAt: now,
    };
  } catch (error: any) {
    console.error('Error deleting account for user ' + uid + ':', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to complete account deletion.'
    );
  }
});
