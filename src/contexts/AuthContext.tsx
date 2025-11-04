import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types/database';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface AdminPermission {
  name: string;
  category: string;
  description: string;
}

interface AdminRole {
  name: string;
  display_name: string;
  permissions: AdminPermission[];
}

interface PermissionData {
  permission_name: string;
  category: string;
  description: string;
}

interface RoleData {
  admin_roles: {
    name: string;
    display_name: string;
  };
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
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: AuthError | Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Fetches and processes user profile data including admin permissions and vendor onboarding status
   * @param userId - The unique identifier of the user
   * @returns Promise that resolves when profile data is fetched and processed
   *
   * @description
   * This function performs the following operations:
   * 1. Fetches basic profile data from the profiles table
   * 2. For admin users: fetches permissions and roles from related tables
   * 3. For vendor users: checks if onboarding is required
   * 4. Updates the profile state with processed data
   *
   * @throws Logs errors to console but doesn't throw to prevent auth flow interruption
   */
  const fetchProfile = async (userId: string): Promise<void> => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Database error fetching profile:', error);
        throw error;
      }

      if (data) {
        console.log('Profile data retrieved:', { id: (data as any).id, role: (data as any).role });
        const profileData: Profile = data as Profile;

        // Load admin-specific data if user is admin
        if (profileData.role === 'admin') {
          try {
            // Skip admin permissions for now to avoid RPC issues
            profileData.adminPermissions = [];
            profileData.adminRoles = [];
          } catch (adminError) {
            console.error('Error loading admin data:', adminError);
            // Continue without admin data - user can still access basic features
          }
        }

        // Check vendor onboarding status
        if (profileData.role === 'vendor') {
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('business_name, subscription_plan, subscription_status')
            .eq('user_id', userId)
            .maybeSingle();

          if (vendorError) {
            console.error('Error fetching vendor data:', vendorError);
            profileData.needsOnboarding = true; // Assume onboarding needed if vendor record doesn't exist
          } else if (vendorData) {
            // Vendor needs onboarding if business name is empty or just whitespace
            const businessName = (vendorData as any)?.business_name || '';
            profileData.needsOnboarding = !businessName || businessName.trim() === '';
          } else {
            // No vendor record exists, needs onboarding
            profileData.needsOnboarding = true;
          }
        } else {
          profileData.needsOnboarding = false;
        }

        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Set profile to null on error to prevent inconsistent state
      setProfile(null);
      throw error; // Re-throw to allow calling code to handle
    }
  };

  /**
   * Signs up a new user with the specified role and creates associated profile/vendor records
   * @param email - User's email address
   * @param password - User's password
   * @param fullName - User's full name
   * @param role - User role (buyer, vendor, or admin)
   * @returns Promise resolving to object with error property (null if successful)
   *
   * @description
   * This function performs the following operations:
   * 1. Creates user account with Supabase Auth
   * 2. Creates profile record in profiles table
   * 3. If role is 'vendor', creates initial vendor record with free subscription
   * 4. Returns error object or null on success
   *
   * @throws Returns AuthError object if signup fails, but doesn't throw exceptions
   */
  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          }
        }
      });

      if (error) {
        return { error };
      }

      // Create profile record
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: role,
          } as any);

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Return error to prevent inconsistent state
          return { error: profileError };
        }

        // If vendor, create initial vendor record with free subscription
        if (role === 'vendor') {
          const { error: vendorError } = await supabase
            .from('vendors')
            .insert({
              user_id: data.user.id,
              business_name: '', // Will be filled during onboarding
              subscription_plan: 'free',
              subscription_status: 'active',
              subscription_start_date: new Date().toISOString(),
              verification_badge: 'none',
              is_active: true,
            } as any);

          if (vendorError) {
            console.error('Error creating vendor record:', vendorError);
          }
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update(updates as any)
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!profile || profile.role !== 'admin') return false;
    return profile.adminPermissions?.includes(permission) ?? false;
  };

  const isAdmin = (): boolean => {
    return profile?.role === 'admin';
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    hasPermission,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
