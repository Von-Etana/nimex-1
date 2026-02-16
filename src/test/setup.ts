import '@testing-library/jest-dom';

// Mock Supabase
import { vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          single: vi.fn(),
        })),
        insert: vi.fn(),
        update: vi.fn(),
      })),
      insert: vi.fn(),
      update: vi.fn(),
      rpc: vi.fn(),
    })),
    rpc: vi.fn(),
  },
}));