import React, { createContext, useContext, useEffect, useReducer, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase.config';
import { FirebaseAuthService } from '../services/firebaseAuth.service';
import { FirestoreService } from '../services/firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { logger } from '../lib/logger';
import { signUpSchema, signInSchema, updateProfileSchema, type SignUpInput, type SignInInput, type UpdateProfileInput } from '../lib/validation';
import { ROUTES, STORAGE_KEYS } from '../services/constants';
import type { UserRole, Database } from '../types/database';

type AdminPermission = Database['public']['Tables']['admin_permissions']['Row'];

interface AdminRole {
  name: string;
  display_name: string;
  permissions: AdminPermission[];
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  location: string | null;
  adminRoles?: AdminRole[];
  adminPermissions?: string[];
  needsOnboarding?: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: Profile | null;
  loading: boolean;
  emailVerified: boolean;
  signUp: (input: SignUpInput) => Promise<{ error: Error | null }>;
  signIn: (input: SignInInput) => Promise<{ error: Error | null }>;
  signInWithGoogle: (role: UserRole) => Promise<{ error: Error | null; isNewUser: boolean }>;
  sendSignInLink: (email: string, role: UserRole) => Promise<{ error: Error | null }>;
  completeEmailLinkSignIn: (email: string, emailLink: string, role: UserRole) => Promise<{ error: Error | null; isNewUser: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: UpdateProfileInput) => Promise<{ error: Error | null }>;
  resendVerificationEmail: () => Promise<{ error: Error | null }>;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
}

interface AuthState {
  user: FirebaseUser | null;
  profile: Profile | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; payload: FirebaseUser | null }
  | { type: 'SET_PROFILE'; payload: Profile | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'RESET':
      return { user: null, profile: null, loading: false };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    profile: null,
    loading: true
  });

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      dispatch({ type: 'SET_USER', payload: user });

      if (user) {
        await fetchProfile(user.uid);
      } else {
        dispatch({ type: 'SET_PROFILE', payload: null });
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    });

    return () => unsubscribe();
  }, []);

  // Real-time subscription for KYC status changes
  useEffect(() => {
    if (!state.user?.uid) return;

    const unsubscribe = FirestoreService.subscribeToQuery(
      COLLECTIONS.KYC_SUBMISSIONS,
      {
        filters: [{ field: 'user_id', operator: '==', value: state.user.uid }],
      },
      () => {
        logger.info('KYC status changed, refreshing profile');
        fetchProfile(state.user!.uid);
      }
    );

    return () => unsubscribe();
  }, [state.user?.uid]);

  // Real-time subscription for vendor status changes
  useEffect(() => {
    if (!state.user?.uid) return;

    const unsubscribe = FirestoreService.subscribeToDocument(
      COLLECTIONS.VENDORS,
      state.user.uid,
      () => {
        logger.info('Vendor status changed, refreshing profile');
        fetchProfile(state.user!.uid);
      }
    );

    return () => unsubscribe();
  }, [state.user?.uid]);

  // Real-time subscription for admin role assignment changes
  useEffect(() => {
    if (!state.user?.uid) return;

    const unsubscribe = FirestoreService.subscribeToQuery(
      COLLECTIONS.ADMIN_ROLE_ASSIGNMENTS,
      {
        filters: [{ field: 'user_id', operator: '==', value: state.user.uid }],
      },
      () => {
        logger.info('Admin role assignment changed, refreshing profile');
        fetchProfile(state.user!.uid);
      }
    );

    return () => unsubscribe();
  }, [state.user?.uid]);

  /**
   * Fetch basic profile from Firestore
   */
  const fetchBasicProfile = async (userId: string): Promise<Profile | null> => {
    logger.info(`Fetching basic profile for user: ${userId}`);

    const profileData = await FirestoreService.getDocument<Profile>(
      COLLECTIONS.PROFILES,
      userId
    );

    return profileData;
  };

  /**
   * Load admin roles and permissions
   */
  const loadAdminData = async (userId: string): Promise<{ roles: AdminRole[]; permissions: string[] }> => {
    logger.info(`Loading admin data for user: ${userId}`);

    try {
      const roleAssignments = await FirestoreService.getDocuments(
        COLLECTIONS.ADMIN_ROLE_ASSIGNMENTS,
        {
          filters: [{ field: 'user_id', operator: '==', value: userId }],
        }
      );

      const roles: AdminRole[] = [];
      const permissions: string[] = [];

      for (const assignment of roleAssignments) {
        const roleData: any = assignment;

        // Get role details
        const role = await FirestoreService.getDocument(
          COLLECTIONS.ADMIN_ROLES,
          roleData.role_id
        );

        if (role) {
          // Get permissions for this role
          const rolePermissions = await FirestoreService.getDocuments(
            'role_permissions',
            {
              filters: [{ field: 'role_id', operator: '==', value: roleData.role_id }],
            }
          );

          const permissionDetails: AdminPermission[] = [];
          for (const rp of rolePermissions) {
            const rpData: any = rp;
            const permission = await FirestoreService.getDocument<AdminPermission>(
              COLLECTIONS.ADMIN_PERMISSIONS,
              rpData.permission_id
            );
            if (permission) {
              permissionDetails.push(permission);
              permissions.push(permission.name);
            }
          }

          roles.push({
            name: (role as any).name,
            display_name: (role as any).display_name,
            permissions: permissionDetails,
          });
        }
      }

      return { roles, permissions };
    } catch (error) {
      logger.error('Error loading admin data', error);
      return { roles: [], permissions: [] };
    }
  };

  /**
   * Check if vendor needs onboarding
   * Onboarding is complete when vendor has business name AND active subscription
   * KYC verification is a separate process and doesn't block dashboard access
   */
  const checkVendorOnboarding = async (userId: string): Promise<boolean> => {
    logger.info(`Checking vendor onboarding for user: ${userId}`);

    try {
      const vendorData = await FirestoreService.getDocument(
        COLLECTIONS.VENDORS,
        userId
      );

      if (!vendorData) {
        return true; // No vendor record - needs onboarding
      }

      const vendor: any = vendorData;
      const hasBusinessName = vendor.business_name && vendor.business_name.trim() !== '';
      const hasActiveSubscription = vendor.subscription_status === 'active';

      logger.info(`Vendor onboarding check: businessName=${hasBusinessName}, activeSubscription=${hasActiveSubscription}`);

      // Onboarding is complete when vendor has business name AND active subscription
      return !hasBusinessName || !hasActiveSubscription;
    } catch (error) {
      logger.error('Error checking vendor onboarding', error);
      return true; // Assume onboarding needed if error
    }
  };

  /**
   * Fetch and process user profile data
   */
  const fetchProfile = async (userId: string): Promise<void> => {
    try {
      const profileData = await fetchBasicProfile(userId);

      if (!profileData) {
        dispatch({ type: 'SET_PROFILE', payload: null });
        return;
      }

      // Load admin-specific data if user is admin
      if (profileData.role === 'admin') {
        const { roles, permissions } = await loadAdminData(userId);
        profileData.adminRoles = roles;
        profileData.adminPermissions = permissions;
      }

      // Check vendor onboarding status
      if (profileData.role === 'vendor') {
        profileData.needsOnboarding = await checkVendorOnboarding(userId);
      } else {
        profileData.needsOnboarding = false;
      }

      dispatch({ type: 'SET_PROFILE', payload: profileData });
    } catch (error) {
      logger.error('Error fetching profile', error);
      dispatch({ type: 'SET_PROFILE', payload: null });
      throw error;
    }
  };

  /**
   * Sign up a new user
   */
  const signUp = async (input: SignUpInput) => {
    try {
      // Validate input
      const validationResult = signUpSchema.safeParse(input);
      if (!validationResult.success) {
        const error = new Error('Invalid input data');
        logger.error('SignUp validation failed', validationResult.error);
        return { error };
      }

      // Create user with Firebase Auth
      const { user, error: authError } = await FirebaseAuthService.signUp({
        email: input.email,
        password: input.password,
        fullName: input.fullName,
        role: input.role,
      });

      if (authError || !user) {
        return { error: authError };
      }

      logger.info('Signup completed successfully');
      return { error: null };
    } catch (error) {
      logger.error('Unexpected error during signup', error);
      return { error: error as Error };
    }
  };

  /**
   * Sign in a user
   */
  const signIn = async (input: SignInInput) => {
    try {
      const { error } = await FirebaseAuthService.signIn({
        email: input.email,
        password: input.password,
      });

      return { error };
    } catch (error) {
      logger.error('Unexpected error during sign in', error);
      return { error: error as Error };
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      // Clear local state first
      dispatch({ type: 'RESET' });

      // Clear any local storage
      localStorage.removeItem(STORAGE_KEYS.CART);

      // Sign out from Firebase
      const { error } = await FirebaseAuthService.signOut();
      if (error) {
        logger.error('Error signing out', error);
        // Don't throw - still navigate to login even if signOut fails
      }

      // Navigate to login page
      navigate(ROUTES.LOGIN);
    } catch (error) {
      logger.error('Unexpected error during sign out', error);
      // Still navigate to login even on error
      navigate(ROUTES.LOGIN);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates: UpdateProfileInput) => {
    if (!state.user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await FirebaseAuthService.updateUserProfile(
        state.user.uid,
        updates as any
      );

      if (error) throw error;

      await fetchProfile(state.user.uid);
      return { error: null };
    } catch (error) {
      logger.error('Error updating profile', error);
      return { error: error as Error };
    }
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useMemo(() => (permission: string): boolean => {
    if (!state.profile || state.profile.role !== 'admin') return false;
    return state.profile.adminPermissions?.includes(permission) ?? false;
  }, [state.profile]);

  /**
   * Check if user is admin
   */
  const isAdmin = useMemo(() => (): boolean => {
    return state.profile?.role === 'admin';
  }, [state.profile]);

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async (role: UserRole) => {
    try {
      const { user, error, isNewUser } = await FirebaseAuthService.signInWithGoogle(role);

      if (error || !user) {
        return { error, isNewUser: false };
      }

      // Profile will be loaded by onAuthStateChanged
      return { error: null, isNewUser };
    } catch (error) {
      logger.error('Unexpected error during Google sign-in', error);
      return { error: error as Error, isNewUser: false };
    }
  };

  /**
   * Resend email verification
   */
  const resendVerificationEmail = async () => {
    return await FirebaseAuthService.resendVerificationEmail();
  };

  /**
   * Send passwordless sign-in link
   */
  const sendSignInLink = async (email: string, role: UserRole) => {
    return await FirebaseAuthService.sendSignInLink(email, role);
  };

  /**
   * Complete sign-in with email link
   */
  const completeEmailLinkSignIn = async (email: string, emailLink: string, role: UserRole) => {
    try {
      const { user, error, isNewUser } = await FirebaseAuthService.completeSignInWithEmailLink(email, emailLink, role);

      if (error || !user) {
        return { error, isNewUser: false };
      }

      // Profile will be loaded by onAuthStateChanged
      return { error: null, isNewUser };
    } catch (error) {
      logger.error('Unexpected error during email link sign-in', error);
      return { error: error as Error, isNewUser: false };
    }
  };

  const value: AuthContextType = {
    user: state.user,
    profile: state.profile,
    loading: state.loading,
    emailVerified: state.user?.emailVerified ?? false,
    signUp,
    signIn,
    signInWithGoogle,
    sendSignInLink,
    completeEmailLinkSignIn,
    signOut,
    updateProfile,
    resendVerificationEmail,
    hasPermission,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
