import { useEffect, useRef } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

/**
 * useSessionMonitor
 * Watches authentication and user document state in real-time.
 * Triggers feedback and graceful signout if account is disabled or revoked.
 */
export const useSessionMonitor = () => {
  const { user, signOut } = useAuth();
  const { warning: showWarningToast } = useToast();
  const hadUser = useRef(false);

  useEffect(() => {
    if (user) {
      hadUser.current = true;
    }
  }, [user]);

  // 1. Listen for ID token changes (e.g. session revocation)
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      if (!currentUser && hadUser.current) {
        hadUser.current = false;
        showWarningToast('Your session has expired. Please log in again.');
      }
    });

    return () => unsubscribe();
  }, [showWarningToast]);

  // 2. Listen for profile status changes (e.g. account deactivated by admin)
  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'profiles', user.uid);
    const unsubscribe = onSnapshot(profileRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.is_active === false) {
          showWarningToast('Your account has been deactivated. Signing out...');
          await signOut();
        }
      }
    });

    return () => unsubscribe();
  }, [user, signOut, showWarningToast]);
};
