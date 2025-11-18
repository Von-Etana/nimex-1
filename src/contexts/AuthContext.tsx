import React, { createContext, useContext, useEffect, useReducer, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { signUpSchema, signInSchema, updateProfileSchema, type SignUpInput, type SignInInput, type UpdateProfileInput } from '../lib/validation';
import { TABLES, COLUMNS, ROUTES, STORAGE_KEYS } from '../services/constants';
import type { UserRole, Database } from '../types/database';
import type { User, Session, AuthError } from '@supabase/supabase-js';

type AdminPermission = Database['public']['Tables']['admin_permissions']['Row'];

interface AdminRole {
  name: string;
  display_name: string;
  permissions: AdminPermission[];
}

type AdminRoleAssignmentWithRole = {
  role_id: string;
  admin_roles: Database['public']['Tables']['admin_roles']['Row'];
  role_permissions: Array<{
    admin_permissions: AdminPermission;
  }>;
};

type VendorOnboardingCheck = Pick<
  Database['public']['Tables']['vendors']['Row'],
  'business_name' | 'subscription_plan' | 'subscription_status'
>;

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
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (input: SignUpInput) => Promise<{ error: AuthError | Error | null }>;
  signIn: (input: SignInInput) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: UpdateProfileInput) => Promise<{ error: Error | null }>;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SESSION'; payload: Session | null }
  | { type: 'SET_PROFILE'; payload: Profile | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'RESET':
      return { user: null, session: null, profile: null, loading: false };
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
    session: null,
    profile: null,
    loading: true
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch({ type: 'SET_SESSION', payload: session });
      dispatch({ type: 'SET_USER', payload: session?.user ?? null });
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        dispatch({ type: 'SET_PROFILE', payload: null });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      dispatch({ type: 'SET_SESSION', payload: session });
      dispatch({ type: 'SET_USER', payload: session?.user ?? null });

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        dispatch({ type: 'SET_PROFILE', payload: null });
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchBasicProfile = async (userId: string): Promise<Profile | null> => {
    logger.info(`Fetching basic profile for user: ${userId}`);
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq(COLUMNS.PROFILES.ID, userId)
      .maybeSingle();

    if (error) {
      logger.error('Database error fetching profile', error);
      throw error;
    }

    return data as Profile | null;
  };

  const loadAdminData = async (userId: string): Promise<{ roles: AdminRole[]; permissions: string[] }> => {
    logger.info(`Loading admin data for user: ${userId}`);

    const { data: roleAssignments, error: roleError } = await supabase
      .from(TABLES.ADMIN_ROLE_ASSIGNMENTS)
      .select(`
        ${COLUMNS.ADMIN_ROLE_ASSIGNMENTS.ROLE_ID},
        ${TABLES.ADMIN_ROLES}!inner (
          id,
          name,
          display_name
        ),
        ${TABLES.ROLE_PERMISSIONS}!inner (
          ${TABLES.ADMIN_PERMISSIONS}!inner (
            name,
            category,
            description
          )
        )
      `)
      .eq(COLUMNS.ADMIN_ROLE_ASSIGNMENTS.USER_ID, userId);

    if (roleError) {
      logger.error('Error fetching admin role assignments', roleError);
      return { roles: [], permissions: [] };
    }

    if (!roleAssignments) {
      return { roles: [], permissions: [] };
    }

    const roles: AdminRole[] = [];
    const permissions: string[] = [];

    (roleAssignments as AdminRoleAssignmentWithRole[]).forEach(ra => {
      if (ra.admin_roles) {
        roles.push({
          name: ra.admin_roles.name,
          display_name: ra.admin_roles.display_name,
          permissions: ra.role_permissions?.map(rp => rp.admin_permissions).filter(Boolean) || []
        });
      }

      ra.role_permissions?.forEach(rp => {
        if (rp.admin_permissions?.name) {
          permissions.push(rp.admin_permissions.name);
        }
      });
    });

    return { roles, permissions };
  };

  const checkVendorOnboarding = async (userId: string): Promise<boolean> => {
    logger.info(`Checking vendor onboarding for user: ${userId}`);

    const { data: vendorData, error: vendorError } = await supabase
      .from(TABLES.VENDORS)
      .select(`${COLUMNS.VENDORS.BUSINESS_NAME}, ${COLUMNS.VENDORS.SUBSCRIPTION_PLAN}, ${COLUMNS.VENDORS.SUBSCRIPTION_STATUS}`)
      .eq(COLUMNS.VENDORS.USER_ID, userId)
      .maybeSingle();

    if (vendorError) {
      logger.error('Error fetching vendor data', vendorError);
      return true; // Assume onboarding needed if error
    }

    if (!vendorData) {
      return true; // No vendor record
    }

    const businessName = (vendorData as VendorOnboardingCheck).business_name || '';
    return !businessName || businessName.trim() === '';
  };

  /**
   * Fetches and processes user profile data including admin permissions and vendor onboarding status
   * @param userId - The unique identifier of the user
   * @returns Promise that resolves when profile data is fetched and processed
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

  const createAuthUser = async (input: SignUpInput) => {
    logger.info(`Creating auth user for: ${input.email}`);

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          role: input.role,
        },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      logger.error('Auth signup error', error);
      return { data: null, error };
    }

    if (!data.user) {
      const noUserError = new Error('No user data returned from signup');
      logger.error('No user data returned from signup');
      return { data: null, error: noUserError as AuthError };
    }

    return { data, error: null };
  };

  const createProfileRecord = async (userId: string, input: SignUpInput) => {
    logger.info(`Creating profile record for user: ${userId}`);

    const { error } = await (supabase
      .from(TABLES.PROFILES) as any)
      .insert({
        id: userId,
        email: input.email,
        full_name: input.fullName,
        role: input.role,
      });

    if (error) {
      logger.error('Error creating profile', error);
      return { error: new Error(`Failed to create profile: ${error.message}`) as AuthError };
    }

    return { error: null };
  };

  const createVendorRecord = async (userId: string) => {
    logger.info(`Creating vendor record for user: ${userId}`);

    const { error } = await (supabase
      .from(TABLES.VENDORS) as any)
      .insert({
        user_id: userId,
        business_name: '',
        subscription_plan: 'free',
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        verification_badge: 'none',
        verification_status: 'pending',
        is_active: true,
      });

    if (error) {
      logger.error('Error creating vendor record', error);
      return { error: new Error(`Failed to create vendor record: ${error.message}`) as AuthError };
    }

    return { error: null };
  };

  /**
   * Signs up a new user with the specified role and creates associated profile/vendor records
   */
  const signUp = async (input: SignUpInput) => {
    try {
      // Validate input
      const validationResult = signUpSchema.safeParse(input);
      if (!validationResult.success) {
        const error = new Error('Invalid input data');
        logger.error('SignUp validation failed', validationResult.error);
        return { error: error as AuthError };
      }

      // Create auth user
      const { data, error: authError } = await createAuthUser(input);
      if (authError || !data?.user) {
        return { error: authError };
      }

      // Create profile record
      const profileError = await createProfileRecord(data.user.id, input);
      if (profileError.error) {
        return profileError;
      }

      // If vendor, create initial vendor record
      if (input.role === 'vendor') {
        const vendorError = await createVendorRecord(data.user.id);
        if (vendorError.error) {
          return vendorError;
        }
      }

      logger.info('Signup completed successfully');
      return { error: null };
    } catch (error) {
      logger.error('Unexpected error during signup', error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (input: SignInInput) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      return { error };
    } catch (error) {
      logger.error('Unexpected error during sign in', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      // Clear local state first
      dispatch({ type: 'RESET' });

      // Clear any local storage
      localStorage.removeItem(STORAGE_KEYS.CART);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
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

  const updateProfile = async (updates: UpdateProfileInput) => {
    if (!state.user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await (supabase
        .from(TABLES.PROFILES) as any)
        .update(updates)
        .eq(COLUMNS.PROFILES.ID, state.user.id);

      if (error) throw error;

      await fetchProfile(state.user.id);
      return { error: null };
    } catch (error) {
      logger.error('Error updating profile', error);
      return { error: error as Error };
    }
  };

  const hasPermission = useMemo(() => (permission: string): boolean => {
    if (!state.profile || state.profile.role !== 'admin') return false;
    return state.profile.adminPermissions?.includes(permission) ?? false;
  }, [state.profile]);

  const isAdmin = useMemo(() => (): boolean => {
    return state.profile?.role === 'admin';
  }, [state.profile]);

  const value: AuthContextType = {
    user: state.user,
    session: state.session,
    profile: state.profile,
    loading: state.loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    hasPermission,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
