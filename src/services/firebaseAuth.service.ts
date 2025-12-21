/**
 * Firebase Authentication Service
 * Handles user authentication, registration, and profile management
 */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    signInWithPopup,
    User,
    UserCredential,
    AuthError,
} from 'firebase/auth';
import { auth, GoogleAuthProvider } from '../lib/firebase.config';
import { FirestoreService } from './firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { logger } from '../lib/logger';
import type { UserRole } from '../types/database';

export interface SignUpData {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
}

export interface SignInData {
    email: string;
    password: string;
}

export interface ProfileData {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: UserRole;
    avatar_url: string | null;
    location: string | null;
    created_at: any;
    updated_at: any;
}

/**
 * Firebase Authentication Service Class
 */
export class FirebaseAuthService {
    /**
     * Sign up a new user with email and password
     */
    static async signUp(data: SignUpData): Promise<{ user: User | null; error: Error | null }> {
        try {
            logger.info(`Creating new user account for: ${data.email}`);

            // Create auth user
            const userCredential: UserCredential = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );

            const user = userCredential.user;

            // Update display name
            await updateProfile(user, {
                displayName: data.fullName,
            });

            // Create profile document in Firestore
            await FirestoreService.setDocument(COLLECTIONS.PROFILES, user.uid, {
                email: data.email,
                full_name: data.fullName,
                role: data.role,
                phone: null,
                avatar_url: null,
                location: null,
            });

            // If vendor, create vendor record
            if (data.role === 'vendor') {
                await FirestoreService.setDocument(COLLECTIONS.VENDORS, user.uid, {
                    user_id: user.uid,
                    business_name: '',
                    business_description: null,
                    business_address: null,
                    business_phone: null,
                    market_location: null,
                    sub_category_tags: null,
                    cac_number: null,
                    proof_of_address_url: null,
                    bank_account_details: null,
                    verification_badge: 'none',
                    verification_status: 'pending',
                    verification_date: null,
                    subscription_plan: 'free',
                    subscription_status: 'active',
                    subscription_start_date: new Date().toISOString(),
                    subscription_end_date: null,
                    rating: 0,
                    total_sales: 0,
                    response_time: 0,
                    wallet_balance: 0,
                    notification_preferences: null,
                    is_active: true,
                    referral_code: null,
                    total_referrals: 0,
                    referred_by_vendor_id: null,
                    referred_by_marketer_id: null,
                });
            }

            // Send email verification
            await sendEmailVerification(user);

            logger.info(`User account created successfully: ${user.uid}`);
            return { user, error: null };
        } catch (error) {
            logger.error('Error during sign up', error);
            return { user: null, error: error as Error };
        }
    }

    /**
     * Sign in with email and password
     */
    static async signIn(data: SignInData): Promise<{ user: User | null; error: AuthError | null }> {
        try {
            logger.info(`Signing in user: ${data.email}`);

            const userCredential: UserCredential = await signInWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );

            logger.info(`User signed in successfully: ${userCredential.user.uid}`);
            return { user: userCredential.user, error: null };
        } catch (error) {
            logger.error('Error during sign in', error);
            return { user: null, error: error as AuthError };
        }
    }

    /**
     * Sign out the current user
     */
    static async signOut(): Promise<{ error: Error | null }> {
        try {
            await firebaseSignOut(auth);
            logger.info('User signed out successfully');
            return { error: null };
        } catch (error) {
            logger.error('Error during sign out', error);
            return { error: error as Error };
        }
    }

    /**
     * Send password reset email
     */
    static async sendPasswordReset(email: string): Promise<{ error: Error | null }> {
        try {
            await sendPasswordResetEmail(auth, email);
            logger.info(`Password reset email sent to: ${email}`);
            return { error: null };
        } catch (error) {
            logger.error('Error sending password reset email', error);
            return { error: error as Error };
        }
    }

    /**
     * Get user profile from Firestore
     */
    static async getUserProfile(userId: string): Promise<ProfileData | null> {
        try {
            const profile = await FirestoreService.getDocument<ProfileData>(
                COLLECTIONS.PROFILES,
                userId
            );
            return profile;
        } catch (error) {
            logger.error(`Error fetching user profile for ${userId}`, error);
            return null;
        }
    }

    /**
     * Update user profile
     */
    static async updateUserProfile(
        userId: string,
        updates: Partial<ProfileData>
    ): Promise<{ error: Error | null }> {
        try {
            await FirestoreService.updateDocument(COLLECTIONS.PROFILES, userId, updates);
            logger.info(`User profile updated for ${userId}`);
            return { error: null };
        } catch (error) {
            logger.error(`Error updating user profile for ${userId}`, error);
            return { error: error as Error };
        }
    }

    /**
     * Get current authenticated user
     */
    static getCurrentUser(): User | null {
        return auth.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    static isAuthenticated(): boolean {
        return auth.currentUser !== null;
    }

    /**
     * Get user ID token (for API calls)
     */
    static async getIdToken(): Promise<string | null> {
        try {
            const user = auth.currentUser;
            if (user) {
                return await user.getIdToken();
            }
            return null;
        } catch (error) {
            logger.error('Error getting ID token', error);
            return null;
        }
    }

    /**
     * Refresh ID token
     */
    static async refreshIdToken(): Promise<string | null> {
        try {
            const user = auth.currentUser;
            if (user) {
                return await user.getIdToken(true);
            }
            return null;
        } catch (error) {
            logger.error('Error refreshing ID token', error);
            return null;
        }
    }

    /**
     * Delete user account
     */
    static async deleteAccount(userId: string): Promise<{ error: Error | null }> {
        try {
            const user = auth.currentUser;
            if (user && user.uid === userId) {
                // Delete profile from Firestore
                await FirestoreService.deleteDocument(COLLECTIONS.PROFILES, userId);

                // Delete auth account
                await user.delete();

                logger.info(`User account deleted: ${userId}`);
                return { error: null };
            }
            return { error: new Error('User not authenticated or ID mismatch') };
        } catch (error) {
            logger.error(`Error deleting user account ${userId}`, error);
            return { error: error as Error };
        }
    }

    /**
     * Sign in with Google OAuth
     */
    static async signInWithGoogle(role: UserRole): Promise<{ user: User | null; error: Error | null; isNewUser: boolean }> {
        try {
            logger.info('Initiating Google sign-in');

            const provider = new GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');

            const userCredential: UserCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            // Check if this is a new user by looking for existing profile
            const existingProfile = await FirestoreService.getDocument(
                COLLECTIONS.PROFILES,
                user.uid
            );

            const isNewUser = !existingProfile;

            if (isNewUser) {
                // Create profile for new user
                await FirestoreService.setDocument(COLLECTIONS.PROFILES, user.uid, {
                    email: user.email,
                    full_name: user.displayName,
                    role: role,
                    phone: user.phoneNumber || null,
                    avatar_url: user.photoURL || null,
                    location: null,
                });

                // If vendor, create vendor record
                if (role === 'vendor') {
                    await FirestoreService.setDocument(COLLECTIONS.VENDORS, user.uid, {
                        user_id: user.uid,
                        business_name: '',
                        business_description: null,
                        business_address: null,
                        business_phone: null,
                        market_location: null,
                        sub_category_tags: null,
                        cac_number: null,
                        proof_of_address_url: null,
                        bank_account_details: null,
                        verification_badge: 'none',
                        verification_status: 'pending',
                        verification_date: null,
                        subscription_plan: 'free',
                        subscription_status: 'inactive',
                        subscription_start_date: null,
                        subscription_end_date: null,
                        rating: 0,
                        total_sales: 0,
                        response_time: 0,
                        wallet_balance: 0,
                        notification_preferences: null,
                        is_active: true,
                        referral_code: null,
                        total_referrals: 0,
                        referred_by_vendor_id: null,
                        referred_by_marketer_id: null,
                    });
                }

                logger.info(`New user created via Google: ${user.uid}`);
            } else {
                logger.info(`Existing user signed in via Google: ${user.uid}`);
            }

            return { user, error: null, isNewUser };
        } catch (error) {
            logger.error('Error during Google sign-in', error);
            return { user: null, error: error as Error, isNewUser: false };
        }
    }

    /**
     * Check if current user's email is verified
     */
    static isEmailVerified(): boolean {
        const user = auth.currentUser;
        return user?.emailVerified ?? false;
    }

    /**
     * Resend email verification to current user
     */
    static async resendVerificationEmail(): Promise<{ error: Error | null }> {
        try {
            const user = auth.currentUser;
            if (!user) {
                return { error: new Error('No user logged in') };
            }

            if (user.emailVerified) {
                return { error: new Error('Email is already verified') };
            }

            await sendEmailVerification(user);
            logger.info(`Verification email resent to: ${user.email}`);
            return { error: null };
        } catch (error) {
            logger.error('Error resending verification email', error);
            return { error: error as Error };
        }
    }
}

export default FirebaseAuthService;

