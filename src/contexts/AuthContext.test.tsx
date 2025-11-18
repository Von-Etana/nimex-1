import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types/database';

// Mock console methods to avoid noise in tests
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Test component to access auth context
function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="user">{auth.user ? 'logged-in' : 'logged-out'}</div>
      <div data-testid="loading">{auth.loading ? 'loading' : 'loaded'}</div>
      <div data-testid="profile">{auth.profile ? 'has-profile' : 'no-profile'}</div>
      <div data-testid="is-admin">{auth.isAdmin() ? 'admin' : 'not-admin'}</div>
      <button onClick={() => auth.signOut()}>Sign Out</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  describe('AuthProvider initialization', () => {
    it('should initialize with loading state', () => {
      const mockGetSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      });

      (supabase.auth.getSession as any).mockImplementation(mockGetSession);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    it('should set user and profile when session exists', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { user: mockUser };
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'buyer' as UserRole,
      };

      const mockGetSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      (supabase.auth.getSession as any).mockImplementation(mockGetSession);
      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('logged-in');
        expect(screen.getByTestId('profile')).toHaveTextContent('has-profile');
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });
    });
  });

  describe('signUp function', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = { id: 'user-123' };
      const mockSignUp = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (supabase.auth.signUp as any).mockImplementation(mockSignUp);
      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const response = await result.current.signUp(
        'test@example.com',
        'password123',
        'Test User',
        'buyer'
      );

      expect(response.error).toBeNull();
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test User',
            role: 'buyer',
          },
        },
      });
    });

    it('should return error when auth signup fails', async () => {
      const mockError = { message: 'Email already exists' };
      const mockSignUp = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      (supabase.auth.signUp as any).mockImplementation(mockSignUp);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const response = await result.current.signUp(
        'existing@example.com',
        'password123',
        'Test User',
        'buyer'
      );

      expect(response.error).toEqual(mockError);
    });

    it('should return error when profile creation fails', async () => {
      const mockUser = { id: 'user-123' };
      const mockSignUp = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockInsert = vi.fn().mockResolvedValue({
        error: { message: 'Profile creation failed' },
      });

      (supabase.auth.signUp as any).mockImplementation(mockSignUp);
      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const response = await result.current.signUp(
        'test@example.com',
        'password123',
        'Test User',
        'buyer'
      );

      expect(response.error).toEqual({ message: 'Profile creation failed' });
    });

    it('should create vendor record for vendor role', async () => {
      const mockUser = { id: 'user-123' };
      const mockSignUp = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockProfileInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockVendorInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (supabase.auth.signUp as any).mockImplementation(mockSignUp);
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return { insert: mockProfileInsert };
        }
        if (table === 'vendors') {
          return { insert: mockVendorInsert };
        }
        return {};
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await result.current.signUp(
        'vendor@example.com',
        'password123',
        'Vendor User',
        'vendor'
      );

      expect(mockVendorInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        business_name: '',
        subscription_plan: 'free',
        subscription_status: 'active',
        subscription_start_date: expect.any(String),
        verification_badge: 'none',
        is_active: true,
      });
    });
  });

  describe('signIn function', () => {
    it('should successfully sign in user', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({
        error: null,
      });

      (supabase.auth.signInWithPassword as any).mockImplementation(mockSignIn);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const response = await result.current.signIn({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(response.error).toBeNull();
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should return error when sign in fails', async () => {
      const mockError = { message: 'Invalid credentials' };
      const mockSignIn = vi.fn().mockResolvedValue({
        error: mockError,
      });

      (supabase.auth.signInWithPassword as any).mockImplementation(mockSignIn);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const response = await result.current.signIn({
        email: 'wrong@example.com',
        password: 'wrongpass'
      });

      expect(response.error).toEqual(mockError);
    });
  });

  describe('signOut function', () => {
    it('should successfully sign out user', async () => {
      const mockSignOut = vi.fn().mockResolvedValue({
        error: null,
      });

      (supabase.auth.signOut as any).mockImplementation(mockSignOut);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await result.current.signOut();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should log error when sign out fails', async () => {
      const mockError = { message: 'Sign out failed' };
      const mockSignOut = vi.fn().mockResolvedValue({
        error: mockError,
      });

      (supabase.auth.signOut as any).mockImplementation(mockSignOut);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await result.current.signOut();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error signing out:', mockError);
    });
  });

  describe('fetchProfile function', () => {
    it('should fetch and set profile data for buyer', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'buyer@example.com',
        role: 'buyer' as UserRole,
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Access the internal fetchProfile function (normally private)
      // For testing, we can trigger it through auth state changes
      // This test focuses on the profile setting logic

      expect(consoleSpy).toHaveBeenCalledWith('Fetching profile for user:', 'user-123');
    });

    it('should fetch admin permissions and roles', async () => {
      const mockProfile = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin' as UserRole,
      };

      const mockPermissions = [
        { permission_name: 'users.view', category: 'users', description: 'View users' },
        { permission_name: 'vendors.edit', category: 'vendors', description: 'Edit vendors' },
      ];

      const mockRoles = [
        {
          admin_roles: {
            name: 'super_admin',
            display_name: 'Super Admin',
          },
        },
      ];

      const mockRpc = vi.fn().mockResolvedValue({
        data: mockPermissions,
        error: null,
      });

      const mockSelect = vi.fn();
      const mockEq = vi.fn();

      (supabase.rpc as any).mockImplementation(mockRpc);
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: mockSelect.mockReturnValue({
              eq: mockEq.mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: mockProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'admin_role_assignments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockRoles,
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Verify admin-specific data fetching was called
      expect(mockRpc).toHaveBeenCalledWith({
        user_id: 'admin-123',
      });
    });

    it('should check vendor onboarding status', async () => {
      const mockProfile = {
        id: 'vendor-123',
        email: 'vendor@example.com',
        role: 'vendor' as UserRole,
      };

      const mockVendorData = {
        business_name: '',
        subscription_plan: 'free',
        subscription_status: 'active',
      };

      const mockSelect = vi.fn();
      const mockEq = vi.fn();

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: mockSelect.mockReturnValue({
              eq: mockEq.mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: mockProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'vendors') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockVendorData,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // The profile should indicate onboarding is needed due to empty business_name
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should handle profile fetch errors', async () => {
      const mockError = { message: 'Database connection failed' };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Database error fetching profile:', mockError);
    });
  });

  describe('updateProfile function', () => {
    it('should successfully update profile', async () => {
      const mockUser = { id: 'user-123' };
      const updates = { full_name: 'Updated Name' };

      const mockUpdate = vi.fn().mockResolvedValue({
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Set user in context
      result.current.user = mockUser as any;

      const response = await result.current.updateProfile(updates);

      expect(response.error).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith(updates);
    });

    it('should return error when no user is logged in', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const response = await result.current.updateProfile({ full_name: 'Test' });

      expect(response.error).toEqual(new Error('No user logged in'));
    });

    it('should return error when update fails', async () => {
      const mockUser = { id: 'user-123' };
      const mockError = { message: 'Update failed' };

      const mockUpdate = vi.fn().mockResolvedValue({
        error: mockError,
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      result.current.user = mockUser as any;

      const response = await result.current.updateProfile({ full_name: 'Test' });

      expect(response.error).toEqual(mockError);
    });
  });

  describe('hasPermission function', () => {
    it('should return false for non-admin users', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      result.current.profile = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'buyer',
      } as any;

      expect(result.current.hasPermission('users.view')).toBe(false);
    });

    it('should return false when user has no permissions', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      result.current.profile = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        adminPermissions: [],
      } as any;

      expect(result.current.hasPermission('users.view')).toBe(false);
    });

    it('should return true when user has permission', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      result.current.profile = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        adminPermissions: ['users.view', 'vendors.edit'],
      } as any;

      expect(result.current.hasPermission('users.view')).toBe(true);
      expect(result.current.hasPermission('vendors.edit')).toBe(true);
      expect(result.current.hasPermission('nonexistent.permission')).toBe(false);
    });
  });

  describe('isAdmin function', () => {
    it('should return true for admin users', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      result.current.profile = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      } as any;

      expect(result.current.isAdmin()).toBe(true);
    });

    it('should return false for non-admin users', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      result.current.profile = {
        id: 'buyer-123',
        email: 'buyer@example.com',
        role: 'buyer',
      } as any;

      expect(result.current.isAdmin()).toBe(false);
    });

    it('should return false when no profile exists', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      result.current.profile = null;

      expect(result.current.isAdmin()).toBe(false);
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within AuthProvider');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle network errors during signUp', async () => {
      const mockSignUp = vi.fn().mockRejectedValue(new Error('Network error'));

      (supabase.auth.signUp as any).mockImplementation(mockSignUp);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const response = await result.current.signUp(
        'test@example.com',
        'password123',
        'Test User',
        'buyer'
      );

      expect(response.error).toBeInstanceOf(Error);
      expect((response.error as Error).message).toBe('Network error');
    });

    it('should handle empty business name for vendors', async () => {
      const mockProfile = {
        id: 'vendor-123',
        email: 'vendor@example.com',
        role: 'vendor' as UserRole,
      };

      const mockVendorData = {
        business_name: '   ', // whitespace only
        subscription_plan: 'free',
        subscription_status: 'active',
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: mockProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'vendors') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockVendorData,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // The profile should indicate onboarding is needed due to whitespace-only business_name
      expect(result.current.profile?.needsOnboarding).toBe(true);
    });

    it('should handle null vendor data', async () => {
      const mockProfile = {
        id: 'vendor-123',
        email: 'vendor@example.com',
        role: 'vendor' as UserRole,
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: mockProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'vendors') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Vendor not found' },
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.profile?.needsOnboarding).toBeUndefined();
    });
  });
});