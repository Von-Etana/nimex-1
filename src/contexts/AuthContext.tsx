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
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: AuthError | null }>;
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const profileData: Profile = data as Profile;

        // Load admin-specific data if user is admin
        if (profileData.role === 'admin') {
          const { data: permissionsData } = await supabase.rpc('get_user_permissions', {
            user_id: userId,
          });

          if (permissionsData) {
            profileData.adminPermissions = permissionsData.map((p: PermissionData) => p.permission_name);
          }

          const { data: rolesData } = await supabase
            .from('admin_role_assignments')
            .select(`
              admin_roles (
                name,
                display_name
              )
            `)
            .eq('user_id', userId);

          if (rolesData) {
            profileData.adminRoles = rolesData.map((r: RoleData) => ({
              name: r.admin_roles.name,
              display_name: r.admin_roles.display_name,
              permissions: [],
            }));
          }
        }

        // Check vendor onboarding status
        if (profileData.role === 'vendor') {
          const { data: vendorData } = await supabase
            .from('vendors')
            .select('business_name, subscription_plan, subscription_status')
            .eq('user_id', userId)
            .single();

          // Vendor needs onboarding if business name is empty or just whitespace
          profileData.needsOnboarding = Boolean(vendorData && (!vendorData.business_name || vendorData.business_name.trim() === ''));
        } else {
          profileData.needsOnboarding = false;
        }

        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Don't return error here as auth was successful
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
            });

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
      const { error } = await supabase
        .from('profiles')
        .update(updates)
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
